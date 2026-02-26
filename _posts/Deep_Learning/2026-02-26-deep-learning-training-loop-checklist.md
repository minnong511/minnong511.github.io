---
layout: post
title: "딥러닝 학습 루프 점검 체크리스트"
date: 2026-02-26 09:10:00 +0900
categories: [Deep_Learning]
image: /assets/base_image/test_image.png
---

모델 성능이 오르지 않을 때는 아키텍처보다 학습 루프부터 점검하는 편이 효율적이다.

학습률 스케줄러, 배치 크기, 정규화, 데이터 증강을 순서대로 확인하면 원인을 빠르게 좁힐 수 있다.

특히 검증 손실이 흔들릴 때는 초기 학습률과 weight decay 조합을 먼저 조정하는 것이 체감상 가장 효과적이었다.
