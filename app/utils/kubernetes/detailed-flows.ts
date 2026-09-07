import { controllerInstances, exampleRequest, ingressRule, matchesIngress } from './load-balancing'
import { initialRequestAnimation } from './request-animation'
import type { ManagedMode } from './managed'

export const detailedFlowIds = ['entry', 'routing', 'delivery', 'declare', 'run', 'control', 'readiness', 'update'] as const
export type DetailedFlowId = typeof detailedFlowIds[number]
export const combinedFlowIds = ['request', 'managed'] as const
export type FlowDiagramId = DetailedFlowId | typeof combinedFlowIds[number]
export type SceneKind = 'values' | 'compare' | 'choice' | 'pods' | 'metadata' | 'nodes' | 'response'
export interface SceneItem { text: string, status?: 'ready' | 'unready' | 'pending', selected?: boolean, role?: 'input' }
export interface DetailScene { kind: SceneKind, items: SceneItem[], success?: boolean }
export interface DetailStep {
  id: string
  label: string
  activeLabel?: string
  arrival: DetailScene
  decision: DetailScene
  result: DetailScene
  info: string
}
export interface DetailedFlow {
  id: FlowDiagramId
  label: string
  managed: boolean
  steps: DetailStep[]
  note: string
  sources: { label: string, href: string }[]
  groups?: { id: DetailedFlowId, label: string, start: number, end: number }[]
}

const scene = (kind: SceneKind, ...items: (string | SceneItem)[]): DetailScene => ({ kind, items: items.map(item => typeof item === 'string' ? { text: item } : item) })
const values = (...items: (string | SceneItem)[]) => scene('values', ...items)
const ok = (...items: string[]): DetailScene => ({ ...values(...items), success: true })
const pods = (status: SceneItem['status'], names = ['A', 'B', 'C']) => scene('pods', ...names.map(name => ({ text: `Pod ${name}`, status })))
const k8s = (path: string) => `https://kubernetes.io/docs/${path}`
const aws = (path: string) => `https://docs.aws.amazon.com/eks/latest/userguide/${path}.html`
const routingNote = '학습용 모의 요청입니다. DNS 결과와 TLS 설정은 예시이며 실제 네트워크 호출은 하지 않습니다. TLS는 Ingress Controller에서 종료합니다. Service는 논리적인 연결 지점으로 표현했습니다. 실제 데이터 경로와 분산 방식은 구현에 따라 다릅니다.'
const operationsNote = 'Kubernetes 제어 작업의 순서를 단순화한 모형입니다. HTTP 요청이 이 관리 구성 요소들을 통과하는 그림이 아닙니다. EKS 비교는 EC2 관리형 노드 그룹을 사용하며, 앱 코드·권한·준비 기준과 업데이트 실행 판단은 우리 팀의 책임입니다.'

