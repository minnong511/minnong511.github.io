import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { combinedFlowIds, detailedFlow, detailedFlowIds, detailFrame, nextDetailCursor, previousDetailCursor } from '../app/utils/kubernetes/detailed-flows'

const get = (id: Parameters<typeof detailedFlow>[0], step: string, mode: 'self' | 'eks' = 'eks') => detailedFlow(id, mode).steps.find(item => item.id === step)!

describe('combined Kubernetes diagrams', () => {
  it('renders two experiments while retaining all eight detailed sections and bounded scenes', () => {
    const post = readFileSync('content/posts/CI-CD-Docker/kubernetes/2026-09-07-kubernetes-part-7.md', 'utf8')
    expect([...post.matchAll(/diagram="([a-z]+)"/g)].map(match => match[1])).toEqual([...combinedFlowIds])
    for (const id of detailedFlowIds) {
      const flow = detailedFlow(id)
      expect(flow.steps.length).toBeGreaterThanOrEqual(4)
      expect(flow.steps.length).toBeLessThanOrEqual(5)
      expect(new Set(flow.steps.map(step => step.id)).size).toBe(flow.steps.length)
      for (const step of flow.steps) {
        for (const phase of ['arrival', 'decision', 'result'] as const) {
          expect(step[phase].items.length).toBeGreaterThan(0)
          expect(step[phase].items.length).toBeLessThanOrEqual(3)
        }
      }
    }
  })

  it('joins the request and management sections in order without dropping or duplicating steps', () => {
    for (const [id, expected] of [['request', detailedFlowIds.slice(0, 3)], ['managed', detailedFlowIds.slice(3)]] as const) {
      const flow = detailedFlow(id)
      expect(flow.groups?.map(group => group.id)).toEqual(expected)
      expect(flow.steps).toEqual(expected.flatMap(section => detailedFlow(section).steps))
      expect(new Set(flow.steps.map(step => step.id)).size).toBe(flow.steps.length)
      expect(flow.groups?.[0]?.start).toBe(0)
      expect(flow.groups?.at(-1)?.end).toBe(flow.steps.length)
      for (const group of flow.groups!.slice(1)) {
        const before = detailFrame(flow, group.start * 3 - 1)!
        expect(before.phase).toBe('result')
        expect(before.done).toBe(false)
        const after = detailFrame(flow, nextDetailCursor(group.start * 3 - 1, flow.steps.length))!
        expect(after.index).toBe(group.start)
        expect(after.phase).toBe('arrival')
        expect(detailFrame(flow, previousDetailCursor(group.start * 3))).toEqual(before)
      }
    }
    expect(detailedFlow('request').steps).toHaveLength(13)
    expect(detailedFlow('managed').steps).toHaveLength(24)
    expect(detailedFlow('managed', 'self').steps.find(step => step.id === 'repair')?.label).toContain('우리 팀')
  })

  it('keeps each arrival and decision separate from its result, and restores previous scenes', () => {
    for (const id of [...detailedFlowIds, ...combinedFlowIds]) {
      const flow = detailedFlow(id)
      let cursor = -1
      expect(detailFrame(flow, cursor)).toBeNull()
      for (let index = 0; index < flow.steps.length; index++) {
        for (const phase of ['arrival', 'decision', 'result']) {
          cursor = nextDetailCursor(cursor, flow.steps.length)
          const frame = detailFrame(flow, cursor)!
          expect([frame.index, frame.phase]).toEqual([index, phase])
          expect(frame.scene).toBe(flow.steps[index]![phase as 'arrival' | 'decision' | 'result'])
          expect(detailFrame(flow, nextDetailCursor(previousDetailCursor(cursor), flow.steps.length))).toEqual(frame)
        }
      }
      expect(detailFrame(flow, cursor)?.done).toBe(true)
      expect(nextDetailCursor(cursor, flow.steps.length)).toBe(cursor)
      expect(previousDetailCursor(-1)).toBe(-1)
    }
  })

  it('matches Host and Prefix separately before committing the backend', () => {
    expect(get('routing', 'host').decision.items.map(item => item.text)).toEqual(['shop.example.com', 'shop.example.com'])
    expect(get('routing', 'host').result.success).toBe(true)
    expect(get('routing', 'path').result.success).toBe(true)
    expect(get('routing', 'backend').result.items[0]!.text).toBe('product-service:80')
    expect(get('routing', 'path').result.items.some(item => item.text.includes('product-service'))).toBe(false)
  })

  it('references EndpointSlice beside selection and never routes through it as a request hop', () => {
    const flow = detailedFlow('delivery')
    expect(flow.steps.every(step => !step.label.includes('EndpointSlice'))).toBe(true)
    expect(get('delivery', 'ready-filter').decision.kind).toBe('metadata')
    expect(get('delivery', 'ready-filter').result.items.filter(item => item.selected).map(item => item.text)).toEqual(['Pod B', 'Pod C'])
    expect(get('delivery', 'pod-choice').result.items.filter(item => item.selected).map(item => item.text)).toEqual(['Pod B'])
    expect(get('delivery', 'handler').label).not.toContain('Pod B')
    expect(get('delivery', 'handler').activeLabel).toContain('Pod B')
    expect(get('delivery', 'handler').arrival.items[0]!.text).toBe('10.244.0.12:8080')
    expect(get('delivery', 'response').arrival.items.some(item => item.text === '200 OK')).toBe(false)
    expect(get('delivery', 'response').result.items[0]!.text).toBe('200 OK')
  })

  it('separates desired-state storage, ReplicaSet, Pod creation, scheduling and readiness', () => {
    expect(detailedFlow('declare').steps.map(step => step.id)).toEqual(['apply', 'admission', 'persist', 'replicaset', 'pod-objects'])
    expect(get('declare', 'pod-objects').result.items.every(item => item.status === 'pending')).toBe(true)
    expect(get('run', 'schedule').result.items.filter(item => item.selected).map(item => item.text)).toEqual(['node-2'])
    expect(get('run', 'runtime').result.items[0]!.text).toContain('Not Ready')
    expect(get('run', 'probe').result.items[0]!.status).toBe('ready')
    expect(detailedFlow('run').steps.at(-1)!.id).toBe('publish')
  })

  it('changes infrastructure owners while retaining the team responsibility and Kubernetes behavior', () => {
    expect(get('control', 'repair', 'eks').label).toContain('AWS')
    expect(get('control', 'repair', 'self').label).toContain('우리 팀')
    expect(get('update', 'new-node', 'eks').label).toContain('AWS')
    expect(get('update', 'new-node', 'self').label).toContain('우리 팀')
    expect(get('update', 'approve-update', 'eks').label).toContain('우리 팀')
    expect(get('readiness', 'fix-app', 'eks').label).toContain('우리 팀')
    for (const id of ['declare', 'run', 'readiness'] as const) expect(detailedFlow(id, 'eks').steps).toEqual(detailedFlow(id, 'self').steps)
  })

  it('separates failed readiness, propagation, app repair and recovery', () => {
    expect(get('readiness', 'probe-fail').result.items[1]!.status).toBe('unready')
    expect(get('readiness', 'exclude').result.items.map(item => item.text)).toEqual(['Pod A', 'Pod C'])
    expect(get('readiness', 'fix-app').result.items[1]!.text).toContain('대기')
    expect(get('readiness', 'probe-pass').result.items[0]!.status).toBe('ready')
    expect(get('readiness', 'restore').result.items).toHaveLength(3)
  })

  it('shows a replacement Pod after drain rather than moving the existing Pod', () => {
    expect(detailedFlow('update').steps.map(step => step.id)).toEqual(['approve-update', 'new-node', 'drain', 'replacement', 'retire'])
    expect(get('update', 'drain').result.items.map(item => item.text)).toEqual(['기존 Pod 종료', '대체 Pod 필요'])
    expect(get('update', 'replacement').result.items[0]!.text).toBe('새 Pod A')
    expect(get('update', 'replacement').result.items[0]!.status).toBe('ready')
  })
})
