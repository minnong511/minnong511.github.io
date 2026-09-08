<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { journey, journeyFrame, journeyIds, journeyToken, detailDuration, nextDetailCursor, previousDetailCursor } from '~/utils/kubernetes/journey'
import type { JourneyId } from '~/utils/kubernetes/journey'

import { eksJourney } from '~/utils/kubernetes/eks-journey'

const props = defineProps<{ scenario?: 'eks' }>()
const uid = useId()
const selected = ref<JourneyId>('deploy')
const flow = computed(() => props.scenario === 'eks' ? eksJourney : journey(selected.value))
const cursor = ref(-1)
const playing = ref(false)
const infoOpen = ref(false)
const root = ref<HTMLElement>()
const viewport = ref<HTMLElement>()
const tokenTop = ref(26)
const startButton = ref<HTMLButtonElement>()
const frame = computed(() => journeyFrame(flow.value, cursor.value))
const phaseLabels = { arrival: '도착', decision: '판단', result: '결과' }
const token = computed(() => frame.value ? props.scenario === 'eks' ? (frame.value.index < 2 ? '설정' : frame.value.index < 6 ? '선언' : frame.value.done ? 'Ready' : 'Pod') : journeyToken(selected.value, frame.value.step, frame.value.phase) : '')
const reference = computed(() => frame.value && flow.value.references.includes(frame.value.step.id))
let resizeObserver: ResizeObserver | undefined
let timer: ReturnType<typeof setTimeout> | undefined

