# JPA(Java Persistence API)

> JPA는 자바 객체와 데이터베이스 테이블을 매핑하여, SQL을 직접 작성하는 부담을 줄이고 객체 중심으로 데이터베이스를 다룰 수 있게 해주는 자바 표준이다.

쉽게 말하면 다음 두 세계를 연결해주는 규칙이다.

```text
Java 객체  ←──── JPA ────→  Database 테이블
```

---

## 1. 먼저 알아야 할 단어

| 단어 | 정의 | 쉬운 설명 |
|---|---|---|
| 데이터베이스(DB) | 데이터를 구조적으로 저장하고 관리하는 시스템 | 회원, 상품 등의 정보를 보관하는 곳 |
| 테이블(Table) | 데이터를 행과 열로 저장하는 구조 | 엑셀의 표와 비슷한 형태 |
| 행(Row) | 테이블에 저장된 데이터 한 건 | 회원 한 명의 정보 |
| 컬럼(Column) | 데이터의 속성 | 회원의 이름, 나이, 이메일 |
| 기본키(PK) | 각 행을 유일하게 구분하는 값 | 중복되지 않는 회원 번호 `id` |
| 외래키(FK) | 다른 테이블의 기본키를 참조하는 값 | 주문 테이블의 `user_id` |
| CRUD | 생성, 조회, 수정, 삭제 작업 | Create, Read, Update, Delete |
| SQL | 데이터베이스에 명령을 전달하는 언어 | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| 매핑(Mapping) | 서로 다른 두 대상을 연결하는 것 | `User.name`과 `users.name`을 연결 |
| 어노테이션 | 클래스나 필드에 추가 정보를 표시하는 문법 | `@Entity`, `@Id`, `@Column` |

---

## 2. ORM과 JPA

### ORM

ORM(Object-Relational Mapping)은 **객체와 관계형 데이터베이스 테이블을 연결하는 기술**이다.

| 자바 | 데이터베이스 |
|---|---|
| 클래스 | 테이블 |
| 객체(인스턴스) | 행(Row) |
| 필드 | 컬럼(Column) |

예를 들어 `User` 객체는 `users` 테이블과 다음처럼 연결할 수 있다.

```text
Java                    Database

User                    users
-------------------------------
id        ←────────→    id
name      ←────────→    name
age       ←────────→    age
```

### JPA

JPA는 자바에서 ORM을 사용하는 방법을 정한 **표준 명세**다.

JPA는 인터페이스와 어노테이션을 제공하지만, 실제 SQL을 만들어 실행하는 구현체는 아니다. 실제 동작은 주로 Hibernate가 담당한다.

| 기술 | 역할 |
|---|---|
| Spring Data JPA | Repository를 편하게 사용할 수 있도록 도와준다. |
| JPA | ORM을 사용하는 방법을 정의한 자바 표준이다. |
| Hibernate | JPA 표준을 실제로 구현한 라이브러리다. |
| JDBC | SQL을 데이터베이스에 전달하는 자바 API다. |
| Database | 데이터를 실제로 저장한다. H2, MySQL, PostgreSQL 등이 있다. |

전체 실행 흐름은 다음과 같다.

```text
Controller
    ↓
Service
    ↓
Repository
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

> 정확히 말하면 JPA 명세를 구현한 Hibernate가 객체 정보를 바탕으로 SQL을 만들고, JDBC를 통해 데이터베이스에 전달한다.

---

## 3. Entity

> `@Entity`는 "이 자바 클래스를 데이터베이스 테이블과 연결하겠다"라는 뜻이다.

Entity는 JPA가 관리하며 데이터베이스 테이블과 매핑되는 자바 클래스다. Entity 객체 하나는 보통 테이블의 행 하나를 나타낸다.

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    private int age;

    public User() {
    }
}
```

Entity 클래스에는 다음 조건이 필요하다.

- 클래스에 `@Entity`를 붙인다.
- `@Id`로 기본키를 지정한다.
- `public` 또는 `protected` 기본 생성자가 필요하다.
- 일반 클래스나 `enum`이어야 하며, `final` 클래스는 사용할 수 없다.

### 주요 어노테이션

