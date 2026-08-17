---
layout: post
title: "Java 객체지향 Part 2: OOP 핵심 문법"
description: "참조 변수, 멤버, static, final, 접근 제어자, 캡슐화, 상속과 오버라이드를 코드로 정리한다."
date: 2026-08-10 12:00:00 +0900
categories: [java, oop]
tags: [Java, OOP, Class, Object, Instance, Field, Method, Constructor, Static, Encapsulation, Inheritance, Override]
series: "Java 객체지향"
part: 2
---

## Java 객체지향 Part 2: OOP 핵심 문법

### 1. OOP란?

```text
OOP = Object-Oriented Programming
    = 객체지향 프로그래밍
```

객체지향 프로그래밍은 프로그램을 `객체` 단위로 나누어 설계하는 방법이다. 객체 안에 데이터와 동작을 함께 묶고, 객체끼리 메시지를 주고받으며 프로그램을 실행한다.

```java
class Stock {
    String name; // 데이터: 필드
    double price;

    void printInfo() { // 동작: 메서드
        System.out.println(name + " : " + price);
    }
}

Stock stock = new Stock(); // 객체 생성
stock.name = "SKALA";
stock.printInfo();         // 객체의 동작 호출
```

Java OOP를 이해할 때 가장 먼저 구분할 용어는 다음과 같다.

| 용어 | 정의 |
| --- | --- |
| 클래스(`Class`) | 객체를 만들기 위한 설계도. 필드와 메서드를 정의한다. |
| 객체(`Object`) | 클래스에 따라 실행 중 메모리에 실제로 만들어진 실체다. |
| 인스턴스(`Instance`) | 특정 클래스에서 만들어진 객체라는 관계를 강조하는 표현이다. |
| 필드(`Field`) | 객체의 상태나 데이터를 저장하는 클래스 내부 변수다. |
| 메서드(`Method`) | 객체가 수행할 동작을 정의한 클래스 내부 코드 블록이다. |
| 생성자(`Constructor`) | 객체가 만들어질 때 초기 상태를 설정하는 특별한 코드 블록이다. |

### 2. 클래스, 객체, 인스턴스, 참조 변수

#### 클래스와 객체

클래스는 설계도이고 객체는 설계도로 만든 실제 결과물이다. 클래스 선언만으로는 객체가 생성되지 않으며, `new`를 사용해야 객체가 만들어진다.

```java
class User {
    String name;
    int age;
}

User user1 = new User();
User user2 = new User();
```

`user1`과 `user2`는 같은 `User` 클래스에서 만들어졌지만 서로 다른 객체다. 따라서 각각의 `name`과 `age` 값을 독립적으로 가질 수 있다.

#### 인스턴스

`User` 클래스에서 만들어진 객체를 `User의 인스턴스`라고 한다. 즉, 객체는 실체에 초점을 둔 표현이고 인스턴스는 “어떤 클래스에서 만들어졌는가”에 초점을 둔 표현이다.

```text
User 클래스
   │       │
   ▼       ▼
user1   user2
   │       │
User 인스턴스  User 인스턴스
```

#### 참조 변수

참조 변수는 객체 자체가 아니라 객체를 가리키는 참조값을 저장한다.

```java
User a = new User();
User b = a;
```

```text
a ─────┐
       ▼
  [ Heap의 User 객체 ]
       ▲
b ─────┘
```

`a`와 `b`는 같은 객체를 가리킨다. `a`와 `b`가 별도의 변수가 아닌 것은 아니지만, 두 변수가 가리키는 객체는 하나다.

참고로 Java의 모든 클래스는 기본적으로 `java.lang.Object`를 직접 또는 간접적으로 상속한다. `int`, `double`, `boolean` 같은 기본형은 객체가 아니다.

### 3. 필드, 메서드, 생성자

다음 `Stock` 클래스를 기준으로 세 개념을 함께 살펴보자.

```java
class Stock {
    private final String name; // 필드
    private double price;       // 필드

    Stock(String name, double price) { // 생성자
        this.name = name;
        this.price = price;
    }

    public void updatePrice(double newPrice) { // 메서드
        this.price = newPrice;
    }

    public void printInfo() { // 메서드
        System.out.println(name + " : " + price + "원");
    }
}
```

#### 필드(Field)

필드는 클래스 안에 선언된 변수다. 객체가 가지고 있는 상태를 저장한다.

- `name`, `price`: Stock 객체의 상태
- 인스턴스 필드: 객체마다 독립적으로 존재
- `static` 필드: 클래스에 하나만 존재하며 객체들이 공유

#### 메서드(Method)

