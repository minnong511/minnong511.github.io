---
layout: post
title: "Java 객체지향 핵심 개념 정리"
date: 2026-08-10 12:00:00 +0900
categories: [Backend, JAVA]
tags: [Java, OOP, Class, Object, Instance, Field, Method, Constructor, Static, Encapsulation, Inheritance, Override]
---

# Java 객체지향 핵심 개념

Java 코드를 읽고 작성하려면 클래스와 객체를 중심으로 필드, 메서드, 생성자, `this`, `static`, 캡슐화, 상속, 오버라이드를 구분할 수 있어야 한다.

## 1. 클래스(Class)

### 정의

클래스는 객체를 만들기 위한 설계도다. 클래스 안에는 객체가 가질 데이터와 동작을 정의한다.

```java
class User {
    String name;
    int age;
}
```

위 코드는 `User`라는 객체가 `name`과 `age`를 가질 수 있다고 정의한 것이다. 클래스 선언만으로 실제 사용자가 만들어지는 것은 아니다.

```text
User 클래스 ── new ──▶ User 객체
```

자동차에 비유하면 다음과 같다.

- `Car` 클래스: 자동차 설계도
- `new Car()`: 설계도로 실제 자동차 한 대를 만드는 과정

## 2. 객체(Object)와 인스턴스(Instance)

### 객체의 정의

객체는 프로그램 실행 중 메모리에 실제로 만들어져 존재하는 데이터와 기능의 묶음이다.

```java
User user1 = new User();
User user2 = new User();
```

`new User()`가 실행되면 `User` 객체가 두 개 만들어진다. `user1`과 `user2`는 서로 다른 객체를 가리킨다.

### 인스턴스의 정의

인스턴스는 특정 클래스에서 생성된 객체라는 관계를 강조하는 용어다.

```java
User user1 = new User();
```

위 코드에서 Heap에 만들어진 실체는 객체이고, `User` 클래스에서 만들어졌으므로 `User의 인스턴스`라고도 한다.

```text
User 클래스
   │       │
   ▼       ▼
user1   user2
   │       │
User 인스턴스  User 인스턴스
```

참고로 Java의 모든 클래스는 기본적으로 `java.lang.Object`를 직접 또는 간접적으로 상속한다. 하지만 `int`, `double`, `boolean` 같은 기본형은 객체가 아니다.

## 3. 참조 변수(Reference Variable)

### 정의

참조 변수는 객체 자체를 저장하는 변수가 아니라, 객체를 가리키는 참조값을 저장하는 변수다.

```java
User user = new User();
```

- `User`: 참조 변수의 타입
- `user`: 객체를 가리키는 참조 변수
- `new User()`: Heap에 생성되는 User 객체

```text
user
 │
 │ 참조값
 ▼
[ Heap의 User 객체 ]
```

참조 변수 두 개가 같은 객체를 가리킬 수도 있다.

```java
User a = new User();
User b = a;
```

```text
a ─────┐
       ▼
  [User 객체]
       ▲
b ─────┘
```

`a`와 `b`는 서로 다른 객체가 아니라 같은 객체를 가리킨다.

## 4. 필드(Field)

### 정의

필드는 클래스 내부에 선언된 변수로, 객체의 상태나 데이터를 저장한다.

```java
class User {
    String name;
    int age;
}
```

여기서 `name`과 `age`가 필드다.

```text
필드 = 객체가 무엇을 가지고 있는가?
예: 이름, 나이, 가격, 잔액
```

### 인스턴스 필드

인스턴스 필드는 객체마다 독립적으로 존재한다.

```java
User user1 = new User();
User user2 = new User();

user1.name = "민형";
user2.name = "철수";
```

두 객체는 같은 `name` 필드를 가지고 있지만, 실제 값은 서로 다르게 저장된다.

### 정적 필드(Static Field)

정적 필드는 특정 객체가 아니라 클래스에 소속된 필드다. 같은 클래스의 모든 객체가 하나의 값을 공유한다.

