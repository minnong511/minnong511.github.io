---
layout: post
title: "sLLM 핵심 기술과 전체 구조"
description: "도메인 특화 sLLM을 구성하는 Fine-Tuning, RAG, Context 설계와 추론 최적화 기술을 정리한다."
date: "2026-08-28 17:45:21 +0900"
categories: ["sLLM"]
tags: ["sLLM", "Fine-Tuning", "RAG", "Inference Optimization"]
legacyPath: "/sllm/2026/08/28/core-technologies/"
---

# 결론

> sLLM은 단순히 작은 언어 모델이 아니라, 도메인에 맞게 학습된 모델, 필요한 근거를 적절하게 제공하는 맥락 파이프라인, 제한된 자원에서 빠르게 실행되는 추론 시스템을 함께 설계한 AI

# 1. 전체 개념 지도

교재는 sLLM의 성능을 세 축으로 나눈다.

| 축 | 핵심 질문 | 대표 기술 | 바뀌는 대상 |
|---|---|---|---|
| 모델 성능 향상 | 모델 자체의 정확성을 어떻게 높이는가? | Fine-Tuning, PEFT, LoRA, QLoRA, DoRA | 모델 파라미터 또는 어댑터 |
| Context & Reasoning | 현재 질문에 필요한 맥락을 어떻게 제공할 것인가? | RAG, Prompt Compression, Long-Context, Self-refine | 런타임 입력과 추론 과정 |
| Inference Optimization | 같은 모델을 어떻게 더 빠르고 싸게 실행할 것인가? | Quantization, KV Cache, MoE, Speculative Decoding | 실행 정밀도, 메모리, 연산 구조 |

세 축은 경쟁 관계가 아니라 결합 관계이다.

```text
사용자 질문
  -> 임베딩
  -> 벡터 DB에서 근거 검색, RAG
  -> 검색 문서에서 핵심만 추림, Context Compression
  -> 도메인에 맞게 학습된 모델이 답변, LoRA / QLoRA
  -> 적은 메모리와 빠른 속도로 실행, Quantization / KV Cache
  -> API 응답
```

# 2. 핵심 용어 정의

sLLM은 Small Large Language Model의 약칭으로, 비교적 작은 파라미터 규모의 언어 모델을 뜻함

다만 강의에서는 Domain-specific Vertical AI로 정의하는 듯하다.

그래서 아래와 같은 부분에 특화된 것으로 볼 수 있다.

1. 사내 또는 특정 산업의 전문 지식 반영
2. 낮은 추론 비용과 낮은 지연 시간
3. 내부망 또는 온디바이스 실행
4. 데이터 프라이버시 보장
5. 조직의 응답 형식과 안전 정책 반영

따라서 기본 모델에 Fine-Tuning, RAG, 최적화가 결합되어 sLLM이 된다.

## LLM Serving Pipeline

사용자 요청이 모델 응답으로 바뀌는 전체 처리 흐름

```text
요청 수신
  -> 전처리
  -> 모델 추론
  -> 후처리
  -> 응답 반환
```

모델 응답 방식에 따라 파이프라인을 구분할 수 있음

- 외부 파이프라인: GPT나 Claude 같은 외부 서비스를 호출
- 내부 파이프라인: 사내 인프라의 sLLM과 내부 문서, DB를 직접 연결

## MLM과 CLM

- MLM, Masked Language Model: 문장 일부를 가리고 앞뒤 문맥을 사용해 빈칸을 예측, BERT가 대표적
- CLM, Causal Language Model: 지금까지 나온 토큰을 바탕으로 다음 토큰을 순차 생성, GPT, Llama, Qwen이 대표적

생성형 Fine-Tuning이 CLM 중심인 이유는 지시 -> 응답 학습 구조가 다음 토큰 예측과 자연스럽게 연결되기 때문이다.

## Fine-Tuning

사전학습된 모델을 별도의 데이터로 추가 학습해 특정 업무, 도메인, 응답 방식에 적응시키는 과정

## SFT, Supervised Fine-Tuning

질문과 모범 답변을 사용해 지도학습하는 Fine-Tuning.
교재에서는 두 가지 데이터 구성을 다룬다.

- Instruction SFT: 사람이 작성하거나 검수한 질문-답변 세트를 학습
- Context-based QA SFT: 원천 문서를 섹션으로 나누고, 문서에 근거한 질문과 답변을 만들어 학습

전자는 응답 스타일과 지시 수행에 강하고, 후자는 문서 근거형 답변과 환각 감소에 초점을 둔다.

## PEFT

Parameter-Efficient Fine-Tuning의 약자, 전체 파라미터를 다시 학습하지 않고 소수의 추가 파라미터만 학습하는 방법

장점은 다음과 같음

