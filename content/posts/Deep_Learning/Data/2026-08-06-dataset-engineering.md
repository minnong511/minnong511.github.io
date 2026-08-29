---
layout: post
title: "딥러닝 데이터셋 엔지니어링"
date: 2026-08-06 00:00:00 +0900
categories: [Deep_Learning, Data]
tags: [Deep Learning, Dataset Engineering, Data Augmentation]
description: "데이터 분리, 불균형, 증강, 라벨 노이즈, 중복 데이터와 데이터셋 버전 관리 방법을 정리한다."
summary: "딥러닝 성능을 좌우하는 데이터셋 구성과 검증 방법을 정리한다."
legacyPath: "/deep_learning/data/2026/08/06/dataset-engineering/"
---
좋은 데이터셋의 조건
Class Imbalance란 무엇인가
Train과 Validation 데이터 누수를 방지하는 방법
이미지 크기를 통일해야 하는 이유
Normalization과 Standardization
Data Augmentation 기본
데이터 증강을 많이 하면 항상 좋은가
Label Noise가 성능에 미치는 영향
잘못된 라벨을 찾는 방법
Duplicate Image가 평가 결과를 왜곡하는 이유
Stratified Split과 Group Split
실제 환경을 반영한 데이터 분리 전략
Hard Example Mining
Synthetic Data 활용 방법
데이터셋 버전 관리

모델 성능이 안 나올 때 모델부터 바꾸면 안 되는 이유
mAP가 높은데 실제 영상에서는 탐지가 안 되는 이유
데이터 증강이 오히려 성능을 떨어뜨리는 경우
Validation 성능은 좋은데 Test 성능이 낮은 이유