export function detailedFlow(id: FlowDiagramId, mode: ManagedMode = 'eks'): DetailedFlow {
  if (id === 'request' || id === 'managed') {
    const sections: { id: DetailedFlowId, label: string }[] = id === 'request'
      ? [{ id: 'entry', label: '외부 요청 → Ingress 도착' }, { id: 'routing', label: 'TLS 종료 → Host·경로 판단' }, { id: 'delivery', label: 'Service → Ready Pod → 응답' }]
      : [{ id: 'declare', label: '배포 · 선언과 Pod 생성' }, { id: 'run', label: '배포 · 실행과 Ready 반영' }, { id: 'control', label: '장애 예시 · API 서버 복구' }, { id: 'readiness', label: '장애 예시 · Pod B 복구' }, { id: 'update', label: '운영 예시 · 노드 업데이트' }]
    const parts = sections.map(section => detailedFlow(section.id, mode))
    let start = 0
    const groups = sections.map((section, index) => {
      const end = start + parts[index]!.steps.length
      const group = { ...section, start, end }
      start = end
      return group
    })
    return {
      id,
      label: id === 'request' ? '요청 흐름 실험' : '관리형 쿠버네티스와 EKS',
      managed: id === 'managed',
      steps: parts.flatMap(part => part.steps),
      groups,
      note: id === 'request' ? routingNote : `${operationsNote} 배포 이후의 API 서버 장애, Pod 오류, 노드 업데이트는 각각 별도의 운영 상황 예시입니다.`,
      sources: [...new Map(parts.flatMap(part => part.sources).map(source => [source.href, source])).values()],
    }
  }
  const owner = mode === 'eks' ? 'AWS' : '우리 팀'
  const route = initialRequestAnimation().route
  const ready = route.endpoints.filter(endpoint => endpoint.ready)
  const selected = ready[0]!
  const matches = matchesIngress(exampleRequest.host, exampleRequest.path)
  const hostMatch = exampleRequest.host === ingressRule.host
  const service = matches ? ingressRule.service : '규칙 없음'
  const endpointItems = route.endpoints.map(endpoint => ({ text: `Pod ${endpoint.id}`, status: endpoint.ready ? 'ready' as const : 'unready' as const }))
  const base = { id, managed: !['entry', 'routing', 'delivery'].includes(id), note: ['entry', 'routing', 'delivery'].includes(id) ? routingNote : operationsNote }

  if (id === 'entry') return { ...base, label: '외부 요청이 Ingress에 도착하기까지', sources: [
    { label: 'Ingress', href: k8s('concepts/services-networking/ingress/') },
  ], steps: [
    { id: 'request', label: '사용자 · 요청 생성', arrival: values('shop.example.com'), decision: values('GET', '/api/products'), result: ok('GET /api/products'), info: '브라우저가 HTTPS 요청을 준비합니다. 이 그림에서는 새 연결 하나를 따라갑니다.' },
    { id: 'dns', label: 'DNS · 주소 조회', arrival: values('shop.example.com'), decision: scene('compare', 'shop.example.com', 'A 레코드 조회'), result: ok('203.0.113.10'), info: 'DNS는 도메인의 IP 주소를 찾는 과정입니다. 203.0.113.10은 문서용 예시 주소이며 DNS 자체는 HTTP 요청의 전달 경로가 아닙니다.' },
    { id: 'lb', label: 'Load Balancer · 연결 대상', arrival: values('TCP :443'), decision: scene('choice', ...controllerInstances), result: scene('choice', ...controllerInstances.map((text, index) => ({ text, selected: index === 0 }))), info: 'L4 Load Balancer가 정상 대상 둘 중 ingress-1을 선택한 예시입니다. 암호화된 Host와 경로는 여기서 검사하지 않습니다.' },
    { id: 'ingress-arrival', label: 'Ingress · 연결 수신', arrival: values('ingress-1'), decision: values('TLS 연결', ':443'), result: ok('ingress-1 :443'), info: '선택된 Ingress Controller가 TLS 연결을 받습니다. 다음 구간에서 TLS 종료와 HTTP 라우팅을 이어서 봅니다.' },
  ] }
  if (id === 'routing') return { ...base, label: 'Ingress가 Host와 경로를 판단하는 과정', sources: [
    { label: 'Ingress 경로 일치', href: k8s('concepts/services-networking/ingress/#path-types') },
  ], steps: [
    { id: 'tls', label: 'Ingress · TLS 종료', arrival: values('ingress-1 :443'), decision: scene('compare', '암호화된 연결', '인증서 · TLS'), result: ok('HTTP 요청 확인'), info: '앞 구간에서 선택한 ingress-1에서 TLS를 종료합니다. 이 예시는 이후 백엔드로 HTTP를 사용합니다.' },
    { id: 'host', label: 'Ingress · Host 비교', arrival: values('Host'), decision: scene('compare', exampleRequest.host, ingressRule.host), result: { ...scene('compare', exampleRequest.host, hostMatch ? 'Host 일치' : 'Host 불일치'), success: hostMatch }, info: '요청의 Host와 Ingress 규칙의 host를 비교합니다. 두 값 모두 shop.example.com입니다.' },
    { id: 'path', label: 'Ingress · 경로 비교', arrival: values('/api/products'), decision: scene('compare', exampleRequest.path, '/api · Prefix'), result: { ...scene('compare', '/api/products', matches ? '경로 일치' : '경로 불일치'), success: matches }, info: '/api Prefix는 경로 요소 단위로 비교합니다. /api/products는 일치하지만 /apiculture는 일치하지 않습니다. 쿼리 문자열은 이 규칙의 비교 대상이 아닙니다.' },
    { id: 'backend', label: 'Ingress · backend 결정', arrival: values('Host ✓', 'Path ✓'), decision: scene('choice', '/api → product-service', '/cart → cart-service'), result: ok(service), info: '일치한 /api 규칙의 backend인 product-service의 Service 포트 80을 선택합니다. /cart 규칙은 비교를 위한 별도 예시이며 이번 요청에는 일치하지 않습니다.' },
  ] }
  if (id === 'delivery') return { ...base, label: 'Ready Pod 선택과 상품 응답', sources: [
    { label: 'Service', href: k8s('concepts/services-networking/service/') },
    { label: 'EndpointSlice', href: k8s('concepts/services-networking/endpoint-slices/') },
  ], steps: [
    { id: 'service-port', label: 'Service · 포트 연결', arrival: values(service), decision: scene('compare', 'port: 80', 'targetPort: 8080'), result: ok('Pod 포트 :8080'), info: 'Ingress가 선택한 Service는 포트 80을 Pod의 8080 포트에 연결하도록 설정되어 있습니다. 별도의 프록시 장치를 반드시 통과한다는 뜻은 아닙니다.' },
    { id: 'ready-filter', label: 'Service · Ready 확인', arrival: values('EndpointSlice'), decision: scene('metadata', ...endpointItems), result: scene('metadata', ...endpointItems.map(item => ({ ...item, selected: item.status === 'ready' }))), info: `옆의 점선 상자는 EndpointSlice 주소 정보의 참조입니다. ${route.endpoints.map(endpoint => `Pod ${endpoint.id}: ${endpoint.address}, ready=${endpoint.ready}`).join(' / ')}. 종료 중인 Pod가 없고 publishNotReadyAddresses=false인 예시입니다. EndpointSlice를 요청이 통과하지 않습니다.` },
    { id: 'pod-choice', label: 'Service · Pod 선택', arrival: values(`Ready ${ready.length}개`), decision: scene('choice', ...ready.map(endpoint => `Pod ${endpoint.id}`)), result: scene('choice', ...ready.map(endpoint => ({ text: `Pod ${endpoint.id}`, selected: endpoint.id === selected.id }))), info: '이번 예시는 준비된 B와 C 중 B를 선택합니다. 실제 구현의 분산 알고리즘, 연결 재사용, 세션 어피니티에 따라 결과는 달라질 수 있습니다.' },
    { id: 'handler', label: 'Pod · 상품 조회', activeLabel: `Pod ${selected.id} · 상품 조회`, arrival: values(selected.address), decision: scene('compare', 'GET /api/products', '상품 조회 핸들러'), result: ok('상품 2개'), info: '요청은 선택된 Pod B의 8080 포트로 전달됩니다. 앱이 /api/products 핸들러를 실행해 상품 두 개를 조회했다고 가정합니다.' },
    { id: 'response', label: '응답 · 사용자에게 반환', arrival: values('상품 조회 결과'), decision: values('JSON 직렬화'), result: scene('response', '200 OK', '상품 2개'), info: '200 OK와 상품은 모의 결과입니다. 실제 응답은 기존 연결을 통해 역방향으로 돌아갑니다. 아래로 이어진 마지막 단계는 처리 순서를 나타냅니다.' },
  ] }
  if (id === 'declare') return { ...base, label: 'Deployment 선언에서 Pod 객체 생성까지', sources: [
    { label: 'Kubernetes 구성 요소', href: k8s('concepts/overview/components/') },
    { label: 'Deployment', href: k8s('concepts/workloads/controllers/deployment/') },
  ], steps: [
    { id: 'apply', label: '우리 팀 · 배포 선언', arrival: values('Deployment'), decision: values('product-api:v1', 'replicas: 3'), result: ok('kubectl apply'), info: '우리 팀이 이미지, 복제 개수, 리소스 요청량과 readinessProbe를 선언합니다. EKS도 이 앱 설정을 대신 정하지 않습니다.' },
    { id: 'admission', label: 'API Server · 검증', arrival: values('Deployment 요청'), decision: scene('compare', '인증 · 권한', '필드 · admission'), result: ok('요청 허용'), info: 'API Server는 인증·인가와 객체 검증, admission 처리를 거칩니다. 이 예시는 모두 통과한 요청입니다.' },
    { id: 'persist', label: 'API Server → etcd', arrival: values('검증된 Deployment'), decision: values('원하는 상태 저장'), result: ok('Deployment 저장됨'), info: 'API Server가 클러스터 상태를 etcd에 저장합니다. 저장 완료는 컨테이너가 이미 실행되었다는 뜻이 아닙니다.' },
    { id: 'replicaset', label: 'Deployment 컨트롤러', arrival: values('Deployment'), decision: values('Pod template', 'replicas: 3'), result: ok('ReplicaSet 생성'), info: 'Deployment 컨트롤러가 ReplicaSet을 만들거나 갱신합니다. API 객체 생성·변경은 API Server를 통합니다.' },
    { id: 'pod-objects', label: 'ReplicaSet 컨트롤러', arrival: values('ReplicaSet · 목표 3'), decision: scene('compare', '목표 3개', '현재 0개'), result: pods('pending'), info: 'ReplicaSet 컨트롤러가 부족한 Pod 객체 세 개를 생성합니다. 아직 노드가 배정되거나 컨테이너가 실행된 상태는 아닙니다.' },
  ] }
  if (id === 'run') {
    const requestCpu = 250
    const nodes = [{ name: 'node-1', available: 100 }, { name: 'node-2', available: 2000 }]
    const chosen = nodes.find(node => node.available >= requestCpu)!
    return { ...base, label: '노드 배정에서 Ready 주소 반영까지', sources: [
      { label: 'Scheduler', href: k8s('concepts/scheduling-eviction/kube-scheduler/') },
      { label: 'Pod 생명주기', href: k8s('concepts/workloads/pods/pod-lifecycle/') },
    ], steps: [
      { id: 'schedule', label: 'Scheduler · 노드 선택', arrival: values('Pod A · CPU 250m'), decision: scene('nodes', ...nodes.map(node => `${node.name} · 여유 ${node.available}m`), { text: 'Pod A · 요청 250m', role: 'input' }), result: scene('nodes', ...nodes.map(node => ({ text: node.name, selected: node.name === chosen.name }))), info: '생성된 Pod 중 A의 배정을 확대해서 봅니다. 다른 조건은 동일하다고 가정하고 요청 CPU 250m를 수용할 수 있는 node-2를 선택합니다. 실제 Scheduler는 메모리, taint, affinity 등도 검사하고 점수를 비교합니다.' },
      { id: 'image', label: 'kubelet · 이미지 준비', arrival: values(`${chosen.name} · Pod A`), decision: values('product-api:v1', '이미지 확인 · 가져오기'), result: ok('이미지 준비됨'), info: '배정된 노드의 kubelet은 컨테이너 런타임에 이미지 준비를 요청합니다. 캐시된 이미지가 있으면 항상 다시 내려받는 것은 아닙니다.' },
      { id: 'runtime', label: '런타임 · 컨테이너 시작', arrival: values('Pod A · 이미지 준비'), decision: values('컨테이너 생성', '프로세스 시작'), result: values({ text: 'Running · Not Ready', status: 'pending' }), info: '런타임이 컨테이너를 실행합니다. Running과 Ready는 다르며 아직 트래픽을 받을 준비가 확인되지 않았습니다.' },
      { id: 'probe', label: 'kubelet · 준비 검사', arrival: values('Pod A · Running'), decision: scene('compare', 'readinessProbe /ready', '앱 준비 상태'), result: pods('ready', ['A']), info: '준비 검사가 설정된 성공 기준을 만족하면 kubelet이 Pod의 Ready 상태를 반영합니다. readinessProbe 실패만으로 컨테이너를 재시작하지는 않습니다.' },
      { id: 'publish', label: 'EndpointSlice 컨트롤러', arrival: values('Pod A · Ready'), decision: scene('metadata', { text: 'Pod A · ready=true', status: 'ready' }), result: ok('Service 대상에 A 반영'), info: 'Service의 selector와 일치하는 Pod A의 주소 및 Ready 조건이 EndpointSlice에 반영됩니다. 이 장면은 관리 작업이며 HTTP 요청의 경로가 아닙니다. B와 C도 같은 실행 과정을 거칩니다.' },
    ] }
  }
  if (id === 'control') return { ...base, label: 'API 서버 인스턴스 장애와 복구 책임', sources: [
    { label: 'EKS 아키텍처', href: aws('eks-architecture') },
  ], steps: [
    { id: 'detect', label: `${owner} · 장애 감지`, arrival: values('API Server 상태'), decision: scene('nodes', { text: 'api-1', status: 'unready' }, { text: 'api-2', status: 'ready' }), result: values({ text: 'api-1 장애', status: 'unready' }), info: 'API Server 인스턴스 하나의 장애 예시입니다. EKS는 여러 가용 영역에서 Control Plane 가용성을 관리합니다. 두 아이콘은 개념용이며 실제 인스턴스 수를 뜻하지 않습니다.' },
    { id: 'serve', label: '정상 API 인스턴스', arrival: values('관리 API 요청'), decision: scene('choice', { text: 'api-1', status: 'unready' }, { text: 'api-2', status: 'ready' }), result: ok('api-2로 처리'), info: '정상 인스턴스가 요청을 처리할 수 있는 구성을 가정합니다. 직접 운영 비교도 다중 인스턴스 가용성 구성이 되어 있다는 전제입니다.' },
    { id: 'repair', label: `${owner} · 인스턴스 복구`, arrival: values('api-1 장애'), decision: values(mode === 'eks' ? 'AWS 관리 절차' : '우리 팀 복구 절차', '교체 · 상태 확인'), result: scene('nodes', { text: 'api-new', status: 'ready' }), info: mode === 'eks' ? 'EKS Control Plane 인프라 복구는 AWS가 관리합니다. 내부 복구의 정확한 구현 순서를 재현한 그림은 아닙니다.' : '우리 팀이 직접 구축한 Control Plane의 진단과 복구 절차를 수행합니다. 자동화 여부도 직접 구성해야 합니다.' },
    { id: 'verify-control', label: '우리 팀 · 운영 확인', arrival: values('Control Plane 복구'), decision: values('관리 API 확인', '앱 응답 확인'), result: ok('API 정상', '앱 응답 정상'), info: '관리 API 가용성과 앱 동작을 별도로 확인합니다. 한 API 인스턴스 장애만으로 기존 Pod가 즉시 정지하는 것은 아니며, 이 모형에서는 앱이 계속 실행됩니다.' },
  ] }
  if (id === 'readiness') return { ...base, label: 'Pod B 준비 실패에서 트래픽 복귀까지', sources: [
    { label: 'readinessProbe', href: k8s('tasks/configure-pod-container/configure-liveness-readiness-startup-probes/') },
    { label: 'EndpointSlice 조건', href: k8s('concepts/services-networking/endpoint-slices/#conditions') },
  ], steps: [
    { id: 'probe-fail', label: 'kubelet · 준비 실패', arrival: pods('ready'), decision: scene('compare', 'Pod B · /ready', '503'), result: scene('pods', { text: 'Pod A', status: 'ready' }, { text: 'Pod B', status: 'unready' }, { text: 'Pod C', status: 'ready' }), info: '앱 설정 오류 때문에 B의 readinessProbe가 실패한 예시입니다. 이 시점에는 EndpointSlice 등으로 상태가 아직 전파되지 않았을 수 있습니다.' },
    { id: 'exclude', label: '대상 정보 · 상태 전파', arrival: values('Pod B · Not Ready'), decision: scene('metadata', { text: 'A · true', status: 'ready' }, { text: 'B · false', status: 'unready' }, { text: 'C · true', status: 'ready' }), result: scene('choice', { text: 'Pod A', status: 'ready' }, { text: 'Pod C', status: 'ready' }), info: 'EndpointSlice 컨트롤러와 트래픽 처리 계층에 준비 상태가 전파되면 새 선택에서 B가 제외됩니다. 즉시 동기화된다고 보장할 수 없으며 이미 열린 연결은 별개입니다.' },
    { id: 'fix-app', label: '우리 팀 · 앱 수정', arrival: values('Pod B · 설정 오류'), decision: scene('compare', '잘못된 설정', '수정 · 적용'), result: values('수정 적용', '준비 검사 대기'), info: 'AWS가 앱 설정 오류를 대신 수정하지 않습니다. 앱 수정과 배포는 우리 팀의 책임입니다. 실제로 설정 적용에 Pod 교체가 필요할 수 있으며 여기서 B는 논리적 대상을 뜻합니다.' },
    { id: 'probe-pass', label: 'kubelet · 준비 재검사', arrival: values('수정된 앱'), decision: scene('compare', '/ready', '200'), result: pods('ready', ['B']), info: '설정한 준비 검사 성공 기준을 만족한 뒤 B가 다시 Ready가 됩니다. 수정 적용과 Ready 복구를 별도 장면으로 구분했습니다.' },
    { id: 'restore', label: '대상 정보 · B 복귀', arrival: values('Pod B · Ready'), decision: scene('metadata', { text: 'B · ready=true', status: 'ready' }), result: pods('ready'), info: '준비 상태가 주소 정보와 트래픽 처리 계층에 반영된 후 A, B, C가 새 요청의 후보가 됩니다. 이 그림은 서비스 연결 대상의 변화를 나타냅니다.' },
  ] }
  return { ...base, label: '관리형 노드 그룹 업데이트의 세부 순서', sources: [
    { label: '관리형 노드 업데이트 단계', href: aws('managed-node-update-behavior') },
    { label: 'EKS 공동 책임', href: aws('security') },
  ], steps: [
    { id: 'approve-update', label: '우리 팀 · 업데이트 시작', arrival: values('패치된 노드 이미지'), decision: values('호환성 · 용량', 'PodDisruptionBudget'), result: ok('업데이트 시작'), info: 'AWS가 EKS 최적화 AMI를 제공해도 업데이트 적용 판단과 실행은 우리 팀이 합니다. 이 예시는 기본 업데이트 전략이며 강제 업데이트를 사용하지 않습니다.' },
    { id: 'new-node', label: `${owner} · 새 노드 준비`, arrival: values('새 AMI 버전'), decision: scene('nodes', { text: '기존 노드', status: 'ready' }, { text: '새 노드', status: 'pending' }), result: scene('nodes', { text: '기존 노드', status: 'ready' }, { text: '새 노드', status: 'ready' }), info: mode === 'eks' ? '기본 전략에서는 관리형 노드 그룹 절차가 새 노드를 준비하고 정상 등록을 확인합니다. 최소 용량 전략은 순서가 다를 수 있습니다.' : '우리 팀이 새 노드 생성, 이미지 적용과 클러스터 등록을 수행합니다. 자동화된 절차를 직접 마련할 수도 있습니다.' },
    { id: 'drain', label: `${owner} · cordon / drain`, arrival: values('새 노드 · Ready'), decision: values('기존 노드 · 배정 차단', 'Pod 퇴거 · PDB 확인'), result: values('기존 Pod 종료', '대체 Pod 필요'), info: '기존 노드에 새 Pod가 배정되지 않게 하고 drain으로 Pod 퇴거를 요청합니다. PDB 등으로 퇴거가 막히면 정상 업데이트도 중단되거나 실패할 수 있습니다. Pod 자체가 다른 노드로 이동하는 것은 아닙니다.' },
    { id: 'replacement', label: 'Kubernetes · 대체 Pod', arrival: values('ReplicaSet · 개수 부족'), decision: scene('compare', '새 Pod 생성', '새 노드에 배정'), result: scene('pods', { text: '새 Pod A', status: 'ready' }), info: '컨트롤러가 대체 Pod 객체를 만들고 Scheduler가 배정합니다. kubelet과 런타임의 실행 및 준비 검사 후 Ready가 됩니다. 여기서는 앱이 정상 준비되는 성공 경로를 보여줍니다.' },
    { id: 'retire', label: `${owner} · 기존 노드 정리`, arrival: values('대체 Pod · Ready'), decision: scene('nodes', { text: '기존 노드 · 종료', status: 'unready' }, { text: '새 노드', status: 'ready' }), result: ok('노드 교체 완료'), info: '기존 노드가 제거되고 목표 용량으로 조정되는 과정을 요약했습니다. 관리형 노드 그룹의 내부 단계와 병렬성은 설정에 따라 달라집니다. 앱 응답과 버전의 최종 검증은 우리 팀이 수행해야 합니다.' },
  ] }
}

export function detailFrame(flow: DetailedFlow, cursor: number) {
  if (cursor < 0) return null
  const bounded = Math.min(cursor, flow.steps.length * 3 - 1)
  const index = Math.floor(bounded / 3)
  const phase = (['arrival', 'decision', 'result'] as const)[bounded % 3]!
  const step = flow.steps[index]!
  return { index, phase, step, scene: step[phase], done: bounded === flow.steps.length * 3 - 1 }
}
export const nextDetailCursor = (cursor: number, steps: number) => Math.min(cursor + 1, steps * 3 - 1)
export const previousDetailCursor = (cursor: number) => Math.max(-1, cursor - 1)
export const detailDuration = (phase: string) => phase === 'arrival' ? 1000 : phase === 'decision' ? 1800 : 1500
