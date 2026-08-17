---
layout: post
title: "Java 객체지향 Part 1: 클래스, 객체, 필드와 생성자"
description: "클래스, 객체, 인스턴스부터 필드, 메서드, 생성자, this, super, static까지 기본 문법을 정리한다."
date: 2026-08-10 11:00:00 +0900
categories: [java, oop]
tags: [Java, Class, Object, Instance, Field, Method, Constructor, This, Super, Static]
series: "Java 객체지향"
part: 1
---

## Java 객체지향 Part 1: 클래스, 객체, 필드와 생성자

Java를 이해하려면 먼저 `클래스`, `객체`, `인스턴스`, `필드`, `메서드`, `생성자`를 구분해야 한다. 이 글에서는 각 용어를 다음 순서로 설명한다.

1. 용어의 정확한 정의
2. 서로 어떤 관계인지
3. 코드에서 어떻게 사용하는지

### 1. 핵심 용어 한눈에 보기

| 용어 | 정확한 정의 | 쉬운 비유 |
| --- | --- | --- |
| 클래스(`Class`) | 객체를 만들기 위한 설계도이며, 객체가 가질 필드와 메서드를 정의한 코드 단위 | 자동차 설계도 |
| 객체(`Object`) | 프로그램 실행 중 클래스에 따라 실제로 만들어진 데이터 | 실제 자동차 |
| 인스턴스(`Instance`) | 특정 클래스에서 생성된 객체라는 관계를 강조하는 표현 | 자동차 설계도로 만든 한 대의 자동차 |
| 필드(`Field`) | 클래스 안에 선언되어 객체의 상태를 저장하는 변수 | 자동차의 색상, 속도 |
| 메서드(`Method`) | 클래스 안에 선언되어 객체의 동작을 정의하는 코드 블록 | 자동차의 가속, 정지 |
| 생성자(`Constructor`) | 객체가 생성될 때 필드를 초기화하는 특별한 코드 블록 | 자동차를 출고할 때 기본 설정 |
| 참조값(`Reference`) | 객체가 있는 곳을 가리키는 값 | 자동차 주차 위치 |

#### 객체와 인스턴스의 차이

두 단어는 실제 대화에서 비슷하게 사용하지만 강조점이 다르다.

- `객체`: 실행 중 존재하는 실체라는 점을 강조한다.
- `인스턴스`: 어떤 클래스에서 만들어졌는지를 강조한다.

```java
Stock stock = new Stock("SKALA", 17000);
```

위 코드에서 `new Stock(...)`으로 Heap에 만들어진 실체는 `객체`다. 동시에 `Stock` 클래스에서 만들어졌으므로 `Stock의 인스턴스`라고도 부른다.

참고로 Java의 모든 클래스는 기본적으로 `java.lang.Object`를 직접 또는 간접적으로 상속한다. 다만 `int`, `double`, `boolean` 같은 기본형은 객체가 아니다.

### 2. 클래스는 설계도다

클래스는 객체를 만들기 전에 객체의 구조와 기능을 정의한다. 클래스 선언만 했다고 객체가 바로 만들어지는 것은 아니다.

```java
public class Stock {
    String name;    // 필드
    double price;   // 필드

    void printInfo() {  // 메서드
        System.out.println(name + " : " + price);
    }
}
```

이 클래스는 다음을 정의한다.

- `name`, `price`: Stock 객체가 가질 상태
- `printInfo()`: Stock 객체가 수행할 동작

하지만 아직 `Stock` 객체가 만들어진 것은 아니다. 객체를 만들려면 `new`를 사용한다.

### 3. 객체와 인스턴스 만들기

```java
Stock scala = new Stock();
```

실행 흐름은 다음과 같다.

```text
Stock 클래스의 설계 정보 확인
          │
          ▼
Heap에 Stock 객체 생성
          │
          ▼
scala 변수에는 그 객체를 가리키는 참조값 저장
```

- `Stock`: 어떤 클래스의 객체를 만들지 나타내는 타입
- `scala`: 객체를 가리키는 참조형 변수
- `new Stock()`: Heap에 새로운 Stock 객체를 생성하는 표현
- `=`: 생성된 객체의 참조값을 `scala`에 대입

```java
Stock scala = new Stock();
Stock ai = new Stock();
```