| 어노테이션 | 역할 |
|---|---|
| `@Entity` | 클래스를 JPA Entity로 지정 |
| `@Table` | Entity와 연결할 테이블 이름 지정 |
| `@Id` | 기본키(PK) 지정 |
| `@GeneratedValue` | 기본키의 자동 생성 전략 지정 |
| `@Column` | 컬럼 이름, 길이, `NULL` 허용 여부 등을 설정 |
| `@Enumerated` | Enum을 데이터베이스에 저장하는 방식 지정 |
| `@Transient` | 데이터베이스에 저장하지 않을 필드 지정 |
| `@OneToOne` | 일대일 관계 매핑 |
| `@OneToMany` | 일대다 관계 매핑 |
| `@ManyToOne` | 다대일 관계 매핑 |
| `@ManyToMany` | 다대다 관계 매핑 |
| `@JoinColumn` | 외래키(FK) 컬럼 지정 |

### `@GeneratedValue`

`@GeneratedValue`는 기본키 값을 직접 넣지 않고 자동으로 생성하도록 설정한다.

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

`IDENTITY`는 기본키 생성을 데이터베이스에 맡기는 전략이다. 따라서 새로운 사용자를 만들 때 `id`를 직접 넣지 않아도 된다.

### `@Column`의 주요 속성

| 속성 | 설명 | 예시 |
|---|---|---|
| `name` | 연결할 컬럼 이름 | `@Column(name = "user_name")` |
| `nullable` | `NULL` 허용 여부 | `@Column(nullable = false)` |
| `length` | 문자열의 최대 길이 | `@Column(length = 50)` |
| `unique` | 값의 중복 허용 여부 | `@Column(unique = true)` |

---

## 4. Repository

Repository는 데이터베이스 접근을 담당한다.

Spring Data JPA의 `JpaRepository`를 상속하면 기본 CRUD 기능을 직접 구현하지 않아도 된다.

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

- `User`: Repository가 관리할 Entity 타입
- `Long`: `User` 기본키의 타입

구현 코드를 작성하지 않아도 다음 메서드를 사용할 수 있다.

```java
userRepository.save(user);       // 저장 또는 수정
userRepository.findById(1L);     // 기본키로 한 건 조회
userRepository.findAll();        // 전체 조회
userRepository.deleteById(1L);   // 기본키로 삭제
```

### 저장 흐름

```java
User user = new User();
user.setName("민형");
user.setAge(25);

userRepository.save(user);
```

개발자가 `INSERT` 문을 작성하지 않아도 Hibernate가 객체의 정보를 보고 대략 다음과 같은 SQL을 만든다.

```sql
INSERT INTO users (name, age)
VALUES ('민형', 25);
```

```text
userRepository.save(user)
          ↓
Hibernate가 INSERT SQL 생성
          ↓
JDBC가 SQL 전달
          ↓
Database에 저장
```

---

## 5. Spring MVC와 함께 보는 조회 흐름

클라이언트가 `GET /api/users/1`을 요청한다고 가정해보자.

### Controller

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }
}
```

### Service

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getUser(Long id) {
        return userRepository.findById(id).orElseThrow();
    }
}
```

### Repository

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

요청부터 조회까지의 흐름은 다음과 같다.

```text
GET /api/users/1
        ↓
Controller가 요청을 받음
        ↓
Service가 조회 로직 실행
        ↓
Repository의 findById(1L) 호출
        ↓
Hibernate가 SELECT SQL 생성
        ↓
Database에서 데이터 조회
        ↓
User 객체 반환
```

---

## 6. 영속성 컨텍스트와 변경 감지

### 영속성 컨텍스트

영속성(Persistence)은 프로그램이 종료되어도 데이터가 사라지지 않고 데이터베이스에 저장된 상태를 뜻한다.

영속성 컨텍스트(Persistence Context)는 **JPA가 Entity 객체를 관리하는 공간**이다.

```java
User user = userRepository.findById(1L).orElseThrow();
```

JPA가 데이터베이스에서 사용자를 조회하면 `User` 객체를 만들고 영속성 컨텍스트에서 관리한다.

```text
Database                    영속성 컨텍스트
id = 1                      User(id=1, name="민형")
name = 민형       →         객체의 상태를 추적
```

### 트랜잭션

