# Java의 AOP(Aspect Oriented Programming)

- AOP(관점 지향 프로그래밍)는 OOP(객체지향 프로그래밍)의 한계를 보완하는 프로그래밍 패러다임
  - OOP는 주로 "기능" 단위로 클래스를 구현
  - AOP는 공통 관심사(Aspect)를 모듈화하여 코드 중복을 줄이고 유지보수가 쉽도록 구현

## Aspect

> Spring AOP는 Proxy 기술을 이용해서 동작

- 로깅(Logging)
- 트랜잭션 처리(Transaction)
- 보안(Security)
- 성능 측정(Profiling)

### 전체 구조

```text
사용자 요청
   ↓
Proxy
   ↓
실제 Service Bean(Target)
```

예를 들어 실제 객체가

```java
@Service
public class StockService {

    public void buyStock() {
        System.out.println("주식 구매");
    }
}
```

여기에 로그를 담는 AOP를 붙이면 실제 호출 구조는 대략 이렇게 된다.

```text
Controller
   ↓
Proxy
   ↓
[Before Advice]
   ↓
StockService.buyStock()
   ↓
[After Advice]
```

> AOP는 원래의 비즈니스 코드를 건드리지 않고 공통 기능을 추가한다.

## 1. Aspect

```java
@Aspect
@Component
public class LoggingAspect {
}
```

> Aspect에는 AOP 관련 설정과 기능을 모아놓은 클래스

예를 들어 로그 기능을 담당하는 클래스

```java
@Aspect
@Component
public class LoggingAspect {
}
```

이 클래스 안에

- 어디에 적용할 것인지?
- 언제 실행할 것인지?
- 무엇을 실행할 것인지?

를 작성한다.

### `@Aspect`

Spring에게

> "이 클래스는 일반 클래스가 아니라 AOP 설정 클래스"

라고 알려준다.

### `@Component`

Spring에게

> "이 객체를 Bean으로 만들어서 관리해"

라고 알려준다.

```java
@Aspect
@Component
public class LoggingAspect {
}
```

> `LoggingAspect`를 Spring Bean으로 등록하고, 이 Bean을 AOP 설정으로 사용한다.

## 2. Pointcut

```java
@Pointcut("execution(* com.example.service.*.*(..))")
public void serviceMethods() {
}
```

Pointcut은

> AOP를 어떤 메서드에 적용할 것인가?

를 결정한다.

예를 들어

```text
execution(* com.example.service.*.*(..))
```

는 대략

- `com.example.service` 패키지 안에 있는
- 모든 클래스의
- 모든 메서드

를 대상으로 하겠다는 뜻이다.

```text
execution(
    *                         반환 타입 아무거나
    com.example.service.*    service 패키지의 모든 클래스
    .*                        모든 메서드
    (..)                      매개변수 개수와 타입 상관 없음
)
```

그래서

```java
@Pointcut("execution(* com.example.service.*.*(..))")
public void serviceMethods() {
}
```

는 사실 `serviceMethods()`라는 메서드를 실행하려는 것이 아니다.

> 이 조건을 `serviceMethods`라는 이름으로 부르겠다.

그래서 뒤에서 재탕 가능하다.

```java
@Before("serviceMethods()")
@After("serviceMethods()")
```

## 3. Advice

Advice가 가장 중요하다.

Advice는

> Pointcut으로 선택된 메서드의 어느 시점에 어떤 공통 기능을 실행할 것인가?

를 결정한다.

```java
@Before("serviceMethods()")
public void beforeAdvice(JoinPoint joinPoint) {
    System.out.println("실행 전");
}
```

```text
StockService.buyStock()
```

| 구분 | 역할 |
|---|---|
| Pointcut | 누구한테 적용할지 |
| Advice | 언제 무엇을 실행할지 |

## 4. `@Before`

```java
@Before("serviceMethods()")
public void beforeAdvice(JoinPoint joinPoint) {
    System.out.println("[Before] " + joinPoint.getSignature());
}
```

```text
beforeAdvice()
      ↓
실제 메서드
```

예를 들어

```java
stockService.buyStock();
```

호출하면

```text
[Before] void StockService.buyStock()
주식 구매
```

처럼 동작할 수 있다.

대표적으로 다음과 같은 것을 실행할 수 있다.

- 로그
- 권한 검사
- 입력값 확인

## 5. `@After`

```java
@After("serviceMethods()")
public void afterAdvice(JoinPoint joinPoint) {
    System.out.println("[After] " + joinPoint.getSignature());
}
```

실제 메서드 실행 이후에 동작한다.

```text
실제 메서드
     ↓
afterAdvice()
```

그래서 전체적으로 보면

```text
@Before
   ↓
실제 메서드
   ↓
@After
```

## 6. `@Around`

Around는 조금 특별하다.

```java
@Around("serviceMethods()")
public Object aroundAdvice(ProceedingJoinPoint joinPoint) throws Throwable {

    System.out.println("메서드 실행 전");

    Object result = joinPoint.proceed();

    System.out.println("메서드 실행 후");

    return result;
}
```

Around는 실제 메서드 실행 전체를 감싸는 Advice다.

```text
Around 시작
     ↓
메서드 실행 전 코드
     ↓
joinPoint.proceed()
     ↓
실제 Target 메서드
     ↓
메서드 실행 후 코드
     ↓
Around 종료
```

여기서 중요한 것은

```java
joinPoint.proceed();
```

를 실행하지 않으면 원래 메서드가 실행되지 않을 수도 있다는 것이다.

예를 들어서

```java
@Around("serviceMethods()")
public Object aroundAdvice(ProceedingJoinPoint joinPoint) {

    System.out.println("가로챔");

    return null;
}
```

이면

```text
Controller
   ↓
Proxy
   ↓
Around Advice
   ↓
끝
```

이 되어 `StockService`의 실제 메서드는 실행되지 않는다.

# AOP? Spring? Proxy

## 결론

> Spring AOP의 핵심 구현 방식이 Proxy다.

| 구분 | 역할 |
|---|---|
| AOP | 어떤 공통 기능을 어디에 적용할지 결정 |
| Proxy | 메서드 호출을 실제로 가로채는 객체 |
| Spring | 설정을 보고 Proxy를 자동 생성하고 관리 |

> Spring이 대상 객체를 감싸는 Proxy 객체를 자동으로 생성

```text
Controller
    ↓ 호출
Proxy 객체 ← Spring이 자동 생성
    ↓ ① 공통 기능 실행
실제 Service 객체
    ↓ ② 실제 메서드 실행
Proxy 객체
    ↓ ③ 공통 기능 실행
Controller에 결과 반환
```

예를 들어서 코드 예제를 들어보면

```java
@Service
public class OrderService {

    @Transactional
    public void order() {
        System.out.println("주문 처리");
    }
}
```

실제로 Controller가 주입받는 객체는 일반적으로 원본 `OrderService`가 아니라 원본을 감싼 Proxy다.

```text
원본 객체: OrderService

실제로 주입되는 객체: OrderService Proxy → OrderService
```

그래서 호출 흐름은 다음과 같다.

```text
order() 호출
    ↓
Proxy가 호출을 가로챈다.
    ↓
트랜잭션 시작
    ↓
실제 OrderService.order() 실행
    ↓
트랜잭션 커밋
    ↓
결과 반환
```
