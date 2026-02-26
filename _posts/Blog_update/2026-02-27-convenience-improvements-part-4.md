---
layout: post
title: "4. 편의성 개선"
date: 2026-02-26 12:30:00 +0900
categories: ["Blog update"]
tags: ["blog update"]
image: https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1400&q=80
---

이번 업데이트에서는 블로그 사용성을 높이기 위한 편의성 기능을 중심으로 정리했다.

## 1) 댓글 기능 (Giscus)

포스트 하단에 GitHub Discussions 기반 댓글 시스템을 연결했다.  
독자가 별도 회원가입 없이 GitHub 계정으로 바로 의견을 남길 수 있고, 작성자 입장에서도 관리 흐름이 단순해졌다.

## 2) 목차 보기 기능 (PC 우측 하단)

데스크톱 화면에서 우측 하단에 동그란 목차 버튼을 추가했다.  
버튼을 누르면 현재 포스트의 `h2`, `h3`를 기준으로 자동 생성된 목차가 펼쳐지고, 다시 눌러 접을 수 있다.

## 3) 추가 편의성 기능

이번 작업 과정에서 함께 반영한 주요 편의성 기능은 아래와 같다.

- 포스트 공유 영역의 링크 복사 버튼 + `Link copied` 토스트 알림
- 이미지 라이트박스(확대 보기) 기능
- 태그 페이지 인터랙션 개선: 태그 모음집 클릭 필터 + 초기 진입 시 태그만 노출
- 포스트 로딩 시 부드러운 진입 모션(페이드/슬라이드)
- 반복 UI를 빠르게 재사용하기 위한 라이브러리 모듈화
  - `link-card`, `code-snippet`, `latex-block`, `google-map`, `youtube-embed`, `callout`, `table-card`, `image-compare`, `pdf-embed`

다음 단계에서는 검색 정확도 개선과 포스트 작성 자동화 템플릿까지 확장해볼 예정이다.