- 학습 메모리 절감
- 학습 시간 단축
- 작은 어댑터만 별도로 저장 가능
- 하나의 Base 모델에 여러 업무용 어댑터 연결 가능

PEFT는 특정 알고리즘 하나가 아니라 LoRA, Adapter, Prefix Tuning, Prompt Tuning 등을 포함하는 상위 개념

## LoRA

Low-Rank Adaptation

기존 모델 가중치는 고정하고, Attention 투영층 등에 작은 저랭크 행렬을 추가하여 그 행렬만 학습

```text
기존 가중치 W는 고정
  +
작은 변화량 ΔW = A × B만 학습
```

주요 설정값:

- r: 저랭크 행렬의 크기, 높을수록 표현력과 학습량 증가
- lora_alpha: LoRA 변화량의 영향력 조정
- lora_dropout: 과적합을 줄이기 위한 dropout
- target_modules: LoRA를 적용할 모델 내부 계층

도메인 용어, 응답 형식, 판단 패턴을 학습시키고 싶지만 전체 모델을 다시 학습하기 어려울 때 적합.

## QLoRA

Quantized LoRA

Base 모델을 주로 4비트로 양자화해 메모리에 올리고, 그 위에 LoRA 어댑터를 학습하는 방식

```text
4비트로 압축된 Base 모델, 고정
  +
LoRA Adapter, 학습
```

| 구분 | LoRA | QLoRA |
|---|---|---|
| Base 모델 로딩 | FP16, BF16 등이 일반적 | 4비트가 일반적 |
| 학습 대상 | LoRA 어댑터 | LoRA 어댑터 |
| 메모리 사용 | 낮음 | 더 낮음 |
| 적합 환경 | 일반적인 제한 GPU 환경 | GPU 메모리가 매우 부족한 환경 |
| 주의점 | 설정이 비교적 단순 | 양자화 라이브러리와 CUDA 환경 의존 가능 |

## Prompt Tuning과 Prefix Tuning

- Prompt Tuning: 입력 앞에 학습 가능한 가상 토큰 임베딩을 붙임
- Prefix Tuning: Transformer 각 계층에 학습 가능한 prefix 상태 제공

학습 파라미터 수가 극히 작아 온디바이스와 초경량 적응에 유리하지만, 복잡한 도메인 지식이나 강한 행동 변화에는 LoRA보다 표현력이 제한

## RAG

Retrieval-Augmented Generation의 약자

질문과 관련된 문서를 검색한 뒤, 검색 결과를 모델 입력에 넣어 답변을 생성

```text
문서 수집
  -> 청크 분할
  -> 임베딩 생성
  -> 벡터 DB 저장

사용자 질문
  -> 질문 임베딩
  -> 유사 청크 검색
  -> 검색 결과를 프롬프트에 삽입
  -> 답변 생성
```

모델 파라미터를 바꾸는 기술이 아니라, 실행 시 외부 지식을 찾아 제공하는 기술

## Embedding과 Vector DB

- Embedding: 문장이나 문서의 의미를 나타내는 숫자 벡터로 변환
- Vector DB: 임베딩을 저장하고 질문과 의미적으로 가까운 문서를 검색

## Context Compression

검색되거나 입력된 긴 문서에서 질문에 필요한 핵심 정보만 남기는 기술
RAG가 "관련 문서를 찾는 것"이라면, Context Compression은 "찾은 문서를 짧고 유용하게 정리하는 것"

장점:

- 입력 토큰 감소
- 추론 비용과 지연 시간 감소
- 불필요한 정보로 인한 모델 혼란 감소

위험:

- 압축 과정에서 예외 조건, 숫자, 부정 표현 같은 핵심 정보 유실 가능

따라서 원문 대비 보존율과 답변 정확도를 별도로 검증해야 함.

## Long-Context와 YaRN

Long-Context는 긴 문서를 검색이나 압축 없이 모델 입력에 직접 제공하는 방식

YaRN은 RoPE 위치 임베딩을 조정해 모델이 기존보다 긴 컨텍스트를 처리하도록 확장하는 방법

다만 컨텍스트 한도가 늘었다고 해서 다음이 자동으로 보장되는 것은 아니다.

- 문서 전체를 정확히 기억함
- 중요 정보를 제대로 선택함
- 추론 품질이 그대로 유지됨
- 메모리 사용량과 지연 시간이 작음

따라서 Long-Context는 RAG를 무조건 대체하는 기술이 아니라 별도의 선택지

## Inference Optimization

학습된 모델의 의미적 능력보다 실행 성능을 개선하는 기술

- Quantization: 숫자 정밀도를 낮춰 메모리와 연산량 절감
- KV Cache: 이전 토큰의 Attention Key/Value를 재사용
- PagedAttention: KV Cache를 페이지 단위로 관리해 메모리 단편화 감소
- MQA/GQA: 여러 Query가 Key/Value를 공유해 KV Cache 축소
- Speculative Decoding: 작은 모델이 후보 토큰을 만들고 큰 모델이 한 번에 검증
- MoE: 입력마다 일부 Expert만 활성화하여 선택적으로 연산

