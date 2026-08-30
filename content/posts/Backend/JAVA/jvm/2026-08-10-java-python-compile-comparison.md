---
layout: post
title: "Java 실행과 JVM Part 1: Java와 Python 컴파일 비교"
description: "Python과 Java의 바이트코드 실행 과정을 비교하고 javac, JVM, classpath, package의 역할을 정리한다."
date: 2026-08-10 09:50:00 +0900
categories: [java, jvm]
tags: [Java, Python, Compiler, Bytecode, JVM, Classpath, Package]
series: "Java 실행과 JVM"
part: 1
legacyPath: "/java/jvm/2026/08/10/java-python-compile-comparison/"
---
## Java 실행과 JVM Part 1: Java와 Python 컴파일 비교

### Python

```text
main.py
    ↓
소스코드 파싱
    ↓
Bytecode 생성
    ↓
Python Virtual Machine에서 실행
```

컴파일과 실행이 붙어서 그렇지 Python도 내부적으로는 바이트코드로 컴파일하는 과정이 있다.

### Java

파이썬보다는 JAVA의 컴파일 과정이 더 명확하게 분리된다.

예를 들어 `Main.java` 파일이 있다고 치자. 

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
```

먼저 컴파일하면 

```bash
javac Main.java
```

```text
Main.java
    ↓ javac
Main.class
```

가 만들어진다. 

Main.class 안에는 Java Bytecode가 들어 있다. 

그 다음으로 

```bash
java Main
```

`Main.class → JVM → 실행`이 된다. 

전체적으로 다시 살펴보면 

```text
Java Source
Main.java
    ↓
javac 컴파일
    ↓
Java Bytecode
Main.class
    ↓
JVM
    ↓
실행
```

#### Java가 디렉터리를 읽는 부분

```text
project/
├── Main.java
├── User.java
└── Car.java
```

위 구조에서 `javac Main.java`를 실행했다고 하자.

Java가 아무 이유 없이 `User.java`, `Car.java`를 전부 실행하는 것은 아니다. 

Main.java가 어떤 클래스를 참조하는지 확인할 뿐이다. 

```java
public class Main {
    public static void main(String[] args) {
        User user = new User();
    }
}
```

그러면 컴파일러 입장에서는 

```text
Main.java 컴파일 중

User라는 타입이 있네?
    ↓
User가 어디 있지?
    ↓
classpath / sourcepath에서 검색
```

그래서 어제했던 것 중에 

`Stock cannot be resolved to a type`

Main.java 에 

`Stock stock = new Stock();`가 있는데 

```text
Stock이 뭐지?
    ↓
클래스를 찾아봄
    ↓
못 찾음
    ↓
Stock cannot be resolved to a type
```

이렇게 된것 .

#### 여기서 Package가 등장

```java
package com.example.model;

public class User {
}
```

라면 이 클래스 정식이름 User가 되는 것이 아니라

`com.example.model.User`

```java
import com.example.model.User;
```

그래서 구체적으로 명시하면 
User라고 쓰면 com.example.model.User를 말하게 된다. 

그래서 JAVA 프로젝트를 조금 더 정확히 보면 

```text
src/
└── com/
    └── example/
        ├── Main.java
        └── model/
            └── User.java
```

Main.java:

```java
package com.example;

import com.example.model.User;

public class Main {
    public static void main(String[] args) {
        User user = new User();
    }
}
```

컴파일러는 대략 이런 관계를 확인하다.

```text
Main.java 

import 

User.java 

그리고 필요한 클래스들을 컴파일

Main.class
User.class
```

### Python과 Java 비교

| | Python | Java |
|---|---|---|
| 소스 | `.py` | `.java` |
| 컴파일 | 내부적으로 Bytecode 생성 | `javac`로 명시적 컴파일 |
| Bytecode | Python Bytecode | Java Bytecode |
| 실행 | Python VM | JVM |
| 일반적인 명령 | `python main.py` | `javac Main.java` → `java Main` |
| 타입 검사 | 주로 실행 중 | 주로 컴파일 시 |

### 요약 

JAVA 실행 구조를 한 문장으로 말하면... 

> Java는 `.java` 소스 코드를 컴파일러가 검사하여 JVM이 실행할 수 있는 `.class` 바이트코드로 변환하고, JVM이 실행한다.

Python의 경우에는 

> Python은 소스 코드를 실행할 때 내부적으로 바이트코드로 변환하고, Python 가상 머신이 이를 실행한다. 다만 컴파일 과정이 겉으로 드러나지는 않는다.
