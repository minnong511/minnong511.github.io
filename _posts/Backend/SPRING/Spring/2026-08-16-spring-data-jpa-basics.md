---
layout: post
title: "Spring 기초 Part 4: JPA, Entity와 Repository"
description: "ORM, JPA, Hibernate, Entity, Repository의 역할과 Spring Data JPA의 기본 CRUD 흐름을 정리한다."
date: 2026-08-16 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, Spring Boot, JPA, Hibernate, Spring Data JPA, Entity]
series: "Spring 기초"
part: 4
---

## Spring 기초 Part 4: JPA, Entity와 Repository

> JPA는 자바 객체와 데이터베이스 테이블을 매핑하여 객체 중심으로 데이터를 다룰 수 있게 해주는 자바 표준이다.

개발자는 Entity와 Repository를 작성하고, JPA 구현체는 객체 정보를 바탕으로 SQL을 만든다.

```text
Java 객체
   ↓
Spring Data JPA
   ↓
JPA
   ↓
Hibernate
   ↓
JDBC
   ↓
Database
```

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉽게 말하면 |
|---|---|---|
| 관계형 데이터베이스 | 데이터를 테이블 사이의 관계로 저장하는 시스템 | H2, MySQL, PostgreSQL |
| 테이블 | 데이터를 행과 열로 저장하는 구조 | 사용자 목록을 저장하는 표 |
| 행(Row) | 테이블에 저장된 데이터 한 건 | 사용자 한 명 |
| 컬럼(Column) | 데이터가 가지는 속성 | 이름, 이메일, 나이 |
| 기본키(PK) | 각 행을 유일하게 구분하는 값 | 사용자 `id` |
| ORM | 객체와 관계형 테이블을 연결하는 기술 | `User`와 `users`를 연결 |
| JPA | 자바 ORM 사용법을 정의한 표준 | Entity와 관련 어노테이션 규칙 |
| Hibernate | JPA 표준을 실제로 구현한 라이브러리 | 객체를 보고 SQL을 생성 |
| JDBC | 자바가 DB에 SQL을 전달하는 API | Hibernate가 생성한 SQL 전달 |
| Entity | JPA가 관리하고 테이블과 매핑하는 객체 | `User` 클래스 |
| Repository | 데이터 저장과 조회를 담당하는 계층 | `UserRepository` |

---

### 2. ORM은 왜 필요한가

자바는 객체를 사용하고 관계형 데이터베이스는 테이블을 사용한다.

| 자바 객체 | 데이터베이스 |
|---|---|
| 클래스 | 테이블 |
| 객체 | 행 |
| 필드 | 컬럼 |
| 객체 참조 | 외래키 |

두 구조가 다르기 때문에 JDBC만 사용하면 SQL 작성과 결과 변환을 직접 처리해야 한다.

```java
String sql = "SELECT id, name, email FROM users WHERE id = ?";

// Connection, PreparedStatement, ResultSet 처리
// ResultSet 값을 꺼내 User 객체로 직접 변환
```

ORM을 사용하면 매핑 정보를 기준으로 반복 코드를 줄일 수 있다.

```java
User user = userRepository.findById(id).orElseThrow();
```

ORM이 SQL 지식을 없애주는 것은 아니다. 생성되는 SQL과 데이터베이스 구조를 이해해야 성능 문제를 찾을 수 있다.

---

### 3. JPA, Hibernate, Spring Data JPA의 차이

세 단어는 같은 뜻이 아니다.

| 구분 | 역할 |
|---|---|
| JPA | ORM을 사용하는 인터페이스와 어노테이션을 정의한 표준 |
| Hibernate | JPA 표준을 구현하여 실제 SQL을 생성하고 Entity를 관리 |
| Spring Data JPA | Repository 인터페이스를 쉽게 작성하도록 도와주는 Spring 프로젝트 |

```text
개발자가 UserRepository 호출
          ↓
Spring Data JPA가 Repository 구현 제공
          ↓
JPA 표준 방식으로 Entity 관리 요청
          ↓
Hibernate가 SQL 생성
          ↓
JDBC가 DB에 SQL 전달
```

> JPA는 규칙이고, Hibernate는 그 규칙의 구현체이며, Spring Data JPA는 JPA를 편하게 사용하도록 도와준다.

---

### 4. Entity 만들기

```java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    protected User() {
    }

    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
}
```

Entity 클래스에는 다음 조건이 필요하다.

- 클래스에 `@Entity`를 붙인다.
- `@Id`로 기본키를 지정한다.
- JPA가 사용할 `public` 또는 `protected` 기본 생성자가 필요하다.
- Entity 클래스 자체를 `final`로 선언하지 않는다.

#### 주요 어노테이션

| 어노테이션 | 역할 |
|---|---|
| `@Entity` | 클래스를 JPA가 관리할 Entity로 지정 |
| `@Table` | 매핑할 테이블 이름 지정 |
| `@Id` | 기본키 필드 지정 |
| `@GeneratedValue` | 기본키 자동 생성 전략 지정 |
| `@Column` | 컬럼 이름과 제약조건 설정 |
| `@Enumerated` | Enum을 저장할 방식 지정 |
| `@Transient` | DB 컬럼과 매핑하지 않을 필드 지정 |

#### `@GeneratedValue`

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