# 3. RAG와 Fine-Tuning의 차이

| 기준 | RAG | Fine-Tuning |
|---|---|---|
| 지식 위치 | 외부 문서, 벡터 DB | 모델 파라미터 또는 어댑터 |
| 적용 시점 | 질문을 처리할 때 검색 | 사전에 학습 |
| 최신 정보 반영 | 문서만 교체하면 됨 | 재학습 필요 |
| 주요 목적 | 사실 검색, 근거 제시, 최신성 | 이해 방식, 전문 용어, 행동, 응답 품질 |
| 출처 제시 | 비교적 쉬움 | 파라미터 지식의 출처 추적이 어려움 |
| 주요 위험 | 검색 실패, 잘못된 청크 | 과적합, 기존 능력 저하, 잘못된 지식 내재화 |
| 모델 변경 | 없음 | 있음, PEFT는 어댑터만 변경 |
| 적합한 정보 | 자주 바뀌는 규정과 문서 | 비교적 안정적인 업무 규칙과 응답 방식 |

RAG를 선택해야 하는 경우

- 규정과 상품 정보가 자주 바뀜
- 답변에 출처와 근거가 필요한 경우
- 대량의 문서를 모두 학습시키기 어려운 경우
- 사용자별 접근 권한에 따라 검색 문서를 달리해야 하는 경우

Fine-Tuning을 선택해야 하는 경우

- 전문 용어를 반복적으로 잘못 이해함
- 원하는 답변 구조와 말투를 안정적으로 지키지 못함
- 검색 문서가 있어도 판단 방식이 부족함
- 특정 지시를 일관되게 수행하게 만들고 싶음

일반적으로는 한 가지 방법만 사용하지 않고, Fine-Tuning과 RAG를 결합한다.

- Fine-Tuning: 안정적인 도메인 용어, 판단 규칙, 답변 형식 학습
- RAG: 최신 규정, 개별 문서, 변경 가능한 사실 제공

예를 들어 인사 챗봇이라면,

- "답변은 결론, 적용 규정, 주의사항 순서로 작성한다."라는 방식은 Fine-Tuning
- "올해 연차 규정은 며칠인가?"의 실제 규정 내용은 RAG
- 검색된 규정 중 질문에 필요한 부분만 남기는 것은 Context Compression

# 4. PEFT, LoRA, QLoRA의 관계

```text
Fine-Tuning
├── Full Fine-Tuning
└── PEFT
    ├── LoRA
    ├── QLoRA, 양자화된 Base 모델 + LoRA
    ├── Adapter
    ├── Prefix Tuning
    └── Prompt Tuning
```

PEFT는 큰 분류, LoRA는 그 안의 대표 기법, QLoRA는 LoRA의 학습 메모리를 더 줄이는 구성

## RAG, Context Compression, Long-Context의 관계

세 기술 모두 입력 맥락을 다루지만 전략이 다름

- RAG: 전체 문서 중 관련 부분을 검색
- Context Compression: 선택된 내용을 더 짧게 정리
- Long-Context: 긴 내용을 가능한 한 그대로 입력

실무에서는 RAG -> 압축 -> 생성이 비용과 정확성의 균형이 좋다. 문서가 작거나 전체 구조 자체가 중요하다면 Long-Context가 대안

## QLoRA와 Quantization의 관계

둘 다 저비트 표현을 사용하지만 목적이 다르다.

- QLoRA: Fine-Tuning 과정의 GPU 메모리 절약
- 추론 Quantization: 배포 과정의 메모리, 비용, 지연 시간 절약

따라서 QLoRA는 모델 성능 향상 축에, 일반적인 추론 양자화는 Inference Optimization 축에 놓인다.

# 결론

좋은 모델을 선택하는 것만으로는 충분하지 않다.

플로우를 안정적으로 구축할 필요가 있다.

```text
좋은 학습 데이터
  -> 적합한 PEFT 방식
  -> 정확한 검색
  -> 손실 없는 맥락 압축
  -> 안정적인 생성
  -> 빠른 추론
  -> 서비스 모니터링
```

바뀌는 사실은 RAG에 둔다.
안정적인 행동과 표현 방식은 Fine-Tuning한다.
긴 근거는 질문 중심으로 압축한다.
제한된 자원에서는 LoRA 또는 QLoRA를 사용한다.
배포 단계에서 Quantization과 KV Cache를 최적화한다.
정확도, 근거성, 환각, 지연시간, 비용을 각각 측정한다.
작은 Happy Path로 검증한 뒤 RAG와 Fine-Tuning의 비중을 조절한다.
