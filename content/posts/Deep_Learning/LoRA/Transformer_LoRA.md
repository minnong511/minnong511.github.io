---
layout: post
title: "Transformer에서 LoRA 적용 대상 정하기"
description: "Transformer의 Attention과 MLP에서 LoRA를 적용할 Projection과 적용 범위를 정리한다."
date: "2026-08-29 15:28:08 +0900"
categories: ["Deep_Learning", "LoRA"]
tags: ["Deep Learning", "Transformer", "LoRA", "PEFT"]
legacyPath: "/deep_learning/lora/2026/08/29/transformer-lora/"
---

v_proj

Wv + ΔWv

# 16. 처음에는 왜 q_proj와 v_proj 이야기가 많이 나오는가

원래 LoRA 논문에서는 Attention의 특정 Projection에 LoRA를 적용하는 실험을 많이 했다. 

그래서 흔히 

q_proj
v_proj

에 적용하는 설정을 볼 수 있다. 

현재 LLM Fine-Tuning에서는 좀 더 넓게

q_proj
k_proj
v_proj
o_proj

gate_proj
up_proj
down_proj

쉽게 이야기 해서 

Attention만 수정

vs

Attention + MLP까지 수정


일단 당장은 추가하지 말고, MSA부터 추가하자
