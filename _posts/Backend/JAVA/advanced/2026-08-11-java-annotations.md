---
layout: post
title: "Java 심화 Part 2: Annotation"
description: "Java Annotation의 메타데이터 역할과 Override, Spring 컴포넌트, 요청 매핑, Reflection의 연결을 정리한다."
date: 2026-08-11 11:00:00 +0900
categories: [java, advanced]
tags: [Java, Annotation, Reflection, Spring, Override, Metadata]
series: "Java 심화"
part: 2
---

## Java 심화 Part 2: Annotation

### 1. 먼저 알아둘 단어

| 단어 | 정의 |
| --- | --- |
| Annotation | 클래스, 메서드, 필드 등에 추가 정보를 붙이는 Java 문법 |
| Metadata | 코드의 실행 로직이 아니라 코드의 역할과 설정을 설명하는 정보 |
| 컴파일러 | Java 코드를 검사하고 바이트코드로 변환하는 도구 |
| Reflection | 실행 중에 클래스, 메서드, 필드, 애너테이션 정보를 조회하는 기능 |
| Bean | Spring 컨테이너가 생성하고 관리하는 객체 |

> Annotation은 클래스, 메서드, 필드 등에 추가적인 메타데이터를 붙이는 기능이다. 애너테이션 자체가 로직을 실행하는 것은 아니며, 컴파일러나 프레임워크가 이 정보를 읽고 처리한다.

### 2. `@Override`: 컴파일러에게 재정의를 알리기

Java에서 `@`로 시작하는 것이 Annotation이다. 가장 익숙한 예시는 `@Override`다.

```java
interface Animal {
    void makeSound();
}

class Dog implements Animal {
    @Override
    public void makeSound() {
        System.out.println("멍멍!");
    }
}
```

`@Override`는 `makeSound()`가 부모 클래스나 인터페이스의 메서드를 재정의했다는 사실을 컴파일러에 알려준다.

```java
class Dog implements Animal {
    @Override
    public void makeSond() {
        System.out.println("멍멍!");
    }
}
```

위 코드의 `makeSond()`는 `Animal`의 `makeSound()`와 이름이 다르다. `@Override`가 있기 때문에 컴파일러가 재정의가 아니라는 오류를 바로 알려준다.

### 3. 애너테이션은 혼자 실행되지 않는다

다음 코드에서 `@Override`가 직접 `makeSound()`를 실행하는 것은 아니다.

```java
@Override
public void makeSound() {
    System.out.println("멍멍!");
}
```

역할은 다음처럼 나뉜다.

```text
@Override
    ↓
재정의라는 정보를 표시한다
    ↓
컴파일러가 이 정보를 검사한다
    ↓
부모 또는 인터페이스 메서드가 없으면 오류를 보여 준다
```

즉, 애너테이션은 표시이고 그 표시를 해석하는 컴파일러나 프레임워크가 실제 처리를 담당한다.

### 4. 자주 사용하는 Java 애너테이션

| 애너테이션 | 역할 |
| --- | --- |
| `@Override` | 부모 클래스 또는 인터페이스 메서드를 재정의했음을 표시 |
| `@Deprecated` | 더 이상 사용을 권장하지 않는 코드임을 표시 |
| `@SuppressWarnings` | 특정 컴파일 경고를 억제 |
| `@FunctionalInterface` | 함수형 인터페이스 규칙을 지키는지 검사 |

```java
@Deprecated
public void oldLogin() {
    System.out.println("이 메서드는 더 이상 권장하지 않습니다.");
}
```

### 5. Spring에서의 Annotation

Spring에서는 애너테이션이 클래스의 역할과 처리 방식을 알려 주는 중요한 설정 정보가 된다.

```java
@Service
public class UserService {
}
```

`@Service`는 Spring에 이 클래스가 서비스 역할을 하며 관리할 객체 후보라는 정보를 전달한다.

```java
@RestController
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userService.findAll();
    }
}
```

위 코드에서:

- `@RestController`: HTTP 요청을 처리하는 Controller 클래스임을 표시한다.
- `@GetMapping("/users")`: `/users`로 들어오는 GET 요청을 이 메서드와 연결한다.
- 생성자: Spring이 필요한 `UserService`를 주입할 수 있는 위치다. 생성자가 하나라면 보통 `@Autowired`를 생략한다.

### 6. Reflection과 Spring의 연결

Spring은 실행 중 Reflection을 이용해 클래스와 애너테이션을 검사한다.

```text
클래스 탐색
    ↓
@Service, @Controller 같은 애너테이션 발견
    ↓
Spring이 관리할 클래스인지 판단
    ↓
객체 생성
    ↓
Bean으로 등록
    ↓
필요한 객체에 의존성 주입
```

정리하면 역할은 다음과 같다.

```text
Annotation → 코드에 의미와 설정을 표시
Reflection → 실행 중 그 표시를 읽음
Spring     → 읽은 정보를 기준으로 객체를 생성하고 관리
```

### 7. 애너테이션에 값 넣기

애너테이션은 설정값도 받을 수 있다.

```java
@GetMapping("/users")
public List<User> getUsers() {
    return userService.findAll();
}
```

여기서 `"/users"`는 `@GetMapping`에 전달한 요청 경로 설정값이다.

직접 애너테이션을 만들 수도 있다.

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Role {
    String value();
}

@Role("ADMIN")
class AdminService {
}
```

`@Retention(RetentionPolicy.RUNTIME)`은 실행 중 Reflection으로 이 애너테이션을 읽을 수 있게 한다. `@Target(ElementType.TYPE)`은 이 애너테이션을 클래스나 인터페이스에 붙일 수 있다는 뜻이다.

### 8. 요약

```text
Annotation
    ↓
코드에 역할과 설정 정보를 표시한다
    ↓
컴파일러 또는 프레임워크가 정보를 읽는다
    ↓
검사, 요청 매핑, Bean 등록, 의존성 주입 같은 처리를 수행한다
```

> Annotation은 코드에 메타데이터를 붙이는 기능이다. 컴파일러는 코드 검증에 사용하고, Spring 같은 프레임워크는 Reflection으로 읽어 객체 관리와 요청 처리에 활용한다.
