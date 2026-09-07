// A deterministic, browser-only teaching model. No command ever leaves this module.
export type PodStatus = 'Pending' | 'ContainerCreating' | 'Running' | 'Ready' | 'ImagePullBackOff' | 'ReadinessFailed' | 'Terminating'
export type Resource = 'pods' | 'deployments' | 'rs' | 'svc' | 'endpoints'
export type Focus = Resource | 'API Server' | 'Deployment Controller' | 'ReplicaSet Controller' | 'Scheduler' | 'kubelet' | 'containerd'
export interface Pod {
  name: string
  rs: string
  image: string
  node: string | null
  ip: string
  status: PodStatus
  events: string[]
}
export interface ReplicaSet { name: string, image: string, desired: number }
export interface Revision { revision: number, image: string, rs: string }
export interface Simulation {
  desiredReplicas: number
  image: string
  activeRS: string
  revision: number
  history: Revision[]
  replicaSets: ReplicaSet[]
  pods: Pod[]
  serial: number
  focus: Focus
  selectedPod: string | null
  event: string
  eventId: number
  dirty: boolean
  detected: string | null
  observations: Partial<Record<Resource, number>>
  diagnoses: Partial<Record<'ImagePullBackOff' | 'ReadinessFailed', string>>
  deleted: string[]
  watchRollout: boolean
}
export const nodes = ['worker-1', 'worker-2', 'worker-3']
export const images = { v1: 'demo-api:v1', v2: 'demo-api:v2', missing: 'demo-api:missing', unready: 'demo-api:unready' }
export const MAX_REPLICAS = 8
export const statusColors: Record<PodStatus, string> = {
  Pending: '#b6a4ff', ContainerCreating: '#f6ca75', Running: '#72b9ff', Ready: '#6ee7ba',
  ImagePullBackOff: '#ff8b93', ReadinessFailed: '#ffc071', Terminating: '#ee94c3',
}
export function readyPods(s: Simulation) { return s.pods.filter(p => p.status === 'Ready') }
export function actualPods(s: Simulation) { return s.pods.filter(p => p.status !== 'Terminating') }
export function endpoints(s: Simulation) { return readyPods(s).map(p => `${p.ip}:8080`) }
export function rolloutComplete(s: Simulation) {
  return !s.dirty && s.pods.length === s.desiredReplicas
    && s.pods.every(p => p.rs === s.activeRS && p.status === 'Ready')
    && s.replicaSets.every(rs => rs.desired === (rs.name === s.activeRS ? s.desiredReplicas : 0))
}
export function initialSimulation(replicas = 3): Simulation {
  const rs = 'demo-api-rs-1'
  return {
    desiredReplicas: replicas, image: images.v1, activeRS: rs, revision: 1,
    history: [{ revision: 1, image: images.v1, rs }],
    replicaSets: [{ name: rs, image: images.v1, desired: replicas }],
    pods: Array.from({ length: replicas }, (_, i) => ({
      name: `demo-api-${String.fromCharCode(97 + i)}`, rs, image: images.v1,
      node: nodes[i % nodes.length]!, ip: `10.42.0.${i + 11}`, status: 'Ready',
      events: ['Scheduled: Worker Node 배정', 'Started: containerd가 app 컨테이너 실행', 'Ready: readiness probe 통과'],
    })),
    serial: replicas, focus: 'deployments', selectedPod: null,
    event: 'demo-api의 원하는 복제본과 Ready 복제본이 일치합니다.', eventId: 0,
    dirty: false, detected: null, observations: {}, diagnoses: {}, deleted: [], watchRollout: false,
  }
}
function report(s: Simulation, focus: Focus, message: string) {
  s.focus = focus
  s.event = message
  s.eventId++
  return `[${focus}] ${message}`
}
function podReport(s: Simulation, p: Pod, focus: Focus, message: string) {
  p.events.push(message)
  s.selectedPod = p.name
  return report(s, focus, `${p.name}: ${message}`)
}
function imageFailure(image: string) {
  if (image === images.unready) return 'ReadinessFailed'
  return image === images.v1 || image === images.v2 ? null : 'ImagePullBackOff'
}
function terminate(s: Simulation, pod: Pod) {
  pod.status = 'Terminating'
  return podReport(s, pod, 'kubelet', 'Terminating. 종료를 시작하고 Service의 Ready Endpoints에서 제외합니다.')
}
function setImage(s: Simulation, image: string) {
  s.revision++
  let rs = s.replicaSets.find(rs => rs.image === image)
  if (!rs) {
    rs = { name: `demo-api-rs-${s.revision}`, image, desired: 0 }
    s.replicaSets.push(rs)
  }
  s.image = image
  s.activeRS = rs.name
  s.history.push({ revision: s.revision, image, rs: rs.name })
  s.dirty = true
  s.detected = null
}

