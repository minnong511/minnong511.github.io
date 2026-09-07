export const exampleRequest = {
  method: 'GET',
  url: 'https://shop.example.com/api/products?category=book',
  host: 'shop.example.com',
  path: '/api/products',
  query: 'category=book',
} as const

export const ingressRule = { host: 'shop.example.com', path: '/api', pathType: 'Prefix', service: 'product-service:80' } as const
export const controllerInstances = ['ingress-1', 'ingress-2'] as const
export type PodId = 'A' | 'B' | 'C'
export interface BackendPod { id: PodId, address: string, ready: boolean, deliveries: number }
export interface Endpoint { id: PodId, address: string, ready: boolean }
export interface LoadBalancingState {
  step: number
  requestNumber: number
  pods: BackendPod[]
  endpoints: Endpoint[]
  endpointVersion: number
  selectedController: string | null
  selectedPod: Endpoint | null
  selectedService: string | null
  selectionVersion: number | null
  selectionCandidates: PodId[]
  nextPodIndex: number
  done: boolean
  blocked: boolean
  notice: string
  history: { request: number, target: PodId | null }[]
}

export function initialLoadBalancing(): LoadBalancingState {
  const pods: BackendPod[] = (['A', 'B', 'C'] as const).map((id, index) => ({
    id, address: `10.244.0.${11 + index}:8080`, ready: true, deliveries: 0,
  }))
  return {
    step: 0, requestNumber: 1, pods, endpoints: pods.map(({ id, address, ready }) => ({ id, address, ready })),
    endpointVersion: 1, selectedController: null, selectedPod: null, selectedService: null,
    selectionVersion: null, selectionCandidates: [], nextPodIndex: 0, done: false, blocked: false,
    notice: 'Pod B를 Not Ready로 바꾸고, 다음 단계에서 주소 정보가 갱신되는지 확인해 보세요.', history: [],
  }
}

export function hasPendingEndpoints(state: LoadBalancingState): boolean {
  return state.pods.some(pod => state.endpoints.find(endpoint => endpoint.id === pod.id)?.ready !== pod.ready)
}

export function readyEndpoints(state: LoadBalancingState): Endpoint[] {
  return state.endpoints.filter(endpoint => endpoint.ready)
}

export function togglePodReadiness(state: LoadBalancingState, id: PodId) {
  const pod = state.pods.find(item => item.id === id)!
  pod.ready = !pod.ready
  state.notice = hasPendingEndpoints(state)
    ? `Pod ${id} → ${pod.ready ? 'Ready' : 'Not Ready'}. 다음 단계에서 EndpointSlice와 선택용 정보에 반영합니다.`
    : 'Pod 상태가 현재 주소 정보와 같아졌습니다. 갱신할 차이가 없습니다.'
}

export function matchesIngress(host: string, path: string): boolean {
  return host === ingressRule.host && (path === ingressRule.path || path.startsWith(`${ingressRule.path}/`))
}

// Each advance is one request hop, except an explicitly visible control-plane update.
// No sockets, fetch, Kubernetes API, or real backend requests are involved.
export function advanceLoadBalancing(state: LoadBalancingState) {
  if (hasPendingEndpoints(state)) {
    state.endpoints = state.pods.map(({ id, address, ready }) => ({ id, address, ready }))
    state.endpointVersion++
    const names = readyEndpoints(state).map(endpoint => endpoint.id).join(', ')
    state.notice = `주소 정보 v${state.endpointVersion} 반영 완료 · 새 선택 대상: ${names || '없음'}. 이미 선택한 요청의 목적지는 유지합니다.`
    return
  }
  if (state.done) {
    state.requestNumber++
    state.step = 0
    state.done = false
    state.blocked = false
    state.selectedController = null
    state.selectedPod = null
    state.selectedService = null
    state.selectionVersion = null
    state.selectionCandidates = []
    return
  }
  state.step++
  if (state.step === 1) state.selectedController = controllerInstances[(state.requestNumber - 1) % controllerInstances.length]!
  if (state.step === 2 && matchesIngress(exampleRequest.host, exampleRequest.path)) state.selectedService = ingressRule.service
  if (state.step === 3) {
    state.selectionVersion = state.endpointVersion
    state.selectionCandidates = readyEndpoints(state).map(endpoint => endpoint.id)
    // Keep a cursor over all pods so removing/restoring a Ready endpoint preserves the cycle.
    for (let offset = 0; offset < state.pods.length; offset++) {
      const index = (state.nextPodIndex + offset) % state.pods.length
      const endpoint = state.endpoints.find(item => item.id === state.pods[index]!.id && item.ready)
      if (!endpoint) continue
      state.selectedPod = { ...endpoint }
      state.nextPodIndex = (index + 1) % state.pods.length
      break
    }
    if (!state.selectedPod) {
      state.blocked = true
      state.done = true
      state.history = [...state.history.slice(-5), { request: state.requestNumber, target: null }]
    }
  }
  if (state.step === 4) {
    state.done = true
    state.pods.find(pod => pod.id === state.selectedPod!.id)!.deliveries++
    state.history = [...state.history.slice(-5), { request: state.requestNumber, target: state.selectedPod!.id }]
  }
}

