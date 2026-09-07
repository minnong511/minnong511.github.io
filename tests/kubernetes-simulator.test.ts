import { describe, expect, it } from 'vitest'
import { actualPods, displayStatus, endpoints, executeCommand, images, initialSimulation, parseCommand, phase, readyPods, rolloutComplete, tick } from '../app/utils/kubernetes/simulator'
import type { Simulation } from '../app/utils/kubernetes/simulator'
import { missionComplete, missionHint, startMission } from '../app/utils/kubernetes/missions'

function settle(s: Simulation, check?: () => void) {
  for (let i = 0; i < 600; i++) {
    const event = tick(s)
    check?.()
    if (!event) return
  }
  throw new Error('Simulation failed to settle')
}
function run(s: Simulation, command: string) {
  const result = executeCommand(s, command)
  expect(result.ok, result.output).toBe(true)
  return result.output
}

describe('safe kubectl parser', () => {
  it.each([
    'kubectl get pods; touch /tmp/pwn', 'kubectl get pods && whoami', 'kubectl get pods | cat',
    'kubectl get pods > file', 'kubectl get $(whoami)', 'kubectl get `whoami`',
    'kubectl get pods\nwhoami', 'kubectl exec pod -- sh', 'curl localhost',
    'kubectl scale deployment demo-api --replicas=-1', 'kubectl scale deployment demo-api --replicas=1.5',
    'kubectl scale deployment demo-api --replicas=99999999999999', 'kubectl get pods --all-namespaces',
    'kubectl delete pod demo-api-a --force', 'kubectl get pods\u0000', '<script>alert(1)</script>',
  ])('rejects unsupported input without changing state: %s', command => {
    const s = initialSimulation()
    const before = JSON.stringify(s)
    expect(executeCommand(s, command).ok).toBe(false)
    expect(JSON.stringify(s)).toBe(before)
  })
  it('accepts semantic aliases and whitespace', () => {
    expect(parseCommand('  kubectl   get\tpod  ')).toEqual({ command: { kind: 'get', resource: 'pods' } })
    expect(parseCommand('kubectl scale deploy/demo-api --replicas 5')).toEqual({ command: { kind: 'scale', name: 'demo-api', replicas: 5 } })
  })
  it('reports missing resources and missing rollback history without mutation', () => {
    const s = initialSimulation()
    const before = JSON.stringify(s)
    for (const command of ['kubectl describe pod missing', 'kubectl delete pod missing', 'kubectl scale deployment missing --replicas=5', 'kubectl set image deployment/missing app=demo-api:v2', 'kubectl rollout status deployment/missing', 'kubectl rollout undo deployment/demo-api']) expect(executeCommand(s, command).ok).toBe(false)
    expect(JSON.stringify(s)).toBe(before)
  })
})

