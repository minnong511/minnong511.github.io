---
layout: post
title: "머신러닝 입문"
date: 2026-09-01 00:00:00 +0900
categories: [Deep_Learning, Basic]
tags: [Deep Learning, Machine Learning, Classification, Regression, Tree, SVM]
description: "머신러닝의 기본 개념과 데이터 분할, 학습 유형, Tree 기반 모델, SVM, Regularization을 정리한다."
summary: "머신러닝 문제 정의부터 주요 알고리즘을 선택하는 기준까지 입문 개념을 정리한다."
legacyPath: "/deep_learning/basic/2026/09/01/ml-introduction/"
---

# 1. 입문

```text
Artificial Intelligence
  → Machine Learning
    → Deep Learning
```

**AI**는 인간의 지능적인 행동을 컴퓨터로 구현한다는 큰 목표다.

**ML**은 사람이 모든 규칙을 직접 작성하지 않고 데이터에서 규칙을 학습하게 하는 방법이다.

**DL**은 Neural Network를 깊게 쌓아서 복잡한 패턴을 학습하는 ML 방법이다.

> 규칙을 사람이 만드는 것이 아니라 데이터로부터 규칙을 찾아내는 것

사람과 같은 AI를 만들기 위해서는, 사람과 같은 학습과정을 거쳐야 하는 것일까?

# 2. 정확히 무엇을 학습하는 것일까?

```text
Task        T: 무엇을 해야 하는가?
Experience  E: 무엇을 보고 배우는가?
Performance P: 얼마나 잘하는가?
```

그렇다면,

```text
Experience가 쌓이면서
  ↓
Performance가 좋아진다면
  ↓
Learning이 발생했다.
```

예를 들어 스팸 메일 분류라면 다음과 같다.

```text
T = 이메일을 Spam / Normal로 분류
E = 과거 이메일 100,000개
P = Accuracy, F1 Score
```

처음에는 Accuracy가 70%였는데 데이터를 이용해 학습한 뒤 95%가 되었다면,

```text
70% → 95%
```

즉, Experience를 이용해서 Task 수행 능력이 향상된 것이다. 이게 머신러닝에서 말하는 Learning이다.

# 3. 통계와 Machine Learning의 관점 차이

```text
Statistics
  사람
    ↓
  가설 설정
    ↓
  데이터
    ↓
  가설 검증
```

가설을 사람이 세우고 통계적 방법론을 이용해서 가설을 검증한다.

> Human Driven Approach

반대로 Machine Learning에서는 다음과 같이 접근한다.

```text
Machine Learning
  데이터
    ↓
  패턴 탐색
    ↓
  관계 발견
    ↓
  예측
```

> "반드시 소득이 중요할 것이다."

사람이 중요할 변수를 미리 결정하지 않고 데이터를 넣어놓는다.

```text
나이
소득
직업
지역
검색 기록
구매 기록
...
```

이 중 무엇이 중요한지 모델이 찾아간다.

그래서 Data Driven Approach라고 표현한다. 중요한 것은 Statistics와 Machine Learning의 우열이 아니라 문제를 바라보는 관점의 차이다.

# 4. 머신러닝 문제는 일단 Classification과 Regression부터 구분

> 내가 예측하려는 Y가 무엇인가?

이게 가장 중요한 목표다.

교재에서는 이를 Classification과 Regression으로 구분한다.

## Classification

정답이 Class다.

```text
대출 승인 / 거절
정상 / 불량
고양이 / 개
포트홀 / 정상 도로
```

즉,

\[
Y=\text{discrete value}
\]

모델이 찾는 것은 Decision Boundary

```text
         ● ● ●

------------- Decision Boundary

  ▲ ▲ ▲
```

## Regression

```text
아파트 가격 = 8.4억
내일 온도 = 27.3℃
배송 시간 = 32.5분
매출 = 123억
```

\[
Y=\text{continuous value}
\]

