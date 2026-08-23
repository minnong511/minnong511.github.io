---
layout: post
title: "개발 문서를 읽기 위한 핵심 기술 용어"
description: "Docker, Linux, 백엔드, 네트워크 문서에서 반복해서 등장하는 공통 기술 용어와 자주 쓰는 표현을 정리한다."
date: 2026-08-24 00:05:00 +0900
categories: [Basic, CS]
tags: [CS, Backend, Docker, Linux, Network, Terminology]
---

Docker, Linux, 백엔드, 네트워크를 배우는 단계에서는 개별 기술뿐 아니라 여러 분야에서 공통으로 사용하는 기술 용어를 알아두는 것이 중요합니다. 같은 단어가 여러 문서에서 반복되기 때문에 용어를 이해하면 새로운 설명도 훨씬 빠르게 읽을 수 있습니다.

중요한 것은 모든 단어를 한 번에 외우는 것이 아닙니다. **개발 문서에서 반복해서 나오는 표현을 문장 속에서 익히는 것**이 목표입니다.

## 1. 자주 나오는 핵심 기술 용어

| 용어 | 쉬운 뜻 | 자주 나오는 곳 |
|---|---|---|
| Overhead | 본 작업 외에 추가로 드는 비용 | 성능, 네트워크, Docker |
| Latency | 요청한 뒤 응답을 받을 때까지 걸리는 지연 시간 | 네트워크, API, DB |
| Throughput | 일정 시간 동안 처리할 수 있는 작업량 | 서버, 네트워크, DB |
| Bottleneck | 전체 성능을 제한하는 가장 느린 지점 | 성능 분석 |
| I/O | 파일, 디스크, 네트워크와 데이터를 주고받는 작업 | DB, OS, Docker |
| Resource | CPU, 메모리, 디스크 같은 자원 | OS, Cloud |
| Allocation | 필요한 대상에 자원을 할당하는 것 | 메모리, CPU |
| Utilization | 할당된 자원을 실제로 얼마나 사용하는지 나타내는 정도 | 모니터링 |
| Isolation | 여러 대상이 서로 영향을 덜 주도록 격리하는 것 | Docker, VM |
| Abstraction | 복잡한 내부 구현을 감추고 쉽게 사용할 수 있게 만든 구조 | 거의 모든 CS 분야 |
| Layer | 기능이나 구조를 역할에 따라 나눈 계층 | Docker, Network, Software |
| Runtime | 프로그램이 실제로 실행되는 환경 또는 실행 시점 | Java, Docker |
| Dependency | 어떤 구성 요소가 실행되기 위해 필요로 하는 다른 요소 | Spring, 패키지 관리 |
| Lifecycle | 생성부터 실행과 종료까지 이어지는 과정 | Spring, Docker |
| Persistent | 프로세스나 컨테이너가 종료돼도 데이터가 유지되는 성질 | DB, Volume |
| Ephemeral | 일시적이며 종료나 교체 과정에서 사라질 수 있는 성질 | Container, Cloud |
| Immutable | 생성한 뒤 직접 변경하지 않고 새 버전으로 교체하는 성질 | Docker Image, Infrastructure |
| State | 현재 상태나 이전 작업을 이어가는 데 필요한 저장 정보 | 서버, DB |
| Stateless | 요청 사이의 상태를 서버 내부에 유지하지 않는 구조 | API, Cloud |
| Stateful | 이전 상태를 저장하고 다음 작업에서도 사용하는 구조 | DB, Session Server |
| Scalability | 부하가 커졌을 때 자원을 늘려 대응할 수 있는 정도 | Cloud, Architecture |
| Availability | 사용자가 서비스를 정상적으로 사용할 수 있는 정도 | 서버 운영 |
| Fault Tolerance | 일부 구성 요소가 고장 나도 서비스를 계속 제공하는 능력 | 분산 시스템 |
| Redundancy | 장애에 대비해 서버나 경로 등을 중복으로 구성하는 것 | 서버, 네트워크 |
| Concurrency | 여러 작업의 실행 시간이 겹치도록 번갈아 처리하는 성질 | Java, 서버 |
| Parallelism | 여러 작업을 여러 실행 자원에서 실제로 동시에 처리하는 성질 | CPU, Thread |
| Blocking | 진행 중인 작업이 끝날 때까지 호출한 쪽이 기다리는 방식 | I/O, Java |
| Non-blocking | 작업 완료를 기다리지 않고 즉시 제어권을 돌려주는 방식 | 서버, Async I/O |
| Synchronous | 작업 완료를 현재 흐름에서 확인한 뒤 다음 단계로 진행하는 방식 | API, Java |
| Asynchronous | 작업 완료를 나중에 알림, 이벤트, 콜백 등으로 전달받는 방식 | Message Queue, Event 처리 |
| Cache | 자주 쓰는 데이터를 더 빠른 저장 공간에 임시로 보관하는 것 | Redis, CPU, Web |
| Serialization | 객체나 데이터를 저장하거나 전송할 수 있는 형태로 변환하는 것 | JSON, API |
| Deserialization | 저장하거나 전송한 데이터를 프로그램이 사용할 형태로 복원하는 것 | JSON, API |
| Idempotent | 같은 요청을 여러 번 실행해도 시스템의 최종 상태가 같아지는 성질 | HTTP, API |
| Atomic | 작업 전체가 성공하거나 실패하며 일부만 반영된 중간 결과를 남기지 않는 성질 | DB, Thread |
| Consistency | 데이터가 정해진 규칙과 제약 조건을 만족하는 상태 | DB, 분산 시스템 |

