---
layout: post
title: "Nginx 리버스 프록시와 Spring Boot 연결"
description: "리버스 프록시의 의미와 Nginx가 클라이언트 요청을 Spring Boot 서버로 전달하는 과정을 정리한다."
date: 2026-08-24 00:30:00 +0900
categories: [DevOps, Nginx]
tags: [Nginx, ReverseProxy, SpringBoot, DevOps]
series: "Nginx 기초"
part: 2
---

## 1. 리버스 프록시란?

리버스 프록시는 클라이언트의 요청을 대신 받은 뒤 내부 Backend Server로 전달하는 서버입니다.

```text
Client
  ↓ example.com
Nginx :80
  ↓ proxy_pass
Spring Boot :8080
```

클라이언트는 Spring Boot의 주소와 포트를 직접 알지 않아도 Nginx를 통해 API를 호출할 수 있습니다.

## 2. Nginx와 Spring Boot의 역할

| 구성 요소 | 역할 |
|---|---|
| Nginx | 외부 요청 수신, 정적 파일 제공, 요청 전달 |
| Spring Boot | 비즈니스 로직 실행, API 응답 생성 |

## 3. `proxy_pass` 설정

```nginx
server {
    listen 80;
    server_name example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. 요청 전달 흐름

<!-- 실제 요청 URL과 Spring Controller 예제를 사용해서 흐름을 정리합니다. -->

## 5. 핵심 정리

- 사용자는 Nginx의 주소로 요청합니다.
- Nginx는 설정된 Backend Server로 요청을 전달합니다.
- Spring Boot가 생성한 응답은 Nginx를 거쳐 사용자에게 돌아갑니다.
