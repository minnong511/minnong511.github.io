import { actualPods, endpoints, executeCommand, images, initialSimulation, readyPods, rolloutComplete, tick } from './simulator'
import type { Simulation } from './simulator'

export interface Mission {
  title: string
  goal: string
  target: string
  explanation: string
  flow: string
}
export const missions: Mission[] = [
  { title: 'Pod 살펴보기', goal: '현재 Pod 목록과 Ready 상태를 확인하자.', target: 'Pod 목록 관찰 완료', explanation: '조회는 API Server에 기록된 현재 상태를 읽는다. Pod를 새로 만들지는 않는다.', flow: 'kubectl → API Server → Pod 상태 조회' },
  { title: 'Pod 삭제와 자동 복구', goal: 'Pod 하나를 지우고, 새 이름의 Pod가 Ready가 될 때까지 관찰하자.', target: 'Desired 3 · Ready 3 · 새 Pod로 교체', explanation: '삭제된 Pod가 살아난 것이 아니다. ReplicaSet Controller가 부족한 개수를 감지해 새 Pod 객체를 만들고, Scheduler와 kubelet이 실행을 이어갔다.', flow: 'kubectl → API Server → ReplicaSet Controller → Scheduler → kubelet → containerd → Ready → EndpointSlice Controller' },
  { title: '3개에서 5개로 확장', goal: 'demo-api를 3개에서 5개로 확장하고 모두 Ready가 되는지 확인하자.', target: 'Desired 5 · Ready 5', explanation: 'scale은 Deployment의 원하는 개수를 바꾼다. Deployment Controller가 ReplicaSet 목표를 바꾸고, 실제 Pod 생성과 실행은 다음 컴포넌트들이 맡는다.', flow: 'kubectl → API Server → Deployment Controller → ReplicaSet Controller → Scheduler → kubelet → containerd' },
  { title: '이미지 v2 배포', goal: 'demo-api:v2를 배포하고 모든 Pod가 새 버전으로 교체되는지 보자.', target: 'Image demo-api:v2 · Ready 5 · 이전 RS 0', explanation: '새 Pod template에 대응하는 ReplicaSet을 키웠다. 새 Pod가 Ready가 된 뒤 이전 Pod를 줄여, 마지막에는 이전 ReplicaSet의 목표가 0이 된다.', flow: 'Deployment Controller → 새 ReplicaSet → 새 Pod Ready → 이전 ReplicaSet 축소' },
  { title: 'ImagePullBackOff 진단', goal: '이미지 배포가 멈췄다. 실패한 Pod의 Events를 보고 원인을 선택하자.', target: '실패 Pod 상세 관찰 + 이미지 오류 진단', explanation: '모의 레지스트리에 없는 이미지라 containerd가 가져오지 못했다. 컨테이너가 시작되지 않아 Ready가 될 수 없으며, 기존 Ready Pod가 계속 연결 대상으로 남는다.', flow: 'kubelet → containerd → 이미지 가져오기 실패 → ImagePullBackOff' },
  { title: 'Readiness 실패 진단', goal: 'Running 0/1 Pod의 Events와 Endpoints를 확인하고 원인을 선택하자.', target: '실패 Pod 상세 + Endpoints 조회 + Readiness 진단', explanation: '프로세스는 실행 중이지만 /ready가 503을 반환했다. kubelet은 Ready=False를 보고하며 연결 대상에서 빠진다. Readiness 실패 자체는 컨테이너 재시작을 지시하지 않는다.', flow: 'containerd 실행 → kubelet readiness 실패 → Ready=False → 연결 대상 제외' },
  { title: 'Service Endpoints 확인', goal: 'Service와 Endpoints를 조회해, Ready Pod만 연결되는지 확인하자.', target: 'Service 조회 + Endpoints 조회 · Ready 3 / Pod 4', explanation: 'Service는 app=demo-api 라벨로 대상을 찾는다. Ready인 3개만 연결되므로 Running 0/1인 Pod까지 포함한 전체 Pod 수와 Endpoints 수가 다를 수 있다.', flow: 'Service selector → Pod label + Ready 조건 → EndpointSlice → Service 라우팅 규칙' },
  { title: '실패한 배포 되돌리기', goal: '실패한 v2 배포를 이전 정상 이미지 demo-api:v1으로 복구하자.', target: 'Image demo-api:v1 · Ready 3 · 실패 Pod 0', explanation: '이전 Pod template과 대응하는 ReplicaSet으로 복귀했다. 롤백은 Pod template을 되돌리는 작업으로, 복제본 목표나 DB 데이터까지 과거로 돌리지 않는다.', flow: 'kubectl → API Server → 이전 Pod template → ReplicaSet 재조정 → Ready → Endpoints 갱신' },
]

