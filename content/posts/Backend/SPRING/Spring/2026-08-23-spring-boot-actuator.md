---
layout: post
title: "Spring 기초 Part 11: Actuator와 애플리케이션 모니터링"
description: "Spring Boot Actuator의 Health, Metrics, Prometheus 엔드포인트와 노출 설정, 운영 환경 보안 주의사항을 정리한다."
date: 2026-08-23 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring Boot, Actuator, Monitoring, Metrics, Micrometer, Prometheus]
series: "Spring 기초"
part: 11
legacyPath: "/java/spring/2026/08/23/spring-boot-actuator/"
---
## Spring 기초 Part 11: Actuator와 애플리케이션 모니터링

> Spring Boot Actuator는 실행 중인 애플리케이션의 상태와 성능 지표를 확인하고 관리할 수 있도록 운영용 엔드포인트를 제공한다.

애플리케이션이 실행된다고 운영 준비가 끝난 것은 아니다.

```text
서버가 살아 있는가?
DB 연결은 정상인가?
메모리를 얼마나 사용하는가?
요청이 얼마나 들어오는가?
오류가 증가하고 있는가?
```

Actuator와 Metrics는 이런 질문에 답할 수 있는 정보를 제공한다.

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉽게 말하면 |
|---|---|---|
| 모니터링 | 애플리케이션 상태와 성능을 지속적으로 관찰하는 작업 | 서버가 정상인지 확인 |
| Endpoint | 운영 정보를 조회하거나 관리하는 접근 지점 | `/actuator/health` |
| Health Check | 애플리케이션과 의존 시스템의 정상 여부 확인 | DB 연결 상태 확인 |
| Metric | 시간에 따라 측정되는 수치 데이터 | CPU 사용량, 요청 수 |
| Micrometer | 여러 모니터링 시스템에 Metrics를 전달하는 계측 라이브러리 | Metrics 공통 인터페이스 |
| Prometheus | Metrics를 주기적으로 수집하고 저장하는 모니터링 시스템 | Actuator Metrics 수집기 |
| Scrape | Prometheus가 애플리케이션의 Metrics Endpoint를 주기적으로 조회 | `/actuator/prometheus` 호출 |
| Metadata | 애플리케이션을 설명하는 부가 정보 | 버전, 빌드 정보 |

---

### 2. 의존성 추가

Maven 프로젝트에 Actuator Starter를 추가한다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Prometheus 형식으로 Metrics를 제공하려면 Registry도 추가한다.

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

```text
Spring Boot Actuator
        ↓
Micrometer가 Metrics 수집
        ↓
Prometheus Registry가 형식 변환
        ↓
/actuator/prometheus로 노출
        ↓
Prometheus가 주기적으로 수집
```

---

### 3. 주요 엔드포인트

| 기능 | 설명 | 엔드포인트 |
|---|---|---|
| Health | 애플리케이션과 의존 시스템의 상태 확인 | `/actuator/health` |
| Metrics | JVM, CPU, 메모리, GC, 요청 수 등의 지표 조회 | `/actuator/metrics` |
| Prometheus | Metrics를 Prometheus Scrape 형식으로 제공 | `/actuator/prometheus` |
| Info | 버전과 빌드 정보 등의 Metadata 제공 | `/actuator/info` |
| Env | 환경 변수와 설정 속성 정보 제공 | `/actuator/env` |
| Loggers | Logger 목록과 Log Level 조회 및 변경 | `/actuator/loggers` |
| Beans | Spring Container에 등록된 Bean 정보 제공 | `/actuator/beans` |
| Mappings | Controller의 URL Mapping 정보 제공 | `/actuator/mappings` |

엔드포인트가 Actuator에 존재하는 것과 HTTP로 외부에 노출되는 것은 다른 문제다.

> 기본 설정에서는 일반적으로 `health`만 HTTP와 JMX에 노출된다. 다른 엔드포인트는 필요한 항목을 명시적으로 노출해야 한다.

---

### 4. Health Check

```bash
curl 'http://localhost:8080/actuator/health'
```

정상 상태라면 다음과 같은 응답을 확인할 수 있다.

```json
{
  "status": "UP"
}
```

| 상태 | 의미 |
|---|---|
| `UP` | 정상적으로 동작 중 |
| `DOWN` | 구성 요소가 동작하지 않음 |
| `OUT_OF_SERVICE` | 서비스 대상에서 제외된 상태 |
| `UNKNOWN` | 상태를 판단할 수 없음 |

Health 정보의 상세 내용을 얼마나 공개할지는 별도로 설정한다.

```yaml
management:
  endpoint:
    health:
      show-details: when_authorized
```

운영 환경에서 DB 주소나 내부 구성 정보가 불필요하게 공개되지 않도록 주의한다.

---

### 5. Metrics

Metrics Endpoint를 노출한 뒤 사용 가능한 지표 이름을 확인할 수 있다.

```bash
curl 'http://localhost:8080/actuator/metrics'
```

특정 지표를 조회하려면 이름을 URL 뒤에 붙인다.