`scala`와 `ai`는 서로 다른 Stock 객체를 가리킨다. 같은 클래스에서 만들어졌지만 객체는 각각 독립적으로 존재한다.

### 4. 필드(Field): 객체의 상태를 저장하는 변수

#### 정의

필드란 클래스 내부에 선언된 변수다. 필드는 객체의 상태나 클래스 전체가 공유하는 값을 저장한다.

```java
public class Stock {
    String name;
    double price;
}
```

여기서 `name`과 `price`가 필드다.

#### 인스턴스 필드

인스턴스 필드는 객체마다 독립적으로 존재하는 필드다.

```java
Stock scala = new Stock();
Stock ai = new Stock();

scala.name = "SKALA";
ai.name = "SKALA AI";
```

두 객체는 같은 `name` 필드를 가지고 있지만, 실제 값은 서로 다르게 저장된다.

```text
scala ──▶ Stock 객체 1: name = "SKALA"
ai    ──▶ Stock 객체 2: name = "SKALA AI"
```

#### 정적 필드(`static` field)

정적 필드는 특정 객체가 아니라 클래스에 소속된 필드다. 해당 클래스의 모든 객체가 하나의 값을 공유한다.

```java
public class Stock {
    static int count;
}
```

`count`는 Stock 객체마다 따로 생기는 값이 아니다. Stock 클래스에 하나만 존재하며 모든 Stock 객체가 함께 사용한다.

#### 상수(`constant`)

상수는 한 번 정해진 뒤 변경하지 않는 값이다. Java에서는 보통 `static final`로 선언한다.

```java
public class Stock {
    public static final String MARKET = "KOSPI";
}
```

- `static`: 클래스에 하나만 만든다.
- `final`: 값을 다시 대입할 수 없다.
- `static final`: 클래스 전체가 공유하며 변경할 수 없는 값이다.

단, `final` 필드라고 해서 항상 컴파일 시점의 상수인 것은 아니다. 생성자에서 한 번만 값을 대입하는 `final` 인스턴스 필드도 만들 수 있다.

### 5. 생성자(Constructor): 객체 초기화 담당

#### 정의

생성자는 `new`로 객체를 만들 때 자동으로 실행되는 특별한 코드 블록이다. 객체의 초기 상태를 설정하는 데 사용한다.

생성자의 규칙은 다음과 같다.

- 이름이 클래스 이름과 같아야 한다.
- 반환형을 작성하지 않는다. `void`도 작성하지 않는다.
- `new`를 사용해 객체를 만들 때 호출된다.

```java
public class Stock {
    String name;
    double price;

    public Stock(String name, double price) {
        this.name = name;
        this.price = price;
    }
}
```

```java
Stock stock = new Stock("SKALA", 17000);
```

위 코드는 다음 순서로 동작한다.

1. Heap에 Stock 객체를 만든다.
2. `Stock(String name, double price)` 생성자를 호출한다.
3. 전달받은 값을 객체의 `name`, `price` 필드에 저장한다.
4. 생성된 객체의 참조값을 `stock` 변수에 저장한다.

### 6. `this`: 현재 객체를 가리키는 참조

#### 정의

`this`는 현재 실행 중인 인스턴스 메서드나 생성자에서 **현재 객체 자신을 가리키는 참조**다. 흔히 “현재 객체의 주소”라고 설명하지만, Java에서는 주소 자체보다 객체를 가리키는 참조라고 표현하는 것이 정확하다.

```java
public class User {
    private String name;

    public User(String name) {
        this.name = name;
    }
}
```

여기서 왼쪽 `this.name`은 현재 객체의 필드이고, 오른쪽 `name`은 생성자의 매개변수다.

```text
this.name = name;
│           │
│           └─ 생성자에 전달된 매개변수
└─ 현재 객체의 필드
```

매개변수 이름을 다르게 쓰면 `this`가 없어도 된다.

```java
public User(String userName) {
    name = userName;
}
```

하지만 필드와 매개변수 이름이 같을 때는 `this`를 사용해야 둘을 구분할 수 있다.

### 7. `super`: 부모 클래스에 접근하는 키워드

#### 정의

`super`는 현재 클래스의 부모 클래스 부분을 가리키는 키워드다. 부모의 생성자를 호출하거나 부모의 필드와 메서드에 접근할 때 사용한다.