export function startMission(index: number): Simulation {
  const s = initialSimulation(index === 3 ? 5 : 3)
  if (index >= 4) {
    executeCommand(s, `kubectl set image deployment/demo-api app=${index === 5 || index === 6 ? images.unready : 'demo-api:v2-missing'}`)
    // Set up the exercise synchronously, using exactly the same state transitions.
    for (let step = 0; step < 150; step++) if (!tick(s)) break
  }
  s.focus = 'deployments'
  s.selectedPod = null
  s.event = index >= 4 ? '실습 장애 상황이 준비됐습니다. 기존 Ready Pod와 새 Pod의 차이를 확인하세요.' : '실습 시작. 원하는 상태와 실제 상태를 비교하세요.'
  s.eventId = 0
  return s
}
export function missionComplete(index: number, s: Simulation, diagnosis = '') {
  switch (index) {
    case 0: return Boolean(s.observations.pods)
    case 1: return s.deleted.length > 0 && s.deleted.every(name => !s.pods.some(p => p.name === name)) && s.serial > 3 && s.desiredReplicas === 3 && rolloutComplete(s)
    case 2: return s.desiredReplicas === 5 && readyPods(s).length === 5 && rolloutComplete(s)
    case 3: return s.image === images.v2 && s.desiredReplicas === 5 && rolloutComplete(s)
    case 4: return Boolean(s.diagnoses.ImagePullBackOff) && diagnosis === 'image'
    case 5: return Boolean(s.diagnoses.ReadinessFailed && s.observations.endpoints) && diagnosis === 'readiness'
    case 6: return Boolean(s.observations.svc && s.observations.endpoints) && endpoints(s).length === 3 && readyPods(s).length === 3 && actualPods(s).length === 4
    case 7: return s.image === images.v1 && s.desiredReplicas === 3 && rolloutComplete(s)
    default: return false
  }
}
export function missionHint(index: number, s: Simulation): { key: string, levels: string[], command?: string } {
  const hint = (key: string, one: string, two: string, command: string) => ({ key, levels: [one, two, command], command })
  const inspect = hint('inspect', '먼저 어떤 Pod가 있는지 살펴보자.', 'kubectl get으로 리소스 목록을 조회할 수 있다.', 'kubectl get pods')
  if (index === 0) return inspect
  if (index === 1) {
    if (s.deleted.length) return { key: 'recover', levels: ['이름이 같은 Pod가 돌아오는지, 새 Pod가 생기는지 보자.', 'Desired와 Actual의 차이를 ReplicaSet Controller가 어떻게 처리하는지 관찰하자.', '자동 재생을 켜거나 「한 단계」를 눌러 새 Pod가 Ready가 될 때까지 진행하자.'] }
    if (!s.observations.pods) return inspect
    return hint('delete', '이제 Pod 하나를 삭제해 보자.', 'kubectl delete 뒤에 리소스 종류와 실제 이름을 적는다.', `kubectl delete pod ${readyPods(s)[1]?.name || s.pods[0]?.name || 'demo-api-a'}`)
  }
  if (index === 2) {
    if (s.desiredReplicas === 5) return hint('wait-scale', '목표는 5개가 됐다. 실제 Ready 수도 따라오는지 보자.', 'Deployment 조회 결과의 READY 열을 확인할 수 있다.', 'kubectl get deployments')
    return hint('scale', 'Pod를 직접 추가하기보다 원하는 개수를 바꿔 보자.', 'kubectl scale deployment에 --replicas 옵션을 준다.', 'kubectl scale deployment demo-api --replicas=5')
  }
  if (index === 3) {
    if (s.image === images.v2) return hint('rollout', '이미지 변경 요청 이후의 배포 상태를 확인하자.', 'kubectl rollout status로 완료 여부를 살펴볼 수 있다.', 'kubectl rollout status deployment/demo-api')
    return hint('image', '실행 중인 컨테이너 대신 Deployment의 Pod template을 바꾸자.', 'kubectl set image로 app 컨테이너의 이미지를 지정할 수 있다.', 'kubectl set image deployment/demo-api app=demo-api:v2')
  }
  if (index === 4 || index === 5) {
    const reason = index === 4 ? 'ImagePullBackOff' : 'ReadinessFailed'
    if (!s.observations.pods) return inspect
    if (!s.diagnoses[reason]) {
      const pod = s.pods.find(p => p.status === reason)
      return hint('describe', '목록에서 이상한 Pod를 찾았다면 그 Pod의 Events를 읽자.', 'kubectl describe pod 뒤에 실패한 Pod의 이름을 적는다.', `kubectl describe pod ${pod?.name || s.pods[0]?.name || 'demo-api-a'}`)
    }
    if (index === 5 && !s.observations.endpoints) return hint('endpoints', '프로세스는 실행 중이다. 이 Pod도 트래픽을 받을까?', 'kubectl get endpoints로 Ready인 연결 대상을 비교하자.', 'kubectl get endpoints')
    return { key: 'diagnose', levels: ['방금 읽은 Events를 근거로 아래에서 원인을 선택하자.', index === 4 ? 'Failed to pull은 이미지를 받는 단계의 오류다.' : 'HTTP 503 /ready는 요청을 받을 준비가 안 됐다는 신호다.', index === 4 ? '「이미지를 가져오지 못함」을 선택하자.' : '「Readiness 검사 실패」를 선택하자.'] }
  }
  if (index === 6) return !s.observations.svc
    ? hint('service', '먼저 Pod들을 연결하는 고정 주소와 selector를 확인하자.', 'kubectl get은 Service도 조회한다. 축약형은 svc다.', 'kubectl get svc')
    : hint('endpoints', '이제 실제로 연결되는 Pod 주소를 확인하자.', 'Service의 연결 대상은 endpoints 조회로 볼 수 있다.', 'kubectl get endpoints')
  if (s.image === images.v1) return hint('rollback-status', '복구 요청 후 정상 버전이 Ready가 되는지 확인하자.', 'kubectl rollout status로 복구 완료를 확인한다.', 'kubectl rollout status deployment/demo-api')
  return hint('undo', '새 이미지가 실패했다. 이전 정상 Pod template으로 돌아가자.', 'kubectl rollout undo로 직전 배포를 되돌릴 수 있다.', 'kubectl rollout undo deployment/demo-api')
}
