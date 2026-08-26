---
layout: post
title: "JPA 트랜잭션(Transaction)"
description: "모든 작업이 성공하면 데이터베이스에 반영하고, 중간에 실패하면 작업 전체를 취소한다."
date: "2026-08-14 17:44:25 +0900"
categories: ["Backend", "SPRING", "Spring"]
tags: []
legacyPath: "/backend/spring/spring/2026/08/14/JPA_트랜젝션/"
---
# JPA 트랜잭션(Transaction)

> 트랜잭션은 여러 데이터베이스 작업을 하나의 논리적인 작업 단위로 묶는 것이다.

모든 작업이 성공하면 데이터베이스에 반영하고, 중간에 실패하면 작업 전체를 취소한다.

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

## 1. 먼저 알아야 할 단어

| 단어 | 정의 | 쉬운 설명 |
|---|---|---|
| 트랜잭션 | 여러 DB 작업을 하나로 묶은 작업 단위 | 주문 저장과 재고 감소를 함께 처리 |
| 커밋(Commit) | 트랜잭션의 변경 내용을 최종 반영 | 작업이 성공했으니 DB에 저장 |
| 롤백(Rollback) | 트랜잭션의 변경 내용을 모두 취소 | 오류가 발생했으니 이전 상태로 복구 |
| 트랜잭션 경계 | 트랜잭션이 시작되고 끝나는 범위 | `@Transactional` 메서드의 실행 범위 |
| 플러시(Flush) | 영속성 컨텍스트의 변경 내용을 SQL로 DB에 전달 | 커밋 전에 `INSERT`, `UPDATE` 실행 |
| 락(Lock) | 동시에 같은 데이터를 변경하지 못하도록 제어하는 장치 | 재고를 수정하는 동안 다른 수정 대기 |
| 동시성 | 여러 사용자나 작업이 같은 시간에 실행되는 성질 | 두 사용자가 동시에 마지막 상품 구매 |
| 정합성 | 데이터가 정해진 규칙에 맞는 올바른 상태 | 재고가 음수가 되지 않음 |

---

## 2. 트랜잭션의 ACID 원칙

| 원칙 | 의미 | 쉬운 예시 |
|---|---|---|
| 원자성(Atomicity) | 모든 작업이 성공하거나 모두 실패해야 한다. | 계좌이체에서 출금과 입금이 함께 처리되어야 한다. |
| 일관성(Consistency) | 실행 전후에도 데이터 규칙을 만족해야 한다. | 작업 후에도 잔액이나 재고 규칙을 지켜야 한다. |
| 격리성(Isolation) | 동시에 실행되는 트랜잭션이 서로의 중간 상태에 영향을 주지 않아야 한다. | 다른 사용자의 미완료 결제 내용을 읽지 않는다. |
| 지속성(Durability) | 커밋한 결과는 장애가 발생해도 보존되어야 한다. | 서버가 꺼져도 완료된 주문은 DB에 남는다. |

---

## 3. `@Transactional`

`@Transactional`은 Spring이 트랜잭션을 자동으로 시작하고 종료하도록 지정하는 어노테이션이다.

일반적으로 여러 DB 작업을 하나로 묶는 **Service 메서드**에 사용한다.

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

메서드가 정상 종료되면 커밋하고, 기본 롤백 대상 예외가 밖으로 전달되면 롤백한다.

```text
프록시가 메서드 호출을 받음
          ↓
트랜잭션 시작(BEGIN)
          ↓
실제 Service 메서드 실행
          ↓
정상 종료          예외 발생
   ↓                  ↓
COMMIT             ROLLBACK
```

### 클래스와 메서드에 적용하기

클래스에 조회 전용 설정을 적용하고, 쓰기 메서드에서 다시 덮어쓸 수 있다.

```java
@Service
@Transactional(readOnly = true)
public class UserService {

    public User getUser(Long id) {
        return userRepository.findById(id).orElseThrow();
    }

    @Transactional
    public User registerUser(User user) {
        return userRepository.save(user);
    }
}
```

