import { describe, expect, it } from 'vitest'
import { buildModel, initialState, sceneIds, stepsFor, stepState } from '../app/utils/semiconductor/model'
import type { Lesson, ModelState } from '../app/utils/semiconductor/model'

const volume = (s: ModelState, prefix: string) => buildModel(s)
  .filter(p => p.id.startsWith(prefix))
  .reduce((sum, p) => sum + p.size.reduce((v, dimension) => v * dimension, 1), 0)

describe('semiconductor teaching states', () => {
  it('exposure changes resist, development opens it, and only etch removes the dielectric', () => {
    const base = initialState('wafer-process')
    const at = (step: number) => ({ ...base, step })
    expect(volume(at(3), 'dielectric')).toBe(volume(at(2), 'dielectric'))
    expect(volume(at(4), 'dielectric')).toBe(volume(at(3), 'dielectric'))
    expect(volume(at(5), 'dielectric')).toBeLessThan(volume(at(4), 'dielectric'))
    expect(buildModel(at(3)).filter(p => p.id.startsWith('exposed'))).toHaveLength(2)
    expect(buildModel(at(4)).some(p => p.id.startsWith('exposed'))).toBe(false)
  })

  it('CMP removes the connecting overburden while retaining the two isolated metal lines', () => {
    const filled = buildModel({ ...initialState('wafer-process'), step: 7 })
    const polished = buildModel({ ...initialState('wafer-process'), step: 8 })
    expect(filled.some(p => p.id === 'overburden')).toBe(true)
    expect(polished.some(p => p.id === 'overburden')).toBe(false)
    const lines = polished.filter(p => p.id.startsWith('metal-'))
    expect(lines).toHaveLength(2)
    expect(lines).toEqual(filled.filter(p => p.id.startsWith('metal-')))
    expect(lines[0]!.position[0] + lines[0]!.size[0] / 2).toBeLessThan(lines[1]!.position[0] - lines[1]!.size[0] / 2)
  })

  it('thermal oxidation consumes silicon; the deposition comparison preserves it', () => {
    const base: ModelState = { ...initialState('wafer-process'), lesson: 'oxidation' }
    const initial = volume(base, 'silicon')
    expect(volume({ ...base, step: 1 }, 'silicon')).toBeLessThan(initial)
    expect(volume({ ...base, step: 2 }, 'silicon')).toBe(initial)
    expect(volume({ ...base, step: 1 }, 'oxide')).toBeGreaterThan(0)
  })

  it('places dopants within the substrate instead of adding a new surface layer', () => {
    for (const step of [1, 2]) {
      const parts = buildModel({ ...initialState('wafer-process'), lesson: 'doping', step })
      const dopants = parts.filter(p => p.id.startsWith('ion-') || p.id === 'activated')
      expect(dopants.length).toBeGreaterThan(0)
      for (const dopant of dopants) {
        expect(dopant.position[1] - dopant.size[1] / 2).toBeGreaterThanOrEqual(0)
        expect(dopant.position[1] + dopant.size[1] / 2).toBeLessThanOrEqual(1)
      }
    }
  })

  it('forms the MOS channel only in the ON state, inside silicon and below the insulator', () => {
    const off = initialState('mosfet')
    expect(buildModel(off).some(p => p.id === 'channel')).toBe(false)
    const on = buildModel(stepState(off, 2))
    const channel = on.find(p => p.id === 'channel')!
    const oxide = on.find(p => p.id === 'gate-oxide')!
    const body = on.find(p => p.id === 'body')!
    const surface = body.position[1] + body.size[1] / 2
    expect(channel.position[1] + channel.size[1] / 2).toBeLessThanOrEqual(oxide.position[1] - oxide.size[1] / 2 + 1e-9)
    for (const region of on.filter(p => ['channel', 'source', 'drain'].includes(p.id))) {
      expect(region.position[1] + region.size[1] / 2).toBeLessThanOrEqual(surface + 1e-9)
      expect(region.position[1] - region.size[1] / 2).toBeGreaterThanOrEqual(body.position[1] - body.size[1] / 2)
    }
    expect(stepState(stepState(off, 2), 0)).toEqual(off)
  })

  it('flips the active face and changes wire connections to bumps', () => {
    const base = { ...initialState('packaging'), step: 4 }
    const wire = buildModel(base)
    const flip = buildModel({ ...base, bonding: 'flip' })
    const relativeFace = (parts: ReturnType<typeof buildModel>) => parts.find(p => p.id === 'active-face')!.position[1] - parts.find(p => p.id === 'die')!.position[1]
    expect(relativeFace(wire)).toBeGreaterThan(0)
    expect(relativeFace(flip)).toBeLessThan(0)
    expect(wire.some(p => p.id.startsWith('wire-'))).toBe(true)
    expect(flip.some(p => p.id.startsWith('wire-'))).toBe(false)
    expect(flip.filter(p => p.id.startsWith('bump-'))).toHaveLength(6)
  })

  it('distinguishes NAND cell layers in one die from HBM multiple dies', () => {
    const nand = buildModel({ ...initialState('nand-3d'), step: 3, selectedLayer: 4 })
    expect(nand.filter(p => p.id === 'substrate')).toHaveLength(1)
    expect(nand.filter(p => p.id.startsWith('wordline-'))).toHaveLength(6)
    expect(nand.find(p => p.id === 'wordline-4')!.label).toContain('선택')
    expect(nand.filter(p => p.kind === 'plate').every(p => p.holes?.length === 2)).toBe(true)
    const hbm = buildModel({ ...initialState('hbm'), step: 3 })
    expect(hbm.filter(p => p.id.startsWith('dram-'))).toHaveLength(4)
    expect(hbm.some(p => p.id === 'gpu')).toBe(true)
    expect(hbm.some(p => p.id === 'interposer')).toBe(true)
  })

  it('supports random step access and finite positive geometry across every lesson', () => {
    for (const scene of sceneIds) for (const lesson of ['patterning', 'oxidation', 'doping'] as Lesson[]) {
      const initial = { ...initialState(scene), lesson }
      const last = stepsFor(scene, lesson).length - 1
      expect(stepState(initial, 999).step).toBe(last)
      expect(stepState(initial, -1).step).toBe(0)
      for (let n = last; n >= 0; n--) {
        const parts = buildModel(stepState(initial, n))
        expect(new Set(parts.map(p => p.id)).size).toBe(parts.length)
        for (const p of parts) {
          expect(p.position.every(Number.isFinite)).toBe(true)
          if (p.kind !== 'wire') expect(p.size.every(d => Number.isFinite(d) && d > 0)).toBe(true)
        }
      }
    }
  })
})
