# 반도체 4부작 구현·검증 기록

2026-09-07 기준, 글 4편과 조작형 3D 7장면을 로컬 정적 미리보기에서 검증했다. Git 커밋·푸시와 실제 배포는 하지 않았다.

## 작성한 글

| 파트 | 파일 | 공개 경로 | 시각 자료 |
|---|---|---|---|
| 1. 산업과 공급망 | [part-1](../content/posts/AX/반도체/2026-09-07-semiconductor-part-1.md) | `/ax/semiconductor/part-1/` | 산업 흐름도, 설계 데이터·웨이퍼·다이·패키지 인계 3D |
| 2. 소자와 제품 | [part-2](../content/posts/AX/반도체/2026-09-07-semiconductor-part-2.md) | `/ax/semiconductor/part-2/` | MOSFET 전자 이동, DRAM 쓰기·읽기·복원 3D, NAND 도식 |
| 3. 공정과 제조 AX | [part-3](../content/posts/AX/반도체/2026-09-07-semiconductor-part-3.md) | `/ax/semiconductor/part-3/` | 공정 3D, 패키징 3D, 설비·데이터 흐름도 |
| 4. 3D NAND와 HBM | [part-4](../content/posts/AX/반도체/2026-09-07-semiconductor-part-4.md) | `/ax/semiconductor/part-4/` | NAND 셀 선택·단면, HBM 분해·조립 |

네 글 모두 앞부분의 3문장 요약과 용어 정의, 흐름도, 설명 본문, AX 연결, 이해 확인 질문 3개, 파트 이동 링크, 공식 참고자료를 갖춘다. 요약과 용어는 기존 사이트의 `summary` / `key_concepts` 카드로 표시된다. Mermaid 7개가 오류 없이 렌더링됐다.

`AX.md`, `AX2.md`, `제조_AI.md`에는 메타데이터만 추가했고, 작업 전후 본문 SHA-256이 모두 일치했다. 비어 있던 `설명.md`는 `drafts/AX/설명.md`에 `published: false`로 보존했다. 기존 공개 주소 검증도 통과했다.

## 기능 검증

검증 환경은 Playwright Chromium, 데스크톱 1440px, 모바일 390×844px 터치 에뮬레이션이다. WebGL은 SwiftShader로 실행했다. 실제 휴대전화의 GPU 성능이나 Safari 호환성을 측정한 결과는 아니다.

| 확인 대상 | 관찰 결과 |
|---|---|
| 4개 주소·파트 이동 | 본문 링크를 통한 1→2→3→4 이동, 제목·요약 표시 정상 |
| 폴더·검색 | `ax/반도체` 폴더에 4편 표시, 검색어 `반도체`로 4편 모두 검색 |
| MOSFET | 전압 슬라이더 ON/OFF, 단면, 카메라 시점, 확대, 회전, 초기화 확인 |
| 공정 | 패턴 9단계, 산화 비교 3단계, 도핑 3단계 모두 이동 가능. 첫 단계를 제외한 각 단계에 전후 SVG 2개 표시 |
| 공정 설명 일치 | 노광·현상에서는 절연막 유지, 식각에서 제거. CMP에서는 윗면 금속만 제거. 산화의 실리콘 소비와 도핑의 내부 위치를 단위 테스트로 확인 |
| 패키징 | 5단계에서 와이어→플립칩 선택 시 형상과 범례가 함께 변경. 회로 면 방향과 접합 범프 표시 확인 |
| NAND·HBM | 워드라인 선택, 단면, 분해와 GPU 연결 확인. 하나의 다이 내부 셀 층과 개별 DRAM 다이를 별도 구조로 표현 |
| 키보드 | 모형에 초점을 두고 방향키를 누르면 실제 렌더링 이미지 변경. 버튼·선택·범위 입력은 기본 키보드 조작 사용 |
| 모바일 | 터치 드래그로 회전, 확대·시점·단면·분해 버튼 조작. 모형 폭과 내부 스크롤 폭 일치, 문서 가로 넘침 없음 |
| 모션 감소 | `prefers-reduced-motion: reduce` 상태에서 조작 가능. 자동 재생 없음 |
| 한 번에 하나 | HBM을 켜면 NAND가 `idle`로 전환. 활성 캔버스 1개 유지 |
| 화면 이탈 | 글 상단으로 이동한 뒤 반도체 캔버스 0개 |
| 반복 페이지 이동 | 4→3→2→3→4 이동마다 이전 캔버스가 DOM에서 제거되고 해당 WebGL 컨텍스트가 해제됨. 새 장면 활성화 후 캔버스 1개 |
| 유휴 렌더링 | 조작 종료 후 400ms 동안 반도체 렌더러의 추가 RAF 요청 0건. 코드에도 지속 렌더링 루프 없음 |
| WebGL 미지원 | WebGL 컨텍스트 생성을 실패시켜 확인. SVG·실패 안내·재시도 유지, 단계 이동 가능, 캔버스 0개 |
| 모듈 로딩 실패 | 3D 모듈 요청을 중단해 확인. SVG와 본문 유지, 오류 안내 표시 |
| 로딩 중 페이지 이동 | 모듈 응답을 지연시킨 뒤 이동. 늦게 도착한 응답이 새 페이지에 캔버스를 만들지 않음 |
| JavaScript 비활성화 | 공정·패키징 SVG 2개와 본문 유지. 실행할 수 없는 조작부는 비활성화 |

