<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { detailedFlow, detailFrame, detailDuration, nextDetailCursor, previousDetailCursor } from '~/utils/kubernetes/detailed-flows'
import type { FlowDiagramId } from '~/utils/kubernetes/detailed-flows'
import type { ManagedMode } from '~/utils/kubernetes/managed'

const props = defineProps<{ diagram: FlowDiagramId }>()
const uid = useId()
const mode = useState<ManagedMode>('kubernetes-detail-mode', () => 'eks')
const flow = computed(() => detailedFlow(props.diagram, mode.value))
const cursor = ref(-1)
const selectedGroup = ref(0)
const playing = ref(false)
const infoOpen = ref(false)
const root = ref<HTMLElement>()
const startButton = ref<HTMLButtonElement>()
const infoButton = ref<HTMLButtonElement>()
const frame = computed(() => detailFrame(flow.value, cursor.value))
const started = computed(() => frame.value !== null)
const done = computed(() => frame.value?.done ?? false)
const scene = computed(() => frame.value?.scene)
const current = computed(() => frame.value?.index ?? 0)
const groups = computed(() => flow.value.groups ?? [{ id: flow.value.id, label: flow.value.label, start: 0, end: flow.value.steps.length }])
const groupIndex = computed(() => started.value ? groups.value.findIndex(group => current.value >= group.start && current.value < group.end) : selectedGroup.value)
const group = computed(() => groups.value[groupIndex.value]!)
const visibleSteps = computed(() => flow.value.steps.map((step, index) => ({ step, index })).slice(group.value.start, group.value.end))
const visibleRows = computed(() => Math.max(...groups.value.map(group => group.end - group.start)))
const phaseName = computed(() => ({ arrival: '도착', decision: '판단', result: '결과' })[frame.value?.phase ?? 'arrival'])
const selected = computed(() => scene.value?.items.some(item => item.selected))
const illustrated = computed(() => ['choice', 'pods', 'nodes', 'metadata'].includes(scene.value?.kind ?? ''))
const nodeIcon = 'M4 4h16v7H4zM4 13h16v7H4zM7 7h1M7 16h1M12 7h5M12 16h5'
const podIcon = 'm12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10'
const changeEvent = 'kubernetes-detail-start'
let timer: ReturnType<typeof setTimeout> | undefined

function pause() { playing.value = false; clearTimeout(timer); timer = undefined }
function followCurrent() {
  const step = root.value?.querySelector<HTMLElement>('[aria-current="step"]')
  if (!step) return
  const bounds = step.getBoundingClientRect()
  if (bounds.top < 80 || bounds.bottom > window.innerHeight - 90) {
    step.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
}
function advance() {
  const before = current.value
  cursor.value = nextDetailCursor(cursor.value, flow.value.steps.length)
  if (before !== current.value) nextTick(followCurrent)
  if (done.value) pause()
}
function schedule() {
  timer = setTimeout(() => {
    if (!playing.value) return
    advance()
    if (playing.value) schedule()
  }, detailDuration(frame.value?.phase ?? 'arrival'))
}
function play() {
  if (done.value || playing.value) return
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: uid }))
  playing.value = true
  schedule()
}
async function start() {
  cursor.value = group.value.start * 3 - 1
  advance()
  play()
  await nextTick()
  if (root.value && root.value.getBoundingClientRect().height > window.innerHeight - 140) followCurrent()
  else root.value?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  root.value?.querySelector<HTMLButtonElement>('[data-testid="detail-play"]')?.focus({ preventScroll: true })
}
async function reset(focus = true) {
  pause()
  cursor.value = -1
  selectedGroup.value = 0
  infoOpen.value = false
  if (focus) { await nextTick(); startButton.value?.focus({ preventScroll: true }) }
}
async function next() {
  pause()
  advance()
  if (done.value) {
    await nextTick()
    root.value?.querySelector<HTMLButtonElement>('[data-testid="detail-reset"]')?.focus({ preventScroll: true })
  }
}
async function previous() {
  pause()
  cursor.value = previousDetailCursor(cursor.value)
  if (!started.value) { await nextTick(); startButton.value?.focus({ preventScroll: true }) }
  else { await nextTick(); followCurrent() }
}
function toggleInfo() { pause(); infoOpen.value = !infoOpen.value }
function closeInfo() { if (infoOpen.value) { infoOpen.value = false; infoButton.value?.focus({ preventScroll: true }) } }
function otherPlayback(event: Event) { if ((event as CustomEvent<string>).detail !== uid) pause() }
function visibility() { if (document.hidden) pause() }
function selectGroup(event: Event) {
  const index = Number((event.target as HTMLSelectElement).value)
  const target = groups.value[index]
  if (!target) return
  pause()
  infoOpen.value = false
  selectedGroup.value = index
  if (started.value) { cursor.value = target.start * 3; nextTick(followCurrent) }
}
watch(mode, () => {
  if (flow.value.managed) {
    const previousGroup = groupIndex.value
    reset(false)
    selectedGroup.value = previousGroup
  }
})
watch(() => props.diagram, () => reset(false))
onMounted(() => { window.addEventListener(changeEvent, otherPlayback); document.addEventListener('visibilitychange', visibility) })
onBeforeUnmount(() => { pause(); window.removeEventListener(changeEvent, otherPlayback); document.removeEventListener('visibilitychange', visibility) })
</script>

