---
layout: post
title: "LoRA (Low-Rank Adaptation)"
date: 2026-08-28 00:00:00 +0900
categories: [Deep_Learning, LoRA]
tags: [Deep Learning, LoRA, PEFT, Fine-Tuning, QLoRA]
description: "LoRA의 저랭크 행렬 분해 원리, 학습 방식, Full Fine-Tuning 및 RAG와의 차이를 정리한다."
summary: "LoRA가 적은 파라미터로 Base Model을 특정 작업에 적응시키는 원리를 정리한다."
legacyPath: "/deep_learning/lora/2026/08/28/lora/"
---

> 어댑터가 배우는 것은 완전한 모델 지식이 아니라, 특정 베이스 모델을 어떻게 조금 수정할지에 대한 차이값

```
베이스 모델 = 완성된 교과서
LoRA 어댑터 = 교과서 위에 붙이는 수정 메모
학습 = 수정 메모만 작성
추론 = 교과서와 수정 메모를 함께 읽음
```

# 핵심 설계 철학

> 거대한 LLM이 이미 대부분의 지식을 가지고 있으니, 새로운 Task를 학습한다고 모델 전체를 뜯어고치지 말자. 모델이 "어느 방향으로 조금 바뀌어야 하는지"만 작은 저랭크 행렬로 학습

# 1. What is LoRA

LoRA = Low-Rank Adaptation

직역하면
> (Low-Rank)행렬을 이용한 모델 적응(Adaptation)

기존 Fine-Tuning은 모델의 Weight 전체를 수정한다.

기존 Fine-Tuning

```
Base Model

W1 ── 수정
W2 ── 수정
W3 ── 수정
W4 ── 수정
...
모든 Weight 학습
```

LoRA는 이렇게 학습

```
LoRA

Base Model
W1 ─────────── Frozen
W2 ─────────── Frozen
W3 ─────────── Frozen
      +
     LoRA
   A × B 학습
W4 ─────────── Frozen
```

기존 Weight W는 그대로 두고
(반드시 Base Model이 필요하다!)
W를 얼마나 변화시킬 것인지 ΔW만 학습한다.

# 2. 먼저 알아야 하는 핵심 단어
LoRA 공부할 때 아래 용어가 계속 나온다.

| 단어 | 의미 | 핵심 |
|---|---|---|
| Base Model | 원래 LLM | Llama, Qwen, Mistral 등 |
| Weight `W` | 모델이 이미 학습한 파라미터 | 기존 지식 |
| Frozen | Weight를 학습하지 않음 | `W` 고정 |
| Fine-Tuning | 모델을 추가 데이터로 학습 | 특정 Task 적응 |
| Adapter | Base Model에 추가되는 작은 학습 모듈 | 수정 메모 |
| `ΔW` | 기존 Weight에 추가할 변화량 | LoRA가 배우려는 것 |
| Rank `r` | LoRA 행렬의 중간 차원 | Adapter 크기 |
| Low-Rank | 작은 rank를 가진 행렬 | 파라미터 압축의 핵심 |
| `A`, `B` | ΔW를 구성하는 작은 행렬 | 실제 학습되는 Parameter |
| `α` | LoRA 영향력 Scaling 값 | 업데이트 크기 조절 |
| Target Module | LoRA를 삽입할 Layer | `q_proj`, `v_proj` 등 |
| PEFT | Parameter-Efficient Fine-Tuning | LoRA가 속하는 기술군 |
| Merge | LoRA를 Base Weight에 합치는 것 | 추론 최적화 |
| QLoRA | Quantization + LoRA | VRAM 절약 |


```
W    = 원래 모델
ΔW   = 변화량
r    = 변화량을 표현하는 작은 차원
A, B = ΔW를 만드는 학습 파라미터
```

# 3. LoRA의 핵심 철학

LoRA는 한 가지 가정을 한다.
> 거대한 LLM을 새로운 Task에 적응시키기 위해 필요한 Weight 변화는 생각보다 복잡하지 않을 것

