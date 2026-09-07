import { describe, expect, it } from 'vitest'
import { advanceRequestAnimation, initialRequestAnimation, requestAnimationDone, requestFrameDuration } from '../app/utils/kubernetes/request-animation'
import type { RequestAnimation } from '../app/utils/kubernetes/request-animation'

function advanceTo(state: RequestAnimation, step: number, phase: RequestAnimation['phase'], decision = 0) {
  for (let count = 0; count < 30; count++) {
    if (state.step === step && state.phase === phase && state.decision === decision) return
    advanceRequestAnimation(state)
  }
  throw new Error(`Did not reach ${step}/${phase}/${decision}`)
}

describe('request animation disclosure', () => {
  it('starts idle and creates a request without choosing any destination', () => {
    const state = initialRequestAnimation()
    expect(state.phase).toBe('idle')
    advanceRequestAnimation(state)
    expect([state.step, state.phase]).toEqual([0, 'arrival'])
    expect(state.route.selectedController).toBeNull()
    expect(state.route.selectedService).toBeNull()
    expect(state.route.selectedPod).toBeNull()
  })

  it('holds arrival and judgment before committing the Load Balancer result', () => {
    const state = initialRequestAnimation()
    advanceTo(state, 1, 'arrival')
    expect(state.route.selectedController).toBeNull()
    advanceRequestAnimation(state)
    expect(state.phase).toBe('decision')
    expect(state.route.selectedController).toBeNull()
    advanceRequestAnimation(state)
    expect(state.phase).toBe('result')
    expect(state.route.selectedController).toBe('ingress-1')
    expect(state.step).toBe(1)
    advanceRequestAnimation(state)
    expect([state.step, state.phase]).toEqual([2, 'arrival'])
    expect(state.route.selectedService).toBeNull()
  })

  it('shows Host comparison, Host check, path comparison and path check before the Service', () => {
    const state = initialRequestAnimation()
    advanceTo(state, 2, 'decision')
    for (let frame = 0; frame < 4; frame++) {
      expect(state.decision).toBe(frame)
      expect(state.phase).toBe('decision')
      expect(state.route.selectedService).toBeNull()
      advanceRequestAnimation(state)
    }
    expect(state.phase).toBe('result')
    expect(state.route.selectedService).toBe('product-service:80')
  })

  it('opens endpoint information without adding a route hop and selects only a Ready Pod', () => {
    const state = initialRequestAnimation()
    advanceTo(state, 3, 'decision')
    expect(state.route.endpoints.map(pod => [pod.id, pod.ready])).toEqual([['A', false], ['B', true], ['C', true]])
    advanceRequestAnimation(state)
    expect(state.decision).toBe(1)
    expect(state.step).toBe(3)
    expect(state.route.selectedPod).toBeNull()
    advanceRequestAnimation(state)
    expect(state.route.selectedPod?.id).toBe('B')
    expect(state.route.selectionCandidates).toEqual(['B', 'C'])
    expect(state.route.pods.every(pod => pod.deliveries === 0)).toBe(true)
  })

  it('withholds the response until Pod judgment is advanced and stops at completion', () => {
    const state = initialRequestAnimation()
    advanceTo(state, 4, 'arrival')
    expect(requestAnimationDone(state)).toBe(false)
    advanceRequestAnimation(state)
    expect(state.phase).toBe('decision')
    expect(requestAnimationDone(state)).toBe(false)
    advanceRequestAnimation(state)
    expect(requestAnimationDone(state)).toBe(true)
    expect(state.route.pods.find(pod => pod.id === 'B')?.deliveries).toBe(1)
    const finished = structuredClone(state)
    for (let index = 0; index < 5; index++) advanceRequestAnimation(state)
    expect(state).toEqual(finished)
  })

  it('reserves time for movement, each decision and its separate result', () => {
    const state = initialRequestAnimation()
    advanceTo(state, 1, 'arrival')
    expect(requestFrameDuration(state)).toBeGreaterThanOrEqual(1000)
    advanceRequestAnimation(state)
    expect(requestFrameDuration(state)).toBeGreaterThanOrEqual(1500)
    advanceRequestAnimation(state)
    expect(requestFrameDuration(state)).toBeGreaterThanOrEqual(1500)
  })

  it('finishes without inventing a Pod response when no Ready endpoints exist', () => {
    const state = initialRequestAnimation()
    for (const pod of state.route.pods) pod.ready = false
    for (const endpoint of state.route.endpoints) endpoint.ready = false
    advanceTo(state, 3, 'result', 1)
    expect(state.route.blocked).toBe(true)
    expect(requestAnimationDone(state)).toBe(true)
    expect(state.route.selectedPod).toBeNull()
    advanceRequestAnimation(state)
    expect(state.step).toBe(3)
  })
})
