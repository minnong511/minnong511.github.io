---
layout: post
title: "분석 자동화와 파이프라인 설계"
date: 2026-08-06 00:00:00 +0900
categories: [Deep_Learning, Basic]
tags: [Deep Learning, PipeLine]
description: "개추"
summary: "개추."
legacyPath: "/deep_learning/basic/2026/08/06/ML_Pipeline2/"
---
> ## 기술 중심이 아닌 문제 해결 중심
> ### 좋은 분석은 올바른 문제 정의에서 시작

## 1) 왜

### 반복 작업을 사람이 계속할 필요는 없다

매주 같은 데이터를 받아 같은 전처리, 통계, 차트를 반복한다면 자동화 대상이다. 수작업 복붙을 줄이면 실수도 줄고, 같은 입력에 같은 코드를 실행하는 **재현 가능한 분석**으로 바꿀 수 있다.

### 분석은 최신성이 중요하다

어제의 시황, 뉴스, 산업 데이터를 오늘 아침 다시 사람이 정리하기 시작한다면 이미 늦다. 반복 작업은 `schedule`, cron 같은 스케줄러로 실행 시점을 정할 수 있다. Python `schedule`도 일·시간 단위 작업 등록을 지원한다.

**핵심: 자동화의 목적은 편하게 일하는 것이 아니라, 반복 분석을 빠르고 동일하게 재생산하는 것이다.**

## 2) 어떻게

### 분석 단계를 파이프라인으로 나눈다

좋은 구조는 간단하다.

```text
수집 → 전처리 → 분석 → 시각화 → 리포트 → 저장
```

각 단계를 함수로 분리하고 오류를 기록한다. 분석이 반복되기 시작하면 Notebook에 있던 검증된 함수를 `src/`로 이동한다.

```text
data-project/
├── data/
├── notebooks/
├── src/
├── tests/
└── README.md
```

Notebook은 EDA·실험, `.py`는 반복 실행·테스트·CI 대상으로 역할을 나누는 것이 핵심이다.

### 실행과 리포트까지 자동화한다

`Jinja2`는 데이터와 템플릿을 결합해 HTML 같은 최종 문서를 생성할 수 있는 템플릿 엔진이다. 분석 결과와 차트를 템플릿에 넣으면 매번 보고서를 다시 작성할 필요가 없다.

Notebook 결과는 원문에서 사용한 명령 그대로 HTML로 변환할 수 있다.

```bash
$ jupyter nbconvert --to html notebooks/01_eda.ipynb
```

`nbconvert`는 `.ipynb`를 HTML 등 정적 형식으로 변환한다.

**핵심: 자동화는 하나의 거대한 코드가 아니라, 독립된 단계를 순서대로 연결하는 것이다.**

## 3) 효과

### 재현성과 협업성이 올라간다

`requirements.txt + .env 예시 + README`가 있으면 다른 사람이 실행 환경과 실행 방법을 파악하기 쉬워진다. 원본 데이터는 `data/raw/`에 두고 직접 수정하지 않으며, Git에는 데이터 대신 출처와 생성 방법을 기록한다.

### 검증까지 자동화할 수 있다

분석 코드를 GitHub에 올렸다면 `pytest`를 GitHub Actions와 연결해 Push나 Pull Request 시 자동 검증할 수 있다. GitHub 공식 문서에서도 Python 프로젝트의 의존성 설치와 pytest 실행을 CI workflow로 구성하는 방법을 제공한다.

결국 흐름은 다음과 같다.

```text
Notebook에서 탐색
      ↓
함수화
      ↓
src/ 모듈화
      ↓
자동 실행
      ↓
리포트 생성
      ↓
테스트 / CI
```

**핵심: 재현 가능한 분석이 쌓이면 개인 스크립트가 팀이 신뢰할 수 있는 분석 파이프라인이 된다.**

## 추가로 해볼 수 있는 것

- `schedule`로 매일 같은 시간에 분석 스크립트 자동 실행
- Jinja2에 Plotly 차트를 넣어 HTML 리포트 자동 생성
- GitHub Actions에 `pytest + Ruff`를 연결해 분석 코드 자동 검증
