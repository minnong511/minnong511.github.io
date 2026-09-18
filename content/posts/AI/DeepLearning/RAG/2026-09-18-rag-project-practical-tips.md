---
title: "실전! RAG 프로젝트 - 핵심 10개"
description: "RAG 프로젝트의 핵심 10가지 요약과 문서 전처리부터 검색, 생성, 평가까지의 실전 팁"
date: "2026-09-18T00:00:00+09:00"
categories: ["AI", "DeepLearning", "RAG"]
tags: ["RAG", "Chunking", "Embedding", "Retrieval", "Reranking", "Evaluation"]
legacyPath: "/deeplearning/rag/2026/09/18/rag-project-practical-tips/"
---

# 실전! RAG 프로젝트 - 핵심 10개

> RAG 성능 개선은 LLM 하나를 바꾸는 문제가 아님 -> Parsing -> Chunking -> Embedding -> Retrieval -> Reranking -> Generation -> Evaluation 전체 파이프라인을 단계별로 측정하고 개선

평가 지표가 정말 중요하다.

-> 도메인에 맞는 찰떡같은 스탠다드가 있는지 항상 고려해야 한다.

## 요약

1. PDF 넣자마자 Embedding하지 말고 파싱 품질부터 검사
2. Chunking은 단순 Baseline부터 시작하고 평가 후 고도화
3. Metadata는 page, section, document_id 정도는 반드시 저장
4. 표, 법률, 복잡 문서는 별도 Parsing 전략 사용
5. Embedding 모델은 Leaderboard가 아니라 내 데이터로 평가
6. BM25 Baseline을 만들고 Dense, Hybrid와 비교
7. Retriever → Reranker의 Two-stage 구조 고려
8. Top-K를 크게 하는 대신 Rerank, Compression을 고려
9. Retrieval과 Generation 평가를 분리
10. 질문 ↔ 정답 Chunk Ground Truth Dataset을 먼저 구축

# RAG 프로젝트 실전 TIP 모음

## 1. 문서 전처리부터 품질을 의심

- RAG 성능 문제는 모델보다 문서 파싱과 전처리에서 시작되는 경우가 많음

문서를 받았을 때 확인해야 할 것들

| 체크 항목       | 확인할 내용                          |
| --------------- | ------------------------------------ |
| 텍스트 추출     | 빈 페이지, 깨진 문자 없는지          |
| Header / Footer | 반복적으로 검색 결과에 섞이지 않는지 |
| 줄바꿈          | 문장이 이상하게 끊기지 않는지        |
| 하이픈          | 줄바꿈 때문에 단어가 분리되지 않는지 |
| 표 / 차트       | 본문 노이즈로 섞이지 않는지          |
| 다단 문서       | 읽는 순서가 제대로 복원되는지        |

> 파싱 후 빈 텍스트, 깨진 문자, 추출 실패 비율을 반드시 검증해야 한다.

```text
PDF 넣음
→ 바로 Vector DB 저장 X

PDF
→ Parsing
→ Parsing 품질 검사
→ Cleaning
→ Chunking
→ Embedding
```

## 2. Chunking은 처음부터 복잡하게 하지 말 것

> 일단 페이지 단위로 시작하고 결과를 보고 Chunking 전략을 바꿔라.

특히 확인해야 할 것은

```text
문장이 페이지 경계에서 잘리는가?
표가 두 페이지에 걸쳐 있는가?
핵심 키워드가 Chunk 경계에서 분리되는가?
```

그리고 Heading 기반으로 자른다면 상위 섹션 경로를 Metadata에 같이 저장하는 게 좋다

```text
Baseline
Page Chunking

↓

성능 측정

↓

Recursive
Semantic
Hierarchical
등 비교
```

## 3. Chunk Overlap은 무조건 크게 하지 마라

Overlap은 문맥 단절을 막아주지만, 너무 크게 하면

```text
중복 저장 증가
중복 검색 증가
Vector DB 크기 증가
LLM에 비슷한 내용 반복 입력
```

일반적으로 **Chunk Size의 약 10~20% 수준**을 하나의 기준으로 제시

베이스라인으로는

```text
chunk_size = 1000
chunk_overlap = 100~200
```

이 정도로 잡으면 된다.

## 4. 의미 보존이 중요하면 "Chunking -> Tokenizer" 방식 고려

```text
Tokenizer → Chunking
```

모델 입력 크기 중심

```text
Chunking → Tokenizer
```

