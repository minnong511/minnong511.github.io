---
layout: post
title: "Java 심화 Part 3: 함수형 프로그래밍과 Lambda"
description: "Java의 함수형 프로그래밍, 순수 함수, 익명 클래스, 람다식과 함수형 인터페이스를 정리한다."
date: 2026-08-11 11:40:00 +0900
categories: [java, advanced]
tags: [Java, Functional Programming, Lambda, Anonymous Class, Stream, Pure Function]
series: "Java 심화"
part: 3
---

## Java 심화 Part 3: 함수형 프로그래밍과 Lambda

- Java의 함수형 프로그래밍(Functional Programming)은 함수를 일급 객체(First-Class Citizen)로 취급, 불변성(immunability)과 순수 함수(Pure function)를 기반으로 프로그램을 작성하는 방식

#### First-Class Citizen 
- 함수를 변수에 저장, 전달, 반환할 수 있음
- 함수 자체를 데이터처럼 다루는 방식

#### Pure Function 
- 같은 입력 -> 같은 출력 
- 외부 상태를 변경하지 않음 (Side Effect 없음)

#### Immmunability 
- 함수 내부에서 외부 변수를 변경하지 않는 구조 
- 병렬 처리에서 안정성과 예측 가능성이 높아진다. 

#### Declarative Style 
- 어떻게가 아니라 무엇을 할지에 집중
- 시스템이 실행 흐름을 알아서 처리
- Stream, Optional 등이 대표적인 예 

### 일급 함수 
> 함수를 값처럼 취급할 수 있는 언어 특성 

1. 함수를 변수에 할당 

def say_hello():
print("Hello")
## 함수를 변수에 할당
    say_hello_var = say_hello
## 변수를 통해 함수 실행
say_hello_var()

2. 함수를 인자로 전달 

def execute(fn):
    fn()

execute(lambda : print("Executed"))

3. 함수를 반환(return) 

def make_adder(x); 
    def adder(y):
        return x + y 
    return adder 

add5 = make_adder(5)
print(add(3)) 

4. 객체의 속성properties 로 사용

##### 딕셔너리의 key-value 쌍으로 함수를 정의
calculator = {
"add": lambda a, b: a + b
}

##### 딕셔너리의 Key로 함수에 접근하여 실행
print(calculator["add"](2, 3)) # 출력: 5

### 순수 함수 Pure Function Lambda Expression
동일한 입력에는 항상 동일한 출력을 반환, 함수 외부 변수의 샅애를 변경하지 않는 함수 

- 비순수 함수 

- 외부 상태 (Global 변수)
count = 0
def increase_and_get():
global count
count += 1 # 외부 상태를 변경 (Side Effect)
return count

검증 및 특징 확인
print(increase_and_get()) # 출력: 1
print(increase_and_get()) # 출력: 2 (다른 출력

순수 함수

ef square(x):
return x * x # 같은 입력, 같은 출력
print(square(4)) # 출력: 16
print(square(4)) # 출력: 16

순수 함수 특징

예측 가능성 같은 입력 같은 출력, 디버깅이 쉬움
테스트 용이 외부 의존 없이 독립적으로 테스트 가능
병렬 처리 안전 외부 상태를 건드리지 않으니 race condition 없음
캐싱 가능 결과를 재활용 Memoization 가능
리팩토링 안정성 의존성 적어서 코드 변경 영향 최소화

익명 클래스 Anonymous Class

- 클래스 기반 언어인 Java 환경에서 함수형 프로그램을 지원하기 위한 방식

### 익명 클래스(Anonymus Class)란? 
- 이름이 없는 클래스 
- 한번만 사용할 목적으로 정의 
- 클래스를 선언하면서 동시에 인스터스 생성

문제점
- 너무 장황함
- 가독성 감소
- 함수 전달을 위한 최소 표현이 아님

#### 람다 표현식 Lamda Expression
- 익명 클래스를 간결하게 표현하기 위한 문법, 함수형 인터페이스를 인스턴스로 생성하는 가장 짧은 방식

배경
- Java 82014 이전: Java는 순수 객체지향 언어로, 메서드도 반드시 클래스의 일부여야 함.
- Java 8: 람다, Stream API, java.util.function 패키지 도입
코드를 값처럼 전달 가능
선언적, 함수형 스타일 코딩 가능
- 간결성, 병렬 처리 용이성, 컬렉션 처리의 함수형 스타일 지원

목적 설명 예시
코드 간결화 익명 클래스 작성의 반복 코드 제거 list.forEachitem System.out.printlnitem;
함수형 프로그래밍 지원 함수를 값처럼 전달 stream.filterx x 10
병렬/선언형 처리 Stream API와 결합하여 병렬 연산 지원 list.parallelStream.map....reduce...

public class Main{
    public static void main(String[] args){
        Runnable lambdaRunnable = () -> System.out.println("별도 스레드에서 실행");

        Thread thread2 = new Thread(lambdaRunnable); 
        thread2.start(); 
    }
}

익명 함수를 간결하게 표현하기 위한 문법, 함수형 인터페이스를 인스턴스로 생성하는 가장 짧은 방식

Lambda 

Runnable r = () -> System.out.println("Hello");

항목 9
익명 클래스 람다식
목적 객체 클래스 생성 함수 전달 행위 전달
코드 길이 길고 반복적 매우 간결
의미 객체지향적 해결 함수형 프로그래밍 해결
실행 구조 내부적으로 클래스 생성 함수형 인터페이스 구현체 생성
사용성 가독성 낮음 가독성, 유지보수 높음