`readOnly = true`는 조회 전용이라는 의도를 나타내고, JPA 구현체와 DB 설정에 따라 불필요한 변경 감지나 flush를 줄이는 최적화에 활용될 수 있다.

> `readOnly = true`가 모든 환경에서 쓰기 작업을 완전히 차단하는 것은 아니다. 데이터 변경을 막는 용도로만 믿으면 안 된다.

---

## 4. `save()`에도 트랜잭션이 있는데 Service에 왜 붙일까?

`JpaRepository`의 기본 저장, 수정, 삭제 메서드에는 트랜잭션이 적용되어 있다. 따라서 `save()` 하나만 호출하면 자체 트랜잭션으로 실행될 수 있다.

하지만 Service에서 여러 Repository 작업을 호출하면 각 작업을 하나의 트랜잭션으로 묶어야 한다.

```java
@Transactional
public void transfer(Long fromId, Long toId, int amount) {
    Account from = accountRepository.findById(fromId).orElseThrow();
    Account to = accountRepository.findById(toId).orElseThrow();

    from.withdraw(amount);
    to.deposit(amount);
}
```

Service에 `@Transactional`이 없다면 출금은 성공했지만 입금은 실패하는 등 작업 전체의 원자성을 보장하기 어렵다.

> Repository 메서드 하나의 트랜잭션보다 비즈니스 작업 전체를 묶는 Service의 트랜잭션 경계가 중요하다.

---

## 5. 트랜잭션 범위는 필요한 만큼만 설정한다

트랜잭션 안에서 오래 걸리는 파일 작업이나 외부 API 호출을 수행하면 DB 커넥션과 락을 오랫동안 점유할 수 있다.

### 범위가 너무 넓은 예

```java
@Transactional
public void processAndSave(User user, MultipartFile file) {
    String filePath = saveFileToDisk(file); // 오래 걸릴 수 있음

    user.changeProfileImage(filePath);
    userRepository.save(user);

    notifyExternalSystem(user);             // 외부 API 호출
}
```

### DB 작업만 별도 Service로 분리

```java
public void processAndSave(User user, MultipartFile file) {
    String filePath = saveFileToDisk(file);
    userProfileService.changeProfileImage(user.getId(), filePath);
    notifyExternalSystem(user);
}
```

```java
@Service
public class UserProfileService {

    @Transactional
    public void changeProfileImage(Long userId, String filePath) {
        User user = userRepository.findById(userId).orElseThrow();
        user.changeProfileImage(filePath);
    }
}
```

| 작업 | 처리 방식 |
|---|---|
| 파일 저장 | DB 트랜잭션 밖에서 실행 |
| DB 조회와 변경 | `@Transactional` 범위에서 실행 |
| 외부 API 호출 | 가능하면 DB 트랜잭션 밖에서 실행 |

실제 서비스에서는 DB 커밋과 외부 시스템 호출을 완전히 하나의 트랜잭션으로 묶을 수 없다는 점도 고려해야 한다. 실패 복구, 이벤트, Outbox 패턴 등이 추가로 필요할 수 있다.

---

## 6. 프록시와 내부 호출 문제

Spring은 보통 `@Transactional`이 적용된 객체를 프록시로 감싼다. 외부에서 프록시를 거쳐 메서드를 호출해야 트랜잭션 기능이 적용된다.

같은 클래스에서 `this.innerMethod()`처럼 내부 메서드를 호출하면 프록시를 거치지 않는다.

```java
@Service
public class UserService {

    public void outerMethod() {
        innerMethod(); // 내부 호출
    }

    @Transactional
    public void innerMethod() {
        // DB 작업
    }
}
```

이 경우 `innerMethod()`의 `@Transactional`이 적용되지 않을 수 있다.

트랜잭션 단위가 다르면 별도 Spring Bean으로 분리한다.

```java
@Service
public class OuterService {

    private final InnerService innerService;

    public OuterService(InnerService innerService) {
        this.innerService = innerService;
    }

    public void outerMethod() {
        innerService.innerMethod(); // 프록시를 통해 호출
    }
}
```

