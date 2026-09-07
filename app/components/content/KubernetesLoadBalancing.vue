<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw, useId } from 'vue'
import { controllerInstances, exampleRequest, ingressRule } from '~/utils/kubernetes/load-balancing'
import { advanceRequestAnimation, initialRequestAnimation, requestAnimationDone, requestFrameDuration } from '~/utils/kubernetes/request-animation'
import type { RequestAnimation } from '~/utils/kubernetes/request-animation'

const id = useId()
const labElement = ref<HTMLElement>()
const state = ref(initialRequestAnimation())
const history = ref<RequestAnimation[]>([])
const playing = ref(false)
const infoOpen = ref(false)
const infoButton = ref<HTMLButtonElement>()
const resetButton = ref<HTMLButtonElement>()
const sendButton = ref<HTMLButtonElement>()
const nextButton = ref<HTMLButtonElement>()
const route = computed(() => state.value.route)
const started = computed(() => state.value.phase !== 'idle')
const done = computed(() => requestAnimationDone(state.value))
const deciding = computed(() => state.value.phase === 'decision')
const result = computed(() => state.value.phase === 'result')
const nodes = ['외부 사용자', 'Load Balancer', 'Ingress Controller', 'Service 연결', 'Pod']
const phaseLabels = ['도착', '판단', '결과']
const phaseIndex = computed(() => state.value.phase === 'arrival' ? 0 : deciding.value ? 1 : 2)
const hostMatches = computed(() => exampleRequest.host === ingressRule.host)
const pathMatches = computed(() => exampleRequest.path === (ingressRule.path as string) || exampleRequest.path.startsWith(`${ingressRule.path}/`))
const info = computed(() => {
  if (!started.value) return {
    title: '요청 흐름',
    description: '요청 보내기로 시작하고 다음을 누르면 도착, 판단, 결과가 순서대로 나타납니다. 자동 재생도 같은 순서로 진행합니다.',
  }
  return [
    { title: '외부 사용자', description: 'GET /api/products를 보내는 예시입니다. 공개 주소에 대한 DNS 조회는 완료된 상태로 가정합니다.' },
    { title: 'Load Balancer', description: '이 예시의 L4 Load Balancer는 정상 Ingress Controller 둘 중 하나에 연결합니다. 암호화된 HTTP Host나 경로를 읽지 않습니다.' },
    { title: 'Ingress Controller', description: 'Ingress는 라우팅 규칙이고, Ingress Controller는 이를 적용합니다. 여기서 TLS를 종료한 뒤 Host와 /api Prefix를 확인합니다. 경로는 재작성하지 않습니다.' },
    { title: 'Service · EndpointSlice', description: 'Service는 논리적인 연결 지점입니다. EndpointSlice는 대상의 주소, 포트, Ready 조건을 담은 정보이며 요청이 통과하는 장치가 아닙니다. 점선으로 잠깐 펼쳐지는 후보는 이 주소 정보에서 읽습니다. A는 Not Ready, B와 C는 Ready인 예시입니다.' },
    { title: 'Pod', description: 'Pod는 컨테이너가 실행되는 배포 단위입니다. 선택된 Pod가 상품을 조회한 것으로 연출합니다. 200 OK와 상품 카드는 실제 서버 응답이 아닌 모의 결과입니다.' },
  ][state.value.step]!
})
const announcement = computed(() => {
  if (!started.value) return '요청 대기'
  const location = `${nodes[state.value.step]}, ${phaseLabels[phaseIndex.value]}`
  if (state.value.step === 1 && result.value) return `${location}, ${route.value.selectedController} 선택`
  if (state.value.step === 2 && deciding.value && state.value.decision === 1) return `${location}, Host 일치`
  if (state.value.step === 2 && deciding.value && state.value.decision === 3) return `${location}, 경로 일치`
  if (state.value.step === 2 && result.value) return `${location}, product-service`
  if (state.value.step === 3 && deciding.value && state.value.decision === 1) return `${location}, Pod A Not Ready, Pod B Ready, Pod C Ready`
  if (state.value.step === 3 && result.value) return `${location}, ${route.value.selectedPod ? `Pod ${route.value.selectedPod.id} 선택` : 'Ready 대상 없음'}`
  if (done.value && !route.value.blocked) return `${location}, Pod ${route.value.selectedPod?.id}, 200 OK, 상품 2개, 완료`
  return location
})
let timer: ReturnType<typeof setTimeout> | undefined

