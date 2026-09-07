import { buildModel, dramState, stepsFor, stepState } from './model'
import type { ModelState, Part, Position } from './model'

export type PlaybackMode = 'process' | 'flow'
export interface PlaybackProgress { step: number, progress: number, finished: boolean }
export interface TransitionPart {
  part: Part
  from?: Part
  effect: 'morph' | 'grow' | 'remove' | 'place' | 'fade'
  start: number
  end: number
}
export interface Pose { position: Position, scale: Position, opacity: number, color: string, blend: number }

const clamp = (value: number) => Math.max(0, Math.min(1, value))
export function stepDuration(s: ModelState, step: number): number {
  return s.scene === 'nand-3d' && step === 0 ? 6000 : 3200
}
export function samplePlayback(s: ModelState, mode: PlaybackMode, elapsed: number): PlaybackProgress {
  if (mode === 'flow') return { step: s.step, progress: (Math.max(0, elapsed) % 6000) / 6000, finished: false }
  const last = stepsFor(s.scene, s.lesson).length - 1
  let remaining = Math.max(0, elapsed)
  for (let step = s.step; step <= last; step++) {
    const duration = stepDuration(s, step)
    if (remaining < duration) return { step, progress: remaining / duration, finished: false }
    remaining -= duration
  }
  return { step: last, progress: 1, finished: true }
}

/** Build geometry once per stage. During playback only mesh transforms change. */
export function transitionParts(s: ModelState): TransitionPart[] {
  // The oxidation comparison is an alternative deposition example, not a recipe
  // which converts existing oxide back into silicon.
  const previousStep = s.scene === 'wafer-process' && s.lesson === 'oxidation' && s.step === 2 ? 0 : s.step - 1
  const previous = new Map((s.step > 0 ? buildModel(stepState(s, previousStep)) : []).map(p => [p.id, p]))
  const target = buildModel(s)
  const tracks: TransitionPart[] = []
  for (const part of target) {
    const from = previous.get(part.id)
    previous.delete(part.id)
    const topologyChanged = from && JSON.stringify(from.holes || []) !== JSON.stringify(part.holes || [])
    const track: TransitionPart = { part, from, effect: from ? 'morph' : 'grow', start: 0, end: 0.8 }
    if (s.step === 0 && (['packaging', 'industry-chain', 'dram-cell'].includes(s.scene) || part.id === 'silicon' || part.id === 'substrate')) {
      track.from = part
      track.effect = 'morph'
    }
    if (topologyChanged) {
      // Keep the final perforated plate; remove a solid cover from top to bottom.
      tracks.push({ part: { ...from, id: `${part.id}-removed-cover` }, effect: 'remove', start: 0, end: 0.8 })
      track.from = part
    }
    if (s.scene === 'wafer-process' && s.lesson === 'patterning') {
      if (s.step === 5 && part.id.startsWith('dielectric-')) { track.from = part; track.effect = 'morph' }
      if (s.step === 7) {
        if (part.id === 'overburden') track.start = 0.6
        if (part.id.startsWith('metal-')) track.end = 0.6
      }
    }
    if (s.scene === 'wafer-process' && s.lesson === 'oxidation' && s.step === 1 && part.id === 'oxide') {
      track.effect = 'morph'
      track.from = { ...part, position: [0, 1, 0], size: [7, 0, 4] }
    }
    if (s.scene === 'wafer-process' && s.lesson === 'doping' && part.id.startsWith('ion-')) track.effect = 'place'
    if (s.scene === 'wafer-process' && s.lesson === 'doping' && part.id === 'activated') track.effect = 'fade'
    if (s.scene === 'packaging' && !from && (part.id === 'die' || part.id === 'active-face')) track.effect = 'place'
    if (s.scene === 'nand-3d') {
      const layer = Number(part.id.split('-')[1])
      if (s.step === 0 && Number.isFinite(layer)) {
        track.start = layer * 0.12 + (part.id.startsWith('insulator-') ? 0.06 : 0)
        track.end = track.start + 0.12
      }
      if (s.step === 1 && topologyChanged) {
        const cover = tracks[tracks.length - 1]!
        cover.start = (5 - layer) * 0.13
        cover.end = cover.start + 0.15
      }
      if (s.step === 2 && part.id.startsWith('storage-')) { track.effect = 'fade'; track.end = 0.5 }
      if (s.step === 2 && part.id.startsWith('channel-')) { track.start = 0.45; track.end = 0.85 }
    }
    if (s.scene === 'hbm' && !from) {
      if (/^(dram|tsv|joint)-/.test(part.id)) {
        track.effect = 'place'
        const layer = Number(part.id.split('-')[1])
        track.start = Math.max(0, layer - 1) * 0.2
        track.end = track.start + 0.3
      }
      if (part.id === 'gpu' || part.id === 'interposer') track.effect = 'place'
    }
    if (s.scene === 'industry-chain') {
      if (part.id.startsWith('station-')) track.end = 0.12
      if (s.step === 2 && (part.id.startsWith('wafer-circuit-') || part.id === 'product-die')) track.start = 0.3
      if (s.step === 4 && !from) { track.effect = 'place'; track.start = part.id === 'product-cover' ? 0.5 : 0 }
    }
    if (s.scene === 'dram-cell') {
      // Switch settles before charge sharing starts. Retention never has an open channel.
      if (part.id === 'dram-channel' || part.id === 'dram-access') track.end = 0.12
      if (part.id === 'dram-charge') { track.start = 0.2; track.end = 0.85 }
    }
    tracks.push(track)
  }
  for (const part of previous.values()) tracks.push({ part, effect: 'remove', start: 0, end: part.id === 'dram-channel' ? 0.12 : 0.8 })
  return tracks
}

