---
layout: post
title: "Spring 기초 Part 3: REST API 요청값과 입력값 검증"
description: "PathVariable, RequestParam, RequestBody로 요청값을 받고 DTO와 Bean Validation으로 검증하는 흐름을 정리한다."
date: 2026-08-15 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, Spring Boot, REST API, Validation, DTO, RequestBody]
series: "Spring 기초"
part: 3
legacyPath: "/java/spring/2026/08/15/spring-rest-api-validation/"
---
## Spring 기초 Part 3: REST API 요청값과 입력값 검증

> Controller는 HTTP 요청값을 자바 값이나 객체로 변환하고, 규칙에 맞는지 검증한 뒤 Service에 전달한다.

```text
HTTP Request
    ↓
요청값 바인딩
    ↓
입력값 검증
    ↓
Controller
    ↓
Service
```

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉽게 말하면 |
|---|---|---|
| Endpoint | Client가 호출할 수 있는 API 주소와 HTTP Method의 조합 | `POST /api/users` |
| Parameter | HTTP 요청에 포함된 입력값 | 사용자 ID, 검색어, 페이지 번호 |
| Request Body | HTTP 요청 본문에 담긴 데이터 | JSON 회원가입 정보 |
| Binding | HTTP 요청값을 자바 값이나 객체로 변환하는 과정 | JSON을 `UserCreateRequest`로 변환 |
| DTO | 계층 사이에서 데이터를 전달하는 객체 | API 요청 전용 객체 |
| Validation | 값이 정해진 규칙을 만족하는지 검사하는 과정 | 이메일 형식과 나이 확인 |
| Constraint | 입력값이 지켜야 하는 검증 규칙 | `@NotBlank`, `@Email` |
| 직렬화 | 자바 객체를 JSON 같은 전송 형식으로 변환 | `UserResponse` → JSON |
| 역직렬화 | JSON을 자바 객체로 변환 | JSON → `UserCreateRequest` |

---

### 2. HTTP 요청값을 받는 세 가지 방법

| 어노테이션 | 값을 가져오는 위치 | 예시 |
|---|---|---|
| `@PathVariable` | URL 경로 | `/api/users/1`의 `1` |
| `@RequestParam` | Query String | `/api/users?name=민형`의 `name` |
| `@RequestBody` | HTTP 요청 본문 | JSON 회원가입 정보 |

#### `@PathVariable`

특정 자원을 식별할 때 사용한다.

```java
@GetMapping("/api/users/{id}")
public UserResponse getUser(@PathVariable Long id) {
    return userService.getUser(id);
}
```

```http
GET /api/users/1
```

#### `@RequestParam`

검색, 필터, 정렬처럼 선택적인 조건을 전달할 때 자주 사용한다.

```java
@GetMapping("/api/users")
public List<UserResponse> searchUsers(
        @RequestParam(required = false) String name) {
    return userService.searchUsers(name);
}
```

```http
GET /api/users?name=민형
```

#### `@RequestBody`

JSON 같은 요청 본문을 자바 객체로 변환할 때 사용한다.

```java
@PostMapping("/api/users")
public UserResponse createUser(@RequestBody UserCreateRequest request) {
    return userService.createUser(request);
}
```

```json
{
  "name": "민형",
  "email": "min@example.com",
  "age": 25
}
```

Spring MVC와 Jackson이 JSON을 `UserCreateRequest` 객체로 변환한다.

---

### 3. Entity 대신 요청 DTO를 사용한다

요청 JSON을 Entity로 바로 받으면 API 입력 구조와 DB 구조가 강하게 연결된다.

```java
// 권장하지 않는 형태
public UserResponse createUser(@RequestBody User user) {
    // 요청이 Entity 구조에 직접 의존
}
```

요청 전용 DTO를 만들면 API가 허용할 값과 검증 규칙을 명확하게 표현할 수 있다.

```java
public record UserCreateRequest(
        String name,
        String email,
        int age
) {
}
```

| 객체 | 역할 |
|---|---|
| Request DTO | Client가 보낸 입력값 표현 |
| Entity | 데이터베이스에 저장하고 JPA가 관리 |
| Response DTO | Client에 반환할 데이터 표현 |

```text
JSON
  → Request DTO
  → Service
  → Entity
  → Repository
  → Database
```

---

### 4. Bean Validation

Bean Validation은 어노테이션으로 입력값 규칙을 선언하는 표준이다. Spring Boot 3 계열에서는 일반적으로 `jakarta.validation` 패키지를 사용한다.

검증 기능을 사용하려면 Validation Starter를 추가한다.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

#### 자주 사용하는 검증 어노테이션