문장, 문단 같은 **의미 단위 보존 중심**

RAG나 문서 검색에서는 후자가 의미 구조를 유지하는 데 유리할 수 있다고 설명

프로젝트에서는

> 무조건 512 token씩 자르기보다, 문단이나 섹션 기준으로 먼저 나누고 token limit을 체크하는 방식

이 실용적

## 5. Metadata는 나중에 넣지 말고 처음부터 설계해라

교재에서 제안하는 Metadata 예시는 꽤 실전적

```text
chunk_id
document_id
source
file_name
title
page
section
section_title
updated_at
access_tag
document_type
```

프로젝트에서 최소한 이 정도는 돼야 한다.

```json
{
  "document_id": "...",
  "chunk_id": "...",
  "file_name": "...",
  "page": 12,
  "section": "3.2",
  "updated_at": "2026-09-18"
}
```

왜냐하면 나중에

```text
특정 문서만 검색
특정 날짜 이후 문서 검색
특정 부서 문서만 검색
답변 출처 표시
```

와 같은 것을 표시하려면 메타데이터가 필요하다.

## 6. 표는 일반 문장처럼 처리하면 망가질 수 있다.

```text
행/열 관계 붕괴
병합 셀 깨짐
읽기 순서 오류
```

추천 전략은 문서 형태에 따라 다르다.

| 표 종류        | 접근                   |
| -------------- | ---------------------- |
| 일반 PDF 표    | PdfPlumber             |
| 스캔 표        | OCR + 좌표 기반 재구성 |
| 복잡한 중첩 표 | VLM + JSON 구조화      |

## 7. 법률, 규정, 계약 문서는 일반 Chunking 피하기

> 문서의 유형을 잘 파악해서 어떤 Chunking 전략을 채택할지가 중요함.

이런 문서는

```text
제1조
 └ ①항
    └ 1호
       └ 가목
```

처럼 계층이 중요, 심지어는 다른 조항을 참조하기도 함

```text
"제15조제1항에 따라"
```

그래서 설계할 때

```text
상위 조항 경로 Metadata 저장
참조 대상 조항 연결
단서/예외 함께 유지
개정 시점 관리
```

이거를 잘 고려해야 한다.

## 8. Embedding 모델은 Leaderboard 1등을 쓰는 게 항상 상책은 아님

Embedding 선택 시 고려해야 할 것은

```text
한국어 비중
도메인 전문성
문서 길이
Embedding Dimension
비용
```

**반드시 실제 프로젝트 데이터로 테스트한 뒤 선택**하라고 강조

```text
MTEB 1등
≠ 내 프로젝트에서 1등
```

특히 한국어 문서라면

```text
한국어 검색 성능
전문용어
약어
제품명
공정명
```

## 9. Embedding 모델 교체 비용을 미리 생각할 것

> Embedding 모델은 가볍게 고르는 설정값이 아니라 아키텍처 결정

Embedding 모델을 바꾸면 기존 Vector가 호환되지 않을 수 있다.

그러면:

```text
모든 문서
↓
다시 Embedding
↓
Vector DB 다시 구축
```

Embedding 모델 선택이 전체 Index 구조와 운영 비용에 영향을 미치고, 모델 교체 시 전체 재임베딩 비용이 발생할 수 있다.

## 10. Vector Index는 정확도만 보고 선택하지 마라

> Recall, Latency, Memory 세 가지를 동시에 최적화할 수 없다.

| Index | 특징                                    |
| ----- | --------------------------------------- |
| Flat  | 정확하지만 느림                         |
| IVF   | 검색 공간 줄임                          |
| HNSW  | 메모리를 많이 쓰지만 빠르고 Recall 높음 |
| PQ    | 정확도를 희생하고 메모리 절약           |

프로젝트에서는

```text
PoC / 작은 데이터
→ Flat, FAISS

실시간 서비스
→ HNSW 검토

메모리 제한
→ PQ 검토
```

목적에 맞춰서 선택해야 한다.

## 11. Vector DB도 "무엇이 제일 좋은가?"로 고르지 말 것

> 최고의 Vector DB가 있는 게 아니라, 목적에 맞는 DB를 고르는 것

| 상황               | 후보          |
| ------------------ | ------------- |
| 소규모 프로젝트    | Chroma, FAISS |
| 대규모             | Milvus        |
| 실시간 / 조건 검색 | Qdrant        |
| Managed Cloud      | Pinecone      |

