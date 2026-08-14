---
layout: post
title: "Spring 기초 Part 5: EntityManager와 영속성 컨텍스트"
description: "EntityManager의 역할, Entity 생명주기, 1차 캐시, 변경 감지, 쓰기 지연, flush와 commit의 차이를 정리한다."
date: 2026-08-17 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, JPA, EntityManager, Persistence Context, Dirty Checking]
series: "Spring 기초"
part: 5
---

# Spring 기초 Part 5: EntityManager와 영속성 컨텍스트

> EntityManager는 Entity를 영속성 컨텍스트에서 관리하고, 데이터베이스 작업을 JPA 구현체에 요청하는 핵심 인터페이스다.

두 개념의 관계를 먼저 기억하자.

```text
EntityManager
→ 영속성 컨텍스트를 사용해 Entity를 관리하는 관리자

영속성 컨텍스트
→ Entity의 상태를 보관하고 추적하는 논리적인 작업 공간
```

---

## 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉽게 말하면 |
|---|---|---|
| EntityManager | Entity의 저장, 조회, 삭제와 상태 관리를 담당하는 JPA 인터페이스 | Entity 관리자 |
| 영속성 | 애플리케이션이 종료돼도 데이터가 DB에 남는 성질 | 데이터를 계속 보관 |
| 영속성 컨텍스트 | JPA가 Entity를 관리하는 논리적인 공간 | Entity 작업실 |
| 1차 캐시 | 영속성 컨텍스트 내부의 Entity 저장 공간 | 같은 트랜잭션의 조회 결과 보관 |
| 스냅샷 | Entity를 처음 관리할 때 저장한 상태 | 변경 전 값 |
| 변경 감지 | 현재 상태와 스냅샷을 비교해 변경을 찾는 기능 | 수정된 필드를 자동 확인 |
| 쓰기 지연 | 쓰기 SQL을 모아두었다가 flush 시점에 전달하는 방식 | SQL을 바로 보내지 않고 준비 |
| flush | 영속성 컨텍스트의 변경을 SQL로 DB에 전달 | SQL 전송 |
| commit | 트랜잭션의 변경 내용을 최종 확정 | 저장 확정 |

---

## 2. EntityManager가 하는 일

EntityManager의 대표 메서드는 다음과 같다.

| 메서드 | 역할 | SQL 관점 |
|---|---|---|
| `persist(entity)` | 새 Entity를 영속 상태로 만듦 | 보통 `INSERT` |
| `find(type, id)` | 기본키로 Entity 조회 | `SELECT` |
| `remove(entity)` | Entity를 삭제 상태로 만듦 | `DELETE` |
| `merge(entity)` | 준영속 Entity의 값을 새 영속 Entity에 복사 | `SELECT`, `UPDATE` 가능 |
| `flush()` | 변경 내용을 DB에 전달 | 쓰기 SQL 실행 |
| `detach(entity)` | 특정 Entity를 관리 대상에서 제외 | 자동 변경 감지 중단 |
| `clear()` | 영속성 컨텍스트를 비움 | 관리 중인 Entity 전체 분리 |

직접 사용하는 Repository를 만들면 다음과 같은 모습이다.

```java
@Repository
public class UserJpaRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(User user) {
        entityManager.persist(user);
    }

    public User findById(Long id) {
        return entityManager.find(User.class, id);
    }

    public void delete(User user) {
        entityManager.remove(user);
    }
}
```

Spring Data JPA의 `JpaRepository`도 내부적으로 EntityManager를 사용한다.

```text
내 코드
  → JpaRepository
  → EntityManager
  → Hibernate
  → JDBC
  → Database
```

---

## 3. Entity의 네 가지 상태

| 상태 | 의미 |
|---|---|
| 비영속(New/Transient) | 객체는 있지만 JPA가 관리하지 않는 상태 |
| 영속(Managed) | 영속성 컨텍스트가 관리하는 상태 |
| 준영속(Detached) | 한때 관리됐지만 현재는 분리된 상태 |
| 삭제(Removed) | 삭제하도록 등록된 상태 |

### 비영속

```java
User user = new User("민형", "min@example.com");
```

일반 자바 객체만 생성된 상태다.

```text
Java 메모리: User 객체 있음
영속성 컨텍스트: 등록되지 않음
Database: 저장되지 않음
```

### 영속

```java
entityManager.persist(user);
```

또는 EntityManager로 조회한 객체도 영속 상태가 된다.

```java
User user = entityManager.find(User.class, 1L);
```

영속 상태가 되면 JPA가 객체의 변경을 추적한다.

### 준영속

```java
entityManager.detach(user);
```

영속성 컨텍스트에서 분리된 객체는 값을 바꿔도 변경 감지가 동작하지 않는다.

```java
user.changeName("민농"); // 자동 UPDATE 대상이 아님
```

### 삭제

```java
entityManager.remove(user);
```

Entity가 삭제 대상으로 등록되고 flush 시점에 `DELETE` SQL이 전달된다.

{% capture entity_state_flow %}
flowchart LR
    N[비영속] -->|persist| M[영속]
    M -->|detach, clear| D[준영속]
    D -->|merge 후 반환 객체| M
    M -->|remove| R[삭제]
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Entity 생명주기"
  chart=entity_state_flow
%}

---

## 4. 1차 캐시와 동일성 보장

영속성 컨텍스트는 관리 중인 Entity를 기본키 기준으로 1차 캐시에 보관한다.

```java
User user1 = entityManager.find(User.class, 1L);
User user2 = entityManager.find(User.class, 1L);
```

