---
layout: post
title: "Spring 기초 Part 1: IoC, Bean, DI와 주요 Annotation"
description: "Spring을 사용하는 이유와 IoC Container, Bean, DI, Component Scan, Spring MVC, Transaction의 관계를 정리한다."
date: 2026-08-11 19:20:00 +0900
categories: [java, spring]
tags: [Java, Spring, Spring Framework, IoC, DI, Bean, Annotation, Spring MVC, Transaction]
series: "Spring 기초"
part: 1
---

# Spring 기초 Part 1: IoC, Bean, DI와 주요 Annotation

## 1. Spring이란 무엇인가

Spring이 뭔지 일단 한 문장으로 말하면 다음과 같다.

> Spring은 Java 객체를 대신 생성하고 관리하며, 서로 연결해 주고, 웹 요청 처리나 DB Transaction 같은 애플리케이션 기능까지 제공하는 Framework다.

여기서 **Framework**란 애플리케이션의 전체 구조와 실행 흐름을 제공하고, 정해진 시점에 개발자가 작성한 코드를 호출하는 기반을 말한다. 개발자가 필요할 때 직접 호출하는 Library와 비교하면, Framework는 애플리케이션의 흐름을 주도한다는 특징이 있다.

Spring을 처음 배우면 Annotation부터 정말 많이 보게 된다. 그런데 일단 다음 세 개념의 관계부터 이해해야 한다.

1. **IoC Container**: 객체를 생성하고 관리하는 공간
2. **Bean**: Spring Container가 관리하는 객체
3. **DI**: Bean이 필요로 하는 다른 Bean을 넣어 주는 방식

관계를 한 줄로 나타내면 다음과 같다.

```text
Spring Container가 Bean을 생성하고, Bean 사이의 의존 관계를 DI로 연결한다.
```

### Spring을 왜 사용하는가

그냥 Java에서 직접 `new`를 사용해도 애플리케이션을 만들 수 있다. 그런데 규모가 커지면 객체 생성과 연결, 설정, Transaction, 웹 요청 처리 같은 반복 코드가 빠르게 늘어난다. Spring은 이러한 문제를 다음과 같이 줄여 준다.

- **객체 관리 자동화**: 객체 생성, 의존 관계 설정, 생명주기 관리를 Container에 맡길 수 있다.
- **낮은 결합도**: 클래스가 구체적인 구현 객체를 직접 생성하지 않으므로 구현 교체와 테스트가 쉬워진다.
- **관심사 분리**: Controller, Service, Repository처럼 역할을 나누어 코드를 관리할 수 있다.
- **선언적 기능 사용**: `@Transactional` 같은 애너테이션으로 반복적인 기반 코드를 직접 작성하지 않고 기능을 적용할 수 있다.
- **일관된 생태계**: Spring MVC, Spring Data 등 여러 모듈을 같은 객체 관리 방식과 설정 모델로 사용할 수 있다.

그렇다고 모든 객체를 무조건 Bean으로 만들어야 하는 것은 아니다. 값만 담는 단순 객체나 한 메서드 안에서 잠깐 사용하는 객체처럼 Container의 관리가 필요 없는 객체는 직접 `new`로 생성해도 된다.

## 2. 먼저 알아둘 용어

| 용어 | 정의 |
| --- | --- |
| 객체(Object) | 클래스를 바탕으로 메모리에 생성된 실제 값 |
| 컴포넌트(Component) | 애플리케이션을 구성하는 하나의 기능 단위. Spring에서는 보통 Container가 관리하는 클래스 또는 Bean 후보를 가리킨다. |
| 의존성(Dependency) | 어떤 객체가 자신의 기능을 수행하기 위해 필요로 하는 다른 객체 |
| 메타데이터(Metadata) | 코드 자체의 실행 내용이 아니라 코드의 역할과 처리 방법을 설명하는 부가 정보 |
| 스테레오타입(Stereotype) | `@Service`, `@Repository`처럼 클래스의 계층별 역할을 나타내는 애너테이션 |
| 프록시(Proxy) | 원본 객체를 감싸서 메서드 호출 전후에 트랜잭션, 로깅 같은 부가 기능을 수행하는 대리 객체 |
| 트랜잭션(Transaction) | 여러 데이터 작업을 하나의 논리적 작업 단위로 묶어 모두 성공시키거나 모두 취소하는 처리 단위 |