미니 프로젝트라면 굳이 거대한 Vector DB를 쓸 필요는 없다.

## 12. BM25를 무시하지 말 것

Embedding 검색이 최신이라도 BM25는 여전히 쓸 만함 (구관이 명관)

```text
제품명
모델명
전문용어
고유명사
코드
에러 메시지
```

와 같이 정확한 문자열 검색에서는 여전히 BM25가 쓸 만함.

그래서 일단은 프로젝트 관리에서는

> BM25부터 Baseline을 만들고 mismatch가 크면 SPLADE 등으로 확장

이렇게 가라

## 13. Dense 하나만 쓰지 말고 Hybrid Search를 테스트할 것

```text
Sparse
+
Dense
↓
Hybrid Retrieval
```

기업 문서에서는

```text
Dense
→ 의미 검색 잘함

BM25
→ 고유명사, 코드 검색 잘함
```

이렇게 가면 서로 보완해줄 수 있어서 좋다.

## 14. Retriever와 Reranker를 분리할 것

실무 RAG에서는

```text
전체 문서
↓
Retriever
빠르게 Top-20
↓
Reranker
정밀하게 Top-5
↓
LLM
```

같은 Two-stage 구조가 유용

Retriever는 속도, Reranker는 정확도를 담당

> 처음부터 비싼 모델로 모든 문서를 비교하지 말고, 먼저 좁히고 나중에 정밀 평가

## 15. 검색 결과를 많이 넣는다고 좋은 게 아니다.

Naïve RAG의 대표 문제

검색 결과를 너무 많이 넣으면:

```text
Noise 증가
중복 증가
중요 정보가 묻힘
Hallucination 증가 가능
```

모든 Chunk를 LLM에 넣는 것이 항상 유익한 것은 아니다.

따라서

```text
Top-K 크게
= 무조건 좋음 X

Retriever
→ Reranker
→ Context Compression
```

와 같은 전략이 필요할 수 있다.

## 16. 검색 전과 후를 따로 개선해라

Advanced RAG에서 실무적인 프레임

```text
Indexing

↓

Pre-Retrieval
Query Rewrite
Query Expansion
Query Routing

↓

Retrieval
Hybrid Search
Multi-hop

↓

Post-Retrieval
Reranker
Reorder
Compression
```

문제가 생기면 그냥 "RAG 성능이 안 좋다"고 하지 말고

```text
질문 이해 문제?
검색 문제?
Reranking 문제?
Context 문제?
생성 문제?
```

로 분해해서 보자

## 17. Context Compression을 적극 고려

검색된 문서를 그대로 전부 넣지 말고

```text
검색 결과
↓
요약
핵심 문장 추출
중복 제거
↓
LLM
```

Post-Retrieval 단계의 Compressor가 Context Window 제한과 중복 문제를 줄이는 데 활용될 수 있다.

## 18. 요약 기반 검색도 하나의 선택지

긴 문서를 바로 Embedding하는 대신:

```text
원문
↓
요약 생성
↓
요약을 Vector DB에 저장
↓
요약 기반 검색
↓
필요하면 원문 반환
```

긴 문서에서 Map-Reduce, Refine 등의 요약 방식을 사용하고, 원문과 요약을 함께 저장하거나 요약을 별도 인덱싱하는 전략

## 19. RAG 평가는 Retrieval과 Generation을 반드시 분리

프로젝트 보고서에서 특히 중요

```text
답변이 틀림
```

이렇게 보고서 쓰면 걍 맞아야 함 ㅇㅇ

먼저 2개로 나눠야 함 Retrieval and Generation

```text
정답 문서를 못 찾았나?
→ Retrieval 문제

정답 문서는 찾았는데 답을 틀렸나?
→ Generation 문제
```

Retrieval에는 Hit Rate@K, MRR을 사용하고 Generation은 LLM-as-a-Judge 등으로 평가

## 20. Ground Truth Dataset을 만들어라

Retrieval 평가를 하려면:

```text
질문
+
정답 Chunk ID
```

가 필요

```text
정답 Chunk
↓
LLM에게 질문 생성
↓
(질문, 정답 Chunk ID)
```

쌍을 Synthetic Ground Truth로 만드는 방식을 제안

이렇게 미리 만들어두면

```text
Chunk Size 비교
Retriever 비교
Embedding 비교
Hybrid 비교
Reranker 비교
```

해서 평가를 객관적으로 할 수 있다.
