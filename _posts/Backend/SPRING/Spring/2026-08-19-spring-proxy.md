---
layout: post
title: "Spring 기초 Part 7: Proxy 패턴과 Spring Proxy"
description: "대리 객체인 Proxy가 실제 객체의 호출을 감싸는 원리와 Spring의 JDK Dynamic Proxy, CGLIB, 자기 호출 문제를 정리한다."
date: 2026-08-19 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, Proxy, Dynamic Proxy, JDK Proxy, CGLIB, Bean]
series: "Spring 기초"
part: 7
---

## Spring 기초 Part 7: Proxy 패턴과 Spring Proxy

> Proxy는 Client와 실제 객체 사이에서 요청을 먼저 받고, 실제 메서드 호출 전후에 부가 기능을 수행하는 대리 객체다.

```text
Client
  → Proxy
  → 실제 객체
```

Proxy를 이해하면 `@Transactional`, `@Async`, `@Cacheable`, Spring AOP가 왜 같은 클래스의 내부 호출에서 동작하지 않을 수 있는지도 이해할 수 있다.

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉽게 말하면 |
|---|---|---|
| Client | 기능을 요청하는 객체 | Service를 호출하는 Controller |
| Subject | Proxy와 실제 객체가 함께 따르는 인터페이스 | 두 객체의 공통 사용법 |
| RealSubject | 핵심 기능을 실제로 처리하는 객체 | 실제 Service |
| Proxy | 실제 객체 대신 요청을 먼저 받는 객체 | 대리인 |
| Target | Proxy가 감싸고 있는 실제 대상 객체 | Proxy 내부의 Service |
| Wrapping | 한 객체가 다른 객체를 내부에 보관하는 구조 | Proxy가 Target을 감쌈 |
| Delegation | 받은 작업을 다른 객체에 넘기는 것 | Proxy가 실제 작업을 Target에 전달 |
| 전처리 | 실제 메서드 실행 전에 수행하는 작업 | 트랜잭션 시작, 권한 확인 |
| 후처리 | 실제 메서드 실행 후 수행하는 작업 | 커밋, 로그 기록 |
| 동적 Proxy | 실행 시점에 자동으로 생성되는 Proxy | 개발자가 Proxy 클래스를 직접 작성하지 않음 |
| Bean | Spring Container가 생성하고 관리하는 객체 | Spring이 보관하고 주입하는 객체 |

---

### 2. Proxy 패턴의 기본 구조

Proxy와 실제 객체는 같은 인터페이스를 사용한다.

```java
public interface UserService {
    String findUserName(Long id);
}
```

#### 실제 객체

```java
public class UserServiceImpl implements UserService {

    @Override
    public String findUserName(Long id) {
        System.out.println("실제 사용자 조회");
        return "민형";
    }
}
```

#### Proxy 객체

```java
public class UserServiceProxy implements UserService {

    private final UserService target;

    public UserServiceProxy(UserService target) {
        this.target = target;
    }

    @Override
    public String findUserName(Long id) {
        System.out.println("조회 시작");

        String result = target.findUserName(id);

        System.out.println("조회 종료");
        return result;
    }
}
```

#### Client

```java
public class ProxyExample {

    public static void main(String[] args) {
        UserService target = new UserServiceImpl();
        UserService proxy = new UserServiceProxy(target);

        String name = proxy.findUserName(1L);
        System.out.println(name);
    }
}
```

```text
Client가 proxy.findUserName() 호출
          ↓
Proxy가 "조회 시작" 출력
          ↓
target.findUserName()에 실제 작업 위임
          ↓
Proxy가 "조회 종료" 출력
          ↓
결과 반환
```

Proxy 안의 다음 코드가 위임이다.

```java
String result = target.findUserName(id);
```

---

### 3. Proxy를 사용하는 이유

회원 조회 Service의 핵심 목적은 회원을 조회하는 것이다.

```java
public User findUser(Long id) {
    return userRepository.findById(id).orElseThrow();
}
```

여기에 로그, 실행 시간, 권한 검사, 트랜잭션 코드를 모두 넣으면 핵심 로직이 흐려진다.

```java
public User findUser(Long id) {
    long startTime = System.currentTimeMillis();
    checkPermission();
    beginTransaction();

    User user = userRepository.findById(id).orElseThrow();

    commitTransaction();
    logExecutionTime(startTime);
    return user;
}
```

Proxy가 공통 기능을 맡으면 실제 Service는 업무 로직에 집중할 수 있다.

| 실제 Service | Proxy |
|---|---|
| 회원 조회, 주문 처리, 재고 감소 | 로그, 권한, 트랜잭션, 캐시 |

Proxy가 처리할 수 있는 기능은 다음과 같다.

| 기능 | Proxy가 하는 일 |
|---|---|
| 트랜잭션 | 메서드 전후에 시작, 커밋, 롤백 처리 |
| 로그 | 메서드 실행 정보 기록 |
| 권한 검사 | 실제 메서드 실행 전에 접근 권한 확인 |
| 캐시 | 저장된 결과가 있으면 실제 메서드 호출 생략 |
| 실행 시간 측정 | 시작과 종료 시각 비교 |
| 비동기 실행 | 작업을 Executor에 제출 |

---

### 4. Bean과 Proxy의 관계

Bean은 Spring Container가 관리하는 객체다.

