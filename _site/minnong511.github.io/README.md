# Jekyll Blog 운영 가이드

이 문서는 현재 프로젝트 구조를 Jekyll 표준에 맞춰 정리한 뒤, 빠르게 글을 발행하기 위한 실전 가이드입니다.

## 1. 지금 구조에서 고친 핵심 포인트

- `_layouts/default.html`에 `{{ content }}`를 넣어 페이지/포스트 내용이 정상 렌더링되도록 수정
- 홈(`index.md`)을 `home` 레이아웃으로 분리해 포스트 목록이 자동으로 보이도록 구성
- 헤더 링크를 Jekyll `relative_url` 방식으로 통일해서 경로 깨짐 방지
- `photostream` 페이지를 `assets/photo_lib/` 자동 스캔 방식으로 변경
- `_config.yml`의 `url`을 실제 도메인으로 수정 (`https://minnong511.github.io`)
- `.gitignore` 추가로 `_site` 등 빌드 산출물 혼선 방지

## 2. 폴더 역할 정리

- `_posts/`: 블로그 글 파일(필수, 파일명 규칙 엄수)
- `_layouts/`: 페이지 골격 템플릿
- `_includes/`: 공통 조각(헤더 등)
- `assets/`: CSS/이미지 정적 파일
- `assets/photo_lib/`: 포토스트림용 이미지 폴더
- `_site/`: 빌드 결과물(수정하지 않음)

## 3. 새 글 작성 방법 (가장 중요)

### 파일 위치

`_posts/` 아래에 새 Markdown 파일을 만듭니다.

### 파일명 규칙

반드시 아래 형식:

`YYYY-MM-DD-title.md`

예시:

`_posts/2026-02-11-my-first-post.md`

### Front Matter 템플릿

아래를 그대로 시작점으로 복붙해서 쓰면 됩니다.

```md
---
layout: default
title: "글 제목"
date: 2026-02-11 10:00:00 +0900
categories: [Computer_Science]
---

글 본문을 여기에 작성합니다.
```

### 카테고리 규칙

- `categories` 값은 배열로 유지
- 예: `[Deep_Learning]`, `[Paper_Review]`
- 폴더를 나눠도 되지만, 초반에는 `_posts/` 루트에 파일을 두고 `categories`로 분류하는 방식이 가장 단순합니다.

## 4. 로컬 실행 / 확인

프로젝트 루트(`minnong511.github.io`)에서:

```bash
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://127.0.0.1:4000` 확인.

## 5. 포토스트림 업로드 방법

이미지를 `assets/photo_lib/`에 넣으면 `/photostream/` 페이지에 자동 표시됩니다.

지원 예시: `.jpg`, `.jpeg`, `.png`, `.webp`

## 6. 배포 절차 (GitHub Pages)

```bash
git add .
git commit -m "Add new post"
git push origin main
```

몇 분 내로 `https://minnong511.github.io`에 반영됩니다.

## 7. 자주 나는 오류와 체크리스트

- 글이 안 보임:
  - 파일명이 `YYYY-MM-DD-title.md` 형식인지 확인
  - Front Matter의 `---` 시작/끝이 정확한지 확인
- 링크가 깨짐:
  - 템플릿에서 절대경로 하드코딩 대신 `relative_url` 사용
- 포토 페이지가 비어 있음:
  - 이미지가 `assets/photo_lib/` 하위에 있는지 확인
- 로컬 빌드 실패:
  - `bundle install` 재실행
  - Ruby/Gem 버전 충돌 시 `bundle update github-pages` 시도

---

운영 팁:

- 먼저 글 1개를 템플릿으로 만든 뒤 복제해서 쓰면 실수가 크게 줄어듭니다.
- 포스트 초안은 제목/날짜/카테고리만 먼저 적고, 본문은 나중에 채워도 됩니다.