export function transitionPose(track: TransitionPart, progress: number): Pose {
  const p = clamp((progress - track.start) / (track.end - track.start))
  const eased = p * p * (3 - 2 * p)
  const { part, from, effect } = track
  const pose: Pose = { position: [...part.position], scale: [1, 1, 1], opacity: part.opacity ?? 1, color: from?.color || part.color, blend: eased }
  if (effect === 'morph' && from) {
    pose.opacity = (from.opacity ?? 1) + ((part.opacity ?? 1) - (from.opacity ?? 1)) * eased
    for (const axis of [0, 1, 2] as const) {
      pose.position[axis] = from.position[axis] + (part.position[axis] - from.position[axis]) * eased
      if (part.size[axis] > 0) pose.scale[axis] = (from.size[axis] + (part.size[axis] - from.size[axis]) * eased) / part.size[axis]
    }
    if (pose.scale.some(value => value === 0)) { pose.opacity = 0; pose.scale = pose.scale.map(value => Math.max(0.0001, value)) as Position }
  } else if (effect === 'grow' || effect === 'remove') {
    const fraction = effect === 'grow' ? eased : 1 - eased
    if (part.kind === 'wire') pose.opacity *= fraction
    else {
      pose.scale[1] = Math.max(0.0001, fraction)
      pose.position[1] -= part.size[1] * (1 - fraction) / 2
    }
    if (fraction <= 0) pose.opacity = 0
  } else if (effect === 'place') {
    pose.position[1] += (1 - eased) * 1.8
    pose.opacity *= Math.min(1, p * 5)
  } else if (effect === 'fade') pose.opacity *= eased
  return pose
}

export interface FlowPath { points: Position[], color: string, count: number, reverse?: boolean }
/** Transfers that occur inside a finite lesson, as opposed to a repeating read path. */
export function processFlowPaths(s: ModelState, progress: number): FlowPath[] {
  if (progress < 0.16 || progress > 0.85) return []
  if (s.scene === 'industry-chain' && s.step === 1) return [{ points: [[-4.5, 0.95, 0], [-1.5, 0.95, 0]], color: '#c0a5ff', count: 4 }]
  if (s.scene === 'dram-cell' && dramState(s.step).accessOpen) return [{
    points: [[-3.3, 0.85, 0], [-0.95, 0.85, 0], [0.95, 0.85, 0], [2.6, 0.85, 0], [2.6, 1.45, 0]],
    color: '#fff2a5', count: 6, reverse: s.step === 3,
  }]
  return []
}
export function flowPaths(s: ModelState, phase: number): FlowPath[] {
  if (s.scene === 'mosfet') return s.voltage < 50 ? [] : [{ points: [[-2.3, 1.135, 0], [2.3, 1.135, 0]], color: '#fff2a5', count: 7 }]
  if (s.scene === 'nand-3d') return [-1.4, 1.4].map(x => ({ points: [[x, 0.5, 0], [x, 4.55, 0]], color: '#fff2a5', count: 6 }))
  if (s.scene === 'hbm') {
    const request = phase < 0.5
    return [{ points: [[2.6, 0.8, 0], [2.6, 0.43, 0], [-1.8, 0.43, 0], [-2.6, 0.65, 0], [-2.6, 3.3, 0]], color: request ? '#c0a5ff' : '#fff2a5', count: 5, reverse: !request }]
  }
  return []
}

/** Constant-distance travel along the conceptual route, independent of vertices. */
export function pointOnPath(points: Position[], progress: number): Position {
  const lengths = points.slice(1).map((point, i) => Math.hypot(...point.map((v, axis) => v - points[i]![axis]!)))
  let distance = clamp(progress) * lengths.reduce((a, b) => a + b, 0)
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]! || i === lengths.length - 1) {
      const t = lengths[i]! > 0 ? clamp(distance / lengths[i]!) : 0
      return points[i]!.map((v, axis) => v + (points[i + 1]![axis]! - v) * t) as Position
    }
    distance -= lengths[i]!
  }
  return [...points[0]!]
}
