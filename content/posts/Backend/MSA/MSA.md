---
layout: post
title: "MSA, 서비스 분리와 운영의 원리"
description: "모놀리식에서 MSA로 전환할 때 알아야 할 서비스 경계, 통신, 데이터, 장애 대응, 운영 원칙을 정리한다."
date: "2026-08-26 14:08:02 +0900"
categories: ["Backend", "MSA"]
tags: ["MSA", "Microservices", "Kafka", "Docker", "Kubernetes", "Saga"]
legacyPath: "/backend/msa/2026/08/26/MSA1/"
---

# MSA, 서비스 분리와 운영의 원리

MSA(Microservices Architecture)는 하나의 큰 애플리케이션을 작고 독립적인 서비스들로 나누어 개발하고 운영하는 아키텍처다. 핵심은 코드를 폴더별로 분리하는 데 있지 않다. 각 서비스가 자신의 비즈니스 책임, 실행 환경, 배포 주기, 데이터의 소유권을 독립적으로 갖도록 만드는 것이 목적이다.

~~~text
모놀리식

┌──────────────────────────────┐
│         Application          │
│                              │
│  User, Order, Payment,       │
│  Product, Delivery           │
│                              │
└──────────────────────────────┘
               │
               ▼
          하나의 배포

MSA

┌────────┐  ┌────────┐  ┌──────────┐
│  User  │  │ Order  │  │ Payment  │
└────────┘  └────────┘  └──────────┘
     │            │            │
 독립 배포      독립 배포      독립 배포
~~~

처음부터 MSA가 정답은 아니다. 기능과 팀 규모가 작은 단계에서는 모놀리식이 개발과 배포가 더 단순하다. 하지만 서비스가 커지고 변경, 배포, 확장, 장애의 영향 범위를 줄여야 할 때 MSA가 강점을 보인다.

---

## 1. 서비스 경계와 독립성

### MSA가 해결하려는 문제

모놀리식에서 결제 기능만 수정해도 하나의 애플리케이션 전체를 빌드, 테스트, 배포해야 할 수 있다.

~~~text
결제 코드 수정
    ↓
전체 애플리케이션 빌드와 테스트
    ↓
전체 애플리케이션 배포
    ↓
주문, 회원, 배송 기능에도 영향 가능
~~~

MSA에서는 결제 서비스만 변경하고 배포할 수 있다.

~~~text
Payment Service 수정
    ↓
Payment만 빌드와 테스트
    ↓
Payment만 배포
~~~

따라서 MSA의 중요한 목표는 변경의 영향 범위를 작게 만들고, 장애와 확장의 단위를 서비스별로 분리하는 것이다.

### 서비스는 기술 계층이 아니라 비즈니스 책임으로 나눈다

다음처럼 기술 계층을 기준으로 서비스를 나누는 것은 좋은 MSA 분리가 아니다.

~~~text
Controller Service
Repository Service
Utility Service
~~~

이 구조에서는 하나의 비즈니스 기능을 처리할 때 여러 서비스를 반드시 거쳐야 하므로 오히려 결합도가 높아진다. 대신 업무 책임을 기준으로 나눈다.

~~~text
User Service       회원 관리
Order Service      주문 생성, 상태 관리, 취소, 조회
Payment Service    결제 요청, 승인, 취소, 환불
Inventory Service  재고 관리
Delivery Service   배송 생성과 상태 관리
~~~

이처럼 한 서비스가 책임지는 업무 범위를 Bounded Context라고 한다. 예를 들어 주문 서비스는 주문 상태를 관리하지만 결제 승인 내부 로직이나 결제 테이블을 직접 다루지 않는다.

~~~text
나쁜 구조

Order Service ─────> Payment DB 직접 접근

좋은 구조

Order Service ── API 또는 Event ──> Payment Service ──> Payment DB
~~~

각 데이터의 주인은 그 데이터를 담당하는 서비스다. 다른 서비스는 공개된 API나 이벤트를 통해 필요한 정보를 얻어야 한다.

