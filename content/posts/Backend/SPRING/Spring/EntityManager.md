---
layout: post
title: "EntityManager"
description: "@Entity public class User{ @Id @GenerativeValue"
date: "2026-08-14 17:44:25 +0900"
categories: ["Backend", "SPRING", "Spring"]
tags: []
legacyPath: "/backend/spring/spring/2026/08/14/EntityManager/"
---
# EntityManager

> JPA에서 자바 객체(Entity)를 데이터베이스와 연결하고 관리하는 관리자 

@Entity 
public class User{
    @Id 
    @GenerativeValue 

    private Long id; 
    private String name; 
}

entityManager.persist(user);

JPA는 이 요청을 바탕으로 다음과 같은 SQL을 실행

INSERT INTO user (name) VALUES ('민형');

| 메서드 | 역할 | SQL 관점 |
|---|---|---|
| `persist(entity)` | 새로운 엔티티 저장 | `INSERT` |
| `find(Entity.class, id)` | 기본키로 조회 | `SELECT` |
| `remove(entity)` | 엔티티 삭제 | `DELETE` |
| `merge(entity)` | 분리된 엔티티의 값을 반영 | 보통 `SELECT`, `UPDATE` |
| `flush()` | 변경 내용을 즉시 DB에 전달 | 쓰기 SQL 실행 |
| `clear()` | 영속성 컨텍스트 초기화 | 관리 중인 객체 분리 |

## 사용 예제 

@Repository 
public class UserRepository {
    @PersistenceContext 
    private EntityManager entityManger; 

    public void save(User user){
        entityManager.persist(user); 
    }

    public User findById(Long id) {
        return entityManager.find(User.class, id);
    }

    public void delete(User user) {
        entityManager.remove(user);
    }
}

서비스에서 트랜젝션을 시작해서 

@Service 
@RequiredArgsConstructor 

public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public void createUser(String name) {
        User user = new User(name);
        userRepository.save(user);
    }
}

Controller
  → UserService.createUser()
  → 트랜잭션 시작
  → EntityManager.persist(user)
  → 영속성 컨텍스트에서 user 관리
  → 트랜잭션 종료
  → INSERT SQL 실행
  → DB 저장

# 영속성 컨텍스트

EntityManager는 조회하거나 저장한 엔티티를 영속성 컨텍스트라는 임시 관리 공간에서 관리

@Transactional
public void changeName(Long id) {
    User user = entityManager.find(User.class, id);
    user.setName("김민형");
}

여기에는 update()나 persist()가 없습니다. 하지만 트랜잭션이 끝날 때 JPA가 처음 상태와 현재 상태를 비교해 자동으로 SQL을 실행

UPDATE user
SET name = '김민형'
WHERE id = ?;

이 기능을 변경 감지(Dirty Checking)

# JpaRepository와의 관계

Spring Data JPA에서 사용하는 JpaRepository도 내부적으로 EntityManager를 이용

public interface UserRepository
        extends JpaRepository<User, Long> {
}

userRepository.save(user);
userRepository.findById(id);
userRepository.delete(user);

관계는 이렇게 볼 수 있다. 

내 코드
  → JpaRepository
  → EntityManager
  → JPA 구현체(Hibernate)
  → SQL
  → Database

# 결론 

> EntityManager는 엔티티의 저장, 조회, 수정, 삭제와 생명주기를 관리하는 JPA의 핵심 객체입니다.
특히 트랜잭션 안에서 엔티티의 변경을 감지하고 SQL을 자동으로 실행




----- 

# JPA 영속성 관리 - 

EntityManager - 엔터티 객체를 추적하면서 DB 저장, 조회, 수정, 삭제 

> 영속성 컨텍스트는 엔터티를 보관하고 관찰하는 작업 공간, EntityManager는 그 작업 공간을 관리하는 관리자 

# 1. 전체 구조 
Java 코드
   ↓
EntityManager
   ↓
영속성 컨텍스트
   ↓ SQL
데이터베이스

영속성 컨텍스트는 실제 폴더나 DB가 아니라, JPA가 엔터티를 관리하기 위해 사용하는 논리적인 메모리 공간 

# 2. 엔터티의 네 가지 상태 

## 비영속 상태 

아직 JPA가 관리하지 않는 일반 자바 객체

User user = new User("민형");

자바 메모리: User 객체 존재
영속성 컨텍스트: 등록되지 않음
DB: 저장되지 않음

## 영속 상태 

persist()하거나 DB에서 조회하여 EntityManager가 관리하는 상태

entityManager.persist(user); 

다음처럼 조회해도 영속 상태

User user = entityManager.find(User.class, 1L);

이제 JPA는 user 객체의 변경 내용을 추적

## 준영속 상태 

