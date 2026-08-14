# application.yaml

`application.yaml`은 Spring Boot 애플리케이션의 설정값을 모아두는 파일이다.

DB 연결 정보, JPA 설정, 서버 포트처럼 환경에 따라 바뀔 수 있는 값을 Java 코드와 분리해 관리한다.

## 기본 예시

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:

  jpa:
    hibernate:
      ddl-auto: create
```

### `spring`

Spring Boot 관련 설정의 시작이다.

### `datasource`

DB 연결 정보를 설정한다.

```yaml
url: jdbc:h2:mem:testdb
```

H2 메모리 DB인 `testdb`에 연결한다. 메모리 DB는 애플리케이션을 종료하면 데이터가 사라진다.

### `jpa`

JPA 관련 동작을 설정한다.

```yaml
ddl-auto: create
```

애플리케이션 시작 시 JPA가 Entity를 확인해 테이블을 생성한다. 예를 들어 `User` 클래스에 아래처럼 설정되어 있다면 `users` 테이블을 만들 수 있다.

```java
@Entity
@Table(name = "users")
public class User {
    // ...
}
```

## 실행 흐름

```text
application.yaml에서 DB, JPA 설정 제공
        ↓
Spring Boot 시작
        ↓
JPA가 설정과 User Entity 확인
        ↓
users 테이블 생성 또는 기존 DB에 연결
        ↓
UserRepository가 DB 작업 수행
```

## 환경별 프로필

개발, 테스트, 운영 환경은 DB 주소나 로그 설정이 다를 수 있다. 이때 프로필별 설정 파일을 나누어 관리한다.

```text
application-dev.yml   : 개발 환경
application-test.yml  : 테스트 환경
application-prod.yml  : 운영 환경
```

실행할 프로필은 `spring.profiles.active`로 선택한다.

```bash
# JVM 옵션으로 지정
java -Dspring.profiles.active=dev -jar skala-stock-api.jar

# Spring Boot 애플리케이션 옵션으로 지정
java -jar skala-stock-api.jar --spring.profiles.active=dev
```

`dev` 프로필을 선택하면 Spring Boot는 기본 `application.yml` 설정을 읽은 뒤, `application-dev.yml` 설정을 함께 적용한다.