메서드는 클래스 안에 선언된 코드 블록이다. 객체의 동작을 정의하며, 입력을 받을 수도 있고 결과를 반환할 수도 있다.

```java
[접근 제어자] [반환형] [메서드 이름](매개변수 목록) {
    // 실행할 코드
    return 반환값;
}
```

`void`는 호출한 곳에 반환할 값이 없다는 뜻이다. `0`이나 `null`을 반환한다는 뜻이 아니다.

```java
public void printWelcome() {
    System.out.println("환영합니다.");
}

public double getPrice() {
    return price;
}
```

#### 생성자(Constructor)

생성자는 `new`로 객체를 만들 때 자동으로 실행되어 초기값을 설정하는 특별한 코드 블록이다.

- 이름이 클래스 이름과 같다.
- 반환형을 작성하지 않는다. `void`도 작성하지 않는다.
- 생성자를 직접 작성하지 않으면 컴파일러가 기본 생성자를 제공한다. 단, 다른 생성자를 직접 작성하면 기본 생성자가 자동으로 생기지 않는다.

```java
Stock stock = new Stock("SKALA", 17000);
```

위 코드가 실행되면 Heap에 Stock 객체가 만들어지고, 생성자가 `name`과 `price`를 초기화한다.

생성자는 메서드처럼 보이지만 Java 언어에서는 반환형이 없고 호출 방식도 다르므로 일반 메서드와 구분한다.

### 4. `this`, 매개변수, 인자

#### `this`

`this`는 인스턴스 메서드나 생성자에서 현재 객체 자신을 가리키는 참조다.

```java
class User {
    private String name;

    User(String name) {
        this.name = name;
    }
}
```

```text
this.name = name;
│           │
│           └─ 생성자에 전달된 매개변수
└─ 현재 객체의 필드
```

따라서 `this.name = name;`은 현재 객체의 `name` 필드에 매개변수 `name`의 값을 저장한다는 뜻이다.

#### 매개변수와 인자

- 매개변수(`Parameter`): 메서드 선언부에서 입력을 받기 위해 선언한 변수
- 인자(`Argument`): 메서드를 호출할 때 실제로 전달하는 값

```java
public void sayHello(String name) { // name: 매개변수
    System.out.println(name);
}

sayHello("민형");                   // "민형": 인자
```

### 5. 멤버(Member)

멤버는 클래스 내부에 속한 구성 요소를 통칭하는 말이다. 대표적으로 필드와 메서드가 있으며, 정적 멤버와 중첩 타입도 멤버에 포함될 수 있다.

```java
class User {
    String name;        // 필드 멤버

    void introduce() {  // 메서드 멤버
        System.out.println(name);
    }
}
```

생성자는 클래스 내부에 작성되지만 일반 메서드와는 구분되는 특별한 초기화 문법이다.

### 6. `static`: 클래스에 소속된 멤버

`static`은 필드나 메서드를 특정 객체가 아니라 클래스 자체에 소속시키는 키워드다.

```java
class User {
    private static int count = 0;

    User() {
        count++;
    }

    public static int getCount() {
        return count;
    }
}

User user1 = new User();
User user2 = new User();
System.out.println(User.getCount()); // 2
```

`count`는 User 객체마다 따로 생기는 값이 아니라 User 클래스가 하나만 가지고 모든 객체가 공유하는 값이다.

```text
User 클래스
    │
  count = 2  ← user1, user2가 함께 사용
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

### 7. `final`: 재대입과 변경 제한

`final`은 대상에 따라 의미가 조금 다르다.

```java
final int age = 25;
// age = 30; // 컴파일 오류
```

| 적용 대상 | 의미 |
| --- | --- |
| 변수, 필드 | 값을 다시 대입할 수 없음 |
| 클래스 | 다른 클래스가 상속할 수 없음 |
| 메서드 | 자식 클래스가 오버라이드할 수 없음 |

참조 변수에 `final`을 사용하면 참조 대상을 바꿀 수 없다는 뜻이다. 객체 내부 필드까지 모두 변경할 수 없다는 뜻은 아니다.

```java
final User user = new User();
// user = new User(); // 다른 객체를 다시 대입할 수 없음
user.name = "민형";    // name이 final이 아니면 변경 가능
```

### 8. 접근 제어자와 캡슐화

#### 접근 제어자(Access Modifier)

접근 제어자는 클래스, 필드, 메서드 등에 외부 코드가 접근할 수 있는 범위를 결정한다.

| 접근 제어자 | 접근 범위 |
| --- | --- |
| `public` | 어디서든 접근 가능 |
| `protected` | 같은 패키지와 자식 클래스에서 접근 가능 |
| 기본 접근 제어자 | 같은 패키지에서만 접근 가능 |
| `private` | 선언된 클래스 내부에서만 접근 가능 |

#### 캡슐화(Encapsulation)

캡슐화는 객체 내부의 데이터를 외부에서 직접 변경하지 못하게 숨기고, 필요한 기능만 메서드로 공개하는 설계 방식이다.

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

Account account = new Account();
account.deposit(10000);
System.out.println(account.getBalance());
```