<template>
  <section ref="root" class="kd-lab" :class="{ 'kd-started': started, 'kd-done': done }" :aria-label="flow.label" :data-diagram="diagram" :data-group="group.id" data-testid="detail-diagram" :data-step="current" :data-phase="frame?.phase ?? 'idle'" @keydown.esc="closeInfo">
    <div v-if="flow.managed" class="kd-modes" role="group" aria-label="운영 방식">
      <button type="button" :aria-pressed="mode === 'self'" @click="mode = 'self'">직접 운영</button>
      <button type="button" :aria-pressed="mode === 'eks'" @click="mode = 'eks'">Amazon EKS</button>
    </div>
    <button ref="infoButton" type="button" class="kd-info-toggle" :aria-expanded="infoOpen" :aria-controls="`${uid}-info`" aria-label="현재 단계의 용어와 기술 정보" data-testid="detail-info" @click="toggleInfo">i</button>
    <div v-if="groups.length > 1" class="kd-sections">
      <label :for="`${uid}-section`">{{ flow.managed ? '과정·상황' : '요청 구간' }}</label>
      <select :id="`${uid}-section`" :value="groupIndex" data-testid="detail-section" @change="selectGroup"><option v-for="(section, index) in groups" :key="section.id" :value="index">{{ index + 1 }}. {{ section.label }}</option></select>
      <span class="kd-progress" data-testid="detail-progress">{{ started ? current + 1 : 0 }} / {{ flow.steps.length }} 단계</span>
    </div>

    <div :key="group.id" class="kd-flow" :style="{ '--step': Math.max(0, current - group.start), '--count': visibleSteps.length, '--rows': visibleRows }" role="group" aria-label="단계별 처리 순서">
      <div class="kd-track" aria-hidden="true"><span /></div>
      <div v-if="started" class="kd-token" :class="{ 'kd-token-done': done }" data-testid="detail-token" :aria-label="flow.managed ? '관리 작업 진행 표시' : '요청 처리 진행 표시'">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="done ? 'm5 12 4 4 10-9' : flow.managed ? 'm8 7-4 5 4 5m8-10 4 5-4 5' : 'M4 6h16v12H4zM4 6l8 7 8-7'" /></svg>
      </div>
      <div v-for="{ step, index } in visibleSteps" :key="step.id" class="kd-step" :class="{ 'kd-current': started && current === index, 'kd-finished': started && (current > index || (current === index && frame?.phase === 'result')) }" :aria-current="started && current === index ? 'step' : undefined" :data-stage="step.id">
        <span class="kd-waypoint" aria-hidden="true"><svg v-if="started && (current > index || (current === index && frame?.phase === 'result'))" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-9" /></svg></span>
        <div class="kd-node"><span class="kd-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ started && current >= index ? (step.activeLabel ?? step.label) : step.label }}</strong></div>
        <div v-if="started && current === index && frame && scene" class="kd-scene" :class="{ 'kd-arriving': frame.phase === 'arrival', 'kd-metadata-scene': scene.kind === 'metadata' }" data-testid="detail-scene">
          <div class="kd-phases" :aria-label="phaseName"><i v-for="(phase, phaseIndex) in ['arrival', 'decision', 'result']" :key="phase" :class="{ active: frame.phase === phase }" :title="['도착', '판단', '결과'][phaseIndex]" /></div>
          <Transition name="kd-reveal" mode="out-in">
            <div :key="cursor" class="kd-content" :aria-label="scene.kind === 'metadata' ? 'EndpointSlice 주소 정보 참조' : undefined" :class="[`kd-kind-${scene.kind}`, { 'kd-success': scene.success, 'kd-is-result': frame.phase === 'result', 'kd-is-decision': frame.phase === 'decision' }]">
              <div v-if="scene.kind === 'response'" class="kd-response"><strong>✓ {{ scene.items[0]?.text }}</strong><span class="kd-books" aria-hidden="true"><i /><i /></span><span>{{ scene.items[1]?.text }}</span></div>
              <template v-else>
                <template v-for="(item, itemIndex) in scene.items" :key="item.text">
                  <span v-if="scene.kind === 'compare' && itemIndex > 0" class="kd-comparison" aria-hidden="true">{{ scene.success ? '✓' : '→' }}</span>
                  <span class="kd-item" :class="{ 'kd-input': item.role === 'input', 'kd-picked': item.selected, 'kd-rejected': selected && !item.selected, 'kd-unready': item.status === 'unready', 'kd-ready': item.status === 'ready', 'kd-pending': item.status === 'pending' }" :data-selected="item.selected ? 'true' : undefined" :data-status="item.status">
                    <svg v-if="illustrated && item.role !== 'input'" class="kd-item-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="scene.kind === 'nodes' || item.text.startsWith('ingress') || item.text.startsWith('api-') ? nodeIcon : podIcon" /></svg>
                    <span>{{ item.text }}</span>
                    <span v-if="item.selected" class="kd-check" :aria-label="scene.kind === 'metadata' ? 'Ready 대상' : '선택'">✓</span>
                    <small v-else-if="item.status">{{ item.status === 'ready' ? '✓ Ready' : item.status === 'unready' ? '− Not Ready' : '◷ 대기' }}</small>
                  </span>
                </template>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <div class="kd-controls">
      <button v-if="!started" ref="startButton" type="button" class="kd-primary" data-testid="detail-start" @click="start">시작 <span aria-hidden="true">↓</span></button>
      <template v-else>
        <button type="button" data-testid="detail-previous" @click="previous">↑ 이전</button>
        <button v-if="!done" type="button" data-testid="detail-next" @click="next">다음 ↓</button>
        <button v-if="!done" type="button" class="kd-primary" :aria-pressed="playing" data-testid="detail-play" @click="playing ? pause() : play()">{{ playing ? 'Ⅱ 일시 정지' : '▷ 재생' }}</button>
        <button type="button" data-testid="detail-reset" @click="reset()">↺ {{ done ? '다시 보기' : '초기화' }}</button>
      </template>
    </div>
    <span class="kd-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ frame ? `${frame.step.label}, ${phaseName}, ${frame.scene.items.map(item => item.text).join(', ')}${done ? ', 완료' : ''}` : '시작 대기' }}</span>

    <aside v-if="infoOpen" :id="`${uid}-info`" class="kd-info" data-testid="detail-info-panel">
      <div><strong>{{ frame?.step.label ?? flow.label }}</strong><button type="button" aria-label="정보 닫기" @click="closeInfo">×</button></div>
      <p v-if="frame">{{ frame.step.info }}</p>
      <p>{{ flow.note }}</p>
      <p>시작하면 구간을 이어서 자동 재생합니다. 이전·다음 버튼은 재생을 멈추고 한 장면씩 이동하며, 구간 경계에서도 이어집니다. 위의 선택 메뉴로 원하는 구간부터 볼 수 있습니다. 점 세 개는 도착, 판단, 결과입니다. 다른 실험을 시작하면 재생 중인 실험은 멈춥니다.</p>
      <a v-for="source in flow.sources" :key="source.href" :href="source.href" target="_blank" rel="noopener noreferrer">{{ source.label }} ↗</a>
    </aside>
  </section>
