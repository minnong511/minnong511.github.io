---
layout: post
title: "딥러닝 학습 문제 진단과 디버깅"
date: 2026-08-06 00:00:00 +0900
categories: [Deep_Learning, Debugging]
tags: [Deep Learning, Model Debugging, Training]
description: "Loss, 과적합, 평가 지표, 데이터 분포, Gradient, GPU 메모리 등 딥러닝 학습 문제의 진단 항목을 정리한다."
summary: "딥러닝 학습과 평가 과정에서 발생하는 주요 문제와 점검 항목을 정리한다."
legacyPath: "/deep_learning/debugging/2026/08/06/deep-learning-debugging/"
---
Loss가 줄지 않는 원인
Loss가 NaN이 되는 원인
Training Loss만 낮아지는 경우
Validation Loss가 계속 상승하는 경우
Overfitting 진단 방법
Underfitting 진단 방법
Accuracy가 높은데 모델이 쓸모없는 이유
Confusion Matrix 읽는 방법
False Positive와 False Negative 분석
Precision과 Recall 중 무엇을 봐야 하는가
Threshold 조정 방법
Class별 성능 분석
데이터 분포 변화 감지
Gradient가 사라지거나 폭발하는 경우
GPU 메모리 부족 원인
학습 속도가 느린 원인
DataLoader가 병목인 경우
모델이 배경만 학습하는 경우
Shortcut Learning
Domain Shift
