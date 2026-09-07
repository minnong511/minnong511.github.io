export type ManagedMode = 'self' | 'eks'
export type ManagedScenario = 'deploy' | 'control' | 'app' | 'update'
export type ManagedFocus = 'team' | 'control' | 'nodes' | 'pods'
export interface ManagedStep {
  title: string
  actor: string
  input: string
  decision: string
  output: string
  focus: ManagedFocus
  pods: string[]
  control: string
  nodes: string
  endpoints: number
}

export const managedScenarios: { id: ManagedScenario, title: string }[] = [
  { id: 'deploy', title: '앱 3개 배포' },
  { id: 'control', title: 'API 서버 인스턴스 장애' },
  { id: 'app', title: 'Pod B 앱 오류' },
  { id: 'update', title: '노드 업데이트' },
]

export function managedResponsibilities(mode: ManagedMode) {
  return {
    control: mode === 'eks'
      ? { owner: 'AWS 운영', text: 'API Server, etcd의 가용성·인프라 복구', note: '클러스터 버전 선택과 앱 호환성 확인은 우리 팀' }
      : { owner: '우리 팀 운영', text: 'Control Plane 설치·가용성·인프라 복구', note: '복제, 백업과 업그레이드도 직접 구성' },
    nodes: mode === 'eks'
      ? { owner: 'AWS + 우리 팀', text: 'AWS: 노드 생성·교체 절차 / 우리 팀: 크기·업데이트 실행', note: 'EKS 최적화 AMI 기준, 패치 버전 적용은 우리 팀 책임' }
      : { owner: '우리 팀 운영', text: '노드 생성·등록·OS 패치·교체', note: '노드 용량과 배포 영향도 직접 확인' },
    app: { owner: '우리 팀 운영', text: '이미지, replicas, Readiness와 앱 오류 수정', note: 'IAM·RBAC 권한, 네트워크 정책과 데이터 관리도 우리 팀' },
  }
}

