---
layout: post
title: "1. Singleton Pattern"
description: "Creational Pattern"
date: "2026-08-12 17:47:59 +0900"
categories: ["Backend", "JAVA", "oop"]
tags: []
legacyPath: "/backend/java/oop/2026/08/12/Creational-Pattern/"
---
Creational Pattern

> 객체를 new로 생성하는 과정을 어떻게 더 유연하고 안전하게 관리할 것이가 다루는 디자인 패턴
"이 객체를 누가, 언제, 어떤 방식으로 생성할 것인가?"

| 패턴명 | 주요 목적, 역할 | 대표 예시 클래스 |
| --- | --- | --- |
| Singleton | 단 하나의 인스턴스만 생성, 공유<br>전역에서 하나의 객체만 필요할 때 | Runtime, Logger 등 |
| Factory Method | 객체 생성을 하위 클래스에서 담당<br>상위 클래스는 인터페이스만 제공, 하위 클래스가 생성 결정 | Calendar.getInstance 등 |
| Abstract Factory | 관련 객체 집합을 생성<br>객체 계열을 통일된 방식으로 생성 | GUI Toolkit, DAO Factory 등 |
| Builder | 복잡한 객체의 생성 과정 분리<br>객체의 생성 절차를 단계별로 분리 및 체이닝 지원 | StringBuilder, Lombok Builder |

쉽게 말하자면 

| 패턴 | 핵심 질문 | 핵심 개념 |
|---|---|---|
| Singleton | 객체를 몇 개 만들까? | **하나만 생성** |
| Factory Method | 객체 생성을 누가 결정할까? | **생성 책임 위임** |
| Abstract Factory | 관련 객체들을 어떻게 같이 만들까? | **제품군 생성** |
| Builder | 복잡한 객체를 어떻게 편하게 만들까? | **단계적 생성** |

# 1. Singleton Pattern 

핵심  
> 프로그램 전체에서 객체를 딱 하나만 만들어 공유하는 패턴 

# 2. Factory Method Pattern
# 3. Abstract Factory Pattern
# 4. Builder Pattern










# 결론 

> 객체 생성 로직과 객체 사용 로직을, 적절하게 분리하는 것이 목적 

Singleton
→ 하나만 만들어

Factory Method
→ 네가 대신 만들어

Abstract Factory
→ 관련된 것들을 세트로 만들어

Builder
→ 하나씩 설정하면서 만들어
