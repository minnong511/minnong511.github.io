---
layout: post
title: "Java 실행과 JVM Part 3: ClassLoader와 JVM 메모리"
description: "Java 소스가 실행되는 과정과 ClassLoader, Heap, Stack, Method Area, Code Cache의 역할을 정리한다."
date: 2026-08-10 10:20:00 +0900
categories: [java, jvm]
tags: [Java, JVM, ClassLoader, Heap, Stack, Method Area, Code Cache]
series: "Java 실행과 JVM"
part: 3
---

# Java 실행과 JVM Part 3: ClassLoader와 JVM 메모리

## 실행 과정 요약

```text
Java Source (.java)
    ↓
Java Compiler (javac)
    ↓
Byte Code (.class)
    ↓
ClassLoader
    ↓
JVM
    ↓
OS
    ↓
Hardware
```

### `Main.java`

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
```

```bash
javac Main.java
```

```text
Main.java
    ↓ javac
Main.class
```

Main.class에는 CPU가 직접 실행하는 기계어가 아니라 JAVA Bytecode가 들어있다. 

그 다음에는 

`java Main`을 실행하면 `Main.class`를 가져와 실행한다. 

## 1. ClassLoader 

```text
.class → ClassLoader → JVM
```

ClassLoader의 역할은 
> JVM이 실행에 필요한 .class 파일을 찾아서 JVM 메모리에 올리는 것.

예를 들어 

```java
User user = new User();
```

JVM이 실행하면서 User 클래스가 필요하다. 
그러면 ClassLoader가 User.class를 찾아 로딩한다.

## 2. JVM 메모리 영역 

```text
                JVM

        ┌─────────────────┐
        │    공유 영역      │
        │                 │
        │ Heap            │
        │ Method Area     │
        │ Code Cache      │
        └─────────────────┘

        ┌─────────────────┐
        │  Thread별 영역    │
        │                 │
        │ Stack           │
        │ PC Register     │
        │ Native Stack    │
        └─────────────────┘
```

> 모든 스레드가 같이 사용하는 메모리와 각 스레드가 자기 것만 사용하는 메모리가 있다.

## 3. Heap 

`Heap`은 객체 인스턴스를 저장하는 영역이다.

이라고 적혀있지. 예를 들어 

```java
User user = new User("민형");
```

하면 

```text
user ───────→ [User 객체]
                name = "민형"
```

실제는 

[User 객체]가 주로 Heap에 생성된다. 

```java
new User();
new Dog();
new Cat();
```

으로 만들어지는 갹체들이 Heap과 연결된다. 

## 4. Stack 

```text
Thread 1 - Stack
Thread 2 - Stack
```

stack은 메서드가 호출될 때 그 메서드를 실행하기 위한 작업 공간

```java
static void hello() {
    int age = 20;
}
```

hello()가 호출되면 Stack에 메서드 실행을 위한 Stack Frame이 생성된다. 


```text
Thread Stack

┌────────────────────┐
│ hello() Frame      │
│                    │
│ age = 20           │
└────────────────────┘
```

메서드가 끝나면 해당 Stack Frame도 제거

## 5. Heap과 Stack 연결 

```java
User user = new User("민형");
```

```text
Stack                         Heap

user ─────────────────────→ [User 객체]
                              name="민형"
```

user -> 참조 변수 
User -> 실제 객체 

이게 JVM 메모리까지 연결된다. 

일반적인 지역 참조 변수 user는 해당 메서드 Stack Frame에서 관리된다. 
new User()로 만들어진 실제 객체는 Heap에 존재한다. 

```java
User a = new User("민형");
User b = a;
```

개념적으로 

```text
Stack                         Heap

a ─────────┐
           ├──────────────→ [User 객체]
b ─────────┘                 name="민형"
```

참조 변수가 두 개, Heap의 객체는 하나 
앞에서 공부한 참조 변수 개념이 JVM에서 이어진다. 

## 6. 왜 Stack이 Thread마다 따로 있나? 

예를 들어 두 개의 thread가 동시에 실행된다고 해보자 

```text
Thread 1 → calculate() 실행
Thread 2 → sendEmail() 실행
```

각자 실행 중인 메서드와 지역 변수가 다르므로 

```text
Thread 1 Stack

calculate()
x = 10
y = 20

Thread 2 Stack

sendEmail()
email = "..."
```

각 Thread가 자기 Stack을 가지고 있어야할 필요가 있다. 

반면 Heap 객체는 여러 Thread가 함께 접근할 수 있다. 

그래서 동시성 프로그램에서 같은 heap 객체에서 

`여러 Thread → 같은 Heap 객체 수정 → Race Condition`

## 7. Method Area 

Method Area 

- 클래스 메타데이터
- 상수 풀 
- Runtime Constant Pool 

> JVM이 클래스 자체에 대한 정보를 저장하는 공간

```java
class User {
    String name;

    void hello() {
    }
}
```

이 클래스 이름은 User다
어떤 필드가 있다
어떤 메서드가 있다
상속 관계는 어떻다
상수는 무엇이 있다

현대 Java에서 이런 클래스 메타데이터를 주로 Metaspace를 통해 구현

```text
Method Area → 개념적인 JVM 영역
Metaspace   → HotSpot JVM에서 이를 구현하는 핵심 영역
```

## 8. Code Cache

이미지에는 

`Code Cache`에는 JIT 컴파일된 네이티브 코드가 저장된다.