Best Fit

```text
Y
│         ●
│      ●
│    ●
│  ●
│●
└──────── X
     /
    /
 Best Fit
```

따라서 가장 먼저 묻는 습관을 들이자

> 내가 예측하려는 \(Y\)가 Class인가? Number인가?

# 5. 머신러닝의 실제 학습 구조

```text
전체 Dataset
     │
     ├── Train
     │
     ├── Validation
     │
     └── Test
```

각각의 역할이 좀 다르다.

## Train

> 모델이 공부하는 문제집

모델의 Parameter를 학습한다.

## Validation

> 모의고사

모델 구조와 Hyperparameter를 선택한다.

```text
Decision Tree depth = 5?
Decision Tree depth = 10?
Decision Tree depth = 20?
```

Validation 성능을 보고 결정한다.

## Test

> 수능

최종 모델의 성능을 평가한다.

```text
Train
  ↓
Model training
  ↓
Validation
  ↓
Hyperparameter tuning
  ↓
최종 Model
  ↓
Test
```

Test 데이터로 튜닝하면 안 된다.
Test까지 보고 계속 모델을 고쳐버리면 Test 데이터도 사실상 학습에 사용한 것이 된다.

# 6. 왜 이렇게 귀찮게 데이터를 나누는가?

바로 Overfitting 때문이다.

Overfitting은 Training Dataset을 너무 잘 외워버리는 현상이다.

예를 들어

```text
모의고사 문제
  100문제 암기

모의고사 → 100점

수능
  새로운 문제 등장

→ 50점
```

ML도 같다.

```text
Train Accuracy = 99%
Validation Accuracy = 75%
Test Accuracy = 72%
```

이러면 학습이 쓸모 없지 않은가?

> 새로운 데이터에서도 성능 유지

하는 것이 목표다.

# 7. 머신러닝의 세 가지 Learning Type

```text
Machine Learning
  ├── Supervised Learning
  ├── Semi-Supervised Learning
  └── Unsupervised Learning
```

## Supervised Learning

\(X\)와 \(Y\)가 모두 존재한다.

| 이미지 | Label |
|---|---|
| 이미지1 | 고양이 |
| 이미지2 | 개 |
| 이미지3 | 고양이 |

모델은 \(X \rightarrow Y\)를 학습한다.

Classification과 Regression이 대표적

## Unsupervised Learning

```text
Customer Data

        ● ●
     ● ● ●


                  ▲ ▲
               ▲ ▲ ▲


        ■ ■
      ■ ■

Cluster A
Cluster B
Cluster C
```

처럼 그룹을 발견한다. 교재에서는 Clustering, Estimation, Dimension Reduction을 설명한다.

## Semi-Supervised Learning

현실에서는 다음과 같은 상황이 많다.

```text
Labeled Data = 1,000개
Unlabeled Data = 1,000,000개
```

예를 들어 고양이와 강아지 사진이 있다고 해보자.

- 정답 있는 사진 100장: 고양이, 강아지 표시가 있음
- 정답 없는 사진 10,000장: 사진만 있고 정답은 없음

가장 단순한 사용 방법은 의사 라벨링이다.

1. 정답 있는 100장으로 모델을 먼저 학습합니다.
2. 학습한 모델에게 정답 없는 사진을 보여줍니다.
3. 모델이 확신하는 사진에 임시 정답을 붙입니다.
4. 원래 데이터와 임시 정답 데이터를 합쳐 다시 학습합니다.

```text
정답 있는 데이터 100장
  ↓
초기 모델 학습
  ↓
정답 없는 데이터 10,000장 예측
  ↓
확신도가 높은 결과만 선택
  ↓
원래 정답 + 임시 정답으로 재학습
```

예를 들어 모델의 예측 결과가 다음과 같다면..

```text
사진 A → 고양이 98%
사진 B → 강아지 95%
사진 C → 고양이 55%
```

