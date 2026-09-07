import { detailedFlow, detailDuration, nextDetailCursor, previousDetailCursor } from './detailed-flows'
import type { DetailScene, DetailStep } from './detailed-flows'

export const journeyIds = ['deploy', 'request', 'debug'] as const
export type JourneyId = typeof journeyIds[number]
export interface Journey {
  id: JourneyId
  label: string
  steps: DetailStep[]
  references: string[]
  note: string
  sources: { label: string, href: string }[]
}

const values = (...text: string[]): DetailScene => ({ kind: 'values', items: text.map(text => ({ text })) })
const compare = (...text: string[]): DetailScene => ({ ...values(...text), kind: 'compare' })
const success = (...text: string[]): DetailScene => ({ ...values(...text), success: true })

const diagnostics: DetailStep[] = [
  { id: 'symptom', label: '장애 접수', arrival: values('GET /api/products'), decision: compare('예상 200', '실제 503'), result: values('서비스 응답 실패'), info: '별도의 장애 시나리오입니다. v2에서 준비 검사 경로가 바뀌었고, 현재 대상 Pod 세 개가 모두 Not Ready인 상태에서 시작합니다. 모든 배포가 이런 장애를 일으킨다는 뜻은 아닙니다. 아래 명령과 출력은 모의 값입니다.' },
  { id: 'get', label: 'get · 상태 확인', arrival: values('kubectl get pods'), decision: values('STATUS Running', 'READY 0/1', 'RESTARTS 0'), result: values('실행 중 · 준비 실패'), info: 'kubectl get pods -l app=product-api. 각 Pod의 READY 0/1은 컨테이너 하나가 준비되지 않았다는 뜻입니다. Running은 앱 요청 처리 가능 여부를 보장하지 않습니다.' },
  { id: 'describe', label: 'describe · Events', arrival: values('kubectl describe pod product-b'), decision: values('Warning Unhealthy', '/ready → 404'), result: values('준비 검사 경로 확인'), info: 'Events의 Readiness probe failed: HTTP probe failed with statuscode: 404를 확인합니다. Events만으로 앱의 전체 원인을 확정하지 않고 로그와 실제 경로를 대조합니다.' },
  { id: 'logs', label: 'logs · 앱 로그', arrival: values('kubectl logs product-b'), decision: values('Listening :8080', 'Health route /health'), result: values('프로세스 정상 · 경로 변경'), info: 'product-b는 학습용 Pod 이름입니다. 재시작이 0회이므로 현재 컨테이너 로그를 봅니다. 재시작한 컨테이너의 이전 로그가 필요할 때는 kubectl logs product-b --previous를 사용합니다. 로그가 없다는 사실만으로 정상이라고 판단하지 않습니다.' },
  { id: 'inside', label: 'exec / debug · 내부 확인', arrival: values('Pod 내부 :8080'), decision: compare('/ready → 404', '/health → 200'), result: values('준비 검사 경로 불일치'), info: '이 예시는 curl이 있는 컨테이너에서 kubectl exec product-b -- curl -i localhost:8080/ready 및 /health를 실행한 결과입니다. 셸이나 진단 도구가 없으면 kubectl debug로 적절한 진단 컨테이너를 사용합니다. 실행 전인 컨테이너에 exec가 가능한 것처럼 표현하지 않습니다.' },
  { id: 'network-pod', label: '네트워크 · Pod', arrival: values('진단 Pod → 10.244.0.12:8080'), decision: values('GET /api/products', '200 OK'), result: success('Pod 직접 접근 정상'), info: '같은 네트워크 정책을 적용받는 진단 위치에서 Pod IP를 직접 호출한 예시입니다. Ready=false여도 프로세스와 Pod IP 직접 접근은 동작할 수 있습니다. readinessProbe는 Service 대상 선택에 영향을 줍니다.' },
  { id: 'network-service', label: '네트워크 · Service', arrival: values('product-service:80'), decision: { kind: 'metadata', items: [{ text: 'selector 일치' }, { text: 'Ready 대상 0개', status: 'unready' }] }, result: values('Service 전달 대상 없음'), info: 'kubectl get svc product-service -o yaml과 kubectl get endpointslices -l kubernetes.io/service-name=product-service를 확인합니다. selector와 targetPort는 맞지만 모든 대상의 ready=false인 상태입니다. EndpointSlice는 목적지 주소 정보이며 패킷이 통과하는 장치가 아닙니다.' },
  { id: 'network-dns', label: '네트워크 · DNS', arrival: values('product-service.default.svc'), decision: compare('DNS 조회', '10.96.0.20'), result: success('Service 이름 해석 정상'), info: '진단 Pod에서 nslookup product-service.default.svc.cluster.local을 실행한 예시입니다. DNS 조회 성공과 실제 Service 전달 성공은 별개입니다. 이미 원인을 찾았다면 이런 추가 점검을 모두 마칠 필요는 없습니다.' },
  { id: 'network-ingress', label: '네트워크 · Ingress / 외부', arrival: values('shop.example.com/api/products'), decision: values('Host · 경로 일치', 'Ready backend 0개'), result: values('Ingress 응답 503'), info: 'kubectl describe ingress product-ingress로 규칙과 backend를 확인하고 Ingress Controller 로그와 외부 응답을 비교합니다. 이 예시의 Controller는 사용 가능한 backend가 없어 503을 반환합니다. 상태 코드는 구현과 장애 종류에 따라 다를 수 있습니다.' },
  { id: 'rollback', label: '최근 배포 · 롤백 판단', arrival: values('v2 배포 직후 발생'), decision: compare('v2 · /health', 'v1 · /ready'), result: values('이전 Pod template 복원'), info: 'kubectl rollout history deployment/product-api로 이전 revision을 확인한 뒤, v2의 변경이 원인이고 이전 버전으로 돌아갈 수 있다는 조건에서 kubectl rollout undo deployment/product-api를 모의 실행합니다. 최근 배포가 의심되고 서비스 영향이 크면 긴 조사보다 복구를 앞당길 수 있습니다. 롤백은 외부 DB나 별도 ConfigMap 변경까지 자동으로 되돌리지 않습니다.' },
  { id: 'verify', label: '복구 확인', arrival: values('v1 Pod 준비 검사'), decision: compare('/ready → 200', 'Ready 대상 3개'), result: success('200 OK', '서비스 복구'), info: 'kubectl rollout status deployment/product-api, Pod Ready, EndpointSlice 반영, 실제 사용자 요청을 각각 확인한 뒤 복구로 판단합니다. 롤백 명령이 반환되었다고 즉시 서비스가 복구된 것은 아닙니다.' },
]