describe('reconciliation and service membership', () => {
  it('shows every recovery stage and replaces the deleted pod with a new identity', () => {
    const s = initialSimulation()
    const oldIP = s.pods[1]!.ip
    run(s, 'kubectl delete pod demo-api-b')
    expect(s.pods[1]!.status).toBe('Terminating')
    expect(endpoints(s)).not.toContain(`${oldIP}:8080`)
    expect(tick(s)).toContain('삭제 완료')
    expect(s.pods).toHaveLength(2)
    expect(tick(s)).toContain('desired=3, actual=2')
    const stages: string[] = []
    settle(s, () => { const p = s.pods.find(p => !['demo-api-a', 'demo-api-c'].includes(p.name)); if (p) stages.push(`${p.status}:${p.node || 'unassigned'}`) })
    expect(stages).toContain('Pending:unassigned')
    expect(stages.some(x => x.startsWith('Pending:worker'))).toBe(true)
    expect(stages.some(x => x.startsWith('ContainerCreating:'))).toBe(true)
    expect(stages.some(x => x.startsWith('Running:'))).toBe(true)
    expect(stages.some(x => x.startsWith('Ready:'))).toBe(true)
    expect(rolloutComplete(s)).toBe(true)
    expect(endpoints(s)).toHaveLength(3)
    expect(s.pods.some(p => p.name === 'demo-api-b' || p.ip === oldIP)).toBe(false)
  })
  it('converges after rapid deletes and changing scale targets, including zero', () => {
    const s = initialSimulation()
    run(s, 'kubectl delete pod demo-api-a')
    expect(executeCommand(s, 'kubectl delete pod demo-api-a').ok).toBe(false)
    run(s, 'kubectl delete pod demo-api-b')
    run(s, 'kubectl scale deployment demo-api --replicas=8')
    tick(s)
    run(s, 'kubectl scale deployment demo-api --replicas=5')
    settle(s)
    expect(rolloutComplete(s)).toBe(true)
    expect(s.pods).toHaveLength(5)
    expect(new Set(s.pods.map(p => p.name)).size).toBe(5)
    run(s, 'kubectl scale deployment demo-api --replicas=0')
    settle(s)
    expect(endpoints(s)).toEqual([])
    expect(s.pods).toEqual([])
    run(s, 'kubectl scale deployment demo-api --replicas=3')
    settle(s)
    expect(readyPods(s)).toHaveLength(3)
  })
  it('rolls out using one surge and retains old capacity until readiness', () => {
    const s = initialSimulation()
    run(s, 'kubectl set image deployment/demo-api app=demo-api:v2')
    run(s, 'kubectl rollout status deployment/demo-api')
    const events: string[] = []
    for (let i = 0; i < 200; i++) {
      const event = tick(s)
      expect(actualPods(s).length).toBeLessThanOrEqual(4)
      expect(readyPods(s).length).toBeGreaterThanOrEqual(3)
      if (!event) break
      events.push(event)
    }
    expect(events.some(e => e.includes('successfully rolled out'))).toBe(true)
    expect(s.pods.every(p => p.image === images.v2)).toBe(true)
    expect(s.replicaSets[0]!.desired).toBe(0)
    const revision = s.revision
    run(s, 'kubectl set image deployment/demo-api app=demo-api:v2')
    expect(s.revision).toBe(revision)
  })
  it.each([images.missing, images.unready])('diagnoses and rolls back %s without losing healthy endpoints', image => {
    const s = initialSimulation()
    run(s, `kubectl set image deployment/demo-api app=${image}`)
    settle(s)
    expect(rolloutComplete(s)).toBe(false)
    expect(endpoints(s)).toHaveLength(3)
    const p = s.pods.find(p => p.image === image)!
    const info = run(s, `kubectl describe pod ${p.name}`)
    expect(info).toContain(image === images.unready ? 'Readiness probe failed' : 'Failed to pull image')
    expect(phase(p)).toBe(image === images.unready ? 'Running' : 'Pending')
    if (image === images.unready) expect(displayStatus(p)).toBe('Running')
    expect(run(s, 'kubectl rollout status deployment/demo-api')).toContain('진행 지연')
    run(s, 'kubectl rollout undo deployment/demo-api')
    settle(s)
    expect(s.image).toBe(images.v1)
    expect(rolloutComplete(s)).toBe(true)
    expect(s.replicaSets).toHaveLength(2)
  })
  it('undo restores the previous template rather than an old replica count', () => {
    const s = initialSimulation()
    run(s, 'kubectl set image deployment/demo-api app=demo-api:v2')
    settle(s)
    run(s, 'kubectl scale deployment demo-api --replicas=5')
    settle(s)
    run(s, 'kubectl rollout undo deployment/demo-api')
    settle(s)
    expect(s.image).toBe(images.v1)
    expect(s.desiredReplicas).toBe(5)
    expect(readyPods(s)).toHaveLength(5)
  })
  it('all five reads reflect state and select the corresponding scene focus', () => {
    const s = initialSimulation()
    for (const resource of ['pods', 'deployments', 'rs', 'svc', 'endpoints'] as const) {
      expect(run(s, `kubectl get ${resource}`)).toContain('demo-api')
      expect(s.focus).toBe(resource)
    }
    expect(s.pods).toHaveLength(3)
  })
})

describe('guided missions', () => {
  it('moves the hint to the next action after inspection', () => {
    const s = startMission(1)
    expect(missionHint(1, s).key).toBe('inspect')
    run(s, 'kubectl get pod')
    expect(missionHint(1, s).command).toBe('kubectl delete pod demo-api-b')
  })
  it('evaluates all eight exercises using observed state and diagnosis evidence', () => {
    for (let index = 0; index < 8; index++) {
      const s = startMission(index)
      expect(missionComplete(index, s)).toBe(false)
      let answer = ''
      if (index === 0) run(s, 'kubectl get pod')
      if (index === 1) { run(s, 'kubectl delete pod demo-api-c'); settle(s) }
      if (index === 2) {
        // No command-string match: a different UI could make this same state change.
        s.desiredReplicas = 5
        expect(missionComplete(index, s)).toBe(false)
        settle(s)
      }
      if (index === 3) { run(s, 'kubectl set image deploy/demo-api app=demo-api:v2'); settle(s) }
      if (index === 4 || index === 5) {
        const failed = s.pods.find(p => p.status === (index === 4 ? 'ImagePullBackOff' : 'ReadinessFailed'))!
        run(s, `kubectl describe pod ${failed.name}`)
        run(s, 'kubectl get endpoints')
        expect(missionComplete(index, s, 'scheduling')).toBe(false)
        answer = index === 4 ? 'image' : 'readiness'
      }
      if (index === 6) { run(s, 'kubectl get services'); run(s, 'kubectl get endpoints') }
      if (index === 7) { run(s, 'kubectl rollout undo deploy/demo-api'); settle(s) }
      expect(missionComplete(index, s, answer), `mission ${index + 1}`).toBe(true)
    }
  })
})
