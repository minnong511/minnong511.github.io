---
layout: post
title: "Docker 기초 3편: CI/CD 연결과 배포 원칙"
description: "Docker가 CI/CD와 연결되는 흐름, 이미지 기반 배포와 Immutable Infrastructure 원칙을 정리한다."
date: 2026-08-17 12:10:00 +0900
categories: [DevOps, Docker]
tags: [Docker, CI/CD, Deployment, Immutable Infrastructure]
series: "Docker 기초"
part: 3
---

## 1. Docker와 CI/CD가 연결되는 순간

소스 코드를 Github에 올리는 순간부터 시작한다. 

```bash
git push
```

이후 CI가 실행된다 

```text
Developer
->
Github
->
Github Actions
->
Tests
->
Spring Boot build
->
app.jar
->
Docker build
->
Docker Image
->
Docker push
->
Docker Registry
```

그 다음에 CD가 이뤄진다. 

```text
Production Server
->
Docker pull
->
Docker Image
->
Docker run
->
Container
->
Spring Boot 실행
```

## 2. Docker를 배포 단위로 사용

Docker가 없는 경우

```text
Source Code
->
Server 접속
->
Java 설치
->
Dependency 설치
->
설정
->
실행
```


Docker를 사용하면 

```text
Docker Image
->
Server
->
Docker run
```

으로 단순화

그래서 중요한 개념

> 배포 단위를 Source Code가 아니라 Docker Image로 만든다. 

## 3. Docker의 핵심 철학

Docker를 공부할 때 이 개념도 굉장히 중요하다.

Container가 이상해졌다고 안에 들어가서:

```bash
vi ...
apt install ...
```

하면서 직접 수정하는 방식은 좋지 않다.

대신:

```text
Dockerfile 수정
      ↓
새 Image Build
      ↓
새 Container 생성
      ↓
기존 Container 제거
```

한다.

즉:

수리해서 계속 사용

하는 것이 아니라:

문제가 있으면 새것으로 교체

하는 방향이다.

이것을 Immutable Infrastructure 사고방식이라고 한다.

## 4. 기억하면 되는 구조

```text
                      Dockerfile
                           │
                           │ docker build
                           ▼
                     Docker Image
                           │
             ┌─────────────┴─────────────┐
             │                           │
         docker run                 docker push
             │                           │
             ▼                           ▼
         Container               Docker Registry
                                         │
                                     docker pull
                                         │
                                         ▼
                                  Production Server
                                         │
                                     docker run
                                         │
                                         ▼
                                     Container
```

| 개념 | 의미 |
|---|---|
| Docker | Container를 만들고 실행하는 플랫폼 |
| Dockerfile | Image 제작 방법 |
| Image | 실행 가능한 패키지 |
| Container | Image를 실행한 프로세스 환경 |
| Registry | Image 저장소 |
| Volume | Container 외부 데이터 저장 |
| Network | Container 간 통신 |
| Compose | 여러 Container를 한 번에 관리 |

## 5. 한 문장씩 정리하면 된다.

- **Docker:** 애플리케이션과 실행 환경을 Container 라는 격리된 환경 패키징하고 실행하기 위한 플랫폼
- **Dockerfile:** Docker Image를 어떤 환경과 파일, 명령으로 구성할지 선언하는 파일
- **Image:** 애플리케이션을 실행하기 위한 필요한 환경과 파일을 포함한 불변 패키지
- **Container:** Docker Image를 기반으로 실제 실행되고 있는 격리된 Runtime 환경
- **Registry:** Docker Image를 저장하고 배포하기 위한 저장소
- **Volume:** Container가 삭제되더라도 유지해야 하는 데이터를 Container 밖에 저장하는 공간
- **Docker Compose:** 여러 Docker Container의 실행 환경과 연결 관계를 하나의 설정 파일로 관리하는 도구
