<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { managedResponsibilities, managedScenarios, managedSteps } from '~/utils/kubernetes/managed'
import type { ManagedMode, ManagedScenario } from '~/utils/kubernetes/managed'

const id = useId()
const lab = ref<HTMLElement>()
const startButton = ref<HTMLButtonElement>()
const nextButton = ref<HTMLButtonElement>()
const infoButton = ref<HTMLButtonElement>()
const mode = ref<ManagedMode>('eks')
const scenario = ref<ManagedScenario>('deploy')
const index = ref(0)
const phase = ref(0)
const started = ref(false)
const playing = ref(false)
const infoOpen = ref(false)
const phases = ['도착', '판단', '결과']
const steps = computed(() => managedSteps(mode.value, scenario.value))
const current = computed(() => steps.value[index.value]!)
const ownership = computed(() => managedResponsibilities(mode.value))
const complete = computed(() => started.value && index.value === steps.value.length - 1 && phase.value === 2)
const snapshot = computed(() => phase.value === 2 ? current.value : steps.value[Math.max(0, index.value - 1)]!)
const podScene = computed(() => (scenario.value === 'deploy' && index.value >= 2) || scenario.value === 'app')
const unavailable = computed(() => (scenario.value === 'control' || scenario.value === 'app') && index.value === 1)
const actor = computed(() => current.value.actor.replace('Kubernetes · ', '').replace('노드 · ', ''))
const values = computed(() => {
  const result = {
    deploy: [
      ['product-api:v1', 'replicas: 3', 'Deployment 준비'],
      ['kubectl apply', '권한 확인 ✓  /  필드 확인 ✓', '원하는 상태 저장'],
      ['원하는 Pod 3개', 'Node A · Node B 선택', 'Pod A · B · C 배정'],
      ['이미지 product-api:v1', '이미지 준비 → 컨테이너 시작', '실행 중 · 준비 검사 대기'],
      ['Readiness 검사', 'Pod A ✓  Pod B ✓  Pod C ✓', 'Ready 주소 3개'],
    ],
    control: [
      ['API Server · etcd', '제어 영역 상태 확인', '정상 운영'],
      ['API 서버 인스턴스', '인스턴스 상태 검사', '인스턴스 1개 장애'],
      ['장애 인스턴스', mode.value === 'eks' ? 'AWS가 인스턴스 교체' : '우리 팀이 진단·복구', '인스턴스 복구 중'],
      ['복구된 제어 영역', 'API 접근 ✓  /  앱 상태 확인', '모형의 기존 Pod 3개 유지'],
    ],
    app: [
      ['product-api:v1', '준비 상태 확인', 'Ready 주소 3개'],
      ['Pod B · 앱 설정 오류', 'Readiness 검사 실패', 'B: Not Ready'],
      ['B: ready = false', '주소 정보 갱신', 'Ready 주소 3 → 2'],
      ['Pod B · 로그와 설정', '우리 팀이 앱 설정 수정', '수정 적용 · 준비 검사 대기'],
      ['Pod B · 준비 검사 성공', '준비 상태와 주소 정보 반영', 'Ready 주소 2 → 3'],
    ],
    update: [
      ['노드 OS 보안 패치', '패치된 이미지 준비', '새 AMI 준비 · 적용 전'],
      ['패치 버전 · 실행 중인 앱', '우리 팀이 호환성·용량 확인', '우리 팀이 업데이트 시작'],
      ['업데이트 요청', mode.value === 'eks' ? 'AWS가 노드 교체 절차 실행' : '우리 팀이 노드 교체', '새 노드 준비 → 순차 교체'],
      ['패치된 노드', '우리 팀이 앱 동작 확인', '노드 교체 완료'],
    ],
  }
  return result[scenario.value][index.value]!
})
let timer: ReturnType<typeof setTimeout> | undefined

function pause() { clearTimeout(timer); timer = undefined; playing.value = false }
function reset() { pause(); index.value = 0; phase.value = 0; started.value = false; infoOpen.value = false }
function selectMode(value: ManagedMode) { reset(); mode.value = value }
function selectScenario(value: ManagedScenario) { reset(); scenario.value = value }
async function start() {
  started.value = true
  await nextTick()
  nextButton.value?.focus({ preventScroll: true })
  lab.value?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}