```java
@Service
public class TransferService {
}
```

`@Service`가 붙었다고 항상 Proxy가 생성되는 것은 아니다. Spring이 적용해야 할 부가 기능을 발견했을 때 Proxy로 감쌀 수 있다.

```java
@Service
public class TransferService {

    @Transactional
    public void transfer() {
        // 출금과 입금
    }
}
```

```text
Component Scan
   ↓
TransferService 객체 생성
   ↓
@Transactional 적용 대상 확인
   ↓
Proxy가 Target을 감쌈
   ↓
다른 Bean에는 Proxy가 주입됨
```

Controller가 `TransferService`를 호출한다고 생각하지만, 실제 참조가 Proxy일 수 있다.

```text
Controller
   ↓
TransferService Proxy
   ↓ 트랜잭션 시작
실제 TransferService
   ↓
Proxy가 커밋 또는 롤백
```

---

### 5. Spring의 동적 Proxy

Spring은 실행 시점에 Proxy 객체를 자동으로 만들 수 있다.

| 구분 | JDK Dynamic Proxy | CGLIB Proxy |
|---|---|---|
| 기준 | 인터페이스 | 클래스 |
| 인터페이스 필요 여부 | 필요 | 없어도 됨 |
| 생성 방식 | Reflection을 이용한 Proxy 생성 | 대상 클래스를 상속한 하위 클래스 생성 |
| 주요 제약 | 인터페이스에 선언된 호출 중심 | `final` 클래스와 `final` 메서드 재정의 불가 |

Spring Boot에서는 클래스 기반 Proxy가 널리 사용되지만, 실제 방식은 설정과 대상 구조에 따라 달라질 수 있다. 코드를 작성할 때 특정 Proxy 방식에 과도하게 의존하지 않는 것이 좋다.

---

### 6. `@Transactional` 호출 흐름

```java
@Transactional
public void updateUser(Long id, String name) {
    User user = userRepository.findById(id).orElseThrow();
    user.changeName(name);
}
```

개발자가 작성한 메서드에는 회원 수정 로직만 있다. 트랜잭션 처리는 Proxy가 앞뒤에서 수행한다.

{% capture transactional_proxy_flow %}
flowchart TD
    C[Controller] --> P[Transactional Proxy]
    P --> B[트랜잭션 시작]
    B --> T[실제 updateUser 실행]
    T --> Q{정상 종료?}
    Q -->|예| COMMIT[Commit]
    Q -->|아니오| ROLLBACK[Rollback]
    COMMIT --> C
    ROLLBACK --> C
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Transactional Proxy 호출 흐름"
  chart=transactional_proxy_flow
%}

---

### 7. 자기 호출 문제

Spring Proxy는 **Proxy를 거쳐 들어오는 호출**을 가로챈다.

같은 객체 안에서 자신의 메서드를 직접 호출하면 Proxy를 거치지 않는다.

```java
@Service
public class PaymentService {

    public void order() {
        pay(); // 같은 객체의 내부 호출
    }

    @Transactional
    public void pay() {
        // 결제 처리
    }
}
```

```text
외부 호출
→ Proxy
→ @Transactional 적용 가능

같은 객체의 pay() 내부 호출
→ Proxy를 다시 거치지 않음
→ 새 트랜잭션 설정이 적용되지 않을 수 있음
```

이것을 Self-invocation, 자기 호출 문제라고 한다.

트랜잭션 경계가 분명히 달라야 한다면 별도 Bean으로 분리하는 방법을 사용할 수 있다.

```java
@Service
public class PaymentProcessor {

    @Transactional
    public void pay() {
        // 결제 처리
    }
}
```

```java
@Service
public class OrderService {

    private final PaymentProcessor paymentProcessor;

    public OrderService(PaymentProcessor paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }

    public void order() {
        paymentProcessor.pay(); // 다른 Bean의 Proxy를 통해 호출
    }
}
```

---

### 8. Proxy와 AOP의 차이

| 구분 | 역할 |
|---|---|
| AOP | 어떤 공통 기능을 어디에 적용할지 정의하는 설계 방식 |
| Proxy | 실제 메서드 호출을 가로채 공통 기능을 실행하는 객체 |
| Spring | AOP 설정을 읽고 Proxy를 자동 생성하고 관리 |

> AOP가 곧 Proxy인 것은 아니다. Spring AOP가 공통 기능을 적용하는 핵심 구현 방식으로 Proxy를 사용하는 것이다.

---

### 핵심 정리

| 개념 | 한 줄 정리 |
|---|---|
| Proxy | 실제 객체 대신 요청을 먼저 받는 대리 객체 |
| Target | Proxy가 감싸고 있는 실제 객체 |
| Wrapping | Proxy가 Target을 내부에 보관하는 구조 |
| Delegation | Proxy가 실제 작업을 Target에 전달하는 것 |
| 동적 Proxy | 실행 시점에 자동으로 생성되는 Proxy |
| 자기 호출 | 같은 객체 내부 호출이 Proxy를 거치지 않는 문제 |

> Proxy의 핵심은 실제 업무 코드를 크게 바꾸지 않고 메서드 호출 앞뒤에 공통 기능을 추가하는 것이다.

### 참고 자료

- [Spring Framework AOP Proxying Mechanisms](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
