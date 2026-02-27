---
layout: post
title: "5. 유지보수"
date: 2026-02-26 13:30:00 +0900
categories: ["Blog update"]
tags: ["blog update"]
image: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80
---

이번 업데이트에서는 **필요할 때만 캐시를 무효화**할 수 있는 유지보수 기능을 추가했다.

## 기능

`_config.yml`에 `assets_version` 값을 두고, 템플릿의 CSS/JS 링크에 `?v={{ site.assets_version }}`를 붙이는 방식이다.  
값을 바꾸지 않으면 기존 캐시를 유지하고, 값만 올리면 브라우저가 새 파일로 인식해 다시 받아온다.

## 넣는 이유

- 매번 강제 새로고침 없이도 배포 반영 문제를 줄일 수 있다.
- 항상 캐시를 깨지 않고, **진짜 변경이 필요할 때만** 무효화할 수 있다.
- 운영 중 성능(캐시 효율)과 최신 반영 안정성을 같이 가져갈 수 있다.

## 쉬운 예시

1. 현재 값이 `assets_version: "1"` 이라고 가정한다.
2. CSS/JS를 수정해서 배포했는데 일부 사용자에게 옛 화면이 보인다.
3. `_config.yml`에서 값을 `"2"`로 바꾼 뒤 다시 배포한다.
4. 브라우저가 `home-mag.css?v=2`, `site-search.js?v=2`를 새 파일로 받아와 최신 화면이 반영된다.

이제 유지보수 단계에서 필요한 순간에만 안전하게 캐시 무효화를 실행할 수 있다.