```python
# 1. 정답 있는 데이터로 먼저 학습
model.fit(labeled_x, labeled_y)

# 2. 정답 없는 데이터 예측
probabilities = model.predict_proba(unlabeled_x)

# 3. 가장 가능성 높은 정답과 확률
pseudo_labels = probabilities.argmax(axis=1)
confidence = probabilities.max(axis=1)

# 4. 확신도 90% 이상인 데이터만 선택
mask = confidence >= 0.9

selected_x = unlabeled_x[mask]
selected_y = pseudo_labels[mask]

# 5. 원래 데이터와 합쳐 다시 학습
new_x = concatenate([labeled_x, selected_x])
new_y = concatenate([labeled_y, selected_y])

model.fit(new_x, new_y)
```

와 같은 방법을 사용한다.

### 언제 사용하면 좋은가?

정답을 붙이는 작업이 비쌀 때 유용하다.

- 의료 영상: 의사가 직접 진단 라벨을 붙여야 함
- 고객 문의: 사람이 문의 유형을 분류해야 함
- 불량품 이미지: 전문가가 정상과 불량을 판별해야 함
- 음성 데이터: 사람이 직접 내용을 받아써야 함

다만 초기 모델이 틀린 임시 정답을 만들면 그 오답을 다시 학습하면서 성능이 나빠질 수도 있다. 그래서 보통 확신도가 높은 예측만 사용하고, 별도의 검증 데이터로 실제 성능을 확인한다.

# 8. 주요 머신러닝 모델

```text
Tree-based
  ├── Decision Tree
  ├── Random Forest
  └── Boosting

Kernel-based
  └── SVM

Regularization
  ├── LASSO
  └── Ridge
```

> 철학을 이해하는 게 중요

# 9. Decision Tree

> 질문을 계속 던져 데이터를 점점 순수한 집단으로 나눈다.

```text
날씨가 맑은가?
├── Yes
│   └── 습도가 높은가?
│       ├── Yes → 테니스 X
│       └── No  → 테니스 O
│
└── No
    └── ...
```

사람이 if-else를 작성한 것처럼 보이지만, 중요한 차이는 다음과 같다.

> 어떤 질문을 어떤 순서로 할지를 데이터가 결정

교재도 이를 "조건 → 판단 → 결론" 과정에서 조건과 판단을 데이터로 자동 생성한다고 설명한다.

Decision Tree의 장점은 아주 명확하다.

- 해석하기 쉽다.
- 설명하기 쉽다.
- Feature Importance를 볼 수 있다.
- 전처리 부담이 비교적 적다.

반면 깊어질수록 Overfitting이 쉽게 발생한다.

# 10. Gini와 Entropy

Decision Tree가 가장 중요하게 생각하는 것은
> 어디를 잘라야 가장 잘 나뉘는가?

# 11. Random Forest

Decision Tree의 문제는

```text
Tree 하나
  → 데이터가 조금만 바뀌어도 구조가 크게 달라질 수 있음
```

트리 하나를 믿지 말고 여러 트리의 의견을 모으자.

```text
Tree1 → A
Tree2 → A
Tree3 → B
Tree4 → A
Tree5 → B

Voting

→ A
```

교재에서는 Random Subset을 이용해 여러 Random Tree를 만들고, 결과를 Voting, Bagging 방식으로 결합한다고 설명한다.

```text
Decision Tree
  ↓
불안정

Random Forest
  ↓
여러 Tree 평균
  ↓
Variance 감소
  ↓
안정성 증가
```

# 12. Boosting

Random Forest와 Boosting은 Tree 여러 개를 사용한다는 점에서는 비슷하지만 철학이 다르다.

```text
Random Forest

Tree1
Tree2
Tree3
Tree4

동시에/독립적으로 학습

→ Voting

Boosting

Tree1
 ↓
틀린 문제 확인
 ↓
Tree2가 보완
 ↓
또 틀린 문제 확인
 ↓
Tree3가 보완
```

