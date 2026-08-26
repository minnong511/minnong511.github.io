---
layout: post
title: "Spring 기초 Part 6: JPA 연관관계 매핑"
description: "객체 참조와 외래키를 연결하고, 다대일, 일대다, 연관관계의 주인, mappedBy와 지연 로딩을 이해한다."
date: 2026-08-18 09:00:00 +0900
categories: [java, spring]
tags: [Java, Spring, JPA, Relationship Mapping, ManyToOne, OneToMany, Foreign Key]
series: "Spring 기초"
part: 6
legacyPath: "/java/spring/2026/08/18/jpa-relationship-mapping/"
---
## Spring 기초 Part 6: JPA 연관관계 매핑

> 연관관계 매핑은 자바 객체의 참조와 데이터베이스 테이블의 외래키를 연결하는 작업이다.

자바 객체는 다른 객체를 필드로 참조한다.

```java
member.getTeam();
```

관계형 데이터베이스는 외래키로 다른 테이블을 참조한다.

```text
members.team_id → teams.id
```

JPA는 이 두 관계를 어노테이션으로 연결한다.

---

### 1. 먼저 알아둘 단어

| 용어 | 정의 | 쉬운 설명 |
|---|---|---|
| 기본키(PK) | 테이블의 각 행을 유일하게 구분하는 값 | `teams.id` |
| 외래키(FK) | 다른 테이블의 기본키를 참조하는 컬럼 | `members.team_id` |
| 연관관계 | 한 객체나 테이블이 다른 대상과 연결된 관계 | 회원이 팀에 소속됨 |
| 다중성 | 관계에 참여하는 대상의 수 | 일대일, 일대다, 다대일, 다대다 |
| 방향성 | 객체에서 어느 방향으로 참조할 수 있는지 나타내는 것 | `Member → Team`, 또는 양쪽 모두 |
| 연관관계의 주인 | 외래키 값을 실제로 저장하고 변경하는 쪽 | `Member.team` |
| `mappedBy` | 주인이 아닌 쪽에서 주인 필드의 이름을 지정하는 속성 | `mappedBy = "team"` |
| Join | 외래키를 기준으로 여러 테이블의 데이터를 연결하는 것 | 회원과 팀을 함께 조회 |

---

### 2. 연관관계의 종류

| 어노테이션 | 관계 | 예시 |
|---|---|---|
| `@OneToOne` | 일대일(1:1) | 사용자와 프로필 |
| `@OneToMany` | 일대다(1:N) | 하나의 팀과 여러 회원 |
| `@ManyToOne` | 다대일(N:1) | 여러 회원과 하나의 팀 |
| `@ManyToMany` | 다대다(N:M) | 여러 사용자와 여러 관심 종목 |
| `@JoinColumn` | 외래키 컬럼 지정 | `team_id`, `user_id` |

실무에서는 다대다 관계를 바로 사용하기보다 중간 Entity로 분리하는 경우가 많다.

```text
User 1 ─── N Watchlist N ─── 1 Stock
```

중간 Entity를 만들면 등록 날짜, 알림 설정 같은 추가 정보도 저장할 수 있다.

---

### 3. 다대일 단방향 매핑

여러 회원이 하나의 팀에 소속된다고 해보자.

```text
Team 1  ←────  N Member
```

외래키는 보통 다수 쪽 테이블인 `members`에 둔다.

```text
teams                   members
-------------           ----------------
id (PK)       ←──────── team_id (FK)
name                    id (PK)
                        name
```

#### Team Entity

```java
@Entity
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    protected Team() {
    }
}
```

#### Member Entity

```java
@Entity
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    protected Member() {
    }

    public void changeTeam(Team team) {
        this.team = team;
    }
}
```

- `@ManyToOne`: 여러 `Member`가 하나의 `Team`과 연결된다.
- `@JoinColumn(name = "team_id")`: `members.team_id`를 외래키로 사용한다.
- `FetchType.LAZY`: `team`이 실제로 필요할 때 조회하도록 설정한다.

현재는 Member만 Team을 참조하므로 단방향 관계다.

```java
member.getTeam();  // 가능
team.getMembers(); // Team에 members 필드가 없으므로 불가능
```

---

### 4. 양방향 연관관계

Team에서도 소속 회원 목록을 조회하고 싶다면 `@OneToMany`를 추가한다.

```java
@Entity
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "team")
    private List<Member> members = new ArrayList<>();

    public List<Member> getMembers() {
        return members;
    }
}
```

이제 객체에서 양쪽 방향으로 이동할 수 있다.

```java
member.getTeam();  // Member → Team
team.getMembers(); // Team → Member
```

양방향 객체 관계라고 해서 DB 외래키가 두 개 생기는 것은 아니다.

```text
객체: Member ↔ Team
DB:   members.team_id → teams.id
```

---

### 5. 연관관계의 주인

객체에는 `Member.team`과 `Team.members`라는 참조가 두 개지만, DB 외래키는 `members.team_id` 하나다.

따라서 JPA는 어느 필드의 값을 기준으로 외래키를 변경할지 결정해야 한다. 외래키를 관리하는 쪽을 **연관관계의 주인**이라고 한다.

