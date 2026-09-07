/** Original teaching geometry. Distances, layer counts and voltages are illustrative. */
export const sceneIds = ['industry-chain', 'dram-cell', 'mosfet', 'wafer-process', 'packaging', 'nand-3d', 'hbm'] as const
export type SceneId = typeof sceneIds[number]
export type Lesson = 'patterning' | 'oxidation' | 'doping'
export type Position = [number, number, number]
export interface Part {
  id: string
  label: string
  color: string
  kind: 'box' | 'cylinder' | 'plate' | 'wire'
  position: Position
  size: Position
  points?: Position[]
  holes?: { x: number, z: number, radius: number }[]
  innerRadius?: number
  opacity?: number
}
export interface ModelState {
  scene: SceneId
  lesson: Lesson
  step: number
  voltage: number
  cutaway: boolean
  exploded: boolean
  bonding: 'wire' | 'flip'
  selectedLayer: number
}
export interface Step { title: string, action: string, reason: string }
export const colors = {
  silicon: '#7186a8', oxide: '#68bdcf', resist: '#bf75b5', changed: '#ecae45',
  metal: '#cf8245', dopant: '#8569d2', channel: '#53b18a', board: '#315b60',
}
export const sceneTitles: Record<SceneId, string> = {
  'industry-chain': '설계 데이터가 실제 제품으로 이어지는 길',
  'dram-cell': 'DRAM은 어떻게 쓰고, 기억하고, 읽을까?',
  'mosfet': '전압으로 여닫는 작은 스위치',
  'wafer-process': '웨이퍼 위에서 재료가 바뀌는 순간',
  'packaging': '완성된 칩을 바깥세상과 연결하기',
  'nand-3d': '하나의 칩 안에 세운 메모리 층',
  'hbm': '여러 DRAM 칩을 쌓아 연결하기',
}
const step = (title: string, action: string, reason: string): Step => ({ title, action, reason })
const lessons: Record<Lesson, Step[]> = {
  patterning: [
    step('바탕 준비', '회로가 놓일 실리콘의 작은 영역을 확대했다.', '원형 웨이퍼 전체가 아니라 일부 단면이다. 아래층 회로는 생략했다.'),
    step('절연막 증착', '실리콘 위에 절연 재료를 얇게 쌓는다.', '앞으로 만들 금속선들이 서로 닿지 않게 분리할 바탕이 필요하다.'),
    step('감광액 도포', '빛에 반응하는 포토레지스트(PR)를 절연막 위에 덮는다.', '빛으로 위치를 기록할 임시 층을 만든다. 여기서는 양성 PR을 사용한다.'),
    step('노광', '열고 싶은 위치의 PR에 빛을 쬔다. 황색은 화학적 성질이 바뀐 PR이다.', '아직 재료가 깎이거나 구멍이 뚫린 것은 아니다.'),
    step('현상', '빛을 받은 PR을 현상액으로 제거한다.', '남은 PR이 다음 식각 단계에서 보호막 역할을 한다.'),
    step('식각', 'PR이 덮지 않은 절연막을 선택적으로 제거해 홈을 만든다.', 'PR에 기록한 패턴을 아래 절연막으로 옮긴다.'),
    step('PR 제거·세정', '역할을 마친 PR과 잔류물을 제거한다.', '홈을 깨끗하게 만들어 다음 재료가 잘 들어가게 한다.'),
    step('금속 채움', '홈과 윗면에 금속을 채운다.', '전기 신호가 지날 길을 만든다. 실제 배리어·시드막 등은 생략했다.'),
    step('CMP', '윗면의 남는 금속을 제거하고 표면을 평탄하게 한다.', '홈 속 금속만 남겨 선들을 분리한다. 배선 연결과 다음 층 형성을 반복한다.'),
  ],
  oxidation: [
    step('실리콘 표면', '산화 전의 실리콘 표면을 본다.', '산소와 반응할 표면이다. 세정 등 준비 과정은 생략했다.'),
    step('산화막 성장', '표면 실리콘 일부가 산소와 반응해 산화막으로 바뀐다.', '실리콘 경계가 안쪽으로 내려가고 산화막은 바깥쪽으로도 자란다.'),
    step('증착과 비교', '같은 높이의 막을 외부 재료로 올린 증착 예시를 본다.', '증착 예시에서는 바탕 실리콘을 소비하지 않는다. 실제 두께 비율은 축약했다.'),
  ],
  doping: [
    step('주입 창 준비', '보호막에 도펀트를 넣을 창을 만든 상태다.', '포토·식각으로 창을 만드는 앞 단계는 생략했다.'),
    step('이온 주입', '창으로 들어간 이온을 점으로 표시했다.', '표면에 새 판을 얹는 작업이 아니라 실리콘 내부 조성을 바꾸는 작업이다.'),
    step('열처리', '주입 부위의 결정 손상을 회복하고 도펀트를 전기적으로 활성화한다.', '색 영역은 도핑 분포를 단순화한 것이다. 실제 농도와 깊이는 연속적으로 달라진다.'),
  ],
}
const sceneSteps: Record<Exclude<SceneId, 'wafer-process'>, Step[]> = {
  'industry-chain': [
    step('설계 · 팹리스 / IDM', '왼쪽의 설계판은 회로 정보를 뜻한다. 필요한 기능을 검증하고 제조 공정의 설계 규칙에 맞춘다.', '설계판은 실제 칩이 아니다. 제조에 필요한 정보가 먼저 준비되어야 한다.'),
    step('설계 데이터 전달', '보라색 표식이 설계에서 제조로 이동한다. 전달되는 것은 검증된 설계 데이터다.', '데이터가 실리콘으로 변하는 것은 아니다. 제조사는 별도로 준비한 웨이퍼에 설계를 구현한다.'),
    step('웨이퍼 제조 · 파운드리 / IDM', '원형 웨이퍼 위에 여러 다이의 회로를 함께 만든다.', '소재·부품·장비를 이용한 공정을 반복한다. 화면의 한 번의 성장은 많은 공정을 축약한 것이다.'),
    step('검사·절단 후 다이 전달', '웨이퍼에서 사용할 다이 하나를 골라 조립 쪽으로 옮긴다. 나머지 다이도 별도로 처리한다.', '실제 물체가 넘어가는 단계다. 검사는 여러 시점에서 이루어지며, 역할 분담과 절단 순서는 제품마다 다르다.'),
    step('패키징·검사 · OSAT / IDM', '다이 주위에 기판과 연결 단자를 붙이고 보호한다.', '작은 다이를 외부 회로에 연결하고, 조립 이후에도 정상 동작하는지 검사해야 한다.'),
    step('시스템에 탑재', '검사한 패키지가 시스템 보드로 이동한다.', '전원·신호·열 조건을 맞춰야 실제 제품에서 사용할 수 있다. 각 주체가 품질·공정 이력도 함께 전달한다.'),
  ],
  'dram-cell': [
    step('구조 · 접근 스위치와 커패시터', '왼쪽은 감지·구동 회로, 가운데는 접근 트랜지스터, 오른쪽은 커패시터다. 저장 상태가 낮은 셀에서 시작한다.', '워드라인은 스위치를 제어하고, 비트라인은 셀의 데이터를 전달한다. 평면에 펼친 회로 모형이며 실제 소자의 배치는 아니다.'),
    step('쓰기 · 1에 해당하는 상태 만들기', '워드라인을 켜고 비트라인을 구동한다. 열린 트랜지스터를 거쳐 저장 전극의 전하 상태를 바꾼다.', '노란 표식은 전하 전달 경로다. 전하가 커패시터의 절연막을 통과해 반대 전극으로 흐르는 것은 아니다.'),
    step('보관 · 스위치 닫기', '접근 트랜지스터를 끄면 비트라인과 저장 노드가 분리된다. 노란 저장 표시가 조금 줄어드는 것은 누설을 뜻한다.', '전원이 있어도 저장 상태가 영원히 유지되지는 않으므로 리프레시가 필요하다. 누설 경로와 실제 시간 비율은 생략했다.'),
    step('읽기 · 작은 변화 감지', '비트라인을 읽기 준비 상태로 맞춘 뒤 접근 트랜지스터를 연다. 셀과 비트라인이 전하를 공유해 작은 전압 차이가 생긴다.', '감지 회로가 이 차이를 판별한다. 읽는 과정에서 저장 상태도 변하므로 그대로 두지 않고 복원해야 한다.'),
    step('감지·복원', '감지한 값에 따라 비트라인을 구동해 셀을 원래의 저장 상태로 되돌린다.', '리프레시도 저장 상태를 읽어 복원한다. 이 예시는 높은 상태를 쓴 셀이며, 값과 전하 상태의 대응은 회로 구현에 따라 다르다.'),
    step('다시 보관', '접근 트랜지스터를 닫고 복원한 전하 상태를 보관한다. 이동 표식은 멈춘다.', '읽기는 완료되었지만 이후에도 정해진 조건에 맞춰 리프레시를 반복해야 한다.'),
  ],
  'mosfet': [
    step('구조 확인', 'P형 바탕 안에 N형 소스·드레인이 있고, 그 위에 절연막과 게이트가 있다.', '게이트는 절연막 너머의 전기장으로 채널을 제어한다.'),
    step('OFF', '게이트 전압이 낮아 소스와 드레인을 잇는 반전 채널이 형성되지 않는다.', '드레인·소스 사이 전압이 있어도 채널을 통한 큰 전류는 흐르지 않는다. 누설전류는 생략했다.'),
    step('ON', '게이트 전압이 높아지면 절연막 아래에 전자가 모여 채널이 생긴다.', '전자 이동은 소스→드레인, 관습적 전류 방향은 반대다. 전류가 게이트 절연막을 통과하는 것은 아니다.'),
  ],
  'packaging': [
    step('웨이퍼 검사', '칩들의 전기적 특성을 검사해 사용할 다이를 구분한다.', '칩 하나의 불량을 전체 웨이퍼 불량으로 보는 것은 아니다.'),
    step('박막화', '웨이퍼 뒷면을 갈아 두께를 줄인다.', '패키지 높이와 후속 조립 조건을 맞춘다.'),
    step('절단', '웨이퍼를 개별 다이로 나눈다.', '실제 절단 공법과 검사 순서는 제품에 따라 달라진다.'),
    step('칩 부착', '선택한 다이를 패키지 기판에 올린다.', '기판은 작은 칩과 외부 회로 사이를 연결하는 받침이다.'),
    step('전기적 연결', '와이어 본딩 또는 플립칩을 선택해 연결 위치를 비교한다.', '와이어는 가장자리에서 위로 이어지고, 플립칩은 활성면을 뒤집어 아래 범프로 연결한다.'),
    step('보호', '칩과 연결부 주위에 보호 재료를 배치한다.', '여기서는 몰딩을 예시로 든다. 제품에 따라 언더필·뚜껑·방열 구조가 달라진다.'),
    step('최종 검사', '조립한 패키지의 전기적 동작과 연결 상태를 확인한다.', '앞 단계의 양품 판정만으로 조립 이후의 품질을 보장할 수 없다.'),
  ],
  'nand-3d': [
    step('층 형성', '층들을 번갈아 쌓는다. 화면에서는 6개 워드라인 층으로 축약했다.', '한 장의 다이 내부 구조다. 완성된 칩 6개를 포개는 방식이 아니다.'),
    step('메모리 홀 식각', '층을 수직으로 관통하는 깊은 홀을 만든다.', '깊은 곳까지 홀의 폭과 모양을 제어해야 한다.'),
    step('저장막·채널 형성', '홀 벽에 저장 기능을 하는 막과 수직 채널을 형성한다.', '게이트 교체 공정 등은 생략한 개념 순서다. 저장막과 채널은 서로 다른 역할이다.'),
    step('셀 찾아보기', '선택한 워드라인 높이와 수직 채널이 만나는 부분을 강조했다.', '각 높이의 게이트가 인접한 저장 영역을 제어한다. 실제로는 여러 셀이 직렬로 연결된다.'),
  ],
  'hbm': [
    step('개별 DRAM 다이', 'HBM에 들어갈 DRAM 칩 하나를 본다.', 'NAND의 내부 층과 달리 각각 제조된 개별 다이다.'),
    step('TSV 연결', '다이를 관통하는 연결과 다이 사이 접합부를 표시했다.', 'TSV는 칩 내부를 관통하고, 접합부는 서로 다른 칩을 이어준다.'),
    step('적층', 'DRAM 다이 4개와 베이스 다이를 쌓은 개념 모형이다.', '층수를 늘리면 용량을 늘릴 수 있지만 대역폭이 같은 비율로 늘어나는 것은 아니다.'),
    step('GPU와 연결', '인터포저 위에 GPU와 HBM을 배치하고 연결 경로를 강조했다.', '넓은 병렬 인터페이스로 데이터를 주고받는다. 화면의 선은 많은 배선을 대표한다.'),
  ],
}
export function stepsFor(scene: SceneId, lesson: Lesson = 'patterning'): Step[] {
  return scene === 'wafer-process' ? lessons[lesson] : sceneSteps[scene]
}
export function initialState(scene: SceneId): ModelState {
  return { scene, lesson: 'patterning', step: 0, voltage: 0, cutaway: false, exploded: false, bonding: 'wire', selectedLayer: 2 }
}
export function stepState(state: ModelState, next: number): ModelState {
  const n = Math.max(0, Math.min(stepsFor(state.scene, state.lesson).length - 1, next))
  return { ...state, step: n, voltage: state.scene === 'mosfet' ? (n === 2 ? 80 : 0) : state.voltage }
}
/** Relative teaching values, not a retention-time or voltage calculation. */
export function dramState(step: number) {
  return { accessOpen: [1, 3, 4].includes(step), charge: [0, 1, 0.8, 0.35, 1, 1][step] ?? 0 }
}
export function buildModel(s: ModelState): Part[] {
  const parts: Part[] = []
  const box = (id: string, label: string, color: string, position: Position, size: Position, extra: Partial<Part> = {}) => {
    parts.push({ id, label, color, kind: 'box', position, size, ...extra })
  }
  const wire = (id: string, label: string, color: string, points: Position[]) => {
    parts.push({ id, label, color, kind: 'wire', points, position: [0, 0, 0], size: [0.065, 0, 0] })
  }
  const c = colors
  if (s.scene === 'industry-chain') {
    const stations = [['design', '설계', -4.5], ['fab', '제조', -1.5], ['assembly', '조립·검사', 1.5], ['system', '시스템', 4.5]] as const
    const active = s.step < 2 ? 0 : s.step === 2 ? 1 : s.step < 5 ? 2 : 3
    stations.forEach(([id, label, x], index) => box(`station-${id}`, label, index === active ? c.channel : c.board, [x, 0.12, 0], [2.7, 0.24, 2.8]))
    wire('handoff-route', '결과물 인계 경로', c.oxide, [[-4.5, 0.4, 0], [4.5, 0.4, 0]])
    box('design-data', '회로 설계 정보', c.dopant, [-4.5, 0.52, 0], [1.9, 0.14, 1.9])
    for (const x of [-5, -4.5, -4]) box(`design-pattern-${x}`, '회로 설계 정보', c.oxide, [x, 0.62, 0], [0.14, 0.08, 1.45])
    if (s.step >= 2) {
      box('industry-wafer', '회로가 형성된 웨이퍼', c.silicon, [-1.5, 0.5, 0], [2.5, 0.16, 2.5], { kind: 'cylinder' })
      for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) {
        if (x === 0 && z === 0) continue
        box(`wafer-circuit-${x}-${z}`, '웨이퍼 위의 다른 다이', c.channel, [-1.5 + x * 0.6, 0.63, z * 0.6], [0.48, 0.1, 0.48])
      }
      const x = s.step === 2 ? -1.5 : s.step === 5 ? 4.5 : 1.5
      box('product-die', '선택한 다이', c.changed, [x, s.step >= 4 ? 0.94 : 0.65, 0], [0.48, 0.16, 0.48])
      if (s.step >= 4) {
        box('product-substrate', '패키지 기판', c.oxide, [x, 0.72, 0], [1.7, 0.2, 1.7])
        box('product-cover', '보호재 (내부 관찰용 반투명)', c.silicon, [x, 1.05, 0], [1.25, 0.46, 1.25], { opacity: 0.3 })
        for (const dx of [-0.75, 0.75]) for (const z of [-0.5, 0, 0.5]) box(`product-pin-${dx}-${z}`, '패키지 연결 단자', c.metal, [x + dx, 0.91, z], [0.45, 0.08, 0.12])
      }
    }
  } else if (s.scene === 'dram-cell') {
    const { accessOpen, charge } = dramState(s.step)
    box('dram-base', '회로를 펼친 개념 모형', c.board, [0, 0.1, 0], [9, 0.2, 3])
    box('dram-sense', '감지·구동 회로', s.step === 4 ? c.changed : c.dopant, [-3.5, 0.6, 0], [1.2, 0.8, 1.2])
    wire('dram-bitline', '비트라인', c.metal, [[-2.9, 0.85, 0], [-0.95, 0.85, 0]])
    box('dram-body', '접근 트랜지스터 바탕', c.silicon, [0, 0.55, 0], [2, 0.6, 1.2])
    for (const x of [-0.8, 0.8]) box(`dram-contact-${x}`, '접근 트랜지스터 접점', c.dopant, [x, 0.85, 0], [0.4, 0.16, 1.2])
    box('dram-access', accessOpen ? '접근 스위치 ON' : '접근 스위치 OFF', accessOpen ? c.channel : c.metal, [0, 1.19, 0], [1.2, 0.35, 1.2])
    box('dram-gate-oxide', '게이트 절연막', c.oxide, [0, 0.95, 0], [1.2, 0.13, 1.2])
    wire('dram-wordline', '워드라인 (스위치 제어)', c.dopant, [[0, 1.37, -1.25], [0, 1.37, 0]])
    if (accessOpen) box('dram-channel', '열린 전하 이동 경로', c.channel, [0, 0.84, 0], [1.25, 0.08, 1.2])
    wire('dram-storage-link', '저장 노드 연결', c.metal, [[0.95, 0.85, 0], [2.6, 0.85, 0], [2.6, 1.45, 0]])
    box('dram-storage', '커패시터 저장 전극', c.metal, [2.6, 1.45, 0], [2, 0.16, 1.5])
    box('dram-dielectric', '커패시터 절연막', c.oxide, [2.6, 1.77, 0], [2, 0.48, 1.5], { opacity: 0.4 })
    box('dram-reference', '커패시터 반대 전극', c.metal, [2.6, 2.09, 0], [2, 0.16, 1.5])
    box('dram-charge-scale', '저장 상태 표시 눈금 (실제 부품 아님)', c.oxide, [4, 1.1, 0], [0.3, 1.6, 0.3], { opacity: 0.2 })
    box('dram-charge', '저장 전하 상태 (표시 길이는 상대값)', c.changed, [4, 0.35 + charge * 0.75, 0], [0.2, Math.max(0.001, charge * 1.5), 0.2], { opacity: charge > 0 ? 1 : 0 })
  } else if (s.scene === 'mosfet') {
    box('body', 'P형 실리콘 기판', c.silicon, [0, 0.6, 0], [7, 1.2, 4])
    for (const [id, x] of [['source', -2.3], ['drain', 2.3]] as const) {
      box(id, id === 'source' ? '소스 (N+)' : '드레인 (N+)', c.dopant, [x, 0.985, 0], [1.4, 0.43, 2.5])
      box(`${id}-contact`, '금속 접점', c.metal, [x, 1.625, 0], [0.65, 0.85, 0.8])
    }
    box('gate-oxide', '게이트 절연막', c.oxide, [0, 1.27, 0], [3.2, 0.14, 2.5])
    box('gate', '게이트', c.metal, [0, s.exploded ? 3.5 : 1.665, 0], [3.2, 0.65, 2.5])
    if (s.voltage >= 50) {
      box('channel', '반전 채널', c.channel, [0, 1.135, 0], [3.25, 0.13, 2.4])
      for (let n = 0; n < 7; n++) box(`electron-${n}`, '전자 (소스 → 드레인)', '#fff2a5', [-1.4 + n * 0.47, 1.15, 1.26], [0.15, 0.13, 0.12])
    }
  } else if (s.scene === 'wafer-process') {
    const oxidizing = s.lesson === 'oxidation' && s.step === 1
    const substrateTop = oxidizing ? 0.8 : 1
    box('silicon', '실리콘 바탕', c.silicon, [0, substrateTop / 2, 0], [7, substrateTop, 4])
    if (s.lesson === 'oxidation') {
      if (s.step > 0) box('oxide', s.step === 1 ? '실리콘을 소비한 산화막' : '외부에서 쌓은 증착막', c.oxide, [0, substrateTop + 0.25, 0], [7, 0.5, 4])
      if (oxidizing) for (let x = -2; x <= 2; x += 2) wire(`oxygen-${x}`, '산소 공급', c.changed, [[x, 3, 0], [x, 1.5, 0]])
    } else if (s.lesson === 'doping') {
      for (const x of [-2.5, 2.5]) box(`mask-${x}`, '주입 보호막', c.oxide, [x, 1.3, 0], [2, 0.6, 4])
      if (s.step >= 1) {
        if (s.step === 1) {
          for (let x = -1; x <= 1; x += 0.5) for (let z = -1; z <= 1; z++) box(`ion-${x}-${z}`, '주입된 도펀트', c.dopant, [x, 0.8, z], [0.16, 0.16, 0.16])
          for (const x of [-0.8, 0, 0.8]) wire(`beam-${x}`, '이온 빔', c.changed, [[x, 3.2, 0], [x, 0.9, 0]])
        } else box('activated', '활성화한 도핑 영역', c.dopant, [0, 0.76, 0], [2.5, 0.48, 3.8])
      }
    } else {
      if (s.step >= 1 && s.step < 5) box('dielectric', '절연막', c.oxide, [0, 1.45, 0], [7, 0.9, 4])
      if (s.step >= 5) {
        for (const [x, width] of [[-2.9, 1.2], [0, 2], [2.9, 1.2]]) box(`dielectric-${x}`, '남은 절연막', c.oxide, [x!, 1.45, 0], [width!, 0.9, 4])
      }
      if (s.step >= 2 && s.step < 6) {
        for (const [x, width] of [[-2.9, 1.2], [0, 2], [2.9, 1.2]]) box(`pr-${x}`, '보호하는 PR', c.resist, [x!, 2.1, 0], [width!, 0.4, 4])
        if (s.step <= 3) for (const x of [-1.65, 1.65]) box(`exposed-${x}`, s.step === 3 ? '노광된 PR (아직 남아 있음)' : 'PR', s.step === 3 ? c.changed : c.resist, [x, 2.1, 0], [1.3, 0.4, 4])
        if (s.step === 3) for (const x of [-1.65, 1.65]) wire(`light-${x}`, '빛', c.changed, [[x, 4, 0], [x, 2.3, 0]])
      }
      if (s.step >= 7) {
        for (const x of [-1.65, 1.65]) box(`metal-${x}`, '홈 속 금속선', c.metal, [x, 1.45, 0], [1.3, 0.9, 4])
        if (s.step === 7) box('overburden', '제거할 윗면 금속', c.metal, [0, 2.1, 0], [7, 0.4, 4])
      }
    }
  } else if (s.scene === 'packaging') {
    if (s.step <= 2) {
      const height = s.step === 0 ? 0.7 : 0.25
      for (let x = -2; x <= 2; x += 2) for (let z = -1; z <= 1; z += 2) {
        const gap = s.step === 2 ? 1.25 : 1
        box(`die-${x}-${z}`, '개별 다이', c.silicon, [x * gap, height / 2, z * gap], [1.92, height, 1.92])
        box(`circuit-${x}-${z}`, x === 0 && z === 1 ? '검사에서 제외된 다이' : '회로 면', x === 0 && z === 1 ? c.resist : c.channel, [x * gap, height + 0.03, z * gap], [1.65, 0.06, 1.65])
      }
    } else {
      box('substrate', '패키지 기판', c.board, [0, 0.3, 0], [7, 0.6, 4.5])
      const flip = s.bonding === 'flip' && s.step >= 4
      const dieY = s.exploded ? 2.7 : 1.1
      box('die', '실리콘 다이', c.silicon, [0, dieY, 0], [3.5, 0.5, 2.7])
      box('active-face', '활성면 (회로 면)', c.channel, [0, dieY + (flip ? -0.27 : 0.27), 0], [3.3, 0.04, 2.5])
      if (s.step >= 4) for (const x of [-1.3, 0, 1.3]) for (const z of [-1, 1]) {
        if (flip) box(`bump-${x}-${z}`, '접합 범프', c.metal, [x, dieY - 0.38, z], [0.3, 0.23, 0.3], { kind: 'cylinder' })
        else wire(`wire-${x}-${z}`, '본딩 와이어', c.changed, [[x, dieY + 0.3, z], [x, dieY + 1.1, z * 1.4], [x * 1.6, 0.65, z * 1.9]])
      }
      if (s.step >= 5) box('mold', '몰딩 보호재', '#c4cddd', [0, s.exploded ? 4.5 : 1.75, 0], [5.8, 2.2, 4], { opacity: 0.18 })
      for (const x of [-2.5, -1.25, 0, 1.25, 2.5]) for (const z of [-1.5, 0, 1.5]) box(`ball-${x}-${z}`, '외부 연결 단자', c.metal, [x, -0.15, z], [0.32, 0.3, 0.32], { kind: 'cylinder' })
    }
  } else if (s.scene === 'nand-3d') {
    box('substrate', '하나의 실리콘 다이', c.silicon, [0, 0.25, 0], [6, 0.5, 4])
    const holes = [-1.4, 1.4].map(x => ({ x, z: 0, radius: 0.53 }))
    for (let n = 0; n < 6; n++) {
      const y = 0.8 + n * (s.exploded ? 0.92 : 0.65)
      const selected = s.step === 3 && s.selectedLayer === n
      box(`wordline-${n}`, selected ? `선택한 워드라인 ${n + 1}` : '워드라인 (게이트 층)', selected ? c.changed : c.metal, [0, y, 0], [6, 0.24, 4], { kind: 'plate', holes: s.step >= 1 ? holes : [] })
      box(`insulator-${n}`, '층 사이 절연막', c.oxide, [0, y + 0.3, 0], [6, 0.36, 4], { kind: 'plate', holes: s.step >= 1 ? holes : [] })
      if (s.step >= 2) for (const x of [-1.4, 1.4]) {
        box(`storage-${n}-${x}`, selected ? '선택 셀의 저장막' : '전하 저장막 (주변 절연막 생략)', selected ? c.changed : c.resist, [x, y + 0.16, 0], [0.92, 0.65, 0.92], { kind: 'cylinder', innerRadius: 0.24 })
        box(`channel-${n}-${x}`, '수직 채널', c.channel, [x, y + 0.16, 0], [0.42, 0.65, 0.42], { kind: 'cylinder' })
      }
    }
  } else if (s.scene === 'hbm') {
    const count = s.step >= 2 ? 4 : 1
    const hbmX = s.step === 3 ? -1.8 : 0
    if (s.step >= 2) box('base', '베이스 다이', c.dopant, [hbmX, 0.65, 0], [3.1, 0.4, 3])
    for (let n = 0; n < count; n++) {
      const y = 1.2 + n * (s.exploded ? 1.25 : 0.7)
      const holes = [-0.8, 0.8].flatMap(x => [-0.8, 0, 0.8].map(z => ({ x, z, radius: 0.11 })))
      box(`dram-${n}`, `DRAM 다이 ${n + 1}`, c.silicon, [hbmX, y, 0], [3, 0.5, 2.8], { kind: 'plate', holes: s.step >= 1 ? holes : [] })
      if (s.step >= 1) for (const x of [-0.8, 0.8]) for (const z of [-0.8, 0, 0.8]) {
        box(`tsv-${n}-${x}-${z}`, 'TSV (실리콘 관통 연결)', c.metal, [hbmX + x, y, z], [0.18, 0.52, 0.18], { kind: 'cylinder' })
        box(`joint-${n}-${x}-${z}`, '다이 사이 접합부', c.changed, [hbmX + x, y - 0.35, z], [0.3, 0.18, 0.3], { kind: 'cylinder' })
      }
    }
    if (s.step === 3) {
      box('interposer', '인터포저', c.oxide, [0.5, 0.22, 0], [9, 0.3, 4.5])
      box('gpu', 'GPU (연산 칩)', c.board, [2.6, 0.8, 0], [3, 0.75, 3])
      for (const z of [-0.8, 0, 0.8]) wire(`route-${z}`, '병렬 데이터 경로', c.changed, [[hbmX, 0.43, z], [2.6, 0.43, z]])
    }
  }
  return parts
}
