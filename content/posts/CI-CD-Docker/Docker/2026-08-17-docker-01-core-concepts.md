---
layout: post
title: "Docker 기초 1편: Dockerfile, Image와 Container"
description: "Docker가 필요한 이유와 Dockerfile, Image, Container, 기본 명령어, Port Mapping과 격리 개념을 정리한다."
date: 2026-08-17 12:00:00 +0900
categories: [DevOps, Docker]
tags: [Docker, Dockerfile, Image, Container, Port Mapping]
series: "Docker 기초"
part: 1
legacyPath: "/devops/docker/2026/08/17/docker-01-core-concepts/"
---
## 1. Docker가 왜 필요할까? 

뭐.. 개발은 내 컴퓨터에서만 하고, 사용도 내 컴퓨터에서만 한다면 사실 이 게시물을 읽을 필요가 없다.

그런데 아시다시피 개발을 하면 배포를 해야한다. 

여기서부터 문제는 시작된다. 

내가 뭐 SpringBoot 프로젝트를 한다고 치자 

```text
Java 21
MySQL 8
특정 환경변수
특정 라이브러리
```

내 컴퓨터는 세팅이 잘 되어있어서 내가 만들어놓은 프로젝트가 잘 돌아갈 것이다.
(근데 당연한 소리다. 내 컴퓨터에서 돌아가지도 않는데 개발을 어캐함???? ㅋㅋㅋㅋ)

그렇지만 내 개발을 서버에 올릴 떄는 이야기가 달라진다.

내가 올려야 할 서버는 내 컴퓨터와 사양과 환경이 같을까? 그렇리는 없다. 

일례로 서버 환경이 

```text
Java 17
MySQL 5
환경변수 없음
라이브러리 버전 다름
```

뭐 이렇다고 치면

실행이 될리가 없다. 애초에 개발에 사용된 환경과 서버에서 사용된 환경이 다르니까. 

> 이럴 때 하는 말이 하나있다. "내 컴에서는 되던데?"

(아무런 도움이 되지 않는 말이다..ㅋㅋ)

아무튼 그렇다면 문제를 어떻게 해결해야겠는가? 

애플리케이션과 실행 환경을 같이 묶어서 실행하면 되는 것이다. 

Docker가 이 문제를 해결해준다. 

일단 실행환경과 코드를 묶어서 이미지로 만들어주고

```text
Spring Boot Application
        +
Java Runtime
        +
Library
        +
설정
        ↓
Docker Image
```

서버에서는 

도커 이미지를 바탕으로 

돌려서 

Container를 돌리는 것이다. 

## 2. Docker의 가장 중요한 개념 

Docker를 처음 공부한다면 아래 흐름을 먼저 외우는 게 좋다. 

```text
Dockerfile
->
docker build
->
Image
->
docker run
->
Container
```

## 3. Dockerfile 

> Dockerfile은 Docker Image를 만드는 설계도

```dockerfile
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY build/libs/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

하나씩 보면: 

FROM eclipse-temurin:21-jre 

Java 21이 설치된 환경을 기반으로 사용

WORKDIR /app 

Container 내부의 작업 위치를 /app으로 저장한다. 

COPY build/libs/app.jar app.jar

내 컴퓨통에 있는 jar 파일을 Container 이미지 내부로 복사한다. 

EXPOSE 8080 

이 애플리케이션이 8080 Port

ENTRYPOINT ["java", "-jar", "app.jar"]

Container가 시작할 떄 실행할 명령 

#### 요약 

> 이 어플리케이션을 실행하기 위해 어떤 환경을 만들고, 어떤 파일을 넣고, 어떤 명령으로 실행할지 선언하는 파일

## 4. Docker Image 

Dockerfile을 이용해서 Image를 만든다. 

```bash
docker build -t myapp:1.0 .
```

그러면 

```text
Dockerfile
->
docker build
->
myapp:1.0
```

이라는 Image가 만들어진다. 

Image는 쉽게 말하면 

> 어플리케이션 실행에 필요한 환경을 포함한 환경 패키지 

라고 보면 된다. 

여기서 중요한 점은 Image 자체는 실행중인 프로그램이 아니라는 것. 

## 5. Docker Container 

Image를 실제로 실행하면 Container가 된다. 

```bash
docker run myapp:1.0
```

구조는 

```text
Image
myapp:1.0
-> docker run
container
```

이게 비유하면 

```text
Java class
-> new
object
```

Docker에서는 

```text
Docker Image
-> docker run
Container
```

(마치 OOP의 느낌, 클래스로 여러 개의 인스턴스를 만드는 것을 생각하면 쉽게 생각될 듯 하다. )

```text
             myapp:1.0
                 │
        ┌────────┼────────┐
        ↓        ↓        ↓
Container A Container B Container C
```

## 6. Image와 Container의 차이 

| 개념 | 의미 |
|---|---|
| Dockerfile | Image 만드는 설계도 |
| Image | 실행 가능한 패키지 |
| Container | Image가 실제 실행된 상태 |

비유하자면 

```text
Dockerfile
= 붕어빵 틀을 만드는 설계

Image
= 붕어빵 틀

Container
= 실제 만들어진 붕어빵
```

## 7. Docker 명령어 기본 흐름 

Docker를 사용하면 보통 이런 순서

### Image 만들기

```bash
docker build -t myapp:1.0 .
```

### Image 확인 

```bash
docker images
```

### Container 확인 

```bash
docker run myapp:1.0
```

-> web_server라면 Port도 연결해야함 

```bash
docker run -p 8080:8080 myapp:1.0
```

```text
내 컴퓨터 8080
      ↓
Container 8080
```

## 8. 근데 왜 PORT mapping을 해야할까?

Container는 외부와 분리된 환경이므로 내 컴퓨터의 내부 포트와 연결해야 한다. 

예를 들어 Spring Boot가 Container 안에서: localhost:8080

으로 실행된다. 그렇다고 내 컴퓨터의 8080과 자동으로 연결되는 것은 아님

`docker run -p 8080:8080 myapp` 처럼 연결

형식은: -p HostPort:ContainerPort

예를 들어: 

```bash
docker run -p 9000:8080 myapp
```

```text
Browser

localhost:9000
-> Host 9000
-> Container 8080
-> Spring Boot
```

## 9. Container는 격리된 환경 

Docker의 중요한 특징이다. 컨테이너끼리 격리되어있다. 
(추후에 namespace 개념에서 한 번 더 나오므로 잘 기억하자)

```text
Container A
Java 17

Container B
Java 21

Container C
Python 3.13
```

를 같은 컴퓨터에서 동시에 실행이 가능하다. 

```text
Host Operating System
        │
        ├── Container A
        │     Java 17
        │
        ├── Container B
        │     Java 21
        │
        └── Container C
              Python
```

이런 식으로 격리되어 있어서 프로젝트마다 분리해서 사용하기가 쉽다. 

## 10. 근데 이러면 VM(Virtual Machine)하고 뭐가 다른거임? 

일단 VM부터 살펴보도록하자. 

```text
Hardware
   ↓
Host OS
   ↓
Hypervisor
   ↓
Guest OS
   ↓
Application
```

VM은 기본적으로 기본 OS 위에 가상 OS를 띄우는 방식으로 굴러간다. 

그러나 Docker의 경우에는 

```text
Hardware
   ↓
Host OS
   ↓
Docker Engine
   ↓
Container
   ↓
Application
```

Docker Container는 VM처럼 OS 전체를 하나 더 띄우지 않는다.

Host OS의 Kernel을 공유

시작이 빠르고
용량이 작고
리소스를 덜 사용하는

장점이 있다.
