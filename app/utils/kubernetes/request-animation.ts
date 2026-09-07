import { advanceLoadBalancing, initialLoadBalancing } from './load-balancing'
import type { LoadBalancingState } from './load-balancing'

export type RequestPhase = 'idle' | 'arrival' | 'decision' | 'result'
export interface RequestAnimation {
  step: number
  phase: RequestPhase
  decision: number
  route: LoadBalancingState
}

export function initialRequestAnimation(): RequestAnimation {
  const route = initialLoadBalancing()
  // A is unavailable in this example. Selection still uses the routing model.
  route.pods[0]!.ready = false
  route.endpoints[0]!.ready = false
  return { step: 0, phase: 'idle', decision: 0, route }
}

export function requestAnimationDone(state: RequestAnimation) {
  return state.phase === 'result' && state.route.done
}

// Arrival never computes the destination. Only an explicit advance out of the
// decision phase commits the result, for both manual and automatic playback.
export function advanceRequestAnimation(state: RequestAnimation) {
  if (requestAnimationDone(state)) return
  if (state.phase === 'idle') { state.phase = 'arrival'; return }
  if (state.phase === 'arrival') { state.phase = 'decision'; return }
  if (state.phase === 'decision') {
    const lastDecision = state.step === 2 ? 3 : state.step === 3 ? 1 : 0
    if (state.decision < lastDecision) { state.decision++; return }
    if (state.step > 0) advanceLoadBalancing(state.route)
    state.phase = 'result'
    return
  }
  state.step++
  state.phase = 'arrival'
  state.decision = 0
}

export function requestFrameDuration(state: RequestAnimation) {
  return state.phase === 'arrival' ? 1000 : state.phase === 'decision' ? 1700 : 1500
}