function pause() {
  playing.value = false
  clearTimeout(timer)
  timer = undefined
}
function advance() {
  if (done.value) return
  history.value.push(structuredClone(toRaw(state.value)))
  advanceRequestAnimation(state.value)
  if (done.value) pause()
}
function schedule() {
  timer = setTimeout(() => {
    if (!playing.value) return
    advance()
    if (playing.value) schedule()
  }, requestFrameDuration(state.value))
}
async function send() {
  advance()
  await nextTick()
  labElement.value?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  nextButton.value?.focus({ preventScroll: true })
}
async function manualNext() {
  pause()
  advance()
  if (done.value) {
    await nextTick()
    resetButton.value?.focus({ preventScroll: true })
  }
}
function togglePlayback() {
  if (playing.value) { pause(); return }
  if (done.value) return
  playing.value = true
  schedule()
}
async function reset() {
  pause()
  infoOpen.value = false
  state.value = initialRequestAnimation()
  history.value = []
  await nextTick()
  sendButton.value?.focus({ preventScroll: true })
}
async function previous() {
  pause()
  const snapshot = history.value.pop()
  if (!snapshot) return
  state.value = snapshot
  await nextTick()
  if (!started.value) sendButton.value?.focus({ preventScroll: true })
}
function toggleInfo() { pause(); infoOpen.value = !infoOpen.value }
function closeInfo() { infoOpen.value = false; infoButton.value?.focus({ preventScroll: true }) }
function onVisibilityChange() { if (document.hidden) pause() }
onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onBeforeUnmount(() => { pause(); document.removeEventListener('visibilitychange', onVisibilityChange) })
</script>