### 기본적인 쇼핑몰 구조

~~~text
                        Client
                          │
                          ▼
                   ┌─────────────┐
                   │ API Gateway │
                   └──────┬──────┘
                          │
          ┌───────────────┼─────────────────┐
          ▼               ▼                 ▼
     User Service    Order Service    Product Service
          │               │                 │
          ▼               ▼                 ▼
       User DB         Order DB          Product DB
                          │
                          ▼
                   Payment Service
                          │
                          ▼
                      Payment DB
~~~

각 서비스는 보통 별도의 애플리케이션 프로세스이며, 독립적으로 빌드하고 배포할 수 있다.

---

## 2. 서비스 통신과 데이터 소유권

모놀리식에서는 같은 프로세스 안에서 메서드를 호출할 수 있다.

~~~java
paymentService.pay(order);
~~~

MSA에서는 주문과 결제 서비스가 서로 다른 프로세스에 있으므로 네트워크를 통해 통신해야 한다. 대표적인 선택지는 동기 통신과 비동기 통신이다.

### 동기 통신: 즉시 응답이 필요할 때

주문 서비스가 결제를 요청하고 그 결과를 바로 받아야 한다면 REST나 gRPC 같은 동기 통신을 쓸 수 있다.

~~~text
Order Service
      │
      │ HTTP POST /payments
      ▼
Payment Service
      │
      │ Response
      ▼
Order Service
~~~

~~~http
POST /payments
Content-Type: application/json
~~~

~~~json
{
  "orderId": 1001,
  "price": 50000
}
~~~

~~~json
{
  "paymentId": 771,
  "status": "SUCCESS"
}
~~~

동기 통신은 흐름이 직관적이고 결과를 즉시 확인할 수 있다는 장점이 있다. 반면 결제 서비스가 느리거나 장애 상태이면 주문 서비스도 응답을 기다리게 된다. 즉, 서비스 사이에 시간적 의존성이 생긴다.

### 비동기 통신: 결합도를 낮추고 확장할 때

주문이 생성됐다는 사실만 전달하고, 이후 처리는 각 서비스가 알아서 수행해도 된다면 이벤트 기반 통신을 사용할 수 있다.

~~~text
Order Service
      │
      │ OrderCreated 이벤트 발행
      ▼
    Message Broker
      │
 ┌────┼─────────────┐
 ▼    ▼             ▼
Payment Delivery Analytics
~~~

~~~json
{
  "event": "OrderCreated",
  "orderId": 1001,
  "userId": 17,
  "price": 50000
}
~~~

Order Service는 이벤트를 발행할 뿐이며, Payment나 Delivery가 어떻게 처리하는지 직접 알 필요가 없다. Kafka나 RabbitMQ 같은 메시지 브로커는 다음 효과를 제공한다.

- 결합도 감소: Producer와 Consumer가 서로를 직접 알 필요가 없다.
- 버퍼링: 소비자가 잠시 느려도 메시지를 보관할 수 있다.
- 팬아웃: 하나의 이벤트를 여러 소비자가 처리할 수 있다.
- 장애 격리: 소비자 하나의 장애가 발행자를 즉시 멈추게 하지 않는다.
- 재처리: 저장된 이벤트를 다시 읽을 수 있다.

MSA가 곧 Kafka라는 뜻은 아니다. Kafka는 서비스 간 결합도를 낮추기 위한 여러 선택지 중 하나다.

---

## 3. 분산 데이터와 장애 대응

### Database per Service

MSA에서는 보통 서비스가 자신의 데이터를 직접 소유한다.

~~~text
User Service    ──> User DB
Order Service   ──> Order DB
Payment Service ──> Payment DB
~~~

Order Service가 Payment DB의 테이블을 직접 수정하면 서비스 경계가 무너진다. 결제 정보가 필요하면 Payment API를 호출하거나 Payment가 발행한 이벤트를 소비해야 한다.

### 분산 트랜잭션과 Saga

