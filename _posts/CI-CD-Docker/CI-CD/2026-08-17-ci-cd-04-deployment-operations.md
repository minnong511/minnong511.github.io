---
layout: post
title: "CI/CD 기초 4편: 배포 전략과 운영"
description: "컨테이너 배포 이후 필요한 Health Check, Rollback, 무중단 배포 전략과 모니터링을 정리한다."
date: 2026-08-17 15:00:00 +0900
categories: [DevOps, CI-CD]
tags: [CI/CD, Docker, Health Check, Rollback, Deployment, Observability]
series: "Docker 기반 CI/CD"
part: 4
---

## 배포 후에도 끝은 아니다

CI/CD를 처음 접하면 `docker run`이 성공한 것을 배포 성공으로 생각하기 쉽다. 하지만 컨테이너 프로세스가 실행됐더라도 Spring Boot 애플리케이션은 정상적으로 동작하지 않을 수 있다.

```text
Deploy
→ Container Start
→ Health Check
→ Application 정상 확인
→ Traffic 연결
```

배포 이후에는 위와 같은 확인 과정이 필요하다.

### 1. Health Check

Spring Boot Actuator를 사용한다면 `/actuator/health` 엔드포인트로 애플리케이션 상태를 확인할 수 있다.

```json
{
  "status": "UP"
}
```

컨테이너에는 크게 두 가지 상태가 있다.

```text
프로세스가 살아 있음
애플리케이션이 정상 작동함
```

이 둘은 항상 같지 않다. Java 프로세스는 살아 있지만 DB 연결에 실패한 상태일 수도 있다.

```text
HTTP 요청
→ /actuator/health
→ DB 연결 등 상태 확인
→ HTTP 200 OK
```

따라서 단순히 컨테이너가 실행 중인지 확인하는 것보다 애플리케이션이 실제 요청을 처리할 수 있는지 검사하는 것이 중요하다.

### 2. Rollback

Health Check에서 문제가 발견되면 이전 정상 버전으로 되돌려야 한다. 이때 Docker 이미지의 버전 관리가 도움이 된다.

```text
기존 버전: myapp:1.4.1  → GOOD
새 버전:   myapp:1.4.2  → ERROR

myapp:1.4.2 중지
→ myapp:1.4.1 실행
→ Health Check
```

Registry에 이전 이미지가 남아 있으면 빠르게 Rollback할 수 있다. 따라서 운영 정책과 보관 기간을 정하지 않은 상태에서 이전 이미지를 무조건 삭제하면 안 된다.

### 3. 컨테이너는 수정하지 않고 교체한다

Docker의 중요한 철학 중 하나는 고장 난 컨테이너 내부를 직접 고치는 대신 새 이미지로 컨테이너를 교체하는 것이다.

컨테이너에 접속해 다음과 같은 작업을 하면 변경 사항을 재현하기 어렵다.

```bash
vi config
apt install some-package
```

대신 원인이 되는 설정이나 Dockerfile을 수정하고 새 이미지를 만든다.

```text
Dockerfile 또는 설정 수정
→ 새 Image 생성
→ myapp:1.1
→ 새 Container 실행
→ 검증 후 기존 Container 제거
```

실행 중인 서버를 계속 수정하는 Mutable Server 방식보다, 변경 사항을 이미지에 반영해 통째로 교체하는 **Immutable Infrastructure** 방식에 가깝다.

### 4. Production에서 컨테이너 교체하기

컨테이너 한 개만 운영한다면 다음 교체 과정에서 잠깐 서비스가 끊길 수 있다.

```text
Old Container Stop
→ New Container Start
```

서비스 중단을 줄이기 위해 Rolling, Blue-Green, Canary 같은 배포 전략을 사용한다.

### 5. Rolling Deployment

여러 서버 또는 컨테이너를 하나씩 새 버전으로 교체하는 방식이다.

```text
1단계: A=v1, B=v1, C=v1
2단계: A=v2, B=v1, C=v1
3단계: A=v2, B=v2, C=v1
4단계: A=v2, B=v2, C=v2
```

기존 인스턴스를 순차적으로 교체하므로 서비스 중단을 줄이고 리소스를 효율적으로 사용할 수 있다. Kubernetes에서 흔히 사용하는 방식이다.

### 6. Blue-Green Deployment

현재 운영 중인 Blue 환경 옆에 새 버전인 Green 환경을 별도로 만든다.

```text
BLUE                    GREEN
v1                      v2
현재 서비스             새 버전 검증
```

Green 검증이 끝나면 Load Balancer가 보낼 대상을 바꾼다.

```text
Users
→ Load Balancer
→ GREEN v2
```

문제가 발생하면 트래픽을 다시 Blue로 돌릴 수 있어 Rollback이 빠르다. 다만 두 환경을 동시에 유지할 리소스가 필요하다.

### 7. Canary Deployment

새 버전을 일부 사용자에게 먼저 제공하는 방식이다.

```text
초기: v1 90%, v2 10%
확대: v1 50%, v2 50%
완료:          v2 100%
```

Canary 배포를 사용하는 이유는 모든 서버의 가용성을 높이기 위해서라기보다 **새 버전의 위험을 일부 트래픽으로 제한하기 위해서**다. 오류율이나 지연 시간이 나빠지면 전체 사용자에게 영향을 주기 전에 배포를 중단하거나 되돌릴 수 있다.

