---
layout: post
title: "도메인 적응 방법"
date: 2026-08-31 00:00:00 +0900
categories: [Deep_Learning, LLM]
tags: [Deep Learning, LLM, Domain Adaptation, Fine-Tuning, RAG]
description: "Prompt Engineering, RAG, SFT, LoRA, Continued Pretraining 등 LLM의 도메인 적응 방법을 정리한다."
summary: "지식, 행동, 선호도, 도구 관점에서 LLM 도메인 적응 방법의 차이를 정리한다."
legacyPath: "/deep_learning/llm/2026/08/31/domain-adaptive/"
---
# 도메인 적응 방법

| 방법 | 바꾸는 것 | 주로 해결하는 문제 | 비용 |
|---|---|---|---:|
| Prompt / Few-shot | 입력 | 답변 형식, 역할, 규칙 | 매우 낮음 |
| RAG | Context | 사내 문서, 최신 지식, 근거 | 낮음~중간 |
| SFT | 모델 가중치 | 특정 문제에 답하는 방식 | 중간~높음 |
| LoRA / PEFT | 일부 가중치 | SFT를 싸게 수행 | 낮음~중간 |
| Continued Pretraining | 모델의 기본 지식 | 전문용어, 도메인 언어 자체 | 높음 |
| DPO / RLHF | 답변 선호도 | 어떤 답을 더 좋은 답으로 볼지 | 중간~높음 |
| Tool Use / Agent | 외부 시스템 | DB조회, 계산, 검색, API 호출 | 중간 |
| Constrained Decoding | 출력 과정 | JSON, SQL 등 출력 형태 강제 | 낮음 |

> 지식을 넣는 것과 행동을 가르치는 것은 다르다는 것을 인지해야 한다.

# 1. Prompt Engineering / Few-shot

가장 쉽게 구현할 수 있는 도메인 적응 방법이다.

예를 들어 일반 LLM에게 그냥 "이 설비의 이상 여부를 판단해줘." 라고 말하는 대신

```text
너는 반도체 제조 공정 엔지니어다.

판단 기준:
  - 압력 > 130: 위험
  - 진동 RMS > 0.8: 이상 가능성
  - 온도 상승률 > 3°C/min: 경고

출력:
  원인 / 위험도 / 대응방법
```

처럼 만드는 것이다.

그리고 몇 개의 정답 예제를 넣으면 Few-shot이 된다.

```text
입력: 진동 0.9
출력: Bearing 이상 가능성 높음

입력: 진동 0.3
출력: 정상
```

즉
> 모델은 그대로 두고 입력을 잘 설계한다.
데이터가 적거나 빠르게 프로토타입을 만들어야 할 때 사용한다.

# 2. Supervised Fine-Tuning, SFT
LoRA보다 큰 개념이 Fine-Tuning, 그중 대표적인 것이 SFT다

학습 데이터가

```text
질문 -> 정답
```

형태로 존재한다.

예를 들어 의료 도메인

```text
Q: 환자의 이런 증상이 나타났습니다.
A: 가능한 원인은 다음과 같습니다...
```

제조업

```text
Q: Furnace 온도가 상승하고 압력이 감소했다.
A: Gas leakage 가능성을 우선 점검한다.
```

이런 데이터 수천만개 학습

모델  $P(y|x)$

즉

> 이 질문 x가 들어왔을 때 정답 y가 나오도록 하습한다.

여기서 중요한거는 LoRA는 SFT와 경쟁 관계가 아니라는 것

예를 들어

```text
SFT
  ├── Full Fine-Tuning
  └── PEFT
      ├── LoRA
      ├── Adapter
      ├── Prefix Tuning
      └── IA³
```

LoRA는 SFT를 수행하는 효율적인 방법 중 하나라고

# 3. Full Fine-Tuning

LoRA는
> 모델의 일부 변화량만 학습
한다면, Full Fine Tuning은

예를 들어 원래 모델 가중치가
$W$
라면 LoRA
$W' = W + BA$
정도로 작은 변화량을 학습

반면 Full Fine-Tuning
$W \rightarrow W'$

전체를 직접 변경한다.

장점은 모델의 행동을 강하게 바꿀 수 있다는 것이다.
하지만 7B, 70B같은 LLM을 전체 학습하려면 GPU메모리 엄청 필요

그래서 현실적으로

작은 모델 → Full Fine-Tuning 가능

큰 모델 → LoRA / QLoRA 사용

하는 경우가 많다.

# 4. Continued Pretraining

이게 도메인 적응에서는 상당히 중요
Domain-Adaptive Pretraining, DAPT라고도 한다.

이건 질문-답변을 학습하는 게 아님

그냥 특정 분야의 문서를 엄청 많이 읽힘

예를 들어 법률 모델을 만들어야 하면

```text
판례
법령
계약서
법률 논문
법률 교과서
```

수십억~수백억 토큰을 계속 학습
학습 방식은 원래 LLM이 하던 것과 동일

계약이 성립하기 위해서는 당사자의 ___

다음 토큰 예측

