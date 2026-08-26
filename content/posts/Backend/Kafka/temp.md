---
title: "Kafka 기본 개념과 EC2 Docker 구성"
description: "Kafka의 Producer, Consumer, Topic, Partition, Offset과 KRaft 기반 Docker 구성을 정리한다."
date: "2026-08-26T14:08:02+09:00"
categories: ["Backend", "Kafka"]
tags: ["Kafka", "KRaft", "Docker", "EC2"]
legacyPath: "/backend/kafka/2026/08/26/temp/"
published: true
---

> Kafka는 서비스끼리 직접 호출하지 않고 “발생한 사건(Event)”을 중간 로그에 기록해 두고 각 서비스가 자기 속도로 읽게 만드는 분산 이벤트 스트리밍 플랫폼

# 1. Kafka의 핵심 철학 

## 서비스끼리 서로 몰라도 된다. 

Kafka가 없다면:

OrderService → MailService API 직접 호출

이 구조에서는 MailService가 느리거나 장애가 나면 주문 처리까지 영향을 받을 수 있다

Kafka를 사용하면:

OrderService -> Kafka -> MailService -> PointService -> AnalyticsService

OrderService는 MailService의 주소나 상태를 몰라도 됩니다. 단지 Kafka에 다음 사실을 기록

“주문 123번이 완료됐다.”

일단 기록되면, 이 사안에 관심이 있는 서비스들이 읽어갑니다. 이것을 "결합도를 낮춘다" 라고 합니다. 

## 메시지를 전달하고 바로 버리지 않는다. 

일반적인 메시지 전달기로만 생각하면 

보내고 -> 받고 -> 바로 사라짐 (게임 채팅을 생각해보자) 

Kafka는 비동기로 데이터를 저장할 수 있다. 

보내고 -> 로그에 저장하고 -> 소비자가 읽고 -> 필요하면 다시 읽는다. 

소비자가 읽어도 메시지가 즉시 삭제되지 않는다, 설정된 보관 기관 동안 남기 때문에 장애 복구, 재처리, 신규 서비스의 과거 데이터 분석이 가능하다. 

그래서 Kafka는 단순한 “우체부”보다 여러 서비스가 함께 읽는 사건 기록장에 가깝다. 


## 처리량을 파티션으로 확장한다

메시지가 너무 많으면 하나의 통로로 처리하기가 어렵다. Kafka는 Topic을 여러 Partition으로 나누고 병렬로 처리

order-events
├─ Partition 0
├─ Partition 1
└─ Partition 2

각 파티션은 서로 다른 소비자가 동시에 처리할 수 있다. 

순서는 전체가 아니라 파티션 안에서 보장

Topic 전체 순서 ❌
Partition 내부 순서 ✅

https://kafka.apache.org/documentation/

# 2. Kafka의 정의

공식적으로 Kafka는 분산 이벤트 스트리밍 플랫폼

세 가지 기능을 합친 것 

1. 이벤트를 발행하고 구독
2. 이벤트를 디스크에 지속해서 보관한다 
3. 실시간 또는 나중에 이벤트를 처리한다 

즉, Kafka는 다음 성격을 동시에 가지고 있다. 

메시지 브로커 + 분산 로그 저장소  + 실시간 데이터 파이프라인 

# 3. 핵심 단어 

| 용어 | 의미 |
|---|---|
| Event / Record / Message | “주문이 완료됐다”처럼 발생한 사건 한 건 |
| Producer | Kafka에 이벤트를 보내는 애플리케이션 |
| Consumer | Kafka에서 이벤트를 읽고 처리하는 애플리케이션 |
| Broker | Kafka 서버 한 대 |
| Cluster | 여러 Broker를 묶은 Kafka 시스템 |
| Topic | 같은 종류의 이벤트를 모아두는 이름 있는 로그 |
| Partition | Topic을 병렬 처리하기 위해 나눈 실제 로그 조각 |
| Key | 메시지가 들어갈 Partition을 결정할 때 사용하는 값 |
| Offset | Partition 안에서 메시지의 위치를 나타내는 번호 |
| Consumer Group | 일을 함께 나눠 처리하는 Consumer들의 그룹 |
| Commit | “여기까지 처리했다”는 Offset을 저장하는 행위 |
| Retention | 메시지를 Kafka에 보관하는 기간 |
| Replication | 장애에 대비해 Partition을 여러 Broker에 복제하는 것 |
| Rebalance | Consumer 수가 변할 때 Partition 담당자를 다시 배정하는 것 |

Consumer Group이 헷갈리므로 한 번 더 알아보자 

Topic: order-events
Partition: P0, P1, P2

같은 그룹의 Consumer라면 일을 나눈다. 

mail-group
├─ MailConsumer 1 → P0, P1
└─ MailConsumer 2 → P2

서로 다른 그룹이라면 각 그룹이 전체 메시지를 따로 읽는다. 

mail-group      → 모든 주문 이벤트 처리
point-group     → 모든 주문 이벤트 처리
analytics-group → 모든 주문 이벤트 처리

Kafka는 Consumer Group을 이용해 작업 분산과 Publish/Subscribe를 모두 구현