| 어노테이션 | 검증 내용 | 적용 예시 |
|---|---|---|
| `@NotNull` | 값이 `null`이면 실패 | 객체, 숫자 필수값 |
| `@NotBlank` | `null`, 빈 문자열, 공백 문자열이면 실패 | 이름, 제목 |
| `@NotEmpty` | `null`이거나 길이가 0이면 실패 | 문자열, 컬렉션 |
| `@Email` | 이메일 형식 검사 | 이메일 주소 |
| `@Positive` | 0보다 큰 값인지 검사 | 가격, 수량 |
| `@Min` | 지정한 최솟값 이상인지 검사 | 나이 |
| `@Max` | 지정한 최댓값 이하인지 검사 | 점수 |
| `@Size` | 문자열이나 컬렉션의 길이 검사 | 비밀번호 길이 |

요청 DTO에 규칙을 선언한다.

```java
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UserCreateRequest(
        @NotBlank(message = "이름은 필수입니다.")
        String name,

        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String email,

        @Min(value = 1, message = "나이는 1 이상이어야 합니다.")
        @Max(value = 150, message = "나이는 150 이하여야 합니다.")
        int age
) {
}
```

---

### 5. `@Valid`로 검증 실행하기

DTO에 검증 어노테이션만 붙이면 끝이 아니다. Controller 매개변수에 `@Valid`를 붙여 검증을 실행한다.

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserCreateRequest request) {

        UserResponse response = userService.createUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
```

검증 흐름은 다음과 같다.

**Request Body 검증 흐름**

```mermaid
flowchart TD
    C[Client JSON 요청] --> J[Jackson이 DTO로 변환]
    J --> V[@Valid 검증]
    V -->|성공| CT[Controller 실행]
    CT --> S[Service 실행]
    V -->|실패| E[MethodArgumentNotValidException]
    E --> R[400 Bad Request 응답]
```

검증에 실패하면 보통 `MethodArgumentNotValidException`이 발생하고 HTTP 400 응답으로 처리된다.

---

### 6. 검증 오류 응답 통일하기

`@RestControllerAdvice`를 사용하면 여러 Controller의 예외를 한곳에서 처리할 수 있다.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            MethodArgumentNotValidException exception) {

        Map<String, String> errors = new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error -> errors.put(
                        error.getField(),
                        error.getDefaultMessage()
                ));

        return ResponseEntity.badRequest().body(errors);
    }
}
```

잘못된 요청을 보내면 다음과 같은 응답을 만들 수 있다.

```json
{
  "name": "이름은 필수입니다.",
  "email": "이메일 형식이 올바르지 않습니다."
}
```

---

### 7. 직접 요청해보기

```bash
curl -i -X POST 'http://localhost:8080/api/users' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "민형",
    "email": "min@example.com",
    "age": 25
  }'
```

| 부분 | 의미 |
|---|---|
| `-i` | 응답 Header까지 출력 |
| `-X POST` | POST Method 사용 |
| `Content-Type` | 요청 본문이 JSON임을 알림 |
| `-d` | 서버로 보낼 요청 본문 |

---

### 8. 형식 검증과 비즈니스 검증

`@Valid`는 값의 기본 형식을 검사하는 데 적합하다.

```text
@NotBlank → 이름이 비어 있는가?
@Email    → 이메일 형태가 맞는가?
@Positive → 수량이 양수인가?
```

하지만 DB 조회가 필요한 업무 규칙은 Service에서 검사하는 것이 자연스럽다.

```java
@Transactional
public UserResponse createUser(UserCreateRequest request) {
    if (userRepository.existsByEmail(request.email())) {
        throw new DuplicateEmailException(request.email());
    }

    User user = User.create(
            request.name(),
            request.email(),
            request.age()
    );

    return UserResponse.from(userRepository.save(user));
}
```

| 검증 위치 | 담당할 규칙 |
|---|---|
| Request DTO | 빈 값, 길이, 숫자 범위, 이메일 형식 |
| Service | 이메일 중복, 재고 부족, 권한 등 업무 규칙 |
| Database | `NOT NULL`, `UNIQUE`, 외래키 등 최종 무결성 |

검증을 한 계층에만 의존하지 않고 각 계층이 책임져야 할 규칙을 나누는 것이 중요하다.

---

### 핵심 정리

| 개념 | 핵심 내용 |
|---|---|
| `@PathVariable` | URL 경로의 식별자를 받는다. |
| `@RequestParam` | Query String의 검색 조건을 받는다. |
| `@RequestBody` | JSON 요청 본문을 자바 객체로 변환한다. |
| DTO | API와 Entity의 구조를 분리한다. |
| `@Valid` | DTO에 선언한 Bean Validation을 실행한다. |
| `@RestControllerAdvice` | 여러 Controller의 오류 응답을 통일한다. |

> Controller는 요청값을 받고 검증하는 입구이며, 실제 비즈니스 규칙은 Service에 맡긴다.

### 참고 자료

- [Spring Framework Validation 공식 문서](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)
- [Spring Framework Web MVC 공식 문서](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