예를 들어 70B Paramete를 가진 모델에게
> SQL을 잘 작성하게 만들어.

라고 한다고 해서 , 70억 개 Weight 전부를 완전히 새로 조정할 필요는 없다.

원래 모델은 이미

```
SQL 문법
프로그래밍
DB
영어
논리
코드 생성
```

등을 알고 있다.

그래서 필요한 것은 차라리 정답에 가깝게 답변하는 것.

```
기존 능력

      ↓ 약간 방향 수정

SQL 질문 → SQL 형식으로 더 적극적으로 답변
```

그래서 LoRA의 사고방식은:

새로운 지식을 처음부터 학습하는 것이 아니라, 이미 존재하는 능력을 특정 방향으로 조정하는 것.

# 4. Full Fine-Tuning과 LoRA의 차이

원래의 Neural Network Layer를 단순하게 표현하면,

\(y = Wx\)

- \(x\): 입력, \(W\): weight, \(y\): 출력

Full fine-Tuning는 W를 바꾼다.

\(W \rightarrow W'\)

즉

\(W' = W + \Delta W\)

이다.

문제는 W가 엄청 크다는 것이다.

예를 들어 Transformer의 Linear Layer가

\[
4096 \times 4096
\]

이라면 Parameter

=
\[
4096 \times 4096
=
16,777,216
\]

# 5. LoRA의 핵심 아이디어

LoRA는 이 거대한

\(\Delta W\)를 학습하지 않는다.

대신 \(\Delta W = BA\) 라고 분해한다.

원래 Weight

\[
W \in \mathbb{R}^{4096 \times 4096}
\]

LoRA rank를

\[
r = 8
\]

이라고 하자.

그러면

\[
A \in \mathbb{R}^{8 \times 4096}
\]

\[
B \in \mathbb{R}^{4096 \times 8}
\]

로 만든다.

따라서

\[
BA
\]

의 크기는

\[
(4096 \times 8)
(8 \times 4096)
\]

이므로 결과는

\[
4096 \times 4096
\]

이 된다.

즉

\[
\Delta W = BA
\]

가 원래 Weight와 똑같은 크기가 된다.

# 6. 그렇다면 왜 이걸 써야 하나요?

원래 ΔW를 직접 학습하면
\[
4096 \times 4096
=
16,777,216
\]

개 Parameter가 필요하지만,

LoRA를 사용하면 절감할 수 있다.

하지만 LoRA는
\[
A = 8 \times 4096
\]

\[
B = 4096 \times 8
\]

이므로

\[
32768 + 32768
=
65536
\]

개만 학습한다.

| 방식 | 학습 Parameter |
|---|---:|
| Full Fine-Tuning | 16,777,216 |
| LoRA `r=8` | 65,536 |

율은 약
\[
\frac{65,536}{16,777,216}
\approx 0.39\%
\]

이다.
즉,
약 0.4% Parameter만 학습.

# 7. 아키텍쳐를 그림으로 보면

원래 Linear Layer는

```
             W
x ─────────────────────→ y
       4096 × 4096
```

LoRA:

```
                W (Frozen)
          ┌───────────────────→
          │
x ────────┤                       + ───→ y
          │
          │     A         B
          └──→ 4096→8 → 8→4096 ─→
                 ↑         ↑
               학습       학습
```

두 개의 경로가 존재하게 된다.

Base Path

```
x → W → Wx
```


LoRA Path

```
x → A → B → BAx
```

그리고 마지막에 더한다.

\[
y = Wx + BAx
\]

실제로는 scaling까지 포함해

\[
\boxed{
y =
Wx
+
\frac{\alpha}{r}BAx
}
\]

를 사용한다.

# 8. Rank r가 왜 중요한가?

> r은 LoRA에서 가장 중요한 Hyperparameter

```
4096
 ↓
8
 ↓
4096
```

이라는 구조에서 4096차원의 복잡한 Weight 변화 정보로
8차원 공간을 통해서만 표현하는 것,
그래서 Low-Rank라는 이름이 붙는 것이다.

## Rank가 작으면

`r = 4`

Parameter가 적다.

장점 :

```
VRAM ↓
학습 속도 ↑
Adapter 용량 ↓
```

하지만 표현 능력이 작다.

## Rank가 크면

`r = 64`

표현 능력은 커진다.

```
Parameter ↑
VRAM ↑
학습 비용 ↑
```

개념적으로:

```
r = 1
매우 단순한 수정

r = 8
적당히 복잡한 수정

r = 64
상당히 복잡한 수정

Full Fine-Tuning
거의 모든 방향으로 수정 가능
```

# 9. 진짜 숫자로 계산해보자

작은 모델을 하나 만들어보자.

원래 Weight가

\[
W =
\begin{bmatrix}
1 & 2 \\
3 & 4
\end{bmatrix}
\]

라고 하자.

입력은

\[
x =
\begin{bmatrix}
1\\
2
\end{bmatrix}
\]

이다.

## ① Base Model 계산

\[
Wx
\]

를 계산하면

\[
\begin{bmatrix}
1 & 2\\
3 & 4
\end{bmatrix}
\begin{bmatrix}
1\\
2
\end{bmatrix}
\]

이다.

첫 번째 값:

\[
1\times1 + 2\times2 = 5
\]

두 번째:

\[
3\times1 + 4\times2 = 11
\]

따라서

\[
Wx =
\begin{bmatrix}
5\\
11
\end{bmatrix}
\]

# 10. LoRA를 추가하자

rank를

\[
r = 1
\]

로 하자.

그러면

\[
A =
\begin{bmatrix}
1 & 0.5
\end{bmatrix}
\]

이고

\[
B =
\begin{bmatrix}
0.2\\
0.4
\end{bmatrix}
\]

라고 해보자.

## Step 1. A가 입력을 압축

\[
Ax
\]

를 계산한다.

\[
\begin{bmatrix}
1 & 0.5
\end{bmatrix}
\begin{bmatrix}
1\\
2
\end{bmatrix}
\]

따라서

\[
1\times1 + 0.5\times2
=
2
\]

즉

\[
Ax = 2
\]

가 된다.

## Step 2. B가 다시 확장

\[
B(Ax)
\]

를 계산한다.

\[
\begin{bmatrix}
0.2\\
0.4
\end{bmatrix}
\times 2
\]

따라서

\[
=
\begin{bmatrix}
0.4\\
0.8
\end{bmatrix}
\]

이다.

이 값이 바로

\[
BAx
\]

이다.

# 11. Base Model 결과와 합친다

원래 결과:

\[
Wx =
\begin{bmatrix}
5\\
11
\end{bmatrix}
\]

LoRA:

\[
BAx =
\begin{bmatrix}
0.4\\
0.8
\end{bmatrix}
\]

따라서

\[
y =
Wx + BAx
\]

이므로

\[
y =
\begin{bmatrix}
5.4\\
11.8
\end{bmatrix}
\]

이다.

# 12. 원래 핵심

```
원래 모델

[5]
[11]

+

LoRA 수정값

[0.4]
[0.8]

=

최종 모델

[5.4]
[11.8]
```

다시 정리 해보자면

원래 모델의 출력을 새로 만드는 게 아니라
원래 출력에 작은 수정 방향을 더해준다.

# 13. α는 무엇?

실제 LoRA에는 보통

\[
\frac{\alpha}{r}
\]

가 붙는다.

\[
y =
Wx +
\frac{\alpha}{r}BAx
\]

예를 들어

\[
r = 8
\]

\[
\alpha = 16
\]

이면

\[
\frac{\alpha}{r}
=
\frac{16}{8}
=
2
\]

이다.

따라서

\[
\Delta y = 2BAx
\]

가 된다.

쉽게 말하면:

```
α = LoRA 수정 메모의 볼륨 조절

alpha 작음

"원래 모델 성향을 많이 유지"


alpha 큼

"LoRA가 학습한 성향을 강하게 반영"
```

단, α가 학습과 결합되어 있으므로 단순히 α가 크면 무조건 더 좋은 것은 아니다.

\(W\) 는 프리즈하고

```
W

requires_grad = False

반면

A
B

requires_grad = True
```

Training 과정은 대략:

```
Input
  ↓
Base Model
  ↓
Wx + LoRA
  ↓
Prediction
  ↓
Loss
  ↓
Backpropagation
  ↓
A, B만 수정
```

즉 Gradient가 나와도

```
W ← 업데이트 안 함

A ← 업데이트
B ← 업데이트
```

# 14. 처음에는 LoRA가 Base Model을 망치지 않는다

LoRA 구현에서는 흔히 초기 상태에서

A = Random
B = Zero

등으로 초기화.
그러면 처음에는
\[
BA = 0
\]

\[
W + BA = W
\]

이다.
즉 학습 시작 시점에는
LoRA를 붙여도 원래 모델과 사실상 동일

그리고 Training하면서 점점

```
B

0
↓
조금 변경
↓
더 변경
```

Base Model에서 필요한 방향으로 이동

# 15. Transformer 어디에 LoRA를 붙이는가?

Transformer Attention을 보면 보통

```
Input
  │
  ├─ Wq → Query
  │
  ├─ Wk → Key
  │
  └─ Wv → Value

Q K V
 ↓
Attention

 ↓

Wo
```

와 같은 Linear Weight들이 있음.

Hugging Face 계열 모델에서는 보통 이름이

```
q_proj
k_proj
v_proj
o_proj
```

LoRA는 여기에 붙인다.

예를 들어

```
q_proj

Wq + ΔWq


v_proj

Wv + ΔWv
```

# 16. 처음에는 왜 q_proj와 v_proj 이야기가 많이 나오는가

원래 LoRA 논문에서는 Attention의 특정 Projection에 LoRA를 적용하는 실험을 많이 했다.

그래서 흔히

```
q_proj
v_proj
```

에 적용하는 설정을 볼 수 있다.

현재 LLM Fine-Tuning에서는 좀 더 넓게

```
q_proj
k_proj
v_proj
o_proj

gate_proj
up_proj
down_proj
```

쉽게 이야기 해서

```
Attention만 수정

vs

Attention + MLP까지 수정
```

Adapter를 더 많이 붙이면 일반적으로 Adapter의 표현력도 커지지만 Paramete의 학습 비용도 커진다.

# 17. LoRA 전체 구조

전체 LLM을 보면 이런 느낌

```
                    ┌──────────────┐
Input ─────────────→│ Embedding    │
                    └──────┬───────┘
                           ↓
              ┌────────────────────────┐
              │ Transformer Block      │
              │                        │
              │ Q = (Wq + BA)x         │
              │ K = Wk x               │
              │ V = (Wv + BA)x         │
              │                        │
              │ Attention              │
              │                        │
              │ MLP                    │
              └───────────┬────────────┘
                          ↓
                     Block × N
                          ↓
                        LM Head
                          ↓
                       Token
```

Base Weight는 전부 Frozen

```
A
B
```

이다.

# 18. Full Fine-Tuning과 비교하면

| | Full Fine-Tuning | LoRA |
|---|---|---|
| Base Weight | 수정 | Frozen |
| 학습 Parameter | 매우 많음 | 매우 적음 |
| GPU VRAM | 매우 큼 | 적음 |
| 학습 속도 | 느림 | 빠름 |
| Checkpoint | GB 단위 | MB~수백 MB |
| 여러 Task 관리 | 불편 | 매우 편리 |
| 최대 성능 | 일반적으로 유리 | 약간 제한될 수 있음 |
| 기존 모델 보존 | 어려움 | 좋음 |

LoRA의 강력한 장점 중 하나가 모델 하나에 Adapter 여러 개를 붙일 수 있다는 것

```
Llama Base
   │
   ├── SQL LoRA
   │
   ├── Medical LoRA
   │
   ├── Korean LoRA
   │
   ├── Customer-Service LoRA
   │
   └── Code LoRA
```

Base Model 10GB를 다섯 번 저장할 필요가 없다.

```
Base Model   10GB

SQL LoRA     50MB
Medical      70MB
Korean       60MB
Code         80MB
```

# 19. 그러면 LoRA가 "새로운 지식"을 배우는 것?

정확히 말해보자면

> LoRA는 새로운 패턴이나 정보에 맞게 모델의 행동을 변화시킬 수 있다.

대규모 새로운 사실 지식을 저장하는 Database

이 문제떄문에

```
LoRA
vs
RAG
```

을 구별해야 한다.

# 20. LoRA와 RAG 차이

**LoRA**

모델의 행동을 바꾼다.

- 말투
- 응답 형식
- 작업 방식
- Domain reasoning
- 특정 스타일
- 분류 방법

```
질문:
환자 데이터를 분석해줘

일반 LLM:
일반적인 설명

Medical LoRA:
의료 문서 방식으로 구조화하여 분석
```

---

**RAG**

모델에게 정보를 제공한다.

```
Vector DB
    ↓
관련 문서 검색
    ↓
Prompt
    ↓
LLM
```

예

```
"우리 회사 휴가 규정이 뭐야?"

↓ 검색

사내 규정 PDF

↓ LLM

"연차는..."
```

| 원하는 것 | 기술 |
|---|---|
| 최신 정보 제공 | RAG |
| 사내 문서 검색 | RAG |
| 모델의 말투 변경 | LoRA |
| 특정 출력 포맷 학습 | LoRA |
| Domain 특화 행동 | LoRA |
| 모델 자체의 행동 변화 | LoRA |
| Knowledge + Behavior | RAG + LoRA |

# 21. LoRA의 단점

사실 LoRA는 만능은 아니다.
가장 중요한 단점은 Low-Rank라는 제약 그 자체

LoRA는

\[
\Delta W = BA
\]

라고 강제

그런데 실제 최적의 Weight 변화가 매우 복잡하다면

rank 8

정도로는 충분히 표현하기 어려울 수 있다.

# 22. LoRA의 주요 한계 정리

1. Full Fine-Tuning보다 표현 능력이 제한될 수 있다.

   - Rank가 작기 때문에 모델 전체를 크게 변화시켜야 하는 Task에서는 성능 차이가 생길 수 있다.

2. Base Model 의존이 매우 크다.

   - Adapter가 독립적인 모델이 아님.

   ```
   Llama Adapter

   +

   Llama Base

   필요
   ```

   Llama용 LoRA를 Qwen에 붙일 수 없다.

3. Base Model에 없는 능력을 만들어내는 데 한계가 있다.

   1B 모델을 LoRA 몇 번 했다고 GPT급 reasoning 모델로 만들 수 있는 것은 아니다.

4. Target Module과 Rank 설정에 따라 결과가 크게 달라질 수 있다.

   ```
   r
   alpha
   learning rate
   target_modules
   dropout
   dataset
   ```

   등과 같이 하이퍼파라미터를 조정해야 한다.

5. 여러 LoRA를 동시에 사용하면 충돌할 수 있다.

   ```
   Medical LoRA
   +
   Friendly Chat LoRA
   +
   Korean LoRA
   ```

   LoRA끼리 더한다고 항상 좋은 모델이 되는 것이 아니다.

# 23. LoRA의 메모리 절약은 어디서 되는가?

Training할 때는 Weight만 저장하는 것이 아니다.
Optimizer를 사용하면 보통

```
Weight
Gradient
Optimizer State
```

등도 메모리에 올라간다.

Full Fine-Tuning

```
70억 Parameter

Weight
+
Gradient
+
Adam momentum
+
Adam variance
```

가 필요하다.

LoRA:

```
70억 Base Weight

Frozen

+

수백만 개 LoRA

Gradient
Optimizer
```

만 관리한다.

# 24. QLoRA는 여기서 한 단계 더 간다

QLoRA는

```
Quantization
+
LoRA
```

이다.

Base Model을 예를 들어

```
FP16
→
4-bit
```

로 저장한다.

그리고 LoRA만 높은 Precision으로 학습

구조는

```
4-bit Base Model
     │
     │ Frozen
     ↓

LoRA Adapter
BF16 / FP16

     ↓

Training
```

이렇게 된다.

그래서 상대적으로 작은 GPU로도 큰 모델을 Fine-Tuning이 가능하다.

# 25. LoRA는 결국 어디에 쓰는가?

LoRA가 가장 잘 맞는 상황은 :

> 이미 좋은 Base Model이 있는데, 그 모델의 "행동"을 특정 목적에 맞게 바꾸고 싶을 때

대표적으로

1. Instruction Tuning

   질문 → 특정 방식으로 대답

2. Domain Adaptation

   ```
   법률
   의료
   금융
   제조
   건설
   ```

3. Style Tuning

   ```
   특정 말투
   특정 보고서 스타일
   ```

4. Task-specific Model

   ```
   분류
   정보 추출
   SQL generation
   Code generation
   ```

5. 개인/기업 Custom LLM

   ```
   회사 상담 모델
   사내 업무 모델
   도메인 전문가 모델
   ```

6. Stable Diffusion

   ```
   캐릭터
   그림체
   인물
   제품 디자인
   ```

Stable Diffusion 쪽에서 "LoRA 파일"이라는 말을 많이 듣는 것도 정확히 같은 개념

# 26. LoRA를 한 문장으로 정의

LoRA는 사전학습 모델의 기존 가중치를 고정한 상태에서, 필요한 가중치 변화량을 두 개의 작은 저랭크 행렬로 분해하여 학습하는 Parameter-Efficient Fine-Tuning 기법이다.

수식으로 바로 연결하면:

\[
\boxed{
W' = W + \Delta W
}
\]

그리고

\[
\boxed{
\Delta W = BA
}
\]

이므로

\[
\boxed{
y =
Wx +
\frac{\alpha}{r}BAx
}
\]

이다.

이 세 줄이 LoRA 전체 수학의 핵심

# 27. 지금 단계에서 머릿속에 박아두면 좋은 구조

```
               Fine-Tuning

                   │
        ┌──────────┴───────────┐
        │                      │
 Full Fine-Tuning            PEFT
        │                      │
 모든 W 수정                  │
                               ↓
                             LoRA
                               │
                       W는 Frozen
                               │
                      ΔW만 학습
                               │
                      ΔW = B × A
                               │
                           Low Rank
                               │
                          Rank = r
                               │
                  y = Wx + α/r BAx
```

```
Base Model
=
이미 대부분의 능력을 가지고 있음


LoRA
=
그 능력을 특정 Task 방향으로 움직이는 작은 수정값


Rank
=
그 수정값이 얼마나 복잡할 수 있는가


A, B
=
실제로 학습되는 Parameter


Alpha
=
그 수정값을 어느 정도 세기로 반영할 것인가
```

# 28. LoRA에서 제일 중요한 철학

결국 LoRA의 가장 중요한 철학은 이거다.

"새로운 Task가 생겼다고 거대한 모델 전체를 다시 학습할 필요가 있는가?"

LoRA의 대답은
"아니다. 이미 좋은 모델이 있다면, 필요한 변화만 학습하면 된다."

이고 수학적으로 그 변화량을

\[
\Delta W
\]

라고 표현한다.

그리고 여기서 다시 한 단계 더 기발한 생각이 나온다.

"그 ΔW조차 정말 4096 × 4096처럼 복잡해야 하는가?"

LoRA의 대답은 다시
"아마 아니다. 작은 latent dimension으로도 충분히 표현할 수 있을 것이다."

그래서

\[
\boxed{
\Delta W = BA
}
\]

가 탄생한 것이다.
