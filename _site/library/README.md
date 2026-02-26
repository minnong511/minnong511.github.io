# Link Block Library

재사용 가능한 포스트 컴포넌트 모음입니다.

## 1) 링크 카드 사용법

포스트 본문(`.md`)에서 아래처럼 호출하세요.

```liquid
{% raw %}{% include library/link-card.html
  url="https://example.com"
  title="링크 제목"
  desc="간단한 설명"
  host="example.com"
  new_tab="true"
%}{% endraw %}
```

## 2) 파라미터

- `url` (필수): 링크 URL
- `title` (선택): 카드 제목
- `desc` (선택): 카드 설명
- `host` (선택): 하단 도메인 텍스트 (미지정 시 URL에서 자동 추출)
- `new_tab` (선택): `"true"` 또는 `"false"` (기본 `"true"`)

## 3) 코드 스니펫 사용법

멀티라인 코드는 `capture`로 받아서 include에 전달하세요.

```liquid
{% raw %}{% capture sample_code %}
const message = "hello";
console.log(message);
{% endcapture %}

{% include library/code-snippet.html
  title="기본 예시"
  lang="js"
  code=sample_code
%}{% endraw %}
```

## 4) 코드 스니펫 파라미터

- `title` (선택): 코드 블록 제목
- `lang` (선택): 언어 라벨 (`js`, `python`, `bash` 등, 기본 `text`)
- `code` (필수): `capture`로 담은 코드 문자열

## 5) 기본 동작

- 다크 테마 카드 UI
- `Copy` 버튼으로 코드 복사
- `lang="python"` 또는 `lang="py"`일 때 기본 파이썬 문법 하이라이트 적용

## 6) LaTeX 수식 블록 사용법

```liquid
{% raw %}{% capture linear_formula %}
\hat{y} = wx + b
{% endcapture %}

{% include library/latex-block.html
  title="선형회귀 수식"
  formula=linear_formula
%}{% endraw %}
```

## 7) LaTeX 파라미터

- `title` (선택): 수식 카드 제목
- `formula` (필수): `capture`로 담은 LaTeX 식

## 8) Google 지도 블록 사용법

```liquid
{% raw %}{% include library/google-map.html
  title="명동교자 명동점"
  query="명동교자 명동점 서울"
  zoom="16"
  height="360"
%}{% endraw %}
```

## 9) Google 지도 파라미터

- `title` (선택): 지도 카드 제목
- `query` (필수): 장소명/주소 검색어
- `zoom` (선택): 줌 레벨 (기본 `16`)
- `height` (선택): iframe 높이 px (기본 `360`)

## 10) YouTube 블록 사용법

```liquid
{% raw %}{% include library/youtube-embed.html
  title="명동교자 관련 영상"
  query="명동교자 명동점"
  height="380"
%}{% endraw %}
```

또는 특정 영상 ID를 직접 지정할 수 있습니다.

```liquid
{% raw %}{% include library/youtube-embed.html
  title="영상 제목"
  video_id="dQw4w9WgXcQ"
  height="380"
%}{% endraw %}
```

## 11) YouTube 파라미터

- `title` (선택): 영상 카드 제목
- `query` (선택): 검색 기반 임베드용 검색어
- `video_id` (선택): 특정 영상 ID
- `height` (선택): iframe 높이 px (기본 `380`)

## 12) Callout 블록 사용법

```liquid
{% raw %}{% include library/callout.html
  type="tip"
  title="Tip"
  content="핵심 메시지를 강조할 때 사용"
%}{% endraw %}
```

## 13) Table 블록 사용법

```liquid
{% raw %}{% include library/table-card.html
  caption="모듈 상태"
  headers="모듈|설명|상태"
  rows="callout|강조 메시지|완료||table|비교/정리|완료"
%}{% endraw %}
```

## 14) Image Compare 블록 사용법

```liquid
{% raw %}{% include library/image-compare.html
  title="Before / After"
  before="https://images.unsplash.com/..."
  after="https://images.unsplash.com/..."
  before_label="Before"
  after_label="After"
  start="50"
%}{% endraw %}
```

## 15) PDF 임베드 블록 사용법

```liquid
{% raw %}{% include library/pdf-embed.html
  title="문서 미리보기"
  src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  height="520"
%}{% endraw %}
```

## 16) PDF 임베드 파라미터

- `title` (선택): 카드 제목
- `src` (필수): PDF 파일 URL
- `height` (선택): iframe 높이 px (기본 `520`)

## 17) Tabs 블록

```liquid
{% raw %}{% include library/tabs.html
  id="demo-tabs"
  titles="개요|장점|주의사항"
  contents="개요 내용||장점 내용||주의사항 내용"
%}{% endraw %}
```

## 18) Accordion 블록

```liquid
{% raw %}{% include library/accordion.html
  title="FAQ"
  items="질문1|답변1||질문2|답변2"
%}{% endraw %}
```

## 19) Timeline 블록

```liquid
{% raw %}{% include library/timeline.html
  title="업데이트 타임라인"
  items="2026.02|초안|구조 설계||2026.03|개선|세부 기능 추가"
%}{% endraw %}
```

## 20) Masonry 갤러리

```liquid
{% raw %}{% include library/gallery-masonry.html
  title="Gallery"
  images="https://images.unsplash.com/...|https://images.unsplash.com/..."
%}{% endraw %}
```

## 21) TOC Scrollspy

```liquid
{% raw %}{% include library/toc-scrollspy.html
  title="On this page"
  target=".page-content"
%}{% endraw %}
```

## 22) Mermaid 다이어그램

```liquid
{% raw %}{% capture chart %}
flowchart LR
  A[Draft] --> B[Review]
  B --> C[Publish]
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Workflow"
  chart=chart
%}{% endraw %}
```

## 23) Audio Player

```liquid
{% raw %}{% include library/audio-player.html
  title="Sample Audio"
  src="https://file-examples.com/storage/fe86f7f4349f4fd23f4f2f1/2017/11/file_example_MP3_700KB.mp3"
%}{% endraw %}
```

## 24) Citation / Footnote

```liquid
본문 인용{% raw %}{% include library/citation-ref.html id="1" %}{% endraw %}

{% raw %}{% include library/footnotes-list.html
  title="References"
  items="1|Vaswani et al., Attention Is All You Need (2017)"
%}{% endraw %}
```
