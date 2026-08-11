---
layout: post
title: "Java 객체지향 Part 3: 좋은 설계와 OOP 4대 특성"
description: "응집도와 결합도, 캡슐화, 추상화, 상속, 다형성을 중심으로 객체지향 설계 원칙을 정리한다."
date: 2026-08-10 13:00:00 +0900
categories: [java, oop]
tags: [Java, OOP, Object, Encapsulation, Abstraction, Inheritance, Polymorphism]
series: "Java 객체지향"
part: 3
---

# Java 객체지향 Part 3: 좋은 설계와 OOP 4대 특성

## 1. OOP란?

OOP(Object-Oriented Programming)는 프로그램을 여러 **객체(Object)**로 나누고, 객체들이 서로 요청하고 응답하면서 문제를 해결하도록 설계하는 방식이다.

예를 들어 사람이 상품을 주문하는 상황은 다음과 같이 표현할 수 있다.

- `Customer` 객체가 `Product` 객체에 주문을 요청한다.
- `Product` 객체는 자신의 가격과 재고를 확인한다.
- 각 객체는 맡은 역할과 책임에 따라 동작한다.

즉, 객체는 자신의 상태를 관리하고 필요한 동작을 수행하는 프로그램의 구성 단위다.

## 2. 핵심 용어

| 용어 | 정의 | 쉬운 예시 |
| --- | --- | --- |
| 클래스(Class) | 객체를 만들기 위한 설계도 | `Stock`이라는 주식 설계도 |
| 객체(Object) | 클래스를 바탕으로 만들어진 대상 | 삼성전자 주식 객체 |
| 상태(State) | 객체가 가지고 있는 데이터 | 종목명, 가격 |
| 행동(Behavior) | 객체가 수행할 수 있는 기능 | 가격 변경, 정보 출력 |
| 책임(Responsibility) | 객체가 맡아서 처리해야 하는 일 | 주식 객체가 올바른 가격을 관리하는 일 |
| 메시지(Message) | 다른 객체의 메서드를 호출해 작업을 요청하는 것 | `stock.setPrice(80000)` |

```java
class Stock {
    private String name;   // 상태
    private double price;  // 상태

    public void printInfo() { // 행동
        System.out.println(name + ": " + price + "원");
    }
}
```

## 3. 좋은 객체지향 설계

좋은 객체지향 설계는 일반적으로 **높은 응집도**와 **낮은 결합도**를 지향한다.

### 응집도(Cohesion)

하나의 클래스 안에 서로 밀접한 역할과 기능이 모여 있는 정도다. 한 클래스가 하나의 명확한 책임에 집중할수록 응집도가 높다.

```text
Stock 클래스 → 종목명과 가격 관리
Order 클래스 → 주문 생성과 주문 상태 관리
```

### 결합도(Coupling)

클래스가 다른 클래스에 의존하는 정도다. 의존성이 낮을수록 한 클래스의 변경이 다른 클래스에 미치는 영향이 작다.

```text
높은 응집도 + 낮은 결합도
→ 이해하기 쉽고, 수정과 확장이 쉬운 코드
```

## 4. OOP의 네 가지 핵심 특징

### 4.1 캡슐화(Encapsulation)

캡슐화는 객체의 데이터와 기능을 하나로 묶고, 내부 데이터를 외부에서 함부로 변경하지 못하도록 숨기는 것이다.

```java
class Stock {
    private double price;

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        if (price <= 0) {
            System.out.println("가격은 0보다 커야 합니다.");
            return;
        }

        this.price = price;
    }
}
```

- `private` 필드는 외부에서 직접 접근할 수 없다.
- 공개된 메서드를 통해서만 값을 조회하거나 변경한다.
- 메서드 안에서 유효성 검사를 수행해 객체의 상태를 안전하게 보호할 수 있다.

### 4.2 추상화(Abstraction)

추상화는 복잡한 내부 구현은 숨기고, 사용하는 사람이 알아야 할 기능만 보여 주는 것이다.

```java
interface Printable {
    void printInfo();
}
```

사용자는 `printInfo()`가 내부에서 어떻게 동작하는지 몰라도 "정보를 출력하는 기능"이라는 사실만 알면 사용할 수 있다.

### 4.3 상속(Inheritance)

상속은 기존 클래스의 필드와 메서드를 새로운 클래스가 물려받아 확장하는 기능이다. Java에서는 `extends`를 사용한다.

```java
class Stock {
    protected String name;
    protected double price;

    public Stock(String name, double price) {
        this.name = name;
        this.price = price;
    }

    public void printInfo() {
        System.out.println("[일반주] " + name + ", " + price + "원");
    }
}

class PreferredStock extends Stock {
    private double dividendRate;

    public PreferredStock(String name, double price, double dividendRate) {
        super(name, price);
        this.dividendRate = dividendRate;
    }
}
```