```java
class Product {
    protected String name;

    Product(String name) {
        this.name = name;
    }
}

class Stock extends Product {
    private double price;

    Stock(String name, double price) {
        super(name); // 부모 Product 생성자 호출
        this.price = price;
    }
}
```

- `extends`: 자식 클래스가 부모 클래스를 상속한다는 뜻
- `super(name)`: 부모 생성자 `Product(String name)` 호출
- 부모 생성자 호출은 자식 생성자의 첫 번째 문장에 작성한다.

### 8. 메서드(Method): 객체의 동작을 정의하는 코드

#### 정의

메서드는 클래스 내부에 선언된 코드 블록으로, 특정 작업을 수행한다. 입력을 받을 수도 있고, 결과를 반환할 수도 있다.

```java
[접근 제어자] [반환형] [메서드 이름](매개변수 목록) {
    // 실행할 코드
    return 반환값; // 반환형이 void가 아닐 때
}
```

#### 메서드 구성 요소

| 구성 요소 | 정확한 정의 | 예시 |
| --- | --- | --- |
| 접근 제어자 | 어디에서 호출할 수 있는지 결정하는 키워드 | `public`, `private` |
| 반환형 | 메서드가 호출한 곳에 돌려주는 값의 타입 | `int`, `String`, `void` |
| 메서드 이름 | 메서드의 동작을 나타내는 이름 | `getPrice()` |
| 매개변수(Parameter) | 메서드가 실행될 때 받을 입력을 저장하는 변수 | `double price` |
| 본문 | 실제 작업을 작성하는 중괄호 안의 코드 | `{ ... }` |
| `return` | 결과를 호출한 곳에 돌려주고 메서드를 종료하는 문장 | `return price;` |

#### `void`란?

`void`는 메서드가 호출한 곳에 **반환할 값이 없다는 뜻의 반환형**이다.

```java
public void printInfo() {
    System.out.println("주식 정보");
}
```

이 메서드는 화면에 출력하는 작업은 하지만 결과값을 돌려주지는 않는다.

```java
public double calculatePriceChange(double before, double after) {
    return after - before;
}
```

이 메서드는 `double` 값을 반환하므로 호출한 곳에서 결과를 받을 수 있다.

```java
double change = calculatePriceChange(100, 120); // change는 20.0
```

`void`는 `0`이나 `null`을 반환한다는 뜻이 아니다. 애초에 반환값이 없는 것이다.

#### 메서드 호출

```java
Stock stock = new Stock("SKALA", 17000);
stock.updatePrice(18000);
stock.printInfo();
```

`stock.updatePrice(...)`처럼 객체 뒤에 점(`.`)을 붙여 인스턴스 메서드를 호출한다.

### 9. 매개변수(Parameter)와 인자(Argument)

두 용어는 비슷하지만 위치가 다르다.

```java
public int add(int a, int b) { // a, b는 매개변수
    return a + b;
}

int result = add(10, 20);      // 10, 20은 인자
```

- 매개변수(`Parameter`): 메서드 선언부에서 입력을 받기 위해 선언한 변수
- 인자 또는 전달인자(`Argument`): 메서드를 호출할 때 실제로 전달하는 값

```text
메서드 선언: add(int a, int b)
                    ▲       ▲
                 매개변수  매개변수

메서드 호출: add(10, 20)
                 ▲   ▲
                인자 인자
```

### 10. 오버로딩(Overloading)

오버로딩은 같은 클래스 안에서 **같은 이름의 메서드를 매개변수 목록을 다르게 하여 여러 개 정의하는 것**이다.

```java
public class StockUtils {
    public void printStockPrice(String stockName, double price) {
        System.out.println(stockName + " : " + price);
    }

    public void printStockPrice(String stockName) {
        System.out.println("종목명: " + stockName);
    }
}
```

```java
StockUtils utils = new StockUtils();
utils.printStockPrice("SKALA", 17000); // 두 매개변수 메서드 호출
utils.printStockPrice("SKALA");        // 한 매개변수 메서드 호출
```

반환형만 다르게 해서는 오버로딩할 수 없다.

```java
// 매개변수 목록이 같으므로 오버로딩 불가
int getValue() { return 1; }
double getValue() { return 1.0; }
```

