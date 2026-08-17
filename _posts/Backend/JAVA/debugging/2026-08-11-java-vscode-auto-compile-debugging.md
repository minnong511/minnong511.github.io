---
layout: post
title: "Java 디버깅 Part 2: VS Code 자동 컴파일과 프로젝트 구조"
description: "VS Code의 Java 자동 빌드 동작, .class 파일 위치, Maven과 Gradle 기반 프로젝트 구조, 자동 재시작 도구를 정리한다."
date: 2026-08-11 09:00:00 +0900
categories: [java, debugging]
tags: [Java, Debugging, VS Code, Compiler, Maven, Gradle, Spring Boot, DevTools]
series: "Java 디버깅"
part: 2
---

## Java 디버깅 Part 2: VS Code 자동 컴파일과 프로젝트 구조

VS Code에서는 왜 자동 컴파일이 바로 안 보이는 걸까? 내가 굳이 그 디렉토리로 이동해서 컴파일해야 하는 걸까? 코드가 바뀌면 알아서 다시 컴파일해 주는 도구는 없는 걸까?

일단 `자동 컴파일`과 내가 보고 있는 폴더에 `.class` 파일이 생기는 것은 같은 얘기가 아니다.

### VS Code에서는 어떻게 실행되는가

예를 들어 `Calculator.java`가 아래처럼 있다고 하자.

```java
public class Calculator {
    public static void main(String[] args) {
        int result = 10 + 20;

        System.out.println(result);
    }
}
```

VS Code에서 Java 프로젝트가 정상적으로 잡혀 있다면, 저장할 때 내부적으로 최신 클래스를 만들고 `Run Java`로 실행할 수 있다.

```text
Calculator.java 수정
    ↓
Ctrl+S / Cmd+S
    ↓
Java Language Server
    ↓
자동 빌드
    ↓
내부 bin에 최신 class 생성
    ↓
Run Java
    ↓
최신 코드 실행
```

그래서 매번 아래처럼 직접 컴파일할 필요는 없다.

```bash
cd 6.exception
javac Calculator.java
java Calculator
```

다만 VS Code가 지금 열어 둔 폴더를 Java 프로젝트로 제대로 인식했을 때 이야기다.

### 프로젝트 구조가 애매한 경우

아래처럼 챕터별 폴더만 있는 단순 실습 구조라면 VS Code가 이 폴더를 일반적인 Java 프로젝트로 정확히 잡지 못할 수 있다.

```text
java-springboot/
├── 1.basic/
├── 2.object/
├── 3.inheritance/
├── 6.exception/
│   └── Calculator.java
└── ...
```

이런 경우 VS Code는 폴더를 `unmanaged folder` 형태로 처리할 수 있다. 그래서 내가 원하는 위치에 `.class`가 안 보이거나, 직접 `javac`를 실행해야 하는 것처럼 느껴질 수 있다.

보통 Java에서는 Maven이나 Gradle 프로젝트 구조를 사용한다.

```text
project/
├── pom.xml
└── src/
    └── main/
        └── java/
            └── ...
```

이 구조면 Maven이나 Gradle이 소스 폴더, 빌드 결과 폴더, 필요한 라이브러리를 알고 있어서 훨씬 안정적으로 동작한다.

```text
Maven / Gradle
    ↓
소스 탐색
    ↓
의존성 해결
    ↓
컴파일
    ↓
테스트
    ↓
패키징
```

VS Code도 Maven과 Gradle을 Java 빌드 도구 워크플로로 지원한다.

### 코드 변경 시 자동 재실행까지

자동 컴파일은 저장한 코드를 다시 빌드하는 것까지다.

```text
코드 저장
    ↓
.class 갱신
```

실행 중인 애플리케이션까지 자동으로 다시 시작하려면 별도 도구가 필요하다.

```text
코드 저장
    ↓
컴파일
    ↓
실행 중인 애플리케이션 재시작
```

Spring Boot를 쓰는 단계가 되면 `spring-boot-devtools`를 추가해서 개발 중 재시작을 더 편하게 할 수 있다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
</dependency>
```
