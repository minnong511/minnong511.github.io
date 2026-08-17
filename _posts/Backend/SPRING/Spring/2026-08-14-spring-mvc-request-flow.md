---
layout: post
title: "Spring 기초 Part 2: Spring MVC 요청 처리 흐름"
description: "DispatcherServlet부터 Controller, Service, Repository, JSON 응답까지 Spring MVC의 전체 요청 흐름을 정리한다."
date: 2026-08-14 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, Spring Boot, Spring MVC, DispatcherServlet, REST API]
series: "Spring 기초"
part: 2
---

## Spring 기초 Part 2: Spring MVC 요청 처리 흐름

> Spring MVC는 HTTP 요청을 적절한 Controller에 연결하고, 처리 결과를 View 또는 JSON으로 반환하는 웹 프레임워크다.

처음에는 다음 흐름부터 기억하면 된다.

```text
Client
  → DispatcherServlet
  → Controller
  → Service
  → Repository
  → Database
```

응답은 반대 방향으로 돌아온다.

```text
Database
  → Repository
  → Service
  → Controller
  → JSON 또는 HTML
  → Client
```

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉽게 말하면 |
|---|---|---|
| Client | 서버에 HTTP 요청을 보내는 프로그램 | 브라우저, Vue, React, 앱, Postman |
| HTTP Request | Client가 서버에 보내는 요청 | `GET /api/users/1` |
| HTTP Response | 서버가 Client에 돌려주는 결과 | 상태 코드와 JSON 데이터 |
| MVC | Model, View, Controller로 역할을 나누는 설계 방식 | 데이터, 화면, 요청 처리를 분리 |
| Servlet | Java 웹 서버에서 HTTP 요청과 응답을 처리하는 객체 | Spring MVC의 입구를 만드는 기반 기술 |
| DispatcherServlet | Spring MVC의 모든 요청을 먼저 받는 Front Controller | 요청을 담당 Controller에 배분하는 중앙 안내자 |
| HandlerMapping | 요청을 처리할 Controller 메서드를 찾는 객체 | `/users/1`을 누가 처리하는지 검색 |
| HandlerAdapter | 찾은 Controller 메서드를 실제로 호출하는 객체 | 매개변수를 준비하고 메서드를 실행 |
| Jackson | 자바 객체와 JSON을 변환하는 라이브러리 | `UserDto`를 JSON으로 변환 |

---

### 2. MVC와 계층형 구조는 같은 말이 아니다

기본 MVC는 역할을 다음처럼 구분한다.

| 구성 | 역할 | Spring에서의 예 |
|---|---|---|
| Model | 애플리케이션의 데이터와 상태 | DTO, Entity, Service의 처리 결과 |
| View | 사용자에게 보여줄 결과 | HTML, Thymeleaf 화면 |
| Controller | 요청을 받고 처리 흐름을 연결 | `@Controller`, `@RestController` |

실무의 Spring 애플리케이션에서는 유지보수를 위해 역할을 더 세분화한다.

| 계층 | 역할 |
|---|---|
| Controller | HTTP 요청과 응답 처리 |
| Service | 비즈니스 규칙과 트랜잭션 처리 |
| Repository | 데이터베이스 접근 |

즉 Spring MVC와 계층형 구조를 함께 사용하는 것이다.

```text
Spring MVC
→ HTTP 요청을 Controller에 연결하고 응답을 만드는 구조

계층형 구조
→ Controller, Service, Repository의 책임을 나누는 구조
```

---

### 3. DispatcherServlet

Client의 요청이 Controller로 바로 전달되는 것은 아니다.

```text
Client
  → DispatcherServlet
  → Controller
```

DispatcherServlet은 모든 요청을 먼저 받고 적절한 Controller로 전달한다. 이런 구조를 **Front Controller Pattern**이라고 한다.

```text
                       ┌→ UserController
Client → DispatcherServlet → ProductController
                       └→ OrderController
```

각 Controller가 공통 처리를 직접 반복하지 않아도 DispatcherServlet을 중심으로 일관된 요청 처리가 가능하다.

---

### 4. HandlerMapping과 HandlerAdapter

