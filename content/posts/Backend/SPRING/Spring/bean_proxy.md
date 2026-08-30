---
layout: post
title: "Bean"
description: "Bean을 사용하는 이유는 객체를 개발자가 매번 직접 만들지 않기 위해서"
date: "2026-08-14 10:19:08 +0900"
categories: ["Backend", "SPRING", "Spring"]
tags: []
legacyPath: "/backend/spring/spring/2026/08/14/bean_proxy/"
---
# Bean 
> Spring 컨테이너가 생성하고, 보관하고, 필요한 곳에 주입하며, 생명주기까지 관리하는 객체 

Bean을 사용하는 이유는 **객체**를 개발자가 매번 직접 만들지 않기 위해서

@Service
public class TransferService {
}
-> 
public TransferController(TransferService transferService) {
    this.transferService = transferService;
}

# Proxy 

Proxy를 사용하는 이유는 트랜잭션, 로그, 권한 검사처럼 **여러 메서드** 에서 반복되는 관리 기능을 대신 처리하기 위해서

(Proxy는 여러 메서드에서 반복되는 공통 기능을 실제 객체 대신 앞뒤에서 처리하기 위해 사용하는 대리 객체)

@Transactional
public void transfer() {
    // 출금
    // 입금
}


# Proxy는 Bean과 어떤 관계? 

Bean과 Proxy는 객체 관리와 반복 작업을 Spring에 맡기기 위해 사용

Proxy가 요청을 먼저 받음
→ 트랜잭션 시작
→ 실제 transfer() 실행
→ 성공하면 커밋
→ 실패하면 롤백

Controller
    ↓
Proxy
    ↓
StockService

실제로는 이런 느낌 

buyStock() 호출
        ↓
Proxy
        ↓
트랜잭션 시작
        ↓
실제 buyStock()
        ↓
트랜잭션 종료

@Transactional
public void buyStock() {
    주식구매();
}

트랜잭션 시작
buyStock()
트랜잭션 종료

Bean
→ 객체를 Spring이 생성하고 관리하도록 만드는 개념

Proxy
→ 원래 객체 앞에 대리 객체를 두어
  트랜잭션, 로깅, 보안 같은 반복적인 공통 기능을 대신 처리하는 구조
