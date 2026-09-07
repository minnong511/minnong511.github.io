<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import Diagram from '~/components/semiconductor/Diagram.vue'
import { buildModel, initialState, sceneIds, sceneTitles, stepsFor, stepState } from '~/utils/semiconductor/model'
import type { Lesson, SceneId } from '~/utils/semiconductor/model'
import type { SceneRenderer } from '~/utils/semiconductor/renderer'
import type { PlaybackMode, PlaybackProgress } from '~/utils/semiconductor/playback'

const props = defineProps<{ scene: SceneId }>()
const valid = computed(() => sceneIds.includes(props.scene))
const scene = computed(() => valid.value ? props.scene : 'mosfet')
const state = ref(initialState(scene.value))
const root = ref<HTMLElement | null>(null)
const mount = ref<HTMLElement | null>(null)
const id = useId()
const activeId = useState<string | null>('semiconductor:active-id', () => null)
const status = ref<'idle' | 'loading' | 'active' | 'error'>('idle')
const ready = ref(false)
const playing = ref(false)
const paused = ref(false)
const progress = ref(0)
const speed = ref(1)
const reducedMotion = ref(false)
const showLabels = ref(false)
const cameraView = ref<'iso' | 'top' | 'side'>('iso')
const cameraZoom = ref(1)
const mode = ref<PlaybackMode>(props.scene === 'mosfet' || props.scene === 'hbm' ? 'flow' : 'process')
const motionNote = computed(() => {
  if (scene.value === 'industry-chain') return '설계 → 데이터 인계 → 웨이퍼 제조 → 다이 전달 → 패키징 → 시스템 탑재를 재생한다. 보라색 점은 설계 정보, 노란 다이는 실제 제품의 이동을 뜻한다. 마지막 단계에서 멈춘다.'
  if (scene.value === 'dram-cell') return '쓰기 → 보관 → 읽기 → 복원 과정을 재생한다. 노란 점은 전하 전달 경로, 전극 옆 노란 표시의 길이는 저장 상태의 상대값이다. 실제 전자의 이동 방향·개수나 소요 시간을 뜻하지 않는다.'
  if (mode.value === 'process') return '재료가 쌓이고 제거되거나 칩이 조립되는 과정을 순서대로 재생한다. 밝은 이동 표식은 처리·검사 위치이며 실제 장비 형태는 생략했다. 마지막 단계에서 멈춘다.'
  if (scene.value === 'mosfet') return '게이트 전압이 높은 ON 상태에서 노란 전자가 소스 → 드레인으로 이동한다. 관습적 전류 방향은 반대이며, 전자가 게이트 절연막을 통과하는 것은 아니다.'
  if (scene.value === 'nand-3d') return '읽기 조건이 준비된 경우의 채널 경로다. 노란 점은 채널의 전자 이동을 나타낸다. 저장막에 보관한 전하가 채널로 빠져나오는 장면은 아니다.'
  return '보라색은 GPU → HBM 읽기 요청, 노란색은 HBM → GPU 데이터 전달을 나타낸다. 인터포저와 TSV 경로를 단순화했으며 실제 버스 타이밍은 아니다.'
})
const steps = computed(() => stepsFor(scene.value, state.value.lesson))
const current = computed(() => steps.value[state.value.step]!)
const parts = computed(() => buildModel(state.value))
const previous = computed(() => buildModel(stepState(state.value, state.value.step - 1)))
const legend = computed(() => [...new Map(parts.value.map(p => [p.label, { label: p.label, color: p.color }])).values()])
const beforeAfter = computed(() => scene.value === 'wafer-process' && state.value.step > 0)
const caption = computed(() => {
  if (mode.value === 'flow' && (playing.value || paused.value)) {
    if (scene.value === 'hbm') return progress.value < 50
      ? { title: 'GPU → HBM · 읽기 요청', text: '보라색 표식이 인터포저와 TSV를 따라 HBM으로 향한다.' }
      : { title: 'HBM → GPU · 데이터 전달', text: '노란색 표식이 반대 경로로 돌아오며 GPU에 데이터를 전달한다.' }
    if (scene.value === 'mosfet') return state.value.voltage < 50
      ? { title: 'OFF · 통로가 닫힌 상태', text: '게이트 전압이 낮아 소스와 드레인을 잇는 채널이 형성되지 않는다.' }
      : { title: 'ON · 전자가 이동하는 통로', text: '노란 전자가 소스에서 드레인으로 이동한다. 게이트 절연막은 통과하지 않는다.' }
    if (scene.value === 'nand-3d') return { title: '읽기 · 수직 채널을 따라 이동', text: '노란 표식은 채널의 전자 이동이다. 저장막의 전하가 빠져나오는 장면은 아니다.' }
  }
  return { title: current.value.title, text: current.value.action.split(/(?<=\.)\s/)[0]! }
})
const playLabel = computed(() => status.value === 'loading' ? '준비 중' : playing.value ? '일시정지' : paused.value ? '이어서' : progress.value === 100 ? '다시 재생' : '재생')
const stepPercent = computed(() => state.value.step / Math.max(1, steps.value.length - 1) * 100)
let runtime: SceneRenderer | null = null
let generation = 0
let observer: IntersectionObserver | undefined
let disposed = false
let syncingStep = false
let motionQuery: MediaQueryList | undefined

