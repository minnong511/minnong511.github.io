<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { actualPods, displayStatus, endpoints, executeCommand, readyPods, statusColors, tick } from '~/utils/kubernetes/simulator'
import { missionComplete, missionHint, missions, startMission } from '~/utils/kubernetes/missions'
import type { createKubernetesRenderer } from '~/utils/kubernetes/renderer'

const id = useId()
const missionIndex = ref(0)
const state = ref(startMission(0))
const mission = computed(() => missions[missionIndex.value]!)
const hint = computed(() => missionHint(missionIndex.value, state.value))
const hintLevel = ref(0)
const assistMode = ref<'commands' | 'hints'>('commands')
const diagnosis = ref('')
const panels = [{ key: 'mission', label: '미션 · 힌트' }, { key: 'resources', label: '리소스' }, { key: 'commands', label: '명령어' }] as const
const panel = ref<typeof panels[number]['key']>('mission')
const mobileSidePanel = ref(false)
const complete = ref(false)
const completed = ref<number[]>([])
const input = ref('')
const inputElement = ref<HTMLInputElement | null>(null)
const terminal = ref<HTMLElement | null>(null)
const mount = ref<HTMLElement | null>(null)
const paused = ref(false)
const speed = ref(1)
const history: string[] = []
let cursor = 0
const output = ref([{ type: 'system', text: 'KUBERNETES LAB / namespace: lab\n브라우저 안의 모의 클러스터입니다. 명령을 입력한 뒤 Enter를 누르세요.' }])
const threeStatus = ref<'loading' | 'ready' | 'error'>('loading')
let runtime: ReturnType<typeof createKubernetesRenderer> | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let autoScroll = true
const ready = computed(() => readyPods(state.value).length)
const actual = computed(() => actualPods(state.value).length)
const selected = computed(() => state.value.pods.find(p => p.name === state.value.selectedPod))
function append(type: string, text: string) {
  output.value.push({ type, text })
  if (output.value.length > 180) output.value.splice(0, output.value.length - 180)
  if (autoScroll) void nextTick(() => { terminal.value?.scrollTo({ top: terminal.value.scrollHeight }) })
}
function evaluate() {
  if (!complete.value && missionComplete(missionIndex.value, state.value, diagnosis.value)) {
    complete.value = true
    if (!completed.value.includes(missionIndex.value)) completed.value.push(missionIndex.value)
    append('success', `MISSION ${String(missionIndex.value + 1).padStart(2, '0')} COMPLETE\n${mission.value.explanation}`)
  }
}
function step() {
  const event = tick(state.value)
  if (event) append('event', event)
  evaluate()
}
function schedule() {
  timer = setTimeout(() => {
    if (disposed) return
    if (!paused.value && !document.hidden) step()
    schedule()
  }, 850 / speed.value)
}
function runCommand(command: string) {
  autoScroll = true
  append('command', `$ ${command}`)
  history.push(command)
  if (history.length > 60) history.shift()
  cursor = history.length
  const result = executeCommand(state.value, command)
  append(result.ok ? 'result' : 'error', result.output)
  evaluate()
}
function submit() {
  const command = input.value.trim()
  if (!command) return
  input.value = ''
  runCommand(command)
}
function runMissionCommand() {
  const command = hint.value.command
  if (!command || complete.value) return
  mobileSidePanel.value = false
  runCommand(command)
  void nextTick(() => terminal.value?.focus({ preventScroll: true }))
}
function historyKey(event: KeyboardEvent) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  event.preventDefault()
  cursor = Math.max(0, Math.min(history.length, cursor + (event.key === 'ArrowUp' ? -1 : 1)))
  input.value = history[cursor] || ''
}
function fillCommand() {
  if (!hint.value.command) return
  input.value = hint.value.command
  mobileSidePanel.value = false
  void nextTick(() => inputElement.value?.focus({ preventScroll: true }))
}
function choose(index: number) {
  missionIndex.value = index
  state.value = startMission(index)
  hintLevel.value = 0
  diagnosis.value = ''
  complete.value = false
  input.value = ''
  paused.value = false
  autoScroll = true
  append('system', `MISSION ${String(index + 1).padStart(2, '0')} / ${missions[index]!.title}\n이 미션의 초기 상황으로 모의 클러스터를 재설정했습니다.`)
}
function selectPod(name: string) {
  panel.value = 'resources'
  mobileSidePanel.value = true
  state.value.selectedPod = name
  state.value.focus = 'pods'
  state.value.eventId++
}
function scrollTerminal() {
  const el = terminal.value
  if (el) autoScroll = el.scrollHeight - el.scrollTop - el.clientHeight < 50
}
function rotateCamera(direction: number) { runtime?.rotate(direction) }
function resetCamera() { runtime?.resetCamera() }
function stopThree() { runtime?.dispose(); runtime = null; threeStatus.value = 'error' }
async function startThree() {
  threeStatus.value = 'loading'
  try {
    const { createKubernetesRenderer } = await import('~/utils/kubernetes/renderer')
    if (disposed || !mount.value) return
    runtime = createKubernetesRenderer(mount.value, selectPod, stopThree)
    runtime.update(state.value)
    threeStatus.value = 'ready'
  } catch (error) {
    console.warn('[kubernetes-lab] 3D unavailable; the live resource view remains usable.', error)
    stopThree()
  }
}
watch(() => `${missionIndex.value}:${hint.value.key}`, () => { hintLevel.value = hintLevel.value ? 1 : 0 })
watch(() => state.value.eventId, () => runtime?.update(state.value))
watch(state, () => runtime?.update(state.value))
watch(diagnosis, evaluate)
onMounted(() => { void startThree(); schedule() })
onBeforeUnmount(() => { disposed = true; clearTimeout(timer); runtime?.dispose() })
</script>

