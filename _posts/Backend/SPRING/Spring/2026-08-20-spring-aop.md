---
layout: post
title: "Spring 기초 Part 8: AOP와 공통 관심사 분리"
description: "Aspect, Pointcut, Advice, JoinPoint의 의미와 Before, After, Around Advice가 Proxy를 통해 동작하는 흐름을 정리한다."
date: 2026-08-20 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, AOP, Aspect, Pointcut, Advice, Proxy]
series: "Spring 기초"
part: 8
---

## Spring 기초 Part 8: AOP와 공통 관심사 분리

> AOP는 여러 기능에서 반복되는 공통 관심사를 핵심 비즈니스 로직과 분리하는 프로그래밍 방식이다.

Service 메서드의 핵심 목적은 주문, 결제, 회원 조회 같은 업무를 처리하는 것이다.

하지만 로그, 권한 검사, 실행 시간 측정 같은 코드를 모든 메서드에 반복하면 핵심 로직이 흐려진다.

```text
핵심 관심사
→ 주문, 결제, 회원 조회

공통 관심사
→ 로그, 보안, 트랜잭션, 실행 시간 측정
```

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 핵심 질문 |
|---|---|---|
| Aspect | 공통 기능과 적용 규칙을 모아놓은 모듈 | 어떤 공통 기능인가? |
| Target | 공통 기능이 적용될 실제 객체 | 누구를 감쌀 것인가? |
| Join Point | 공통 기능을 적용할 수 있는 실행 지점 | 어느 실행 지점인가? |
| Pointcut | 적용할 메서드를 선택하는 조건 | 어디에 적용할 것인가? |
| Advice | 선택된 지점에서 실행할 공통 기능 | 언제 무엇을 실행할 것인가? |
| Weaving | 공통 기능을 실제 코드 실행에 연결하는 과정 | 어떻게 결합하는가? |
| Proxy | Target 호출을 가로채 Advice를 실행하는 대리 객체 | 실제로 누가 가로채는가? |

Spring AOP에서는 주로 메서드 실행이 Join Point가 된다.

---

### 2. 전체 동작 구조

```text
Controller
    ↓
Spring Proxy
    ↓ Before Advice
실제 Service 메서드
    ↓ After Advice
Spring Proxy
    ↓
Controller
```

Spring은 AOP 설정을 읽고 적용 대상 Bean을 Proxy로 감싼다.

{% capture aop_flow %}
flowchart TD
    C[Controller] --> P[Spring AOP Proxy]
    P --> B[Before Advice]
    B --> T[Target Service]
    T --> A[After Advice]
    A --> P
    P --> C
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Spring AOP 실행 흐름"
  chart=aop_flow
%}

> AOP는 무엇을 어디에 적용할지 정의하고, Spring은 그 설정을 바탕으로 Proxy를 만들며, Proxy가 실제 호출을 가로챈다.

---

### 3. Aspect 만들기

AOP 기능을 사용하려면 일반적으로 AOP Starter를 추가한다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

Aspect 클래스는 다음처럼 시작한다.

```java
@Aspect
@Component
public class LoggingAspect {
}
```

| 어노테이션 | 역할 |
|---|---|
| `@Aspect` | 이 클래스가 AOP 설정과 Advice를 담는 Aspect임을 표시 |
| `@Component` | Spring이 객체를 생성하고 Bean으로 관리하도록 등록 |

`@Aspect`만 붙이고 Bean으로 등록하지 않으면 Spring AOP가 해당 객체를 사용하지 못한다.

---

### 4. Pointcut

Pointcut은 AOP를 적용할 메서드를 고르는 조건이다.

```java
@Pointcut("execution(* com.example.service.*.*(..))")
public void serviceMethods() {
}
```

`serviceMethods()`를 실제 업무 메서드로 호출하는 것이 아니다. 긴 Pointcut 표현식에 이름을 붙인 것이다.

```text
execution(
    *                         반환 타입은 무엇이든 가능
    com.example.service.*    service 패키지의 모든 클래스
    .*                        모든 메서드
    (..)                      매개변수 개수와 타입은 무엇이든 가능
)
```

이 이름을 여러 Advice에서 재사용할 수 있다.

```java
@Before("serviceMethods()")
@After("serviceMethods()")
```

Pointcut 범위를 지나치게 넓게 지정하면 원하지 않는 메서드까지 Proxy 대상이 될 수 있다. 실제 패키지와 클래스 범위를 정확히 확인해야 한다.

---

### 5. Advice 종류

| Advice | 실행 시점 |
|---|---|
| `@Before` | Target 메서드 실행 전 |
| `@After` | 정상 종료와 예외 여부와 관계없이 실행 후 |
| `@AfterReturning` | Target 메서드가 정상 반환한 후 |
| `@AfterThrowing` | Target 메서드에서 예외가 발생한 후 |
| `@Around` | Target 메서드 전체를 감싸고 전후를 직접 제어 |

#### `@Before`

```java
@Before("serviceMethods()")
public void beforeAdvice(JoinPoint joinPoint) {
    System.out.println("[Before] " + joinPoint.getSignature());
}
```

```text
beforeAdvice()
      ↓
실제 메서드
```

#### `@AfterReturning`