function pausePlayback() {
  if (!playing.value) return
  runtime?.pause()
  playing.value = false
  paused.value = true
}
function cancelPlayback() {
  runtime?.pause()
  playing.value = false
  paused.value = false
  progress.value = 0
}
function reportPlayback(sample: PlaybackProgress) {
  if (state.value.step !== sample.step) {
    syncingStep = true
    state.value = stepState(state.value, sample.step)
    syncingStep = false
  }
  progress.value = Math.round(sample.progress * 100)
  if (sample.finished) { playing.value = false; paused.value = false }
}
async function togglePlayback() {
  if (playing.value) { pausePlayback(); return }
  if (status.value === 'loading') return
  if (paused.value && runtime) {
    playing.value = true
    paused.value = false
    runtime.resume()
    return
  }
  const flowStep = scene.value === 'mosfet' ? state.value.step || 2 : 3
  const step = mode.value === 'flow' ? flowStep : progress.value === 100 ? 0 : state.value.step
  state.value = { ...(scene.value === 'mosfet' && state.value.step > 0 ? state.value : stepState(state.value, step)), exploded: false, cutaway: state.value.cutaway }
  if (status.value !== 'active') await activate()
  if (!runtime || status.value !== 'active' || document.hidden) return
  playing.value = true
  runtime.play(state.value, mode.value, { reducedMotion: reducedMotion.value, speed: speed.value, onProgress: reportPlayback })
}
function visibilityChanged() {
  if (!document.hidden) return
  if (status.value === 'loading') stop()
  else pausePlayback()
}
function motionChanged() {
  reducedMotion.value = Boolean(motionQuery?.matches)
  cancelPlayback()
  runtime?.update(parts.value, state.value.cutaway)
}

function stop(error = false) {
  cancelPlayback()
  generation++
  runtime?.dispose()
  runtime = null
  status.value = error ? 'error' : 'idle'
  if (activeId.value === id) activeId.value = null
}
async function activate() {
  if (status.value === 'loading' || status.value === 'active') return
  activeId.value = id
  status.value = 'loading'
  const token = ++generation
  try {
    const { createSceneRenderer } = await import('~/utils/semiconductor/renderer')
    await nextTick()
    if (disposed || token !== generation || activeId.value !== id || !mount.value) return
    runtime = createSceneRenderer(mount.value, () => stop(true))
    runtime.update(parts.value, state.value.cutaway)
    cameraView.value = 'iso'
    cameraZoom.value = 1
    status.value = 'active'
  } catch (error) {
    if (!disposed && token === generation) {
      console.warn('[semiconductor] 3D unavailable; retaining the diagram.', error)
      stop(true)
    }
  }
}
function go(next: number) { state.value = stepState(state.value, next) }
function chooseLesson(lesson: Lesson) {
  state.value = { ...initialState(scene.value), lesson, cutaway: state.value.cutaway }
}
function voltage(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  state.value = { ...state.value, voltage: value, step: value >= 50 ? 2 : 1 }
}
function reset() {
  cancelPlayback()
  state.value = initialState(scene.value)
  setView('iso')
}
function setView(direction: 'iso' | 'top' | 'side') {
  cameraView.value = direction
  cameraZoom.value = 1
  runtime?.view(direction)
}
function zoomCamera(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  runtime?.zoom(value / cameraZoom.value)
  cameraZoom.value = value
}
function key(event: KeyboardEvent) {
  if (event.target !== event.currentTarget || !runtime) return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    runtime.rotate(event.key === 'ArrowLeft' ? -1 : 1)
  }
}
watch(state, () => {
  if (syncingStep) return
  cancelPlayback()
  runtime?.update(parts.value, state.value.cutaway)
}, { deep: true, flush: 'sync' })
watch(mode, (value) => {
  cancelPlayback()
  if (value === 'process') state.value = stepState(state.value, 0)
  else state.value = stepState(state.value, 3)
})
watch(speed, value => runtime?.speed(value))
watch(activeId, value => {
  if (value !== id && (status.value === 'active' || status.value === 'loading')) stop()
}, { flush: 'sync' })
watch(scene, value => { stop(); state.value = initialState(value); mode.value = value === 'mosfet' || value === 'hbm' ? 'flow' : 'process' })
onMounted(() => {
  ready.value = true
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', motionChanged)
  document.addEventListener('visibilitychange', visibilityChanged)
  observer = new IntersectionObserver(([entry]) => {
    if (entry && !entry.isIntersecting && (status.value === 'active' || status.value === 'loading')) stop()
  })
  if (root.value) observer.observe(root.value)
})
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  motionQuery?.removeEventListener('change', motionChanged)
  document.removeEventListener('visibilitychange', visibilityChanged)
  stop()
})
</script>

