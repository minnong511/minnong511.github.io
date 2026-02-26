---
layout: post
title: "딥러닝 학습 루프 점검 체크리스트"
date: 2026-02-26 09:10:00 +0900
categories: [Deep_Learning]
tags: [deep-learning, training, checklist]
image: https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80
---

모델 성능이 오르지 않을 때는 아키텍처보다 학습 루프부터 점검하는 편이 효율적이다.

학습률 스케줄러, 배치 크기, 정규화, 데이터 증강을 순서대로 확인하면 원인을 빠르게 좁힐 수 있다.

특히 검증 손실이 흔들릴 때는 초기 학습률과 weight decay 조합을 먼저 조정하는 것이 체감상 가장 효과적이었다.

아래는 학습 루프 점검 전에 빠르게 sanity check로 돌려볼 수 있는 선형회귀 최소 예제다.

{% capture linear_regression_example %}
import torch
import torch.nn as nn
import torch.optim as optim

# y = 2x + 1 데이터
x = torch.tensor([[1.0], [2.0], [3.0], [4.0]])
y = torch.tensor([[3.0], [5.0], [7.0], [9.0]])

model = nn.Linear(1, 1)
criterion = nn.MSELoss()
optimizer = optim.SGD(model.parameters(), lr=0.01)

for epoch in range(300):
    pred = model(x)
    loss = criterion(pred, y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

print("weight:", model.weight.item(), "bias:", model.bias.item())
{% endcapture %}

{% include library/code-snippet.html
  title="PyTorch 선형회귀 최소 예제"
  lang="python"
  code=linear_regression_example
%}

{% capture linear_regression_formula %}
\hat{y} = wx + b,\quad
\mathcal{L}(w,b) = \frac{1}{N}\sum_{i=1}^{N}\left(y_i - (wx_i + b)\right)^2
{% endcapture %}

{% include library/latex-block.html
  title="선형회귀 목표식 (MSE)"
  formula=linear_regression_formula
%}