/** Advance one visible step, so commands, scene and mission checks share one state. */
export function tick(s: Simulation): string | null {
  const terminating = s.pods.find(p => p.status === 'Terminating')
  if (terminating) {
    s.pods = s.pods.filter(p => p !== terminating)
    return report(s, 'kubelet', `${terminating.name} 삭제 완료. Desired=${s.desiredReplicas}, Actual=${actualPods(s).length}.`)
  }
  if (s.dirty) {
    s.dirty = false
    return report(s, 'Deployment Controller', `API Server에서 spec 확인. image=${s.image}, desired=${s.desiredReplicas}. ReplicaSet 목표를 조정합니다.`)
  }
  const active = s.replicaSets.find(rs => rs.name === s.activeRS)!
  const old = s.replicaSets.filter(rs => rs !== active)
  const all = actualPods(s)
  const desiredTotal = s.replicaSets.reduce((sum, rs) => sum + rs.desired, 0)
  // Scale down first; during rollout only retire old Ready pods when capacity permits.
  if (desiredTotal > s.desiredReplicas) {
    const surplus = old.find(rs => rs.desired > 0 && (
      all.some(p => p.rs === rs.name && p.status !== 'Ready') || readyPods(s).length > s.desiredReplicas
    )) || (active.desired > s.desiredReplicas ? active : undefined)
    if (surplus) {
      surplus.desired--
      return report(s, 'Deployment Controller', `${surplus.name}의 목표를 ${surplus.desired}개로 줄입니다. maxUnavailable=0.`)
    }
  }
  for (const rs of s.replicaSets) {
    const members = all.filter(p => p.rs === rs.name)
    if (members.length > rs.desired) {
      const pod = members.find(p => p.status !== 'Ready') || members[members.length - 1]!
      return terminate(s, pod)
    }
    if (members.length < rs.desired) {
      const key = `${rs.name}:${rs.desired}:${members.length}`
      if (s.detected !== key) {
        s.detected = key
        return report(s, 'ReplicaSet Controller', `${rs.name}: desired=${rs.desired}, actual=${members.length}. 부족한 Pod를 감지했습니다.`)
      }
      s.detected = null
      const serial = ++s.serial
      const pod: Pod = {
        name: `demo-api-${serial <= 26 ? String.fromCharCode(96 + serial) : `p${serial}`}`,
        rs: rs.name, image: rs.image, node: null, ip: `10.42.${Math.floor((serial + 10) / 250)}.${(serial + 10) % 250 + 1}`,
        status: 'Pending', events: [],
      }
      s.pods.push(pod)
      return podReport(s, pod, 'ReplicaSet Controller', 'API Server에 새 Pod 객체 생성. Pending, 아직 배정된 Node가 없습니다.')
    }
  }
  const pending = s.pods.find(p => p.status === 'Pending')
  if (pending) {
    if (!pending.node) {
      pending.node = [...nodes].sort((a, b) => all.filter(p => p.node === a).length - all.filter(p => p.node === b).length)[0]!
      return podReport(s, pending, 'Scheduler', `${pending.node} 선택. 배정 결과를 API Server에 기록합니다.`)
    }
    pending.status = 'ContainerCreating'
    return podReport(s, pending, 'kubelet', 'ContainerCreating. CRI를 통해 containerd에 이미지와 컨테이너 준비를 요청합니다.')
  }
  const creating = s.pods.find(p => p.status === 'ContainerCreating')
  if (creating) {
    if (imageFailure(creating.image) === 'ImagePullBackOff') {
      creating.status = 'ImagePullBackOff'
      return podReport(s, creating, 'containerd', `Failed to pull image "${creating.image}": not found (모의 레지스트리). ImagePullBackOff, 재시도 대기.`)
    }
    creating.status = 'Running'
    return podReport(s, creating, 'containerd', '컨테이너 시작. Running, Ready=False. 다음 단계에서 readiness를 검사합니다.')
  }
  const running = s.pods.find(p => p.status === 'Running')
  if (running) {
    if (imageFailure(running.image) === 'ReadinessFailed') {
      running.status = 'ReadinessFailed'
      return podReport(s, running, 'kubelet', 'Readiness probe failed: HTTP 503 /ready. Running 0/1 유지, 재시작 없이 Ready Endpoints에서 제외됩니다.')
    }
    running.status = 'Ready'
    return podReport(s, running, 'kubelet', `readiness probe 통과. Ready=True → EndpointSlice Controller가 연결 대상을 갱신합니다 (${endpoints(s).length}개).`)
  }
  // One surge replica, then wait for readiness before retiring an old replica.
  if (active.desired < s.desiredReplicas && desiredTotal < s.desiredReplicas + (old.some(rs => rs.desired > 0) ? 1 : 0)) {
    active.desired++
    return report(s, 'Deployment Controller', `${active.name}의 목표를 ${active.desired}개로 늘립니다. maxSurge=1.`)
  }
  if (s.watchRollout && rolloutComplete(s)) {
    s.watchRollout = false
    return report(s, 'deployments', 'deployment "demo-api" successfully rolled out')
  }
  return null
}