<template>
  <section v-if="valid" ref="root" class="semi-explorer" :data-scene="scene" :data-status="status" :data-ready="ready" :data-playing="playing" :data-playback-mode="mode" :data-labels="showLabels" :aria-labelledby="`${id}-title`">
    <header class="semi-heading">
      <span class="semi-eyebrow">직접 살펴보기</span>
      <h3 :id="`${id}-title`">{{ sceneTitles[scene] }}</h3>
    </header>
    <fieldset class="semi-body" :disabled="!ready" aria-label="시각화 조작">
      <div v-if="scene === 'wafer-process' || scene === 'nand-3d' || scene === 'hbm'" class="semi-modes">
        <div v-if="scene === 'wafer-process'" class="semi-segmented" role="group" aria-label="실습 선택">
          <button type="button" :aria-pressed="state.lesson === 'patterning'" @click="chooseLesson('patterning')">패턴·배선</button>
          <button type="button" :aria-pressed="state.lesson === 'oxidation'" @click="chooseLesson('oxidation')">산화·증착</button>
          <button type="button" :aria-pressed="state.lesson === 'doping'" @click="chooseLesson('doping')">도핑·열처리</button>
        </div>
        <div v-else class="semi-segmented" role="group" aria-label="재생 내용">
          <button type="button" :aria-pressed="mode === 'process'" @click="mode = 'process'">{{ scene === 'hbm' ? '적층·조립' : '제조 과정' }}</button>
          <button type="button" :aria-pressed="mode === 'flow'" @click="mode = 'flow'">{{ scene === 'hbm' ? '데이터 흐름' : '읽기 경로' }}</button>
        </div>
      </div>

      <div class="semi-stage">
        <div class="semi-viewport" tabindex="0" aria-label="모형 영역. 3D에서는 드래그 또는 좌우 방향키로 회전" @keydown="key">
          <div v-show="status === 'active'" ref="mount" class="semi-canvas" />
          <Diagram v-if="status !== 'active'" :parts="parts" :cutaway="state.cutaway" :label="`${sceneTitles[scene]}: ${current.title}`" />
          <div class="semi-stage-topline" aria-hidden="true">
            <span class="semi-stage-badge"><i :class="{ 'is-playing': playing }" />{{ playing ? '재생 중' : paused ? '일시정지' : status === 'active' ? '드래그로 회전' : '재생을 눌러 시작' }}</span>
            <span>{{ state.cutaway ? '단면' : '전체 구조' }}</span>
          </div>
        </div>
        <div class="semi-caption" aria-live="polite" aria-atomic="true">
          <Transition name="semi-caption" mode="out-in">
            <div :key="`${scene}-${state.lesson}-${caption.title}`" class="semi-caption-content">
              <span class="semi-caption-number" aria-hidden="true">{{ String(state.step + 1).padStart(2, '0') }}</span>
              <div><h4>{{ caption.title }}</h4><p>{{ caption.text }}</p></div>
            </div>
          </Transition>
        </div>
        <div class="semi-motion-track" aria-hidden="true"><span :style="{ transform: `scaleX(${progress / 100})` }" /></div>
      </div>

      <div class="semi-console">
        <div class="semi-transport">
          <button type="button" class="semi-primary" :disabled="status === 'loading'" :aria-label="playLabel" :aria-pressed="playing" @click="togglePlayback">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path v-if="playing" d="M5 4h3v12H5zm7 0h3v12h-3z" /><path v-else-if="progress === 100" d="M16 9a6 6 0 1 0-1 5l-2-1a3.8 3.8 0 1 1 1-4h-3l4 4 4-4z" /><path v-else d="M6 3.5v13l10-6.5z" /></svg>
            <span>{{ playLabel }}</span>
          </button>
          <div class="semi-timeline">
            <label :for="`${id}-step`"><span>{{ current.title }}</span><output>{{ state.step + 1 }} <span>/ {{ steps.length }}</span></output></label>
            <input :id="`${id}-step`" type="range" min="0" :max="steps.length - 1" step="1" :value="state.step" :style="{ '--range-fill': `${stepPercent}%` }" aria-label="단계" :aria-valuetext="`${state.step + 1}단계, ${current.title}`" @input="go(Number(($event.target as HTMLInputElement).value))">
          </div>
          <button type="button" class="semi-reset" aria-label="처음으로" title="처음으로" @click="reset"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.5 7M4 4v6h6" /></svg></button>
        </div>
        <div class="semi-toggles" role="group" aria-label="모형 보기">
          <button type="button" class="semi-switch" role="switch" :aria-checked="state.cutaway" @click="state.cutaway = !state.cutaway"><span class="semi-switch-track" aria-hidden="true" />단면</button>
          <button v-if="['mosfet', 'packaging', 'nand-3d', 'hbm'].includes(scene)" type="button" class="semi-switch" role="switch" :aria-checked="state.exploded" @click="state.exploded = !state.exploded"><span class="semi-switch-track" aria-hidden="true" />분해</button>
          <button type="button" class="semi-switch" role="switch" :aria-checked="status === 'active'" :disabled="status === 'loading'" @click="status === 'active' ? stop() : activate()"><span class="semi-switch-track" aria-hidden="true" />3D</button>
        </div>

        <div v-if="scene === 'mosfet'" class="semi-input">
          <label :for="`${id}-voltage`">게이트 전압 <output :class="{ 'semi-on': state.voltage >= 50 }">{{ state.voltage < 50 ? 'OFF' : 'ON' }}</output></label>
          <input :id="`${id}-voltage`" type="range" min="0" max="100" :value="state.voltage" :style="{ '--range-fill': `${state.voltage}%` }" :aria-valuetext="state.voltage < 50 ? '낮은 전압, OFF' : '높은 전압, ON'" @input="voltage">
          <div class="semi-range-ends" aria-hidden="true"><span>낮음</span><span>높음</span></div>
        </div>
        <div v-if="scene === 'packaging'" class="semi-input">
          <span class="semi-field-label">연결 방식 <small>5단계부터 적용</small></span>
          <div class="semi-segmented" role="group" aria-label="연결 방식">
            <button type="button" :aria-pressed="state.bonding === 'wire'" @click="state.bonding = 'wire'">와이어 본딩</button>
            <button type="button" :aria-pressed="state.bonding === 'flip'" @click="state.bonding = 'flip'">플립칩</button>
          </div>
        </div>
        <div v-if="scene === 'nand-3d'" class="semi-input">
          <label :for="`${id}-layer`">살펴볼 워드라인 <output>아래에서 {{ state.selectedLayer + 1 }}번째</output></label>
          <input :id="`${id}-layer`" v-model.number="state.selectedLayer" type="range" min="0" max="5" :style="{ '--range-fill': `${state.selectedLayer / 5 * 100}%` }" :aria-valuetext="`아래에서 ${state.selectedLayer + 1}번째 워드라인`" @input="state.step = 3">
        </div>
      </div>

      <p v-if="status === 'error'" class="semi-error" role="status">3D를 열지 못했어요. 단계 슬라이더로 구조도를 살펴보거나 3D를 다시 켜주세요.</p>
      <p v-if="reducedMotion" class="semi-feedback">모션 감소 설정에 따라 움직임 대신 단계별 상태를 표시합니다.</p>
      <noscript><p class="semi-feedback">JavaScript가 꺼져 있어 기본 구조도를 표시합니다. 본문에서 전체 과정을 확인할 수 있습니다.</p></noscript>

      <details class="semi-details">
        <summary>자세히 보기 <span>설명·속도·시점</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg></summary>
        <div class="semi-detail-content">
          <div class="semi-explanation">
            <span class="semi-eyebrow">{{ current.title }}</span>
            <p>{{ current.action }}</p>
            <p><strong>왜 필요한가 · </strong>{{ current.reason }}</p>
            <p class="semi-motion-note">{{ motionNote }}</p>
            <p v-if="scene === 'mosfet'" class="semi-motion-note">게이트 전압은 상대값입니다. 드레인·소스 사이 전압은 고정했으며 실제 전압·전류 계산은 아닙니다.</p>
            <a v-if="scene === 'nand-3d' && mode === 'flow'" href="https://www.kioxia.com/en-jp/rd/technology/nand-flash.html" target="_blank" rel="noopener noreferrer">읽기 원리 참고 · KIOXIA ↗</a>
          </div>
          <div class="semi-settings">
            <div class="semi-input">
              <label :for="`${id}-speed`">재생 속도 <output>{{ speed }}×</output></label>
              <input :id="`${id}-speed`" v-model.number="speed" type="range" min="0.5" max="2" step="0.5" :style="{ '--range-fill': `${(speed - 0.5) / 1.5 * 100}%` }" :aria-valuetext="`${speed}배속`">
              <div class="semi-range-ends" aria-hidden="true"><span>느리게</span><span>빠르게</span></div>
            </div>
            <template v-if="status === 'active'">
              <div class="semi-input">
                <span class="semi-field-label">시점</span>
                <div class="semi-segmented" role="group" aria-label="3D 시점">
                  <button type="button" :aria-pressed="cameraView === 'iso'" @click="setView('iso')">입체</button>
                  <button type="button" :aria-pressed="cameraView === 'top'" @click="setView('top')">위</button>
                  <button type="button" :aria-pressed="cameraView === 'side'" @click="setView('side')">옆</button>
                </div>
              </div>
              <div class="semi-input">
                <label :for="`${id}-zoom`">확대 <output>{{ cameraZoom.toFixed(1) }}×</output></label>
                <input :id="`${id}-zoom`" type="range" min="0.7" max="2" step="0.1" :value="cameraZoom" :style="{ '--range-fill': `${(cameraZoom - 0.7) / 1.3 * 100}%` }" :aria-valuetext="`${cameraZoom.toFixed(1)}배 확대`" @input="zoomCamera">
              </div>
              <button type="button" class="semi-switch" role="switch" :aria-checked="showLabels" @click="showLabels = !showLabels"><span class="semi-switch-track" aria-hidden="true" />부품 이름</button>
            </template>
          </div>
          <div v-if="beforeAfter" class="semi-comparison">
            <figure><Diagram :parts="previous" :cutaway="state.cutaway" :label="`직전 단계: ${steps[state.step - 1]?.title}`" /><figcaption>전 · {{ steps[state.step - 1]?.title }}</figcaption></figure>
            <figure><Diagram :parts="parts" :cutaway="state.cutaway" :label="`현재 단계: ${current.title}`" /><figcaption>후 · {{ current.title }}</figcaption></figure>
          </div>
          <p v-if="beforeAfter && (playing || paused)" class="semi-motion-note">전후 구조도는 각 단계가 완료된 모습을 비교합니다.</p>
          <ul class="semi-legend" aria-label="재료와 부품 범례">
            <li v-for="item in legend" :key="item.label"><i :style="{ background: item.color }" aria-hidden="true" />{{ item.label }}</li>
          </ul>
          <p class="semi-motion-note">단계·구조를 바꾸면 재생이 멈춥니다. 3D에서 드래그하거나 모형에 초점을 맞추고 좌우 방향키로 회전할 수 있습니다. 흐름 표식은 내부 경로가 보이도록 모형 위에 겹쳐 표시합니다.</p>
          <p class="semi-motion-note">크기·층수·색·공정 순서를 단순화한 모형입니다. 실제 제조 레시피나 물리 시뮬레이션이 아니며, 분해 간격은 관찰을 위한 것입니다. 기술 근거는 본문 참고자료에 연결했습니다.</p>
        </div>
      </details>
      <p class="semi-note">원리 이해를 위한 개념 모형</p>
    </fieldset>
  </section>
  <p v-else>지원하지 않는 학습 장면입니다. 본문 설명을 확인해 주세요.</p>
