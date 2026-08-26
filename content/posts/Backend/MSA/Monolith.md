---
layout: post
title: "1. Monolith"
description: "단어의 유래 Monolith"
date: "2026-08-26 14:08:02 +0900"
categories: ["Backend", "MSA"]
tags: []
legacyPath: "/backend/msa/2026/08/26/Monolith/"
---
# 1. Monolith 

단어의 유래 
Monolith 

mono = 하나
lith = 돌

원래는 하나의 거대한 돌이라는 뜻 

건축물의 거대한 단일 석재를 생각하면 된다. 

소프트웨어에서는 

여러 기능이 하나의 애플리케이션 안에 들어있고, 하나의 단위로 빌드, 배포되는 구조를 뜻한다. 

# 2. Monolith의 핵심 철학 

사실 Monolith의 핵심 철학 자체가 

> “다 때려 넣자”

이게 아니다. 

좀 더 정확하게 말하자면, 

> 하나의 프로그램 안에서 기능들을 함께 관리하고 함께 배포한다.

이게 핵심 철학이다. (비빔밥처럼 막 쓰가는게 아님)

쇼핑몰 Backend

┌─────────────────────────────┐
│      Spring Boot App        │
│                             │
│ User                        │
│ Product                     │
│ Order                       │
│ Payment                     │
│ Recommend                   │
│                             │
└─────────────────────────────┘
              ↓
             DB

아 물론 

코드가 패키지별로 잘 분리되어 있을 수 있다. 

com.shop
 ├─ user
 ├─ product
 ├─ order
 ├─ payment
 └─ recommend

결국은  

하나의 JAR

하나의 Application

하나의 배포

라면

일반적으로 Monolith라고 한다. 

# 3. 그러면 왜 Monolith를 쓰는가? 

가장 큰 이유는 단순함 

예를 들어 쇼핑몰을 처음 만든다고 치자 

MSA라면 처음부터 

User Service
Product Service
Order Service
Payment Service

를 각각 만들어야 한다. 

다만

서비스 통신
서비스 검색
인증
네트워크
Docker
로그 수집
Kafka
분산 트랜잭션
배포
Monitoring

까지 고민해야 한다. 

반면 Monolith는: 

Frontend -> Spring Boot -> Database 

정도로 할 수 있다. 

즉 금방 개발 할 수 있다는 것이다. 

그래서 초기 개발이 아주 빠르다. 

# 4. 그러면 Monolith는 어떻게 설계하는가? 

Monolith는 대충 설계해도 되는거 아닌가..?

라는 굉장히 중요한 오해를 할 수 있음 

실제로는 설계를 잘 해야 하낟. 

> Monolith라고 구조 없이 만들면 안 된다. 

좋은 Monolith는 내부적으로 책임을 분리

Application

User Domain
 ├─ UserController
 ├─ UserService
 └─ UserRepository

Order Domain
 ├─ OrderController
 ├─ OrderService
 └─ OrderRepository

Payment Domain
 ├─ PaymentController
 ├─ PaymentService
 └─ PaymentRepository

모놀리식의 핵심 철학은 

 물리적으로는 하나

논리적으로는 여러 책임

다만 문제는 프로젝트 규모가 커지기 시작하면서 

서로가 서로를 참조하기 시작하게 되는 것

OrderService
 ↓
UserRepository
 ↓
PaymentService
 ↓
ProductRepository
 ↓
OrderRepository
 ↓
UserService

서로 막 참조하기 시작하게 된다.