<template>
  <section class="kube-lab" :aria-labelledby="`${id}-title`" data-testid="kubernetes-lab">
    <header class="lab-heading">
      <div><span class="eyebrow">OBSERVE → COMMAND → OBSERVE</span><h3 :id="`${id}-title`">직접 실험하는 Kubernetes</h3></div>
      <span class="simulation-tag">SIMULATION ONLY</span>
    </header>
    <div class="lab-metrics" aria-label="현재 클러스터 상태">
      <span>DESIRED <strong data-testid="desired">{{ state.desiredReplicas }}</strong></span>
      <span>ACTUAL <strong data-testid="actual">{{ actual }}</strong></span>
      <span>READY <strong data-testid="ready">{{ ready }}</strong></span>
      <span>ENDPOINTS <strong data-testid="endpoints">{{ endpoints(state).length }}</strong></span>
      <span class="image-metric">IMAGE <strong>{{ state.image }}</strong></span>
    </div>
    <div class="lab-workspace" :class="{ 'show-side-panel': mobileSidePanel }">
      <section class="scene-panel" aria-label="클러스터 관찰">
        <div class="lab-stage" tabindex="0" aria-label="Kubernetes 3D 장면. 드래그로 회전, 스크롤로 확대. 좌우 방향키로 회전할 수 있습니다." @keydown.left.prevent="rotateCamera(-1)" @keydown.right.prevent="rotateCamera(1)">
          <div v-show="threeStatus === 'ready'" ref="mount" class="lab-canvas" />
          <div v-if="threeStatus !== 'ready'" class="scene-fallback">
            <span class="eyebrow">{{ threeStatus === 'loading' ? '3D 장면 준비 중' : '기본 구조도' }}</span>
            <div class="fallback-plane">API Server ↔ etcd<br>Deployment Controller → ReplicaSet Controller → Scheduler</div>
            <div class="fallback-workers">
              <div v-for="node in ['worker-1', 'worker-2', 'worker-3']" :key="node">
                <strong>{{ node }}</strong><span>kubelet / containerd</span>
                <button v-for="pod in state.pods.filter(p => p.node === node)" :key="pod.name" type="button" :style="{ borderColor: statusColors[pod.status] }" @click="selectPod(pod.name)">{{ pod.name }}<br>{{ pod.status }}</button>
              </div>
            </div>
            <p>Service demo-api → Ready Endpoints {{ ready }}개</p>
            <button v-if="threeStatus === 'error'" type="button" @click="startThree">3D 다시 시도</button>
          </div>
          <span v-if="threeStatus === 'ready'" class="scene-caption">드래그로 회전 · Pod를 눌러 상세 보기</span>
        </div>
        <div class="scene-toolbar">
          <div class="scene-actions">
            <button type="button" :aria-pressed="paused" @click="paused = !paused">{{ paused ? '▶ 자동 재생' : 'Ⅱ 일시 정지' }}</button>
            <button type="button" @click="paused = true; step()">한 단계 →</button>
            <select v-model.number="speed" aria-label="시뮬레이션 속도"><option :value="1">1×</option><option :value="2">2×</option><option :value="4">4×</option></select>
            <button v-if="threeStatus === 'ready'" type="button" class="camera-reset" @click="resetCamera">시점 초기화</button>
          </div>
          <div class="scene-event" role="status"><span>{{ state.focus }}</span><p>{{ state.event }}</p></div>
        </div>
      </section>

      <nav class="mobile-panel-nav" aria-label="실습 패널 선택">
        <button type="button" :aria-pressed="!mobileSidePanel" @click="mobileSidePanel = false">터미널</button>
        <button v-for="item in panels" :key="item.key" type="button" :aria-pressed="mobileSidePanel && panel === item.key" @click="panel = item.key; mobileSidePanel = true">{{ item.label }}{{ item.key === 'mission' && complete ? ' ✓' : '' }}</button>
      </nav>

      <section class="terminal-panel" :aria-labelledby="`${id}-terminal`">
        <header><span class="terminal-dots" aria-hidden="true">● ● ●</span><h4 :id="`${id}-terminal`">kubectl terminal</h4><button type="button" @click="output = []">화면 지우기</button></header>
        <div ref="terminal" class="terminal-output" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="모의 kubectl 출력" @scroll="scrollTerminal"><div v-for="(line, index) in output" :key="index" :class="['terminal-line', `output-${line.type}`]">{{ line.text }}</div></div>
        <form class="terminal-input" @submit.prevent="submit">
          <label :for="`${id}-command`"><span aria-hidden="true">❯</span><span class="sr-only">kubectl 명령 입력</span></label>
          <input :id="`${id}-command`" ref="inputElement" v-model="input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="300" placeholder="kubectl …" aria-label="kubectl 명령 입력" @keydown="historyKey">
          <button type="submit" aria-label="명령 실행">Enter ↵</button>
        </form>
        <p class="terminal-note">모의 실행 · ↑ ↓ 입력 기록 · 자동 입력 후 Enter</p>
      </section>

      <aside class="side-panel" aria-label="실습 안내와 리소스">
        <nav class="side-panel-nav" aria-label="보조 패널 선택">
          <button v-for="item in panels" :key="item.key" type="button" :aria-pressed="panel === item.key" @click="panel = item.key">{{ item.label }}</button>
        </nav>
        <div class="side-panel-body">
          <section v-if="panel === 'mission'" class="mission-panel" :aria-labelledby="`${id}-mission`">
            <div class="mission-top"><span class="eyebrow">MISSION {{ String(missionIndex + 1).padStart(2, '0') }}</span><span>{{ completed.length }} / 8 완료</span></div>
            <label class="mission-select"><span class="sr-only">실습 선택</span><select :value="missionIndex" aria-label="실습 선택" @change="choose(Number(($event.target as HTMLSelectElement).value))"><option v-for="(item, index) in missions" :key="item.title" :value="index">{{ String(index + 1).padStart(2, '0') }}. {{ item.title }}{{ completed.includes(index) ? ' ✓' : '' }}</option></select></label>
            <h4 :id="`${id}-mission`" class="sr-only">{{ mission.title }}</h4><p class="mission-goal">{{ mission.goal }}</p>
            <div class="mission-comparison">
              <div><span>현재</span><strong>Desired {{ state.desiredReplicas }} · Ready {{ ready }}</strong></div>
              <div><span>목표</span><strong>{{ mission.target }}</strong></div>
            </div>
            <div v-if="complete" class="mission-complete" role="status" data-testid="mission-complete">
              <strong>✓ MISSION COMPLETE</strong><p>{{ mission.explanation }}</p><p class="component-flow">{{ mission.flow }}</p>
              <button v-if="missionIndex < 7" type="button" class="primary" @click="choose(missionIndex + 1)">다음 미션 →</button><p v-else>8개 실습의 마지막 단계까지 마쳤습니다. 다른 명령으로 자유롭게 실험해 보세요.</p>
            </div>
            <div v-else-if="assistMode === 'commands'" class="mission-command-panel">
              <span class="eyebrow">{{ hint.command ? '이번 단계 명령' : '다음으로 할 일' }}</span>
              <p>{{ hint.levels[0] }}</p>
              <template v-if="hint.command">
                <code class="mission-command" data-testid="mission-command">{{ hint.command }}</code>
                <div class="mission-command-actions">
                  <button type="button" @click="fillCommand">입력만 하기</button>
                  <button type="button" class="run-mission-command" aria-label="미션 명령 실행" @click="runMissionCommand">▶ 실행</button>
                </div>
              </template>
              <p v-else-if="hint.key === 'recover'" class="command-followup">3D 장면에서 새 Pod가 Ready가 되는 과정을 보세요. 일시 정지 중이면 「한 단계」로 진행할 수 있습니다.</p>
              <button type="button" class="assist-mode-switch" @click="assistMode = 'hints'; hintLevel = 0">힌트로 직접 풀기</button>
            </div>
            <div v-else class="hint-panel">
              <span class="eyebrow">HINT {{ hintLevel }} / 3</span>
              <p v-if="hintLevel === 0">막히면 힌트를 한 단계씩 열어 보자.</p>
              <p v-else aria-live="polite" :class="{ 'command-hint': hintLevel === 3 && hint.command }">{{ hint.levels[hintLevel - 1] }}</p>
              <div class="hint-buttons">
                <button type="button" :disabled="hintLevel > 0" @click="hintLevel = 1">Hint</button>
                <button type="button" :disabled="hintLevel === 0 || hintLevel >= 3" @click="hintLevel++">Show More</button>
                <button type="button" :disabled="hintLevel < 3 || !hint.command" @click="fillCommand">Auto-fill Command</button>
              </div>
              <small>자동 입력은 실행하지 않습니다.</small>
              <button type="button" class="assist-mode-switch" @click="assistMode = 'commands'">명령어 보고 실행하기</button>
            </div>
            <label v-if="(missionIndex === 4 || missionIndex === 5) && !complete" class="diagnosis">Events를 근거로 원인 선택<select v-model="diagnosis"><option value="">원인을 선택하세요</option><option value="image">이미지를 가져오지 못함</option><option value="readiness">Readiness 검사 실패</option><option value="scheduling">노드 배정 실패</option></select><small v-if="diagnosis && !complete">실패 Pod의 Events와 원인을 대조하세요. 미션 6은 Endpoints 조회도 필요합니다.</small></label>
            <button type="button" class="restart-mission" @click="choose(missionIndex)">이 미션 다시 시작</button>
          </section>

          <section v-else-if="panel === 'resources'" class="resource-panel" aria-label="클러스터 리소스 상세">
            <div class="resource-heading"><h4>Pods</h4><span>{{ actual }} Actual · {{ ready }} Ready</span></div>
            <p class="panel-description">Pod를 선택해 상태와 배치된 노드를 확인하세요.</p>
            <div class="pod-strip" aria-label="Pod 상태와 노드">
              <button v-for="pod in state.pods" :key="pod.name" type="button" :aria-pressed="state.selectedPod === pod.name" :style="{ '--pod-color': statusColors[pod.status] }" @click="selectPod(pod.name)"><i aria-hidden="true" /><strong>{{ pod.name }}</strong><span>{{ pod.status === 'ReadinessFailed' ? 'Running · Ready 0/1' : pod.status }}</span><small>{{ pod.node || 'Node 미배정' }} · {{ pod.image }}</small></button>
              <p v-if="!state.pods.length">Pod가 없습니다. 원하는 개수를 올리면 다시 생성됩니다.</p>
            </div>
            <p v-if="selected" class="selected-pod"><strong>{{ selected.name }}</strong><br>{{ selected.rs }}<br>{{ displayStatus(selected) }} · Ready={{ selected.status === 'Ready' }}<br>{{ selected.node ? selected.ip : 'IP 미할당' }}</p>
            <div class="resource-heading"><h4>ReplicaSets</h4><span>{{ state.replicaSets.length }}개</span></div>
            <div class="rs-strip" :class="{ 'rs-focused': state.focus === 'rs' }" aria-label="ReplicaSet별 복제본 상태">
              <div v-for="rs in state.replicaSets" :key="rs.name" :class="{ 'rs-active': rs.name === state.activeRS }"><strong>{{ rs.name }}</strong><span>{{ rs.image }}</span><small>Desired {{ rs.desired }} / Actual {{ actualPods(state).filter(p => p.rs === rs.name).length }} / Ready {{ readyPods(state).filter(p => p.rs === rs.name).length }}</small></div>
            </div>
            <p class="endpoint-summary">Service demo-api → Ready Endpoints {{ endpoints(state).length }}개</p>
          </section>

          <section v-else class="command-help" aria-label="지원 명령과 모의 이미지">
            <h4>지원 명령</h4><p>한 줄씩 입력하고 Enter를 누르세요.</p>
            <pre>kubectl get pods
