---
layout: post
title: "PostgreSQL 인덱스 학습 기록"
date: 2026-07-30 12:00:00 +0900
author: "작성자"
categories: [Database]
tags: [PostgreSQL, Index, TIL]
image: "/assets/images/example.png"
published: true
---

# PostgreSQL 인덱스 학습 기록

오늘은 `EXPLAIN`으로 실행 계획을 확인하고, 쿼리의 조건과 인덱스의 선두 컬럼이 어떻게 연결되는지 정리했다.

> 미리보기에서 지원하는 Markdown 문법을 확인하기 위한 샘플 글입니다.

## 체크리스트

- 실행 계획을 읽을 때는 아래 노드부터 확인한다.
- 예상 행 수와 실제 행 수를 비교한다.
- 이미지와 코드는 저장소에 별도로 추가한다.

```sql
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT * FROM posts WHERE category = 'Database';
```

| 항목 | 예시 |
| --- | --- |
| 파일 위치 | `_posts/YYYY-MM-DD-slug.md` |
| 이미지 위치 | `assets/images/` |