> 이전 모델의 실수를 다음 모델이 계속 고친다.

```text
XGBoost
  → 강력한 범용 Boosting

LightGBM
  → 큰 데이터, 빠른 학습

CatBoost
  → 범주형 Feature 처리에 강점
```

교재는 CatBoost가 범주형 데이터를 전처리 없이 직접 처리할 수 있고, Ordered Boosting을 사용한다고 설명한다.

# 13. SVM은 Tree와 사고방식이 완전히 다르다

```text
○ ○ ○     |        ● ● ●
 ○ ○      |       ● ●
          |
        boundary
```

> 두 집단에서 가능한 한 멀리 떨어진 경계

즉, Maximum Margin이다.

```text
○ ○ ○ ○ ○
○ ● ● ● ○
○ ● ● ● ○
○ ○ ○ ○ ○
```

이러면 2차원에서는 나누는 게 불가능하다.

```text
2D
  ↓ Kernel
고차원 Feature Space
  ↓
Linear separation
```

이것이 Kernel Trick의 핵심 아이디어다.

중요한 Hyperparameter는 다음과 같다.

- `C`
- `gamma`

교재에서는 `gamma`가 샘플 간 거리에 얼마나 민감한지를 조절하고, `C`는 오분류에 얼마나 큰 Penalty를 줄지를 조절한다고 설명한다.

# 14. Regularization

Regularization의 철학은

> 모델에게 너무 자유롭게 공부하지 못하도록 제약을 걸어주는 것

```text
모델 자유도 ↑
  ↓
Train 데이터를 지나치게 잘 fitting
  ↓
Overfitting
```

그래서

\[
\text{Loss}+\text{Penalty}
\]

를 사용한다.

교재도 Regularization을 모델의 Parameter나 구조에 의도적으로 제한을 가해 복잡도와 Overfitting을 억제하는 방법이라고 설명한다.

## L1: LASSO

\[
\text{Penalty}=|w_1|+|w_2|+\cdots
\]

가중치 일부를 아예 \(w=0\)으로 만들어서 Feature Selection 효과를 만든다.

## L2: Ridge

\[
\text{Penalty}=w_1^2+w_2^2+\cdots
\]

가중치를 없애지는 않지만 전체적으로 작게 만든다.

```text
10
  ↓
3
  ↓
1
  ↓
0.3
```

```text
발표 슬라이드 30장 → 5장 제한

L1
  → 필요 없는 슬라이드 삭제

L2
  → 모든 슬라이드를 조금씩 줄여서 정리
```

그래서 다음과 같이 기억하면 쉽다.

```text
LASSO
  → Feature를 없앨 수 있음

Ridge
  → Feature는 유지하면서 Weight를 줄임
```

# 15. 결국 알고리즘을 어떻게 골라야 하는가?

| 상황 | 먼저 생각할 모델 |
|---|---|
| 설명 가능성이 매우 중요 | Decision Tree |
| 안정적인 baseline | Random Forest |
| 정형 데이터 최고 성능 경쟁 | XGBoost |
| 매우 큰 정형 데이터 | LightGBM |
| 범주형 변수가 많음 | CatBoost |
| 고차원 + 적은 데이터 | SVM |
| 중요한 변수만 남기고 싶음 | LASSO |
| 모든 변수를 유지하면서 규제 | Ridge |

# ML에서 중요한 것

교재에서는 실제 머신러닝 프로젝트에서 모델링 전 단계에 상당한 노력이 필요하다고 강조한다. Target, Feature 정의, 데이터 추출, 정제, Missing, Outlier 처리, Feature Extraction, Selection 등이 포함된다.

```text
좋은 Algorithm
≠
좋은 ML System

오히려

문제 정의
  → 좋은 데이터
  → Feature
  → 적절한 알고리즘
  → 평가
  → 현업 활용
```