## 3. Spring Container

**Spring Container**는 애플리케이션에 필요한 객체를 생성하고, 설정하고, 서로 연결하고, 생명주기를 관리하는 실행 환경이다. 일반적으로 `ApplicationContext`가 Spring IoC Container의 역할을 담당한다.

Container는 설정 정보를 읽고 다음 작업을 수행한다.

1. 관리할 클래스를 찾거나 `@Bean` 설정을 읽는다.
2. 해당 클래스의 객체를 생성한다.
3. 객체가 필요로 하는 의존성을 찾는다.
4. 생성자 등을 통해 의존성을 주입한다.
5. 완성된 객체를 Bean으로 보관하고 필요한 곳에 제공한다.

예를 들어 Spring Boot 애플리케이션에서는 보통 `@SpringBootApplication`이 붙은 시작 클래스의 패키지와 그 하위 패키지를 대상으로 Component Scan이 이루어진다.

```text
애플리케이션 실행
    ↓
설정 정보와 컴포넌트 탐색
    ↓
Bean 생성
    ↓
Bean 사이의 의존성 주입
    ↓
요청을 처리할 준비 완료
```

### Container를 왜 사용하는가

개발자가 객체 생성 순서와 공유 방법을 매번 직접 관리하면 객체가 많아질수록 코드가 복잡해진다. Container에 관리를 맡기면 애플리케이션 코드는 객체를 만드는 방법보다 각 객체가 맡은 비즈니스 역할에 집중할 수 있다.

## 4. Bean

**Bean**은 Spring Container가 생성하고 관리하는 객체다. 쉽게 말하면 Spring이 관리하고 있는 Java 객체다.

```java
@Service
public class UserService {
}
```

Component Scan이 `UserService`를 발견해 객체를 생성하고 Container에 등록했다면 그 객체는 Spring Bean이다.

반면 다음 객체는 개발자가 직접 생성했으므로 그 자체로는 Bean이 아니다.

```java
UserService userService = new UserService();
```

```text
개발자가 직접 new로 생성
→ 일반 Java 객체

Spring Container가 생성하거나 등록하여 관리
→ Spring Bean
```

Bean은 기본적으로 하나의 Container 안에서 하나만 생성되는 **singleton scope**를 사용한다. 여기서 singleton은 JVM 전체에 무조건 객체가 하나라는 뜻이 아니라, 해당 Spring Container가 같은 Bean 정의에 대해 하나의 인스턴스를 관리한다는 뜻이다. 필요하면 prototype, request, session 같은 다른 scope도 사용할 수 있다.

### Bean으로 관리하면 좋은 이유

- 동일한 객체를 여러 곳에서 일관되게 공유할 수 있다.
- 객체 생성과 종료 같은 생명주기를 Spring에 맡길 수 있다.
- DI, 트랜잭션, AOP 같은 Spring 기능을 적용할 수 있다.
- 구현 교체와 테스트용 대체 객체 사용이 쉬워진다.

## 5. IoC: 제어의 역전

**IoC(Inversion of Control)**는 객체의 생성과 연결에 대한 제어권이 애플리케이션 코드에서 외부 Container로 이동하는 설계 원칙이다.

### Spring을 사용하지 않을 때

```java
UserService userService = new UserService();
UserController userController = new UserController(userService);
```

개발자가 객체의 생성 순서와 연결 방법을 직접 결정한다.

```text
개발자 코드
    ↓ 생성
UserService
    ↓ 전달
UserController
```

### Spring을 사용할 때

```java
@Service
public class UserService {
}

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```

개발자는 필요한 의존성을 생성자에 선언하고, 실제 객체 생성과 연결은 Spring Container가 담당한다.

