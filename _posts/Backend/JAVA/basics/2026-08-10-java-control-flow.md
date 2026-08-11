---
layout: post
title: "Java 기초 Part 3: 제어문"
description: "Java의 조건문, 반복문, 분기문과 예외 처리에 사용하는 기본 제어 흐름을 정리한다."
date: 2026-08-10 09:40:00 +0900
categories: [java, basics]
tags: [Java, Control Flow, If, Switch, For, While, Exception]
series: "Java 기초"
part: 3
---

# Java 기초 Part 3: 제어문

| 분류 | 제어문 | 설명 | 사용 예시 또는 키워드 |
| --- | --- | --- | --- |
| 조건문 | `if`, `else if`, `else` | 조건에 따라 다른 블록을 실행 | `if (a > b) { ... }` |
| 조건문 | `switch` | 여러 값 중 하나와 일치하는 분기 실행 | `switch (value) { case 1: ... }` |
| 반복문 | `for` | 조건에 따라 정해진 횟수만큼 반복 | `for (int i = 0; i < 10; i++)` |
| 반복문 | `while` | 조건이 참인 동안 계속 반복 | `while (i < 10)` |
| 반복문 | `do-while` | 최소 1회는 실행되고 조건이 참인 동안 반복 | `do { ... } while (i < 10)` |
| 분기문 | `break` | 반복문 또는 switch문을 즉시 종료 | `if (...) break;` |
| 분기문 | `continue` | 현재 반복을 건너뛰고 다음 반복으로 진행 | `if (...) continue;` |
| 분기문 | `return` | 현재 메서드의 실행을 종료하거나 값을 반환 | `return value;`, `return;` |
| 예외 처리 | `try-catch-finally` | 예외 상황을 처리하기 위한 제어 흐름 구조 | `try { ... } catch (Exception e) { ... } finally { ... }` |
| 예외 처리 | `throw`, `throws` | 예외를 발생시키거나 메서드에서 예외를 위임 | `throw new IOException();` |
