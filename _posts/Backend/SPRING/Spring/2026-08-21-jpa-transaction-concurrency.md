---
layout: post
title: "Spring 기초 Part 9: JPA 트랜잭션과 동시성 제어"
description: "Transactional의 동작, 커밋과 롤백, 전파, 격리 수준, 낙관적 락과 비관적 락을 하나의 흐름으로 정리한다."
date: 2026-08-21 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, JPA, Transaction, Transactional, Concurrency, Lock]
series: "Spring 기초"
part: 9
---

## Spring 기초 Part 9: JPA 트랜잭션과 동시성 제어

> 트랜잭션은 여러 데이터베이스 작업을 하나의 성공 또는 실패 단위로 묶는 것이다.

모든 작업이 성공하면 커밋하고, 중간에 실패하면 전체 작업을 롤백한다.

```text
주문 생성
   ↓
재고 감소
   ↓
결제 정보 저장
   ↓
모두 성공 → COMMIT
하나라도 실패 → ROLLBACK
```

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉽게 말하면 |
|---|---|---|
| 트랜잭션 | 여러 DB 작업을 묶은 논리적인 작업 단위 | 주문 저장과 재고 감소를 함께 처리 |
| 커밋 | 트랜잭션의 변경 내용을 최종 확정 | 성공한 작업을 DB에 반영 |
| 롤백 | 트랜잭션의 변경 내용을 취소 | 실패 전 상태로 복구 |
| 트랜잭션 경계 | 트랜잭션이 시작되고 끝나는 범위 | `@Transactional` 메서드 |
| 전파 | 이미 트랜잭션이 있을 때 참여 방식을 정하는 규칙 | 기존 트랜잭션 참여 또는 새로 생성 |
| 격리 수준 | 다른 트랜잭션의 변경을 어디까지 볼지 정하는 수준 | 커밋된 값만 읽기 |
| 동시성 | 여러 작업이 같은 시간에 실행되는 성질 | 두 요청이 동시에 재고 차감 |
| 락 | 같은 데이터의 동시 접근을 제어하는 장치 | 수정이 끝날 때까지 다른 작업 대기 |

---

### 2. ACID 원칙

| 원칙 | 의미 | 쉬운 예시 |
|---|---|---|
| 원자성(Atomicity) | 작업이 모두 성공하거나 모두 실패해야 한다. | 출금과 입금이 함께 처리되어야 한다. |
| 일관성(Consistency) | 실행 전후에도 데이터 규칙을 만족해야 한다. | 재고가 음수가 되지 않아야 한다. |
| 격리성(Isolation) | 동시에 실행되는 트랜잭션의 중간 상태가 서로에게 영향을 주지 않아야 한다. | 다른 사용자의 미완료 결제를 읽지 않는다. |
| 지속성(Durability) | 커밋한 결과는 장애가 발생해도 보존돼야 한다. | 완료된 주문이 DB에 남는다. |

---

### 3. `@Transactional` 동작 원리

`@Transactional`은 Spring이 트랜잭션 경계를 관리하도록 지정하는 어노테이션이다.

```java
@Service
public class OrderService {

    @Transactional
    public void createOrder(Order order, Product product) {
        orderRepository.save(order);
        product.decreaseStock(1);
    }
}
```

Spring의 선언적 트랜잭션은 일반적으로 AOP Proxy를 통해 동작한다.

{% capture transaction_proxy_flow %}
flowchart TD
    C[호출자] --> P[Transactional Proxy]
    P --> B[트랜잭션 시작]
    B --> S[실제 Service 메서드]
    S --> Q{정상 종료?}
    Q -->|예| F[flush]
    F --> COMMIT[commit]
    Q -->|롤백 대상 예외| ROLLBACK[rollback]
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Transactional Proxy 실행 흐름"
  chart=transaction_proxy_flow
%}

```text
Proxy가 메서드 호출을 받음
          ↓
트랜잭션 시작
          ↓
실제 Service 메서드 실행
          ↓
정상 종료          롤백 대상 예외
   ↓                    ↓
COMMIT               ROLLBACK
```