```text
Spring Container
    ├─ UserService Bean 생성
    ├─ UserController Bean 생성
    └─ UserService Bean을 UserController에 주입
```

여기서 중요한 점은 IoC와 DI가 완전히 같은 단어는 아니라는 것이다. **IoC는 제어권이 뒤집힌 상태를 설명하는 원칙**이고, **DI는 그 원칙을 구현하는 대표적인 방법**이다.

### IoC가 필요한 이유

클래스가 사용할 구현체를 직접 생성하면 두 클래스가 강하게 결합된다. 생성 책임을 Container로 옮기면 각 클래스는 자신의 역할에 집중할 수 있고, 객체 구성 방법은 별도의 설정으로 관리할 수 있다.

## 6. DI: 의존성 주입

**DI(Dependency Injection)**는 객체가 필요로 하는 의존성을 객체 외부에서 전달하는 방식이다. 말 그대로 Dependency를 외부에서 Injection한다는 뜻이다.

여기서 의존성이라는 말이 조금 어렵게 느껴질 수 있다. `UserController`가 회원 관련 기능을 수행하기 위해 `UserService`를 사용한다면, `UserService`가 `UserController`의 의존성이다.

```java
@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```

`UserController` 내부에는 `new UserService()`가 없다. Spring이 이미 관리 중인 `UserService` Bean을 생성자 매개변수로 전달한다.

```text
[UserService Bean]
         │
         │ DI
         ▼
[UserController Bean]
```

### 생성자 주입을 권장하는 이유

Spring에는 생성자, setter, field를 이용한 여러 주입 방식이 있지만, 필수 의존성에는 생성자 주입을 주로 사용한다.

- 객체를 만들 때 필수 의존성이 반드시 전달된다.
- 필드를 `final`로 선언해 생성 후 변경을 막을 수 있다.
- 필요한 의존성이 생성자에 명확하게 드러난다.
- Spring 없이도 테스트에서 가짜 객체를 직접 전달하기 쉽다.

생성자가 하나뿐이라면 보통 `@Autowired`를 생략할 수 있다.

### 인터페이스와 함께 사용하면 더 유연해진다

```java
public interface MessageSender {
    void send(String message);
}

@Service
public class EmailSender implements MessageSender {

    @Override
    public void send(String message) {
        // 이메일 발송
    }
}
```

```java
@Service
public class NotificationService {

    private final MessageSender messageSender;

    public NotificationService(MessageSender messageSender) {
        this.messageSender = messageSender;
    }
}
```

`NotificationService`는 `EmailSender`라는 구체 클래스가 아니라 `MessageSender`라는 역할에 의존한다. 따라서 구현 교체와 테스트가 쉬워진다. 단, 같은 인터페이스를 구현한 Bean이 여러 개라면 Spring이 어느 Bean을 주입할지 결정할 수 있도록 `@Primary`나 `@Qualifier` 같은 추가 정보가 필요하다.

## 7. Bean을 등록하는 두 가지 대표 방법

### 7.1 Component Scan과 스테레오타입 애너테이션

Component Scan은 지정된 패키지를 탐색해 Bean 후보 클래스를 자동으로 찾고 등록하는 기능이다.

```java
@Component
public class EmailSender {
}
```

`@Component`는 해당 클래스를 Spring이 관리할 컴포넌트 후보로 표시한다. 다음 애너테이션들은 모두 `@Component`를 기반으로 하며 계층별 의미를 추가한 스테레오타입 애너테이션이다.

```text
@Component
    ├─ @Service
    ├─ @Repository
    └─ @Controller
         └─ @RestController의 기반
```

#### `@Component`

특정 계층으로 분류하기 어려운 일반 컴포넌트에 사용한다.

```java
@Component
public class PasswordEncoder {
}
```

#### `@Service`

회원가입, 주문, 결제, 가격 계산 같은 **비즈니스 로직**을 담당하는 클래스에 사용한다.

