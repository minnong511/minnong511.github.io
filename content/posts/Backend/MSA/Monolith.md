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

5. 프로젝트가 커지면 Monolith에서 무슨 문제가 생기는가?

Coupling(결합도)

처음에는 이런 구조였다고 치자, 
User
Order
Payment
Product

각 기능이 자기 책임만 가지고 있으면 별 문제가 없지만, 
아시다시피.. 개발을 하다보면 다른 영역의 개체를 건드리기 시작한다. 

OrderService
 ├─ UserRepository
 ├─ ProductRepository
 └─ PaymentService

 PaymentService
 ├─ OrderRepository
 └─ UserRepository

 이렇게 서로가 서로를 참조하게 되고, 

 User
 ↕
Order
 ↕
Payment
 ↕
Product

처럼 서로 얽히는 문제가 발생한다. 

(Spaghetti Code라고 들어봤을 터다)

하지만 중요한 점은, 

이것은 Monolith이기 때문에 반드시 발생하는 문제가 아니다.
이는 하나의 애플리케이션 내부에서 모듈 간 경계를 제대로 관리하지 않았기 때문에 발생하는 문제이다. 

# 6. 그렇다면 결합도가 높아지면 왜 문제가 되는 것일까? 

위의 상황을 예시로 OrderService를 수정했다고 쳐보자. 

그런데 Order가 

Order
-> payment 
-> User 
-> Product

와 강하게 연결되어 있는 경우에는 

Order 하나를 변경했는데 Payment까지 영향을 받을 수 있다.

작은 변경
    ↓
영향 범위 증가
    ↓
테스트 범위 증가
    ↓
배포 위험 증가

내가 변경한 것이 어디까지 영향을 미치는지 추적을 하기가 어려워지는 것이다. 

(이러한 거대한 Monolith에서 자주 발생한다고 한다.)

7. Monolith는 Deployunit이 하나 

Monolith에서 중요한 특징은 Deployment Unit이 하나라는 것

User 
Product
Order 
Payment 
Recommend 

중 Recommend 코드 한 줄만 수정했다고 하자.

이러면 

전체 Application Build

        ↓

shop.jar

        ↓

전체 Application Deploy

이렇게 전체 Deploy를 때려야 하는 문제가 있다. 

Recommend만 바꿨는데 전체 쇼핑몰 Backend를 다시 배포해야 하는 것이다.

시스템 규모가 작으면 큰 문제가 아니다.

하지만 애플리케이션이 매우 커지면 Build, Test, Deploy 비용도 같이 증가한다. 

이것도 비용이기에, 결국은 고려해야 한다. 

# 8. Scaling에서도 문제가 생길 수 있다

예를 들어 쇼핑몰에서 갑자기 상품 조회 요청이 폭증

실제로 부하가 높은 부분은 Product

하지만 Monolith가 하나의 Application이라면 보통

[User + Product + Order + Payment]
[User + Product + Order + Payment]
[User + Product + Order + Payment]

처럼 애플리케이션 전체를 복제해서 Scale-Out 해야한다. 

실제로 필요한 것은

Product
Product
Product
Product

인데 말이지... 따라서 기능마다 필요한 컴퓨팅 자원이 크게 다르면 비효율이 발생할 수 있다

# 9. 근데 Monolith는 왜 씀? 

그렇다면

> Monolith = 나쁜 아키텍처
> MSA = 좋은 아키텍처

일까? 그것은 당연히 아니다. 

프로젝트의 목적성에 맞게 골라야 한다. 

오히려 규모가 작은 서비스에서 MSA를 사용하면 불필요하게 복잡해질 수 있다.

그냥 Monolith에서는 간단하게 처리할 수 있는 것을 

하지만 서비스를 분리하면 고민해야 할 것들이 많아진다. 

Monolith 

OrderService → PaymentService

이런거는 paymentService.pay();와 같이 메서드로 처리하면 된다. 

MSA로 구현하면 아래와 같이 구현해야 하고, 고민해야 할 것들도 많아진다.

Order Service

      ↓ HTTP / Kafka

Payment Service

Network Failure
Timeout
Retry
Circuit Breaker
Service Discovery
Distributed Logging
Distributed Transaction
Message Queue
Monitoring
Deployment

다시 한 번 정리해보자면 

> MSA는 복잡성을 제거하는 것이 아니라 복잡성의 위치를 바꾸는 것

절대로 만능인 것은 없다. 

프로젝트의 목적성에 맞게, 어려운 지점이 무엇일지 잘 고민해서 선택하면 된다. 

# 10. 그래서 좋은 Monolith는 어떻게 만드는가?

여기서 등장하는 생각이 Modular Monolith이다
이거는 다음 장에서 설명하겠다.
