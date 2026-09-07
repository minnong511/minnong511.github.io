---
layout: post
title: "LLM 양자화와 QLoRA"
date: 2026-08-31 00:00:00 +0900
categories: [Deep_Learning, Optimization]
tags: [Deep Learning, LLM, Quantization, QLoRA, NF4]
description: "LLM 양자화의 기본 원리와 Block-wise Quantization, NF4, Double Quantization, QLoRA의 학습 구조를 정리한다."
summary: "가중치를 저비트로 근사하는 과정부터 QLoRA가 메모리를 절감하는 방식까지 정리한다."
legacyPath: "/deep_learning/optimization/2026/08/31/quantization/"
---
# 1. 양자화

모델의 실수형 가중치를 더 적은 비트 수의 숫자로 근사해서 저장하는 것이다.

원래 LLM 가중치가 FP16이라면 가중치 하나를 16비트로 저장한다.

\(0.1274,\quad -1.3821,\quad 0.7362\)

4bit로 양자화하면 사용할 수 있는 값이 \(2^4=16\)개밖에 없으니까, 원래 연속적인 실수를 16개의 대표값 중 하나로 매핑하게 된다.

가장 기본적인 양자화 원리는 다음과 같다.

예를 들어 가중치 범위가

\[
-1.0 \sim 1.0
\]

이고 4bit를 사용한다고 해보자.
4bit면 표현 가능한 정수는 0부터 15까지다.

총 16개다.

그러면 실수 \(x\)를 정수 \(q\)로 바꾸는 가장 단순한 방식은 대략

\[
q = \operatorname{round}\left(\frac{x-x_{\min}}{s}\right)
\]

처럼 표현할 수 있다.

여기서 \(s\)는 Scale이다.

\[
s=\frac{x_{\max}-x_{\min}}{2^b-1}
\]

\(b=4\)라면

\[
s
=\frac{1-(-1)}{15}
=\frac{2}{15}
\approx 0.1333
\]

이다.

\[
x=0.72
\]

가 된다.

즉,

```text
원래 값
  0.72

  ↓ Quantization

4bit Integer
  13
```

으로 저장하는 것이다.

# 그런데 계산할 때 13을 그대로 쓰는 것은 아니다

필요할 때 다시 근사적인 실수로 복원한다.

이를 Dequantization이라고 한다.

\[
\hat{x}=q \times s+x_{\min}
\]

방금 값이라면

\[
13\times0.1333-1\approx0.733
\]

이다.

원래 값은 \(0.72\)였는데 복원하면

\[
0.733
\]

정도가 된다.
즉,

\[
0.72\rightarrow 13\rightarrow 0.733
\]

이다.
이 차이를 Quantization Error라고 한다.

\[
\text{Error}=0.733-0.72=0.013
\]

그래서 양자화의 본질은 정밀도를 조금 포기해서 메모리와 계산 비용을 크게 줄이는 것이다.

# 왜 메모리가 줄어드나?

7B 모델이 있다고 해보자.
FP16이라면 Parameter 하나당

\[
16\text{bit}=2\text{byte}
\]

이므로 대략

\[
7\text{B}\times2\text{byte}\approx14\text{GB}
\]

가 필요하다.
4bit라면

\[
4\text{bit}=0.5\text{byte}
\]

이므로 이론적으로

\[
7\text{B}\times0.5\text{byte}\approx3.5\text{GB}
\]

정도까지 줄어든다.

그래서

```text
FP32
  32bit

  ↓

FP16 / BF16
  16bit

  ↓

INT8
  8bit

  ↓

INT4
  4bit
```

로 내려갈수록 메모리가 줄어든다.

# 그런데 실제 LLM은 전체 Weight를 한 번에 양자화하지 않는다

여기서 중요한 개념이 Block-wise Quantization이다.

가중치가 엄청 큰 행렬이라고 해보자.

\[
W\in\mathbb{R}^{4096\times4096}
\]

이 전체 행렬 하나에 Scale 하나만 쓰면 문제가 생긴다.

예를 들어 대부분의 Weight가

\[
-0.1\sim0.1
\]

사이에 있는데 딱 하나가

\[
5.0
\]

이라면 전체 범위가

\[
-0.1\sim5.0
\]

이 되어버린다.

그러면 작은 Weight들이 매우 부정확하게 표현된다.
그래서 실제로는 Weight를 작은 Block으로 나눈다.

```text
거대한 Weight

  [----------------------------]

  ↓

Block 1
  [----]

Block 2
  [----]

Block 3
  [----]

Block 4
  [----]
```

그리고 각 Block마다 별도의 Scale을 갖는다.