같은 객체 안에서 `this.method()` 형태로 호출하면 Proxy를 거치지 않아 새 `@Transactional` 설정이 적용되지 않을 수 있다.

---

### 4. Service에 트랜잭션을 적용하는 이유

`JpaRepository`의 기본 저장, 수정, 삭제 메서드에도 트랜잭션이 적용되어 있다. `save()` 하나만 호출하는 작업은 자체 트랜잭션으로 실행될 수 있다.

하지만 하나의 비즈니스 작업은 여러 Repository 호출로 구성될 수 있다.

```java
@Transactional
public void transfer(Long fromId, Long toId, int amount) {
    Account from = accountRepository.findById(fromId).orElseThrow();
    Account to = accountRepository.findById(toId).orElseThrow();

    from.withdraw(amount);
    to.deposit(amount);
}
```

출금과 입금은 함께 성공하거나 함께 실패해야 한다. 따라서 Repository 메서드 하나가 아니라 Service의 비즈니스 작업 전체를 트랜잭션으로 묶는다.

> 트랜잭션 경계는 데이터 접근 메서드 한 번이 아니라 하나의 완전한 업무 단위를 기준으로 잡는다.

---

### 5. 트랜잭션 범위는 짧게 유지한다

트랜잭션 안에서 외부 API나 파일 작업을 오래 수행하면 DB Connection과 Lock을 오랫동안 점유할 수 있다.

```java
@Transactional
public void processOrder(Order order) {
    orderRepository.save(order);

    externalPaymentApi.call(); // 응답이 오래 걸릴 수 있음
    uploadReceiptFile();       // 파일 I/O
}
```

가능하면 DB 작업의 경계를 명확하게 분리한다.

| 작업 | 처리 방향 |
|---|---|
| DB 조회와 변경 | 필요한 범위에 `@Transactional` 적용 |
| 파일 저장 | DB 트랜잭션 밖에서 실행 고려 |
| 외부 API 호출 | DB 트랜잭션 밖에서 실행하고 실패 복구 설계 |

DB 커밋과 외부 시스템 호출은 하나의 로컬 트랜잭션으로 원자적으로 묶이지 않는다. 실제 시스템에서는 재시도, 보상 처리, 이벤트, Outbox 패턴 등을 추가로 고려할 수 있다.

---

### 6. `readOnly = true`

클래스에 조회 전용 설정을 두고 쓰기 메서드에서 덮어쓸 수 있다.

```java
@Service
@Transactional(readOnly = true)
public class UserService {

    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        return UserResponse.from(user);
    }

    @Transactional
    public Long createUser(User user) {
        return userRepository.save(user).getId();
    }
}
```

`readOnly = true`는 조회 전용 의도를 표현하고 JPA 구현체나 DB 설정에 따라 flush와 변경 감지 비용을 줄이는 최적화에 활용될 수 있다.

> 모든 환경에서 쓰기 SQL을 완전히 차단하는 보안 장치는 아니다.

---

### 7. flush와 commit

| 구분 | 역할 |
|---|---|
| flush | 영속성 컨텍스트의 변경 내용을 SQL로 DB에 전달 |
| commit | 트랜잭션 변경 내용을 최종 확정 |

```text
Entity 변경
   ↓
flush
   ↓
UPDATE SQL 전달
   ↓
commit
```

flush가 실행된 뒤에도 commit 전에 오류가 발생하면 rollback할 수 있다.

---

### 8. 예외와 롤백 규칙

Spring의 `@Transactional`은 기본적으로 `RuntimeException`과 `Error`가 메서드 밖으로 전달될 때 롤백한다.

| 구분 | 예시 | 기본 동작 |
|---|---|:---:|
| `Error` | `OutOfMemoryError` | 롤백 |
| `RuntimeException` | `IllegalArgumentException` | 롤백 |
| Checked Exception | `IOException`, `SQLException` | 커밋 |

Checked Exception도 롤백하려면 `rollbackFor`를 지정한다.

```java
@Transactional(rollbackFor = Exception.class)
public void process() throws MyCustomException {
    // DB 작업
}
```

