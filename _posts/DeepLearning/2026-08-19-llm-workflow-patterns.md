---
layout: post
title: "현대 LLM 워크플로의 패턴"
date: 2026-08-19 00:00:00 +0900
categories: [Deep_Learning, LLM]
tags: [Deep Learning, LLM, Workflow, Agent]
description: "Routing, Chaining, Parallelization, Evaluator-Optimizer, Orchestrator-Workers와 Agent Loop의 차이를 정리한다."
summary: "LLM Workflow의 주요 패턴과 자율 Agent를 통제하는 방법을 정리한다."
---

# 현대 LLM 워크플로의 패턴

> LLM 서비스는 도대체 어떻게 작동하는 걸까? 궁금해서 참을 수가 없단 말이지!

LLM 애플리케이션을 만들 때는 요청을 한 번 받고 바로 답을 내는 경우도 있지만, 실제로는 입력을 분류하고, 작업을 나누고, 결과를 평가하는 흐름으로 구성하는 경우가 많다.

## 자주 나오는 Workflow 패턴

| 패턴 | 설명 |
|---|---|
| Routing | 입력을 분류해서 적절한 처리 경로 하나를 선택한다. |
| Parallelization | 서로 의존하지 않는 AI 작업을 동시에 실행한다. |
| Evaluator-Optimizer | 결과를 평가하고 피드백을 기반으로 반복 개선한다. |
| Orchestrator-Workers | 큰 작업을 여러 하위 작업으로 분해하고 각각 처리한 후 합친다. |
| Chaining | 앞 단계의 출력을 다음 단계의 입력으로 연결한다. |

## 개념적으로 이런 구조

```text
사용자 요청
  ↓
Routing
  ↓
계획 / 작업 분해
  ↓
┌───────────────┐
│ Worker A      │
│ Worker B      │
│ Worker C      │
└───────────────┘
  ↓
결과 통합
  ↓
Evaluator
  ↓
필요하면 재시도
  ↓
최종 응답
```

이건 지금도 LLM 애플리케이션에서 아주 전형적인 구조다.

다만, 실제 현대 시스템에서는 여기에 보통 다음 요소가 추가된다.

```text
LLM Workflow
  + Tool Calling
  + RAG
  + Memory / State
  + Retry / Timeout
  + Observability
  + Guardrails
  + Model Selection
  + Caching
```

현대적인 구조에서는 Spring Boot에서 했던 기능에 더해 다음과 같은 Tool을 사용할 수 있다.

- 웹 검색
- DB 조회
- 사내 문서 검색
- Python 실행
- API 호출
- 파일 읽기

## 요즘은 이런 것도 만들 수 있다

```text
사용자
  ↓
Router
  ↓
Planner
  ↓
Workers
  ├─ Search Agent
  ├─ SQL Agent
  ├─ Code Agent
  └─ Document Agent
  ↓
Aggregator
  ↓
Evaluator
  ↓
Final Answer
```

이런 형태가 된다.

## 정해진 로직으로 처리하는 Workflow

다만 나는 로직을 정해놓았는데,

```text
분류
  → switch
  → 특정 처리
```

또는

```text
계획
  → worker 실행
  → 통합
```

이런 방식으로 처리한다면 `deterministic workflow` 또는 `LLM workflow`라고 생각하면 된다.

## LLM이 다음 행동을 직접 선택하는 Agent

다만 모던한 Agentic 시스템은 조금 다르게 동작한다.

```text
LLM: "검색이 필요하겠군"
  ↓
검색 Tool 호출
  ↓
LLM: "정보가 부족하군"
  ↓
다른 Tool 호출
  ↓
LLM: "이제 답할 수 있겠다"
```

이렇게 LLM이 알아서 다음 행동을 스스로 선택한다.

요즘은 이런 식으로 가는 중이다.

```text
고정 Workflow                                      자율 Agent
──────────────────────────────────────────────────────→
Chaining
Routing
Parallel
Evaluator
Orchestrator
                      Tool Calling
                              Planner
                                      Agent Loop
```

`WorkflowPatterns.java`에서 생각해볼 수 있는 위치는 다음과 같다.

```text
Chaining
Routing
Parallel
Evaluator
Orchestrator
        ↑
     현재 위치
```

자율 Agent를 만드는 것보다 가능하면 Workflow로 통제하고, 필요한 부분만 Agent화하는 방식이 안정성, 비용, 디버깅 측면에서 훨씬 유리한 경우가 있다.

> 항상 자유가 좋은 결과를 내주는 것은 아니다.

가끔은 행동에 제약을 걸어서 예측 가능한 결과를 낼 수 있어야 한다.

예를 들어 다음처럼 반복 횟수를 Java 코드에서 제한하는 것은 상당히 프로덕션 지향적인 사고다.

```java
for (int round = 1; round <= maxRounds; round++) {
    // 작업 실행과 평가
}
```

LLM에게 그냥 "좋아질 때까지 반복해"라고 하는 것은 결과를 예측하기도 어렵고, 무한 루프 문제가 생길 수도 있다.

## 학습 순서

1. Tool Calling
2. RAG
3. Memory / State
4. Agent Loop
5. Observability
6. Guardrails
7. Model Routing