정상 경로의 최종 브라우저 검사에서 JavaScript 오류는 0건이었다. 실패를 주입한 검사는 예상한 대체 화면 전환을 확인하는 별도 검사다.

## 재생 기능 추가 검증

모든 장면에 재생·일시정지·이어서 재생과 0.5배 / 1배 / 2배 속도를 추가했다. 재생 버튼을 누르면 필요한 3D 코드도 함께 불러온다. 처음부터 자동으로 움직이지 않는다. 제조·조립은 선택한 단계부터 진행한 뒤 마지막 단계에서 멈추고, 완료 후 다시 재생하면 처음으로 돌아간다. 전류·데이터 흐름은 일시정지할 때까지 반복한다.

| 장면 | 재생하는 변화 | 브라우저 확인 |
|---|---|---|
| MOSFET | ON 상태의 소스→드레인 전자 이동. 관습적 전류 방향은 반대임을 화면에 설명 | 두 시점의 화면이 달라짐. 일시정지 후 500ms 동안 화면·진행률 동일. 전압을 OFF로 바꾸면 재생 중지 |
| 웨이퍼 공정 | 막 성장, 감광액 변화, 선택적 제거, 금속 채움과 CMP. 산화·도핑 실습도 재생 가능 | 증착 도중 두 화면의 막 두께 변화 확인. CMP까지 자동 진행·완료, 다시 재생 시 0단계, 초기화 시 진행률 0 |
| 패키징 | 박막화, 절단, 다이 배치, 본딩 연결이 만들어지는 과정, 검사 위치 표시 | 본딩 연결 형상 변화 확인. 마지막 검사 단계를 직접 선택해 재생 가능 |
| 3D NAND | 층을 순서대로 형성하고 위층부터 홀을 여는 과정. 읽기 경로는 별도 선택 | 층 형성 도중 형상 변화, 제조 완료, 읽기 경로 모드 전환 확인 |
| HBM | 다이를 내려놓는 적층·조립, GPU→HBM 요청과 HBM→GPU 데이터 전달 | 조립 완료까지 자동 진행. 데이터 경로에서 이동 표식 확인 |

형상·재료는 매 프레임 새로 생성하지 않고 단계 전환 시 준비한 메시에 위치·크기·투명도·그리기 범위를 적용한다. 일반 재생은 최대 30fps로 제한했다. 산화 중 실리콘과 산화막의 경계가 맞닿는지, 금속이 홈을 채우기 전에 윗면 금속이 생기지 않는지, 식각이 보호 영역을 줄이지 않는지 등을 새 단위 테스트 7개로 확인했다.

재생 중 WebGL 그리기 호출이 발생하는 것을 계측한 뒤, 일시정지 후 500ms 동안 추가 호출 **0건**을 확인했다. `visibilitychange`를 모의 발생시켜 문서가 숨겨지면 일시정지하고, 다시 보이더라도 자동 재개하지 않는지 확인했다. 재생 도중 페이지 이동 후에는 이전 캔버스가 분리되고 WebGL 컨텍스트가 해제됐다. 다른 장면을 재생하면 이전 장면은 `idle`이 되고 캔버스는 하나만 유지됐다.

390×844 모바일 환경에서 터치로 재생·일시정지·이어서 재생을 확인했고 가로 넘침은 없었다. 모션 감소 설정에서는 한 단계 안의 화면이 650ms 동안 고정된 채 단계별로 갱신됐다. JavaScript를 끄면 SVG가 남고 재생 버튼은 비활성화됐다. 모듈 로딩 실패와 재생 중 WebGL 컨텍스트 손실을 각각 주입했을 때 재생 상태가 해제되고 SVG로 복귀했다.