## 2. 먼저 익힐 10개

처음부터 모든 단어를 외우기보다 다음 10개를 먼저 익히는 것이 좋습니다.

```text
Overhead
Latency
Throughput
Bottleneck
I/O
Isolation
Abstraction
Runtime
Dependency
Lifecycle
```

이 단어들은 Docker와 Linux뿐 아니라 Spring, Kubernetes, AWS 문서에서도 반복해서 등장합니다.

## 3. 문장을 용어 단위로 해석하기

Docker 문서에서 다음과 같은 문장을 만났다고 가정해 봅니다.

> Container isolation introduces relatively low runtime overhead.

문장을 용어 단위로 나누면 이해하기 쉽습니다.

```text
Container isolation
→ 컨테이너 격리

runtime overhead
→ 실행 중 발생하는 추가 비용

relatively low
→ 비교적 적다
```

따라서 전체 문장은 다음과 같이 해석할 수 있습니다.

> 컨테이너 격리는 실행 시 발생하는 추가 비용이 비교적 적다.

영어 문장을 처음부터 완벽하게 번역하려 하기보다 익숙한 기술 용어를 먼저 찾으면 문서의 핵심을 더 빠르게 파악할 수 있습니다.

## 4. 백엔드에서 자주 보는 표현

```text
High latency
→ 응답이 느리다

High throughput
→ 일정 시간 동안 많은 요청을 처리할 수 있다

I/O bottleneck
→ 디스크 또는 네트워크 입출력이 전체 성능을 제한하고 있다

Memory overhead
→ 핵심 작업 외에 메모리가 추가로 사용된다

Runtime dependency
→ 프로그램을 실행할 때 필요한 의존 요소

Persistent storage
→ 프로세스나 컨테이너가 종료돼도 데이터가 유지되는 저장소
```

## 5. 단어보다 표현으로 기억하기

기술 용어는 영어사전처럼 단어 하나만 외우기보다 자주 함께 사용하는 동사와 묶어서 기억하는 것이 좋습니다.

```text
reduce overhead
→ 오버헤드를 줄인다

improve throughput
→ 처리량을 높인다

reduce latency
→ 지연 시간을 줄인다

allocate resources
→ 자원을 할당한다

isolate processes
→ 프로세스를 격리한다

persist data
→ 데이터를 영속적으로 저장한다

resolve dependencies
→ 의존성을 해결한다

manage lifecycle
→ 생명주기를 관리한다
```

이런 표현은 개발 문서, 오류 메시지, 기술 발표에서 반복적으로 등장합니다.

## 6. 단계별 학습 순서

Docker 공부 흐름을 기준으로 다음 순서로 익히면 개념을 연결하기 쉽습니다.

```text
1단계: 프로그램 실행의 기본
Process → Thread → Daemon → Runtime → Lifecycle

2단계: 실행 환경과 비용
Resource → Allocation → Isolation → Overhead → I/O

3단계: 성능
Latency → Throughput → Bottleneck → Cache

4단계: 상태와 데이터
Stateful → Stateless → Persistent → Ephemeral → Immutable

5단계: 여러 작업 처리
Concurrency → Parallelism → Blocking → Non-blocking → Sync → Async
```

이 단어들이 익숙해지면 Docker뿐 아니라 Spring, Kubernetes, AWS, 시스템 설계 문서를 읽을 때 느끼는 난도가 크게 낮아집니다.

## 7. 반드시 구분할 네 쌍

### 7.1 Latency와 Throughput

```text
Latency    = 요청 하나가 얼마나 빨리 끝나는가?
Throughput = 일정 시간 동안 요청을 몇 개 처리하는가?
```

처리량이 높아도 요청 하나의 지연 시간은 길 수 있습니다. 반대로 요청 하나는 빨리 처리하지만 동시에 처리할 수 있는 요청 수가 적을 수도 있습니다.

### 7.2 Concurrency와 Parallelism

```text
Concurrency = 여러 작업을 겹치는 시간 동안 다루는 구조
Parallelism = 여러 작업을 실제로 같은 순간에 실행하는 구조
```

한 명의 요리사가 여러 요리를 번갈아 만드는 것은 Concurrency이고, 여러 요리사가 각 요리를 동시에 만드는 것은 Parallelism에 가깝습니다.

### 7.3 Blocking과 Non-blocking

```text
Blocking     = 작업이 끝날 때까지 제어권을 돌려받지 못함
Non-blocking = 작업 완료 여부와 관계없이 제어권을 바로 돌려받음
```

이 구분은 호출한 작업이 제어권을 언제 돌려주는지에 초점을 맞춥니다.

### 7.4 Stateful과 Stateless

```text
Stateful  = 이전 요청의 상태를 저장하고 사용함
Stateless = 각 요청을 독립적으로 처리함
```

DB처럼 데이터를 유지해야 하는 서비스는 Stateful한 경우가 많습니다. 요청마다 필요한 정보를 모두 전달받는 일반적인 REST API 서버는 Stateless하게 설계하기 좋습니다.

---

핵심은 용어의 번역만 암기하는 것이 아니라 실제 문장과 상황 속에서 의미를 연결하는 것입니다. 모르는 기술을 만나더라도 공통 용어가 익숙하면 설명의 구조부터 파악할 수 있습니다.
