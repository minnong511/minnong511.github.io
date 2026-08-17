---
layout: post
title: "Docker 기초 1편: Image, Container와 Compose"
description: "Docker가 필요한 이유부터 Dockerfile, Image, Container, Volume, Network와 Compose까지 정리한다."
date: 2026-08-17 12:00:00 +0900
categories: [DevOps]
tags: [Docker, Dockerfile, Container, Docker Compose, DevOps]
series: "Docker 기초"
part: 1
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
docker build -t myapp:1.0,
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

## 11. Docker Image는 Layer 구조

> Docker Image 내부는 하나의 거대한 파일이라기보다 여러 Layer로 구성

```dockerfile
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY app.jar app.jar
```

개념적으로 

```text
Layer 3

app.jar

Layer 2

WORKDIR /app

Layer

JAVA 21 Runtime
```

그래서 변경되지 않은 Layer는 재사용할 수 있다.

Docker Layer Cache

예를 들어 

```text
Java Runtime -> 변경 없음

app.jar -> 변경됨
```

이라면 전체를 처음부터 다시 만들지 않고, 변경된 위주로만 Build하면 된다. 

이 특성을 이용해서 CI/CD에서 Build 속도를 높일 수 있다. 

## 12. Docker Registry

Image를 내 컴퓨터에만 가지고 있으면 서버가 재사용할 수가 없다. 

따라서 Image를 저장하는 중앙 저장소가 필요하다. 

이를 위한 위한 저장소가 다행히도 Docker Registry 라고 존재한다. 

```text
Docker Hub
GitHub Container Registry
AWS ECR
Google Artifact Registry
```

이게 목록이다. 

구조는 아래와 같다 

```text
Developer
    ↓
docker build
    ↓
Docker Image
    ↓
docker push
    ↓
Docker Registry
    ↓
docker pull
    ↓
Production Server
```

## 13. GitHub와 Docker Registry 차이

이 둘을 구분해야할 필요가 있다. 

```text
GitHub
    ↓
Source Code 저장

Docker Registry
    ↓
Docker Image 저장
```

```text
GitHub
= 코드 저장소

Docker Hub
= 실행 패키지 저장소
```

이렇게 정리해서 생각하면 된다.

## 14. Volume

근데 저장은 어떻게 하는 걸까?

Container 안에 파일을 저장했다고 하자.

만약에 Container 안에 저장할 경우에는 

```text
Container
   ↓
data.txt
```

이런식으로 하면 Container가 작동하는 동안에는 저장이 되겠지만, 

Container가 종료되는 경우에는, 내부 데이터가 삭제될 것이다. 

근데 여기에 DB 데이터가 담겨있다면?

음

유감이라고 할 수 있다.

하지만 개발자성님들은 최강이기 때문에 

> VOULME

이라는 기능을 구현해놓았다. 

그래서 사용하는 것이 Volume

```text
Container
     │
     ▼
Docker Volume
     │
     ▼
Data
```

이런 식으로 데이터를 유지할 수 있다. 

예를 들어 MySQL를 Docker로 실행한다고 하자. 

```text
MySQL Container
       ↓
Volume
       ↓
Database Files
```

이런식으로 구조를 유지할 수 있다. 

## 15. Docker Network

Container 끼리 통신도 된다! 

```text
Spring Boot
     ↓
MySQL
```

이렇게 구현했는데 

둘 다 Container라면 

```text
Docker Network

Spring Container
        │
        ↓
MySQL Container
```

이런식으롤 연결한다. 

다만, 컨테이너끼리 통신에서는 localhost는 사용 불가하다.

각 컨테이너의 localhost는 자기 자신을 가리키기 때문이다. 

따라서 네트워크 이름을 Container 또는 Service 이름으로 접근할 수 있다. 

## 16. Docker Compose

Container가 하나뿐이라면 명령어로 실행할 수 있다. 

근데 아시다시피 프로젝트에서는 여러가지 기능을 구현해야하고, 그로 인해 컨테이너를 여러개 구동해야 한다. 

```text
Spring Boot
MySQL
Redis
Nginx
```

처럼 여러 개가 된다.  

매번 

```bash
docker run ...
docker run ...
docker run ...
docker run ...
```

이거를 언제 치고 있겠음? 

그래서 Docker Compose를 사용한다 . 

```yaml
services:
  backend:
    build: .
    ports:
      - "8080:8080"

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: password

  redis:
    image: redis:7
```

이렇게 해놓고 

`docker compose up` 때리면

```text
Spring Boot
MySQL
Redis
```

가 한꺼번에 실행되서 매우 편리하다. 

> Docker Compose를 통해서 여러 Container의 실행 방법과 연결 관계를 하나의 파일로 정의한다. 

## 17. Docker와 CI/CD가 연결되는 순간

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

## 18. Docker를 배포 단위로 사용

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

## 19. Docker의 핵심 철학

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

## 20. 기억하면 되는 구조

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

## 21. 한 문장씩 정리하면 된다.

- **Docker:** 애플리케이션과 실행 환경을 Container 라는 격리된 환경 패키징하고 실행하기 위한 플랫폼
- **Dockerfile:** Docker Image를 어떤 환경과 파일, 명령으로 구성할지 선언하는 파일
- **Image:** 애플리케이션을 실행하기 위한 필요한 환경과 파일을 포함한 불변 패키지
- **Container:** Docker Image를 기반으로 실제 실행되고 있는 격리된 Runtime 환경
- **Registry:** Docker를 저장하고 배포하기 위한 저장소
- **Volume:** Container가 삭제되더라도 유지해야 하는 데이터를 Container 밖에 저장하는 공간
- **Docker Compose:** 여러 Docker Container의 실행 환경과 연결 관계를 하나의 설정 파일로 관리하는 도구