kubectl get deployments
kubectl get rs
kubectl get svc
kubectl get endpoints
kubectl describe pod &lt;pod-name&gt;
kubectl delete pod &lt;pod-name&gt;
kubectl scale deployment demo-api --replicas=&lt;0~8&gt;
kubectl set image deployment/demo-api app=&lt;image&gt;
kubectl rollout status deployment/demo-api
kubectl rollout undo deployment/demo-api</pre>
            <h4>모의 이미지</h4><p>demo-api:v1, demo-api:v2 → 정상<br>demo-api:unready → Readiness 실패<br>그 외 이미지 → ImagePullBackOff</p>
            <p>브라우저 안의 모의 레지스트리입니다. 실제 셸을 실행하거나 외부 이미지를 다운로드하지 않습니다.</p>
            <details class="model-details"><summary>모형의 범위</summary><p>Worker 3대, 컨테이너 app 1개/Pod, maxSurge=1, maxUnavailable=0, 복제본 0~8. 단계와 네트워크 반영 시점을 관찰하기 쉽게 단순화했습니다. Ready는 Pod phase가 아니라 조건이며, 실제 배포 시간·성능·클라우드 동작을 재현하지 않습니다.</p></details>
          </section>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.kube-lab {
  --ink: #e6eef9;
  --muted: #a8bacf;
  --line: #35485e;
  --mint: #6ee7ba;
  /* Keep absolute accessibility labels inside the lab's scroll boundary. */
  position: relative;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  height: min(800px, calc(100dvh - 88px));
  min-height: 500px;
  margin: 1.5rem 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  color: var(--ink);
  background: #152233;
  font-family: var(--ui-font, sans-serif);
  font-size: 12px;
  line-height: 1.55;
  scroll-margin-block: 12px;
}
.kube-lab *, .kube-lab *::before { box-sizing: border-box; }
.kube-lab h3, .kube-lab h4 { margin: 0 !important; border: 0; padding: 0; color: var(--ink); line-height: 1.4; }
.kube-lab h3 { font-size: 19px; }
.kube-lab h4 { font-size: 14px; }
.kube-lab p { margin: 8px 0; color: var(--muted); font-size: 12px; line-height: 1.65; }
.kube-lab button, .kube-lab select {
  min-height: 34px;
  padding: 6px 9px;
  border: 1px solid #526780;
  border-radius: 5px;
  background: #20344b;
  color: var(--ink);
  font: inherit;
  cursor: pointer;
}
.kube-lab button:hover:not(:disabled) { border-color: var(--mint); background: #29534f; }
.kube-lab button:disabled { opacity: .4; cursor: default; }
.kube-lab :focus-visible { outline: 3px solid #f6ca75; outline-offset: -3px; }
.kube-lab small { color: var(--muted); font-size: 10px; }
.lab-heading { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 16px; }
.eyebrow { color: var(--mint); font: 9px/1.6 monospace; letter-spacing: .08em; }
.simulation-tag { flex-shrink: 0; padding: 4px 6px; border: 1px solid #47685f; border-radius: 4px; color: var(--mint); font: 9px monospace; }
.lab-metrics { display: flex; flex-shrink: 0; align-items: center; gap: 20px; padding: 9px 16px; border-block: 1px solid var(--line); background: #101c2d; }
.lab-metrics > span { display: grid; gap: 2px; color: var(--muted); font: 9px monospace; letter-spacing: .04em; }
.lab-metrics strong { color: var(--mint); font: 19px monospace; }
.lab-metrics .image-metric { min-width: 0; margin-left: auto; }
.image-metric strong { font-size: 11px; overflow-wrap: anywhere; }
.lab-workspace { display: grid; flex: 1; min-height: 0; grid-template-columns: minmax(0, 1fr) 270px; grid-template-rows: minmax(170px, 1fr) minmax(190px, .72fr); }
.scene-panel { grid-area: 1 / 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; background: #101b2c; }
.lab-stage { position: relative; flex: 1; min-height: 0; overflow: hidden; }
.lab-canvas { width: 100%; height: 100%; touch-action: none; }
.lab-canvas :deep(canvas) { display: block; width: 100%; height: 100%; }
.scene-caption { position: absolute; bottom: 6px; left: 12px; color: var(--muted); font-size: 9px; pointer-events: none; }
.scene-fallback { height: 100%; overflow: auto; padding: 12px; text-align: center; }
.fallback-plane { padding: 8px; border: 1px solid #6582b4; border-radius: 5px; background: #233752; font-size: 10px; }
.fallback-workers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
.fallback-workers > div { display: grid; align-content: start; gap: 4px; padding: 6px; border: 1px solid var(--line); border-radius: 5px; font-size: 10px; }
.fallback-workers span { font-size: 9px; color: var(--muted); }
.fallback-workers button { padding: 5px; font: 9px monospace; overflow-wrap: anywhere; }
.scene-toolbar { flex-shrink: 0; padding: 8px 10px 6px; border-top: 1px solid #25384f; }
.scene-actions { display: flex; align-items: center; gap: 6px; }
.scene-actions button, .scene-actions select { min-height: 30px; padding: 4px 7px; font-size: 10px; white-space: nowrap; }
.scene-actions .camera-reset { margin-left: auto; }
.scene-event { height: 52px; margin-top: 7px; overflow: auto; scrollbar-width: thin; }
.scene-event > span { display: block; color: var(--mint); font: 10px/1.4 monospace; }
.scene-event p { margin: 3px 0 0; color: #c3d3e5; font-size: 11px; line-height: 1.5; }
.terminal-panel { grid-area: 2 / 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; border-top: 1px solid var(--line); background: #0b1421; }
.terminal-panel > header { display: flex; flex-shrink: 0; align-items: center; gap: 9px; padding: 5px 10px; border-bottom: 1px solid #25384f; }
.terminal-panel > header h4 { font: 11px monospace; }
.terminal-panel > header button { min-height: 25px; margin-left: auto; padding: 3px 6px; border-color: transparent; background: transparent; color: var(--muted); font-size: 10px; }
.terminal-dots { color: #6d819a; font-size: 8px; letter-spacing: 1px; }
.terminal-output { flex: 1; min-height: 0; padding: 12px; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; }
.terminal-output .terminal-line, .command-help pre { display: block; max-width: none; margin: 0 0 10px; padding: 0; border: 0; border-radius: 0; background: transparent !important; color: #c6d7eb; font: 11px/1.65 'IBM Plex Mono', monospace; white-space: pre; tab-size: 2; }
.terminal-output .output-command { color: #8af0ce; }
.terminal-output .output-event { color: #9db5ce; white-space: pre-wrap; overflow-wrap: anywhere; }
.terminal-output .output-error { color: #ff9aa6; white-space: pre-wrap; }
.terminal-output .output-success { color: #80ecc6; white-space: pre-wrap; }
.terminal-output .output-system { color: #b1bcff; white-space: pre-wrap; }
.terminal-input { display: flex; flex-shrink: 0; align-items: center; gap: 7px; margin: 0; padding: 6px 10px; border-block: 1px solid #405c70; background: #152b3c; }
.terminal-input:focus-within { border-color: var(--mint); background: #183448; }
.terminal-input label { color: var(--mint); }
.terminal-input input { flex: 1; width: 0; min-width: 0; padding: 8px 2px; border: 0; border-radius: 0; background: transparent; color: #e6eef9; font: 12px monospace; }
.terminal-input button { min-height: 30px; padding: 5px 8px; border-color: #507d70; color: #98f1d0; font-size: 10px; }
.kube-lab .terminal-note { flex-shrink: 0; margin: 0; padding: 4px 10px; color: #94a9be; font-size: 9px; }
.side-panel { grid-area: 1 / 2 / 3 / 3; display: flex; flex-direction: column; min-width: 0; min-height: 0; border-left: 1px solid var(--line); }
.side-panel-nav, .mobile-panel-nav { display: flex; flex-shrink: 0; gap: 0; padding: 0 7px; border-bottom: 1px solid var(--line); background: #101c2d; }
.side-panel-nav button, .mobile-panel-nav button { flex: 1; min-height: 38px; padding: 6px 4px; border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: transparent; color: var(--muted); font-size: 11px; white-space: nowrap; }
.side-panel-nav button[aria-pressed=true], .mobile-panel-nav button[aria-pressed=true] { border-bottom-color: var(--mint); background: #1d3342; color: var(--mint); }
.mobile-panel-nav { display: none; }
.side-panel-body { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; padding: 14px 12px; }
.mission-top { display: flex; justify-content: space-between; align-items: center; gap: 5px; }
.mission-top > span:last-child { color: var(--muted); font-size: 10px; }
.mission-select { display: block; margin: 9px 0; }
.mission-select select { width: 100%; font-size: 11px; }
.kube-lab .mission-goal { margin: 10px 0; color: #d1deed; font-size: 12px; }
.mission-comparison { display: grid; gap: 8px; margin: 12px 0; padding: 10px; border: 1px solid var(--line); border-radius: 6px; background: #101c2d; }
.mission-comparison > div { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 5px; align-items: baseline; }
.mission-comparison span { color: var(--muted); font-size: 10px; }
.mission-comparison strong { font-size: 11px; overflow-wrap: anywhere; }
.mission-comparison > div:last-child strong { color: var(--mint); }
.hint-panel { padding: 10px; border: 1px solid #3b5069; border-radius: 6px; }
.hint-panel p { min-height: 40px; margin: 8px 0; color: #ccdaeb; font-size: 12px; }
.hint-panel .command-hint { font: 11px/1.65 monospace; color: var(--mint); overflow-wrap: anywhere; }
.hint-buttons { display: flex; gap: 5px; flex-wrap: wrap; margin: 10px 0 5px; }
.hint-buttons button { min-height: 32px; padding: 5px 6px; font-size: 10px; }
.hint-panel small { font-size: 9px; }
.mission-command-panel { padding: 10px; border: 1px solid #3d7067; border-radius: 6px; background: #132b32; }
.mission-command-panel p { margin: 7px 0 10px; color: #c6dcd6; font-size: 12px; }
.kube-lab .mission-command { display: block; padding: 10px; border: 1px solid #36545d; border-radius: 5px; background: #0b1823; color: #92f0ce; font: 12px/1.7 monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
.mission-command-actions { display: flex; gap: 7px; margin-top: 10px; }
.mission-command-actions button { flex: 1; font-size: 11px; }
.kube-lab .run-mission-command { border-color: var(--mint); background: var(--mint); color: #102b24; font-weight: 700; }
.kube-lab .run-mission-command:hover { background: #95f2d1; }
.kube-lab .assist-mode-switch { display: block; width: 100%; min-height: 28px; margin-top: 8px; padding: 4px 0; border-color: transparent; background: transparent; color: var(--muted); font-size: 10px; text-decoration: underline; text-underline-offset: 3px; }
.mission-command-panel .command-followup { font-size: 11px; }
.diagnosis { display: grid; gap: 7px; padding-top: 12px; font-size: 11px; }
.diagnosis select { width: 100%; font-size: 11px; }
.mission-complete { padding: 11px; border: 1px solid #427f6e; border-radius: 6px; background: #173831; }
.mission-complete > strong { color: #86f0c9; font: 12px monospace; }
.mission-complete p { color: #c0dcce; font-size: 12px; }
.mission-complete .component-flow { color: #87ebc7; font-size: 11px; }
.kube-lab .primary { width: 100%; background: var(--mint); color: #102b24; border-color: var(--mint); font-weight: 700; }
.kube-lab .restart-mission { width: 100%; margin-top: 12px; border-color: transparent; background: transparent; color: var(--muted); font-size: 10px; }
.resource-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.resource-heading span { color: var(--muted); font-size: 10px; }
.kube-lab .panel-description { font-size: 11px; }
.pod-strip { display: grid; gap: 7px; margin: 12px 0; }
.pod-strip button { display: grid; grid-template-columns: 8px minmax(0, 1fr); gap: 3px 6px; text-align: left; padding: 8px; background: #101c2d; border-color: var(--pod-color); font-size: 11px; }
.pod-strip button[aria-pressed=true] { background: #2a4056; outline: 1px solid var(--pod-color); }
.pod-strip i { width: 6px; height: 6px; margin-top: 5px; border-radius: 50%; background: var(--pod-color); }
.pod-strip span, .pod-strip small { grid-column: 2; }
.pod-strip span { color: var(--pod-color); font-size: 10px; }
.pod-strip small { overflow-wrap: anywhere; }
.kube-lab .selected-pod { padding: 9px; border-left: 2px solid var(--mint); background: #1d3342; font-size: 11px; overflow-wrap: anywhere; }
.rs-strip { display: grid; gap: 8px; margin: 12px 0; }
.rs-strip > div { display: grid; gap: 3px; padding: 8px 10px; border-left: 2px solid #526780; background: #101c2d; color: var(--muted); font: 10px/1.6 monospace; }
.rs-strip .rs-active { border-color: #a2bbff; }
.rs-strip span { overflow-wrap: anywhere; }
.rs-strip small { font-size: 9px; }
.rs-focused strong { color: #f6ca75; }
.kube-lab .endpoint-summary { padding-top: 10px; border-top: 1px solid var(--line); color: var(--mint); font-size: 11px; }
.command-help pre { margin: 14px 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 11px; }
.command-help p { font-size: 11px; }
.model-details { margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--line); }
.model-details summary { color: var(--muted); cursor: pointer; font-size: 11px; }
.sr-only { position: absolute; top: 0; left: 0; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@container (max-width: 650px) {
  .lab-heading { padding: 10px 12px; }
  .lab-heading h3 { font-size: 17px; }
  .lab-heading .eyebrow { font-size: 8px; letter-spacing: .02em; }
  .simulation-tag { font-size: 8px; }
  .lab-metrics { flex-wrap: wrap; gap: 7px 18px; padding: 8px 12px; }
  .lab-metrics strong { font-size: 17px; }
  .lab-metrics .image-metric { display: flex; flex-basis: 100%; align-items: center; gap: 8px; margin: 0; }
  .image-metric strong { font-size: 10px; }
  .lab-workspace { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(160px, 1fr) 40px minmax(185px, .8fr); }
  .scene-panel { grid-area: 1 / 1; }
  .mobile-panel-nav { display: flex; grid-area: 2 / 1; border-top: 1px solid var(--line); }
  .terminal-panel, .side-panel { grid-area: 3 / 1; border: 0; }
  .side-panel, .show-side-panel .terminal-panel { display: none; }
  .show-side-panel .side-panel { display: flex; }
  .side-panel-nav { display: none; }
  .side-panel-body { padding: 12px; }
  .mission-select { margin: 8px 0; }
  .scene-actions button, .scene-actions select { min-height: 34px; }
  .scene-event { height: 48px; }
  .scene-toolbar { padding: 6px 8px 4px; }
  .terminal-input input { font-size: 16px; }
  .terminal-input button { min-height: 34px; }
  .hint-buttons button { min-height: 36px; }
}
@container (max-width: 370px) {
  .simulation-tag { max-width: 60px; text-align: center; line-height: 1.5; }
  .lab-heading h3 { font-size: 15px; }
  .lab-metrics { column-gap: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .kube-lab *, .kube-lab *::before { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
}
</style>
