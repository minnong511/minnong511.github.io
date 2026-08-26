---
layout: post
title: "Spring 컨테이너"
description: "IoC Container는 내부적으로 Map과 유사한 Collection을 가지고 있으며 여기에 Bean 을 등록하고 Bean 호출 시 생성이 아닌 기존 Bean 을 Input Argument로 전달"
date: "2026-08-14 10:19:08 +0900"
categories: ["Backend", "SPRING", "Spring_Container"]
tags: []
legacyPath: "/backend/spring/spring_container/2026/08/14/container/"
---
# Spring 컨테이너 

- 자바 객체의 (Bean)의 생성부토 소멸까지의 생명 주기를 관리하고, 객체 간 의존 관계를 생성 

## 핵심 역할

- 객체 관리:
    - 개발자가 new 연산자로 객체를 직접 생성하지 않고, 컨테이너가 객체를 대신 생성/소멸
- 의존성 주입 DI:
    - 객체 A가 객체 B를 필요로 할때, 컨테이너가 런타임에 B를 A에게 주입하여 조립
- 싱글톤 관리:
    - 객체를 기본적으로 단 하나만 생성 Singleton Pattern하여 재사용

| 구분 | `BeanFactory` | `ApplicationContext` |
|---|---|---|
| 설명 | 가장 기본적인 스프링 IoC 컨테이너 | `BeanFactory`를 확장한 컨테이너 |
| 주요 기능 | Bean 생성, 조회, 관리 | `BeanFactory`의 모든 기능과 부가 기능 지원 |
| Bean 로딩 방식 | 지연 로딩(Lazy Loading), Bean을 요청할 때 생성 | 즉시 로딩(Eager Loading), 기본적으로 시작 시 Bean 생성 |
| Bean 저장 | Bean 정의 정보(`BeanDefinition`)를 기반으로 Bean 관리 | `BeanDefinition`을 기반으로 Bean 생성, 등록, 관리 |
| 컴포넌트 스캔 | 직접 Bean을 등록하는 방식 중심 | `@ComponentScan` 대상으로 찾은 클래스를 Bean으로 생성, 등록 |
| 상속 관계 | 기본 인터페이스 | `BeanFactory`를 상속 |
| 부가 기능 | 미지원 또는 제한적 | 국제화, 이벤트 발행, AOP, 프록시 패턴, 메시지 자원, 환경 설정 등 지원 |
| 사용 예 | Spring 2.x 이전에 주로 사용 | Spring 2.x 이후 현재까지 일반적으로 사용 |

# Bean 

### Bean 
    - 스프링이 관리하는 객체(인스턴스)를 의미 
    - IoC Container가 Bean을 생성하고, 생명주기를 관리 
    - @Componet, @Controller, @Service등의 annotation을 통해 실행 시점에 Bean 자동 생성

- **Bean의 특징**
    - Singleton 방식으로 관리(기본) 
    - 객체 생성, 의존성 주입, 소멸 등 생명주기를 컨테이너가 책임진다. 

IoC Container는 내부적으로 Map과 유사한 Collection을 가지고 있으며
여기에 Bean 을 등록하고 Bean 호출 시
생성이 아닌 기존 Bean 을 Input Argument로 전달



# 참고 / Bean 생성 클래스 정의 Annotation 

| 어노테이션 | 용도 / 설명 |
|---|---|
| `@Component` | 스프링이 클래스를 자동으로 Bean으로 등록합니다. |
| `@Service` | 비즈니스 로직을 처리하는 Service 클래스에 사용합니다. |
| `@Repository` | 데이터 접근 계층(DAO, Repository)에 사용하며, 데이터베이스 관련 예외를 스프링 예외로 변환해 줍니다. |
| `@Controller` | MVC 패턴의 Controller에 사용하며, 웹 요청을 처리하고 주로 화면(View)을 반환합니다. |
| `@RestController` | REST API Controller에 사용하며, 주로 JSON 데이터를 반환합니다. `@Controller`와 `@ResponseBody`를 합친 형태입니다. |
| `@Autowired` | 필요한 객체(의존성)를 스프링이 자동으로 주입합니다. DI에 사용합니다. |
| `@Bean` | 메서드가 반환하는 객체를 직접 Bean으로 등록합니다. 주로 `@Configuration` 클래스 안의 메서드에 붙입니다. |