```text
Block 1 → Scale₁
Block 2 → Scale₂
Block 3 → Scale₃
Block 4 → Scale₄
```

이렇게 하면 각 지역의 숫자 분포에 더 잘 맞출 수 있다.

# QLoRA는 조금 더 특별하다

QLoRA에서는 그냥 일반적인 INT4를 사용하는 것이 아니라 대표적으로 NF4, 즉 NormalFloat 4-bit를 사용한다.
LLM Weight를 보면 대체로 값들이 정규분포와 비슷하게 몰려 있는 경우가 많다.

```text
빈도

          ███
        ███████
      ███████████
----███████████████----
             0
```

즉 0 근처에 Weight가 많고 큰 값은 적다.
일반적인 균등 양자화라면 값을 일정한 간격으로 나눈다.

```text
-1
│
├── -0.75
├── -0.50
├── -0.25
├──  0
├──  0.25
├──  0.50
├──  0.75
│
1
```

하지만 Weight가 0 근처에 몰려 있다면 0 근처에 더 많은 표현값을 배치하는 것이 효율적일 수 있다.

NF4는 이런 신경망 Weight의 분포 특성에 맞춰 16개의 대표값을 설계한다.

```text
Uniform INT4

  |----|----|----|----|----|


NF4

  |-------|---|-|-|-|---|-------|
                0
```

처럼 0 근처를 더 세밀하게 표현한다고 이해하면 된다.
엄밀하게는 정규분포를 고려해 Quantization Level을 설계한 데이터 타입이다.

# QLoRA에서 학습은 어떻게 되는 걸까?

QLoRA라고 해서 모든 연산을 4bit로 하는 것은 아니다.
Base Model의 Weight는 4bit로 저장한다.

하지만 실제 Matrix Multiplication을 할 때는 다음과 같다.

```text
4bit Weight
  ↓
Dequantization
  ↓
BF16 / FP16
  ↓
Matrix Multiplication
```

그리고 LoRA Adapter는 보통 더 높은 정밀도로 학습한다.
구조적으로는 이런 느낌이다.

```text
                 Base Model Weight
                          W
                        4bit
                          │
                    Dequantization
                          │
                          ↓
x ────────────────────── Wx
│                         │
│                         ├──→ +
│                         │     │
└──→ LoRA A → LoRA B ──────────┘
      BF16      BF16             │
                                 ↓
                                 y
```

\[
y=W_{\text{quantized}}x+\frac{\alpha}{r}BAx
\]

정확하게는 계산할 때 양자화된 \(W\)가 적절한 계산 dtype으로 복원되어 사용된다.

# 그런데 Base Model은 4bit인데 학습이 가능한 이유는?

QLoRA에서는 Base Weight를 Frozen 상태로 유지한다.

즉,

\[
W
\]

를 업데이트하지 않는다. Gradient가 필요한 것은

\[
A, B
\]

뿐이다.

```text
Forward

Quantized W
  +
LoRA A, B
  ↓
Prediction
  ↓
Loss

Backward

W → 업데이트 ❌
A → Gradient ✅
B → Gradient ✅
```

그래서 LoRA 대비 메모리 절감이 가능해진다.

# Double Quantization

QLoRA에서 재미있는 기술 중 하나다.

아까 Block마다 Scale이 필요하다고 했다.
그런데 Scale도 결국 숫자다.

```text
Block 1 → scale = 0.03451
Block 2 → scale = 0.02137
Block 3 → scale = 0.04282
...
```

Block이 많으면 Scale 저장 비용도 무시할 수 없게 된다.

그래서 QLoRA는

> Quantization을 위한 Scale 자체를 다시 Quantization

한다.

```text
Weight
  ↓
4bit Quantization
  ↓
Scale 필요

그 Scale
  ↓
다시 Quantization
```

## QLoRA

```text
Base LLM
  FP16 / BF16
      │
      ↓
4bit Quantization
      │
      ├── NF4
      ├── Block-wise Quantization
      └── Double Quantization
      │
      ↓
Quantized Base Model
  Frozen
      │
      +
      │
LoRA Adapter
  A, B
  Trainable
      │
      ↓
Fine-Tuning
```

그리고 추론할 때는 다음과 같다.

\[
\boxed{y=Wx+\frac{\alpha}{r}BAx}
\]

기본 구조는 유지된다.

다만, \(W\)가 고정밀 원본 Weight가 아니라 4bit로 압축 저장된 Weight라는 것이 핵심적인 차이다.

> 양자화는 Weight를 단순히 소수점 몇 자리에서 잘라버리는 것이 아니다. 여러 실수값을 제한된 수의 대표값에 매핑하고, Scale 등의 정보를 이용해서 필요할 때 근사 복원하는 과정이다.