```java
@Service
public class UserService {

    public void register() {
        System.out.println("회원가입");
    }
}
```

`@Component`를 사용해도 Bean 등록은 가능하지만, `@Service`를 사용하면 클래스의 역할이 명확해져 계층 구조를 이해하기 쉽다.

#### `@Repository`

데이터베이스 조회, 저장, 수정, 삭제 같은 **데이터 접근 책임**을 맡는 클래스에 사용한다.

```java
@Repository
public class UserRepository {

    public void save(User user) {
        // 데이터 저장
    }
}
```

역할을 명확히 나타낼 뿐 아니라, 지원되는 데이터 접근 기술에서 발생한 예외를 Spring의 일관된 데이터 접근 예외 계층으로 변환하는 데에도 사용된다.

#### `@Controller`

Spring MVC에서 HTTP 요청을 받고, 처리 결과를 화면인 **View**로 연결하는 웹 계층 클래스에 사용한다.

```java
@Controller
public class PageController {

    @GetMapping("/hello")
    public String hello() {
        return "hello"; // View 이름
    }
}
```

#### `@RestController`

REST API처럼 메서드의 반환값을 HTTP 응답 본문에 직접 작성하는 Controller에 사용한다.

```java
@RestController
public class UserController {

    @GetMapping("/users")
    public String getUsers() {
        return "users";
    }
}
```

`@RestController`는 `@Controller`와 `@ResponseBody`의 의미를 합친 **조합 애너테이션(composed annotation)**이다. 객체를 반환하면 일반적으로 등록된 메시지 변환기가 객체를 JSON 같은 응답 형식으로 직렬화한다.

### 7.2 `@Configuration`과 `@Bean`

외부 라이브러리의 클래스처럼 소스에 `@Component`를 붙일 수 없거나, 객체 생성 과정을 직접 설정해야 할 때 사용한다.

```java
@Configuration
public class AppConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder();
    }
}
```

- `@Configuration`: Bean 설정을 정의하는 클래스임을 나타낸다.
- `@Bean`: 메서드가 반환한 객체를 Spring Bean으로 등록한다.

기본 Bean 이름은 메서드 이름인 `passwordEncoder`가 된다.

두 등록 방법의 선택 기준은 다음과 같다.

| 상황 | 적합한 방법 |
| --- | --- |
| 직접 작성한 Controller, Service, Repository | `@Component` 계열 + Component Scan |
| 외부 라이브러리 객체 등록 | `@Configuration` + `@Bean` |
| 생성 과정에 세부 설정이 필요한 객체 | `@Configuration` + `@Bean` |

## 8. 애너테이션은 무엇이며 왜 사용하는가

Java **애너테이션(Annotation)**은 클래스, 메서드, 필드, 매개변수 등에 부가적인 의미나 처리 정보를 붙이는 메타데이터다.

```java
@Service
public class UserService {
}
```

여기서 `@Service`를 붙였다고 Annotation이 알아서 `new UserService()`를 실행하는 것은 아니다. Spring의 기반 기능이 Annotation 정보를 읽고, 그 의미에 따라 Bean을 등록하거나 기능을 적용한다.

```text
애너테이션으로 역할이나 설정 표시
    ↓
Spring이 메타데이터 확인
    ↓
Bean 등록, 요청 매핑, 트랜잭션 등의 기능 적용
```

### 애너테이션을 사용하는 이유

- 설정 의도가 코드 가까이에 드러난다.
- 반복적인 설정 코드를 줄일 수 있다.
- “무엇을 적용할지”만 선언하고 세부 실행은 프레임워크에 맡길 수 있다.
- 클래스와 메서드의 역할을 빠르게 파악할 수 있다.

Spring은 기능에 따라 클래스 메타데이터 읽기, Reflection, Bean 후처리기, AOP Proxy 등 여러 기술을 함께 사용한다. 따라서 “모든 Spring 애너테이션은 Reflection만으로 동작한다”고 이해하면 정확하지 않다. 예를 들어 `@Transactional`은 애너테이션이 트랜잭션 정보를 제공하고, 기본적으로 AOP Proxy가 메서드 호출을 가로채 실제 트랜잭션을 처리한다.

