---
layout: post
title: "Docker 실습 초안: Spring Boot 애플리케이션 컨테이너화"
description: "Spring Boot 애플리케이션의 Docker Image를 만들고 MySQL과 연결해 Docker Compose로 실행하는 과정을 정리한다."
date: 2026-08-17 22:00:00 +0900
categories: [DevOps, Docker]
tags: [Docker, Spring Boot, MySQL, Docker Compose, DevOps]
series: "Docker 실습"
part: 1
published: false
legacyPath: "/devops/docker/2026/08/17/docker-spring-boot-practice-draft/"
---
이미지 넣어서 설명 ㄱ 

## 1. 이번 편에서 만들 구조

## 2. 실습 전 준비 사항

### Docker 실행 환경 확인

### Spring Boot 프로젝트 준비

## 3. Spring Boot 애플리케이션 Build

### 실행 가능한 JAR 파일 만들기

### Docker 없이 먼저 실행 확인하기

## 4. Spring Boot용 Dockerfile 작성

### Base Image 선택

### WORKDIR, COPY, EXPOSE, ENTRYPOINT 설정

### `.dockerignore` 작성

## 5. Docker Image Build

### Image 이름과 Tag 지정

### 생성된 Image 확인

### Image 세부 정보 확인

## 6. Spring Boot Container 실행

### Container 이름 지정

### Port Mapping

### 백그라운드 실행

## 7. 환경변수와 Spring Profile 적용

### `-e` 옵션으로 환경변수 전달

### `application.yml`과 환경변수 연결

### 개발 환경과 운영 환경 분리

## 8. Container 상태 확인과 관리

### 실행 중인 Container 확인

### Log 확인

### Container 내부 접속

### 중지, 재시작, 삭제

## 9. Docker Volume 사용

### Container 내부 데이터가 사라지는 이유

### Volume 생성과 연결

### Volume 데이터 확인

## 10. Docker Network 구성

### 사용자 정의 Network 생성

### Spring Boot Container와 MySQL Container 연결

### Container 사이에서 `localhost`를 사용할 수 없는 이유

## 11. MySQL Container 실행

### MySQL 환경변수 설정

### MySQL 데이터 Volume 연결

### Spring Boot에서 MySQL 접속

## 12. Docker Compose로 통합

### `compose.yml` 작성

### Spring Boot와 MySQL Service 정의

### 여러 Container 한 번에 실행하고 종료하기

## 13. `depends_on`과 Health Check

### Container 시작 순서와 서비스 준비 상태의 차이

### MySQL Health Check 추가

### Spring Boot 재시작 정책 설정

## 14. Docker Image 최적화

### Layer Cache 활용

### Multi-stage Build

### Image 크기 비교

## 15. 운영 환경에서 주의할 점

### Container를 Root 사용자로 실행하지 않기

### 비밀번호와 Secret을 Image에 포함하지 않기

### Log와 데이터의 저장 위치 분리

## 16. Docker Registry에 Image 올리기

### Image Tag 변경

### Registry Login

### Image Push와 Pull

## 17. 자주 발생하는 오류와 확인 순서

### Port 충돌

### Container가 바로 종료되는 문제

### Spring Boot와 MySQL 연결 실패

### Image Build Cache 문제

## 18. 전체 실행 흐름 정리

## 19. 다음 편 예고: Docker Image를 이용한 CI/CD