트랜잭션(Transaction)은 여러 데이터베이스 작업을 하나의 작업 단위로 묶는 것이다.

작업이 모두 성공하면 반영하고, 중간에 문제가 생기면 이전 상태로 되돌린다.

### 변경 감지

변경 감지(Dirty Checking)는 영속성 컨텍스트가 관리하는 Entity의 값이 바뀌었는지 확인하고, 변경 내용을 자동으로 데이터베이스에 반영하는 기능이다.

```java
@Transactional
public void changeName(Long id) {
    User user = userRepository.findById(id).orElseThrow();
    user.setName("민농");
}
```

`save()`를 다시 호출하지 않았지만 트랜잭션이 정상적으로 끝나면 다음과 같은 `UPDATE` SQL이 실행될 수 있다.

```sql
UPDATE users
SET name = '민농'
WHERE id = 1;
```

실행 순서는 다음과 같다.

1. JPA가 `User`를 조회한다.
2. 영속성 컨텍스트가 `User`의 상태를 기억한다.
3. `user.setName()`으로 값을 변경한다.
4. 트랜잭션이 끝날 때 처음 상태와 현재 상태를 비교한다.
5. 변경된 값이 있으면 `UPDATE` SQL을 실행한다.

---

## 7. Entity 연관관계

연관관계는 테이블 사이의 관계를 자바 객체 사이의 관계로 표현하는 것이다.

예를 들어 여러 주문이 한 명의 사용자에게 속한다면 `Order`와 `User`는 다대일 관계다.

```java
@Entity
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
```

데이터베이스의 `orders` 테이블에는 `users` 테이블을 참조하는 외래키가 들어간다.

```text
orders
----------------
id
user_id  → users.id
```

---

## 8. JPA와 JDBC의 차이

JDBC는 SQL 중심으로 개발한다.

```java
String sql = "SELECT * FROM users WHERE id = ?";
```

JPA는 객체 중심으로 개발한다.

```java
userRepository.findById(id);
```

| JPA | JDBC |
|---|---|
| 객체와 테이블을 매핑한다. | SQL을 직접 작성하고 실행한다. |
| 반복적인 CRUD 코드를 줄일 수 있다. | 조회 결과를 객체로 직접 변환한다. |
| Hibernate가 SQL을 생성할 수 있다. | 개발자가 SQL을 직접 관리한다. |

JPA도 내부적으로 데이터베이스와 통신할 때 JDBC를 사용한다. 둘 중 하나만 존재하는 관계가 아니라, JPA가 JDBC를 더 편리하게 사용할 수 있도록 추상화한 구조에 가깝다.

---

## 9. H2 데이터베이스 연결 설정

H2는 자바로 만들어진 가벼운 관계형 데이터베이스다. 메모리 모드로 실행하면 애플리케이션을 종료할 때 데이터가 사라지므로 학습과 테스트에 자주 사용한다.

JPA와 데이터베이스 연결 정보는 `application.yml`에 작성한다.

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
| `datasource` | 연결할 데이터베이스의 주소와 계정 설정 |
| `ddl-auto` | Entity를 기준으로 테이블을 관리하는 방식 설정 |
| `create-drop` | 실행할 때 테이블을 만들고 종료할 때 삭제 |
| `show-sql` | Hibernate가 실행하는 SQL을 콘솔에 출력 |
| `h2.console.enabled` | H2 웹 콘솔 사용 여부 설정 |

---

## 핵심 정리

| 핵심 개념 | 한 줄 정리 |
|---|---|
| ORM | 자바 객체와 데이터베이스 테이블을 연결하는 기술 |
| JPA | 자바 ORM 사용법을 정의한 표준 |
| Hibernate | JPA를 실제로 동작하게 만드는 구현체 |
| Entity | 데이터베이스 테이블과 매핑되는 자바 클래스 |
| Repository | Entity의 CRUD를 담당하는 데이터 접근 계층 |
| 영속성 컨텍스트 | JPA가 Entity 객체를 관리하는 공간 |
| 변경 감지 | 관리 중인 Entity의 변경을 찾아 SQL에 반영하는 기능 |

> Entity를 만들고 Repository를 선언하면 Spring Data JPA와 Hibernate가 객체를 SQL로 변환하여 데이터베이스 작업을 처리해준다.
