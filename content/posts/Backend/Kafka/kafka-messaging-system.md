---
title: "Kafka 메시징 시스템의 구성과 동작 방식"
description: "Kafka 기반 메시징 시스템에서 Publish/Subscribe, Broker, Topic, Partition, Producer, Consumer와 Offset이 동작하는 방식을 정리한다."
date: "2026-08-26T14:08:02+09:00"
categories: ["Backend", "Kafka"]
tags: ["Kafka", "Messaging", "Producer", "Consumer"]
legacyPath: "/backend/kafka/2026/08/26/kafka-messaging-system/"
published: true
---

# 게시글 설명

클라우드 트랙에서 Kafka로 서비스를 구현해보신 "떙정" 님의 게시글을 바탕으로 Kafka를 설명해보려 한다. 

## 1. 메시징 시스템 부분

회원가입·주문 완료 
-> 
MemberService / OrderService
-> 이벤트 발행
Kafka
-> 이벤트 소비
MailService 
-> 
사용자에게 메일 발송 

예를 들어 주문이 완료되면 OrderService가 다음 메시지를 보낸다. 

{
  "orderId": 1001,
  "memberId": 25,
  "email": "user@example.com"
}

MailService는 order-completed Topic을 계속 구독하다가 이벤트가 들어오면 메일을 발송

주의! 

Kafka 메시지는 반드시 HTTP REST API로 전달하는 것이 아닙니다. 보통 애플리케이션 내부의 Kafka Producer Client가 Kafka 전용 네트워크 프로토콜로 Broker에 전송

## 2. Publish/Subscribe의 장점

그렇다면 REST API를 놓고서 왜 Kafka를 쓰는 걸까? 

OrderService는 다음 내용을 몰라도 된다

1. MailService의 주소
2. MailService가 몇 대인지
3. 메일 발송이 얼마나 걸리는지
4. PointService나 AnalyticsService가 추가됐는지

새로운 서비스가 필요하면 OrderService를 수정하지 않고, 새 Consumer Group을 추가하는 것이 가능하다 

기존
OrderService → Kafka → MailService

확장
OrderService → Kafka → MailService
                     → PointService
                     → AnalyticsService

한 번에 여러개로 전달할 수 있다. 

코드와 실행 상태는 분리되지만 이벤트 형식에는 의존한다

다만 이런 경우에 OrderService가 메시지 필드 이름을 갑자기 바꾸면 Consumer들이 깨질 수 있다. 이벤트 스키마의 버전 관리가 필요하다. 

## 3. Broker 

운영 환경에서는 보통 Broker를 여러 대 둔다. 

Kafka Cluster
├─ Broker 1
├─ Broker 2
└─ Broker 3

이렇게 구성한다면 

여러 Broker에 Partition 복제본을 두면 한 서버가 고장 나도 서비스를 계속할 수 있다. 

## 4. Topic

> 같은 종류의 이벤트를 여러 Partition에 순서대로 보관하는 논리적 로그

order-completed 
member-created 
payment-failed

Topic 이름은 가능하면 명령보다 이미 발생한 사실을 나타내는 과거형이 이해하기 좋다고 한다. 

## 5. Partition과 Key

게시글의 설명처럼 Partition은 Topic을 나눈 샤드

key = memberId 25

회원 25 주문 생성
→ 회원 25 결제 완료
→ 회원 25 배송 시작

다만 여기서 내가 주의할만한 점은 2가지이다. 
- key가 없으면 같은 사용자 이벤트가 서로 다른 Partition에 들어갈 수 있다. 
- Partition 수를 나중에 늘리면 key와 Partition의 매핑이 달라질 수 있다. 
따라서 “Partition을 늘리면 무조건 좋다”는 것은 아니다. 병렬성은 증가하지만 관리 비용과 순서 설계가 복잡해진다.
(Trade-Off를 잘 고려해서 서버의 갯수를 정해야 한다.)

## 6. Producer

OrderService 안에 Kafka Producer 라이브러리가 들어 있다. 

OrderService
└─ KafkaProducer.send("order-completed", event)

Producer는 Kafka에 메시지를 생산하는 애플리케이션 또는 그 역할

## 7. Consumer와 Consumer Group

Consumer Group에 속한 Consumer들은 메시지 처리를 나눠 가진다. 

다만 하나의 Partition은 같은 그룹 내에서 동시에 한 Consumer만 담당

Partition 3개 + Consumer 5개
→ 3개는 처리
→ 2개는 대기

따라서 Consumer 수만 늘린다고 무조건 처리량이 증가하지 않는다. 최대 병렬 처리 단위는 기본적으로 Partition 수

## 8. Offset과 Commit

Topic 전체 번호가 아니라 각각의 Partition 안에서의 메시지 번호










참고 자료 

https://rainbow-beard-524.notion.site/Kafka-28775575898d8025a9c6e53ff533b89c

1. Kafka를 이용한 자동 메일 발송 구조
2. EC2에서 Kafka Broker를 실행하는 Docker 명령어