export type Command =
  | { kind: 'get', resource: Resource }
  | { kind: 'describe' | 'delete', name: string }
  | { kind: 'scale', name: string, replicas: number }
  | { kind: 'image', name: string, image: string }
  | { kind: 'status' | 'undo', name: string }
export type Parsed = { command: Command } | { error: string }
const namePattern = '[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?'
export function parseCommand(input: string): Parsed {
  if (input.length > 300 || /[^\x20-\x7e\t]/.test(input)) return { error: '한 줄의 kubectl 명령만 입력해 주세요 (최대 300자).' }
  const line = input.trim().replace(/[ \t]+/g, ' ')
  // No shell grammar, chaining, interpolation, redirection or arbitrary flags.
  if (/[;&|`$<>\\"'(){}[\]]/.test(line)) return { error: '셸 문법과 명령 연결은 지원하지 않습니다.' }
  let match = /^kubectl get (pods?|deployments?|deploy|rs|replicasets?|svc|services?|endpoints)$/.exec(line)
  if (match) {
    const aliases: Record<string, Resource> = { pod: 'pods', pods: 'pods', deploy: 'deployments', deployment: 'deployments', deployments: 'deployments', rs: 'rs', replicaset: 'rs', replicasets: 'rs', svc: 'svc', service: 'svc', services: 'svc', endpoints: 'endpoints' }
    return { command: { kind: 'get', resource: aliases[match[1]!]! } }
  }
  match = new RegExp(`^kubectl (describe|delete) pod (${namePattern})$`).exec(line)
  if (match) return { command: { kind: match[1] as 'describe' | 'delete', name: match[2]! } }
  match = new RegExp(`^kubectl scale (?:deployment|deploy)(?:/| )(${namePattern}) --replicas(?:=| )([0-9]+)$`).exec(line)
  if (match) {
    const replicas = Number(match[2])
    if (!Number.isSafeInteger(replicas) || replicas > MAX_REPLICAS) return { error: `학습 모형의 복제본 범위는 0~${MAX_REPLICAS}입니다.` }
    return { command: { kind: 'scale', name: match[1]!, replicas } }
  }
  match = new RegExp(`^kubectl set image (?:deployment|deploy)/(${namePattern}) app=([a-zA-Z0-9][a-zA-Z0-9./_:@-]*)$`).exec(line)
  if (match) return { command: { kind: 'image', name: match[1]!, image: match[2]! } }
  match = new RegExp(`^kubectl rollout (status|undo) (?:deployment|deploy)/(${namePattern})$`).exec(line)
  if (match) return { command: { kind: match[1] as 'status' | 'undo', name: match[2]! } }
  return { error: '지원하지 않는 명령입니다. 아래 「지원 명령」 또는 미션 힌트를 확인해 주세요.' }
}
function table(headers: string[], rows: string[][]) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => r[i]?.length || 0)) + 3)
  return [headers, ...rows].map(row => row.map((cell, i) => cell.padEnd(widths[i]!)).join('').trimEnd()).join('\n')
}
export function displayStatus(p: Pod) { return p.status === 'Ready' || p.status === 'ReadinessFailed' ? 'Running' : p.status }
export function phase(p: Pod) { return ['Ready', 'ReadinessFailed', 'Running', 'Terminating'].includes(p.status) ? 'Running' : 'Pending' }
export function executeCommand(s: Simulation, input: string): { ok: boolean, output: string } {
  const parsed = parseCommand(input)
  if ('error' in parsed) return { ok: false, output: parsed.error }
  const c = parsed.command
  const ok = (output: string) => ({ ok: true, output })
  const fail = (output: string) => ({ ok: false, output })
  if (c.kind === 'get') {
    s.observations[c.resource] = (s.observations[c.resource] || 0) + 1
    report(s, c.resource, `${c.resource} 조회. 해당 리소스와 연결을 장면에 강조합니다.`)
    if (c.resource === 'pods') return ok(table(['NAME', 'READY', 'STATUS', 'NODE', 'IMAGE'], s.pods.map(p => [p.name, p.status === 'Ready' ? '1/1' : '0/1', displayStatus(p), p.node || '<none>', p.image])))
    if (c.resource === 'deployments') return ok(table(['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'IMAGE'], [['demo-api', `${readyPods(s).length}/${s.desiredReplicas}`, String(actualPods(s).filter(p => p.rs === s.activeRS).length), String(readyPods(s).length), s.image]]))
    if (c.resource === 'rs') return ok(table(['NAME', 'DESIRED', 'CURRENT', 'READY', 'IMAGE'], s.replicaSets.map(rs => [rs.name, String(rs.desired), String(actualPods(s).filter(p => p.rs === rs.name).length), String(readyPods(s).filter(p => p.rs === rs.name).length), rs.image])))
    if (c.resource === 'svc') return ok(table(['NAME', 'TYPE', 'CLUSTER-IP', 'PORT(S)', 'SELECTOR'], [['demo-api', 'ClusterIP', '10.96.0.80', '80/TCP → 8080', 'app=demo-api']]))
    return ok(table(['NAME', 'ENDPOINTS'], [['demo-api', endpoints(s).join(',') || '<none>']]) + '\n모형은 Ready 주소를 표시합니다. 현대 Kubernetes의 연결 대상 관리는 EndpointSlice가 중심입니다.')
  }
  if (c.kind === 'describe' || c.kind === 'delete') {
    const p = s.pods.find(p => p.name === c.name)
    if (!p) return fail(`Error from server (NotFound): pods "${c.name}" not found`)
    if (c.kind === 'delete') {
      if (p.status === 'Terminating') return fail(`pod "${p.name}" is already terminating`)
      s.deleted.push(p.name)
      terminate(s, p)
      return ok(`pod "${p.name}" deleted (종료 요청 접수)\n${s.event}`)
    }
    s.selectedPod = p.name
    report(s, 'pods', `${p.name} 상세 조회. 소유 ReplicaSet, Node, Ready 조건, Events를 확인합니다.`)
    if (p.status === 'ImagePullBackOff' || p.status === 'ReadinessFailed') s.diagnoses[p.status] = p.name
    return ok(`Name: ${p.name}\nNamespace: lab\nControlled By: ReplicaSet/${p.rs}\nLabels: app=demo-api\nNode: ${p.node || '<none>'}\nIP: ${p.node ? p.ip : '<none>'}\nImage: ${p.image}\nStatus (phase): ${phase(p)}\nContainer status: ${displayStatus(p)}\nReady: ${p.status === 'Ready' ? 'True' : 'False'}\nReadiness: HTTP GET :8080/ready\nRestarts: 0\nEvents:\n${p.events.map(e => `  ${e}`).join('\n')}`)
  }
  if (c.name !== 'demo-api') return fail(`Error from server (NotFound): deployments.apps "${c.name}" not found`)
  if (c.kind === 'scale') {
    s.desiredReplicas = c.replicas
    s.dirty = true
    s.detected = null
    report(s, 'API Server', `spec.replicas=${c.replicas} 저장 (모의 etcd). 컨트롤러가 뒤이어 조정합니다.`)
    return ok(`deployment.apps/demo-api scaled\n${s.event}`)
  }
  if (c.kind === 'image') {
    if (c.image === s.image) return ok(`deployment.apps/demo-api image unchanged\n${report(s, 'deployments', 'Pod template이 같아 새 롤아웃이 생기지 않습니다.')}`)
    setImage(s, c.image)
    return ok(`deployment.apps/demo-api image updated\n${report(s, 'API Server', `Pod template.image=${c.image} 저장 (모의 etcd). revision=${s.revision}.`)}`)
  }
  if (c.kind === 'undo') {
    const previous = s.history[s.history.length - 2]
    if (!previous) return fail('error: no rollout history found. 되돌릴 이전 Pod template이 없습니다.')
    setImage(s, previous.image)
    return ok(`deployment.apps/demo-api rolled back\n${report(s, 'API Server', `이전 Pod template ${previous.image} 복원. replicas=${s.desiredReplicas}는 유지합니다.`)}`)
  }
  s.watchRollout = !rolloutComplete(s)
  const failed = s.pods.find(p => p.rs === s.activeRS && (p.status === 'ImagePullBackOff' || p.status === 'ReadinessFailed'))
  report(s, 'deployments', rolloutComplete(s) ? '롤아웃 완료.' : '롤아웃 진행 상태를 확인합니다.')
  return ok(rolloutComplete(s) ? 'deployment "demo-api" successfully rolled out'
    : `Waiting for deployment "demo-api" rollout: ${readyPods(s).filter(p => p.rs === s.activeRS).length}/${s.desiredReplicas} updated replicas are Ready.\n${failed ? `진행 지연: ${failed.name} ${failed.status}. describe로 확인하거나 undo로 복구하세요.` : '완료되면 이 터미널에 결과를 추가합니다.'}`)
}
