---
layout: post
title: "Java 객체지향 Part 5: static 메서드와 중첩 클래스"
description: "Java static 메서드, 일반 내부 클래스, static 중첩 클래스의 차이와 사용 기준을 정리한다."
date: 2026-08-11 11:20:00 +0900
categories: [java, oop]
tags: [Java, Static, Nested Class, Inner Class, Method, Polymorphism]
series: "Java 객체지향"
part: 5
legacyPath: "/java/oop/2026/08/11/java-static-nested-class/"
---
## Java 객체지향 Part 5: static 메서드와 중첩 클래스

중첩 클래스에서 Static을 붙이는 이유는 바깥 객체와 연결되지 않은 클래스를 내부에 묶어두기 위해서이다. 

### 일반 내부 클래스 

tatic이 없는 내부 클래스는 바깥 객체에 소속 

class User {
    String name = "민형"; 

    class Profile {
        void printName() {
            System.out.println(name); 
        }
    }
}

따라서 Profile 객체를 만들려면 먼저 User 객체가 필요하다.

User user = new User(); 
User.profile profile = user.new Profile(); 

구조를 개념적으로 보면 다음과 같다. 

User 객체
    └── Profile 객체
            └── 바깥 User 객체를 참조

profile이 특정 User의 name을 사용하므로 바깥 객체와 연결되는 것이 자연스럽다

### Static 중첩 클래스

static 중첩 클래스는 바깥 객체와 연결되지 않는다. 

class User {
    static class Profile{
        void printMessage(){
            System.out.println("프로필입니다.")
        }
    }
}

User.Profile profile = new User.Profile();

profile.printMessage();

여기서 User.Profile 이라고 쓰지만, 특정 User 객체에 소속된 것은 아니다. 
단지 User와 관련된 클래스라서 User 내부에 정리한 것 

## 왜 Static을 사용하는가? 

### 1. 바깥 객체가 필요없기 때문에 

다음 Address는 특정 User 객체의 필드에 직접 접근할 필요가 없다. 

class User{
    static class Address{
        String city; 

        Address(String city){
            this.city = city; 
        }
    }
}

Address에 접근하고 싶다면 

User.Address address = new User.Address("판교")

바깥 객체가 필요 없는데 일반 내부 클래스로 만들면 불필요하게 User 객체와 연결된다. 

### 2. 관련 클래스를 한 곳에 묶을 수 있기 때문에 

class HttpResponse{
    static class Header{

    }
    static class Body{

    }
}

Header 와 Body가 HttpsResponse와 관련있다는 것을 구조적으로 표현할 수 있다.

HttpResponse.Header header  = new HttpResponse.Header(); 
HttpResponse.Body body = new HttpResponse.Body();

## 3. 불필요한 바깥 객체 참조를 막기 때문에 

일반 내부 클래스 객체는 내부적으로 바깥 객체를 참조 

내부 클래스 객체 ──참조──→ 바깥 클래스 객체

하지만 static 중첩 클래스에은 그 참조가 없다. 

static 중첩 클래스 객체     바깥 클래스 객체

          서로 독립적

바깥 객체가 필요하지 않다면 static 중첩 클래스를 사용해야 구조가 단순하고 
불필요한 객체 참조도 생기지 않는다. 

#### 개념 확인 문제 

Receipt 클래스는 특정 Order 객체의 orderNumber를 직접 사용해야 한다. 

Receipt는 특정 Order 객체의 orderNumber를 사용해야 하므로 일반 내부 클래스로 선언해야 한다. 일반 내부 클래스는 자신을 생성한 바깥 Order 객체를 참조할 수 있기 때문에 

## Static 메서드

판단 기준

> 클래스의 필드를 사용하느냐? 
> 더 자세하게는, 이 기능이 특정 객체의 행동인가, 아니면 객체와 상관없는 공통 기능인가?


특정 객체의 데이터가 필요하지 않을 때 사용한다. 

판단할 떄 이렇게 생각하면 된다. 

> 이 기능을 실행하려면 특정 객체가 꼭 필요한가?

필요하면 일반 인스턴스 메서드 

class User{
    string name; 

    void printName() {}
        System.out.println(name); 
}

printName()은 특정 User 객체의 name이 필요하다. 

User user = new User(); 
user.name = "민형"; 
user.printName(); 

---

반대로 특정 객체의 데이터가 필요하지 않으면 static 메서드를 사용할 수 있다.

class Calculator {
    static int add(int a, int b,){
        return a + b; 
    }
} 

add()는 어떤 calculator 객체의 상태도 사용하지 않으므로...

int result = Calculator.add(10,20); 

정리하면 

특정 객체의 필드가 필요한가?
    ├── 필요함 → 일반 인스턴스 메서드
    └── 필요 없음 → static 메서드 고려

예를 들어 Order에서 특정 주문 번호를 출력하다면 일반 메서드가 자연스러움 

class Order{
    String orderNumber;

    void printOrderNumber() {
        System.out.println(orderNumber); 
    }
}

하지만 주문 번호의 형식만 검사한다면 특정 Order 객체가 없어도 된다. 

class Order {
    static boolean isValidOrderNumber(String orderNumber) {
        return orderNumber.startsWith("ORDER-");
    }
}

boolean valid = Order.isValidOrderNumber("ORDER-100");

#### 근데 그냥 필드 선언 안하고 쓰면 되는 거 아닌가?

class Calculator {
    int add(int a, int b) {
        return a + b;
    }
}

class Calculator {
    static int add(int a, int b) {
        return a + b;
    }
} 

두 메서드는 모두 전달받은 값만 계산 -> 차이는 호출 방식 

// 일반 메서드 
Calculator calculator = new Calculator(); 
calculator.add(10,20): 

// static 메서드 
Calculator.add(10, 20);

일반 메서드는 필드를 사용하지 않더라도 객체를 먼저 만들어야 합니다. 반면 static 메서드는 객체 없이 실행할 수 있다.
-> 이거는 객체를 만들지 않아서 상당히 편리하다! 

#### 그러면 Static method는 언제 안써야 하는가? 

나중에 구현을 객체마다 다르게 바꿔야 한다면 일반 베서드로 구현해야 한다.

class Calculator {
    int calculate(int a, int b) {
        return a + b;
    }
}

class MultiplyCalculator extends Calculator {
    @Override
    int calculate(int a, int b) {
        return a * b;
    }
}

여기서는 객체에 따라 calculate() 동작이 달라진다.

Calculator calculator1 = new Calculator();
Calculator calculator2 = new MultiplyCalculator();

calculator1.calculate(10, 20); // 30
calculator2.calculate(10, 20); // 200

반대로 동작이 항상 같고, 특정 객체의 상태도 필요하지 않다면 static이 자연스럽다

class CalculatorUtils {
    static int add(int a, int b) {
        return a + b;
    }
}

정리하면 

필드가 필요하다 -> 일반 메소드 
필드가 필요 없지만 객체마다 동작이 달라질 수 있다 -> 일반 메서드 
필드가 필요 업고 동작도 항상 같다 -> static 메서드가 자연스럽다.