## 9. Spring MVC와 REST API

**Spring MVC**는 HTTP 요청을 Controller 메서드에 연결하고, 입력값 변환과 응답 생성을 지원하는 Spring의 웹 프레임워크다.

- **HTTP**: 클라이언트와 서버가 요청과 응답을 주고받는 통신 규칙
- **API**: 프로그램이 다른 프로그램의 기능이나 데이터를 사용하기 위한 접점
- **REST API**: 자원을 URL로 표현하고 HTTP 메서드로 조회, 생성, 수정, 삭제 의도를 나타내는 API 방식
- **Mapping**: 특정 HTTP 요청을 실행할 Java 메서드와 연결하는 것

일반적인 요청 처리 흐름은 다음과 같다.

```text
클라이언트
    ↓ HTTP 요청
DispatcherServlet
    ↓ 요청에 맞는 메서드 탐색
Controller
    ↓ 비즈니스 로직 호출
Service
    ↓ 데이터 접근
Repository
    ↓
Database
```

`DispatcherServlet`은 Spring MVC의 앞단에서 요청을 받아 알맞은 Controller로 전달하는 **Front Controller**다.

### 요청 Mapping 애너테이션

`@RequestMapping`은 URL, HTTP 메서드, 요청 매개변수, 헤더, 미디어 타입 등을 기준으로 요청을 Controller 메서드에 연결한다. 다음 애너테이션들은 HTTP 메서드별 축약형이다.

| 애너테이션 | HTTP 메서드 | 주된 의미 |
| --- | --- | --- |
| `@GetMapping` | GET | 자원 조회 |
| `@PostMapping` | POST | 자원 생성 또는 처리 요청 |
| `@PutMapping` | PUT | 자원 전체 수정 |
| `@PatchMapping` | PATCH | 자원 일부 수정 |
| `@DeleteMapping` | DELETE | 자원 삭제 |

```java
@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping
    public String getUsers() {
        return "users";
    }

    @PostMapping
    public void createUser(@RequestBody CreateUserRequest request) {
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
    }
}
```

클래스의 `@RequestMapping("/users")`는 공통 경로를 지정한다. 따라서 각 메서드는 다음 요청을 처리한다.

```text
GET    /users
POST   /users
DELETE /users/10
```

## 10. HTTP 요청값을 받는 방법

### `@PathVariable`

URL 경로 자체에 포함된 값을 받는다. 특정 자원을 식별할 때 주로 사용한다.

```java
@GetMapping("/users/{id}")
public UserResponse getUser(@PathVariable Long id) {
    // GET /users/10 요청이면 id는 10
}
```

### `@RequestParam`

URL의 Query Parameter를 받는다. 검색, 필터, 정렬, 페이지 번호처럼 선택 조건을 전달할 때 주로 사용한다.

```java
@GetMapping("/users")
public UserResponse getUser(@RequestParam String name) {
    // GET /users?name=min 요청이면 name은 "min"
}
```

### `@RequestBody`

HTTP 요청 본문의 JSON 같은 데이터를 Java 객체로 변환해 받는다. 자원을 생성하거나 수정할 때 주로 사용한다.

```json
{
  "name": "민형",
  "age": 25
}
```

```java
public class CreateUserRequest {
    private String name;
    private int age;

    // getter, setter 또는 생성자
}
```

```java
@PostMapping("/users")
public void createUser(@RequestBody CreateUserRequest request) {
}
```

Spring MVC는 등록된 메시지 변환기를 이용해 요청 본문을 `CreateUserRequest` 객체로 역직렬화한다.

그래서 세 방식의 차이를 정리하면 다음과 같다.

| 방식 | 요청 예시 | 용도 |
| --- | --- | --- |
| `@PathVariable` | `/users/10` | 특정 자원의 식별자 |
| `@RequestParam` | `/users?name=min` | 검색, 필터 같은 부가 조건 |
| `@RequestBody` | JSON 요청 본문 | 생성, 수정할 데이터 |

