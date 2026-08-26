---
layout: post
title: "분산 학습과 MLOps"
date: 2026-08-06 00:00:00 +0900
categories: [Deep_Learning, Technics]
tags: [Deep Learning, Distributed Training, MLOps]
description: "멀티 GPU 분산 학습 방식과 실험 관리, 모델 배포, 모니터링, 재학습 파이프라인을 정리한다."
summary: "딥러닝 분산 학습 기술과 운영 단계의 MLOps 핵심 항목을 정리한다."
legacyPath: "/deep_learning/technics/2026/08/06/distributed-training-mlops/"
---
Single GPU와 Multi-GPU
Data Parallelism
Distributed Data Parallel
Model Parallelism
Tensor Parallelism
Pipeline Parallelism
Fully Sharded Data Parallel
ZeRO Optimization
Gradient Checkpointing
Distributed Checkpoint
DeepSpeed
실험 관리
모델 및 데이터 버전 관리
학습 로그 관리
배포 후 성능 모니터링
Data Drift와 Model Drift
재학습 파이프라인
A/B Test
Canary Deployment
모델 롤백