<template>
  <section ref="labElement" class="lb-lab" :class="{ 'lb-started': started, 'lb-complete': done }" aria-label="쿠버네티스 요청 흐름 애니메이션" data-testid="load-balancing-lab" :data-phase="state.phase" :data-step="state.step" :data-decision="state.decision" @keydown.esc="closeInfo">
    <button ref="infoButton" type="button" class="lb-info-button" :aria-expanded="infoOpen" :aria-controls="`${id}-info`" aria-label="용어와 예시 정보" data-testid="info" @click="toggleInfo">i</button>

    <div class="lb-flow" :style="{ '--step': state.step }" role="group" aria-label="요청의 이동 경로">
      <div class="lb-track" aria-hidden="true"><div class="lb-travelled" /></div>
      <div v-if="started" class="lb-request-chip" :class="{ 'lb-chip-complete': done }" data-testid="request-chip" aria-label="GET /api/products 요청">
        <svg v-if="!done" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7h14v10H5zM5 7l7 5 7-5" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="route.blocked ? 'M7 7l10 10M17 7L7 17' : 'm5 12 4 4 10-9'" /></svg>
      </div>

      <div v-for="(node, index) in nodes" :key="node" class="lb-station" :class="{ 'lb-current': started && state.step === index, 'lb-visited': started && (state.step > index || (state.step === index && result)) }" :aria-current="started && state.step === index ? 'step' : undefined" :data-testid="`station-${index}`">
        <span class="lb-waypoint" aria-hidden="true"><svg v-if="started && (state.step > index || (state.step === index && result))" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4 10-9" /></svg></span>
        <div class="lb-node"><strong>{{ index === 4 && state.step === 4 && route.selectedPod ? `Pod ${route.selectedPod.id}` : node }}</strong></div>
        <div v-if="started && state.step === index" class="lb-scene" :class="{ 'lb-scene-arrival': state.phase === 'arrival' }" data-testid="active-scene">
          <div class="lb-phase-dots" :aria-label="phaseLabels[phaseIndex]">
            <i v-for="(phase, phaseNumber) in phaseLabels" :key="phase" :class="{ 'lb-phase-active': phaseNumber === phaseIndex, 'lb-phase-done': phaseNumber < phaseIndex }" :title="phase" />
          </div>
          <Transition name="lb-reveal" mode="out-in">
            <div :key="`${state.step}-${state.phase}-${state.decision}`" class="lb-scene-content">
              <template v-if="index === 0">
                <span class="lb-request-label" data-testid="request-line"><b>GET</b> /api/products</span>
                <span v-if="deciding" class="lb-small-status"><i class="lb-working" />요청 준비</span>
                <span v-else-if="result" class="lb-result-label"><span aria-hidden="true">✓</span> 전송 준비</span>
              </template>

              <template v-else-if="index === 1">
                <div v-if="deciding || result" class="lb-candidates lb-controllers" :class="{ 'lb-scanning': deciding }" data-testid="controller-candidates">
                  <span v-for="instance in controllerInstances" :key="instance" :data-selected="result && route.selectedController === instance" class="lb-candidate" :class="{ 'lb-selected': result && route.selectedController === instance, 'lb-dismissed': result && route.selectedController !== instance }">
                    <svg class="lb-server-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="4" width="16" height="7" rx="2" /><rect x="4" y="13" width="16" height="7" rx="2" /><path d="M7 7.5h1M7 16.5h1M12 7.5h5M12 16.5h5" /></svg>
                    <code>{{ instance }}</code><span v-if="result && route.selectedController === instance" class="lb-choice-mark" aria-label="선택">✓</span>
                  </span>
                </div>
                <i v-else class="lb-arrival-ring" aria-hidden="true" />
              </template>

              <template v-else-if="index === 2">
                <template v-if="deciding && state.decision < 2">
                  <div class="lb-rule-value" :class="{ 'lb-matched': state.decision === 1 && hostMatches }"><code>{{ exampleRequest.host }}</code><span v-if="state.decision === 1" class="lb-match-check" aria-hidden="true">{{ hostMatches ? '✓' : '×' }}</span></div>
                  <span v-if="state.decision === 0" class="lb-rule-target"><span class="lb-compare-arrow" aria-hidden="true">↓</span><code>{{ ingressRule.host }}</code></span>
                  <span v-else class="lb-result-label" data-testid="host-match">{{ hostMatches ? 'Host 일치' : 'Host 불일치' }}</span>
                </template>
                <template v-else-if="deciding">
                  <div class="lb-rule-value" :class="{ 'lb-matched': state.decision === 3 && pathMatches }"><code><b>/api</b>/products</code><span v-if="state.decision === 3" class="lb-match-check" aria-hidden="true">{{ pathMatches ? '✓' : '×' }}</span></div>
                  <span v-if="state.decision === 2" class="lb-rule-target"><span class="lb-compare-arrow" aria-hidden="true">↓</span><code>{{ ingressRule.path }}</code></span>
                  <span v-else class="lb-result-label" data-testid="path-match">{{ pathMatches ? '경로 일치' : '경로 불일치' }}</span>
                </template>
                <span v-else-if="result" class="lb-output" data-testid="service-result"><span aria-hidden="true">✓</span><code>{{ route.selectedService?.split(':')[0] }}</code></span>
                <i v-else class="lb-arrival-ring" aria-hidden="true" />
              </template>

              <template v-else-if="index === 3">
                <span v-if="deciding && state.decision === 0" class="lb-address-fold" data-testid="endpoint-fold"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v14H4zM8 9h8M8 13h5M8 16h8" /></svg>EndpointSlice</span>
                <div v-else-if="(deciding && state.decision === 1) || (result && !route.blocked)" class="lb-endpoints" :class="{ 'lb-selection-result': result }" role="group" aria-label="EndpointSlice 주소 정보 참조" data-testid="endpoints">
                  <span v-for="endpoint in route.endpoints" :key="endpoint.id" class="lb-endpoint" :class="{ 'lb-not-ready': !endpoint.ready, 'lb-ready': endpoint.ready, 'lb-selected': result && route.selectedPod?.id === endpoint.id, 'lb-dismissed': result && route.selectedPod?.id !== endpoint.id }" :data-testid="`endpoint-${endpoint.id}`" :data-selected="result && route.selectedPod?.id === endpoint.id" :aria-label="`Pod ${endpoint.id}, ${endpoint.ready ? 'Ready' : 'Not Ready'}${result && route.selectedPod?.id === endpoint.id ? ', 선택' : ''}`">
                    <svg class="lb-pod-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 3 11 6v14l-11 6-11-6V9zM5 9l11 7 11-7M16 16v13" /><path v-if="!endpoint.ready" d="m10 11 12 10m0-10L10 21" /></svg>
                    <span>Pod {{ endpoint.id }}</span><span class="lb-readiness" :aria-hidden="true">{{ result && route.selectedPod?.id === endpoint.id ? '✓ 선택' : endpoint.ready ? '✓ Ready' : '− Not Ready' }}</span>
                  </span>
                </div>
                <span v-else-if="result" class="lb-result-label" data-testid="no-backends">Ready 대상 없음</span>
                <i v-else class="lb-arrival-ring" aria-hidden="true" />
              </template>

              <template v-else-if="index === 4">
                <template v-if="!result">
                  <div class="lb-pod-destination"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 3 11 6v14l-11 6-11-6V9zM5 9l11 7 11-7M16 16v13" /></svg><span>Pod {{ route.selectedPod?.id }}</span><i v-if="deciding" class="lb-working" /></div>
                  <span v-if="deciding" class="lb-small-status">상품 조회</span>
                </template>
                <template v-else>
                  <span class="lb-response" data-testid="response"><span aria-hidden="true">✓</span> 200 OK <small>모의 응답</small></span>
                  <div class="lb-products" aria-label="상품 2개" data-testid="products"><span class="lb-book lb-book-one" aria-hidden="true"><i /></span><span class="lb-book lb-book-two" aria-hidden="true"><i /></span><span>상품 2개</span></div>
                </template>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <div class="lb-toolbar">
      <button v-if="!started" ref="sendButton" type="button" class="lb-primary" data-testid="send" @click="send">요청 보내기 <span aria-hidden="true">↓</span></button>
      <template v-else>
        <button type="button" data-testid="previous" @click="previous"><span aria-hidden="true">↑</span> 이전</button>
        <button v-if="!done" ref="nextButton" type="button" class="lb-primary" data-testid="next" @click="manualNext">다음 <span aria-hidden="true">↓</span></button>
        <button v-if="!done" type="button" :aria-pressed="playing" data-testid="play" @click="togglePlayback"><span aria-hidden="true">{{ playing ? 'Ⅱ' : '▷' }}</span> {{ playing ? '일시 정지' : '자동 재생' }}</button>
        <button ref="resetButton" type="button" :class="{ 'lb-replay': done }" data-testid="reset" @click="reset"><span aria-hidden="true">↺</span> {{ done ? '다시 보기' : '처음으로' }}</button>
      </template>
    </div>
    <span class="lb-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</span>

    <aside v-if="infoOpen" :id="`${id}-info`" class="lb-info-panel" :aria-labelledby="`${id}-info-title`" data-testid="info-panel">
      <div class="lb-info-heading"><strong :id="`${id}-info-title`">{{ info.title }}</strong><button type="button" aria-label="정보 닫기" @click="closeInfo">×</button></div>
      <p>{{ info.description }}</p>
      <dl v-if="state.step === 3"><div v-for="endpoint in route.endpoints" :key="endpoint.id"><dt>Pod {{ endpoint.id }}</dt><dd><code>{{ endpoint.address }}</code> · {{ endpoint.ready ? 'Ready' : 'Not Ready' }}</dd></div></dl>
      <p>학습용 시뮬레이션입니다. 실제 네트워크 요청은 보내지 않으며, 상품 결과는 예시입니다. Service 연결은 논리적인 단계로 표현했습니다. 실제 전달 경로, 분산 방식, 상태 전파 시간은 구현과 설정에 따라 다릅니다. 이 예시는 종료 중인 Pod가 없고 publishNotReadyAddresses가 false인 구성을 가정합니다.</p>
      <div class="lb-info-phases"><span v-for="(phase, index) in phaseLabels" :key="phase"><i :class="{ 'lb-phase-active': index === phaseIndex }" />{{ phase }}</span></div>
      <a href="https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/" target="_blank" rel="noopener noreferrer">EndpointSlice 공식 문서 ↗</a>
    </aside>
  </section>