function pause() {
  playing.value = false
  clearTimeout(timer)
  timer = undefined
}
function follow() {
  const container = viewport.value
  const row = container?.querySelector<HTMLElement>('[aria-current="step"]')
  if (!container || !row) return
  tokenTop.value = row.offsetTop + 26
  const bounds = row.getBoundingClientRect()
  const viewportBounds = container.getBoundingClientRect()
  const inset = 12
  if (bounds.top < viewportBounds.top + inset || bounds.bottom > viewportBounds.bottom - inset) {
    // Scroll only this viewport; scrolling ancestors would move the article.
    const space = Math.max(inset, (container.clientHeight - bounds.height) / 2)
    container.scrollTo({
      top: container.scrollTop + bounds.top - viewportBounds.top - space,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }
}
watch([cursor, selected, infoOpen], () => nextTick(follow), { flush: 'post' })
function advance() {
  cursor.value = nextDetailCursor(cursor.value, flow.value.steps.length)
  infoOpen.value = false
  if (frame.value?.done) pause()
}
function schedule() {
  timer = setTimeout(() => {
    if (!playing.value) return
    advance()
    if (playing.value) schedule()
  }, detailDuration(frame.value?.phase ?? 'arrival'))
}
function play() {
  if (playing.value || frame.value?.done) return
  playing.value = true
  schedule()
}
async function start() {
  if (frame.value) return
  advance()
  play()
  await nextTick()
  root.value?.querySelector<HTMLButtonElement>('[data-action="play"]')?.focus({ preventScroll: true })
}
function next() { pause(); advance() }
function previous() {
  pause()
  cursor.value = previousDetailCursor(cursor.value)
  infoOpen.value = false
  nextTick(() => { if (frame.value) follow(); else { startButton.value?.focus({ preventScroll: true }); showStart() } })
}
async function reset(focus = true) {
  pause()
  cursor.value = -1
  infoOpen.value = false
  if (focus) { await nextTick(); startButton.value?.focus({ preventScroll: true }); showStart() }
}
function showStart() {
  viewport.value?.scrollTo({ top: 0, behavior: 'instant' })
}
function choose(id: JourneyId) { reset(false); selected.value = id; nextTick(showStart) }
function info() { pause(); infoOpen.value = !infoOpen.value }
function visibility() { if (document.hidden) pause() }
onMounted(() => {
  document.addEventListener('visibilitychange', visibility)
  resizeObserver = new ResizeObserver(follow)
  if (viewport.value) resizeObserver.observe(viewport.value)
  const content = viewport.value?.querySelector<HTMLElement>('.kj-flow')
  if (content) resizeObserver.observe(content)
})
onBeforeUnmount(() => { resizeObserver?.disconnect(); pause(); document.removeEventListener('visibilitychange', visibility) })
</script>

<template>
  <section ref="root" class="kj" :aria-label="scenario === 'eks' ? 'EKS 접속과 배포, 모의 실험' : '쿠버네티스 세 가지 흐름, 모의 실험'" :data-journey="selected" :data-cursor="cursor" :data-playing="playing" @keydown.esc="infoOpen = false">
    <div class="kj-toolbar">
      <div v-if="scenario !== 'eks'" class="kj-tabs" role="group" aria-label="따라갈 흐름">
        <button v-for="(id, index) in journeyIds" :key="id" type="button" :aria-pressed="selected === id" @click="choose(id)"><span>{{ index + 1 }}</span>{{ journey(id).label }}</button>
      </div>
      <div class="kj-controls" role="group" aria-label="흐름 재생">
        <button v-if="!frame" ref="startButton" class="kj-primary" type="button" data-action="start" @click="start">시작 <span aria-hidden="true">↓</span></button>
        <template v-else>
          <button type="button" data-action="previous" @click="previous">이전</button>
          <button type="button" data-action="next" :disabled="frame.done" @click="next">다음</button>
          <button class="kj-primary" type="button" data-action="play" :disabled="frame.done" :aria-pressed="playing" @click="playing ? pause() : play()">{{ playing ? '일시 정지' : '재생' }}</button>
          <button type="button" data-action="reset" @click="reset()">초기화</button>
          <span class="kj-progress">{{ frame.done ? '✓ 완료' : `${frame.index + 1} / ${flow.steps.length}` }}</span>
        </template>
      </div>
    </div>

    <div ref="viewport" class="kj-viewport" tabindex="0" role="region" aria-label="플로우 스크롤 영역">
      <div class="kj-flow" :style="{ '--token-top': `${tokenTop}px` }" role="list" aria-label="위에서 아래로 진행되는 처리 순서">
        <div class="kj-rail" aria-hidden="true" />
        <div v-if="frame" class="kj-token" :class="{ 'kj-token-result': frame.phase === 'result' }" aria-hidden="true">{{ token }}</div>
        <div v-for="(step, index) in flow.steps" :key="step.id" class="kj-row" role="listitem" :data-step="step.id" :class="{ active: frame?.index === index, completed: frame && index < frame.index }" :aria-current="frame?.index === index ? 'step' : undefined">
          <span class="kj-dot" aria-hidden="true">{{ frame && index < frame.index ? '✓' : '' }}</span>
          <div class="kj-label"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ step.label }}</strong><small v-if="frame && index < frame.index" class="kj-result">{{ step.result.items[0]?.text }}</small></div>
          <div v-if="frame?.index === index" class="kj-scene" :class="{ 'kj-reference': reference }" :data-phase="frame.phase">
            <div class="kj-scene-top"><span>{{ reference ? '참조 · ' : '' }}{{ phaseLabels[frame.phase] }}</span><button type="button" class="kj-info-button" :aria-label="`${step.label} 설명`" :aria-expanded="infoOpen" :aria-controls="`${uid}-info`" @click="info">i</button></div>
            <div :key="cursor" class="kj-values" :class="[`kind-${frame.scene.kind}`, `phase-${frame.phase}`, { success: frame.scene.success }]">
              <template v-for="(item, itemIndex) in frame.scene.items" :key="itemIndex">
                <span v-if="frame.scene.kind === 'compare' && itemIndex > 0" class="kj-compare" aria-hidden="true">{{ frame.scene.success ? '✓' : '↔' }}</span>
                <span class="kj-value" :class="{ picked: item.selected, faded: frame.scene.items.some(i => i.selected) && !item.selected, unready: item.status === 'unready' }"><span>{{ item.text }}</span><b v-if="item.selected || item.status === 'ready'" aria-label="선택 또는 준비 완료">✓</b><b v-else-if="item.status === 'unready'" aria-label="준비 안 됨">−</b><b v-else-if="item.status === 'pending'" aria-label="대기">◷</b></span>
              </template>
            </div>
            <aside v-if="infoOpen" :id="`${uid}-info`" class="kj-info">
              <button type="button" aria-label="설명 닫기" @click="infoOpen = false">×</button>
              <p>{{ step.info }}</p>
              <details><summary>예시의 전제와 공식 자료</summary><p>{{ flow.note }}</p><a v-for="source in flow.sources" :key="source.href" :href="source.href" target="_blank" rel="noopener noreferrer">{{ source.label }} ↗</a></details>
            </aside>
          </div>
        </div>
      </div>
    </div>
    <span class="kj-live" role="status" aria-live="polite" aria-atomic="true">{{ frame ? `${frame.step.label}, ${phaseLabels[frame.phase]}, ${frame.scene.items.map(item => item.text).join(', ')}${frame.done ? ', 완료' : ''}` : '시작 대기' }}</span>
    <noscript>이 애니메이션은 JavaScript가 필요합니다. 아래의 ‘이 글의 예시와 읽는 방법’을 펼쳐 흐름을 확인할 수 있습니다.</noscript>
  </section>
