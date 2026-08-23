---
layout: post
title: "Docker 기초 2편: Layer, Registry, Volume과 Network"
description: "Docker Image Layer와 Registry, Volume, Network, Docker Compose의 기본 역할을 정리한다."
date: 2026-08-17 12:05:00 +0900
categories: [DevOps, Docker]
tags: [Docker, Layer, Registry, Volume, Network, Docker Compose]
series: "Docker 기초"
part: 2
---

## 1. Docker Image는 Layer 구조

> Docker Image 내부는 하나의 거대한 파일이라기보다 여러 Layer로 구성되어있다.

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
(재탕이 가능하다!)

Docker Layer Cache

예를 들어 

```text
Java Runtime -> 변경 없음

app.jar -> 변경됨
```

이라면 전체를 처음부터 다시 만들지 않고, 변경된 위주로만 Build하면 된다. 
(리소스를 덜 잡아먹는 좋은 설계이다.)

이 특성을 이용해서 CI/CD에서 Build 속도를 높일 수 있다. 

## 2. Docker Registry

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

> Registry >> Repository 이므로 잘 기억하자. 

## 3. GitHub와 Docker Registry 차이

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

## 4. Volume

근데 저장은 어떻게 하는 걸까?

Container 안에 파일을 저장했다고 하자.

만약에 Container 안에 저장할 경우에는 

```text
Container
   ↓
data.txt
```

이런식으로 하면 Container가 작동하는 동안에는 저장이 되겠지만, 

Container가 삭제되는 경우에는, 내부 데이터가 삭제될 것이다. 

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

## 5. Docker Network

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

## 6. Docker Compose

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