export function journey(id: JourneyId): Journey {
  if (id === 'debug') return {
    id, label: '장애 진단', steps: diagnostics, references: ['network-service', 'network-dns'],
    note: '실제 클러스터에 접속하지 않는 모의 진단입니다. 조사 순서를 보여주는 한 사례이며, 원인을 찾으면 불필요한 검사를 생략할 수 있습니다. 긴급 복구가 필요하면 롤백 판단을 앞당깁니다.',
    sources: [
      { label: 'Pod 진단', href: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/' },
      { label: 'Service 진단', href: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/' },
      { label: 'Deployment 롤백', href: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment' },
    ],
  }
  const parts = id === 'deploy' ? [detailedFlow('declare'), detailedFlow('run')] : [detailedFlow('request')]
  const steps = parts.flatMap(part => part.steps).map(step => {
    if (step.id === 'apply') return { ...step, label: 'kubectl apply · 배포 선언' }
    if (step.id === 'runtime') return { ...step, label: 'containerd · 컨테이너 시작', info: '이 예시에서는 CRI 컨테이너 런타임으로 containerd를 사용합니다. kubelet의 요청에 따라 Pod sandbox, 네트워크 준비와 컨테이너 실행이 진행됩니다. 세부 CRI, CNI, OCI 호출은 요약했습니다. Running 이후에도 Ready 검사가 남아 있습니다.' }
    if (step.id === 'ready-filter') return { ...step, label: 'Ready 확인 · 주소 정보 참조' }
    if (step.id === 'host') return { ...step, label: 'Ingress 규칙 · Host' }
    if (step.id === 'path') return { ...step, label: 'Ingress 규칙 · 경로' }
    return step
  })
  return {
    id, label: id === 'deploy' ? '배포 과정' : '요청 흐름', steps,
    references: id === 'deploy' ? ['persist'] : ['dns', 'host', 'path', 'ready-filter'],
    note: id === 'deploy'
      ? '모의 배포입니다. 세로선은 제어 작업이 이어지는 순서를 뜻합니다. 컨트롤러들이 서로 직접 호출하거나 etcd에서 명령을 전달받는 구조가 아닙니다. 각 구성 요소는 API Server를 통해 상태를 읽고 갱신합니다. A를 확대해 실행하며 B와 C도 같은 절차를 거칩니다.'
      : '모의 요청입니다. DNS는 사전 주소 조회이고, Ingress 규칙과 EndpointSlice는 처리 시 참조하는 설정·주소 정보입니다. 요청이 이 정보 객체를 네트워크 장치처럼 통과하지 않습니다. Service는 논리적인 연결 지점이며 실제 경로는 Ingress와 네트워크 구현에 따라 다릅니다. 요청 시나리오는 배포 직후와 별개로 A가 Not Ready, B와 C가 Ready인 상태를 가정합니다.',
    sources: [...new Map(parts.flatMap(part => part.sources).map(source => [source.href, source])).values()],
  }
}

export function journeyFrame(flow: Journey, cursor: number) {
  if (cursor < 0) return null
  const bounded = Math.min(cursor, flow.steps.length * 3 - 1)
  const index = Math.floor(bounded / 3)
  const phase = (['arrival', 'decision', 'result'] as const)[bounded % 3]!
  const step = flow.steps[index]!
  return { index, phase, step, scene: step[phase], done: bounded === flow.steps.length * 3 - 1 }
}

export function journeyToken(id: JourneyId, step: DetailStep, phase: string): string {
  if (id === 'request') return step.id === 'response' && phase === 'result' ? '200 OK' : 'GET'
  if (id === 'debug') return step.id === 'verify' && phase === 'result' ? '200 OK' : '진단'
  if (['apply', 'admission', 'persist', 'replicaset'].includes(step.id)) return '선언'
  return step.id === 'probe' && phase === 'result' || step.id === 'publish' ? 'Ready' : 'Pod'
}

export { detailDuration, nextDetailCursor, previousDetailCursor }
