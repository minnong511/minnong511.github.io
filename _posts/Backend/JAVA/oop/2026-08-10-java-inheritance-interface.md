---
layout: post
title: "Java 객체지향 Part 4: 상속과 인터페이스"
description: "Java의 상속, 인터페이스, Override 애너테이션과 다중 구현 방식을 예제로 정리한다."
date: 2026-08-10 13:20:00 +0900
categories: [java, oop]
tags: [Java, OOP, Inheritance, Interface, Override, Polymorphism]
series: "Java 객체지향"
part: 4
---

# Java 객체지향 Part 4: 상속과 인터페이스

## 1. 상속 

상속은 `Superclass`의 상태와 동작을 `Subclass`가 물려받아 재사용하고 확장하는 방법이다. 

일반적으로 기능을 물려받는 쪽을 자식 클래스, 물려주는 쪽을 부모 클래스라고 한다. 

## 2. 인터페이스 

> 공통 규칙을 정의하고, 서로 다른 구현 객체를 같은 타입으로 처리해 다형성을 활용할 수 있다.

- 클래스가 구현해야 하는 메서드의 규약(Contract)를 정의하는 참조 타입 
- 메서드 시그니쳐 (이름, 매개변수, 반환형)만 선언하고 실제 구현은 인터페이스를 구현한 클래스가 담당 

```java
public interface Animal {
    void makeSound();
}
```

- class 키워드 대신 interface 키워드 활용
- 메소드의 정의만 해두고 구현체는 존재하지 않음


```java
// 1. 인터페이스 선언
interface Animal {
    void makeSound();
}

// 2. Dog 구현체
class Dog implements Animal {

    @Override
    public void makeSound() {
        System.out.println("멍멍!");
    }
}

// 3. Cat 구현체
class Cat implements Animal {

    @Override
    public void makeSound() {
        System.out.println("야옹!");
    }
}

// 4. Main 클래스
public class AnimalSound {
    public static void main(String[] args) {
        // Animal 타입으로 각각의 구현 객체를 참조
        Animal dog = new Dog();
        Animal cat = new Cat();

        dog.makeSound(); // 멍멍!
        cat.makeSound(); // 야옹!

        // Animal 타입을 받는 메서드에 Cat 객체 전달
        handleAnimalSound(cat);
    }

    // Animal을 구현한 객체라면 전달 가능
    static void handleAnimalSound(Animal animal) {
        animal.makeSound();
    }
}
```

### `@Override` Annotation 사용 이유 

다음과 같은 이유로 사용 권고 

1. 컴파일러 체크 기능 
2. 가독성향상
3. 리팩토링 안정성

### 인터페이스 메서드 접근자 

인터페이스의 추상 메서드는 기본적으로 `public abstract`이며, 명시하지 않아도 자동으로 적용된다.

## 3. 다중 상속

Java 클래스는 다중 상속을 지원하지 않지만, 여러 인터페이스를 동시에 구현할 수 있다.

```java
interface Flyable {
    void fly();
}

interface Swimmable {
    void swim();
}

abstract class Bird {
    public void moving() {
        System.out.println("움직입니다!");
    }
}

// 하나의 클래스가 두 인터페이스를 모두 구현
class Duck extends Bird implements Flyable, Swimmable {
    @Override
    public void fly() {
        System.out.println("오리가 하늘을 납니다!");
    }

    @Override
    public void swim() {
        System.out.println("오리가 물 위를 헤엄칩니다!");
    }
}

Duck duck = new Duck();
duck.fly();
duck.swim();
duck.moving();
```

클래스는 다중 상속을 지원하지 않는다.

```java
class A {
    void print() {
        System.out.println("A");
    }
}

class B {
    void print() {
        System.out.println("B");
    }
}

// 컴파일 오류: Java 클래스는 두 클래스를 동시에 상속할 수 없다.
class C extends A, B {
}
```

`A`와 `B`에 같은 `print()` 메서드가 있으면 어느 메서드를 물려받아야 하는지 모호해지기 때문에 클래스 다중 상속을 허용하지 않는다.