이 예제에서는 `Member.team`이 주인이다.

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "team_id")
private Team team;
```

주인이 아닌 `Team.members`에는 `mappedBy`를 작성한다.

```java
@OneToMany(mappedBy = "team")
private List<Member> members = new ArrayList<>();
```

`mappedBy = "team"`의 `team`은 DB 컬럼명이 아니라 **Member 클래스의 필드명**이다.

```java
private Team team;
             // ↑ 이 필드명
```

#### 외래키를 변경한다는 뜻

외래키를 변경한다는 것은 객체의 소속 관계를 바꾼다는 뜻이다.

```text
변경 전: members.team_id = 1
변경 후: members.team_id = 2
```

```java
member.changeTeam(team2);
```

JPA는 주인인 `Member.team`의 변경을 기준으로 `team_id`를 수정한다.

```sql
UPDATE members
SET team_id = 2
WHERE id = 1;
```

반대편 컬렉션만 변경하면 메모리의 목록은 바뀌지만 외래키 변경이 반영되지 않을 수 있다.

```java
team.getMembers().add(member); // 이것만으로는 부족함
```

---

### 6. 양쪽 객체를 함께 변경하기

DB 외래키는 주인 쪽 값으로 변경되지만, 현재 메모리의 두 객체도 일치시키는 것이 안전하다.

```java
public void changeTeam(Team newTeam) {
    if (this.team != null) {
        this.team.getMembers().remove(this);
    }

    this.team = newTeam;

    if (newTeam != null) {
        newTeam.getMembers().add(this);
    }
}
```

```java
member.changeTeam(team);
```

```text
Member.team에 Team 저장
          ↓
Team.members에 Member 추가
          ↓
메모리의 양쪽 관계 일치
          ↓
members.team_id 변경
```

이런 메서드를 연관관계 편의 메서드라고 한다. 양쪽 메서드가 서로를 계속 호출하면 무한 호출이 발생할 수 있으므로 한쪽에서 관계를 관리한다.

---

### 7. 지연 로딩

지연 로딩(Lazy Loading)은 연관된 Entity를 처음부터 조회하지 않고 실제로 사용할 때 조회하는 방식이다.

```java
@ManyToOne(fetch = FetchType.LAZY)
private Team team;
```

```text
Member 조회
    ↓
Team은 아직 조회하지 않음
    ↓
member.getTeam() 사용
    ↓
필요한 Team 조회
```

즉시 로딩(Eager Loading)은 원래 Entity를 조회할 때 연관된 Entity도 함께 조회한다.

연관관계를 무조건 즉시 로딩하면 예상하지 못한 SQL이 많이 실행될 수 있으므로 일반적으로 지연 로딩을 우선 사용하고, 필요한 조회에서 fetch join이나 EntityGraph 등을 명시적으로 고려한다.

지연 로딩된 Entity를 영속성 컨텍스트가 끝난 뒤 접근하면 예외가 발생할 수 있으므로 Service 안에서 필요한 데이터를 DTO로 변환하는 방식이 안전하다.

---

### 8. `cascade`와 `orphanRemoval`

#### `cascade`

영속성 전이(Cascade)는 부모 Entity의 저장이나 삭제 작업을 연관된 Entity에도 전달한다.

```java
@OneToMany(mappedBy = "team", cascade = CascadeType.ALL)
private List<Member> members = new ArrayList<>();
```

연관되어 있다는 이유만으로 무조건 사용하면 안 된다. 두 Entity의 생명주기를 함께 관리할 때 사용한다.

#### `orphanRemoval`

고아 객체 제거는 부모 컬렉션에서 제거된 자식 Entity를 DB에서도 삭제하는 기능이다.

```java
@OneToMany(mappedBy = "team", orphanRemoval = true)
private List<Member> members = new ArrayList<>();
```

단순히 관계만 끊으려는 상황에서도 데이터가 삭제될 수 있으므로 주의해야 한다.

---

### 핵심 정리

| 개념 | 한 줄 정리 |
|---|---|
| 연관관계 매핑 | 객체 참조와 테이블 외래키를 연결 |
| 다중성 | `1:1`, `1:N`, `N:1`, `N:M`처럼 관계의 수를 표현 |
| 방향성 | 객체가 한쪽 또는 양쪽으로 참조할 수 있는지 표현 |
| 연관관계의 주인 | 외래키 값을 실제로 저장하고 변경하는 쪽 |
| `mappedBy` | 주인이 아닌 쪽에서 주인 필드명을 지정 |
| 지연 로딩 | 연관 Entity가 실제로 필요할 때 조회 |
| `cascade` | 영속성 작업을 연관 Entity에 전달 |
| `orphanRemoval` | 관계에서 제거된 자식 Entity를 DB에서도 삭제 |

> Team과 Member의 양방향 관계에서는 외래키 `team_id`가 있는 `Member.team`이 연관관계의 주인이다.

### 참고 자료

- [Jakarta Persistence 공식 명세](https://jakarta.ee/specifications/persistence/)
- [Hibernate ORM User Guide](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html)
