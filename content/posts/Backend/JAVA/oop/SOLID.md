---
layout: post
title: "SOLID"
description: "SOLID 원칙을 큰 그림에서 바라보면"
date: "2026-08-12 17:47:59 +0900"
categories: ["Backend", "JAVA", "oop"]
tags: []
legacyPath: "/backend/java/oop/2026/08/12/SOLID/"
---
# SOLID 

> 유지보수성, 확장성, 재사용성을 높이고 결합도 (Coupling)울 낮추기 위한 OOP의 5대 설계원칙. 
> Clean Architecture (지속가능한 튼튼한 소프트웨어 구조)를 구성하기 위한 핵심적인 기초 원리 

SOLID 원칙을 큰 그림에서 바라보면 
- 객체 간의 결합도를 낮추고, 객체 내 응집도를 높이는 원칙
- 인터페이스와 추상화를 적극적으로 수용 (What(사용)과 How(구현)를 분리) 
- 변경이 필요할 때 기존 코드 수정 없이 확장이 설계하도록 설계 (상속/확장)
- 고드 유지보수성과 테스트 용이성을 향상 

- Clean Architecture는 관심사 분리(separation of Concerns)를 기반으로 애플리케이션을 계층 별로 나누고
각 계층이 자신의 역할에만 집중하도록 설계하는 아키텍처.
비즈니스 규칙 과 기술 세부적 공통 사항을 분리

개념을 잘 익히고 개념을 AI에 잘 집어넣자. 

# SOLID 원칙 

- 객체지향에서 시작되었지만, 객체뿐만 아니라 마이크로서비스와 API Level에 SOLID 원칙을 고려
- 이를 통해 유지보수성을 개선할 수 있다. 

- S : Single Responsibility Principle
    - 한 클래스는 하나의 책임만 가져야 한다. 구현자 관점
        - 한 클래스가 변경되어야 할 이유는 오직 하나여야 함
        - 한 클래스가 여러 기능을 담당하면, 한 기능의 변경이 다른 기능에 부정적인 영향을 줄 수 있음
        - 적용 예시 : Spring Boot Controller, Service, Respositoty 
- O : Open/Closed Priciple
    행위의 본질을 '추상화(인터페이스, 규격)'하고 구체적인 세부 기능은 '플러그인' 형태로 갈아 끼울 수 있게 만드는 것
    - 기존 코드는 변경하지 않고(공통 흐름), 새로운 기능 (세부 구현)을 추가할 수 있어야 한다.
    - 인터페이스, 추상 클래스, 다형성을 활용한 구현
- L : Liskov Substitution Principle
    자식 클래스는 언제나 부모 클래스의 역할을 대체해야 한다 
    - 자식 클래스는 부모 클래스가 정의한 계약을 위반하지 말아야 한다 
    - 부모 클래스의 행동(method)을 호출하는 코드에서 자식 클래스로 대체하더라도 정상적으로 동작 
- I : Interface Segregation Principle
    - 클라이언트는 자신이 사용하지 않는 메서드에 의존하지 말아야 한다 사용자/소비자 관점
        - 하나의 범용적인 인터페이스보다는 여러 개의 구체적인 인터페이스를 만들어야 함
        - 한개의 인터페이스에 너무 많은 기능을 담고 있으면 이를 구현한 클래스는 불필요한 메서드를 강제로 구현
- D : Dependency Inversion Principle
    고수준 모듈은 저수준 모듈에 의존하면, 둘 다 추상화에 의존해야 한다. 
    추상화는 구체적인 것에 의존해서는 안되고, 구체적인 것이 추상화에 의존해야 한다. 
    - 고수준 모듈 : 비즈니스 정책, 흐름 (Process, Service) 
    - 저수준 모듈 : 세부 구현, 기술, 라이브러리 
    - 추상화 : interface, abstract class
