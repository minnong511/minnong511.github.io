# 블로그 디자인 개선 검증 · 2026-09-07

**final result: passed**

기존 IDE 분위기를 유지하면서 점검에서 확인한 글 탐색, 목록 가독성, 목차, 밝은 테마 문제를 수정했다. 검증한 화면과 흐름에 남은 P0/P1/P2 디자인 문제는 없다. 배포는 하지 않았으며, 로컬 미리보기는 http://127.0.0.1:3210/ 에서 실행 중이다.

## 점검 단계별 반영

| 단계 | 기존 문제 | 반영한 개선 | 확인 결과 |
| --- | --- | --- | --- |
| 1. 홈 | 카테고리 55개 뒤에 최근 글이 나옴 | 짧은 소개 → 최근 글 6개 → 대표 주제 8개 순서로 변경 | 첫 화면에서 최근 글을 읽을 수 있음 |
| 2. 글 목록 | 작은 제목, 날짜가 차지하는 공간, 한 줄 말줄임 | 제목 18px, 모바일 17px와 최대 두 줄, 설명과 날짜·분류를 아래에 배치 | 긴 Kubernetes 제목이 두 줄로 표시됨 |
| 3. 검색 | 결과 수와 일치 이유가 보이지 않음 | 보이는 결과 수, 제목·설명·태그의 일치 부분 강조, 빈 결과와 초기화 버튼 | LoRA 5개, 없는 검색어 0개, 초기화 후 161개로 복귀 |
| 4. 본문 | 본문 H1이 목차에서 누락되고 수식이 제목으로 해석됨 | 렌더링 시 제목 계층 정규화, 저장된 LaTeX 구분자와 수식 렌더링 지원 | 글 제목 H1 1개, 주요 장 목차 포함, LoRA 수식 62개와 오류 0개 |
| 5. 목차 | 768–1199px에서 버튼만 바뀌고 패널이 안 보임 | 중간 너비에서 오른쪽 패널, 모바일에서 아래 패널 제공 | 768/1024/1199px 표시, 모바일 항목 이동 후 닫힘, Escape 닫기 확인 |
| 6. 밝은 테마 | 밝은 하늘색·주황색 글자의 대비 부족 | 밝은 테마 전용 강조색, 상태 표시줄 배경색 분리, 본문 링크 밑줄 | 테마 전환 및 본문 비교 확인 |
| 7. 모바일·메뉴 | 상단 도구가 너무 크고 개발 도구 이름이 탐색을 방해 | 최근 문서 탭 접기, 필터·정렬 한 줄, 홈/전체 글/주제/검색/소개 메뉴 | 360/400/430px 배치와 탭 펼침·접힘 확인 |

`Deep_Learning`/`DeepLearning`, `Basic`/`basics`는 표시·필터에서 같은 분류로 취급한다. 기존 카테고리 URL은 유지한다. 대표 주제는 백엔드, 프론트엔드, AI·AX, 인프라·DevOps, 컴퓨터 기초, Python·알고리즘, 프로젝트, 생각·학습 기록이다. AI 주제 선택 시 36개 글로 좁혀지는 것을 브라우저에서 확인했다.

기존 원문은 수정하지 않았다. 삭제된 글이 목록에 남아 있던 문제는 현재 Markdown을 기준으로 자동 생성 공개 인덱스를 갱신해 해결했다.

## 비교 기준과 화면 근거

- source visual truth: [기존 점검 보고서](reports/design-audit-2026-09-07/report.md)와 해당 폴더의 원본 캡처.
- implementation screenshots: `reports/design-improvements-2026-09-07/`.
- 단순 복제가 아닌 승인된 개선 작업이다. 글의 순서, 제목 크기, 메뉴명과 색상 차이는 의도한 변경이다.
- 공개 사이트는 157개 글, 로컬 현재 파일은 161개다. 최근 글 내용과 저장된 탭 개수는 다르므로 콘텐츠 자체의 차이를 디자인 회귀로 판단하지 않았다.
- 데스크톱 비교는 같은 브라우저 창을 포함한 **768×840px** 이미지다. 이전 점검의 CSS 뷰포트 치수는 기록되지 않았으므로 픽셀 단위 거리 비교에는 사용하지 않았다.
- 모바일 전후는 **400×844 CSS px, DPR 2, 800×1688px**다. 페이지 배율 1과 문서 너비 400을 확인했다. 확대 상태와 잘못 입력된 뷰포트에서 나온 캡처는 최종 증거에서 제외했다.
- 넓은 본문 화면은 **1440×844 CSS px, DPR 2, 2880×1688px**다. 도구 출력에서 2048px로 축소된 미리보기와 원본 픽셀 치수를 구분했다.
- 360px에서 DOM 측정: `innerWidth=360`, `scrollWidth=360`, `visualViewport.scale=1`, 제목 `17px`, 첫 제목 상단 약 `335px`.

