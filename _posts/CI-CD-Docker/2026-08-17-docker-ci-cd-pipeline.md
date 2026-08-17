---
layout: post
title: "CI/CD 기초 2편: Docker 이미지와 배포 파이프라인"
description: "Docker 기반 CI/CD의 흐름과 이미지, 컨테이너, Registry, 환경 설정 및 태그 관리 원칙을 정리한다."
date: 2026-08-17 14:00:00 +0900
categories: [DevOps]
tags: [CI/CD, Docker, GitHub Actions, Container Registry, Deployment]
series: "Docker 기반 CI/CD"
part: 2
---

## Docker 기반 CI/CD

먼저 Docker 기반 배포의 전체 흐름을 살펴보자.

```text
Developer
   │ git push
   ▼
GitHub Repository
   │
   ▼
CI Pipeline
   ├── Source Checkout
   ├── Dependency Install
   ├── Test
   ├── Build
   └── Docker Image Build
            │
            ▼
      Container Registry
      (Docker Hub, GHCR, ECR)
            │
            ▼
       Production Server
            │ docker pull
            ▼
      Docker Container
            │
            ▼
        Application
            │
            ▼
          Users
```

핵심 흐름은 다음과 같다.

```text
Source Code
→ Executable Artifact
→ Docker Image
→ Registry
→ Container
→ Running Service
```

### 1. CI와 CD 다시 구분하기

#### CI(Continuous Integration)

개발자가 작성한 코드를 지속적으로 통합하고 검증하는 과정이다.

> 이 코드를 배포 가능한 상태로 신뢰해도 되는가?

Spring Boot 프로젝트라면 다음과 같은 작업을 수행할 수 있다.

```bash
./gradlew test
./gradlew bootJar
docker build -t myapp:1.0 .
```

#### CD(Continuous Delivery 또는 Deployment)

**Continuous Delivery**는 배포 가능한 상태까지 자동화하고 실제 배포는 사람이 승인하는 방식이다.

```text
Code
→ Test
→ Build
→ Image
→ Registry
→ 배포 준비 완료
```

**Continuous Deployment**는 Production 배포까지 완전히 자동화하는 방식이다.

```text
git push
→ CI
→ Docker Image
→ Production
→ Health Check
→ 서비스
```

간단히 정리하면 CI는 배포 가능한 결과물을 만들고, CD는 그 결과물을 실제 환경에 배포한다.

### 2. Docker에서 CI/CD가 중요한 이유

서버에 직접 접속해서 코드를 받고 환경을 구성하면 개발 환경과 운영 환경의 차이로 문제가 생길 수 있다.

```text
개발자 PC
├── Java 21
├── PostgreSQL 16
└── Library A 2.1

Production
├── Java 17
├── PostgreSQL 14
└── Library A 1.9
```

바로 유명한 “내 컴퓨터에서는 되는데?” 문제다.

Docker는 애플리케이션과 실행에 필요한 환경을 하나의 이미지로 묶어 이 차이를 줄인다.

```text
Application
+ Runtime
+ Library
+ Dependency
+ Environment
= Docker Image
```

개발 및 검증 환경에서 확인한 이미지를 Production에서도 동일하게 실행할 수 있다.

### 3. Docker Image와 Container

```text
Dockerfile
→ docker build
→ Docker Image
→ docker run
→ Container
```

**Image**는 실행에 필요한 파일을 담은 불변 배포 패키지다. **Container**는 이미지를 실제로 실행한 인스턴스다.

```text
Image: myapp:1.0
       │
       ├─ Container A
       ├─ Container B
       └─ Container C
```

하나의 이미지에서 여러 컨테이너를 만들 수 있다. 객체 지향에 비유하면 Class와 Instance의 관계와 비슷하다.

```text
Class     → Docker Image
Instance  → Docker Container
```

### 4. Dockerfile

Dockerfile은 Docker 이미지를 어떻게 만들지 선언하는 파일이다. Spring Boot라면 다음과 같이 작성할 수 있다.

