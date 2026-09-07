import { describe, expect, it } from 'vitest'
import { journey, journeyFrame, journeyIds, journeyToken, nextDetailCursor, previousDetailCursor } from '../app/utils/kubernetes/journey'

describe('three Kubernetes journeys', () => {
  it('reveals arrival, decision and result separately and restores the exact prior frame', () => {
    for (const id of journeyIds) {
      const flow = journey(id)
      expect(new Set(flow.steps.map(s => s.id)).size).toBe(flow.steps.length)
      expect(journeyFrame(flow, -1)).toBeNull()
      let cursor = -1
      for (let i = 0; i < flow.steps.length; i++) {
        for (const phase of ['arrival', 'decision', 'result'] as const) {
          cursor = nextDetailCursor(cursor, flow.steps.length)
          const frame = journeyFrame(flow, cursor)!
          expect([frame.index, frame.phase]).toEqual([i, phase])
          expect(frame.scene).toBe(flow.steps[i]![phase])
          expect(frame.scene.items.length).toBeGreaterThan(0)
          expect(frame.scene.items.length).toBeLessThanOrEqual(3)
          expect(journeyFrame(flow, nextDetailCursor(previousDetailCursor(cursor), flow.steps.length))).toEqual(frame)
          expect(frame.done).toBe(cursor === flow.steps.length * 3 - 1)
        }
      }
      expect(nextDetailCursor(cursor, flow.steps.length)).toBe(cursor)
      expect(previousDetailCursor(-1)).toBe(-1)
    }
  })

  it('separates Pod creation, scheduling, runtime execution and readiness', () => {
    const flow = journey('deploy')
    expect(flow.steps.map(s => s.id)).toEqual(['apply', 'admission', 'persist', 'replicaset', 'pod-objects', 'schedule', 'image', 'runtime', 'probe', 'publish'])
    expect(flow.steps.find(s => s.id === 'runtime')?.label).toContain('containerd')
    expect(flow.steps.find(s => s.id === 'runtime')?.result.items[0]?.text).toContain('Not Ready')
    expect(flow.steps.find(s => s.id === 'probe')?.result.items[0]?.status).toBe('ready')
  })

  it('keeps request data intact and treats rules and EndpointSlice as references', () => {
    const flow = journey('request')
    expect(flow.references).toEqual(['dns', 'host', 'path', 'ready-filter'])
    expect(flow.steps.find(s => s.id === 'ready-filter')?.decision.kind).toBe('metadata')
    for (const step of flow.steps) {
      for (const phase of ['arrival', 'decision', 'result']) {
        expect(journeyToken('request', step, phase)).toBe(step.id === 'response' && phase === 'result' ? '200 OK' : 'GET')
      }
    }
    const selected = flow.steps.find(s => s.id === 'pod-choice')!.result.items.filter(i => i.selected)
    expect(selected.map(i => i.text)).toEqual(['Pod B'])
  })

  it('checks the failed readiness path before a conditional rollback and verifies recovery afterwards', () => {
    const steps = journey('debug').steps
    expect(steps.map(s => s.id)).toEqual(['symptom', 'get', 'describe', 'logs', 'inside', 'network-pod', 'network-service', 'network-dns', 'network-ingress', 'rollback', 'verify'])
    expect(steps.find(s => s.id === 'get')?.decision.items.map(i => i.text)).toContain('RESTARTS 0')
    expect(steps.find(s => s.id === 'logs')?.info).toContain('--previous')
    expect(steps.find(s => s.id === 'inside')?.decision.items.map(i => i.text)).toEqual(['/ready → 404', '/health → 200'])
    expect(steps.find(s => s.id === 'rollback')?.result.items.map(i => i.text)).not.toContain('서비스 복구')
    expect(steps.at(-1)?.result.items.map(i => i.text)).toContain('서비스 복구')
  })
})