function next() {
  if (complete.value) return
  if (phase.value < 2) phase.value++
  else { index.value++; phase.value = 0 }
  if (complete.value) pause()
}
function manualNext() { pause(); next() }
async function previous() {
  pause()
  if (phase.value > 0) phase.value--
  else if (index.value > 0) { index.value--; phase.value = 2 }
  else { reset(); await nextTick(); startButton.value?.focus({ preventScroll: true }) }
}
function schedule() {
  timer = setTimeout(() => { if (!playing.value) return; next(); if (playing.value) schedule() }, phase.value === 0 ? 1000 : 1700)
}
function play() { if (playing.value) pause(); else { playing.value = true; schedule() } }
function toggleInfo() { pause(); infoOpen.value = !infoOpen.value }
function closeInfo() { infoOpen.value = false; infoButton.value?.focus({ preventScroll: true }) }
function onVisibility() { if (document.hidden) pause() }
onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onBeforeUnmount(() => { pause(); document.removeEventListener('visibilitychange', onVisibility) })
</script>

<template>
  <section ref="lab" class="eks-lab" :class="{ 'eks-started': started }" aria-label="관리형 쿠버네티스와 EKS 단계별 비교" data-testid="managed-eks-lab" :data-step="index" :data-phase="started ? phases[phase] : '대기'" @keydown.esc="closeInfo">
    <button ref="infoButton" type="button" class="eks-info-button" aria-label="EKS 용어와 운영 책임" :aria-expanded="infoOpen" :aria-controls="`${id}-info`" data-testid="eks-info" @click="toggleInfo">i</button>
    <div class="eks-options">
      <div class="eks-modes" role="group" aria-label="쿠버네티스 운영 방식">
        <button type="button" :aria-pressed="mode === 'self'" data-testid="mode-self" @click="selectMode('self')">직접 운영</button>
        <button type="button" :aria-pressed="mode === 'eks'" data-testid="mode-eks" @click="selectMode('eks')">Amazon EKS</button>
      </div>
      <label class="eks-scenario">상황
        <select v-model="scenario" aria-label="EKS 학습 상황" data-testid="eks-scenario" @change="selectScenario(scenario)"><option v-for="item in managedScenarios" :key="item.id" :value="item.id">{{ item.title }}</option></select>
      </label>
    </div>

    <div class="eks-flow" :style="{ '--step': index, '--count': steps.length }" role="group" aria-label="작업이 진행되는 순서">
      <div class="eks-track" aria-hidden="true"><span /></div>
      <span v-if="started" class="eks-chip" :class="{ 'eks-chip-done': complete }" aria-hidden="true">{{ complete ? '✓' : '↳' }}</span>
      <div v-for="(step, stepIndex) in steps" :key="`${scenario}-${stepIndex}`" class="eks-station" :class="{ 'eks-current': started && index === stepIndex, 'eks-visited': started && (index > stepIndex || (index === stepIndex && phase === 2)) }" :aria-current="started && index === stepIndex ? 'step' : undefined" :data-testid="`eks-station-${stepIndex}`">
        <span class="eks-waypoint" aria-hidden="true">{{ started && (index > stepIndex || (index === stepIndex && phase === 2)) ? '✓' : '' }}</span>
        <div class="eks-node"><strong>{{ step.title }}</strong><small v-if="started && index > stepIndex">✓ 완료</small></div>
        <div v-if="started && index === stepIndex" class="eks-scene" data-testid="eks-detail">
          <div class="eks-phases" :aria-label="phases[phase]"><i v-for="(label, phaseIndex) in phases" :key="label" :class="{ 'is-active': phase === phaseIndex }" :title="label" /><span>{{ phases[phase] }}</span></div>
          <Transition name="eks-reveal" mode="out-in">
            <div :key="`${index}-${phase}-${mode}`" class="eks-scene-content">
              <span v-if="phase === 0" class="eks-value" data-testid="eks-input">{{ values[0] }}</span>
              <template v-else-if="phase === 1"><span class="eks-actor" data-testid="eks-actor">{{ actor }}</span><span class="eks-judgment" data-testid="eks-decision"><i class="eks-working" aria-hidden="true" />{{ values[1] }}</span></template>
              <template v-else>
                <span class="eks-result" :class="{ 'is-unavailable': unavailable }" data-testid="eks-output">{{ unavailable ? '−' : '✓' }} {{ values[2] }}</span>
                <div v-if="podScene" class="eks-pods" aria-label="이번 단계의 Pod 상태">
                  <span v-for="(status, podIndex) in snapshot.pods" :key="podIndex" class="eks-pod" :class="{ ready: status === 'Ready' }" :data-testid="`eks-pod-${podIndex}`"><b>{{ ['A', 'B', 'C'][podIndex] }}</b><span>{{ status === 'Ready' ? '✓ Ready' : status === 'Pending' ? '배정됨' : '− Not Ready' }}</span></span>
                </div>
                <span v-else class="eks-actor" data-testid="eks-actor">{{ actor }}</span>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <div class="eks-toolbar">
      <button v-if="!started" ref="startButton" type="button" class="eks-primary" data-testid="eks-start" @click="start">시작 <span aria-hidden="true">↓</span></button>
      <template v-else>
        <button type="button" data-testid="eks-previous" @click="previous">↑ 이전</button>
        <button v-if="!complete" ref="nextButton" type="button" class="eks-primary" data-testid="eks-next" @click="manualNext">다음 ↓</button>
        <button v-if="!complete" type="button" :aria-pressed="playing" data-testid="eks-play" @click="play">{{ playing ? 'Ⅱ 일시 정지' : '▷ 자동 재생' }}</button>
        <button type="button" data-testid="eks-reset" @click="reset">{{ complete ? '↺ 다시 보기' : '↺ 처음으로' }}</button>
      </template>
    </div>
    <span class="eks-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ started ? `${current.title}, ${phases[phase]}, ${values[phase]}` : '상황을 고르고 시작을 누르세요.' }}</span>

    <aside v-if="infoOpen" :id="`${id}-info`" class="eks-info" data-testid="eks-info-panel">
      <div class="eks-info-heading"><strong>{{ started ? current.title : '관리형 쿠버네티스와 EKS' }}</strong><button type="button" aria-label="EKS 정보 닫기" @click="closeInfo">×</button></div>
      <p>관리형 쿠버네티스는 운영의 일부를 제공자가 맡는 방식입니다. EKS는 AWS의 관리형 쿠버네티스 서비스이며, 이 예시는 EKS 최적화 AMI를 쓰는 관리형 노드 그룹 기준입니다.</p>
      <dl><div><dt>Control Plane · {{ ownership.control.owner }}</dt><dd>{{ ownership.control.text }}. {{ ownership.control.note }}.</dd></div><div><dt>노드 · {{ ownership.nodes.owner }}</dt><dd>{{ ownership.nodes.text }}. {{ ownership.nodes.note }}.</dd></div><div><dt>앱 · {{ ownership.app.owner }}</dt><dd>{{ ownership.app.text }}. {{ ownership.app.note }}.</dd></div></dl>
      <template v-if="started"><p><b>입력</b> {{ current.input }}<br><b>판단</b> {{ current.decision }}<br><span v-if="phase === 2"><b>결과</b> {{ current.output }}</span></p><p>표시된 상태: Ready {{ snapshot.pods.filter(status => status === 'Ready').length }} / Ready 주소 {{ snapshot.endpoints }}.</p></template>
      <p>외부 사용자 → NLB(L4 Load Balancer) → Ingress Controller → Service에 연결된 Pod가 사용자 요청 경로입니다. Control Plane은 이 요청이 통과하는 지점이 아닙니다.</p>
      <p>클러스터, 네트워크, 권한과 노드 용량은 준비되어 있다고 가정합니다. 상태 전파, 장애 복구와 노드 교체를 단순화한 학습 모형이며 실제 AWS API 호출이나 무중단 검증은 하지 않습니다. Auto Mode·Fargate는 관리 범위가 다릅니다.</p>
      <p v-if="scenario === 'update'">실제 노드 업데이트는 여유 용량과 PodDisruptionBudget 등에 따라 지연되거나 실패할 수 있습니다.</p>
      <p v-if="scenario === 'control'">EKS는 제어 영역을 여러 가용 영역에 분산하고 인스턴스를 복구합니다. 이 모형에서 기존 Pod가 유지되는 것은 실제 장애 영향을 보장하지 않습니다.</p>
      <a href="https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html" target="_blank" rel="noopener noreferrer">EKS 관리형 노드 그룹 공식 문서 ↗</a>
      <p><a href="https://docs.aws.amazon.com/eks/latest/userguide/eks-architecture.html" target="_blank" rel="noopener noreferrer">EKS 구조 ↗</a> · <a href="https://docs.aws.amazon.com/eks/latest/userguide/security.html" target="_blank" rel="noopener noreferrer">AWS와 사용자 책임 분담 ↗</a></p>
    </aside>
  </section>
