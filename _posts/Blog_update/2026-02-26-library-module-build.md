---
layout: post
title: "3.라이브러리 제작"
date: 2026-02-26 11:30:00 +0900
categories: ["Blog update"]
tags: ["blog update", library, jekyll]
image: https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80
---

오늘은 포스트 안에서 반복 사용하던 UI를 라이브러리 형태로 분리했다.  
컴포넌트 단위로 정리해두니 이후 글 작성 속도와 일관성이 확실히 좋아졌다.

이번에 만든 라이브러리 모듈은 아래처럼 정리했다.

## 1) link-card

노션 스타일 링크 블록.

{% include library/link-card.html
  url="https://github.com/minnong511/minnong511.github.io"
  title="블로그 저장소"
  desc="현재 블로그 소스 코드 저장소"
  host="github.com"
  new_tab="true"
%}

## 2) code-snippet

다크 테마 + 복사 버튼 + 파이썬 하이라이트 지원.

{% capture linear_regression_snippet %}
import torch
import torch.nn as nn
import torch.optim as optim

x = torch.tensor([[1.0], [2.0], [3.0], [4.0]])
y = torch.tensor([[3.0], [5.0], [7.0], [9.0]])  # y = 2x + 1

model = nn.Linear(1, 1)
criterion = nn.MSELoss()
optimizer = optim.SGD(model.parameters(), lr=0.01)

for epoch in range(300):
    pred = model(x)
    loss = criterion(pred, y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

print("weight:", model.weight.item(), "bias:", model.bias.item())
{% endcapture %}

{% include library/code-snippet.html
  title="선형회귀 코드 예시"
  lang="python"
  code=linear_regression_snippet
%}

## 3) latex-block

MathJax 기반 수식 카드 렌더.

{% capture linear_formula_example %}
\hat{y} = wx + b,\quad
\mathcal{L}(w,b)=\frac{1}{N}\sum_{i=1}^{N}(y_i-(wx_i+b))^2
{% endcapture %}

{% include library/latex-block.html
  title="선형회귀 예시 수식"
  formula=linear_formula_example
%}

## 4) google-map

장소 검색 기반 지도 임베드.

{% include library/google-map.html
  title="명동교자 명동점"
  query="명동교자 명동점 서울 중구 명동10길 29"
  zoom="17"
  height="320"
%}

## 5) youtube-embed

영상 ID/검색어 기반 유튜브 임베드.

{% include library/youtube-embed.html
  title="명동교자 관련 영상"
  video_id="8Qn0RoQTfaQ"
  height="320"
%}

## 6) callout

{% include library/callout.html
  type="tip"
  title="Tip"
  content="모듈화를 해두면 포스트를 쓸 때 포맷 고민 없이 콘텐츠 작성에 집중할 수 있다."
%}

## 7) table

{% include library/table-card.html
  caption="오늘 추가한 모듈 상태"
  headers="모듈|용도|상태"
  rows="callout|중요 문구 강조|완료||table|데이터 비교/정리|완료||image compare|전후 이미지 비교|완료"
%}

## 8) image compare

{% include library/image-compare.html
  title="Photo Tone Compare"
  before="https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1400&q=80"
  after="https://images.unsplash.com/photo-1505765050516-f72dcac9c60f?auto=format&fit=crop&w=1400&q=80"
  before_label="Before"
  after_label="After"
  start="45"
%}

## 9) pdf-embed

PDF 문서를 포스트 안에서 바로 미리보기로 띄울 수 있다.

{% include library/pdf-embed.html
  title="Attention Is All You Need (PDF)"
  src="https://arxiv.org/pdf/1706.03762"
  height="520"
%}

## 10) tabs

콘텐츠를 탭으로 나눠서 읽을 수 있다.

{% include library/tabs.html
  id="library-demo-tabs"
  titles="개요|장점|주의사항"
  contents="라이브러리 컴포넌트를 주제별로 분리해 재사용성을 높였다.||포스트 작성 시간이 줄고, UI 일관성이 유지된다.||너무 많은 컴포넌트를 한 글에 넣으면 가독성이 떨어질 수 있다."
%}

## 11) accordion

FAQ나 접기형 설명에 적합하다.

{% include library/accordion.html
  title="Library FAQ"
  items="어디에 정의되어 있나?|_includes/library 폴더에서 관리한다.||스타일은 어디서 바꾸나?|assets/css/home-mag.css에서 컴포넌트 클래스를 수정한다."
%}

## 12) timeline

업데이트 이력을 시간 순으로 기록하기 좋다.

{% include library/timeline.html
  title="모듈 제작 흐름"
  items="2026.02|기초 모듈|link-card, code-snippet, latex-block 제작||2026.02|임베드 확장|google-map, youtube, pdf 모듈 추가||2026.02|문서화|README 사용법 정리 완료"
%}

## 13) gallery-masonry

이미지 비율이 제각각일 때도 자연스럽게 쌓이는 갤러리.

{% include library/gallery-masonry.html
  title="Masonry Demo"
  images="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80|https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80|https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80|https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80|https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=900&q=80"
%}

## 14) toc-scrollspy

본문의 `h2/h3`를 기준으로 인라인 목차를 만들고, 현재 섹션을 하이라이트한다.

{% include library/toc-scrollspy.html
  title="Inline TOC"
  target=".page-content"
%}

## 15) mermaid-diagram

텍스트 기반으로 다이어그램을 삽입할 수 있다.

{% capture mermaid_chart %}
flowchart LR
  A[Idea] --> B[Design]
  B --> C[Build]
  C --> D[Publish]
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Blog Workflow"
  chart=mermaid_chart
%}

## 16) audio-player

오디오 링크를 본문에서 바로 재생할 수 있다.

{% include library/audio-player.html
  title="Audio Demo"
  src="https://file-examples.com/storage/fe86f7f4349f4fd23f4f2f1/2017/11/file_example_MP3_700KB.mp3"
%}

## 17) citation / footnote

본문 인용 표기{% include library/citation-ref.html id="1" %}와 각주 목록을 연결한다.

{% include library/footnotes-list.html
  title="References"
  items="1|Vaswani et al., Attention Is All You Need (2017), arXiv:1706.03762."
%}
