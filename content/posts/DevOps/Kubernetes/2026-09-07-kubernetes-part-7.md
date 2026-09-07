---
title: "7. 쿠버네티스 로드 밸런싱, 요청을 따라가 보자"
description: "요청 칩을 따라 Load Balancer의 대상 선택, Ingress의 규칙 판단, Ready Pod의 상품 응답을 보고 관리형 쿠버네티스와 EKS의 운영 책임을 비교한다."
date: "2026-09-07 08:06:00 +0900"
categories: ["DevOps","Kubernetes"]
tags: [Kubernetes, LoadBalancer, Ingress, Service, EndpointSlice, Readiness, EKS, 관리형쿠버네티스, 시각화]
series: "직접 실험하는 Kubernetes"
part: 7
summary: "Pod가 바뀌어도 사용자는 고정된 주소로 접근하고, 시스템은 요청을 처리할 준비가 된 Pod로 연결한다."
legacyPath: "/ci-cd-docker/kubernetes/part-7/"
---

## 요청 흐름 실험

::kubernetes-flow-diagram{diagram="request"}
::

## 관리형 쿠버네티스와 EKS

::kubernetes-flow-diagram{diagram="managed"}
::

[5편, Service와 요청 경로](/ci-cd-docker/kubernetes/part-5/) · [6편, 설정과 운영](/ci-cd-docker/kubernetes/part-6/) · [시리즈 전체 목차](/ci-cd-docker/kubernetes/part-1/)