```java
@AfterReturning(
        pointcut = "serviceMethods()",
        returning = "result"
)
public void afterReturning(JoinPoint joinPoint, Object result) {
    System.out.println("[Success] " + joinPoint.getSignature());
}
```

정상적으로 값을 반환했을 때만 실행된다.

#### `@AfterThrowing`

```java
@AfterThrowing(
        pointcut = "serviceMethods()",
        throwing = "exception"
)
public void afterThrowing(
        JoinPoint joinPoint,
        Throwable exception) {

    System.out.println("[Failure] " + joinPoint.getSignature());
    System.out.println(exception.getMessage());
}
```

예외가 발생했을 때 로그를 남기는 용도로 사용할 수 있다.

---

### 6. `@Around`

`@Around`는 실제 메서드 실행 전체를 감싼다.

```java
@Around("serviceMethods()")
public Object measureExecutionTime(
        ProceedingJoinPoint joinPoint) throws Throwable {

    long start = System.nanoTime();

    try {
        return joinPoint.proceed();
    } finally {
        long end = System.nanoTime();
        long elapsed = end - start;

        System.out.println(
                joinPoint.getSignature() + " : " + elapsed + "ns"
        );
    }
}
```

실행 순서는 다음과 같다.

```text
Around Advice 시작
       ↓
실행 전 코드
       ↓
joinPoint.proceed()
       ↓
실제 Target 메서드
       ↓
실행 후 코드
       ↓
결과 반환
```

다음 호출이 가장 중요하다.

```java
joinPoint.proceed();
```

이 코드를 실행하지 않으면 실제 Target 메서드가 실행되지 않는다.

```java
@Around("serviceMethods()")
public Object wrongAdvice(ProceedingJoinPoint joinPoint) {
    System.out.println("호출을 가로챔");
    return null; // Target을 호출하지 않음
}
```

반환값을 임의로 없애거나 예외를 삼키면 기존 메서드의 동작을 깨뜨릴 수 있다.

---

### 7. 실제 로그 Aspect 예제

```java
@Aspect
@Component
public class ServiceLoggingAspect {

    @Pointcut("execution(* com.example.service..*(..))")
    public void serviceMethods() {
    }

    @Around("serviceMethods()")
    public Object log(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().toShortString();

        System.out.println("[START] " + method);

        try {
            Object result = joinPoint.proceed();
            System.out.println("[SUCCESS] " + method);
            return result;
        } catch (Throwable exception) {
            System.out.println("[FAILURE] " + method);
            throw exception;
        } finally {
            System.out.println("[END] " + method);
        }
    }
}
```

예외를 기록한 뒤 다시 던져야 Controller의 예외 처리와 트랜잭션 롤백 흐름이 유지된다.

---

### 8. AOP와 Proxy의 역할 구분

```text
AOP
→ 로그 기능을 Service 패키지의 메서드에 적용하겠다고 정의

Spring
→ 설정을 읽고 적용 대상 Bean을 확인

Proxy
→ 실제 메서드 호출을 가로채 Advice 실행

Target
→ 원래 비즈니스 로직 실행
```

| 구분 | 핵심 역할 |
|---|---|
| AOP | 공통 기능과 적용 범위를 정의 |
| Spring | Aspect를 읽고 Proxy를 구성 |
| Proxy | 호출을 가로채 Advice 실행 |
| Target | 원래 업무 로직 실행 |

Spring AOP가 Proxy를 사용한다고 해서 모든 AOP 구현이 Proxy만 사용하는 것은 아니다. AspectJ처럼 컴파일 시점이나 로딩 시점에 코드를 결합하는 방식도 있다.

---

### 9. 주의할 점

#### 자기 호출

같은 객체의 내부 호출은 Spring Proxy를 다시 거치지 않으므로 Advice가 적용되지 않을 수 있다.

```java
public void outer() {
    inner();
}
```

#### 중복 Proxy

같은 기능에 수동 Proxy와 Spring AOP를 동시에 적용하면 로그나 실행 시간 측정이 두 번 실행될 수 있다.

#### 민감 정보 로그

메서드 인자를 전부 기록하면 비밀번호, 토큰, 개인정보가 로그에 남을 수 있다. 기록 대상을 제한해야 한다.

#### AOP에 업무 로직 넣지 않기

AOP는 반복되는 기반 기능에 적합하다. 주문 금액 계산 같은 핵심 업무 규칙은 Service나 도메인 객체에 둔다.

---

### 핵심 정리

| 개념 | 한 줄 정리 |
|---|---|
| Aspect | 공통 기능과 적용 규칙을 모은 모듈 |
| Pointcut | 적용할 메서드를 선택하는 조건 |
| Advice | 선택된 메서드에서 실행할 공통 기능 |
| `@Around` | 실제 메서드 전체를 감싸는 Advice |
| `proceed()` | 실제 Target 메서드를 실행 |
| Proxy | Advice와 Target 호출을 실제로 연결하는 대리 객체 |

> AOP는 공통 기능을 핵심 로직에서 분리하고, Spring AOP는 Proxy를 이용해 선택한 메서드의 앞뒤에서 그 기능을 실행한다.

### 참고 자료

- [Spring Framework AOP 공식 문서](https://docs.spring.io/spring-framework/reference/core/aop.html)
