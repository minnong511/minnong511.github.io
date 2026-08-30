---
layout: post
title: "딥러닝 모델 경량화와 추론 최적화"
date: 2026-08-06 00:00:00 +0900
categories: [Deep_Learning, Technics]
tags: [Deep Learning, Model Optimization, Quantization, Pruning]
description: "Quantization, Pruning, Knowledge Distillation, ONNX, TensorRT 등 모델 경량화와 추론 최적화 기법을 정리한다."
summary: "딥러닝 모델의 정확도와 추론 속도를 함께 고려하는 경량화 기법을 정리한다."
legacyPath: "/deep_learning/technics/2026/08/06/model-optimization/"
---
모델 파라미터 수와 실제 속도는 같은가
FLOPs와 Latency의 차이
Quantization 기본
FP32, FP16, BF16, INT8
Post-Training Quantization
Quantization-Aware Training
Dynamic과 Static Quantization
Per-tensor와 Per-channel Quantization
Pruning
Structured와 Unstructured Pruning
2:4 Sparsity
Knowledge Distillation
Low-rank Decomposition
ONNX 변환
TensorRT 최적화
Operator Fusion
Batch Inference
Edge Deployment
CPU, GPU, NPU 추론 비교
모델 정확도–속도 Trade-off
