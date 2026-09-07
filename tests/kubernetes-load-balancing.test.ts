import { describe, expect, it } from 'vitest'
import { advanceLoadBalancing, describeLoadBalancing, exampleRequest, hasPendingEndpoints, initialLoadBalancing, matchesIngress, readyEndpoints, togglePodReadiness } from '../app/utils/kubernetes/load-balancing'
import type { LoadBalancingState } from '../app/utils/kubernetes/load-balancing'

function finishRequest(state: LoadBalancingState) {
  if (state.done) advanceLoadBalancing(state)
  for (let i = 0; i < 6 && !state.done; i++) advanceLoadBalancing(state)
  expect(state.done).toBe(true)
  return state.selectedPod?.id
}

describe('load balancing learning flow', () => {
  it('moves exactly one hop, chooses a controller and applies Host/Path after TLS termination', () => {
    const state = initialLoadBalancing()
    expect(state.step).toBe(0)
    advanceLoadBalancing(state)
    expect(state.step).toBe(1)
    expect(state.selectedController).toBe('ingress-1')
    expect(describeLoadBalancing(state).host).toContain('읽지 않음')
    advanceLoadBalancing(state)
    expect(state.step).toBe(2)
    expect(state.selectedService).toBe('product-service:80')
    expect(describeLoadBalancing(state).query).toContain('판단 제외')
    advanceLoadBalancing(state)
    expect(state.step).toBe(3)
    expect(state.selectedPod?.address).toBe('10.244.0.11:8080')
    expect(state.pods[0]!.deliveries).toBe(0)
    advanceLoadBalancing(state)
    expect(state.step).toBe(4)
    expect(state.pods[0]!.deliveries).toBe(1)
    expect(describeLoadBalancing(state).input).toContain('GET /api/products?category=book')
    expect(exampleRequest.host).toBe('shop.example.com')
    expect(state.history).toEqual([{ request: 1, target: 'A' }])
  })

  it('cycles A, B, C across new requests and keeps controller rotation separate', () => {
    const state = initialLoadBalancing()
    expect(Array.from({ length: 7 }, () => finishRequest(state))).toEqual(['A', 'B', 'C', 'A', 'B', 'C', 'A'])
    expect(state.history).toHaveLength(6)
    expect(state.history[0]!.request).toBe(2)
    expect(state.selectedController).toBe('ingress-1')
  })

  it('visibly updates readiness metadata before excluding B from subsequent selections', () => {
    const state = initialLoadBalancing()
    expect(finishRequest(state)).toBe('A')
    togglePodReadiness(state, 'B')
    expect(hasPendingEndpoints(state)).toBe(true)
    expect(readyEndpoints(state).map(item => item.id)).toEqual(['A', 'B', 'C'])
    expect(describeLoadBalancing(state).title).toContain('갱신 대기')
    advanceLoadBalancing(state)
    expect(state.step).toBe(4)
    expect(state.requestNumber).toBe(1)
    expect(state.endpointVersion).toBe(2)
    expect(state.endpoints).toHaveLength(3)
    expect(state.endpoints[1]!.ready).toBe(false)
    expect(readyEndpoints(state).map(item => item.id)).toEqual(['A', 'C'])
    expect(Array.from({ length: 4 }, () => finishRequest(state))).toEqual(['C', 'A', 'C', 'A'])
  })

  it('stops with no destination and recovers after a Ready update and a fresh request', () => {
    const state = initialLoadBalancing()
    for (const pod of state.pods) togglePodReadiness(state, pod.id)
    advanceLoadBalancing(state)
    expect(readyEndpoints(state)).toEqual([])
    expect(finishRequest(state)).toBeUndefined()
    expect(state.step).toBe(3)
    expect(state.blocked).toBe(true)
    expect(state.pods.every(pod => pod.deliveries === 0)).toBe(true)
    expect(describeLoadBalancing(state).output).toContain('목적지 없음')
    togglePodReadiness(state, 'B')
    advanceLoadBalancing(state)
    expect(state.blocked).toBe(true)
    expect(finishRequest(state)).toBe('B')
    expect(state.blocked).toBe(false)
  })

  it('preserves an in-flight selection and its evidence when readiness changes', () => {
    const state = initialLoadBalancing()
    for (let i = 0; i < 3; i++) advanceLoadBalancing(state)
    togglePodReadiness(state, 'A')
    advanceLoadBalancing(state)
    expect(state.step).toBe(3)
    expect(state.selectedPod?.id).toBe('A')
    expect(state.selectionVersion).toBe(1)
    expect(state.endpointVersion).toBe(2)
    expect(state.selectionCandidates).toEqual(['A', 'B', 'C'])
    advanceLoadBalancing(state)
    expect(finishRequest(state)).toBe('B')
  })

  it('coalesces rapid toggles and resets counters, readiness, history and selection', () => {
    const state = initialLoadBalancing()
    togglePodReadiness(state, 'B')
    togglePodReadiness(state, 'B')
    expect(hasPendingEndpoints(state)).toBe(false)
    advanceLoadBalancing(state)
    expect(state.step).toBe(1)
    finishRequest(state)
    togglePodReadiness(state, 'C')
    const fresh = initialLoadBalancing()
    expect(fresh.pods.every(pod => pod.ready && !pod.deliveries)).toBe(true)
    expect(fresh.history).toEqual([])
    expect(fresh.selectedPod).toBeNull()
    expect(fresh.requestNumber).toBe(1)
  })

  it('respects the path-element boundary of the /api Prefix rule', () => {
    expect(matchesIngress('shop.example.com', '/api')).toBe(true)
    expect(matchesIngress('shop.example.com', '/api/products')).toBe(true)
    expect(matchesIngress('shop.example.com', '/apiculture')).toBe(false)
    expect(matchesIngress('other.example.com', '/api/products')).toBe(false)
  })
})