```java
@Service
public class InnerService {

    @Transactional
    public void innerMethod() {
        // DB 작업
    }
}
```

---

## 7. 영속성 컨텍스트, 플러시, 커밋

영속성 컨텍스트는 JPA가 Entity 객체를 관리하는 공간이다.

트랜잭션 안에서 Entity를 조회하면 JPA가 초기 상태를 기억한다. Entity의 값이 바뀌면 변경 감지로 `UPDATE` SQL을 준비한다.

```java
@Transactional
public void changeName(Long id, String newName) {
    User user = userRepository.findById(id).orElseThrow();
    user.changeName(newName);
}
```

```text
트랜잭션 시작
      ↓
Entity 조회 및 관리
      ↓
Entity 값 변경
      ↓
커밋 직전 flush
      ↓
UPDATE SQL 실행
      ↓
COMMIT
```

### 플러시와 커밋은 다르다

- 플러시: 변경 내용을 SQL로 데이터베이스에 전달한다.
- 커밋: 트랜잭션의 변경 내용을 최종 확정한다.

플러시가 실행되어 SQL이 전달됐더라도 커밋 전에 문제가 발생하면 롤백할 수 있다.

JPA가 SQL을 모아서 나중에 실행하는 방식을 쓰기 지연이라고 한다. 다만 기본키 전략이 `IDENTITY`인 Entity의 `INSERT`처럼 식별자를 얻기 위해 SQL이 일찍 실행되는 예외도 있다.

---

## 8. 예외와 롤백 규칙

Spring의 `@Transactional`은 기본적으로 `RuntimeException`과 `Error`가 메서드 밖으로 전달될 때 롤백한다.

| 구분 | 대표 예외 | 기본 롤백 여부 |
|---|---|:---:|
| `Error` | `OutOfMemoryError` | 롤백 |
| `RuntimeException` | `NullPointerException`, `IllegalArgumentException` | 롤백 |
| Checked Exception | `IOException`, `SQLException` | 커밋 |

Checked Exception도 롤백하려면 `rollbackFor`를 지정한다.

```java
@Transactional(rollbackFor = Exception.class)
public void process() throws MyCustomException {
    // DB 작업
}
```

특정 예외를 롤백 대상에서 제외하려면 `noRollbackFor`를 사용한다.

```java
@Transactional(noRollbackFor = NotificationException.class)
public void process() {
    // DB 작업
}
```

### 예외를 잡으면 어떻게 될까?

메서드 안에서 예외를 잡고 정상 반환하면 프록시는 예외가 발생했다는 사실을 알 수 없다.

```java
@Transactional
public void process() {
    try {
        orderRepository.save(order);
        paymentService.pay();
    } catch (RuntimeException e) {
        // 예외를 다시 던지지 않으면 정상 종료로 판단할 수 있음
    }
}
```

롤백이 필요하다면 예외를 다시 던지거나 트랜잭션을 rollback-only 상태로 표시해야 한다.

---

## 9. 트랜잭션 전파

트랜잭션 전파(Propagation)는 이미 트랜잭션이 존재할 때 새로 호출된 메서드가 트랜잭션을 어떻게 사용할지 정하는 규칙이다.

