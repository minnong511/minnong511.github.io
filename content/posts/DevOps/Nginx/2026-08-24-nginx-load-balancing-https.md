---
layout: post
title: "Nginx 로드 밸런싱과 HTTPS"
description: "Nginx가 요청을 여러 서버로 분산하는 방법과 HTTPS 인증서를 처리하는 구조를 정리한다."
date: 2026-08-24 00:40:00 +0900
categories: [DevOps, Nginx]
tags: [Nginx, LoadBalancing, HTTPS, TLS, DevOps]
series: "Nginx 기초"
part: 3
legacyPath: "/devops/nginx/2026/08/24/nginx-load-balancing-https/"
---
## 1. 로드 밸런싱이란?

로드 밸런싱은 하나의 서버에 요청이 몰리지 않도록 여러 서버에 요청을 나누어 전달하는 방식입니다.

```text
                   ┌─ Spring Boot 1 :8081
Client → Nginx ────┼─ Spring Boot 2 :8082
                   └─ Spring Boot 3 :8083
```

## 2. `upstream` 설정

```nginx
upstream backend_servers {
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    server 127.0.0.1:8083;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend_servers;
    }
}
```

## 3. HTTPS와 TLS 인증서

HTTPS를 사용하면 클라이언트와 Nginx 사이에서 주고받는 데이터를 암호화할 수 있습니다.

```text
Client
  ↓ HTTPS
Nginx
  ↓ HTTP 또는 HTTPS
Backend Server
```

## 4. HTTPS 설정 구조

<!-- 인증서 경로와 80 포트에서 443 포트로 리다이렉트하는 설정을 정리합니다. -->

## 5. 핵심 정리

- Nginx는 여러 Backend Server에 요청을 분산할 수 있습니다.
- HTTPS 인증서를 Nginx에서 관리할 수 있습니다.
- Backend Server는 비즈니스 로직에 집중할 수 있습니다.