- `PreferredStock`은 `Stock`의 필드와 메서드를 물려받는다.
- `super(...)`는 부모 클래스의 생성자를 호출한다.
- 상속은 두 클래스가 명확한 **is-a 관계**일 때 사용하는 것이 좋다.

```text
PreferredStock is a Stock.
우선주는 주식이다.
```

### 4.4 다형성(Polymorphism)

다형성은 같은 타입의 메서드를 호출하더라도 실제 객체에 따라 서로 다르게 동작하는 성질이다.

```java
class Stock {
    public void printInfo() {
        System.out.println("일반주 정보");
    }
}

class PreferredStock extends Stock {
    @Override
    public void printInfo() {
        System.out.println("우선주 정보");
    }
}

public class Main {
    public static void main(String[] args) {
        Stock stock1 = new Stock();
        Stock stock2 = new PreferredStock();

        stock1.printInfo(); // 일반주 정보
        stock2.printInfo(); // 우선주 정보
    }
}
```

`stock2`의 변수 타입은 `Stock`이지만 실제 객체는 `PreferredStock`이다. 따라서 실행할 때는 자식 클래스가 재정의한 `printInfo()`가 호출된다.

## 5. 오버로딩과 오버라이딩

| 구분 | 오버로딩(Overloading) | 오버라이딩(Overriding) |
| --- | --- | --- |
| 의미 | 같은 이름의 메서드를 매개변수에 따라 여러 개 정의 | 부모 메서드를 자식 클래스에서 다시 정의 |
| 조건 | 매개변수의 개수 또는 타입이 달라야 함 | 메서드 이름과 매개변수가 같아야 함 |
| 목적 | 다양한 입력 방식 제공 | 객체에 따라 다른 동작 제공 |
| 관련 개념 | 컴파일 시점 다형성 | 실행 시점 다형성 |

```java
class Calculator {
    int add(int a, int b) {
        return a + b;
    }

    double add(double a, double b) {
        return a + b;
    }
}
```

위 코드는 매개변수 타입이 다른 `add()` 메서드를 여러 개 정의한 오버로딩 예시다.

## 6. 절차적 프로그래밍과 OOP 비교

| 구분 | 절차적 프로그래밍 | 객체지향 프로그래밍 |
| --- | --- | --- |
| 중심 단위 | 함수와 실행 순서 | 클래스와 객체 |
| 데이터 처리 | 데이터와 함수를 주로 분리 | 데이터와 메서드를 객체 안에 묶음 |
| 실행 흐름 | 정해진 순서에 따라 함수 호출 | 객체끼리 메시지를 주고받으며 동작 |
| 재사용 | 함수 단위 재사용 | 클래스, 객체, 상속, 조합을 통한 재사용 |
| 유지보수 | 규모가 커지면 데이터 흐름 추적이 어려울 수 있음 | 역할과 책임이 잘 분리되면 변경 범위를 줄이기 쉬움 |
| 대표 개념 | 순차, 조건, 반복, 함수 | 캡슐화, 추상화, 상속, 다형성 |
| 대표 언어 | C, Pascal, Fortran | Java, C++, C#, Python |

> C++가 객체지향 프로그래밍을 지원하며, C는 대표적인 절차적 프로그래밍 언어다.

## 7. 핵심 정리

| 개념 | 한 문장 정의 | Java의 주요 구현 방법 |
| --- | --- | --- |
| 객체 | 상태와 행동을 함께 가지는 프로그램 구성 단위 | `new`로 인스턴스 생성 |
| 캡슐화 | 데이터를 숨기고 공개된 메서드로 접근을 제어 | `private`, getter, setter |
| 추상화 | 복잡한 구현을 숨기고 필요한 기능만 노출 | `interface`, `abstract class` |
| 상속 | 기존 클래스의 기능을 물려받아 확장 | `extends`, `super` |
| 다형성 | 같은 호출이 실제 객체에 따라 다르게 동작 | 오버라이딩, 부모 타입 참조 |
| 응집도 | 한 클래스의 기능이 하나의 책임에 집중된 정도 | 단일 책임을 가진 클래스 설계 |
| 결합도 | 클래스끼리 서로 의존하는 정도 | 인터페이스를 통한 의존성 분리 |

```text
객체지향 프로그래밍의 핵심
= 객체마다 역할과 책임을 나누고
+ 내부 상태는 안전하게 보호하며
+ 객체들이 협력하도록 설계하는 것
```
