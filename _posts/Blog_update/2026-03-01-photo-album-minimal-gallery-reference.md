---
layout: post
title: "6. 포토앨범 제작"
date: 2026-03-01 02:12:29 +0900
categories: ["Blog update"]
tags: ["blog update"]
image: https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1400&q=80
---

이번 업데이트에서는 포토 앨범 사이트를 새롭게 제작했다.

디자인 레퍼런스로는 아래 링크를 참고했고,
해당 레퍼런스의 미니멀한 정보 구조와 이미지 중심 흐름을 바탕으로
현재 블로그의 포토 앨범 페이지를 구성했다.

{% include library/link-card.html
  url="https://minimal.gallery/"
  title="minimal.gallery"
  desc="포토 앨범 페이지 디자인 레퍼런스"
  host="minimal.gallery"
  new_tab="true"
%}

주요 반영 내용은 아래와 같다.

- 포토 앨범 목록과 상세 흐름 분리
- 헤더 상태(축소/확장)에 따른 타이틀 및 날짜 표시 개선
- 앨범 클릭 시 상세 페이지 전환 흐름 정리
- 모바일 환경에서 텍스트/아이콘 비율 및 가독성 보정

다음 업데이트에서는 서브 포스트 정보 밀도를 더 높이고,
앨범 상세 화면의 탐색 경험을 추가로 다듬을 예정이다.