| 옵션 | 설명 | 사용 예시 |
|---|---|---|
| `REQUIRED` | 기본값이다. 기존 트랜잭션이 있으면 참여하고, 없으면 새로 만든다. | 대부분의 Service 로직 |
| `REQUIRES_NEW` | 기존 트랜잭션을 일시 중단하고 항상 새로운 트랜잭션을 만든다. | 독립적으로 저장할 감사 로그 |

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void saveAuditLog(AuditLog log) {
    auditLogRepository.save(log);
}
```

`REQUIRES_NEW`는 별도 DB 커넥션을 추가로 사용할 수 있고, 내부 트랜잭션이 종료될 때까지 외부 트랜잭션이 보유한 자원도 유지된다. 남발하면 커넥션 부족이나 락 대기가 발생할 수 있다.

또한 내부 메서드 호출로는 전파 옵션이 적용되지 않으므로 별도 Bean을 통해 호출해야 한다.

---

## 10. 트랜잭션과 동시성 문제

여러 사용자나 프로세스가 같은 데이터를 동시에 조회하고 수정하면 데이터 불일치가 발생할 수 있다.

> `@Transactional`은 작업 범위를 묶어줄 뿐, 모든 동시성 문제를 자동으로 해결하지 않는다.

| 문제 | 설명 | 예시 |
|---|---|---|
| 갱신 손실(Lost Update) | 나중에 저장한 값이 먼저 저장한 값을 덮어쓴다. | 두 요청이 동시에 같은 포인트를 증가 |
| 더티 리드(Dirty Read) | 다른 트랜잭션이 아직 커밋하지 않은 값을 읽는다. | 곧 롤백될 임시 데이터를 조회 |
| 반복 읽기 불일치(Non-Repeatable Read) | 같은 행을 다시 읽었을 때 값이 달라진다. | 포인트가 첫 조회에서는 100, 다음 조회에서는 200 |
| 유령 읽기(Phantom Read) | 같은 조건으로 다시 조회했을 때 행의 개수가 달라진다. | 회원이 10명에서 11명으로 증가 |
| 경쟁 상태(Race Condition) | 실행 순서에 따라 비즈니스 결과가 달라진다. | 동시 재고 감소로 재고가 음수가 됨 |

### 격리 수준

격리 수준(Isolation Level)은 다른 트랜잭션의 변경 내용을 어느 범위까지 볼 수 있는지 정한다.

| 격리 수준 | 특징 |
|---|---|
| `READ_UNCOMMITTED` | 커밋하지 않은 데이터도 읽을 수 있다. |
| `READ_COMMITTED` | 커밋된 데이터만 읽는다. Dirty Read를 방지한다. |
| `REPEATABLE_READ` | 같은 행을 반복 조회할 때 같은 결과를 보장한다. |
| `SERIALIZABLE` | 트랜잭션을 순차 실행한 것처럼 강하게 격리한다. |

격리 수준을 높이면 정합성은 강해지지만 락 대기와 성능 비용이 증가할 수 있다.

Spring의 기본 설정인 `Isolation.DEFAULT`는 사용하는 데이터베이스의 기본 격리 수준을 따른다.

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public void process() {
    // DB 작업
}
```

---

## 락 

| 구분 | 낙관적 Lock | 비관적 Lock |
|---|---|---|
| 생각 | 충돌이 별로 없을 것 | 충돌이 자주 발생할 것 |
| DB 락 | 걸지 않음 | 직접 걸음 |
| 처리 방식 | 일단 작업 후 충돌 검사 | 먼저 잠근 후 작업 |
| 충돌 확인 | `version` 비교 | 접근 순서를 락으로 통제 |
| 다른 요청 | 바로 작업 가능 | 대기할 수 있음 |
| 충돌 발생 | 예외 발생, 재시도 필요 | 충돌 대신 대기 |
| 장점 | 성능과 동시 처리에 유리 | 데이터 충돌 방지에 강함 |
| 단점 | 충돌하면 작업을 다시 해야 함 | 대기, 타임아웃, 데드락 가능 |
| 사용 예 | 게시글, 회원 정보 | 재고 차감, 좌석 예약 |

## 11. 낙관적 락 

낙관적 락(Optimistic Lock)은 충돌이 자주 발생하지 않는다고 가정하고, DB 락 대신 버전 값으로 수정 충돌을 감지하는 방식이다.

Entity에 `@Version` 필드를 추가한다.

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

수정할 때 조회 당시의 버전을 조건으로 사용한다.

```sql
UPDATE product
SET stock = 9,
    version = 2
WHERE id = 1
  AND version = 1;
```

이미 다른 트랜잭션이 수정해 버전이 달라졌다면 수정되는 행이 없고, JPA는 낙관적 락 예외를 발생시킨다.