### 11. `static`: 클래스에 소속된 멤버

#### 정의

`static`은 필드나 메서드를 특정 객체가 아니라 **클래스에 소속시키는 키워드**다. 객체를 여러 개 만들어도 static 필드는 클래스에 하나만 존재하고 공유된다.

```java
public class Example {
    private static int count = 0;
    private int instanceId;

    public Example() {
        count++;
        instanceId = count;
    }

    public static int getCount() {
        return count;
    }

    public int getInstanceId() {
        return instanceId;
    }
}
```

```java
Example e1 = new Example();
Example e2 = new Example();
Example e3 = new Example();

System.out.println(Example.getCount());  // 3
System.out.println(e1.getInstanceId()); // 1
System.out.println(e2.getInstanceId()); // 2
System.out.println(e3.getInstanceId()); // 3
```

#### static과 인스턴스 멤버 비교

| 구분 | static 멤버 | 인스턴스 멤버 |
| --- | --- | --- |
| 소속 | 클래스 | 각각의 객체 |
| 생성 개수 | 클래스에 하나 | 객체마다 하나 |
| 호출 방법 | `Example.getCount()` | `e1.getInstanceId()` |
| 객체 생성 필요 | static 메서드는 보통 필요 없음 | 필요함 |
| 직접 접근 가능한 값 | static 멤버 | static, 인스턴스 멤버 |

static 메서드는 특정 객체가 없을 수 있으므로 인스턴스 필드에 직접 접근할 수 없다.

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

### 12. 전체 예제

```java
public class Stock {
    private final String name;
    private double price;
    private static int count;

    public Stock(String name, double price) {
        this.name = name;
        this.price = price;
        count++;
    }

    public void updatePrice(double newPrice) {
        this.price = newPrice;
    }

    public void printInfo() {
        System.out.println(name + " : " + price + "원");
    }

    public static int getCount() {
        return count;
    }
}
```

```java
public class Main {
    public static void main(String[] args) {
        Stock scalaEdu = new Stock("스칼라 에듀", 15000);
        Stock scalaAi = new Stock("스칼라 AI", 17500);

        scalaEdu.updatePrice(15800);
        scalaEdu.printInfo();
        System.out.println("생성된 Stock 객체 수: " + Stock.getCount());
    }
}
```

이 예제에서 확인할 수 있는 내용은 다음과 같다.

- `Stock`: 객체를 만들기 위한 클래스
- `scalaEdu`, `scalaAi`: Stock 객체를 가리키는 참조 변수
- `new Stock(...)`: Stock 인스턴스 생성
- `name`, `price`: 객체의 상태를 저장하는 필드
- `Stock(...)`: 객체를 초기화하는 생성자
- `updatePrice()`, `printInfo()`: 객체의 동작을 정의한 인스턴스 메서드
- `count`, `getCount()`: Stock 클래스 전체가 공유하는 static 멤버
- `this.name`, `this.price`: 현재 생성 중인 객체의 필드

### 13. 최종 정리

```text
클래스(Class)
  └─ 객체를 만들기 위한 설계도
       ├─ 필드(Field): 상태를 저장하는 변수
       ├─ 메서드(Method): 동작을 정의하는 코드
       └─ 생성자(Constructor): 객체 생성 시 초기화

new Stock(...)
  └─ Stock 클래스의 인스턴스인 객체 생성
       ├─ 인스턴스 필드: 객체마다 별도 보유
       ├─ static 필드: 클래스 전체가 공유
       └─ 참조 변수: 객체를 가리키는 참조값 보유
```

- 클래스는 설계도이고, 객체는 설계도로 만든 실행 중인 실체다.
- 인스턴스는 “특정 클래스에서 만들어진 객체”라는 관계를 나타낸다.
- 필드는 상태, 메서드는 동작, 생성자는 초기화를 담당한다.
- 매개변수는 메서드 선언부의 변수이고, 인자는 호출할 때 전달하는 실제 값이다.
- `void`는 반환값이 없다는 뜻이다.
- `this`는 현재 객체를 가리키고, `super`는 부모 클래스 부분에 접근한다.
- `static` 멤버는 객체가 아니라 클래스에 소속되어 공유된다.