하나의 데이터베이스를 쓰는 모놀리식에서는 여러 작업을 하나의 트랜잭션으로 묶을 수 있다.

~~~sql
BEGIN;

INSERT INTO orders (...);
INSERT INTO payments (...);
UPDATE inventory SET quantity = quantity - 1 WHERE product_id = ...;

COMMIT;
~~~

작업 중 하나가 실패하면 ROLLBACK으로 전체를 되돌릴 수 있다. 하지만 MSA에서는 주문, 결제, 재고가 서로 다른 데이터베이스에 있어 하나의 로컬 트랜잭션으로 묶기 어렵다.

~~~text
주문 생성 성공
    ↓
결제 성공
    ↓
재고 차감 실패
~~~

이때 Saga 패턴은 이미 성공한 작업을 데이터베이스 롤백이 아니라 비즈니스 보상 작업으로 되돌린다.

~~~text
재고 차감 실패
    ↓
결제 취소 또는 환불
    ↓
주문 취소
~~~

Saga는 여러 로컬 트랜잭션과 보상 트랜잭션을 조합해 최종적인 일관성을 맞추는 방법이다. 중간 상태가 잠시 존재할 수 있으므로, 상태 전이와 실패 시나리오를 처음부터 설계해야 한다.

### 네트워크 실패는 정상적인 경우다

서비스 내부 메서드 호출과 달리 네트워크 호출은 언제든 실패할 수 있다.

~~~text
Timeout
서비스 다운
DNS 또는 로드 밸런서 문제
메시지 브로커 장애
일시적인 네트워크 오류
~~~

따라서 MSA에서는 다음 장치들을 조합해 장애 전파를 줄인다.

|기법|역할|주의점|
|---|---|---|
|Timeout|정해진 시간 뒤 대기를 멈춘다|너무 길면 스레드와 연결이 고갈된다|
|Retry|일시적인 오류를 재시도한다|중복 요청을 고려해야 한다|
|Idempotency|같은 요청을 여러 번 처리해도 결과를 같게 만든다|고유 요청 ID가 필요하다|
|Circuit Breaker|반복 실패한 서비스 호출을 잠시 차단한다|복구 확인을 위한 반열림 상태가 필요하다|
|Bulkhead|리소스를 분리해 한 기능의 고갈이 전체로 퍼지는 것을 막는다|자원 한도를 정해야 한다|
|Message Queue|처리량 급증과 일시 장애를 완충한다|지연 처리와 재시도 정책이 필요하다|

예를 들어 결제 요청에는 고유한 요청 ID를 두어 재시도해도 중복 결제가 생기지 않게 한다.

~~~text
첫 요청: paymentRequestId = abc123, 결제 성공
재시도: paymentRequestId = abc123, 이미 처리한 결과 반환
~~~

이 장치들이 없으면 결제 장애가 주문 서비스의 대기 증가로 이어지고, 주문의 스레드와 연결이 고갈된 뒤 게이트웨이까지 영향을 받는 연쇄 장애가 발생할 수 있다.

---

## 4. 독립 확장과 실행 플랫폼

### 필요한 서비스만 확장하기

서비스별 트래픽이 다르면 MSA는 필요한 서비스만 수평 확장할 수 있다.

~~~text
요청량
User       1,000 requests/sec
Order      5,000 requests/sec
Product   50,000 requests/sec
Payment    3,000 requests/sec

확장 예시
User Service      2 instances
Order Service     5 instances
Product Service  30 instances
Payment Service   4 instances
~~~

예를 들어 Product Service 인스턴스 한 대가 초당 1,000개 요청을 처리하고 초당 10,000개 요청을 받아야 한다면, 단순 계산으로 약 10개 인스턴스가 필요하다.

~~~text
필요 인스턴스 수 = 목표 처리량 / 인스턴스당 처리량
                  = 10,000 / 1,000
                  = 10
~~~

이처럼 인스턴스를 늘려 처리 능력을 키우는 방식을 수평 확장이라고 한다.