```dockerfile
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY build/libs/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

| 명령 | 의미 |
|---|---|
| `FROM` | 사용할 기본 실행 환경 |
| `WORKDIR` | 컨테이너 내부 작업 디렉터리 |
| `COPY` | 애플리케이션 파일 복사 |
| `EXPOSE` | 애플리케이션이 사용하는 포트 명시 |
| `ENTRYPOINT` | 컨테이너가 시작될 때 실행할 명령 |

즉, Dockerfile을 보면 애플리케이션을 실행할 서버 환경이 어떻게 구성되는지 알 수 있다.

### 5. Build Artifact

Build Artifact는 소스 코드를 컴파일·테스트·패키징하는 과정에서 만들어지는 배포 가능한 결과물이다.

```text
Source Code
→ Compile
→ Test
→ Build
→ app.jar
```

여기서 `app.jar`가 Build Artifact다. Docker를 사용하면 한 단계 더 나아간다.

```text
Source Code
→ JAR
→ Docker Image
```

Docker 기반 시스템에서는 Docker 이미지를 최종 Release Artifact로 사용할 수 있다.

### 6. Container Registry

Release Artifact인 Docker 이미지는 어딘가에 저장해야 한다. 이때 사용하는 저장소가 Container Registry다.

- Docker Hub
- GitHub Container Registry(GHCR)
- AWS ECR
- Google Artifact Registry
- Azure Container Registry

```text
CI Server
→ docker push
→ Registry
→ docker pull
→ Production Server
```

GitHub가 소스 코드 저장소라면 Registry는 Docker 이미지 저장소다.

### 7. 실제 데이터 흐름

개발자가 Spring Boot 코드를 수정하고 Push하면 GitHub Actions가 CI를 실행한다.

```text
GitHub Actions Runner
→ Checkout
→ JDK 설치
→ ./gradlew test
→ ./gradlew bootJar
→ docker build
```

만들어진 이미지를 Registry에 Push한다.

```bash
docker push registry.example.com/myapp:1.4.2
```

Registry에는 여러 버전의 이미지가 존재할 수 있다.

```text
myapp
├── 1.4.0
├── 1.4.1
├── 1.4.2
└── latest
```

Production Server는 지정한 버전의 이미지를 받아 실행한다.

```bash
docker pull registry.example.com/myapp:1.4.2
docker run registry.example.com/myapp:1.4.2
```

최종 요청 흐름은 다음과 같다.

```text
User
→ Internet
→ Load Balancer / Nginx
→ Container
→ Spring Boot
→ Database
```

### 8. Build Once, Deploy Many

CI/CD에서 중요한 원칙은 **한 번 빌드한 결과물을 여러 환경에 배포하는 것**이다.

```text
Dev용 Image Build
Stage용 Image Build
Prod용 Image Build
```

환경마다 이미지를 다시 빌드하면 Staging에서 검증한 이미지와 Production에 올린 이미지가 달라질 수 있다. 따라서 한 번 만든 동일한 이미지를 여러 환경에서 사용한다.

```text
Source
  ↓
Build
  ↓
Image: abc123
  ├── Dev
  ├── Staging
  └── Production
```

### 9. 환경 설정 분리

개발, Staging, Production의 DB 주소와 설정은 서로 다르다. 이미지는 동일하게 유지하고 환경별 값은 컨테이너 실행 시 외부에서 주입한다.

```bash
docker run \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=prod-db \
  myapp:1.4.2
```

```text
              Docker Image
              myapp:1.4.2
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
 DEV Container  STAGE Container  PROD Container
 DB=dev         DB=stage         DB=prod
```

이미지와 환경 설정을 분리해서 생각해야 한다.

### 10. Secret은 이미지에 넣지 않기

다음처럼 비밀번호나 API Key를 이미지에 넣으면 이미지를 받은 사람이 값을 확인할 수 있다.

```dockerfile
ENV DB_PASSWORD=123456
ENV AWS_SECRET_KEY=example
```

다음 값은 이미지 외부의 Secret 관리 시스템에서 관리하고 배포 시점에 주입해야 한다.

- DB Password
- API Key
- AWS Secret Key
- JWT Secret

대표적인 관리 방법으로 GitHub Actions Secrets, AWS Secrets Manager, Kubernetes Secrets, Vault 등이 있다.

```text
Secret Storage
→ Deployment
→ Container Environment
```

### 11. Image Tagging

`myapp:latest`만 사용하면 현재 실행 중인 이미지가 정확히 어떤 버전인지 추적하기 어렵다.

```text
오늘 latest  → v1.5
내일 latest  → v1.6
```

따라서 명시적인 버전이나 Git commit SHA를 태그로 사용한다.

```text
myapp:1.4.2
myapp:a8df329
```

```text
Production Error
→ 실행 중인 Image 확인
→ myapp:a8df329
→ Git commit a8df329 확인
→ 정확한 Source Code 추적
```

이처럼 배포 결과물과 소스 코드의 관계를 추적할 수 있는 성질을 **Traceability(추적 가능성)**라고 한다.

다음 글에서는 배포 이후의 Health Check, Rollback과 무중단 배포 전략을 살펴본다.