```bash
curl 'http://localhost:8080/actuator/metrics/jvm.memory.used'
```

대표적인 지표는 다음과 같다.

| 지표 | 의미 |
|---|---|
| `jvm.memory.used` | JVM이 사용 중인 메모리 |
| `jvm.gc.pause` | Garbage Collection 정지 시간 |
| `jvm.threads.live` | 현재 활성 Thread 수 |
| `process.cpu.usage` | 애플리케이션 프로세스 CPU 사용률 |
| `system.cpu.usage` | 시스템 전체 CPU 사용률 |
| `http.server.requests` | HTTP 요청 수와 처리 시간 |

Metrics는 한 번 확인하는 값보다 시간에 따른 변화와 평소 기준을 함께 보는 것이 중요하다.

---

### 6. Prometheus 연동

Prometheus Registry 의존성을 추가하고 Endpoint를 노출하면 다음 주소에서 Metrics를 확인할 수 있다.

```bash
curl 'http://localhost:8080/actuator/prometheus'
```

```text
# HELP jvm_memory_used_bytes ...
# TYPE jvm_memory_used_bytes gauge
jvm_memory_used_bytes{area="heap",...} 1.2345678E8
```

Prometheus는 이 Endpoint를 주기적으로 Scrape한다.

```yaml
scrape_configs:
  - job_name: "spring-app"
    metrics_path: "/actuator/prometheus"
    static_configs:
      - targets: ["localhost:8080"]
```

```text
Spring Boot
  → /actuator/prometheus
  → Prometheus 수집
  → 시계열 데이터 저장
  → Grafana Dashboard와 Alert
```

---

### 7. 필요한 엔드포인트만 노출하기

학습 환경에서 `health`, `info`, `metrics`, `prometheus`만 노출하는 예다.

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus

  endpoint:
    health:
      show-details: when_authorized
```

다음 설정은 모든 Endpoint를 노출한다.

```yaml
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

학습용 로컬 환경에서는 편할 수 있지만 운영 환경에서는 권장하지 않는다.

`env`, `beans`, `mappings`, `loggers` 등은 내부 구조와 설정 정보를 보여주거나 동작을 변경할 수 있다. 필요한 Endpoint만 선택하고 인증, 방화벽, 내부 네트워크 등의 보호 수단을 적용한다.

---

### 8. 관리 포트 분리

Actuator를 애플리케이션과 다른 포트에서 실행할 수도 있다.

```yaml
management:
  server:
    port: 8081
```

```text
사용자 API
→ 8080

Actuator 관리 Endpoint
→ 8081
```

포트를 분리했다고 자동으로 안전해지는 것은 아니다. 외부 Network에서 관리 포트에 접근할 수 없도록 구성해야 한다.

로컬 주소에서만 수신하려면 관리 포트를 분리한 뒤 다음과 같은 설정을 고려할 수 있다.

```yaml
management:
  server:
    port: 8081
    address: 127.0.0.1
```

---

### 9. 운영 환경 체크리스트

| 확인 항목 | 이유 |
|---|---|
| 필요한 Endpoint만 노출했는가? | 불필요한 내부 정보 공개 방지 |
| 인증 또는 Network 접근 제어가 있는가? | 외부 사용자의 관리 기능 접근 차단 |
| Health 상세 정보 공개 범위가 적절한가? | DB와 내부 시스템 정보 보호 |
| Prometheus Endpoint를 내부에서만 수집하는가? | Metrics 정보 노출 방지 |
| 비밀번호와 Token이 설정 파일이나 응답에 노출되지 않는가? | Credential 유출 방지 |
| Alert 기준을 설정했는가? | 장애를 사람이 계속 화면을 보지 않아도 감지 |

Actuator는 정보를 제공하는 도구다. 장애 대응을 자동화하려면 Prometheus Alertmanager, Grafana Alerting 같은 별도의 알림 체계도 필요하다.

---

### 핵심 정리

| 개념 | 한 줄 정리 |
|---|---|
| Actuator | 애플리케이션의 운영 상태를 제공하는 Spring Boot 기능 |
| Health | 애플리케이션과 의존 시스템의 정상 여부 확인 |
| Metrics | JVM, CPU, 요청 수 등의 측정값 |
| Micrometer | Metrics 수집과 Registry 연결을 위한 계측 Facade |
| Prometheus | Metrics Endpoint를 주기적으로 Scrape하고 저장 |
| Endpoint 노출 | 존재하는 Endpoint 중 HTTP로 공개할 범위를 설정 |

> Actuator의 핵심은 모든 Endpoint를 여는 것이 아니라, 운영에 필요한 정보를 안전하게 노출하고 지속적으로 관찰하는 것이다.

### 참고 자료

- [Spring Boot Actuator Endpoint 공식 문서](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)
- [Spring Boot Actuator Metrics 공식 문서](https://docs.spring.io/spring-boot/reference/actuator/metrics.html)
- [Spring Boot HTTP Monitoring 공식 문서](https://docs.spring.io/spring-boot/reference/actuator/monitoring.html)