## 11. Controller, Service, Repository를 나누는 이유

각 계층이 하나의 책임에 집중하도록 나누면 변경 이유가 다른 코드가 뒤섞이는 것을 막을 수 있다.

```text
Controller
→ HTTP 요청과 응답을 담당

Service
→ 비즈니스 규칙과 작업 순서를 담당

Repository
→ 데이터 저장소 접근을 담당
```

예를 들어 회원가입 흐름은 다음처럼 구성할 수 있다.

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public void createUser(@RequestBody CreateUserRequest request) {
        userService.register(request.getName(), request.getAge());
    }
}
```

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void register(String name, int age) {
        User user = new User(name, age);
        userRepository.save(user);
    }
}
```

```java
@Repository
public class UserRepository {

    public void save(User user) {
        // DB 저장 로직
    }
}
```

이 구조에서는 웹 통신 방식이 바뀌어도 Service의 비즈니스 규칙에 미치는 영향을 줄일 수 있고, 데이터 저장 기술이 바뀌어도 Controller까지 수정할 가능성이 작아진다.

## 12. `@Transactional`

**트랜잭션**은 여러 데이터 변경을 하나의 작업 단위로 묶는 기능이다. 모든 작업이 성공하면 **commit**하여 결과를 확정하고, 중간에 실패하면 **rollback**하여 이전 상태로 되돌린다.

왜 필요한지는 계좌 이체를 생각하면 바로 이해할 수 있다. 출금만 성공하고 입금이 실패한 상태가 남아서는 안 된다.

```java
@Transactional
public void transfer() {
    accountA.withdraw(10_000);
    accountB.deposit(10_000);
}
```

```text
트랜잭션 시작
    ↓
A 계좌에서 10,000원 출금
    ↓
B 계좌에 10,000원 입금
    ↓
모두 성공 → COMMIT
하나라도 실패 → ROLLBACK
```

### 왜 `@Transactional`을 사용하는가

개발자가 메서드마다 트랜잭션 시작, commit, rollback, 자원 정리 코드를 반복하지 않아도 된다. 비즈니스 코드는 실제 작업에 집중하고, 트랜잭션 경계는 선언적으로 표현할 수 있다.

### 동작 원리

기본적인 Proxy 방식에서는 Spring이 원본 Bean을 감싸는 Proxy를 만들고 메서드 호출 전후에 트랜잭션 처리를 추가한다.

```text
호출자
  ↓
Transaction Proxy
  ├─ 트랜잭션 시작
  ├─ 실제 메서드 호출
  └─ 성공 시 commit / 실패 시 rollback
```

### 주의할 점

- `@Transactional`이 실제로 적용되려면 대상 객체가 Spring Bean으로 관리되어야 한다.
- 기본 Proxy 방식에서는 외부에서 Proxy를 거쳐 들어오는 호출이 대상이다. 같은 클래스의 메서드가 내부에서 다른 `@Transactional` 메서드를 직접 호출하는 **self-invocation**에는 트랜잭션이 적용되지 않을 수 있다.
- 기본 설정에서는 `RuntimeException`과 `Error`가 rollback 대상이고, checked exception은 자동 rollback 대상이 아니다. 필요하면 `rollbackFor` 등을 명시한다.

## 13. 전체 흐름 다시 보기

애플리케이션 시작 과정은 다음과 같다.

```text
1. Spring 애플리케이션 실행
2. Container 생성
3. 설정 정보와 Component Scan으로 Bean 후보 탐색
4. Controller, Service, Repository Bean 생성
5. 생성자 주입으로 Bean 사이의 의존 관계 연결
6. 웹 요청을 받을 준비 완료
```

요청 처리 과정은 다음과 같다.

