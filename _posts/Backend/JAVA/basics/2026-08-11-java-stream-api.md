---
layout: post
title: "Java 기초 Part 5: Stream API"
description: "Java Stream API의 파이프라인, 중간 연산과 최종 연산을 filter, map, sorted 예제로 정리한다."
date: 2026-08-11 10:20:00 +0900
categories: [java, basics]
tags: [Java, Stream API, Collection, Lambda, Filter, Map]
series: "Java 기초"
part: 5
---

# Java 기초 Part 5: Stream API

## 1. 먼저 알아둘 단어

| 단어 | 정의 | 예시 |
| --- | --- | --- |
| Stream | 컬렉션의 원본 데이터를 바꾸지 않고 요소를 순서대로 처리하는 흐름 | `numbers.stream()` |
| 파이프라인(Pipeline) | 여러 연산을 연결한 데이터 처리 과정 | `stream().filter().map().toList()` |
| 중간 연산 | Stream을 받아 새로운 Stream을 반환하는 연산 | `filter()`, `map()`, `sorted()` |
| 최종 연산 | Stream 처리를 실행하고 결과를 만드는 연산 | `toList()`, `forEach()` |
| 람다식(Lambda) | 짧게 표현한 익명 함수 | `n -> n * 2` |
| 메서드 참조 | 이미 존재하는 메서드를 간결하게 전달하는 문법 | `System.out::println` |

> Stream API는 리스트 같은 데이터 묶음을 하나씩 꺼내서 조건을 걸고, 바꾸고, 다시 모으는 데이터 처리 기능이다.

Java 8에서 도입됐으며, 반복문이나 `Iterator`로 작성하던 코드를 선언적이고 함수형인 스타일로 표현할 수 있게 해준다.

## 2. Stream API의 핵심

Stream API의 핵심은 데이터 처리 과정을 위에서 아래로 읽을 수 있다는 점이다.

```java
List<String> names = users.stream()
        .filter(user -> user.getAge() >= 20)
        .map(User::getName)
        .sorted()
        .toList();
```

위 코드는 다음 순서로 읽을 수 있다.

```text
users를 Stream으로 만든다
    ↓
20세 이상인 사용자만 남긴다
    ↓
User 객체를 이름으로 바꾼다
    ↓
이름을 정렬한다
    ↓
List로 모은다
```

## 3. 반복문과 Stream 비교

예를 들어 숫자 리스트에서 짝수만 뽑는다고 하자.

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);
```

반복문을 사용하면 결과 리스트를 직접 만들고 값을 추가해야 한다.

```java
List<Integer> result = new ArrayList<>();

for (int number : numbers) {
    if (number % 2 == 0) {
        result.add(number);
    }
}
```

Stream을 사용하면 데이터 처리 과정에 집중해서 작성할 수 있다.

```java
List<Integer> result = numbers.stream()
        .filter(number -> number % 2 == 0)
        .toList();
```

다음과 같이 읽으면 된다.

```text
numbers를 Stream으로 만든다
    ↓
짝수만 남긴다
    ↓
List로 모은다
```

## 4. 자주 사용하는 메서드

| 메서드 | 구분 | 역할 |
| --- | --- | --- |
| `stream()` | Stream 생성 | 컬렉션에서 데이터 처리 흐름을 시작한다. |
| `filter()` | 중간 연산 | 조건에 맞는 요소만 남긴다. |
| `map()` | 중간 연산 | 요소를 다른 값이나 형태로 바꾼다. |
| `sorted()` | 중간 연산 | 요소를 정렬한다. |
| `distinct()` | 중간 연산 | 중복 요소를 제거한다. |
| `toList()` | 최종 연산 | 처리 결과를 `List`로 모은다. |
| `forEach()` | 최종 연산 | 각 요소에 지정한 동작을 실행한다. |

## 5. `filter()`: 조건에 맞는 값만 남기기

```java
List<String> names = List.of("민형", "철수", "영희", "김민형");

names.stream()
        .filter(name -> name.length() > 2)
        .forEach(System.out::println);
```

결과는 다음과 같다.

```text
김민형
```

`filter()`는 조건을 만족하는 요소만 통과시킨다. 요소의 값 자체를 다른 값으로 바꾸지는 않는다.

## 6. `map()`: 값을 다른 형태로 바꾸기

```java
List<Integer> numbers = List.of(1, 2, 3);

List<Integer> result = numbers.stream()
        .map(number -> number * 2)
        .toList();
```

```text
결과: [2, 4, 6]
```

`map()`은 각 요소를 전달받아 새로운 값으로 바꾼다.

## 7. `filter()`와 `map()` 함께 사용하기

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);

List<Integer> result = numbers.stream()
        .filter(number -> number > 2)
        .map(number -> number * 10)
        .toList();
```

처리 흐름은 다음과 같다.

```text
[1, 2, 3, 4, 5]
    ↓ filter(number -> number > 2)
[3, 4, 5]
    ↓ map(number -> number * 10)
[30, 40, 50]
```

기억할 내용은 간단하다.

```text
filter → 골라낸다
map    → 바꾼다
```

## 8. 중간 연산과 최종 연산

`filter()`, `map()`, `sorted()` 같은 중간 연산만 작성하면 실제 데이터 처리가 시작되지 않는다. `toList()`나 `forEach()` 같은 최종 연산이 호출되어야 전체 파이프라인이 실행된다.

```java
numbers.stream()
        .filter(number -> {
            System.out.println("확인: " + number);
            return number % 2 == 0;
        });
```

위 코드는 최종 연산이 없기 때문에 `filter()` 내부의 출력도 실행되지 않는다.

```java
List<Integer> result = numbers.stream()
        .filter(number -> number % 2 == 0)
        .toList();
```

이처럼 필요한 시점까지 실행을 미루는 방식을 지연 연산(Lazy Evaluation)이라고 한다.

## 9. 사용할 때 주의할 점

### 원본 컬렉션은 바뀌지 않는다

```java
List<Integer> numbers = List.of(1, 2, 3);

List<Integer> result = numbers.stream()
        .map(number -> number * 10)
        .toList();
```

```text
numbers → [1, 2, 3]
result  → [10, 20, 30]
```

Stream은 원본 컬렉션을 직접 변경하는 기능이 아니다. 처리 결과가 필요하면 새로운 리스트 등으로 받아야 한다.

### Stream은 한 번만 사용할 수 있다

```java
Stream<Integer> stream = numbers.stream();

stream.toList();
stream.toList(); // IllegalStateException
```

최종 연산이 끝난 Stream은 다시 사용할 수 없다. 다시 처리하려면 `numbers.stream()`으로 새로운 Stream을 만들어야 한다.

## 10. 최종 정리

| 구분 | 핵심 내용 |
| --- | --- |
| Stream | 데이터 자체가 아니라 데이터 처리 흐름이다. |
| `filter()` | 조건에 맞는 요소만 남긴다. |
| `map()` | 요소를 다른 값이나 형태로 바꾼다. |
| 중간 연산 | Stream을 반환하며, 최종 연산 전까지 실행을 미룬다. |
| 최종 연산 | 파이프라인을 실행하고 결과를 만든다. |
| 원본 데이터 | Stream으로 처리해도 원본 컬렉션은 그대로 유지된다. |

> Stream API는 데이터를 어떻게 반복할지보다 어떤 조건으로 골라내고, 어떻게 바꾸고, 어떤 결과로 모을지에 집중하게 해주는 기능이다.