</template>

<style scoped>
.semi-explorer { --semi-ink: #eaf0f8; --semi-muted: #9dacbf; --semi-accent: #8bdfcb; --semi-border: #2b3c51; container-type: inline-size; box-sizing: border-box; margin: 2em 0; overflow: hidden; border: 1px solid var(--semi-border); border-radius: 20px; background: #152233; color: var(--semi-ink); font-family: var(--ui-font, sans-serif); font-size: 14px; line-height: 1.6; color-scheme: dark; }
.semi-explorer *, .semi-explorer *::before, .semi-explorer *::after { box-sizing: border-box; }
.semi-heading { padding: 22px 24px 18px; }
.semi-eyebrow { color: var(--semi-accent); font-size: 11px; font-weight: 600; letter-spacing: .04em; }
.semi-explorer h3 { margin: 5px 0 0 !important; padding: 0; border: 0; color: var(--semi-ink); font-size: clamp(17px, 3cqi, 22px); font-weight: 650; line-height: 1.5; word-break: keep-all; }
.semi-body { min-width: 0; margin: 0; padding: 0; border: 0; }
.semi-explorer p { margin: 0; color: var(--semi-muted); font-size: 13px; line-height: 1.75; word-break: keep-all; overflow-wrap: anywhere; }
.semi-explorer button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; margin: 0; padding: 9px 14px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--semi-ink); font: inherit; font-size: 12px; line-height: 1.4; cursor: pointer; transition: background .18s, color .18s, border-color .18s; }
.semi-explorer button:hover:not(:disabled) { background: #26394f; }
.semi-explorer button:disabled { opacity: .45; cursor: default; }
.semi-explorer :focus-visible { outline: 3px solid #f4c876; outline-offset: 3px; }
.semi-explorer button svg { width: 20px; height: 20px; flex: 0 0 auto; }
.semi-modes { padding: 0 24px 18px; }
.semi-segmented { display: flex; gap: 3px; width: fit-content; max-width: 100%; padding: 3px; border: 1px solid var(--semi-border); border-radius: 12px; background: #101c2c; }
.semi-segmented button { flex: 1 1 0; min-width: 0; padding: 8px 15px; white-space: nowrap; color: var(--semi-muted); }
.semi-segmented button[aria-pressed="true"] { background: #2a414e; color: #b0f3df; box-shadow: 0 1px 4px #0002; }
.semi-stage { position: relative; background: #101b2c; border-top: 1px solid #ffffff05; }
.semi-viewport { position: relative; height: clamp(240px, 53cqi, 370px); overflow: hidden; }
.semi-canvas { position: relative; width: 100%; height: 100%; }
.semi-canvas :deep(canvas) { display: block; width: 100%; height: 100%; }
.semi-canvas :deep(.semi-3d-labels) { display: none; position: absolute; inset: 0; pointer-events: none; }
.semi-explorer[data-labels="true"] .semi-canvas :deep(.semi-3d-labels) { display: block; }
.semi-canvas :deep(.semi-3d-labels span) { position: absolute; transform: translate(-50%, -100%); max-width: 160px; padding: 3px 7px; border: 1px solid #52647a; border-radius: 5px; background: #101b2ce8; color: #eff8ff; font-size: 10px; line-height: 1.5; text-align: center; }
.semi-stage-topline { position: absolute; inset: 14px 20px auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--semi-muted); font-size: 10px; pointer-events: none; }
.semi-stage-badge { display: inline-flex; align-items: center; gap: 7px; }
.semi-stage-badge i { width: 5px; height: 5px; border-radius: 50%; background: #6e8299; }
.semi-stage-badge i.is-playing { background: var(--semi-accent); box-shadow: 0 0 10px #8bdfcb88; }
.semi-caption { display: grid; align-items: center; min-height: 122px; padding: 12px 24px 22px; background: linear-gradient(180deg, #101b2c, #132131); }
.semi-caption-content { display: grid; grid-template-columns: 32px minmax(0, 1fr); align-items: start; gap: 13px; }
.semi-caption-number { display: grid; place-items: center; height: 32px; margin-top: 1px; border: 1px solid #8bdfcb33; border-radius: 10px; background: #8bdfcb0a; color: var(--semi-accent); font-size: 12px; font-variant-numeric: tabular-nums; }
.semi-caption h4 { margin: 0 0 5px; color: var(--semi-ink); font-size: 16px; font-weight: 650; line-height: 1.5; word-break: keep-all; overflow-wrap: anywhere; }
.semi-caption p { color: #b9c7d8; }
.semi-caption-enter-active, .semi-caption-leave-active { transition: opacity .18s ease, transform .18s ease; }
.semi-caption-enter-from { opacity: 0; transform: translateY(6px); }
.semi-caption-leave-to { opacity: 0; transform: translateY(-4px); }
.semi-motion-track { height: 2px; background: #25364a; overflow: hidden; }
.semi-motion-track span { display: block; width: 100%; height: 100%; background: var(--semi-accent); transform-origin: left; }
.semi-console { padding: 18px 24px 12px; }
.semi-transport { display: flex; align-items: center; gap: 18px; }
.semi-explorer button.semi-primary { flex: 0 0 auto; min-width: 100px; background: var(--semi-accent); color: #102a2b; font-weight: 700; }
.semi-explorer button.semi-primary:hover:not(:disabled) { background: #a8eddc; }
.semi-primary svg { fill: currentColor; }
.semi-timeline { flex: 1; min-width: 0; }
.semi-timeline label, .semi-input label, .semi-field-label { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: #d1dce9; font-size: 12px; }
.semi-timeline label > span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.semi-explorer output { flex: 0 0 auto; color: var(--semi-accent); font-size: 11px; font-variant-numeric: tabular-nums; }
.semi-timeline output > span { color: var(--semi-muted); }
.semi-explorer input[type="range"] { --range-fill: 0%; display: block; appearance: none; width: 100%; min-width: 0; height: 28px; margin: 1px 0 0; padding: 0; border: 0; background: transparent; cursor: pointer; touch-action: pan-y; }
.semi-explorer input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 3px; background: linear-gradient(to right, var(--semi-accent) var(--range-fill), #3b4b60 var(--range-fill)); }
.semi-explorer input[type="range"]::-webkit-slider-thumb { appearance: none; width: 15px; height: 15px; margin-top: -5.5px; border: 3px solid #152233; border-radius: 50%; background: #b4f4e2; box-shadow: 0 0 0 1px #8bdfcb88; }
.semi-explorer input[type="range"]::-moz-range-track { height: 4px; border-radius: 3px; background: #3b4b60; }
.semi-explorer input[type="range"]::-moz-range-progress { height: 4px; background: var(--semi-accent); }
.semi-explorer input[type="range"]::-moz-range-thumb { width: 10px; height: 10px; border: 3px solid #152233; border-radius: 50%; background: #b4f4e2; box-shadow: 0 0 0 1px #8bdfcb88; }
.semi-explorer input[type="range"]:disabled { opacity: .45; }
.semi-explorer button.semi-reset { flex: 0 0 44px; width: 44px; padding: 10px; color: var(--semi-muted); }
.semi-toggles { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 12px; }
.semi-explorer button.semi-switch { justify-content: flex-start; gap: 8px; padding: 7px 0; color: #afbed0; }
.semi-explorer button.semi-switch:hover:not(:disabled) { background: transparent; color: var(--semi-ink); }
.semi-switch-track { display: inline-block; position: relative; width: 28px; height: 16px; flex: 0 0 auto; border: 1px solid #5b6b7f; border-radius: 20px; background: #26374b; transition: background .18s, border-color .18s; }
.semi-switch-track::after { content: ''; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; border-radius: 50%; background: #a2b1c2; transition: transform .18s; }
.semi-switch[aria-checked="true"] { color: var(--semi-ink); }
.semi-switch[aria-checked="true"] .semi-switch-track { border-color: var(--semi-accent); background: var(--semi-accent); }
.semi-switch[aria-checked="true"] .semi-switch-track::after { transform: translateX(12px); background: #173533; }
.semi-input { display: grid; min-width: 0; gap: 3px; padding-top: 14px; }
.semi-console > .semi-input { margin-top: 10px; padding-top: 16px; border-top: 1px solid var(--semi-border); }
.semi-range-ends { display: flex; justify-content: space-between; margin-top: -3px; color: var(--semi-muted); font-size: 10px; }
.semi-field-label small { color: var(--semi-muted); font-size: 10px; }
.semi-input .semi-segmented { margin-top: 6px; }
.semi-input output { color: var(--semi-muted); }
.semi-input output.semi-on { color: var(--semi-accent); }
.semi-details { margin: 0 24px; border-top: 1px solid var(--semi-border); }
.semi-details summary { display: flex; align-items: center; gap: 12px; min-height: 48px; margin: 0; color: #c6d3e2; font-size: 12px; cursor: pointer; list-style: none; }
.semi-details summary::-webkit-details-marker { display: none; }
.semi-details summary > span { margin-left: auto; color: var(--semi-muted); font-size: 10px; }
.semi-details summary > svg { width: 16px; height: 16px; transition: transform .18s; }
.semi-details[open] summary > svg { transform: rotate(180deg); }
.semi-detail-content { padding: 8px 0 16px; }
.semi-explanation p { margin-top: 6px; }
.semi-explanation a { display: inline-block; margin-top: 10px; color: var(--semi-accent); font-size: 11px; }
.semi-explorer p.semi-motion-note { margin-top: 12px; color: var(--semi-muted); font-size: 11px; }
.semi-settings { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 0 28px; margin: 16px 0; padding-top: 2px; border-top: 1px solid var(--semi-border); }
.semi-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
.semi-comparison figure { min-width: 0; margin: 0; overflow: hidden; border: 1px solid var(--semi-border); border-radius: 10px; }
.semi-comparison :deep(.semi-diagram) { height: auto; max-height: none; }
.semi-comparison figcaption { padding: 8px 10px; background: #1b2c3f; color: var(--semi-ink); font-size: 11px; }
.semi-explorer ul.semi-legend { display: flex; flex-wrap: wrap; gap: 8px 14px; margin: 18px 0 0; padding: 0; list-style: none; }
.semi-legend li { display: flex; align-items: center; gap: 6px; margin: 0; padding: 0; color: #b9c7d8; font-size: 10px; }
.semi-legend i { width: 8px; height: 8px; flex: 0 0 auto; border: 1px solid #ffffff33; border-radius: 2px; }
.semi-explorer p.semi-note { margin: 0; padding: 0 24px 14px; color: #8e9fb4; font-size: 10px; }
.semi-explorer p.semi-error, .semi-explorer p.semi-feedback { padding: 0 24px 12px; color: #f4c876; font-size: 11px; }
@container (max-width: 480px) {
  .semi-heading { padding: 18px 16px 14px; }
  .semi-modes { padding: 0 16px 14px; }
  .semi-modes .semi-segmented { width: 100%; }
  .semi-segmented button { padding-right: 9px; padding-left: 9px; font-size: 11px; }
  .semi-stage-topline { right: 16px; left: 16px; }
  .semi-viewport { height: 250px; }
  .semi-caption { min-height: 158px; padding: 10px 16px 20px; }
  .semi-caption-content { grid-template-columns: 26px minmax(0, 1fr); gap: 10px; }
  .semi-caption-number { height: 26px; border-radius: 8px; font-size: 10px; }
  .semi-caption h4 { font-size: 14px; }
  .semi-caption p { font-size: 12px; line-height: 1.7; }
  .semi-console { padding: 16px 16px 8px; }
  .semi-transport { gap: 10px; }
  .semi-explorer button.semi-primary { min-width: 44px; width: 44px; padding: 10px; }
  .semi-primary > span { display: none; }
  .semi-timeline label { gap: 6px; font-size: 11px; }
  .semi-toggles { gap: 4px 18px; margin-top: 8px; }
  .semi-details { margin: 0 16px; }
  .semi-settings { grid-template-columns: 1fr; gap: 8px; }
  .semi-explorer p.semi-note, .semi-explorer p.semi-error, .semi-explorer p.semi-feedback { padding-right: 16px; padding-left: 16px; }
}
@media (prefers-reduced-motion: reduce) { .semi-explorer *, .semi-explorer *::before, .semi-explorer *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
</style>