</template>

<style scoped>
.kd-lab { --blue: #3065db; --green: #23795b; --ink: #26374b; --muted: #64758a; --line: #dce4ed; --pitch: 104px; position: relative; container-type: inline-size; padding: 28px 24px 20px; margin: 20px 0 36px; border: 1px solid var(--line); border-radius: 16px; background: #fff; color: var(--ink); font: 13px/1.5 'Pretendard', sans-serif; }
.kd-lab *, .kd-lab *::before, .kd-lab *::after { box-sizing: border-box; }
.kd-lab button { min-height: 40px; padding: 8px 13px; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink); font: inherit; font-size: 12px; cursor: pointer; }
.kd-lab button:hover { background: #f0f5fc; }
.kd-lab button:focus-visible { outline: 3px solid #89aaf0; outline-offset: 3px; }
.kd-lab svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.kd-lab .kd-info-toggle { position: absolute; top: 7px; right: 7px; z-index: 2; min-height: 32px; width: 32px; padding: 4px; border: 0; border-radius: 50%; color: var(--muted); font: italic 600 16px Georgia, serif; }
.kd-modes { display: flex; gap: 5px; padding-bottom: 13px; margin-right: 16px; }
.kd-modes button { min-height: 34px; padding: 6px 10px; font-size: 11px; }
.kd-modes button[aria-pressed='true'] { color: #244fb0; border-color: #b1c7f4; background: #f1f5ff; }
.kd-sections { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 8px 0 18px; }
.kd-sections label, .kd-progress { color: var(--muted); font-size: 11px; }
.kd-sections select { flex: 1; min-width: 0; max-width: 340px; min-height: 40px; padding: 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink); font: inherit; font-size: 12px; }
.kd-sections select:focus-visible { outline: 3px solid #89aaf0; outline-offset: 3px; }
.kd-progress { margin-left: auto; white-space: nowrap; font-variant-numeric: tabular-nums; }
.kd-flow { --rail: 13px; --label: 205px; --gap: 24px; position: relative; max-width: 710px; min-height: calc(var(--rows) * var(--pitch)); margin: auto; }
.kd-step { position: relative; display: grid; grid-template-columns: var(--label) minmax(0, 1fr); align-items: center; gap: var(--gap); height: var(--pitch); padding-left: 38px; }
.kd-track { position: absolute; top: 32px; left: var(--rail); width: 2px; height: calc((var(--count) - 1) * var(--pitch)); background: var(--line); }
.kd-track > span { display: block; width: 100%; height: 0; background: #8eadeb; transition: height .75s cubic-bezier(.45,0,.2,1); }
.kd-started .kd-track > span { height: calc(var(--step) * var(--pitch)); }
.kd-waypoint { position: absolute; left: calc(var(--rail) - 5px); top: 26px; z-index: 1; display: grid; place-items: center; width: 12px; height: 12px; border: 2px solid #c9d5e2; border-radius: 50%; background: #fff; }
.kd-waypoint svg { width: 11px; height: 11px; stroke-width: 2.5; }
.kd-finished .kd-waypoint { color: #fff; border-color: #88aa9c; background: #88aa9c; }
.kd-node { display: flex; align-items: center; align-self: start; gap: 8px; min-height: 48px; margin-top: 8px; padding: 10px; border: 1px solid #e2e9f0; border-radius: 9px; background: #fafbfc; transition: border-color .25s, background .25s; }
.kd-number { color: #92a0b0; font: 10px 'IBM Plex Mono', monospace; }
.kd-node strong { font-size: 12px; line-height: 1.5; font-weight: 550; }
.kd-current .kd-node { border-color: #9fb9ef; background: #eef4ff; color: #2854b5; }
.kd-current .kd-node strong { font-weight: 700; }
.kd-token { position: absolute; z-index: 3; left: calc(var(--rail) - 12px); top: 19px; display: grid; place-items: center; width: 26px; height: 26px; color: #fff; background: var(--blue); border: 2px solid #fff; border-radius: 8px; box-shadow: 0 3px 9px #3065db33; transform: translateY(calc(var(--step) * var(--pitch))); transition: transform .75s cubic-bezier(.45,0,.2,1); }
.kd-token svg { width: 16px; height: 16px; stroke-width: 2; }
.kd-token-done { background: var(--green); }
.kd-scene { position: relative; align-self: start; margin-top: 4px; min-width: 0; }
.kd-scene::before { content: ''; position: absolute; top: 28px; left: calc(-1 * var(--gap)); width: calc(var(--gap) - 5px); border-top: 1px solid #b8c9e9; }
.kd-metadata-scene::before { border-top-style: dashed; }
.kd-arriving { animation: kd-arrival 1s both; }
.kd-phases { display: flex; align-items: center; gap: 4px; height: 6px; margin-bottom: 7px; }
.kd-phases i { display: block; width: 4px; height: 4px; border-radius: 4px; background: #dce4ef; }
.kd-phases .active { width: 12px; background: #799ee8; }
.kd-content { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 38px; }
.kd-item { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 5px; max-width: 100%; min-height: 31px; padding: 6px 9px; border: 1px solid #dfe6ef; border-radius: 7px; background: #fafbfd; color: #43566e; font: 11px/1.5 'IBM Plex Mono', 'Pretendard', sans-serif; overflow-wrap: anywhere; }
.kd-item small { color: inherit; font: 9px/1.3 'Pretendard', sans-serif; }
.kd-kind-compare { display: grid; grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr); gap: 5px; width: 100%; }
.kd-kind-compare .kd-item { background: #f7f9fc; }
.kd-comparison { color: #829cc8; font-size: 15px; }
.kd-success .kd-item { border-color: #b7d6c7; color: var(--green); background: #f2f9f5; }
.kd-success .kd-comparison { color: var(--green); animation: kd-pop .4s ease-out; }
.kd-kind-choice .kd-item, .kd-kind-pods .kd-item, .kd-kind-nodes .kd-item, .kd-kind-metadata .kd-item { flex-direction: column; flex: 1; min-width: 0; text-align: center; padding: 6px; }
.kd-kind-choice .kd-item span, .kd-kind-nodes .kd-item span { font-size: 10px; }
.kd-item .kd-item-icon { width: 24px; height: 24px; }
.kd-kind-metadata { position: relative; padding: 6px; border: 1px dashed #a4b7cf; border-radius: 9px; animation: kd-unfold .4s ease-out; transform-origin: left; }
.kd-picked { border-color: #7fa6ee !important; color: #285ec5 !important; background: #eaf2ff !important; box-shadow: 0 0 0 2px #3065db0a; animation: kd-pop .4s ease-out; }
.kd-kind-nodes .kd-item.kd-input { order: -1; flex-basis: 100%; flex-direction: row; justify-content: flex-start; min-height: 20px; padding: 0; border: 0; background: none; }
.kd-kind-metadata .kd-picked { border-color: #a8cebb !important; color: var(--green) !important; background: #f1faf5 !important; box-shadow: none; }
.kd-kind-metadata .kd-check { background: var(--green); }
.kd-check { position: absolute; top: -5px; right: -4px; display: grid; place-items: center; width: 15px; height: 15px; border-radius: 50%; color: white; background: var(--blue); font-size: 9px; }
.kd-rejected { opacity: .35; }
.kd-unready { color: #85909f; background: repeating-linear-gradient(135deg,#fafbfd,#fafbfd 4px,#edf0f4 4px,#edf0f4 5px); }
.kd-ready { color: var(--green); border-color: #bcd8cb; background: #f4faf6; }
.kd-pending { color: #8a7039; border-color: #e2d7b8; background: #fbf8ef; }
.kd-is-decision.kd-kind-choice .kd-item:not(.kd-unready) { animation: kd-scan 2s ease-in-out infinite; }
.kd-is-decision.kd-kind-choice .kd-item:nth-child(2) { animation-delay: 1s; }
.kd-is-decision.kd-kind-compare .kd-comparison { animation: kd-arrow 1.2s ease-in-out infinite; }
.kd-response { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 9px 12px; border: 1px solid #b7d8c6; border-radius: 9px; background: #f5faf7; color: var(--green); font-size: 11px; }
.kd-response strong { font: 600 13px 'IBM Plex Mono', monospace; }
.kd-books { display: flex; gap: 3px; padding: 2px 0; }
.kd-books i { display: block; width: 15px; height: 21px; border-radius: 2px 4px 4px 2px; background: #e5ae6c; box-shadow: inset 3px 0 #00000010; transform: rotate(-7deg); }
.kd-books i + i { background: #7f9dc9; transform: rotate(7deg); }
.kd-controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding-top: 15px; border-top: 1px solid #edf1f5; }
.kd-controls .kd-primary { min-width: 100px; color: #fff; background: var(--blue); border-color: var(--blue); }
.kd-controls .kd-primary:hover { background: #2456c3; }
.kd-info { margin-top: 16px; padding: 14px; border: 1px solid var(--line); border-radius: 9px; background: #f8fafc; color: #4d6076; }
.kd-info > div { display: flex; align-items: center; justify-content: space-between; }
.kd-info > div button { min-height: 30px; padding: 3px 9px; }
.kd-info p { margin: 10px 0; font-size: 12px; line-height: 1.8; }
.kd-info a { display: inline-block; margin-right: 12px; color: var(--blue); font-size: 11px; }
.kd-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
.kd-reveal-enter-active, .kd-reveal-leave-active { transition: opacity .12s, transform .12s; }
.kd-reveal-enter-from { opacity: 0; transform: translateX(-4px); }
.kd-reveal-leave-to { opacity: 0; transform: translateX(4px); }
@keyframes kd-arrival { 0%, 65% { opacity: 0; } 100% { opacity: 1; } }
@keyframes kd-pop { 0% { scale: .93; } 70% { scale: 1.03; } 100% { scale: 1; } }
@keyframes kd-unfold { from { opacity: 0; transform: scaleX(.8); } to { opacity: 1; transform: scaleX(1); } }
@keyframes kd-scan { 0%, 100% { border-color: #dfe6ef; } 45% { border-color: #a1b9e4; } }
@keyframes kd-arrow { 50% { transform: translateX(3px); } }
@container (max-width: 550px) {
  .kd-flow { --label: 165px; --gap: 16px; }
  .kd-node { padding: 9px 7px; gap: 5px; }
  .kd-node strong { font-size: 11px; }
  .kd-kind-compare .kd-item { padding: 5px 6px; font-size: 10px; }
}
@container (max-width: 390px) {
  .kd-sections { gap: 6px; }
  .kd-sections select { flex-basis: calc(100% - 65px); font-size: 11px; }
  .kd-progress { width: 100%; text-align: right; }
  .kd-flow { --pitch: 142px; --rail: 9px; }
  .kd-step { display: block; padding-left: 31px; }
  .kd-node { position: relative; top: 8px; margin-top: 0; min-height: 44px; width: 100%; padding: 9px 10px; }
  .kd-node strong { font-size: 12px; }
  .kd-scene { margin-top: 21px; }
  .kd-scene::before { top: -13px; left: 14px; width: 0; height: 9px; border-top: 0; border-left: 1px solid #b8c9e9; }
  .kd-metadata-scene::before { border-left-style: dashed; }
  .kd-phases { position: absolute; top: -12px; right: 0; }
  .kd-content { min-height: 32px; }
  .kd-kind-compare .kd-item { font-size: 9px; }
  .kd-kind-choice .kd-item, .kd-kind-nodes .kd-item, .kd-kind-pods .kd-item, .kd-kind-metadata .kd-item { padding: 4px; }
  .kd-item .kd-item-icon { width: 20px; height: 20px; }
  .kd-item { padding: 5px 7px; font-size: 10px; }
  .kd-item small { font-size: 8px; }
  .kd-kind-nodes .kd-item.kd-input { position: absolute; top: -14px; left: 0; min-height: 14px; max-width: calc(100% - 38px); font-size: 9px; }
  .kd-controls { position: sticky; bottom: 36px; z-index: 4; gap: 5px; padding-block: 9px; border-radius: 9px; background: #fffffff5; }
  .kd-controls button { padding: 8px 9px; font-size: 11px; }
  .kd-controls .kd-primary { min-width: 90px; }
}
@media (max-width: 500px) { .kd-lab { padding: 28px 12px 16px; } }
@media (prefers-reduced-motion: reduce) { .kd-lab *, .kd-lab *::before { animation: none !important; transition: none !important; } }
</style>