대규모 서비스에서는 사용자 그룹, 지역 또는 트래픽 비율을 기준으로 점진적으로 범위를 넓힌다.

### 8. CI/CD Pipeline의 Stage

실무에서는 Pipeline을 Stage 단위로 생각하면 이해하기 쉽다.

```text
Source
  ↓
Test
  ↓
Build
  ↓
Image Build
  ↓
Image Push
  ↓
Deploy
  ↓
Health Check
  ↓
Monitoring
```

이것이 Docker 기반 CI/CD의 전체 뼈대다.

### 9. 배포 시스템에서 흐르는 것

CI/CD 시스템에서는 다음 항목들이 각 단계를 거쳐 이동하거나 참조된다.

| 항목 | 예시 |
|---|---|
| Source Code | GitHub Repository |
| Build Artifact | `app.jar` |
| Container Artifact | Docker Image |
| Configuration | Environment Variables |
| Secrets | Password, API Key |
| Runtime Data | Database Data |
| Logs | Application Log |
| Metrics | CPU, Memory, Latency, Error Rate |

이들은 성격에 맞게 분리해서 관리해야 한다. 특히 Docker 이미지와 데이터베이스 데이터는 서로 다르다.

```text
Container 삭제
      │
      └─ Database Data는 유지
```

컨테이너를 삭제해도 데이터가 사라지지 않도록 DB는 Docker Volume이나 외부 데이터베이스를 사용한다.

### 10. 운영에서는 Observability가 중요하다

배포 이후에는 서비스가 정상적으로 동작하는지 지속해서 관찰해야 한다. 최소한 다음 정보를 확인할 필요가 있다.

- CPU, Memory, Disk, Network
- Request Count, Latency, Error Rate
- Application Log, Database Connection
- Container Restart Count

대표적인 도구로 Prometheus, Grafana, ELK, Loki, Datadog, CloudWatch 등이 있다.

```text
CI        → Build
CD        → Deploy
Operation → Observe
Problem   → Fix
git push  → 다시 CI
```

### 11. DevOps는 하나의 Loop다

```text
PLAN
→ CODE
→ BUILD
→ TEST
→ RELEASE
→ DEPLOY
→ OPERATE
→ MONITOR
→ PLAN
```

Docker는 이 과정에서 Build, Release, Deploy, Operate를 연결해 주는 핵심 기술이다.

### 12. Spring Boot 프로젝트에 적용한다면

```text
Spring Boot Source Code
→ git push
→ GitHub
→ GitHub Actions Runner
   ├─ JDK 설치
   ├─ Gradle Test
   ├─ bootJar
   └─ docker build
→ Docker Image: myapp:a8df329
→ docker push
→ Container Registry
→ Production Server에서 docker pull
→ Container 실행
→ Spring Boot
   ├─ Redis
   └─ PostgreSQL
→ Nginx
→ Internet
→ User
```

핵심 개념을 다시 정리하면 다음과 같다.

| 개념 | 핵심 의미 |
|---|---|
| CI | 코드를 지속적으로 통합하고 자동 검증 |
| CD | 검증된 결과물을 서버에 배포 |
| Artifact | Build 결과물 |
| Docker Image | 실행 환경까지 포함한 배포 Artifact |
| Container | Image를 실행한 Runtime Instance |
| Registry | Docker Image 저장소 |
| Image Tag | Image 버전 식별자 |
| Immutable | 실행 중인 서버를 수정하지 않고 교체하는 방식 |
| Health Check | 실제 서비스가 정상인지 검사 |
| Rollback | 이전 정상 버전으로 복귀 |

### 13. CI/CD를 공부할 때의 질문

Workflow 문법만 외우기보다 다음 흐름을 이해하는 것이 중요하다.

```text
누가 Trigger하는가?
→ 무엇을 Test하는가?
→ 무엇을 Build하는가?
→ 어떤 Artifact가 만들어지는가?
→ Artifact는 어디에 저장되는가?
→ 서버는 무엇을 가져오는가?
→ 어떻게 실행하는가?
→ 정상인지 어떻게 판단하는가?
→ 실패하면 어떻게 되돌리는가?
```

헷갈린다면 각 도구의 역할을 다음처럼 구분하면 된다.

```text
GitHub          = 코드를 저장
Docker Registry = 이미지를 저장
Docker          = 이미지를 Container로 실행
CI/CD           = 이 전체 이동과 검증을 자동화
```

### 14. 다음 실습에서 확인할 것

1. Spring Boot 애플리케이션 작성
2. `./gradlew bootJar` 실행
3. Dockerfile 작성
4. `docker build`와 `docker run` 실행
5. Docker Hub 또는 GHCR에 Push
6. GitHub Actions로 Test, Build, Docker Build, Docker Push 자동화
7. Linux 서버에서 `docker pull` 실행
8. 컨테이너 실행 후 `/actuator/health` 확인
9. v2 이미지 배포
10. 오류를 발생시킨 뒤 v1으로 Rollback

```text
Git
→ CI
→ Artifact
→ Docker
→ Registry
→ Server
→ Container
→ Monitoring
→ Rollback
```