| 비교 대상 | 이전 | 개선 후 |
| --- | --- | --- |
| 홈, 어두운 테마 | [원본](reports/design-audit-2026-09-07/01-home-desktop.png) | [개선](reports/design-improvements-2026-09-07/01-home-desktop.png) |
| 전체 글 목록 | [원본](reports/design-audit-2026-09-07/02-archive-desktop.png) | [개선](reports/design-improvements-2026-09-07/02-archive-desktop.png) |
| LoRA 검색 | [원본](reports/design-audit-2026-09-07/03-search-results.png) | [개선](reports/design-improvements-2026-09-07/03-search-results.png) |
| 중간 너비 목차 열기 | [원본](reports/design-audit-2026-09-07/05-outline-no-panel.png) | [개선](reports/design-improvements-2026-09-07/05-outline-desktop.png) |
| LoRA 밝은 테마, 목차 닫힘 | [원본](reports/design-audit-2026-09-07/06-light-theme.png) | [개선](reports/design-improvements-2026-09-07/06-light-theme.png) |
| 모바일 목록 | [원본](reports/design-audit-2026-09-07/07-archive-mobile.png) | [개선](reports/design-improvements-2026-09-07/07-archive-mobile.png) |

전후 이미지를 같은 비교 입력에 함께 열어 확인했다. 특히 모바일 제목의 두 줄 배치, 검색 결과의 강조 부분, 오른쪽 목차의 장 제목, 밝은 테마의 분류명을 중점 비교했다. 이 영역의 문구를 원본 이미지에서 읽을 수 있어 별도 잘라낸 이미지는 만들지 않았다.

## QA 반복 이력

1. **P2 · 선택 메뉴 배경색 충돌.** 초기 구현에서 레거시 테마의 흰색 `--selection`이 적용됐다. [초기 화면](reports/design-improvements-2026-09-07/00-selection-before-fix.png). 어두운 테마 토큰의 선택자를 명확히 하고 글자 색을 분리했다. [수정 후 홈](reports/design-improvements-2026-09-07/01-home-desktop.png)과 [검색 강조](reports/design-improvements-2026-09-07/03-search-results.png)에서 재확인했다.
2. **P2 · 수식이 목차에 노출됨.** 제목 계층을 바로잡은 뒤 기존 수식 파싱 문제까지 목차에 드러났다. [수정 전](reports/design-improvements-2026-09-07/00-math-before-fix.png). 원문을 보존하며 파싱 전에 구분자를 변환하고 remark-math/rehype-katex로 렌더링했다. [최종 목차](reports/design-improvements-2026-09-07/04-article-1440.png), [최종 수식](reports/design-improvements-2026-09-07/10-math-rendered.png)에서 재확인했다.
3. **P1 · 수식 CSS 추가 후 기본 스타일 누락.** 앱 스크립트의 CSS import를 추가한 빌드에서 기본 초기화 스타일이 빠져 링크와 여백이 바뀌었다. [회귀 화면](reports/design-improvements-2026-09-07/00-reset-before-fix.png). CSS를 Nuxt의 전역 CSS 설정으로 옮긴 뒤, 같은 1440×844 화면으로 다시 빌드·캡처했다. [최종 화면](reports/design-improvements-2026-09-07/04-article-1440.png)에서 원래 여백과 링크·탭·상태 표시줄을 확인했다.
4. 최종 비교에서 위 문제들이 해결됐다. 코드·빌드만으로 판정하지 않고 수정 후 브라우저 캡처를 다시 비교했다.

