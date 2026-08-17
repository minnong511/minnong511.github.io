---
layout: post
title: "Java 기초 Part 2: 주석과 Javadoc"
description: "Java의 한 줄 주석, 블록 주석, Javadoc 문법과 TODO, FIXME 사용법을 정리한다."
date: 2026-08-10 09:20:00 +0900
categories: [java, basics]
tags: [Java, Comment, Javadoc, TODO, FIXME]
series: "Java 기초"
part: 2
---

## Java 기초 Part 2: 주석과 Javadoc

### Java의 주석

| 구분 | 사용 문법 | 용도 | 예시 |
| --- | --- | --- | --- |
| 한 줄 주석 | `//`로 시작 | 간단한 설명, TODO, 디버깅 등 | `// 변수 초기화` |
| 여러 줄 주석 | `/* ... */`로 감싸기 | 여러 줄 설명, 블록 주석 등 | `/* 여러 줄 주석입니다 */` |
| 문서 주석 | `/** ... */`로 시작 | 메서드, 클래스 문서 자동화 | `/** 이름을 반환합니다 */` |

```java
public class Example {
    // 한 줄 주석: 사용자 이름 출력
    public static void main(String[] args) {
        /* 여러 줄 주석:
           변수 선언과 초기화 */
        String name = "Skala";

        /**
         * 사용자 이름을 출력합니다.
         * @param name 사용자 이름
         */
        System.out.println("Hello, " + name);
    }
}
```

### Javadoc 주요 태그 

- `@param` - 메서드 매개변수 설명 
- `@return` - 반환값 설명 
- `@throws` - 예외 설명 
- `@author` - 작성자 
- `@since` - 버전표시 

```java
/**
 * 주어진 두 수의 합을 반환합니다.
 * @param a 첫 번째 정수
 * @param b 두 번째 정수
 * @return 두 정수의 합
 */
public int add(int a, int b) {
    return a + b;
}
```

| 가이드 항목 | 설명 |
| --- | --- |
| 필요한 경우만 작성 | 코드 자체로 의미가 명확할 경우 불필요한 주석은 피함 |
| 왜(Why)와 무엇(What)를 설명 | 선택한 이유, 의도, 대안 비교 또는 코드의 기능과 동작 설명 |
| 오래된 주석 제거 | 코드가 변경되면 주석도 함께 업데이트 |
| Javadoc 사용 권장 | public 클래스와 메서드는 `/** ... */` 문서 주석 사용 |
| TODO / FIXME 구분 | 작업 항목 추적 시 `// TODO: 로그인 로직 추가`처럼 명확히 작성 |
| API 문서 자동 생성 | 문서 주석과 `javadoc` 도구를 활용해 HTML 문서 생성 가능 |


`// TODO`와 `// FIXME`는 개발자가 작업 중인 코드에 메모를 남길 때 사용하는 특별한 주석 패턴이다.

IDE(예: IntelliJ, Eclipse)에서도 자동으로 인식되어 작업 추적(TODO 리스트) 용도로 널리 사용
- `// TODO`: 해야 할 작업(To-Do)을 기록해두는 주석
- `// FIXME`: 현재 코드에 문제가 있음을 나타내고 수정이 필요함을 알리는 주석