특정 예외를 롤백 대상에서 제외할 수도 있다.

```java
@Transactional(noRollbackFor = NotificationException.class)
public void process() {
    // DB 작업
}
```

#### 예외를 메서드 안에서 잡으면

```java
@Transactional
public void process() {
    try {
        orderRepository.save(order);
        paymentService.pay();
    } catch (RuntimeException exception) {
        // 예외를 다시 던지지 않음
    }
}
```

메서드가 정상 반환하면 Proxy는 예외가 발생했다는 사실을 알 수 없다. 롤백이 필요하다면 예외를 다시 던지거나 트랜잭션을 rollback-only 상태로 표시해야 한다.

---

### 9. 트랜잭션 전파

전파(Propagation)는 이미 트랜잭션이 있을 때 새로 호출된 메서드가 그 트랜잭션을 어떻게 사용할지 정하는 규칙이다.

| 옵션 | 설명 | 사용 예시 |
|---|---|---|
| `REQUIRED` | 기존 트랜잭션이 있으면 참여하고, 없으면 새로 만든다. | 대부분의 Service 로직 |
| `REQUIRES_NEW` | 기존 트랜잭션을 일시 중단하고 독립된 새 트랜잭션을 만든다. | 독립적으로 저장할 감사 로그 |

#### `REQUIRED`

```java
@Transactional
public void createOrder() {
    orderRepository.save(order);
    paymentService.pay();
}
```

`paymentService.pay()`도 `REQUIRED`라면 바깥 트랜잭션에 참여한다. 내부 작업이 rollback-only로 표시되면 최종 커밋 시 `UnexpectedRollbackException`이 발생할 수 있다.

#### `REQUIRES_NEW`

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void saveAuditLog(AuditLog log) {
    auditLogRepository.save(log);
}
```

새로운 물리 트랜잭션을 사용하므로 외부 트랜잭션과 독립적으로 커밋하거나 롤백할 수 있다.

다만 외부 트랜잭션의 자원은 유지한 채 새 DB Connection을 추가로 사용할 수 있다. 남발하면 Connection Pool 부족이나 Lock 대기가 발생할 수 있다.

또한 같은 객체의 내부 호출로는 전파 설정이 적용되지 않을 수 있으므로 별도 Bean을 통해 호출해야 한다.

---

### 10. 동시성 문제

`@Transactional`은 작업 범위를 묶어주지만 모든 동시성 문제를 자동으로 해결하지는 않는다.

| 문제 | 설명 | 예시 |
|---|---|---|
| 갱신 손실(Lost Update) | 나중에 저장한 값이 먼저 저장한 값을 덮어씀 | 두 요청이 동시에 포인트 증가 |
| 더티 리드(Dirty Read) | 커밋되지 않은 값을 다른 트랜잭션이 읽음 | 곧 롤백될 값을 조회 |
| 반복 읽기 불일치 | 같은 행을 다시 읽었을 때 값이 달라짐 | 포인트가 100에서 200으로 변경 |
| 유령 읽기(Phantom Read) | 같은 조건의 재조회에서 행 개수가 달라짐 | 회원이 10명에서 11명으로 증가 |
| 경쟁 상태(Race Condition) | 실행 순서에 따라 업무 결과가 달라짐 | 동시 재고 감소로 음수 발생 |

---

### 11. 격리 수준

격리 수준은 다른 트랜잭션의 변경 내용을 어디까지 볼 수 있는지 정한다.

| 격리 수준 | 특징 |
|---|---|
| `READ_UNCOMMITTED` | 커밋하지 않은 데이터도 읽을 수 있다. |
| `READ_COMMITTED` | 커밋된 데이터만 읽어 Dirty Read를 방지한다. |
| `REPEATABLE_READ` | 같은 행을 반복 조회할 때 같은 결과를 보장한다. |
| `SERIALIZABLE` | 트랜잭션을 순차 실행한 것처럼 강하게 격리한다. |

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public void process() {
    // DB 작업
}
```

