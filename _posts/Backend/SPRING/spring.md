# 1. Spring 

spring은

>  Java 객체를 대신 생성하고, 관리하고, 서로 연결해주며 웹이나 DB 같은 애플리케이션 기능까지 제공하는 프레임워크

Spring에서 가장 먼저 이해하는 핵심은

1. IoC Container
2. Bean 
3. DI 

Spring Container는 애플리케이션 객체를 생성하고 관리. 

@Component 
@Service 
@Controller 

같은 클래스 component Scanning을 통해 관리 대상으로 자동 탐지할 수 있다. 

원래 Java에서는 개발자가 직접 객체를 만든다. 

UserService service = new UserService(); 
UserController controller = new UserController(service)

개발자
 ↓
UserService 생성
 ↓
UserController 생성
 ↓
두 객체 연결

Spring에서는 이 작업을 SPring이 대신 할 수 있어. 

@Service 
public class UserService{} 

@RestController 
public class UserController{
    private final UserService userService; 

    public UserController(UserService userService) {
        this.userService = user.Service;
    }
}

개념적으로 springdl: 

spring 실행 

-> 클래스 탐색

@Service 발견 
-> UserService 객체 생성 

@RestController 발견
-> UserController

UseController 가 UserService 필요 
-> UserService 

# 2. Bean 

Spring이 새성하고 관리하는 객체를 Bean 

@Service 
public class UserService {} 

Spring이 UserService 객체 
-> Spring Container가 관리 
-> Spring Bean

new UserService();

했다고 무조건 Bean인 건 아니야 

내가 직접 new -> 일반 java 객체 
Spring Container가 생송하고 관리 -> Spring Bean 

# 3. IoC 는 뭐냐 

IoC는 Inversion of Control, 제어의 역전 

원래 Java: 

UserService service = new UserService(); 

개발자의 객체를 생성 

개발자 -> 객체 생성 및 관리 

Spring: 

@Service 
public clas UserService {
}

Spring 
-> 객체 생성 및 관리 

Spring Container로 넘어갔다고 해서 IoC

# 4. DI는 뭐냐 

DI는 Dependency Injection, 의존성 주입

UserController 가 UserService를 사용하고 있다.

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
}

UserController 입장에서는 

UserService가 필요함, 즉 의존성이 필요하다 

그런데 new UserService(); 하지 않는다. 

대신 Spring이 이미 관리하고 있는 UserService Bean을 넣는다. 

Spring Container

[UserService Bean]
       │
       │ DI
       ↓
[UserController Bean]

이게 DI

5. 그러면 Annotation은 Spring에서 왜 쓰는 가? 

Java Annotation은 기본적으로 

> 코드에 추가적인 메타데이터를 붙이는 기능 

Spring에서는 이 메타데이터를 보고; 

- 클래스를 관리해야겠다. 
- 이 메서드는 GET 요청을 처리해야겠다.
- 이 메서드는 Transaciton으로 처리해야겠다. 

같은 동작을 적용한다. Spring은 Stereotype annotation을 component Scanning에 사용하고, Spring MVC는 annotation을 이용해 HTTP 요청을 컨트롤러 메서드에 매핑 

Annotation
↓
Spring에게 정보 제공

Spring
↓
해당 정보를 해석

Spring 기능 적용

# 6. 가장 기본적인 @component

@Component 
public class EmailSender{} 

의 의미 

> EmailSender 를 Spring이 관리할 Component로 등록할 수 있도록 표시한다. 

Spring의 Component Scanning이 이런 클래스를 찾아 Bean으로 등록할 수 있다.

그리고 아주 중요한 구조가 있다. 

@Component
   ↑
   ├── @Service
   ├── @Repository
   └── @Controller

@Service, @Repository, @Controller도 Spring의 streotype annotation 이고, component scanning의 대상 

# 7. @service 

비즈니스 로직을 담당하는 클래스에 주로 붙인다 

@Service 
public class UserService {
    public void register(){
        System.out.println("회원가입");
    }
}

뜻은 

> 이 클래스는 Service 역할을 아며 Spring이 관리할 Bean이다. 

예를 들어 :

- 회원가입
- 로그인
- 주문
- 결제 
- 가격 계산 

같은 로직을 Service 계츨에 작성한다. 

# 8. @Repository 

@Repository 
public class UserRepsitory 