NAND 읽기 설명은 [KIOXIA의 공개 원리 설명](https://www.kioxia.com/en-jp/rd/technology/nand-flash.html)으로 확인했다. 이동 표식은 채널 경로를 나타내며, 저장막의 전하가 채널로 빠져나가는 애니메이션으로 표현하지 않았다. 데이터 경로와 처리 위치 표식은 원리를 보기 위한 개념 표시다.

추가 화면 기록: [전자 이동](../output/playwright/semiconductor/playback-mosfet.png), [증착 중간 상태](../output/playwright/semiconductor/playback-deposition.png), [본딩 연결](../output/playwright/semiconductor/playback-packaging.png), [NAND 읽기](../output/playwright/semiconductor/playback-nand.png), [HBM 데이터](../output/playwright/semiconductor/playback-hbm.png), [HBM 조립 중간 상태](../output/playwright/semiconductor/playback-stacking.png), [모바일 재생 버튼](../output/playwright/semiconductor/playback-mobile.png).

## 1·2편 재생 장면 확장

1편에 `industry-chain`, 2편에 `dram-cell`을 추가했다. 1편은 설계 정보의 전달과 실제 다이·패키지의 이동을 구분하는 6단계 모형이다. 2편은 기존 MOSFET의 전자 이동에 더해 쓰기, 보관, 전하 공유를 통한 읽기, 감지·복원, 다시 보관의 6단계 모형을 제공한다. 두 모형 모두 공통 재생·일시정지·재개·속도·단계·초기화 기능을 사용한다.

설계판이 실리콘으로 변하는 것으로 표현하지 않았고, DRAM의 전하 전달 경로가 커패시터 절연막을 통과하지 않도록 했다. DRAM 저장 표시의 길이는 상대값이며 실제 소자 형상, 전하량, 시간 비율을 뜻하지 않는다. 비트라인을 통해 감지·구동 회로와 셀이 연결되도록 2편의 Mermaid도 보완했다.

산업의 역할은 [ASML](https://www.asml.com/en/technology/all-about-microchips/how-microchips-are-made), DRAM 저장·리프레시는 [삼성전자](https://semiconductor.samsung.com/support/tools-resources/dictionary/semiconductor-glossary-dram/), 전하 공유·복원은 [HiFi-DRAM 원 논문 2~3쪽](https://comsec.ethz.ch/wp-content/files/hifidram_isca24.pdf)으로 확인했다. 접근 시 404를 반환한 기존 Micron PDF 링크는 2편에서 확인 가능한 원출처로 교체했다. 원출처의 이미지나 PDF를 배포물에 추가하지 않았다.

| 확인 | 결과 |
|---|---|
| 산업 모션 | 설계 데이터 전달 중 두 화면이 달라짐. 일시정지 후 450ms 동안 화면 동일. 제조부터 시스템 탑재까지 자동 진행·완료 |
| DRAM 모션 | 쓰기 중 전하 표식·저장 표시 변화. 일시정지 화면 고정, 2배속 재개 후 6단계 완료. 다시 재생 시 첫 단계, 초기화 시 진행률 0 |
| 키보드·중복 실행 | Enter로 DRAM 재생. DRAM 실행 시 MOSFET은 idle, 반도체 캔버스 1개 |
| 모바일·모션 감소 | 390×844 터치 환경에서 두 장면의 재생·정지·재개, 옆 시점·확대 확인. 모션 감소 안내 표시. 모형 clientWidth = scrollWidth = 356, 문서 폭 390 |
| 초기 로딩 | 1편·2편의 새 브라우저 컨텍스트에서 실행 전 3D 청크 요청 0건. 1편 실행 후 두 청크 각각 1건 |
| 대체 화면 | JavaScript를 끈 1편에 SVG 1개, 2편에 SVG 2개 유지. 재생 버튼 비활성화. WebGL 실패를 주입한 DRAM은 오류 안내·SVG 유지, 재생 false, 캔버스 0개 |
| 단위 검사 | 설계 데이터와 웨이퍼 분리, 패키지 이동 중 다이 위치 유지, DRAM 보관 시 채널 차단, 읽기 시 저장 상태 감소, 복원, 절연막 밖의 전하 경로를 추가 확인 |

일반 데스크톱·모바일 검사의 JavaScript 오류는 0건이었다. [설계 데이터 전달](../output/playwright/semiconductor/part1-design-transfer.png), [시스템 탑재 완료](../output/playwright/semiconductor/part1-system-complete.png), [DRAM 쓰기](../output/playwright/semiconductor/part2-dram-write.png), [DRAM 복원 후 보관](../output/playwright/semiconductor/part2-dram-restored.png), [1편 모바일](../output/playwright/semiconductor/part1-mobile.png), [2편 모바일](../output/playwright/semiconductor/part2-mobile.png) 화면을 기록했다.

## 전송량과 로딩

측정 파일: [semiconductor-bundle.json](./semiconductor-bundle.json). gzip 기준이며 KB는 1,000바이트로 계산했다.

| 측정 대상 | gzip 바이트 | 기준 |
|---|---:|---:|
| 초기 반도체 컴포넌트·도식·CSS | 15,719 | 아래 초기 화면 상한에 포함 |
| 3D 실행 시 추가 코드 | 150,401 | 아래 전체 기능 코드에 포함 |
| 전체 반도체 기능 코드·데이터 | 166,120 | 600,000 이하 |
| 1편 초기 화면 상한 | 64,304 | 100,000 이하 |
| 2편 초기 화면 상한 | 69,774 | 100,000 이하 |
| 3편 초기 화면 상한 | 73,402 | 100,000 이하 |
| 4편 초기 화면 상한 | 68,020 | 100,000 이하 |

기존 공통 앱 청크를 제외한 의존성을 합산했다. 초기 화면 상한은 반도체 전용 코드에 해당 글의 **전체 HTML과 전체 Nuxt payload**까지 더한 보수적인 값이다. 여러 장면이 있는 글도 같은 코드와 데이터 생성기를 재사용하므로 한 글에서 모든 장면을 실행해도 기능 코드 합계가 늘어나지 않는다. 로컬 HTTP 서버는 압축 전송을 하지 않으므로 실제 전송 압축률은 빌드 파일을 gzip으로 계산했다.

브라우저의 새로운 컨텍스트에서 3D 버튼을 누르기 전 `a7Py6JsF.js`와 `BXkl_V5l.js` 요청은 0건이었다. 버튼을 누른 뒤 각 1건만 요청됐다. Three.js / OrbitControls가 공유 청크로 분리되어도 이 의존성의 사전 다운로드를 막도록 Nuxt manifest hook을 적용했다.

모델·영상·대형 텍스처 파일과 백엔드 API를 추가하지 않았다. SVG와 3D 모두 직접 작성한 기본 도형으로 생성한다.

## 공개 자료와 원본 처리

원본 교안은 주제 구분과 학습 범위 확인을 위해 로컬에서만 검토했다. 원본 PDF, 추출 이미지, 교육기관 소개·로고, 강사 연락처·개인정보, 수업 안내, 조별 과제를 새 글이나 배포 자산에 넣지 않았다. 새 글과 해당 정적 HTML·payload에서 제외 대상 문자열을 점검했다.

문장·표·도식은 새로 작성했다. 공식 사이트 그림도 재사용 허가를 확인하지 않은 이미지는 게시하지 않았다. [Intel의 트랜지스터 설명](https://www.intel.com/content/www/us/en/newsroom/tech101/the-transistor-explained.html), [ASML의 제조 공정](https://www.asml.com/en/company/stories/2021/semiconductor-manufacturing-process-steps), [KIOXIA의 3D NAND 구조](https://www.kioxia.com/en-jp/rd/technology/bics-flash.html), [삼성전자의 TSV 설명](https://semiconductor.samsung.com/news-events/news/samsung-electronics-develops-industrys-first-12-layer-3d-tsv-chip-packaging-technology/) 등 공개 기술 자료를 본문에 연결했다. 개념과 표현의 구분은 [WIPO 안내](https://www.wipo.int/en/web/copyright/protection)를 참고했다.

검증할 수 없는 시장 전망·점유율·로드맵 수치는 싣지 않았다. 모형은 원리 설명용이며 실제 크기, 층수, 공정 레시피나 물리 시뮬레이션을 재현하지 않는다는 점을 화면에 명시했다.

## 실행 결과와 다시 확인하는 방법

`npm run verify` 최종 통과: 콘텐츠 검증, ESLint, TypeScript, 테스트 71개(반도체 구조·재생 테스트 17개 포함), 정적 생성과 결과 검증. 공개 글 162개와 기존 URL 82개를 확인하고 비공개 글 4개를 배포 목록에서 제외했다. `git diff --check`도 통과했다.

```bash
npm run verify
node scripts/verify-semiconductor.mjs
python3 -m http.server 4173 --bind 127.0.0.1 --directory .output/public
```

다른 로컬 빌드와 파일 교체가 겹치지 않도록 브라우저 검증에는 정적 결과를 복사한 `/private/tmp/semiconductor-preview/public`도 사용했다. 현재 확인용 주소는 [1편](http://127.0.0.1:4174/ax/semiconductor/part-1/), [공정 실험실이 있는 3편](http://127.0.0.1:4174/ax/semiconductor/part-3/)이다.

로컬 화면 기록: [MOSFET](../output/playwright/semiconductor/mosfet-on.png), [공정 전후](../output/playwright/semiconductor/process-etch-final.png), [플립칩](../output/playwright/semiconductor/packaging-flip.png), [NAND 단면](../output/playwright/semiconductor/nand-cutaway.png), [HBM 분해](../output/playwright/semiconductor/hbm-exploded.png), [모바일 HBM](../output/playwright/semiconductor/mobile-hbm.png). 화면 기록은 Git에서 제외되는 로컬 검증 자료다.
