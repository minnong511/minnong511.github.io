---
layout: post
title: "Chunking?"
description: "RAG 강의듣다가 궁금한게 생겼다. RAG가 문서를 벡터로 변환된어 있는 잘린 데이터를 찾아서 데이터 검색을 한다는데, 그렇다면 도대체 어떻게 자르는 것일까..? 하고 궁금해졌다."
date: "2026-08-18 19:28:21 +0900"
categories: ["DeepLearning", "RAG"]
tags: []
legacyPath: "/deeplearning/rag/2026/08/18/Chunking/"
---
# Chunking? 

> Chunking = 긴 문서를 "검색 가능한 의미 단위"로 잘라놓는 작업 

RAG 강의듣다가 궁금한게 생겼다. RAG가 문서를 벡터로 변환된어 있는 잘린 데이터를 찾아서 데이터 검색을 한다는데, 그렇다면 도대체 어떻게 자르는 것일까..? 하고 궁금해졌다. 

그래서 좀 공부해기로 했다.

# Chunking이란? 

일단 예시 문서를 좀 살펴보자 

[Spring Boot 문서]

Spring Boot는 Java 기반 웹 애플리케이션 프레임워크이다.

Dependency Injection은 객체가 필요한 의존성을
Spring Container가 외부에서 주입하는 방식이다.
생성자 주입, Setter 주입 등이 있다.

JPA는 Java 객체와 관계형 데이터베이스를
연결하기 위한 ORM 표준이다.
@Entity를 사용해서 테이블과 객체를 매핑한다.

이걸 문서 전체 하나로 임베딩하지 않고 자르면 된다. 

-> 왜? 임베딩 벡터 사이즈가 너무 커져서 그런건가? 

Chunk 1
Spring Boot는 Java 기반 웹 애플리케이션 프레임워크이다.

Chunk 2
Dependency Injection은 객체가 필요한 의존성을
Spring Container가 외부에서 주입하는 방식이다.
생성자 주입, Setter 주입 등이 있다.

Chunk 3
JPA는 Java 객체와 관계형 데이터베이스를
연결하기 위한 ORM 표준이다.
@Entity를 사용해서 테이블과 객체를 매핑한다.

그리고 각각을 임베딩한다. 

Chunk 1 → [0.12, 0.82, 0.41, ...]
Chunk 2 → [0.73, 0.11, 0.92, ...]
Chunk 3 → [0.54, 0.77, 0.13, ...]

다시 사용자로 돌아가보자 

이제 뭐 사용자가 채팅으로 

"Spring에서 의존성 주입이 뭐야?" 이라고 질문을 하면 질문도 임베딩한다. 

질문
↓
Embedding
↓
[0.71, 0.14, 0.89, ...]

이렇게 변경한다. 그리고서는 Vector DB에서 가장 가까운 Chunk를 찾게 된다. 

질문
   ↓
Chunk 1    유사도 0.42
Chunk 2    유사도 0.91  ← 선택
Chunk 3    유사도 0.38

이런 방식으로 말이다. 

이렇듯이 chunk를 기반으로 자르므로, 문서를 어떻게 잘라내는지가 성능에 큰 영향을 준다. 

그러면 Chunk가 어떤 영향을 주는 지 좀 살펴보자! 

# 1. Chunk가 너무 크면.. 어떻게 될까?

예를 들어 책 한 페이지 전체를 Chunk 하나로 만든다고 해보자.

Chunk

Spring Boot 설명 
DI 설명 
JPA 설명 
Security 설명 
Docker 설명 
Redis 설명 
Kafka 설명 
... 

사용자가 
DI가 뭐냐? 

라고 질문하면 AI가 잘못 찾을 것이다. 

왜나하면 Chunk에도 DI 말고도, 수많은 주제가 섞여있기 때문이다.
아무튼 Chunk가 너무 큰 경우에는 Embedding이 나타내는 의미가 희석된다. 

DI 
JPA 
Security 
Docker 
Kafka 
Redis 

를 전부 평균적으로 표현하는 벡터가 만들어지는 문제가 생긴다. 

그래서 

질문 : DI가 뭐냐..? 

-> Embedding 

DI만 있는 Chunk
유사도 0.92

DI + Docker + Kafka + Redis + JPA
유사도 0.65

처럼 될 수가 있다. 

# 2. 반대로 Chunk가 너무 작은 경우에는 어떻게 될까? 

아까는 Chunk가 너무 컸으니까.... 너무 작게 잘라보자 

이렇게 자른다고 하자 

Chunk 1 
Dependency Injection은 

Chunk 2
객체가 필요한 의존성을

Chunk 3
Spring Container가

Chunk 4
외부에서 주입하는 방식이다.

근데 이것도 문제가 있다... 

사용자는 Dependency Injection이 뭐야?

라고 질문했는데.. 

검색 결과가 "객체가 필요한 의존성을" 하나만 나오면 의미가 없지 않겠는가? 

그런 것이다. 

# 그러면 어떻게 해야함? 

Chunk는 아래와 같이 설계되어야 한다. 

> Chunk 하나만 읽어도 어느 정도 의미가 완성되어 있어야 한다. 

이게 핵심 

## 3.좋은 Chunking의 핵심 

내가 Chunking을 한 문장으로 정의하면 

> 검색될 만한 하나의 개념이 최대한 온전히 들어가도록 문서를 자르는 것 

내가 AI 없이 봐도 이해가 되게 잘라야 한다.

### 나쁜 Chunk 
- Java에서 클래스는 객체를 생성하기 위한

### 좋은 Chunk 
- Java에서 클래스는 객체를 생성하기 위한 설계도이다.
클래스에는 필드와 메서드를 정의할 수 있으며,
new 키워드를 통해 인스턴스를 생성할 수 있다.

검색되었을 때 자체로 의미가 있게 설계해야 한다.

# 4.실제 Chunking은 어떻게 하냐?

가장 단순한 거 

문서
↓
500 token
↓
Chunk 1

다음 500 token
↓
Chunk 2

다음 500 token
↓
Chunk 3

Python으로 생각하면 

chunks = split_text(
    document,
    chunk_size=500
)

뭐 이런 느낌이다. 

그런데 이러면 자르면 안되는 부분에서 잘려버리는 문제가 생긴다.... 

뭐 예시를 들어보자면

원문이 아래와 같고

Spring의 Dependency Injection은 
객체가 직접 의존성을 생성하지 않고, 
Spring Container가 객체를 생성하여 
주입하는 설계 방식 

정확히 500 token에서 잘라버리면

Chunk 1
Spring의 Dependency Injection은
객체가 직접 의존성을 생성하지 않고
Spring Container가

Chunk 2
객체를 생성하여
주입하는 설계 방식이다.

이런 식으로 되버려서 문맥이 끊기는 문제가 있다. 

하지만 세상에는 문제를 해결하는 좋은 방법이 많은 법...

> **Overlap** 

이라는 좋은 방법으로 문제를 해결한다.

# 5. Chunk Overlap 

예를 들어 

Chunk Size = 500 
Overlap = 100 

이라고 하면 

원본

1 2 3 4 5 6 7 8 9 10 을 

Chunk 1

1 2 3 4 5

다음 Chuck 

다음 Chunk에서는 뒤의 일부를 다시 포함