export function describeLoadBalancing(state: LoadBalancingState) {
  const requestLine = `${exampleRequest.method} ${exampleRequest.path}?${exampleRequest.query}`
  if (hasPendingEndpoints(state)) return {
    title: '주소 정보 갱신 대기',
    description: '요청은 제자리에 있습니다. 다음 단계는 Pod 상태를 주소 정보에 반영하는 관리 작업입니다.',
    input: state.pods.map(pod => `${pod.id}: ${pod.ready ? 'Ready' : 'Not Ready'}`).join(' / '),
    decision: `EndpointSlice v${state.endpointVersion}는 이전 상태 · 다음 단계에서 ready 조건 갱신`,
    output: '요청 이동 없이 주소 정보와 선택용 목록 갱신',
    host: '현재 요청의 값 유지', path: '현재 요청의 값 유지', query: '현재 요청의 값 유지',
  }
  const details = [
    {
      title: '외부 사용자 · 요청 준비', description: '같은 공개 주소로 새 연결과 요청을 시작합니다.',
      input: exampleRequest.url, decision: '설정된 DNS: shop.example.com → 203.0.113.10', output: 'Load Balancer · 203.0.113.10:443',
      host: 'HTTP Host로 설정', path: '요청 경로로 설정', query: '검색 조건으로 설정',
    },
    {
      title: 'Load Balancer · 인스턴스 선택', description: '이 예시의 L4 Load Balancer는 암호화된 연결을 전달합니다.',
      input: 'TCP 연결 → 203.0.113.10:443 · TLS 암호화', decision: '정상 인스턴스 ingress-1, ingress-2 중 학습용 순번 선택',
      output: `${state.selectedController}:443`, host: '암호화 · 읽지 않음', path: '암호화 · 읽지 않음', query: '암호화 · 읽지 않음',
    },
    {
      title: 'Ingress Controller · 규칙 적용', description: 'TLS를 여기서 종료하고, Ingress 규칙으로 Service를 찾습니다.',
      input: `${state.selectedController}:443 · TLS 종료 → ${requestLine}`,
      decision: 'Host = shop.example.com + Path /api (Prefix) 일치', output: state.selectedService || '일치하는 규칙 없음',
      host: 'Host 일치 판단 · 유지', path: '/api 접두 경로 판단 · 유지', query: '라우팅 판단 제외 · 유지',
    },
    {
      title: state.blocked ? 'Service · 전달 가능한 대상 없음' : 'Service · 연결된 Pod 선택',
      description: state.blocked ? 'Ready 주소가 0개여서 요청을 Pod로 보낼 수 없습니다.' : '논리적 진입점의 대상 정보에서 준비된 주소 하나를 선택합니다.',
      input: `${state.selectedService} · ${requestLine}`,
      decision: `선택 시 주소 정보 v${state.selectionVersion} · Ready: ${state.selectionCandidates.join(', ') || '없음'} · 학습용 라운드 로빈`,
      output: state.selectedPod ? `Pod ${state.selectedPod.id} · ${state.selectedPod.address}` : '목적지 없음 · 전달 중단',
      host: '값 유지 · Pod 선택에 미사용', path: '값 유지 · Pod 선택에 미사용', query: '값 유지 · Pod 선택에 미사용',
    },
    {
      title: `Pod ${state.selectedPod?.id} · 요청 전달`, description: '선택한 Pod 주소로 원래 요청을 전달한 모의 결과입니다.',
      input: `HTTP → ${state.selectedPod?.address} · ${requestLine}`, decision: '앱이 /api/products와 category=book을 해석',
      output: `Pod ${state.selectedPod?.id} · 도서 상품 조회 처리 대상`,
      host: '원래 Host로 수신', path: '앱이 경로 해석', query: '앱이 category=book 해석',
    },
  ]
  return details[state.step]!
}