768px와 1199px 경계의 패널 배치는 [768px 기록](reports/design-improvements-2026-09-07/08-outline-768.png), [1199px 기록](reports/design-improvements-2026-09-07/09-outline-1199.png)으로 남겼다. 이 두 기록은 수식 수정 전이며, 최종 목차 내용은 위의 최종 화면을 기준으로 한다.

## 필수 디자인 항목

- **글꼴·계층:** 기존 Pretendard 본문과 IBM Plex Mono 도구 글꼴 유지. 목록 제목은 18/17px, 목차는 14px. 긴 제목과 목차 항목 줄바꿈 확인.
- **간격·배치:** 홈에서 최근 글 우선, 모바일 상단 축소, 날짜·분류를 제목 아래 배치. 400px 비교 캡처에서 첫 제목이 기존 약 520px에서 약 335px 위치로 앞당겨졌다. 설명을 추가했으므로 화면당 행 개수 증가를 목표로 삼지는 않았다.
- **색상·토큰:** 밝은 배경 `#f7f9fa`에 대해 파란 글자 `#006b9f`는 **5.52:1**, 주황 글자 `#925400`은 **5.70:1**. 소스의 지정 색상으로 계산한 값이며 전체 UI 접근성 인증은 아니다. [W3C 기준](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- **이미지·아이콘:** 기존 Remix Icon과 본문 자산 유지. 새 장식 이미지나 로고 대체 없음. 화면의 주요 아이콘이 표시되는지 확인.
- **문구·콘텐츠:** 독자 행동에 맞는 메뉴, 결과 수·조건·빈 상태 문구 확인. 글 원문과 기술적 주장은 변경하지 않음.

## 기능·빌드 검증

- `npm test`: **11개 파일, 99개 테스트 통과**.
- `npx eslint .`: 통과.
- `npm run typecheck`: 통과. 최종 `npm run build`의 타입 검사도 통과.
- `npm run build`: 최종 빌드 성공.
- `node scripts/verify-output.mjs`: **공개 글 161개, 기존 URL 82개, 비공개 4개 제외** 검증 통과.
- 생성된 LoRA HTML: H1 1개, 수식 62개, KaTeX 오류 0개. 생성된 전체 HTML에서도 KaTeX 오류 표시 없음.
- 이번 변경의 Vue/TS/CSS/설정/인덱스/테스트에 대한 `git diff --check`: 통과.
- 브라우저: 홈 → 전체 글 → AI 필터 → 초기화 → LoRA 검색 → 빈 결과 → 초기화, 별도 본문 검색, 어두운/밝은 테마, 모바일 최근 탭 펼침·접힘, 목차 열기·닫기·항목 이동·Escape 확인.
- 콘솔: 확인한 흐름에 실행 오류·hydration 오류는 없었다. Nuxt 성능 로그의 중복 타이머 경고는 남아 있다.

## 범위 밖의 기존 검증 상태

`npm run content:validate`는 이전 마이그레이션 이력 `data/content-manifest.json`이 이미 삭제된 `Calico.md`, `kubernetes1.md`를 참조하여 **2건 실패**한다. 현재 공개 인덱스와 실제 정적 결과 검증은 통과했다. 과거 마이그레이션 이력과 사용자 작성 중인 글은 이번 디자인 작업에서 변경하지 않았다.

실제 휴대폰, 스크린리더, 전체 키보드 순서, 모든 본문과 인터랙티브 학습 도구, 성능 지표는 전수 검증하지 않았다. 수식 전처리는 기존 `\[...\]`, `\(...\)` 표기와 코드 예제를 위한 것으로, 모든 Markdown 방언을 지원한다고 주장하지 않는다.

수식 처리는 [Nuxt Content 파싱 훅](https://content.nuxt.com/docs/advanced/hooks), [Markdown 플러그인 설정](https://content.nuxt.com/docs/getting-started/configuration), [remark-math 공식 안내](https://github.com/remarkjs/remark-math)를 확인하고 적용했다.

## 완료 체크

- [x] 점검 7단계 개선 반영
- [x] 수정 후 데스크톱·모바일 화면 비교
- [x] 수식·목차·필터 회귀 검사와 빌드 확인
- [x] 기존 작업 보존, 로컬 미리보기 제공
- [ ] 공개 배포 — 요청 범위에 포함되지 않음