`IDENTITY` 전략은 기본키 생성을 데이터베이스에 맡긴다. 새로운 사용자를 만들 때 개발자가 `id`를 직접 지정하지 않는다.

#### `@Column`

| 속성 | 의미 | 예시 |
|---|---|---|
| `name` | 매핑할 컬럼명 | `@Column(name = "user_name")` |
| `nullable` | `NULL` 허용 여부 | `@Column(nullable = false)` |
| `length` | 문자열 컬럼 길이 | `@Column(length = 50)` |
| `unique` | 중복 허용 여부 | `@Column(unique = true)` |

`@Column` 설정만 믿기보다 운영 DB에는 마이그레이션 도구 등을 이용해 실제 제약조건도 함께 관리해야 한다.

---

### 5. Repository 만들기

Spring Data JPA의 `JpaRepository`를 상속하면 기본 CRUD 기능을 사용할 수 있다.

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

두 타입의 의미는 다음과 같다.

- `User`: Repository가 관리할 Entity 타입
- `Long`: `User`의 기본키 타입

기본 제공 메서드는 다음과 같다.

| 메서드 | 역할 |
|---|---|
| `save(entity)` | 새 Entity 저장 또는 기존 Entity 반영 |
| `findById(id)` | 기본키로 한 건 조회 |
| `findAll()` | 전체 조회 |
| `existsById(id)` | 기본키에 해당하는 데이터 존재 여부 확인 |
| `delete(entity)` | Entity 삭제 |
| `deleteById(id)` | 기본키로 삭제 |

메서드 이름을 분석해 조회 조건을 만들 수도 있다.

```java
Optional<User> findByEmail(String email);

boolean existsByEmail(String email);

List<User> findByNameContaining(String keyword);
```

---

### 6. 사용자 저장 흐름

#### Service

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public Long createUser(String name, String email) {
        User user = new User(name, email);
        User savedUser = userRepository.save(user);
        return savedUser.getId();
    }
}
```

실행 흐름은 다음과 같다.

{% capture jpa_save_flow %}
flowchart TD
    S[Service가 User 생성] --> R[UserRepository.save 호출]
    R --> SD[Spring Data JPA]
    SD --> H[Hibernate가 Entity 관리]
    H --> SQL[INSERT SQL 생성]
    SQL --> J[JDBC가 SQL 전달]
    J --> DB[(Database 저장)]
{% endcapture %}

{% include library/mermaid-diagram.html
  title="Spring Data JPA 저장 흐름"
  chart=jpa_save_flow
%}

Hibernate는 Entity의 매핑 정보를 보고 대략 다음과 같은 SQL을 실행한다.

```sql
INSERT INTO users (name, email)
VALUES ('민형', 'min@example.com');
```

---

### 7. JPA와 JDBC 비교

| JPA | JDBC |
|---|---|
| 객체와 테이블을 매핑한다. | SQL을 직접 작성한다. |
| 반복적인 CRUD 코드를 줄인다. | 결과를 객체로 직접 변환한다. |
| 변경 감지와 연관관계 기능을 제공한다. | 실행 흐름이 SQL 중심으로 명확하다. |
| 잘못 사용하면 예상하지 못한 SQL이 발생할 수 있다. | 반복 코드가 많아질 수 있다. |

JPA도 내부적으로 JDBC를 사용해 SQL을 전달한다.

```text
JPA와 JDBC 중 하나만 선택
```

이 아니라 다음 구조에 가깝다.

```text
JPA / Hibernate
      ↓
    JDBC
      ↓
  Database
```

---

### 8. H2 연결 설정

H2는 학습과 테스트에 많이 사용하는 가벼운 관계형 데이터베이스다.

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:

  h2:
    console:
      enabled: true
      path: /h2-console

  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
```

| 설정 | 역할 |
|---|---|
| `datasource` | 연결할 DB 주소와 계정 설정 |
| `ddl-auto` | Entity를 기준으로 테이블을 관리하는 방식 설정 |
| `create-drop` | 시작할 때 생성하고 종료할 때 삭제 |
| `show-sql` | Hibernate가 실행하는 SQL 출력 |
| `h2.console.enabled` | H2 웹 콘솔 활성화 |

`create-drop`은 애플리케이션 종료 시 테이블을 삭제하므로 운영 환경에서 사용하면 안 된다.

---

### 핵심 정리

| 개념 | 한 줄 정리 |
|---|---|
| ORM | 자바 객체와 관계형 테이블을 연결하는 기술 |
| JPA | 자바 ORM 사용법을 정의한 표준 |
| Hibernate | JPA를 실제로 구현한 라이브러리 |
| Spring Data JPA | Repository 작성을 편하게 도와주는 Spring 프로젝트 |
| Entity | JPA가 관리하며 테이블과 매핑되는 객체 |
| Repository | Entity의 저장과 조회를 담당하는 데이터 접근 계층 |

> JPA를 사용한다는 것은 SQL을 몰라도 된다는 뜻이 아니라, 객체와 테이블의 매핑을 이용해 반복적인 데이터 접근 코드를 줄인다는 뜻이다.

### 참고 자료

- [Spring Data JPA 공식 문서](https://docs.spring.io/spring-data/jpa/reference/)
- [Jakarta Persistence 공식 명세](https://jakarta.ee/specifications/persistence/)
