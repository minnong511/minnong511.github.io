---
layout: post
title: "Actuator 란?"
description: "Spring Boot Actuator는 애플리케이션의 모니터링 및 관리를 위한 다양한 기능을 제공하는 라이브러리"
date: "2026-08-14 17:44:25 +0900"
categories: ["Backend", "SPRING", "Spring"]
tags: []
legacyPath: "/backend/spring/spring/2026/08/14/Acuator/"
---
# Actuator 란? 

Spring Boot Actuator는 애플리케이션의 모니터링 및 관리를 위한 다양한 기능을 제공하는 라이브러리

운영 환경에서 애플리케이션의 상태 health, 메트릭 metrics, 환경 설정 properties, 로그 설정 등을 확인하고 관리 지원

| 기능 | 설명 | 엔드포인트 |
|---|---|---|
| Health Check | 애플리케이션의 실행 상태 확인 | `/actuator/health` |
| Metrics | JVM, CPU, 메모리, GC, 요청 수 등의 성능 지표 제공 | `/actuator/metrics` |
| Prometheus Metrics | Metrics 정보를 Prometheus 형식으로 제공 | `/actuator/prometheus` |
| Info | 애플리케이션 버전, 빌드 정보 등의 메타데이터 제공 | `/actuator/info` |
| Env | 환경 변수와 설정값 정보 제공 | `/actuator/env` |
| Loggers | 애플리케이션의 로깅 레벨 조회 및 동적 변경 | `/actuator/loggers` |
| Beans | IoC 컨테이너에 등록된 Bean 정보 제공 | `/actuator/beans` |

<!-- Actuator -->
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<!-- Actuator metrics 정보를 Prometheus 포맷으로 노출 지원 -->
<dependency>
<groupId>io.micrometer</groupId>
<artifactId>micrometer-registry-prometheus</artifactId>
</dependency>




전체적인 매커니즘을 아는 것이 중요하다.
