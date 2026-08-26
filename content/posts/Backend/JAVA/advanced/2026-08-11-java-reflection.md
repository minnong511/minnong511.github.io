---
layout: post
title: "Java 심화 Part 1: Reflection"
description: "Java Reflection으로 런타임에 클래스, 필드, 메서드, 애너테이션 정보를 조회하고 호출하는 방법을 정리한다."
date: 2026-08-11 10:40:00 +0900
categories: [java, advanced]
tags: [Java, Reflection, Metadata, Annotation, Spring, DI]
series: "Java 심화"
part: 1
legacyPath: "/java/advanced/2026/08/11/java-reflection/"
---
## Java 심화 Part 1: Reflection

### 1. 먼저 알아둘 단어

| 단어 | 정의 |
| --- | --- |
| Reflection | 실행 중인 클래스나 객체의 구조를 프로그램이 직접 조회하고 조작하는 기능 |
| Metadata | 클래스 이름, 필드, 메서드, 생성자, 애너테이션처럼 클래스 자체에 관한 정보 |
| `Class<?>` | 특정 클래스의 메타데이터를 다루는 객체 |
| `Field` | 클래스에 선언된 필드 정보를 나타내는 객체 |
| `Method` | 클래스에 선언된 메서드 정보를 나타내는 객체 |
| Annotation | 클래스나 메서드 등에 붙여 추가 의미를 전달하는 표식 |

> Reflection은 프로그램이 실행 중에 클래스의 구조를 직접 조사하고, 필요하면 메서드를 호출하거나 필드 값을 읽고 수정할 수 있게 해주는 기능이다.

### 2. Reflection으로 확인할 수 있는 것

Reflection을 사용하면 실행 중에 다음 정보를 확인할 수 있다.

- 이 클래스 이름이 무엇인지
- 어떤 필드가 있는지
- 어떤 메서드와 생성자가 있는지
- 어떤 애너테이션이 붙어 있는지

예제를 위한 `User` 클래스를 먼저 보자.

```java
class User {
    private String name;

    public void hello() {
        System.out.println("hello");
    }
}
```

### 3. 클래스 정보 가져오기

`User.class`로 `User` 클래스의 정보를 담은 `Class` 객체를 가져올 수 있다.

```java
Class<User> clazz = User.class;

System.out.println(clazz.getName());
```

```text
출력: User
```

`clazz`에는 `User` 객체 한 개의 데이터가 아니라 `User` 클래스 자체의 구조 정보가 들어 있다.

### 4. 메서드와 필드 조회하기

#### 메서드 조회

```java
Method[] methods = clazz.getDeclaredMethods();

for (Method method : methods) {
    System.out.println(method.getName());
}
```

```text
출력: hello
```

#### 필드 조회

```java
Field[] fields = clazz.getDeclaredFields();

for (Field field : fields) {
    System.out.println(field.getName());
}
```

```text
출력: name
```

`getDeclaredMethods()`와 `getDeclaredFields()`는 해당 클래스에 직접 선언된 메서드와 필드를 가져온다.

### 5. 실행 중에 메서드 호출하기

Reflection을 사용하면 메서드 이름을 문자열로 찾아 실행할 수도 있다.

```java
import java.lang.reflect.Method;

class User {
    public void hello() {
        System.out.println("hello");
    }
}

public class ReflectionExample {
    public static void main(String[] args) throws ReflectiveOperationException {
        User user = new User();

        Method method = User.class.getDeclaredMethod("hello");
        method.invoke(user);
    }
}
```

```text
출력: hello
```

`getDeclaredMethod("hello")`로 메서드를 찾고, `invoke(user)`로 `user` 객체에서 그 메서드를 실행한다.

### 6. private 필드 접근

Reflection을 사용하면 `private` 필드에도 접근을 시도할 수 있다.

```java
import java.lang.reflect.Field;

class User {
    private String name = "민형";
}

public class ReflectionExample {
    public static void main(String[] args) throws ReflectiveOperationException {
        User user = new User();

        Field field = User.class.getDeclaredField("name");
        field.setAccessible(true);

        System.out.println(field.get(user));
    }
}
```

```text
출력: 민형
```

다만 `setAccessible(true)`는 캡슐화를 우회하는 기능이다. Java 모듈 환경에서는 접근이 제한될 수도 있으므로, 일반 애플리케이션 코드에서 무분별하게 사용하면 안 된다.

### 7. Spring에서 Reflection을 사용하는 이유

Spring 같은 프레임워크는 실행 중에 클래스를 조사해야 한다.

```java
@Service
public class UserService {
}
```

Spring은 대략 다음 흐름으로 동작한다.

```text
클래스들을 조사한다
    ↓
@Service가 붙은 클래스를 찾는다
    ↓
관리할 객체를 생성한다
    ↓
Bean으로 등록한다
    ↓
필요한 곳에 의존성을 주입한다
```

예를 들어 `@Autowired`가 붙은 필드를 확인해 해당 타입의 객체를 넣어 주는 과정에도 Reflection이 활용될 수 있다.

```java
class OrderService {
    @Autowired
    private UserService userService;
}
```

### 8. 사용할 때 주의할 점

- 일반 코드보다 느릴 수 있다.
- 컴파일러가 확인해 주는 타입 안정성이 약해질 수 있다.
- `private` 접근 제한을 우회할 수 있어 코드 추적이 어려워진다.
- 프레임워크 내부 기능이나 정말 동적으로 처리해야 하는 경우에 사용하는 편이 좋다.

Spring, Hibernate, Jackson, 테스트 프레임워크처럼 클래스 구조를 자동으로 분석해야 하는 라이브러리와 프레임워크에서 Reflection을 많이 사용한다.

### 9. 요약

```text
Reflection
    ↓
실행 중에 클래스 구조를 조사한다
    ↓
필드, 메서드, 생성자, 애너테이션 정보를 확인한다
    ↓
필요하면 메서드 호출과 필드 접근도 가능하다
```

> Reflection은 런타임에 클래스의 메타데이터를 조회하고 조작하는 기능이다. 강력하지만 타입 안정성과 캡슐화를 약화시킬 수 있으므로, 주로 프레임워크 내부나 동적 처리가 꼭 필요한 상황에서 사용한다.

- 런타임 동적 로딩 및 조작
    - 컴파일 시점이 아닌 실행 중에 객체 정보를 확인하거나 수정 가능 
    - 클래스 이름이 동적으로 결정되거나, 조건에 따라 특정 메서드를 실행해야 할 때 사용 
- 어노테이션 기반 동작 제어 
    - 런타임에 Annotation을 읽어서 특정 메서드나 필드에 대해 자동 동작을 수행
    - 예: Spring에서 Autowired로 의존성 주입, RequestMapping으로 URL 메서드 매핑
- 플러그인 시스템 및 동적 확장 
    - 실행 중에 플러그인 추가, 또는 인터페이스를 구현하지 않은 클래스도 동적으로 실행 가능 
    - 외부 패키지의 클래스를 런타임에 로드하여 확장 기능 구현 가능