export function managedSteps(mode: ManagedMode, scenario: ManagedScenario): ManagedStep[] {
  const isEks = mode === 'eks'
  const controlOwner = isEks ? 'AWS · EKS' : '우리 팀 · 플랫폼 운영'
  const nodeOwner = isEks ? 'AWS · 관리형 노드 그룹' : '우리 팀 · 노드 운영'
  const step = (value: Pick<ManagedStep, 'title' | 'actor' | 'input' | 'decision' | 'output' | 'focus'> & Partial<ManagedStep>): ManagedStep => ({
    pods: ['Ready', 'Ready', 'Ready'], control: '정상', nodes: '기존 노드 2개', endpoints: 3, ...value,
  })
  if (scenario === 'deploy') return [
    step({ title: '원하는 상태 작성', actor: '우리 팀 · 개발', input: 'product-api:v1 / replicas: 3', decision: '이미지·개수·Readiness 기준 선언', output: 'Deployment 설정 준비', focus: 'team', pods: [], endpoints: 0 }),
    step({ title: '선언 저장', actor: 'Kubernetes · API Server', input: 'kubectl apply로 Deployment 제출', decision: '접근 권한과 객체 필드 검증', output: '원하는 상태 저장', focus: 'control', pods: [], endpoints: 0 }),
    step({ title: 'Pod 생성과 노드 배정', actor: 'Kubernetes · 컨트롤러와 Scheduler', input: '목표 3개 / 아직 실행된 Pod 없음', decision: '컨트롤러가 Pod 생성, Scheduler가 노드 선택', output: 'Pod A·B·C가 워커 노드에 배정됨', focus: 'control', pods: ['Pending', 'Pending', 'Pending'], endpoints: 0 }),
    step({ title: '컨테이너 실행', actor: '노드 · kubelet과 런타임', input: '노드별로 배정된 Pod와 이미지', decision: '이미지를 준비하고 컨테이너 시작', output: '실행 중 / Readiness는 아직 대기', focus: 'nodes', pods: ['Not Ready', 'Not Ready', 'Not Ready'], endpoints: 0 }),
    step({ title: '요청 받을 준비 완료', actor: 'kubelet · EndpointSlice 컨트롤러', input: 'Pod A·B·C 준비 검사 성공', decision: 'Ready 상태와 연결 대상 정보 반영', output: 'product-service의 Ready 주소 3개', focus: 'pods' }),
  ]
  if (scenario === 'control') return [
    step({ title: '정상 운영', actor: controlOwner, input: 'API Server와 etcd 운영', decision: isEks ? 'EKS가 Control Plane 가용성을 관리' : '우리 팀이 Control Plane 가용성을 관리', output: '앱 Pod 3개는 노드에서 실행 중', focus: 'control' }),
    step({ title: 'API 서버 인스턴스 하나에 장애', actor: controlOwner, input: 'Control Plane 인스턴스 상태 이상', decision: '인스턴스 장애와 클러스터 전체 장애를 구분', output: '복구가 필요한 인스턴스 식별', focus: 'control', control: '인스턴스 1개 장애' }),
    step({ title: '복구 수행 주체 확인', actor: controlOwner, input: '문제가 생긴 API 서버 인스턴스', decision: isEks ? 'AWS가 인스턴스를 교체하고 가용성 관리' : '우리 팀이 원인을 진단하고 인스턴스 복구', output: isEks ? 'EKS의 관리 작업으로 인스턴스 교체' : '직접 구성한 복구 절차 실행', focus: 'control', control: '복구 중' }),
    step({ title: '관리 API와 앱 상태 확인', actor: '우리 팀 · 운영', input: 'Control Plane 인스턴스 복구 완료', decision: 'API 접근, 배포 상태와 앱 응답은 각각 확인', output: '모형에서는 기존 Ready Pod 3개 유지', focus: 'team' }),
  ]
  if (scenario === 'app') return [
    step({ title: '세 Pod가 준비됨', actor: '우리 팀 · 개발', input: 'product-api:v1 / Pod A·B·C', decision: 'Readiness 조건 모두 만족', output: 'Ready 주소 3개', focus: 'pods' }),
    step({ title: 'Pod B의 앱 준비 검사 실패', actor: '노드 · kubelet', input: 'Pod B의 앱 설정 오류', decision: 'Readiness 검사 실패 반영', output: 'Pod B: Not Ready / 주소 정보는 갱신 전', focus: 'pods', pods: ['Ready', 'Not Ready', 'Ready'] }),
    step({ title: '새 요청에서 B 제외', actor: 'Kubernetes · EndpointSlice 컨트롤러', input: 'Pod B의 Ready 조건 변경', decision: 'EndpointSlice와 선택용 주소 정보 갱신', output: '새 요청은 준비된 A 또는 C로 연결', focus: 'pods', pods: ['Ready', 'Not Ready', 'Ready'], endpoints: 2 }),
    step({ title: '앱 원인 수정', actor: '우리 팀 · 개발', input: 'Pod B의 로그와 앱 설정', decision: '잘못된 설정을 수정하고 적용', output: '준비 검사를 다시 통과할 때까지 대기', focus: 'team', pods: ['Ready', 'Not Ready', 'Ready'], endpoints: 2 }),
    step({ title: '준비 상태 복구', actor: 'kubelet · EndpointSlice 컨트롤러', input: '수정 후 Pod B의 준비 검사 성공', decision: 'Ready와 주소 정보 반영', output: 'Ready 주소 3개로 복귀', focus: 'pods' }),
  ]
  return [
    step({ title: '패치 버전 준비', actor: isEks ? 'AWS · EKS AMI 제공' : '우리 팀 · OS 패치 준비', input: '노드 OS에 적용할 보안 패치', decision: isEks ? 'AWS가 EKS 최적화 AMI의 패치 버전을 제공' : '우리 팀이 패치된 노드 이미지를 준비', output: '적용 후보 버전 준비 / 아직 기존 노드', focus: 'nodes' }),
    step({ title: '업데이트 결정과 실행', actor: '우리 팀 · 운영', input: '패치 버전과 실행 중인 앱', decision: '앱 호환성·용량·PodDisruptionBudget 확인', output: isEks ? '관리형 노드 그룹 업데이트 시작' : '직접 노드 교체 절차 시작', focus: 'team' }),
    step({ title: '새 노드 준비와 순차 교체', actor: nodeOwner, input: '우리 팀이 시작한 노드 업데이트', decision: isEks ? '관리형 절차가 새 노드를 준비하고 drain 수행' : '우리 팀이 새 노드를 준비하고 drain 수행', output: 'Pod가 새 노드에 배치되고 준비됨', focus: 'nodes', nodes: '새 노드 준비 · 순차 교체' }),
    step({ title: '교체 후 앱 검증', actor: '우리 팀 · 운영', input: '패치된 노드와 다시 준비된 Pod', decision: '버전·Ready·실제 앱 동작 확인', output: '모형의 노드 교체 완료', focus: 'pods', nodes: '패치된 노드 2개' }),
  ]
}

export function advanceManagedStep(current: number, total: number): number {
  return Math.min(current + 1, total - 1)
}