### Docker와 Kubernetes

서비스 수가 늘어나면 Java 버전, 라이브러리, 환경 변수, 실행 방법을 일관되게 관리하기 어려워진다. Docker는 애플리케이션과 실행 환경을 이미지로 묶어 배포 단위를 표준화한다.

~~~text
Order Service + JDK + Library + Runtime
                    ↓
              Docker Image
                    ↓
             Order Container
~~~

컨테이너가 수백 개 이상으로 늘어나면 Kubernetes 같은 오케스트레이션 도구가 배포, 재시작, 확장, 서비스 발견, 로드 밸런싱, 롤링 업데이트, 헬스 체크를 자동화한다.

Docker나 Kubernetes를 쓴다고 MSA가 되는 것은 아니다. 이 도구들은 독립적인 서비스를 운영하기 쉽게 만들어 주는 운영 도구다.

### API Gateway와 Service Discovery

클라이언트가 수십 개 서비스의 주소를 모두 알아야 하면 사용과 변경 관리가 어렵다. API Gateway는 외부 요청의 단일 진입점이 되어 라우팅, 인증, 인가, 속도 제한, 로깅, TLS 종료를 담당한다.

~~~text
                 Client
                   │
                   ▼
             API Gateway
              /    |    \
             ▼     ▼     ▼
           User  Order Payment
~~~

컨테이너 환경에서는 인스턴스의 IP가 계속 바뀔 수 있다. Service Discovery는 payment-service 같은 논리적 이름으로 현재 정상인 인스턴스를 찾게 해 준다.

---

## 5. 관측 가능성과 시스템 전체 흐름

MSA에서는 요청 하나가 여러 서비스를 지나고 로그도 여러 곳에 흩어진다. 따라서 운영을 위해 로그, 메트릭, 트레이스를 함께 수집해야 한다.

|신호|무엇을 보는가|예시|
|---|---|---|
|Logs|개별 사건의 상세 기록|결제 실패, 주문 ID 1001|
|Metrics|시간에 따른 수치|CPU 80%, 오류율 3%, 지연 시간 120ms|
|Traces|요청이 지나간 전체 경로|Gateway -> Order -> Payment -> DB|

~~~text
요청 ID: abc123

Gateway   10ms
    ↓
Order     25ms
    ↓
Payment  300ms
    ↓
DB        50ms
~~~

트레이스를 보면 Payment 구간이 병목이라는 사실을 빠르게 찾을 수 있다.

전체 구조를 단순화하면 다음과 같다.

~~~text
                        Client
                          │
                          ▼
                    API Gateway
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
           User         Order       Product
             │            │            │
             ▼            ▼            ▼
           DB           DB           DB
                          │
                          ▼
                    Message Broker
                    /      |       \
                   ▼       ▼        ▼
              Payment   Delivery  Analytics
                 │          │
                 ▼          ▼
                 DB         DB

운영 계층: Docker, Kubernetes
관측 계층: Logs, Metrics, Traces
~~~

---

## 6. MSA를 선택하기 전에

MSA는 배포와 확장, 장애 격리의 단위를 작게 만들 수 있지만 네트워크 지연, 부분 실패, 분산 트랜잭션, 운영 복잡성도 함께 가져온다. 서비스가 작다고 해서 항상 마이크로서비스가 되는 것은 아니다.

|구분|Monolith|Modular Monolith|MSA|
|---|---|---|---|
|애플리케이션과 프로세스|하나|하나|여러 개|
|배포|한 번에 배포|한 번에 배포|서비스별 독립 배포|
|모듈 경계|약할 수 있음|강하게 설계 가능|네트워크 경계로 강제됨|
|통신|함수 호출|함수와 인터페이스|네트워크와 메시지|
|데이터베이스|보통 하나|보통 하나|서비스별 소유|
|확장|전체 확장|전체 확장|서비스별 확장|
|운영 난이도|낮음|중간|높음|

### MSA가 만드는 비용