한때 관리되었지만, 현재 영속성 컨텍스트에서 분리된 상태

entityManager.detach(user);
전체 엔티티를 분리할 수도 있습니다.
entityManager.clear();
영속성 컨텍스트 자체를 종료하면 모든 엔티티가 분리
entityManager.close();entityManager.detach(user);
준영속 객체의 값을 변경해도 JPA는 추적하지 않습니다.
user.setName("홍길동"); // 자동 UPDATE 안 됨

### 삭제 상태 

DB에서 삭제하도록 등록된 상태 

entityManager.remove(user);

트랜잭션이 반영될 때 DELETE SQL이 실행

3. 상태 변화 

new User()
   │
   │ persist()
   ▼
비영속 ─────────→ 영속
                   │  │
          remove() │  │ detach(), clear(), close()
                   ▼  ▼
                 삭제  준영속
                        │
                        │ merge()
                        ▼
                       영속

주의할 점은 merge()가 전달받은 객체 자체를 다시 영속 상태로 만드는 것이 아니라는 것

User managedUser = entityManager.merge(detachedUser);

detachedUser → 여전히 준영속
managedUser  → 새로운 영속 객체

따라서 반환값을 사용해야 한다. 

# 4. 영속성 관리의 주요 기능

1차 캐시 

영속성 컨텍스트는 조회한 엔터티를 내부에 보관 

User user1 = entityManager.find(User.class, 1L);
User user2 = entityManager.find(User.class, 1L);

실행 흐름: 

첫 번째 find()
→ 1차 캐시에 없음
→ DB SELECT
→ 조회 결과를 1차 캐시에 보관

두 번째 find()
→ 1차 캐시에서 발견
→ DB 조회 생략

같은 트랜잭션과 영속성 컨텍스트 안에서는 같은 객체가 반환

System.out.println(user1 == user2); // true

이를 동일성 보장

## 변경 감지 

영속 상태인 엔티티의 값을 변경하면 JPA가 자동으로 UPDATE를 실행

@Transactional
public void changeName(Long id) {
    User user = entityManager.find(User.class, id);
    user.setName("김민형");
}

save()나 update()를 호출하지 않아도 됨

1. User 조회
2. 조회 당시 상태를 스냅샷으로 저장
3. user.setName() 실행
4. 트랜잭션 종료
5. 현재 상태와 스냅샷 비교
6. 변경 발견
7. UPDATE SQL 실행

UPDATE users
SET name = '김민형'
WHERE id = 1;

단 변경 감지는 영속 상태의 엔터티에만 적용 

쓰기 지연 

persist()를 호출했다고 항상 그 순간 INSERT가 실행되는 것은 아니다.

entityManager.persist(user1);
entityManager.persist(user2);

JPA는 SQL을 쓰기 지연 저장소에 모아두었다가 flush() 시점에 DB

persist(user1) → INSERT SQL 보관
persist(user2) → INSERT SQL 보관
flush          → SQL을 DB에 전송
commit         → 트랜잭션 확정

단, 기본키 생성 전략에 따라 persist() 시점에 INSERT가 먼저 실행될 수 있다. 

## 지연 로딩 

연관된 엔터티를 실제로 사용할 떄 조회하는 기능 

Order order = entityManager.find(Order.class, 1L);

// 이때 연관된 Member를 조회할 수 있음
String memberName = order.getMember().getName();

Member가 필요한 순간 추가 SELECT가 실행

## flush()와 commit()의 차이

entityManager.flush();

flush()는 영속성 컨텍스트의 변경 내용을 DB에 SQL로 전달합니다. 하지만 트랜잭션을 확정하지는 않는다. 

flush  = SQL을 DB에 전달
commit = 트랜잭션을 최종 확정

flush() 후 문제가 생겨 롤백되면 DB 변경도 취소 

보통 @Transactional 메서드가 정상 종료될 때 다음 과정이 자동으로 진행

@Transactional 메서드 종료
→ flush
→ SQL 실행
→ commit

# 6. 실제 서비스 실행 흐름

@Transactional
public void updateUser(Long id, String newName) {
    User user = entityManager.find(User.class, id);
    user.setName(newName);
}

실행 흐름은  다음과 같다

1. @Transactional로 트랜잭션 시작
2. EntityManager가 영속성 컨텍스트 생성 또는 사용
3. find()로 User 조회
4. User가 영속 상태가 됨
5. setName()으로 값 변경
6. 트랜잭션 종료 시 변경 감지
7. UPDATE SQL 실행
8. commit
9. 영속성 컨텍스트 종료
10. User는 준영속 상태가 됨

@Transactional
public void changeName(Long id) {
    User user = entityManager.find(User.class, id); // 영속 상태
    user.setName("변경 이름");                      // 변경 감지
}