Spring의 `Isolation.DEFAULT`는 사용하는 DB의 기본 격리 수준을 따른다. 격리 수준을 높이면 정합성은 강해지지만 대기와 성능 비용이 증가할 수 있다.

---

### 12. 낙관적 락

낙관적 락은 충돌이 드물다고 가정하고 버전 값으로 수정 충돌을 감지한다.

```java
@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int stock;

    @Version
    private Long version;
}
```

JPA는 수정할 때 조회 당시 버전을 조건에 포함한다.

```sql
UPDATE product
SET stock = 9,
    version = 2
WHERE id = 1
  AND version = 1;
```

다른 트랜잭션이 먼저 수정해 버전이 달라졌다면 충돌 예외가 발생한다.

```text
A와 B가 version = 1 조회
        ↓
A가 수정하고 version = 2로 커밋
        ↓
B가 version = 1 조건으로 수정
        ↓
수정 실패와 낙관적 락 예외
```

| 장점 | 단점 |
|---|---|
| DB Lock을 오래 잡지 않아 읽기가 많은 환경에 유리 | 충돌 시 예외 처리와 제한된 재시도 필요 |

재시도할 때는 최신 데이터를 새 트랜잭션에서 다시 조회하고 업무 조건을 다시 검사해야 한다.

---

### 13. 비관적 락

비관적 락은 충돌이 자주 발생한다고 가정하고 조회 시점에 DB Lock을 획득한다.

```java
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdWithWriteLock(@Param("id") Long id);
}
```

```java
@Transactional
public void decreaseStock(Long productId, int quantity) {
    Product product = productRepository
            .findByIdWithWriteLock(productId)
            .orElseThrow();

    product.decreaseStock(quantity);
}
```

| 장점 | 단점 |
|---|---|
| 충돌이 잦은 상황에서 동시 수정을 순서대로 처리하기 쉬움 | 대기 시간, 성능 저하, Timeout과 Deadlock 가능 |

Lock의 실제 동작은 DB 종류와 격리 수준에 따라 달라질 수 있다.

---

### 14. 해결 방법 선택

| 해결 방법 | 적합한 상황 |
|---|---|
| 낙관적 락 | 충돌은 드물고 읽기가 많은 수정 |
| 비관적 락 | 좌석 예약처럼 같은 데이터 충돌이 잦은 작업 |
| 원자적 쿼리 | 단순한 증가나 감소를 한 SQL로 처리할 수 있는 작업 |
| Unique 제약조건 | 이메일, 주문 번호 등의 중복 방지 |
| 격리 수준 조정 | 트랜잭션 사이의 조회 일관성이 중요한 작업 |

단순 재고 감소는 조건을 포함한 원자적 SQL로 처리할 수도 있다.

```sql
UPDATE product
SET stock = stock - 1
WHERE id = 1
  AND stock > 0;
```

수정된 행이 `0`개라면 재고가 없거나 상품이 없는 경우로 처리한다.

---

### 핵심 정리

| 개념 | 한 줄 정리 |
|---|---|
| 트랜잭션 | 여러 DB 작업을 하나의 성공 또는 실패 단위로 묶음 |
| `@Transactional` | Proxy가 트랜잭션의 시작, 커밋, 롤백을 관리 |
| 롤백 | 기본적으로 unchecked exception과 `Error`가 전달될 때 실행 |
| 전파 | 기존 트랜잭션 참여 여부와 새 트랜잭션 생성을 결정 |
| 격리 수준 | 다른 트랜잭션의 변경을 어디까지 볼지 결정 |
| 낙관적 락 | 버전으로 수정 충돌 감지 |
| 비관적 락 | DB Lock으로 동시 수정을 제한 |

> `@Transactional`만 붙인다고 모든 문제가 해결되지는 않는다. 업무 단위, 롤백 규칙, 전파, 격리 수준과 동시성 제어 방법을 함께 선택해야 한다.

### 참고 자료

- [Spring Framework 선언적 트랜잭션 공식 문서](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html)
- [Spring Framework 트랜잭션 전파 공식 문서](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)