첫 조회는 DB에서 데이터를 가져와 1차 캐시에 저장한다. 같은 영속성 컨텍스트에서 다시 조회하면 1차 캐시의 객체를 반환할 수 있다.

```text
첫 번째 find()
→ 1차 캐시에 없음
→ SELECT 실행
→ 조회 결과를 1차 캐시에 저장

두 번째 find()
→ 1차 캐시에서 발견
→ 같은 Entity 객체 반환
```

```java
System.out.println(user1 == user2); // true
```

이처럼 같은 영속성 컨텍스트에서 같은 기본키의 Entity에 대해 같은 객체 참조를 제공하는 것을 동일성 보장이라고 한다.

1차 캐시는 보통 하나의 트랜잭션처럼 짧은 범위에서 사용되므로 애플리케이션 전체의 공용 캐시와는 다르다.

---

## 5. 변경 감지

변경 감지(Dirty Checking)는 영속 상태의 Entity가 변경됐는지 확인하여 `UPDATE` SQL을 만드는 기능이다.

```java
@Transactional
public void changeName(Long id, String newName) {
    User user = entityManager.find(User.class, id);
    user.changeName(newName);
}
```

`update()`나 `save()`를 따로 호출하지 않아도 트랜잭션이 끝날 때 변경이 반영될 수 있다.

```text
1. User 조회
2. 조회 당시 상태를 스냅샷으로 보관
3. user.changeName() 호출
4. flush 시 현재 상태와 스냅샷 비교
5. 변경 발견
6. UPDATE SQL 실행
```

```sql
UPDATE users
SET name = '민농'
WHERE id = 1;
```

변경 감지는 영속 상태의 Entity에만 적용된다.

---

## 6. 쓰기 지연

JPA는 쓰기 SQL을 준비해두었다가 flush 시점에 DB로 전달할 수 있다.

```java
entityManager.persist(user1);
entityManager.persist(user2);
```

```text
persist(user1) → INSERT 준비
persist(user2) → INSERT 준비
flush          → SQL을 DB에 전달
commit         → 트랜잭션 확정
```

이 방식을 쓰기 지연(Write Behind)이라고 한다.

다만 모든 SQL이 반드시 커밋 직전에만 실행되는 것은 아니다. 예를 들어 `IDENTITY` 기본키 전략은 생성된 ID를 얻기 위해 `persist()` 시점에 `INSERT`가 먼저 실행될 수 있다.

---

## 7. `flush()`와 `commit()`의 차이

```java
entityManager.flush();
```

`flush()`는 변경 내용을 SQL로 DB에 전달하지만 트랜잭션을 최종 확정하지는 않는다.

| 구분 | 역할 |
|---|---|
| `flush()` | 변경 내용을 SQL로 DB에 전달 |
| `commit()` | 트랜잭션 변경을 최종 확정 |

```text
flush 실행
  → SQL은 DB에 전달됨
  → 아직 commit 전
  → 오류 발생 시 rollback 가능
```

일반적으로 `@Transactional` 메서드가 정상 종료될 때 다음 과정이 진행된다.

```text
메서드 정상 종료
   ↓
flush
   ↓
쓰기 SQL 실행
   ↓
commit
```

JPQL 쿼리를 실행하기 전에 조회 결과의 일관성을 맞추기 위해 flush가 먼저 발생할 수도 있다.

---

## 8. `merge()` 주의점

`merge()`는 전달받은 준영속 객체 자체를 다시 영속 상태로 바꾸는 메서드가 아니다.

```java
User managedUser = entityManager.merge(detachedUser);
```

```text
detachedUser → 여전히 준영속
managedUser  → merge가 반환한 영속 객체
```

따라서 `merge()`를 사용할 때는 반환 객체를 사용해야 한다.

실무에서는 준영속 Entity 전체를 `merge()`하기보다 트랜잭션 안에서 Entity를 다시 조회하고 필요한 값만 변경하는 방식을 자주 사용한다.

```java
@Transactional
public void changeName(Long id, String newName) {
    User user = entityManager.find(User.class, id);
    user.changeName(newName);
}
```

이 방식은 어떤 필드가 변경되는지 코드에서 명확하게 확인할 수 있다.

---

## 9. 실제 Service 실행 흐름

```java
@Transactional
public void updateUser(Long id, String newName) {
    User user = userRepository.findById(id).orElseThrow();
    user.changeName(newName);
}
```

```text
1. @Transactional로 트랜잭션 시작
2. EntityManager가 영속성 컨텍스트 사용
3. User 조회
4. User가 영속 상태가 됨
5. 이름 변경
6. 트랜잭션 종료 직전 변경 감지
7. UPDATE SQL 실행
8. commit
9. 영속성 컨텍스트 범위 종료
```

---

## 핵심 정리

| 개념 | 한 줄 정리 |
|---|---|
| EntityManager | Entity의 저장, 조회, 삭제와 상태를 관리 |
| 영속성 컨텍스트 | Entity를 보관하고 변경을 추적하는 논리적인 공간 |
| 1차 캐시 | 같은 영속성 컨텍스트에서 조회한 Entity 보관 |
| 변경 감지 | 영속 Entity의 변경을 찾아 `UPDATE` 실행 |
| 쓰기 지연 | 쓰기 SQL을 준비했다가 flush 시 전달 |
| flush | SQL을 DB에 전달하지만 확정하지는 않음 |
| commit | 트랜잭션 변경을 최종 확정 |

> EntityManager의 핵심은 SQL 메서드를 대신 제공하는 것보다 Entity의 생명주기와 상태를 관리하는 데 있다.

## 참고 자료

- [Jakarta Persistence 공식 명세](https://jakarta.ee/specifications/persistence/)
- [Hibernate ORM User Guide](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html)
