import { describe, expect, it } from 'vitest'
import { buildModel, dramState, initialState, sceneIds, stepsFor } from '../app/utils/semiconductor/model'
import type { Lesson } from '../app/utils/semiconductor/model'
import { flowPaths, pointOnPath, processFlowPaths, samplePlayback, stepDuration, transitionParts, transitionPose } from '../app/utils/semiconductor/playback'

describe('semiconductor playback', () => {
  it('hands off design data separately from silicon and then moves the same die inside its package', () => {
    const state = initialState('industry-chain')
    const handoff = buildModel({ ...state, step: 1 })
    expect(handoff.some(p => p.id === 'design-data')).toBe(true)
    expect(handoff.some(p => p.id === 'industry-wafer')).toBe(false)
    expect(processFlowPaths({ ...state, step: 1 }, 0.5)).toHaveLength(1)
    expect(processFlowPaths({ ...state, step: 3 }, 0.5)).toHaveLength(0)
    const transfer = transitionParts({ ...state, step: 3 }).find(t => t.part.id === 'product-die')!
    expect(transitionPose(transfer, 0).position[0]).toBe(-1.5)
    expect(transitionPose(transfer, 1).position[0]).toBe(1.5)
    const assembly = transitionParts({ ...state, step: 5 })
    for (const p of [0, 0.3, 1]) {
      const die = transitionPose(assembly.find(t => t.part.id === 'product-die')!, p)
      const substrate = transitionPose(assembly.find(t => t.part.id === 'product-substrate')!, p)
      expect(die.position[0]).toBe(substrate.position[0])
      expect(die.position[1]).toBeGreaterThan(substrate.position[1])
    }
    expect(buildModel({ ...state, step: 5 }).find(p => p.id === 'design-data')).toEqual(handoff.find(p => p.id === 'design-data'))
  })

  it('isolates DRAM during retention, shares charge on read, and restores the written state', () => {
    const state = initialState('dram-cell')
    for (const step of [0, 2, 5]) {
      expect(dramState(step).accessOpen).toBe(false)
      expect(processFlowPaths({ ...state, step }, 0.5)).toHaveLength(0)
      expect(buildModel({ ...state, step }).some(p => p.id === 'dram-channel')).toBe(false)
    }
    expect(dramState(2).charge).toBeLessThan(dramState(1).charge)
    expect(dramState(3).charge).toBeLessThan(dramState(2).charge)
    expect(dramState(4).charge).toBe(dramState(1).charge)
    expect(dramState(5).charge).toBe(dramState(4).charge)
    for (const step of [1, 3, 4]) {
      const path = processFlowPaths({ ...state, step }, 0.5)[0]!
      const oxide = buildModel({ ...state, step }).find(p => p.id === 'dram-dielectric')!
      // The route stays below the capacitor dielectric, including when reversed for read.
      for (const p of [0, 0.2, 0.5, 0.8, 1]) expect(pointOnPath(path.points, p)[1]).toBeLessThan(oxide.position[1] - oxide.size[1] / 2)
      expect(path.reverse).toBe(step === 3)
      expect(processFlowPaths({ ...state, step }, 0.1)).toHaveLength(0)
      expect(processFlowPaths({ ...state, step }, 1)).toHaveLength(0)
    }
    const write = transitionParts({ ...state, step: 1 })
    const gate = write.find(t => t.part.id === 'dram-access')!
    const charge = write.find(t => t.part.id === 'dram-charge')!
    expect(gate.end).toBeLessThan(charge.start)
    expect(transitionPose(charge, 0).opacity).toBe(0)
    expect(transitionPose(charge, 1).opacity).toBe(1)
    const read = transitionParts({ ...state, step: 3 }).find(t => t.part.id === 'dram-charge')!
    expect(transitionPose(read, 0).scale[1]).toBeGreaterThan(transitionPose(read, 1).scale[1])
  })

  it('starts at the selected process and stops on its completed final stage', () => {
    const state = { ...initialState('wafer-process'), step: 7 }
    expect(samplePlayback(state, 'process', 0)).toEqual({ step: 7, progress: 0, finished: false })
    expect(samplePlayback(state, 'process', 3200)).toEqual({ step: 8, progress: 0, finished: false })
    expect(samplePlayback(state, 'process', 6400)).toEqual({ step: 8, progress: 1, finished: true })
    expect(samplePlayback(state, 'process', 99999).finished).toBe(true)
  })

  it('preserves protected material during etch and metal lines during CMP', () => {
    const base = initialState('wafer-process')
    const etch = transitionParts({ ...base, step: 5 })
    for (const progress of [0, 0.2, 0.5, 1]) {
      for (const track of etch.filter(t => t.part.id.startsWith('dielectric-'))) expect(transitionPose(track, progress).scale).toEqual([1, 1, 1])
    }
    const cmp = transitionParts({ ...base, step: 8 })
    const removed = cmp.find(t => t.part.id === 'overburden')!
    expect(transitionPose(removed, 0.4).scale[1]).toBeLessThan(1)
    expect(transitionPose(removed, 1).opacity).toBe(0)
    for (const track of cmp.filter(t => t.part.id.startsWith('metal-'))) expect(transitionPose(track, 0.4).scale).toEqual([1, 1, 1])
  })

  it('fills grooves before forming the metal overburden', () => {
    const tracks = transitionParts({ ...initialState('wafer-process'), step: 7 })
    expect(transitionPose(tracks.find(t => t.part.id === 'overburden')!, 0.5).opacity).toBe(0)
    expect(transitionPose(tracks.find(t => t.part.id.startsWith('metal-'))!, 0.6).scale[1]).toBe(1)
  })

  it('keeps the growing oxide boundary attached to the consumed silicon', () => {
    const tracks = transitionParts({ ...initialState('wafer-process'), lesson: 'oxidation', step: 1 })
    const silicon = tracks.find(t => t.part.id === 'silicon')!
    const oxide = tracks.find(t => t.part.id === 'oxide')!
    for (const progress of [0.1, 0.3, 0.6, 1]) {
      const si = transitionPose(silicon, progress)
      const ox = transitionPose(oxide, progress)
      expect(si.position[1] + silicon.part.size[1] * si.scale[1] / 2).toBeCloseTo(ox.position[1] - oxide.part.size[1] * ox.scale[1] / 2)
    }
    const comparison = transitionParts({ ...initialState('wafer-process'), lesson: 'oxidation', step: 2 })
    expect(comparison.find(t => t.part.id === 'silicon')!.from!.size[1]).toBe(1)
    expect(comparison.find(t => t.part.id === 'oxide')!.from).toBeUndefined()
  })

  it('etches NAND layers from the top down and keeps read markers in the channel', () => {
    const s = { ...initialState('nand-3d'), step: 1 }
    const tracks = transitionParts(s)
    const top = tracks.find(t => t.part.id === 'wordline-5-removed-cover')!
    const bottom = tracks.find(t => t.part.id === 'wordline-0-removed-cover')!
    expect(top.start).toBeLessThan(bottom.start)
    expect(transitionPose(top, 0.2).opacity).toBe(0)
    expect(transitionPose(bottom, 0.2).scale[1]).toBe(1)
    for (const path of flowPaths({ ...s, step: 3 }, 0.3)) {
      const mid = pointOnPath(path.points, 0.5)
      expect([-1.4, 1.4]).toContain(mid[0])
      expect(mid[2]).toBe(0)
    }
  })

  it('shows no MOS flow in OFF and reverses HBM request and response paths', () => {
    expect(flowPaths(initialState('mosfet'), 0.3)).toHaveLength(0)
    const on = flowPaths({ ...initialState('mosfet'), voltage: 80 }, 0.3)[0]!
    expect(pointOnPath(on.points, 0)[0]).toBeLessThan(pointOnPath(on.points, 1)[0])
    const hbm = { ...initialState('hbm'), step: 3 }
    expect(flowPaths(hbm, 0.2)[0]!.reverse).toBe(false)
    expect(flowPaths(hbm, 0.7)[0]!.reverse).toBe(true)
    expect(samplePlayback(hbm, 'flow', 12000).finished).toBe(false)
  })

  it('produces finite poses and completes every process without overshooting its stage range', () => {
    for (const scene of sceneIds.filter(s => s !== 'mosfet')) for (const lesson of ['patterning', 'oxidation', 'doping'] as Lesson[]) {
      const state = { ...initialState(scene), lesson }
      const count = stepsFor(scene, lesson).length
      let total = 0
      for (let step = 0; step < count; step++) {
        total += stepDuration(state, step)
        for (const track of transitionParts({ ...state, step })) for (const progress of [0, 0.4, 1]) {
          const pose = transitionPose(track, progress)
          expect(pose.position.every(Number.isFinite)).toBe(true)
          expect(pose.scale.every(v => Number.isFinite(v) && v > 0)).toBe(true)
          expect(pose.opacity).toBeGreaterThanOrEqual(0)
          expect(pose.opacity).toBeLessThanOrEqual(1)
        }
      }
      expect(samplePlayback(state, 'process', total)).toEqual({ step: count - 1, progress: 1, finished: true })
    }
  })
})
