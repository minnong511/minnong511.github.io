---
layout: post
title: "Java 디버깅 Part 1: 자주 헷갈리는 핵심 개념"
description: "Java에서 자주 헷갈리는 클래스와 객체, 생성자와 this, static final, package import, 추상화 개념을 디버깅 관점에서 정리한다."
date: 2026-08-11 09:00:00 +0900
categories: [java, debugging]
tags: [Java, Debugging, OOP, Class, Constructor, Static, Package, Import, Abstract]
series: "Java 디버깅"
part: 1
---

# Java 디버깅 Part 1: 자주 헷갈리는 핵심 개념

## 1. 클래스와 객체 

```java
User user = new User();
```

- User -> 클래스 타입 
- user -> 참조 변수 
- new - > 새로오 객체를 생성하는 키워드 
- User() -> 생성자 호출

클래스는 이미 존재하고, 그 클래스를 기반으로 객체를 새로 만드는 것

> User 클래스를 기반으로 새로운 객체를 생성ㅅ, 그 객체의 참조를 user 변수에 저장한다. 

## 2. 생성자와 This 

```java
class User {
    String name;

    User(String name) {
        this.name = name;
    }
}
```

- String name; -> 인자(argument)가 아니라 field
    - User 객체가 가지는 필드 

`User(String name)`
    - 여기있는 name은 Parameter(매개변수)

`new User("민형")`
    - 여기에 들어가는 "민형"이 argument(인자)

`String name;` -> field 

`User(String name)` -> parameter 

`new User("민형")` -> "민형"은 argument 

this.name은 생성자로 전달받은 name parameter 값을 현재 객체의 name field에 저장한다. 

```text
"민형"
    ↓ argument
String name
    ↓ parameter
this.name = name
    ↓
현재 객체의 name field = "민형"
```

User 객체를 생성하면 "민형"을 생성자의 argument로 전달하고, 생성자는 그 값을 현재 객체의 name 필드에 저장한다.

## 3. 참조변수 

JAVA 언어 수준에서 메모리 직접 다루는 것은 아니기 때문에, 

> 같은 객체를 참조한다. 라고 서술하는 것이 더 안전한 편이다. 

- b에는 새로운 객체가 생성되는 것이 아니라 a가 가진 참조값이 복사되므로, a 와 b는 같은 User 객체를 가리킨다. 

## 4. Static 

> static은 특정 객체가 아니라, 클래스 자체에 속하는 멤버를 정의하고, 모든 인스턴스가 하나의 값을 공유하도록 한다.

## 5. Static final 

> final 참조 변수는 다른 객체로 재할당할 수 없다.

```java
static User user = new User("민형");

user = new User("철수"); -> 가능하다. 
```

다만 

`static final User user = new User("민형");` 같은 경우에는 
`user = new User("철수");` 로 재할당이 불가능하다. 

user가 가리키는 객체를 다른 객체로 바꾸지 못하게 하는 것

```text
final user ─X──→ [다른 User 객체]
```

다만 객체 내부는 이와 같은 변경이 가능하다

```text
[User 객체]
name = "민형"
      ↓
name = "철수"
```

| 코드 | static | static final |
|---|---:|---:|
| `user = new User("철수")` | 가능 | 불가능 |
| `user.name = "철수"` | 가능 | 가능 |

단, name 자체도 final이거나 setter가 막혀 있으면 별개야.

> Static은 클래스 단위의 공유 여부를 결정하고, final은 변수에 저장된 값을 다시 할당할 수 있는지를 제한한다. 

## 6. Package / import 

> package는 클래스의 소속과 이름 공간(namespace)를 정의하는 역할 

```java
package com.practice.model;
```

의 의미는 이 클래는 com.practice.model 패키지에 속한다. 

그리고서는 

```java
import com.practice.model.User;
```

는: 

> 다른 패키지에 있는 User 클래스를 이 소스 코드에서 짧은 이름 User로 사용할 수 있게 된다.

> 어떤 클래스를 말하는지 컴파일러가 알 수 있도록 이름을 연결해주는 것에 가깝다. 

- 왜 Main 안에서 임포트하냐..?

```java
package com.practice;

import com.practice.model.User;

public class Main {
    public static void main(String[] args) {
        User user = new User();
    }
}
```

import는 Main 클래스 밖, 파일 위쪽에 있는 이유

Main은 com.practice에 있고, 
User는 com.practice.model에 있기 때문

꼭 import할 필요는 없는데 

```java
com.practice.model.User user =
    new com.practice.model.User();
```

라고 풀네임으로 적어도 되긴하다. 

하지만 귀찮으니까 

```java
import com.practice.model.User;
```

를 하고 나서 

```java
User user = new User();
```

## 7. 추상화 

```java
Animal animal = new Animal();
```

부모 클래스에 sound()가 없는 게 아니라 존재한다. 

```java
abstract void sound();
```

하지만 구현 내용이 없는 추상 메서드여서 구현을 반드시 구현을 해야한다. 

eat() 사용 가능하다는 것도 맞긴 하다.

```java
Void eat() {
    System.out.println("먹는다");
}
```

부모 클래스에서 구현됐으니까 Dog가 상속받아 사용할 수 있다. 

> 정리하자면

Animal은 모든 동물이 sound() 기능을 가져야 한다는 공통 규칙만 추상적으로 정의하고, 실제 소리를 내는 방법은 자식 클래스가 구현하도록 해야한다.

## 가장 많이 헷갈리는 용어

```java
class User {

    String name;

    User(String name) {
        this.name = name;
    }
}

User user = new User("민형");
```

`User` -> 클래스 / 타입 

`String name;` -> field 

`User(String name)` -> 생성자 

`"민형"` -> argument 

`this` -> 현재 객체 

`this.name` -> 현재 객체의 field 

`user` -> 참조 변수 

`new User("민형")`
-> 새 User 객체 생성 + 생성 호출