```text
A가 version = 1 조회
B가 version = 1 조회
        ↓
A가 수정하고 version = 2로 커밋
        ↓
B가 version = 1 조건으로 수정 시도
        ↓
충돌 감지 및 예외 발생
```

| 장점 | 단점 |
|---|---|
| DB 락을 오래 잡지 않아 읽기가 많은 환경에 유리하다. | 충돌 시 예외 처리와 재시도 로직이 필요하다. |

재시도할 때는 최신 데이터를 다시 조회하고 새 트랜잭션에서 비즈니스 조건을 다시 검사해야 한다. 무조건 반복하면 안 되며 재시도 횟수와 대기 시간을 제한해야 한다.

---

## 12. 비관적 락

비관적 락(Pessimistic Lock)은 충돌이 자주 발생한다고 가정하고, 데이터를 조회할 때 DB 락을 획득하는 방식이다.

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

| 락 모드 | 역할 |
|---|---|
| `PESSIMISTIC_WRITE` | 다른 트랜잭션의 수정이나 쓰기 락 획득을 제한한다. |
| `PESSIMISTIC_READ` | 다른 트랜잭션의 수정을 제한하며, 세부 동작은 DB에 따라 다르다. |
| `NONE` | 별도의 JPA 락을 요청하지 않는다. |

| 장점 | 단점 |
|---|---|
| 충돌이 잦은 상황에서 데이터를 안전하게 변경하기 쉽다. | 대기 시간 증가, 성능 저하, 데드락 가능성이 있다. |

락의 실제 동작 범위와 일반 조회 허용 여부는 데이터베이스 종류와 격리 수준에 따라 달라질 수 있다.

---

## 13. 동시성 해결 방법 선택

| 해결 방법 | 적합한 상황 |
|---|---|
| 낙관적 락 | 충돌은 드물고 읽기가 많은 일반적인 수정 |
| 비관적 락 | 재고 차감처럼 충돌이 자주 발생하는 작업 |
| 원자적 쿼리 | 단순한 증가나 감소를 한 SQL로 처리할 수 있는 작업 |
| 유니크 제약조건 | 이메일이나 주문 번호의 중복을 막는 작업 |
| 격리 수준 조정 | 트랜잭션 사이의 조회 일관성이 중요한 작업 |

단순 재고 감소는 조회 후 수정하는 대신 조건을 포함한 원자적 SQL로 처리할 수도 있다.

```sql
UPDATE product
SET stock = stock - 1
WHERE id = 1
  AND stock > 0;
```

수정된 행의 개수가 `0`이면 재고가 없거나 해당 상품이 없다는 뜻으로 처리한다.

---

## 핵심 정리

| 핵심 개념 | 한 줄 정리 |
|---|---|
| 트랜잭션 | 여러 DB 작업을 하나의 성공 또는 실패 단위로 묶는다. |
| `@Transactional` | Spring 프록시가 트랜잭션의 시작, 커밋, 롤백을 관리한다. |
| 트랜잭션 경계 | Repository 한 번이 아니라 Service의 비즈니스 작업 전체를 기준으로 잡는다. |
| 플러시 | 영속성 컨텍스트의 변경 내용을 SQL로 DB에 전달한다. |
| 롤백 | 기본적으로 `RuntimeException`과 `Error`가 밖으로 전달될 때 실행된다. |
| 전파 | 이미 존재하는 트랜잭션을 이어 쓸지 새로 만들지 정한다. |
| 격리 수준 | 다른 트랜잭션의 변경을 어디까지 볼 수 있는지 정한다. |
| 낙관적 락 | 버전으로 수정 충돌을 감지한다. |
| 비관적 락 | DB 락으로 다른 트랜잭션의 동시 수정을 제한한다. |

> `@Transactional`을 붙이는 것만으로 모든 문제가 해결되지는 않는다. 트랜잭션 범위, 롤백 규칙, 전파 방식, 격리 수준과 락 전략을 상황에 맞게 선택해야 한다.