```java
class User {
    static int count = 0;
}
```

```java
System.out.println(User.count);
```

정적 필드는 객체를 만들지 않고도 `클래스이름.필드이름` 형태로 접근할 수 있다.

## 5. 메서드(Method)

### 정의

메서드는 클래스 내부에 선언된 코드 블록으로, 객체가 수행할 동작이나 기능을 정의한다.

```java
class User {
    String name;

    void introduce() {
        System.out.println("내 이름은 " + name + "입니다.");
    }
}
```

여기서 `introduce()`가 메서드다.

```java
User user = new User();
user.name = "민형";
user.introduce();
```

```text
필드  = 객체가 가지고 있는 데이터
메서드 = 객체가 수행할 수 있는 동작
```

### 메서드의 기본 형태

```java
[접근 제어자] [반환형] [메서드 이름](매개변수 목록) {
    // 실행할 코드
    return 반환값;
}
```

예를 들어 다음 메서드는 문자열을 반환한다.

```java
public String greet(String name) {
    return "안녕하세요, " + name;
}
```

`void`는 메서드가 호출한 곳에 반환할 값이 없다는 뜻이다.

```java
public void printWelcome() {
    System.out.println("환영합니다.");
}
```

`void`는 `0`이나 `null`을 반환한다는 뜻이 아니라, 반환값 자체가 없다는 뜻이다.

## 6. 생성자(Constructor)

### 정의

생성자는 `new`로 객체를 만들 때 자동으로 실행되는 특별한 코드 블록이다. 객체의 초기 상태를 설정하는 데 사용한다.

```java
class User {
    String name;
    int age;

    User(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

```java
User user = new User("민형", 25);
```

객체가 생성되는 순간 다음 값이 설정된다.

```text
name = "민형"
age  = 25
```

### 생성자의 특징

- 생성자 이름은 클래스 이름과 같다.
- 반환형을 작성하지 않는다.
- `void`도 작성하지 않는다.
- `new`로 객체를 만들 때 호출된다.

```java
User(String name, int age) { } // 생성자
void User() { }                // 생성자가 아니라 반환형이 void인 메서드
```

## 7. `this`

### 정의

`this`는 인스턴스 메서드나 생성자에서 **현재 객체 자신을 가리키는 참조**다.

```java
class User {
    String name;

    User(String name) {
        this.name = name;
    }
}
```

```text
this.name = name;
│           │
│           └─ 생성자 매개변수
└─ 현재 객체의 필드
```

따라서 `this.name = name;`은 “현재 객체의 `name` 필드에 전달받은 `name` 값을 저장하라”는 뜻이다.

## 8. 매개변수(Parameter)와 인자(Argument)

### 매개변수

매개변수는 메서드 선언부에서 외부 입력을 받기 위해 선언한 변수다.

```java
void sayHello(String name) {
    System.out.println(name);
}
```

위 코드에서 `String name`이 매개변수다.

### 인자

인자는 메서드를 호출할 때 실제로 전달하는 값이다.

```java
sayHello("민형");
```

여기서 `"민형"`이 인자다.

```text
메서드 선언: sayHello(String name)
                              ▲
                           매개변수

메서드 호출: sayHello("민형")
                         ▲
                        인자
```

## 9. 멤버(Member)

### 정의

멤버는 클래스 내부에 속한 구성 요소를 통칭하는 말이다. 대표적으로 필드와 메서드가 있으며, 중첩 클래스나 정적 멤버도 포함될 수 있다.

```java
class User {
    String name;        // 필드 멤버

    void introduce() {  // 메서드 멤버
        System.out.println(name);
    }
}
```

생성자는 클래스 내부에 작성되지만 Java 언어에서 일반적인 의미의 멤버와는 구분되는 특별한 초기화 문법이다.

## 10. `static`

### 정의

`static`은 필드나 메서드를 특정 객체가 아니라 **클래스 자체에 소속시키는 키워드**다.

```java
class User {
    static int count = 0;
}
```

`count`는 User 객체마다 따로 생기는 값이 아니라 User 클래스가 하나만 공유하는 값이다.

```text
인스턴스 필드
user1 ── name
user2 ── name
user3 ── name