```text
1. 클라이언트가 POST /users와 JSON을 전송
2. Spring MVC가 UserController.createUser()에 요청을 Mapping
3. @RequestBody가 JSON을 CreateUserRequest로 변환
4. Controller가 UserService 호출
5. @Transactional Proxy가 트랜잭션 시작
6. Service가 비즈니스 로직 수행
7. Repository가 DB에 데이터 저장
8. 성공 시 commit 후 HTTP 응답 반환
```

## 14. 핵심 애너테이션 요약

| 애너테이션 | 정의 | 사용하는 이유 |
| --- | --- | --- |
| `@Component` | 일반적인 Spring 관리 컴포넌트 후보 | Component Scan으로 Bean을 자동 등록하기 위해 |
| `@Service` | 비즈니스 로직 계층의 컴포넌트 | 역할을 명확히 하고 Service를 Bean으로 관리하기 위해 |
| `@Repository` | 데이터 접근 계층의 컴포넌트 | 데이터 접근 책임을 표시하고 예외 변환 같은 지원을 받기 위해 |
| `@Controller` | View 기반 MVC Controller | HTTP 요청을 처리하고 View로 연결하기 위해 |
| `@RestController` | 응답 본문을 직접 반환하는 Controller | REST API 응답을 JSON 등으로 반환하기 위해 |
| `@RequestMapping` | 공통적인 요청 Mapping | 경로, HTTP 메서드, 헤더 등 다양한 조건으로 요청을 연결하기 위해 |
| `@GetMapping` | GET 요청 Mapping | 조회 요청을 메서드와 연결하기 위해 |
| `@PostMapping` | POST 요청 Mapping | 생성, 처리 요청을 메서드와 연결하기 위해 |
| `@RequestBody` | 요청 본문을 객체로 변환 | JSON 등의 본문 데이터를 Java 객체로 받기 위해 |
| `@PathVariable` | URL 경로 값을 매개변수에 연결 | 특정 자원의 식별자를 받기 위해 |
| `@RequestParam` | Query Parameter를 매개변수에 연결 | 검색, 필터, 정렬 조건을 받기 위해 |
| `@Configuration` | Java 기반 Bean 설정 클래스 | 객체 생성과 설정 방법을 코드로 정의하기 위해 |
| `@Bean` | 메서드 반환 객체를 Bean으로 등록 | 직접 생성하거나 외부 라이브러리 객체를 등록하기 위해 |
| `@Transactional` | 트랜잭션 경계를 나타내는 메타데이터 | 여러 데이터 작업의 원자성을 선언적으로 보장하기 위해 |

## 15. 최종 정리

> Spring은 Java 객체의 생성, 설정, 생명주기와 의존 관계를 IoC Container가 관리하도록 하고, 웹 요청 처리와 데이터 접근, 트랜잭션 같은 애플리케이션 공통 기능을 제공하는 프레임워크다.

> Bean은 Spring Container가 관리하는 객체이고, IoC는 객체 관리의 제어권을 Container로 옮기는 원칙이며, DI는 객체가 필요로 하는 의존성을 외부에서 주입하는 구현 방식이다.

> Spring 애너테이션은 클래스와 메서드의 역할 또는 처리 방법을 표시하는 메타데이터다. Spring은 이 정보를 해석해 Bean 등록, 의존성 주입, HTTP 요청 Mapping, 트랜잭션 같은 실제 기능을 적용한다.

결국 핵심 연결 순서만 다시 보면 다음과 같다.

```text
Annotation과 Configuration
        ↓
Bean 등록
        ↓
IoC Container가 관리
        ↓
DI로 객체 연결
        ↓
Controller → Service → Repository
        ↓
웹 요청과 비즈니스 로직, 데이터 처리 수행
```

## 참고 자료

- [Spring Framework: IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Spring Framework: Container Overview](https://docs.spring.io/spring-framework/reference/core/beans/basics.html)
- [Spring Framework: Classpath Scanning and Managed Components](https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html)
- [Spring Framework: Annotated Controllers](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html)
- [Spring Framework: Mapping Requests](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html)
- [Spring Framework: Using `@Transactional`](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