</template>

<style scoped>
.eks-lab { --blue: #3065db; --green: #238563; --ink: #283548; --muted: #596b81; --line: #dce4ec; --pitch: 106px; --stop: calc(var(--pitch) / 2); --rail: 17px; --gap: 26px; container-type: inline-size; position: relative; margin: 24px 0; padding: 34px 28px 22px; border: 1px solid var(--line); border-radius: 18px; color: var(--ink); background: #fff; font: 13px/1.5 'Pretendard', sans-serif; }
.eks-lab *, .eks-lab *::before { box-sizing: border-box; }
.eks-lab button, .eks-lab select { min-height: 40px; padding: 9px 14px; border: 1px solid var(--line); border-radius: 9px; color: var(--ink); background: #fff; font: inherit; line-height: 1.4; cursor: pointer; }
.eks-lab button:hover { background: #f3f6fb; }
.eks-lab button:focus-visible, .eks-lab select:focus-visible { outline: 3px solid #80a8ff; outline-offset: 3px; }
.eks-lab .eks-info-button { position: absolute; top: 10px; right: 10px; width: 32px; min-height: 32px; padding: 3px; border-color: transparent; border-radius: 50%; color: var(--muted); font: italic 600 16px Georgia, serif; }
.eks-options { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 8px 0 18px; }
.eks-modes { display: flex; gap: 3px; padding: 3px; border: 1px solid #e5ebf2; border-radius: 10px; background: #f5f7fa; }
.eks-modes button { min-height: 36px; padding: 6px 12px; border-color: transparent; background: transparent; font-size: 12px; }
.eks-modes [aria-pressed='true'] { border-color: #b9cdf5; color: #2456b9; background: #fff; box-shadow: 0 1px 3px #28354808; }
.eks-scenario { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 11px; }
.eks-scenario select { max-width: 100%; min-width: 0; font-size: 12px; }
.eks-flow { position: relative; width: 100%; max-width: 650px; margin: 0 auto; }
.eks-track { position: absolute; top: var(--stop); left: var(--rail); width: 2px; height: calc((var(--count) - 1) * var(--pitch)); background: var(--line); }
.eks-track span { display: block; width: 100%; height: 0; background: #8eb0f1; transition: height .65s ease; }
.eks-started .eks-track span { height: calc(var(--step) * var(--pitch)); }
.eks-chip { position: absolute; top: calc(var(--stop) - 13px); left: calc(var(--rail) - 12px); z-index: 2; display: grid; place-items: center; width: 26px; height: 26px; border: 2px solid #fff; border-radius: 8px; background: var(--blue); color: #fff; transform: translateY(calc(var(--step) * var(--pitch))); transition: transform .65s ease, background .2s; }
.eks-chip-done { background: var(--green); }
.eks-station { position: relative; display: grid; grid-template-columns: 184px minmax(0,1fr); align-items: center; gap: var(--gap); height: var(--pitch); padding-left: 42px; }
.eks-waypoint { position: absolute; top: calc(var(--stop) - 7px); left: calc(var(--rail) - 6px); display: grid; place-items: center; width: 14px; height: 14px; border: 2px solid #c8d3df; border-radius: 50%; background: #fff; color: #fff; font-size: 9px; }
.eks-visited .eks-waypoint { border-color: #96b6a9; background: #96b6a9; }
.eks-node { display: flex; flex-direction: column; justify-content: center; gap: 3px; min-height: 52px; padding: 11px 12px; border: 1px solid #e6ebf1; border-radius: 10px; background: #fafbfc; }
.eks-node strong { font-size: 14px; font-weight: 550; }
.eks-node small { color: var(--muted); font-size: 10px; }
.eks-current .eks-node { border-color: #a3bef5; color: #244fb0; background: #f0f5ff; }
.eks-current .eks-node strong { font-weight: 700; }
.eks-scene { position: relative; min-width: 0; }
.eks-scene::before { content: ''; position: absolute; top: 50%; left: calc(-1 * var(--gap)); width: calc(var(--gap) - 8px); border-top: 1px solid #b4c9f2; }
.eks-phases { display: flex; gap: 4px; align-items: center; margin-bottom: 7px; }
.eks-phases i { width: 4px; height: 4px; border-radius: 4px; background: #dce4ee; }
.eks-phases .is-active { width: 13px; background: var(--blue); }
.eks-phases span { margin-left: 4px; color: var(--muted); font-size: 10px; }
.eks-scene-content { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 8px; min-height: 62px; }
.eks-value { max-width: 100%; padding: 8px 10px; border: 1px solid #cad8ed; border-radius: 7px; background: #f6f9ff; overflow-wrap: anywhere; font-size: 12px; }
.eks-actor { display: inline-block; padding: 4px 8px; border-radius: 5px; color: #325993; background: #edf3ff; font-size: 11px; }
.eks-judgment { display: flex; align-items: center; gap: 7px; font-size: 12px; }
.eks-working { flex-shrink: 0; width: 9px; height: 9px; border: 1.5px solid #c3d3eb; border-top-color: var(--blue); border-radius: 50%; animation: eks-spin .9s linear infinite; }
.eks-result { color: #237152; font-size: 12px; }
.eks-result.is-unavailable { color: var(--muted); }
.eks-pods { display: flex; gap: 5px; }
.eks-pod { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 57px; padding: 5px 7px; border: 1px solid #dce2e9; border-radius: 6px; background: #f4f6f8; color: var(--muted); }
.eks-pod b { font: 600 12px 'IBM Plex Mono', monospace; }
.eks-pod span { font-size: 9px; white-space: nowrap; }
.eks-pod.ready { border-color: #b8d7c3; background: #f1f9f4; color: #226643; }
.eks-toolbar { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; padding-top: 18px; border-top: 1px solid #edf0f4; }
.eks-toolbar .eks-primary { min-width: 104px; border-color: var(--blue); color: #fff; background: var(--blue); }
.eks-toolbar .eks-primary:hover { background: #2354bf; }
.eks-info { margin-top: 18px; padding: 16px; border: 1px solid var(--line); border-radius: 10px; background: #f8fafc; color: #4d5f74; }
.eks-info-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.eks-info-heading button { min-height: 32px; padding: 3px 10px; }
.eks-info p, .eks-info dl { margin: 10px 0; font-size: 12px; line-height: 1.8; }
.eks-info dt { font-weight: 600; }
.eks-info dd { margin: 0 0 10px; }
.eks-info a { color: var(--blue); font-size: 12px; }
.eks-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.eks-reveal-enter-active, .eks-reveal-leave-active { transition: opacity .12s, transform .12s; }
.eks-reveal-enter-from, .eks-reveal-leave-to { opacity: 0; transform: translateX(4px); }
@keyframes eks-spin { to { transform: rotate(360deg); } }
@container (max-width: 510px) {
  .eks-flow { --pitch: 136px; --stop: 26px; --rail: 10px; }
  .eks-station { display: block; padding: 4px 0 0 34px; }
  .eks-node { width: fit-content; max-width: 100%; min-height: 44px; padding: 9px 12px; }
  .eks-node strong { font-size: 13px; }
  .eks-visited:not(.eks-current) .eks-node { flex-direction: row; align-items: center; gap: 8px; }
  .eks-scene { position: absolute; top: 56px; left: 34px; right: 0; }
  .eks-scene::before { display: none; }
  .eks-scene-content { gap: 5px; min-height: 62px; }
  .eks-phases { margin-bottom: 4px; }
  .eks-pod { padding: 3px 6px; gap: 1px; }
  .eks-judgment, .eks-result { font-size: 11px; }
  .eks-options { justify-content: center; gap: 8px; }
  .eks-scenario { width: 100%; justify-content: center; }
  .eks-toolbar { display: grid; grid-template-columns: 1fr 1fr; }
  .eks-toolbar > :only-child { grid-column: 1 / -1; justify-self: center; }
  .eks-toolbar button { min-height: 44px; font-size: 12px; }
}
@media (max-width: 500px) { .eks-lab { padding: 30px 16px 18px; border-radius: 16px; } }
@media (prefers-reduced-motion: reduce) { .eks-lab *, .eks-lab *::before { animation: none !important; transition: none !important; } }
</style>
