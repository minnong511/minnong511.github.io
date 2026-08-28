---
layout: post
title: "Modular Monolith"
description: "Modular Monolith"
date: "2026-08-26 14:08:02 +0900"
categories: ["Backend", "MSA"]
tags: []
legacyPath: "/backend/msa/2026/08/26/Modular_Monolith/"
---

# 1. Modular Monolith 

기존 Monolith처럼 하나의 Application, Build, Deployment를 유지한다.

다만, 내부에서는 경계를 강하게 나눈다. 

┌─────────────────────────────┐
│         Application         │
│                             │
│  ┌─────────┐ ┌───────────┐  │
│  │  User   │ │   Order   │  │
│  └─────────┘ └───────────┘  │
│                             │
│  ┌─────────┐ ┌───────────┐  │
│  │ Payment │ │  Product  │  │
│  └─────────┘ └───────────┘  │
│                             │
└─────────────────────────────┘

여기서 중요한 것은 

Order → UserRepository 직접 접근을 막고

Order → User가 공개한 Interface 처럼 명확한 경계를 통해 통신하게 하는 것

이와같이 Modular Monolith의 핵심은 

물리적인 배포 단위는 하나지만
논리적인 모듈의 경계는 명확하게 만든다.

이게 핵심 ㅇㅇ

# 2. 왜 Modular Monolith를 사용하는가? 

일반적인 Monolith의 가장 큰 장점은 단순함. 

Frontend
   ↓
Spring Boot
   ↓
Database

서비스가 하나이기 때문에 