다음 Controller가 있다고 해보자.

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        // 사용자 조회
    }
}
```

Client가 다음 요청을 보낸다.

```http
GET /api/users/1
```

Spring은 애플리케이션을 시작할 때 어노테이션 정보를 읽고 URL과 메서드의 연결 정보를 준비한다.

```text
GET /api/users/{id}
        ↓
UserController.getUser()
```

실행 시 각 객체의 역할은 다음과 같다.

1. DispatcherServlet이 요청을 받는다.
2. HandlerMapping이 요청을 처리할 Controller 메서드를 찾는다.
3. HandlerAdapter가 필요한 매개변수를 준비한다.
4. HandlerAdapter가 Controller 메서드를 호출한다.
5. 반환 결과를 DispatcherServlet이 응답으로 처리한다.

{% capture spring_mvc_flow %}
flowchart LR
    C[Client] -->|HTTP Request| D[DispatcherServlet]
    D -->|처리 대상 검색| HM[HandlerMapping]
    HM -->|Controller 정보| D
    D -->|실행 요청| HA[HandlerAdapter]
    HA --> CT[Controller]
    CT --> S[Service]
    S --> R[Repository]
    R --> DB[(Database)]
    DB --> R
    R --> S
    S --> CT
    CT -->|Java Object| HA
    HA --> D
    D -->|JSON Response| C
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Spring MVC REST API 요청 흐름"
  chart=spring_mvc_flow
%}

---

### 5. Controller, Service, Repository

#### Controller

Controller는 HTTP 요청과 응답에 집중한다.

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse response = userService.getUser(id);
        return ResponseEntity.ok(response);
    }
}
```

Controller에는 복잡한 업무 규칙을 넣지 않는다.

#### Service

Service는 실제 업무 규칙을 처리한다.

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        return UserResponse.from(user);
    }
}
```

#### Repository

Repository는 데이터베이스 접근을 담당한다.

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

역할을 나누면 HTTP 처리, 업무 규칙, DB 접근을 각각 독립적으로 수정하고 테스트하기 쉬워진다.

---

### 6. `@Controller`와 `@RestController`

#### `@Controller`

일반적인 `@Controller`가 문자열을 반환하면 View 이름으로 해석할 수 있다.

```java
@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "home";
    }
}
```

```text
return "home"
   → ViewResolver
   → home.html 검색
   → HTML 응답
```

#### `@RestController`

`@RestController`의 반환값은 기본적으로 HTTP 응답 본문으로 전달된다.

```java
@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public MessageResponse hello() {
        return new MessageResponse("hello");
    }
}
```

Jackson이 자바 객체를 JSON으로 변환한다.

```json
{
  "message": "hello"
}
```

| 구분 | `@Controller` | `@RestController` |
|---|---|---|
| 주요 목적 | HTML View 반환 | JSON 데이터 반환 |
| 반환값 처리 | View 이름으로 해석 가능 | Response Body로 변환 |
| 주 사용처 | 서버 렌더링 웹 페이지 | REST API |

---

### 7. 전체 실행 흐름

`GET /api/users/1` 요청을 다시 연결하면 다음과 같다.

```text
1. Client가 GET /api/users/1 요청
2. DispatcherServlet이 요청 수신
3. HandlerMapping이 UserController.getUser() 검색
4. HandlerAdapter가 id 값을 준비하고 메서드 호출
5. Controller가 UserService 호출
6. Service가 UserRepository 호출
7. Repository가 DB 조회
8. 조회 결과가 Repository → Service → Controller로 반환
9. Jackson이 UserResponse를 JSON으로 변환
10. Client에 HTTP 응답 반환
```

---

### 핵심 정리

| 구성 요소 | 핵심 역할 |
|---|---|
| DispatcherServlet | 모든 요청을 먼저 받는 Front Controller |
| HandlerMapping | 요청을 처리할 Controller 메서드 검색 |
| HandlerAdapter | Controller 메서드 실행 |
| Controller | HTTP 요청과 응답 처리 |
| Service | 비즈니스 규칙 처리 |
| Repository | 데이터베이스 접근 |
| Jackson | 자바 객체를 JSON으로 변환 |

> Spring MVC의 핵심은 요청을 Controller에 연결하는 흐름과 Controller, Service, Repository의 책임을 분리하는 데 있다.

### 참고 자료

- [Spring Framework Web MVC 공식 문서](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