</template>

<style scoped>
.lb-lab { --lb-blue: #3065db; --lb-green: #238563; --lb-ink: #283548; --lb-muted: #596b81; --lb-line: #dce4ec; --lb-pitch: 106px; --lb-stop: calc(var(--lb-pitch) / 2); --lb-node: 172px; --lb-gap: 26px; --lb-rail: 17px; container-type: inline-size; position: relative; margin: 24px 0; padding: 34px 28px 22px; border: 1px solid var(--lb-line); border-radius: 18px; color: var(--lb-ink); background: #fff; font-family: 'Pretendard', sans-serif; font-size: 13px; line-height: 1.5; }
.lb-lab *, .lb-lab *::before, .lb-lab *::after { box-sizing: border-box; }
.lb-lab button { min-height: 40px; cursor: pointer; padding: 9px 16px; border: 1px solid var(--lb-line); border-radius: 9px; color: var(--lb-ink); background: white; font: inherit; line-height: 1.4; }
.lb-lab button:hover { background: #f3f6fb; }
.lb-lab button:focus-visible { outline: 3px solid #80a8ff; outline-offset: 3px; }
.lb-lab code { padding: 0; border: 0; color: inherit; background: transparent; font: 500 12px/1.5 'IBM Plex Mono', monospace; white-space: nowrap; }
.lb-lab svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.lb-lab .lb-info-button { position: absolute; top: 10px; right: 10px; z-index: 2; width: 32px; min-height: 32px; padding: 3px; border-color: transparent; border-radius: 50%; color: var(--lb-muted); font: italic 600 16px Georgia, serif; }
.lb-flow { position: relative; width: 100%; max-width: 650px; margin: 0 auto; }
.lb-track { position: absolute; z-index: 0; top: var(--lb-stop); left: var(--lb-rail); width: 2px; height: calc(4 * var(--lb-pitch)); background: var(--lb-line); }
.lb-travelled { width: 100%; height: 0; background: #8eb0f1; transition: height .8s cubic-bezier(.45,0,.2,1); }
.lb-started .lb-travelled { height: calc(var(--step) * var(--lb-pitch)); }
.lb-station { position: relative; display: grid; grid-template-columns: var(--lb-node) minmax(0, 1fr); align-items: center; gap: var(--lb-gap); height: var(--lb-pitch); padding-left: 42px; }
.lb-waypoint { position: absolute; top: calc(var(--lb-stop) - 7px); left: calc(var(--lb-rail) - 6px); z-index: 1; display: grid; place-items: center; width: 14px; height: 14px; border: 2px solid #c8d3df; border-radius: 50%; background: #fff; transition: background .2s, border-color .2s; }
.lb-waypoint svg { width: 12px; height: 12px; stroke-width: 2.5; }
.lb-visited .lb-waypoint { border-color: #96b6a9; color: white; background: #96b6a9; }
.lb-node { display: flex; align-items: center; width: 100%; min-height: 51px; padding: 12px; border: 1px solid #e6ebf1; border-radius: 10px; background: #fafbfc; transition: background .4s, border-color .4s, box-shadow .4s; }
.lb-node strong { font-size: 14px; font-weight: 550; line-height: 1.5; }
.lb-current .lb-node { color: #244fb0; border-color: #a3bef5; background: #f0f5ff; box-shadow: 0 0 0 3px #3065db08; }
.lb-current .lb-node strong { font-weight: 700; }
.lb-request-chip { position: absolute; z-index: 3; top: calc(var(--lb-stop) - 13px); left: calc(var(--lb-rail) - 12px); display: grid; place-items: center; width: 26px; height: 26px; border: 2px solid #fff; border-radius: 8px; color: #fff; background: var(--lb-blue); box-shadow: 0 3px 10px #3065db33; transform: translateY(calc(var(--step) * var(--lb-pitch))); transition: transform .8s cubic-bezier(.45,0,.2,1), background .3s; animation: lb-chip-appear .35s ease-out; }
.lb-request-chip svg { width: 16px; height: 16px; stroke-width: 1.8; }
.lb-chip-complete { background: var(--lb-green); }
.lb-scene { position: relative; min-width: 0; color: var(--lb-ink); }
.lb-scene::before { content: ''; position: absolute; left: calc(-1 * var(--lb-gap)); top: 50%; width: calc(var(--lb-gap) - 8px); border-top: 1px solid #b4c9f2; }
.lb-scene-arrival { animation: lb-scene-arrive 1s both; }
.lb-scene-content { min-height: 68px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 7px; }
.lb-phase-dots { position: absolute; top: -9px; left: 0; display: flex; align-items: center; gap: 4px; }
.lb-phase-dots i, .lb-info-phases i { display: inline-block; width: 4px; height: 4px; border-radius: 100%; background: #dce4ee; }
.lb-phase-dots .lb-phase-active, .lb-info-phases .lb-phase-active { width: 13px; border-radius: 4px; background: var(--lb-blue); }
.lb-phase-dots .lb-phase-done { background: #9cb6e8; }
.lb-request-label { display: inline-flex; align-items: center; gap: 6px; padding: 7px 9px; border: 1px solid #c7d7f7; border-radius: 7px; background: #f4f7ff; font: 11px/1.5 'IBM Plex Mono', monospace; white-space: nowrap; }
.lb-request-label b { color: var(--lb-blue); font-size: 10px; }
.lb-small-status, .lb-result-label { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; color: var(--lb-muted); }
.lb-result-label { color: var(--lb-green); }
.lb-arrival-ring { display: block; width: 8px; height: 8px; border: 2px solid #b1c7f2; border-radius: 50%; }
.lb-candidates { display: flex; gap: 8px; width: 100%; }
.lb-candidate { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; min-width: 0; padding: 9px 10px; border: 1px solid var(--lb-line); border-radius: 9px; background: #fafbfc; }
.lb-candidate code { font-size: 10px; }
.lb-candidate .lb-server-icon { width: 23px; height: 23px; color: #8394ab; }
.lb-scanning .lb-candidate { animation: lb-scan 2s ease-in-out infinite; }
.lb-scanning .lb-candidate:nth-child(2) { animation-delay: 1s; }
.lb-selected { color: #245cc5; border-color: #8cafed !important; background: #edf4ff !important; box-shadow: 0 0 0 2px #3065db0d; animation: lb-pick .45s ease-out; }
.lb-selected .lb-server-icon { color: var(--lb-blue); }
.lb-dismissed { opacity: .23; filter: grayscale(1); }
.lb-choice-mark { position: absolute; right: -5px; top: -5px; display: grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; color: white; background: var(--lb-blue); font-size: 10px; }
.lb-rule-value { display: flex; align-items: center; gap: 8px; max-width: 100%; padding: 7px 9px; border: 1px solid var(--lb-line); border-radius: 7px; background: #fafbfc; }
.lb-rule-value code { font-size: 11px; }
.lb-rule-value b { color: var(--lb-blue); }
.lb-rule-target { display: inline-flex; align-items: center; gap: 9px; padding-left: 9px; color: var(--lb-muted); }
.lb-rule-target code { font-size: 11px; }
.lb-compare-arrow { animation: lb-compare 1.4s ease-in-out infinite; color: #7595cd; }
.lb-matched { color: var(--lb-green); background: #f1faf5; border-color: #afd7c1; }
.lb-match-check { animation: lb-pick .4s ease-out; }
.lb-output { display: inline-flex; align-items: center; gap: 8px; padding: 9px; border: 1px solid #b5d5c6; border-radius: 7px; background: #f3faf7; color: var(--lb-green); }
.lb-output code { font-size: 11px; }
.lb-address-fold { display: inline-flex; align-items: center; gap: 8px; padding: 12px; border: 1px dashed #a4b5cd; border-radius: 8px; color: var(--lb-muted); font: 11px 'IBM Plex Mono', monospace; }
.lb-address-fold svg { width: 20px; height: 20px; }
.lb-endpoints { position: relative; display: flex; width: 100%; gap: 6px; padding: 7px; border: 1px dashed #a4b5cd; border-radius: 9px; animation: lb-unfold .4s ease-out; transform-origin: left center; }
.lb-endpoints::before { content: ''; position: absolute; left: calc(-1 * var(--lb-gap)); top: 50%; width: var(--lb-gap); border-top: 1px dashed #a4b5cd; }
.lb-endpoint { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-width: 0; padding: 5px 3px; border: 1px solid #d4e2dc; border-radius: 6px; background: #f7faf8; font-size: 11px; white-space: nowrap; }
.lb-endpoint .lb-pod-icon { width: 26px; height: 26px; }
.lb-readiness { font-size: 10px; }
.lb-ready { color: #398167; }
.lb-not-ready { color: #8b93a0; border-color: #e0e4e9; background: repeating-linear-gradient(135deg,#fafbfc,#fafbfc 4px,#f1f3f5 4px,#f1f3f5 5px); }
.lb-not-ready .lb-pod-icon { opacity: .6; }
.lb-selection-result { border-color: transparent; }
.lb-selection-result::before { display: none; }
.lb-pod-destination { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #b4c9ee; border-radius: 9px; color: #245cc5; background: #f0f5ff; font-size: 12px; }
.lb-pod-destination svg { width: 27px; height: 27px; }
.lb-working { display: inline-block; width: 9px; height: 9px; border: 1.5px solid #c3d3eb; border-top-color: var(--lb-blue); border-radius: 50%; animation: lb-spin .9s linear infinite; }
.lb-response { display: flex; align-items: center; gap: 6px; color: var(--lb-green); font: 600 13px 'IBM Plex Mono', monospace; }
.lb-response small { color: var(--lb-muted); font: 9px 'Pretendard', sans-serif; }
.lb-products { display: flex; align-items: center; gap: 5px; padding: 7px 10px; border: 1px solid #e0e8e3; border-radius: 8px; background: #f8fbf9; color: #486658; font-size: 10px; }
.lb-products > span:last-child { margin-left: 5px; }
.lb-book { position: relative; display: block; width: 20px; height: 27px; border-radius: 2px 4px 4px 2px; box-shadow: inset 3px 0 #00000012, 1px 2px 2px #0000000d; transform: rotate(-7deg); }
.lb-book i { position: absolute; inset: 6px 5px 9px; border-top: 2px solid #ffffffba; border-bottom: 1px solid #ffffff8c; }
.lb-book-one { background: #e7ad64; }
.lb-book-two { background: #839bca; transform: rotate(7deg); }
.lb-toolbar { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; padding-top: 18px; border-top: 1px solid #edf0f4; }
.lb-toolbar .lb-primary { display: flex; align-items: center; justify-content: center; gap: 16px; min-width: 104px; border-color: var(--lb-blue); color: #fff; background: var(--lb-blue); }
.lb-toolbar .lb-primary:hover { background: #2354bf; }
.lb-toolbar .lb-replay { border-color: #b4d4c3; color: var(--lb-green); background: #f5fbf7; }
.lb-info-panel { margin-top: 18px; padding: 16px; border: 1px solid var(--lb-line); border-radius: 10px; background: #f8fafc; color: #4d5f74; font-size: 12px; }
.lb-info-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.lb-info-heading button { min-height: 32px; padding: 3px 10px; }
.lb-info-panel p { margin: 10px 0; font-size: 12px; line-height: 1.8; }
.lb-info-panel dl { margin: 12px 0; }
.lb-info-panel dl > div { display: flex; flex-wrap: wrap; gap: 12px; }
.lb-info-panel dd { margin: 0; }
.lb-info-panel code { font-size: 10px; }
.lb-info-panel a { color: var(--lb-blue); font-size: 11px; }
.lb-info-phases { display: flex; gap: 12px; margin: 12px 0; }
.lb-info-phases span { display: inline-flex; align-items: center; gap: 5px; }
.lb-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.lb-reveal-enter-active, .lb-reveal-leave-active { transition: opacity .12s, transform .12s; }
.lb-reveal-enter-from { opacity: 0; transform: translateX(-5px); }
.lb-reveal-leave-to { opacity: 0; transform: translateX(4px); }
@keyframes lb-chip-appear { from { opacity: 0; scale: .4; } to { opacity: 1; scale: 1; } }
@keyframes lb-scene-arrive { 0%, 65% { opacity: 0; } 100% { opacity: 1; } }
@keyframes lb-scan { 0%, 100% { border-color: #dce4ec; background: #fafbfc; } 35%, 65% { border-color: #a9bde3; background: #eff3fa; } }
@keyframes lb-pick { 0% { scale: .94; } 65% { scale: 1.04; } 100% { scale: 1; } }
@keyframes lb-unfold { from { opacity: 0; transform: scaleX(.8); } to { opacity: 1; transform: scaleX(1); } }
@keyframes lb-compare { 0%, 100% { transform: translateY(-2px); } 50% { transform: translateY(2px); } }
@keyframes lb-spin { to { transform: rotate(360deg); } }
@container (max-width: 510px) {
  .lb-flow { --lb-node: 132px; --lb-gap: 18px; }
  .lb-node { padding: 10px; }
  .lb-node strong { font-size: 12px; }
  .lb-candidates { gap: 5px; }
  .lb-candidate { padding: 9px 7px; }
}
@container (max-width: 380px) {
  .lb-flow { --lb-node: 104px; --lb-gap: 12px; --lb-rail: 8px; }
  .lb-station { padding-left: 24px; }
  .lb-node { padding: 9px 7px; }
  .lb-node strong { font-size: 11px; }
  .lb-candidate { padding: 8px 4px; }
  .lb-candidate code { font-size: 9px; }
  .lb-request-label { padding: 6px; font-size: 9px; gap: 4px; }
  .lb-request-label b { font-size: 9px; }
  .lb-rule-value { padding: 6px; gap: 4px; }
  .lb-rule-value code, .lb-rule-target code, .lb-output code { font-size: 9px; }
  .lb-endpoints { flex-direction: column; gap: 3px; padding: 4px; }
  .lb-endpoint { flex-direction: row; justify-content: flex-start; padding: 2px 4px; gap: 4px; font-size: 10px; }
  .lb-endpoint .lb-pod-icon { width: 14px; height: 17px; }
  .lb-endpoint .lb-readiness { margin-left: auto; font-size: 8px; }
  .lb-address-fold { padding: 9px 5px; gap: 5px; font-size: 10px; }
  .lb-output { padding: 7px; gap: 5px; }
  .lb-response { flex-wrap: wrap; font-size: 12px; }
  .lb-toolbar { gap: 5px; }
  .lb-toolbar button { padding: 9px 10px; font-size: 11px; }
  .lb-toolbar .lb-primary { min-width: 70px; gap: 10px; }
}
@media (max-width: 500px) {
  .lb-lab { padding: 30px 16px 18px; border-radius: 16px; }
}
@container (max-width: 510px) {
  .lb-flow { --lb-pitch: 136px; --lb-stop: 26px; --lb-rail: 10px; }
  .lb-station { display: block; padding: 4px 0 0 34px; }
  .lb-node { width: fit-content; max-width: 100%; min-height: 44px; padding: 9px 12px; }
  .lb-node strong { font-size: 13px; }
  .lb-scene { position: absolute; top: 58px; right: 0; left: 34px; }
  .lb-scene::before { display: none; }
  .lb-scene-content { min-height: 65px; gap: 5px; }
  .lb-rule-value code, .lb-rule-target code, .lb-output code, .lb-candidate code { font-size: 11px; }
  .lb-request-label, .lb-request-label b { font-size: 11px; }
  .lb-endpoints { flex-direction: row; padding: 5px; }
  .lb-endpoints::before { display: none; }
  .lb-endpoint { flex-direction: column; align-items: center; padding: 3px; gap: 2px; }
  .lb-endpoint .lb-pod-icon { width: 22px; height: 22px; }
  .lb-endpoint .lb-readiness { margin-left: 0; font-size: 9px; }
  .lb-toolbar { display: grid; grid-template-columns: 1fr 1fr; }
  .lb-toolbar > :only-child { grid-column: 1 / -1; justify-self: center; }
  .lb-toolbar button { min-height: 44px; font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .lb-lab *, .lb-lab *::before, .lb-lab *::after { animation: none !important; transition: none !important; }
}
</style>