서비스를 분리하면 함수 호출은 네트워크 호출이 된다. 직렬화, 네트워크 전송, 라우팅, 역직렬화가 추가되므로 속도와 실패 가능성 모두 달라진다.

~~~text
Monolith: Function Call

MSA: Serialization -> Network -> Routing -> Server -> Deserialization
~~~

또한 데이터베이스가 분리되면 서비스 간 테이블을 직접 조인할 수 없다.

~~~sql
-- 모놀리식에서는 하나의 DB에서 조인할 수 있다.
SELECT *
FROM orders o
JOIN users u ON o.user_id = u.id;
~~~

MSA에서는 API 호출, 이벤트로 데이터 복제, CQRS 읽기 모델, 데이터 웨어하우스 같은 별도 설계가 필요하다. 이벤트가 전달되는 동안 서비스의 상태가 잠시 다를 수 있으며, 이를 최종 일관성이라고 한다.

~~~text
10:00:00.000  Order = PAID
10:00:00.100  OrderCreated 또는 PaymentCompleted 이벤트 전달
10:00:00.300  Delivery = READY
~~~

즉, 모든 서비스의 상태가 언제나 즉시 같을 수는 없지만, 이벤트 처리가 끝나면 일관된 상태에 도달하도록 설계한다.

테스트와 운영의 비용도 증가한다. 서비스가 많아지면 단위 테스트뿐 아니라 통합 테스트, 계약 테스트, 종단 간 테스트가 필요하며, 저장소, CI/CD 파이프라인, 배포, 로그, 모니터링 대상도 서비스 수만큼 늘어난다.

### 언제 MSA가 적합한가

다음 상황에서는 MSA의 이점이 비용보다 클 가능성이 높다.

- 팀이 여러 개이고 도메인별 소유권이 명확하다.
- 서비스별 배포 주기나 기술 요구가 크게 다르다.
- 특정 서비스에만 매우 높은 트래픽이 발생해 독립 확장이 필요하다.
- 한 서비스의 장애가 전체 서비스로 번지지 않도록 강하게 격리해야 한다.
- 주문, 결제, 배송처럼 비즈니스 경계와 데이터 소유권이 충분히 명확하다.
- 자동화된 배포와 모니터링, 장애 대응을 운영할 역량이 있다.

반대로 팀과 서비스가 작고 도메인 경계가 계속 바뀌며 트래픽도 크지 않다면 MSA는 과한 설계가 될 수 있다.

~~~text
개발자 3명
사용자 1,000명
도메인 복잡도 낮음
서비스 경계가 아직 불분명함
~~~

이런 단계에서는 모듈 경계를 잘 지킨 Modular Monolith가 더 현실적인 출발점이다. 애플리케이션 내부에서 기능을 분리해 두고, 변경 주기, 트래픽, 조직 소유권이 분명해진 모듈부터 독립 서비스로 꺼내면 된다.

~~~text
Monolith
    ↓
모듈 경계 명확화
    ↓
Modular Monolith
    ↓
분리 가치가 큰 모듈부터 추출
    ↓
MSA
~~~

### 핵심 정리

MSA를 한 문장으로 표현하면, 명확한 비즈니스 책임을 가진 서비스를 독립적으로 개발, 배포, 확장할 수 있도록 설계하는 아키텍처다.

더 본질적으로는 **변경, 장애, 확장, 조직의 영향 범위를 서비스 경계 안으로 제한하는 방법**이다.

~~~text
Business Domain
      ↓
책임을 기준으로 분리
      ↓
Order, Payment, Delivery
      ↓
각 서비스가 데이터와 배포를 독립적으로 소유
      ↓
API 또는 이벤트로 통신
      ↓
Timeout, Retry, Circuit Breaker로 장애를 격리
      ↓
필요한 서비스만 확장하고 관측한다
~~~

MSA의 목적은 서비스를 많이 만드는 것이 아니라, 시스템과 조직이 감당할 수 있는 방식으로 변화와 운영을 독립시키는 데 있다.