static 필드
          User 클래스
              │
            count
          ▲    ▲    ▲
        user1 user2 user3
```

### static 메서드

static 메서드도 객체가 아니라 클래스에 소속된다.

```java
class User {
    private static int count = 0;

    public static int getCount() {
        return count;
    }
}

int total = User.getCount();
```

static 메서드는 특정 객체 없이 실행될 수 있으므로 인스턴스 필드에 직접 접근할 수 없다.

```java
class Example {
    private int instanceValue;
    private static int classValue;

    static void print() {
        // System.out.println(instanceValue); // 오류
        System.out.println(classValue);       // 가능
    }
}
```

## 11. `final`

### 변수와 필드에서의 `final`

`final`은 변수에 다시 값을 대입하지 못하게 한다.

```java
final int age = 25;
// age = 30; // 컴파일 오류
```

참조 변수에 `final`을 사용하면 참조 대상 자체를 바꿀 수 없다는 뜻이다. 객체 내부의 필드까지 모두 변경할 수 없다는 뜻은 아니다.

```java
final User user = new User();
// user = new User(); // 다른 객체를 다시 대입할 수 없음
user.name = "민형";    // 객체 내부 필드는 final이 아니면 변경 가능
```

### 클래스에서의 `final`

`final class`는 다른 클래스가 상속할 수 없다.

```java
final class User {
}

// class Admin extends User { } // 컴파일 오류
```

### 메서드에서의 `final`

`final` 메서드는 자식 클래스가 오버라이드할 수 없다.

```java
class User {
    final void login() {
        System.out.println("로그인");
    }
}
```

## 12. 접근 제어자(Access Modifier)

### 정의

접근 제어자는 클래스, 필드, 메서드 등에 외부 코드가 접근할 수 있는 범위를 결정하는 키워드다.

| 접근 제어자 | 접근 범위 |
| --- | --- |
| `public` | 어디서든 접근 가능 |
| `protected` | 같은 패키지와 자식 클래스에서 접근 가능 |
| 기본 접근 제어자 | 같은 패키지에서만 접근 가능 |
| `private` | 선언된 클래스 내부에서만 접근 가능 |

```java
class User {
    private String password;