외부 코드는 `balance`를 직접 바꾸지 않고, 유효성 검사가 포함된 `deposit()`을 통해서만 잔액을 변경한다.

#### Getter와 Setter

- Getter: private 필드의 값을 반환하는 메서드
- Setter: private 필드에 값을 대입하는 메서드

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

Getter와 Setter를 모든 필드에 무조건 만들 필요는 없다. 객체 설계에 따라 필요한 기능만 외부에 공개하는 것이 중요하다.

### 9. 상속과 오버라이드

#### 상속(Inheritance)

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
dog.eat(); // Animal에게서 물려받은 메서드
```

Java 클래스는 부모 클래스를 하나만 직접 상속할 수 있다. 대신 하나의 클래스가 여러 인터페이스를 구현하는 것은 가능하다.

#### 오버라이드(Override)

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

`@Override`는 부모 메서드를 재정의한다는 것을 컴파일러에 알려 주는 애너테이션이다. 메서드 이름이나 매개변수를 잘못 작성했을 때 오류를 확인하는 데 도움이 된다.

#### 오버로딩과 오버라이드 비교

| 구분 | 오버로딩(Overloading) | 오버라이드(Override) |
| --- | --- | --- |
| 발생 위치 | 같은 클래스 안 | 부모와 자식 클래스 사이 |
| 목적 | 같은 이름으로 다른 입력 처리 | 부모 동작을 자식에 맞게 변경 |
| 매개변수 | 달라야 함 | 부모 메서드와 같아야 함 |
| 표시 | 별도 키워드 없음 | `@Override` 사용 권장 |

### 10. 핵심 용어 요약

| 용어 | 한 줄 정의 |
| --- | --- |
| OOP | 객체를 중심으로 데이터와 동작을 묶어 설계하는 프로그래밍 방식 |
| 클래스 | 객체를 만들기 위한 설계도 |
| 객체 | 실행 중 메모리에 만들어진 실체 |
| 인스턴스 | 특정 클래스에서 만들어진 객체 |
| 참조 변수 | 객체를 가리키는 참조값을 저장하는 변수 |
| 필드 | 객체의 상태를 저장하는 변수 |
| 메서드 | 객체의 동작을 정의하는 코드 블록 |
| 생성자 | 객체 생성 시 초기값을 설정하는 코드 블록 |
| `this` | 현재 객체를 가리키는 참조 |
| `static` | 클래스에 소속되어 객체들이 공유하는 멤버를 만드는 키워드 |
| `final` | 재대입, 상속, 오버라이드를 제한하는 키워드 |
| 캡슐화 | 내부 데이터를 숨기고 필요한 기능만 공개하는 설계 방식 |
| 상속 | 부모 클래스의 기능을 자식 클래스가 물려받는 기능 |
| 오버라이드 | 부모 메서드를 자식 클래스에서 다시 정의하는 것 |

### 마지막 한 번에 정리

| 체크 포인트 | 핵심 문장 | 외우기 포인트 |
| --- | --- | --- |
| 클래스와 객체 | 클래스는 설계도, 객체는 실행 중 만든 실체 | `new` 뒤에만 객체가 생성됨 |
| 인스턴스와 참조 | 변수는 참조값을 저장 | `a = b`는 객체 복사가 아니라 주소 공유 |
| 필드와 메서드 | 필드는 상태, 메서드는 동작 | 필드는 `static`이면 공유, 아니면 객체별로 별도 생성 |
| 생성자 | 객체 생성 시점의 초기화 구문 | 반환형이 없고 클래스명과 동일 |
| `this` | 현재 객체 자신을 가리킴 | `this.name = name`은 필드/매개변수 구분용 |
| `static` | 클래스 소유 멤버 | `ClassName.메서드()`로 호출 가능 |
| `final` | 변경 제한 키워드 | 변수는 재할당 금지, 클래스/메서드는 상속·오버라이드 제한 |
| 접근 제어자 | 외부 접근 범위 제어 | `private` + getter/setter 조합으로 캡슐화 |
| 상속/오버라이드 | 기능 재사용과 동작 변경 | 오버라이드는 이름·매개변수 동일 + `@Override` |
| 오버로딩/오버라이드 | 이름은 같아도 다른 용도 | 오버로딩은 매개변수/시그니처 다름 |
