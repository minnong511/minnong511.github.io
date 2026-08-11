---
layout: post
title: "Java 기초 Part 4: 제네릭"
description: "Java 제네릭으로 컬렉션이 다룰 데이터 타입을 지정하는 방법을 ArrayList 예제로 정리한다."
date: 2026-08-11 10:00:00 +0900
categories: [java, basics]
tags: [Java, Generic, ArrayList, Collection, Type Safety]
series: "Java 기초"
part: 4
---

# Java 기초 Part 4: 제네릭

## 1. 먼저 알아둘 단어

| 단어 | 정의 | 예시 |
| --- | --- | --- |
| 제네릭(Generic) | 클래스나 메서드가 사용할 데이터 타입을 외부에서 지정할 수 있게 하는 기능 | `Box<T>` |
| 타입 매개변수(Type Parameter) | 아직 정해지지 않은 타입을 나타내는 이름 | `T` |
| 타입 인자(Type Argument) | 제네릭을 사용할 때 실제로 지정하는 타입 | `Box<String>`의 `String` |
| 타입 안정성(Type Safety) | 잘못된 타입의 값을 컴파일 단계에서 막는 성질 | `List<String>`에는 문자열만 저장 |
| Raw Type | 타입 인자를 생략한 제네릭 타입 | `ArrayList list` |
| Wrapper Class | 기본형을 객체처럼 다루기 위한 참조 타입 | `int`의 `Integer` |

> 제네릭은 클래스나 메서드가 다룰 데이터 타입을 나중에 지정할 수 있게 해주는 기능이다.

## 2. 제네릭의 기본 사용법

`ArrayList<String>`은 이 리스트에 `String` 타입만 저장하겠다는 뜻이다.

```java
ArrayList<String> history = new ArrayList<>();

history.add("10 + 20 = 30"); // 가능
history.add(100);            // 컴파일 오류
```

여기서 `String`은 타입 인자다. `history.add(100)`은 `String` 전용 리스트에 `Integer`를 넣으려고 했기 때문에 컴파일 오류가 발생한다.

## 3. 제네릭이 없던 방식

타입 인자를 지정하지 않은 `ArrayList`를 Raw Type이라고 한다.

```java
ArrayList list = new ArrayList();

list.add("민형");
list.add(100);
list.add(true);
```

Raw Type에는 여러 타입의 값을 넣을 수 있지만, 값을 꺼낼 때 문제가 생긴다.

```java
Object value = list.get(0);
String name = (String) list.get(0);
```

컴파일러는 꺼낸 값이 `String`인지 `Integer`인지 확신할 수 없으므로 직접 형변환해야 한다.

```java
String name = (String) list.get(1);
```

하지만 인덱스 `1`에는 정수 `100`이 들어 있으므로 실행 중에 `ClassCastException`이 발생할 수 있다.

이러한 문제를 방지하기 위해 제네릭을 사용한다.

## 4. 제네릭의 장점

### 타입 안정성

```java
ArrayList<String> list = new ArrayList<>();

list.add("민형"); // 가능
list.add(100);    // 컴파일 오류
```

컴파일러는 처음부터 이 리스트가 `String`만 저장하는 곳이라는 사실을 알고 있다. 따라서 잘못된 타입을 실행 전에 차단한다. 이것이 타입 안정성이다.

### 형변환 불필요 

제네릭이 없다면 값을 꺼낸 뒤 직접 형변환해야 한다.

```java
Object value = list.get(0); 
String name = (String) value; 
```

제네릭을 사용하면 꺼낸 값의 타입을 컴파일러가 알고 있다.

```java
ArrayList<String> list = new ArrayList<>(); 
String name = list.get(0);
```

따라서 바로 `String` 변수로 받을 수 있다.

### 여러 타입에 재사용

다음 `Box` 클래스는 `String`만 저장할 수 있다.

```java
class Box {
    private String value; 

    public void setValue(String value) {
        this.value = value; 
    }

    public String getValue() {
        return value; 
    }
}
```

제네릭을 사용하면 저장할 타입을 나중에 정할 수 있다.

```java
class Box<T> {
    private T value;

    public void setValue(T value) {
        this.value = value; 
    }

    public T getValue() {
        return value; 
    }
}
```

여기서 `T`는 타입 매개변수이며, 실제 타입은 `Box` 객체를 사용할 때 결정한다.

```java
Box<String> stringBox = new Box<>();
Box<Integer> numberBox = new Box<>();

stringBox.setValue("민형");
numberBox.setValue(100);

String name = stringBox.getValue();
Integer number = numberBox.getValue();
```

같은 `Box<T>` 코드를 `String`과 `Integer` 타입에 모두 재사용할 수 있다.

## 5. Iterator와 제네릭

```java
Iterator<String> iterator = history.iterator();
String record = iterator.next();
```

`Iterator<String>`은 순회하면서 꺼내는 데이터가 `String`이라는 뜻이다. 따라서 `iterator.next()`의 반환값도 바로 `String`으로 받을 수 있다.

## 6. 자주 사용하는 제네릭 타입

- `List<String>`
- `ArrayList<Integer>`
- `Iterator<String>`
- `Map<String, Integer>`
- `Optional<User>`

`Map<String, Integer>`는 키가 `String`, 값이 `Integer`라는 뜻이다.

```java
Map<String, Integer> scores;
```

```text
Key   → String
Value → Integer
```

## 7. 왜 기본형 대신 Wrapper Class를 사용할까?

제네릭의 타입 인자에는 기본형을 직접 사용할 수 없다.

```java
// 허용되지 않음
ArrayList<int> numbers; 
```

제네릭은 참조 타입을 대상으로 하기 때문에 Wrapper Class를 사용해야 한다.

```java
// 허용됨
ArrayList<Integer> numbers; 
```

```text
int     → Integer
double  → Double
boolean → Boolean
char    → Character
```

## 8. 결론

1. 타입 안정성

   잘못된 타입을 컴파일 단계에서 차단한다.

2. 형변환 감소

   값을 꺼낼 때 불필요한 타입 캐스팅을 줄인다.

3. 코드 재사용

   하나의 클래스나 메서드를 여러 타입에 활용할 수 있다.

> 제네릭은 클래스나 메서드가 사용할 데이터 타입을 외부에서 지정할 수 있게 한다. 이를 통해 타입 안정성을 확보하고, 불필요한 형변환을 줄이며, 같은 코드를 여러 타입에서 재사용할 수 있다.

`ArrayList<String>`을 사용할 때 이미 제네릭을 사용하고 있었던 것이다.