    public void login() {
        System.out.println("로그인 시도");
    }
}
```

`password`가 `private`이면 다음처럼 외부에서 직접 접근할 수 없다.

```java
User user = new User();
// user.password = "1234"; // 컴파일 오류
user.login();              // public 메서드는 호출 가능
```

## 13. Getter와 Setter

### 정의

- Getter: private 필드의 값을 외부에 반환하는 메서드
- Setter: private 필드에 새로운 값을 대입하는 메서드

```java
class User {
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

```java
User user = new User();
user.setName("민형");
System.out.println(user.getName());
```

Getter와 Setter를 항상 만들어야 하는 것은 아니다. 객체 설계에 따라 필요한 기능만 외부에 공개하는 것이 중요하다.

## 14. 캡슐화(Encapsulation)

### 정의

캡슐화는 객체 내부의 데이터를 외부에서 직접 변경하지 못하게 숨기고, 필요한 기능만 메서드로 공개하는 설계 방식이다.

```java
class Account {
    public int balance;
}
```

`balance`가 public이면 외부에서 잘못된 값도 직접 대입할 수 있다.

```java
Account account = new Account();
account.balance = -999999;
```

캡슐화를 적용하면 데이터를 private으로 숨기고, 유효성 검사를 거치는 메서드만 공개한다.

```java
class Account {
    private int balance;

    public void deposit(int money) {
        if (money > 0) {
            balance += money;
        }
    }

    public int getBalance() {
        return balance;
    }
}
```

```java
Account account = new Account();
account.deposit(10000);
System.out.println(account.getBalance());
```

외부 코드는 `balance`를 직접 바꾸지 않고 `deposit()`이라는 정해진 방법을 통해서만 잔액을 변경한다.

## 15. 상속(Inheritance)

### 정의

상속은 기존 클래스의 필드와 메서드를 자식 클래스가 물려받는 기능이다.

```java
class Animal {
    public void eat() {
        System.out.println("먹는다");
    }
}

class Dog extends Animal {
}

Dog dog = new Dog();
dog.eat(); // 부모 Animal에게서 물려받은 메서드
```

```text
Animal 부모 클래스
      ▲
      │ extends
      │
Dog 자식 클래스
```

Java 클래스는 부모 클래스를 하나만 직접 상속할 수 있다. 즉, 클래스의 다중 상속은 지원하지 않는다. 대신 하나의 클래스가 여러 인터페이스를 구현하는 것은 가능하다.

## 16. 오버라이드(Override)

### 정의

오버라이드는 부모 클래스에서 물려받은 메서드를 자식 클래스에서 같은 형태로 다시 정의하는 것이다.

```java
class Animal {
    public void sound() {
        System.out.println("동물 소리");
    }
}

class Dog extends Animal {
    @Override
    public void sound() {
        System.out.println("멍멍");
    }
}

Dog dog = new Dog();
dog.sound(); // 멍멍
```

`@Override`는 “이 메서드가 부모 메서드를 재정의한다”는 것을 컴파일러에 알려 주는 애너테이션이다. 부모 메서드 이름이나 매개변수를 잘못 작성했을 때 오류를 확인하는 데 도움이 된다.

### 오버로딩과 오버라이드 비교

| 구분 | 오버로딩(Overloading) | 오버라이드(Override) |
| --- | --- | --- |
| 발생 위치 | 같은 클래스 안 | 부모와 자식 클래스 사이 |
| 목적 | 같은 이름으로 다른 입력 처리 | 부모 동작을 자식에 맞게 변경 |
| 매개변수 | 달라야 함 | 부모 메서드와 같아야 함 |
| 키워드 | 별도 키워드 없음 | `@Override` 사용 권장 |

## 17. 전체 관계 정리

```text
클래스(Class)
  └─ 객체를 만들기 위한 설계도
       ├─ 필드(Field): 상태를 저장하는 변수
       ├─ 메서드(Method): 동작을 정의하는 코드
       └─ 생성자(Constructor): 객체 생성 시 초기화

new User(...)
  └─ User 클래스의 인스턴스인 객체 생성
       ├─ 참조 변수: 객체를 가리키는 참조값 저장
       ├─ this: 현재 객체를 가리킴
       ├─ static: 클래스 전체가 공유
       ├─ final: 재대입, 상속, 오버라이드 제한
       ├─ 캡슐화: 내부 데이터 보호
       └─ 상속: 부모의 기능을 자식이 재사용
```

### 핵심 문장

- 클래스는 객체를 만들기 위한 설계도다.
- 객체는 실행 중 메모리에 실제로 만들어진 실체다.
- 인스턴스는 특정 클래스에서 만들어진 객체라는 관계를 나타낸다.
- 필드는 객체의 상태를 저장하고, 메서드는 객체의 동작을 정의한다.
- 생성자는 객체가 만들어질 때 초기값을 설정한다.
- 참조 변수에는 객체 자체가 아니라 객체를 가리키는 참조값이 저장된다.
- `this`는 현재 객체, `super`는 부모 클래스 부분을 가리킨다.
- `static` 멤버는 클래스에 소속되어 모든 객체가 공유한다.
- 캡슐화는 데이터를 숨기고 필요한 기능만 외부에 공개하는 방식이다.
- 상속은 부모의 기능을 자식이 물려받는 것이고, 오버라이드는 물려받은 동작을 자식에 맞게 다시 정의하는 것이다.
