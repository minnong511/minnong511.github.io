# Spring MVC 

> Spring MVC는 HTTP 요청을 Controller가 받아 처리하고, 비즈니스 로직과 데이터를 거쳐 결과를 View 또는 JSON 형태로 반환하는 웹 애플리케이션 구조 

## MVC가 뭔데 

- MVC는 세 가지 역할을 분리 

| 구성 | 역할 | Spring에서 예 |
|---|---|---|
| Model | 데이터와 비즈니스 데이터 | DTO, Entity, Service 결과 |
| View | 사용자에게 보여주는 화면 | HTML, Thymeleaf |
| Controller | 요청을 받고 적절한 로직을 호출 | `@RestController`, `@Controller` |

Controller : 사용자 요청
->
Service : 그 요청을 어떻게 처리하지? 
-> 
Repository : 필요한 데이터는 DB에서 가져오자 
-> 
Model : 처리한 데이터를 담자 
-> 
View / JSON : 사용자에게 결과를 보여주자 

Spring에서는 실제로 MVC보다 조금 더 세분화해서 쓴다. 

Client 
Controller 
Service 
Repository 
Database -> 여기서 추출하고
Repository
Service 
Controller 
JSON Response 
Client 

# 1. 가장 앞에는 Client

브라우저에서 vue에서 

GET /api/hello 

를 요청했다고 치자 

여기서 Client는 
- 브라우저 
- Vue
- React 
- Android
- Postman 

등이 될 수 있다. 
그런데 요청이 바로 Controller로 가는 것이 아니다. 

# 2. DispatcherServlet 

Spring MVC에서 제일 중요한 녀석 중 하나 

Client
->
Dispatcher
-> 
Controller 

DispatcherServlet은 모든 요청을 앞에서 받아주는 중앙 관제소 

예를 들어 

GET /api/hello 가 들어오면 DispatcherServlet이 먼저 받는다. 

그리고 
> /api/hello  처리할 Controller를 결정한다. 

그래서 Spring MVC를 Front Controller Pattern 이라고 한다. 

즉 여러 Controller가 요청을 각각 직접 받는 게 아니라 

              ┌→ UserController
Client → DispatcherServlet → ProductController
              └→ HelloController

DispatcherServlet이 먼저 받고 적절한 Controller로 분배

# 3. HandlerMapping 

그런데 DispatcherServlet이 직접 모든 Controller 주소를 외우는 것이 아니다. 

그렇다면 어떻게 알까?

DispatcherServlet

"/api/hello 누가 처리하지?"

        ↓

HandlerMapping

        ↓

HelloController.helloWorld()

왜 알 수 있을까? 

내가 이미 @으로 설정을 해놓아서 알 수 있다. 

@RequestMapping("/api")

그리고 

@GetMapping("/hello") 가 있기 때문에 dispatchServlet이 잘 찾아갈 수 있다. 

아무튼 이렇게 해놓으면 Spring이 애플리케이션 실행 시 이 정보를 미리 등록해놓는다.

GET /api/hello
     ↓
HelloController.helloWorld()

라는 매칭 정보를 갖고 있는 것이다. 

# 4. Controller



DispatchServlet에 의해 적절한 Controller가 결정

Controller의 핵심 역할 
> HTTP 요청을 받고 필요한 비즈니스 로직을 호출한 뒤 결과를 반환하는 것 

중요한 건 Controller에 모든 로직을 집어넣지 않는 것 

# 5.Service 


# 전체 Spring MVC 요청 흐름

[Client]
브라우저 / Vue / React / Postman

        ↓ HTTP Request

[DispatcherServlet]
모든 요청을 먼저 받음

        ↓

[HandlerMapping]
어떤 Controller인지 검색

        ↓

[Controller]
요청을 받음

        ↓

[Service]
비즈니스 로직 수행

        ↓

[Repository]
DB 접근

        ↓

[Database]

        ↓

[Repository]

        ↓

[Service]

        ↓

[Controller]

        ↓

[Spring / Jackson]
Java Object → JSON

        ↓ HTTP Response

[Client]

# @Controller와 @RestController 차이

일반 MVC

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "home";
    }
}

이 경우 

return "home"

은 데이터 "home"을 보내라는 뜻이 아니라:
home.html 같은 View를 찾아라

Controller
↓
ViewResolver
↓
home.html
↓
HTML Response

### REST API 

@RestController

return response;

가 그대로 Response Body 데이터가 된다.

Controller
↓
Jackson
↓
JSON
↓
HTTP Response

그래서 현대적인 

Vue
React
Android
iOS

와 Spring Boot를 연결할 때는 @RestController를 아주 많이 사용

# 계층 구조

Spring MVC 자체의 핵심 구조

Model
View
Controller

이고, 실무에서는 유지보수를 위해 Model 측의 책임을 더 나눠서 

Controller
↓
Service
↓
Repository

Layered Architecture를 함께 사용

Spring MVC + Layered Architecture

# 결론 

DispatcherServlet
→ 요청 총괄

Controller
→ 요청과 응답 담당

Service
→ 비즈니스 로직

Repository
→ DB 접근

Model / DTO / Entity
→ 데이터 표현

Jackson
→ Java 객체를 JSON으로 변환