그러면서 모델 자체가

```text
일반 LLM
  ↓
법률 문서를 계속 읽음
  ↓
법률 용어와 표현에 익숙한 LLM
```

RAG와는 차이가 있다.

RAG:

```text
모델
  ↑
외부 문서를 읽어서 답함
```

Continued Pretraining:

```text
문서를 학습
  ↓
모델 자체가 변화
```

도메인 언어 자체가 매우 특수하다면 굉장히 효과적

# 5. DPO / RLHF

"정답을 아는 것"이 아니라 "어떤 답을 좋아할지"를 가르침

예를 들어

```text
질문:
  서버 장애 원인을 분석해줘.

답변 A:
  서버가 고장난 것 같습니다.

답변 B:
  CPU → Memory → Network → DB 순으로
  확인하며 다음 로그를 우선 확인하십시오...

B > A
```

RLHF
DPO
RLAIF
GRPO

이 방법은 특히
"내가 원하는 스타일의 답변"

예를 들어 기업용 AI라면
근거 없는 추측 금지
항상 근거 제시
짧게 답변
회사 정책 우선
위험한 조작 명령 거부


# 6. Tool Use / Function Calling -- 중요

모델 자체에 지식을 집어넣는 것이 아니라,

> 모델이 전문 도구를 사용할 수 있게 만들어줌

예를 들어

```text
사용자
  "삼성전자 PER 계산해줘"

  ↓

LLM
  "현재 주가와 EPS가 필요하다"

  ↓

Finance API

  ↓

계산

  ↓

LLM 답변
```

또는 제조 AI

```text
LLM
  ↓
MES
  ↓
설비 DB
  ↓
센서 데이터
  ↓
Python 분석
  ↓
LLM
```

이렇게 할 수 있음

LLM 자체가 모든 걸 알고 있을 필요가 없음

그래서 실서비스에서는 LLM + RAG + Tools 가 중요

# 7. Adapter / Prefix Tuning / Prompt Tuning / IA³

LoRA 이외에도 PEFT 방법

```text
Full Fine-Tuning
  ████████████████████
  모델 전체 학습

LoRA
  ██

Adapter
  ██

Prefix Tuning
  █

Prompt Tuning
  █
```

## Adapter
Transformer 사이에 작은 Neural Network를 추가한다.

```text
Transformer Layer
  ↓
Adapter
  ↓
Transformer Layer
```

원래 모델은 Freeze하고 Adapter만 학습한다.

## Prefix Tuning
Attention 앞에 학습 가능한 가상의 Token을 붙인다.

```text
원래:
  [사용자 질문]

학습 후:
  [P1][P2][P3][P4][사용자 질문]
```
여기서 P들은 사람이 읽는 단어가 아니라 학습되는 Vector

## Prompt Tuning

Prompt Tuning
비슷하게
학습 가능한 Prompt Embedding

을 만드는 방법이다.
모델 전체를 수정하지 않으면서 특정 Task에 적응시킨다.


## 8. Knowledge Editing

모델 전체를 다시 학습하지 않고 특정 사실만 수정한다.

예를 들어 모델이
A사의 CEO = 김철수
라고 알고 있는데
A사의 CEO = 박영희
로 바뀌었다고 하자.
전체 Fine-Tuning을 하지 않고 특정 Knowledge만 수정하려는 연구다.
대표적으로
ROME
MEMIT
MEND
같은 방법들이 있다.
다만 실서비스에서는 이런 최신 사실 변경은 보통 RAG가 훨씬 관리하기 쉽다.

-> RAG를 잘 공부하자 ^^

# 결론

```text
                    Domain Adaptation

                           │
          ┌────────────────┼────────────────┐
          │                │                │
      Knowledge         Behavior        Capability
          │                │                │
          │                │                │
      RAG / DAPT        SFT / DPO         Tool Use
          │                │                │
          │                │                │
  "무엇을 아는가"  "어떻게 답하는가"  "무엇을 할 수 있는가"
```


뭐 예를 들어.. "반도체 제도 전문 LLM을 만든다면" 여러가지를 조합해야 한다..

```text
① Continued Pretraining
  반도체 논문 / 매뉴얼 / 특허
    ↓
  반도체 언어 이해

② SFT + LoRA
  공정 문제 → 엔지니어 답변
    ↓
  답변 방식 학습

③ DPO
  좋은 엔지니어 답변 > 나쁜 답변
    ↓
  답변 품질 정렬

④ RAG
  설비 매뉴얼 / 최근 로그 / 사내 문서
    ↓
  최신 정보 제공

⑤ Tool Use
  MES / DB / Python / 센서 API
    ↓
  실제 데이터 분석
```

```text
Base LLM
  +
Domain Pretraining
  +
SFT / LoRA
  +
Preference Tuning
  +
RAG
  +
Tools
  ↓
Domain AI System
```


질문을 잘 던저야 할 필요가 있다

> 내가 필요한 것은 지식? 행동? 전문가 태도? 도구? 인지 잘 판별하는 게 중요하다.