</template>

<style scoped>
.kj { --blue: #245ddd; --ink: #1e293b; --line: #dbe3ee; --pitch: 108px; container-type: inline-size; position: relative; isolation: isolate; margin: 24px 0; padding: 0 20px 16px; background: #fff; color: var(--ink); border-radius: 12px; font: 14px/1.5 Pretendard, sans-serif; }
.kj *, .kj *::before, .kj *::after { box-sizing: border-box; }
.kj button { color: var(--ink); font: inherit; font-size: 13px; min-height: 40px; padding: 8px 12px; cursor: pointer; border: 1px solid var(--line); background: #fff; border-radius: 6px; }
.kj button:hover { background: #eff5ff; }
.kj-viewport:focus-visible, .kj button:focus-visible, .kj a:focus-visible, .kj summary:focus-visible { outline: 3px solid #83a9ff; outline-offset: 3px; }
.kj button:disabled { cursor: default; opacity: .45; }
.kj-toolbar { position: relative; z-index: 8; background: #fff; padding: 10px 0 8px; border-bottom: 1px solid #eef1f6; }
.kj-tabs { display: flex; gap: 5px; }
.kj-tabs button { border: 0; flex: 1; padding: 10px 6px; white-space: nowrap; color: #64748b; }
.kj-tabs button span { margin-right: 7px; font-size: 11px; }
.kj-tabs button[aria-pressed='true'] { color: var(--blue); background: #eff5ff; font-weight: 700; }
.kj-controls { display: flex; align-items: center; gap: 6px; min-height: 54px; padding-top: 10px; }
.kj-controls .kj-primary { color: #fff; background: var(--blue); border-color: var(--blue); min-width: 90px; }
.kj-controls .kj-primary:hover { background: #174dc3; }
.kj-progress { margin-left: auto; color: #446385; font-size: 12px; font-variant-numeric: tabular-nums; }
.kj-viewport { max-height: min(520px, 55dvh); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-gutter: stable; overflow-anchor: none; position: relative; margin-top: 8px; }
.kj-flow { position: relative; margin: 0 auto; max-width: 840px; }
.kj-rail { position: absolute; left: 25px; top: 40px; bottom: calc(var(--pitch) - 40px); width: 2px; background: var(--line); }
.kj-token { position: absolute; top: var(--token-top, 26px); left: 0; width: 52px; height: 28px; display: grid; place-items: center; z-index: 3; border: 1px solid #fff; border-radius: 6px; background: var(--blue); color: #fff; font-size: 11px; font-weight: 700; box-shadow: 0 0 0 4px #fff; transition: top .55s cubic-bezier(.4,0,.2,1), background .2s; }
.kj-token-result { background: #1648ae; }
.kj-row { display: grid; grid-template-columns: minmax(145px, .85fr) minmax(0, 1.15fr); gap: 14px; position: relative; min-height: var(--pitch); padding: 16px 0 12px 62px; }
.kj-dot { position: absolute; top: 32px; left: 18px; display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: #e8edf5; border: 3px solid #fff; color: #2b6a50; font-size: 11px; }
.kj-label { padding-top: 7px; min-width: 0; color: #758397; }
.kj-label > span { display: block; font-size: 10px; letter-spacing: .1em; margin-bottom: 3px; }
.kj-label strong { font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
.kj-row.active .kj-label { color: var(--blue); }
.kj-row.completed .kj-label { color: #4b5c72; }
.kj-row.completed .kj-dot { background: #e5f2ed; border: 0; }
.kj-result { display: block; margin-top: 5px; color: #657c71; font-size: 10px; overflow-wrap: anywhere; }
.kj-scene { position: relative; min-width: 0; align-self: start; padding-left: 10px; border-left: 2px solid #bed1fb; }
.kj-reference { border-left-style: dashed; }
.kj-scene-top { display: flex; justify-content: space-between; align-items: center; height: 24px; margin-bottom: 7px; font-size: 10px; color: #61758f; }
.kj .kj-info-button { min-height: 28px; width: 28px; border: 0; padding: 2px; border-radius: 50%; font: italic 600 14px Georgia, serif; color: #526986; }
.kj-values { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; animation: kj-reveal .28s ease both; }
.kj-value { display: inline-flex; align-items: center; gap: 5px; min-width: 0; max-width: 100%; padding: 4px 6px; background: #f2f5fa; border: 1px solid transparent; border-radius: 5px; color: #334155; font: 11px/1.45 var(--ui-font, monospace); overflow-wrap: anywhere; }
.kj-compare { color: #83a1d3; font-size: 13px; }
.kj .picked, .kj .success .kj-value { color: #1e4eaf; background: #eaf1ff; border-color: #9ebcf9; }
.kj .faded { opacity: .4; }
.kj .unready { background: #fff3ec; color: #8d4a24; }
.kj-value b { font-weight: 600; }
.kj .phase-decision .kj-value { animation: kj-decide 1.1s ease both; }
.kj .phase-result .picked { animation: kj-pick .3s ease both; }
.kj-info { position: relative; margin-top: 8px; width: 100%; min-width: 0; z-index: 10; max-height: 260px; overflow: auto; overscroll-behavior: contain; padding: 28px 16px 14px; background: #f8fafc; border: 1px solid #cdd8e8; border-radius: 8px; box-shadow: 0 8px 30px #14264818; }
.kj-info > button { position: absolute; top: 2px; right: 3px; border: 0; min-height: 30px; padding: 2px 8px; }
.kj .kj-info p { margin: 0 0 12px; font-size: 12px; line-height: 1.8; color: #34465c; }
.kj-info summary { cursor: pointer; font-size: 11px; }
.kj-info details p { margin-top: 10px; }
.kj-info a { display: block; color: var(--blue); font-size: 11px; margin-top: 5px; }
.kj-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes kj-reveal { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
@keyframes kj-decide { 50% { border-color: #94b4f6; background: #eaf1ff; } }
@keyframes kj-pick { from { transform: scale(.96); } to { transform: scale(1); } }
@container (max-width: 540px) {
  .kj-flow { --pitch: 148px; }
  .kj-row { display: block; padding-left: 62px; }
  .kj-label { min-height: 28px; }
  .kj-label > span { display: inline; margin-right: 7px; }
  .kj-label strong { font-size: 12px; }
  .kj-scene { margin-top: 8px; padding-left: 10px; }
  .kj-scene-top { margin-bottom: 3px; height: 20px; }
  .kj-value { font-size: 10px; padding: 4px 6px; }
  .kj-info { min-width: 0; width: 100%; }
  .kj-tabs button { font-size: 11px; padding: 8px 3px; }
  .kj-tabs button span { margin-right: 4px; }
  .kj-controls { flex-wrap: wrap; gap: 4px; }
  .kj-controls button { font-size: 11px; padding: 6px 8px; min-height: 36px; }
  .kj-controls .kj-primary { min-width: 68px; }
  .kj-progress { font-size: 10px; }
}
@media (max-width: 600px) { .kj { padding-right: 12px; padding-left: 12px; } }
@media (prefers-reduced-motion: reduce) { .kj-token { transition: none; } .kj-values, .kj .phase-decision .kj-value, .kj .phase-result .picked { animation: none; } }
</style>
