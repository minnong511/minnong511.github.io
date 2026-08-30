---
layout: post
title: "Nginx 기초와 동작 구조"
description: "Nginx가 무엇인지 알아보고 Web Server, 정적 파일 제공, 요청 처리 구조를 정리한다."
date: 2026-08-24 00:20:00 +0900
categories: [DevOps, Nginx]
tags: [Nginx, WebServer, DevOps, Network]
series: "Nginx 기초"
part: 1
legacyPath: "/devops/nginx/2026/08/24/nginx-basics/"
---
## 1. Nginx란?

Nginx는 클라이언트의 HTTP 요청을 받아 정적 파일을 제공하거나 요청을 다른 서버로 전달하는 Web Server입니다.

```text
Client
  ↓ HTTP Request
Nginx
  ├─ HTML, CSS, JavaScript 제공
  └─ Backend Server로 요청 전달
```

## 2. Nginx를 사용하는 이유

<!-- 정적 파일 제공, 동시 요청 처리, 리버스 프록시 등의 내용을 정리합니다. -->

## 3. Nginx의 요청 처리 흐름

<!-- Client부터 Nginx를 거쳐 응답이 돌아오는 과정을 정리합니다. -->

## 4. 기본 설정 파일 구조

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
```

## 5. 핵심 정리

- Nginx는 클라이언트의 HTTP 요청을 가장 먼저 받을 수 있습니다.
- 정적 파일을 직접 제공할 수 있습니다.
- 요청을 Spring Boot와 같은 Backend Server로 전달할 수 있습니다.
