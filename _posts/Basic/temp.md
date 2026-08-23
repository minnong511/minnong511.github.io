너는 시니어 풀스택 개발자이자 기술 교육 콘텐츠 설계자다.

목표는 개발 공부를 시작한 사람이 자주 마주치는 기술 용어를 빠르게 이해할 수 있도록 하는 **개발자 핵심 용어 사전 웹페이지**를 만드는 것이다.

대상 사용자는 컴퓨터공학 전공 지식이 깊지 않지만 Java, Spring Boot, Docker, SQL, 프론트엔드, 머신러닝을 공부하고 있는 초급~중급 개발자다.

페이지는 단순한 영어 단어 사전이 아니라, 실제 개발 문서와 강의에서 자주 등장하는 용어를 **직관적인 설명 + 실전 예시 + 관련 개념 연결**을 통해 학습할 수 있도록 구성한다.

# 1. 기술 스택

가능하면 다음 구성을 사용한다.

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

별도의 백엔드는 필요 없다.

용어 데이터는 우선 TypeScript 객체 또는 JSON 파일에 저장하고, 추후 API나 DB로 교체하기 쉽게 구조화한다.

# 2. 전체 카테고리

다음 카테고리를 만든다.

## Common / CS

모든 개발 분야에서 공통으로 사용하는 핵심 용어.

예시:

- Abstraction
- Encapsulation
- Dependency
- Runtime
- Lifecycle
- Overhead
- Latency
- Throughput
- Bottleneck
- Resource
- Allocation
- I/O
- Process
- Thread
- Concurrency
- Parallelism
- Blocking
- Non-blocking
- Synchronous
- Asynchronous
- Cache
- Serialization
- Deserialization
- Stateless
- Stateful
- Persistent
- Ephemeral
- Immutable
- Scalability
- Availability
- Fault Tolerance
- Redundancy
- Idempotency
- Atomicity
- Consistency

## Frontend

프론트엔드 개발에서 반드시 알아야 하는 용어.

다음과 같은 내용을 포함하되 더 필요한 용어를 추가한다.

- DOM
- Virtual DOM
- Component
- Props
- State
- Event
- Rendering
- Re-render
- Hydration
- CSR
- SSR
- SSG
- SPA
- Routing
- Client
- Browser
- HTTP Request
- API
- REST API
- Fetch
- AJAX
- CORS
- Cookie
- Session
- LocalStorage
- SessionStorage
- Authentication
- Authorization
- Token
- JWT
- Responsive Design
- Breakpoint
- CSS Box Model
- Flexbox
- Grid
- Accessibility
- Semantic HTML
- Bundling
- Tree Shaking
- Code Splitting
- Lazy Loading
- Debounce
- Throttle

React/Vue/Next.js 환경에서 실제로 자주 사용되는 단어도 추가한다.

## Backend

백엔드 및 서버 개발에서 반드시 알아야 할 용어.

- Server
- Client
- Request
- Response
- Endpoint
- API
- REST
- HTTP Method
- Status Code
- Header
- Body
- Middleware
- Controller
- Service
- Repository
- DTO
- Entity
- Dependency Injection
- IoC
- Bean
- Proxy
- AOP
- Transaction
- Authentication
- Authorization
- Session
- JWT
- Hash
- Encryption
- Connection Pool
- Thread Pool
- Event Loop
- Message Queue
- Worker
- Batch
- Scheduler
- Load Balancer
- Reverse Proxy
- Gateway
- Cache
- Rate Limiting
- Timeout
- Retry
- Circuit Breaker
- Health Check
- Logging
- Monitoring
- Observability
- Container
- Runtime
- Docker
- Kubernetes

Spring Boot 환경에서 자주 등장하는 단어들도 추가한다.

## Database

데이터베이스에서 반드시 알아야 하는 용어.

- Database
- DBMS
- Table
- Row
- Column
- Schema
- Primary Key
- Foreign Key
- Candidate Key
- Composite Key
- Index
- Constraint
- Query
- SQL
- DDL
- DML
- DCL
- TCL
- SELECT
- JOIN
- INNER JOIN
- OUTER JOIN
- GROUP BY
- HAVING
- Subquery
- Transaction
- ACID
- Atomicity
- Consistency
- Isolation
- Durability
- Commit
- Rollback
- Lock
- Deadlock
- Isolation Level
- Normalization
- Denormalization
- Cardinality
- Selectivity
- Execution Plan
- Full Table Scan
- Index Scan
- B-Tree
- Clustered Index
- Non-clustered Index
- Connection Pool
- Replication
- Sharding
- Partitioning
- OLTP
- OLAP
- NoSQL

MySQL, PostgreSQL 및 SQLD 학습에 필요한 용어도 포함한다.

## Machine Learning

머신러닝과 딥러닝에서 알아야 하는 용어.

### 기본

- Dataset
- Feature
- Label
- Target
- Sample
- Training Set
- Validation Set
- Test Set
- Model
- Training
- Inference
- Parameter
- Hyperparameter
- Epoch
- Batch
- Batch Size
- Learning Rate
- Optimizer
- Loss Function
- Gradient
- Gradient Descent
- Backpropagation

### 모델 평가

- Accuracy
- Precision
- Recall
- F1 Score
- Confusion Matrix
- ROC
- AUC
- MAE
- MSE
- RMSE
- R²
- Overfitting
- Underfitting
- Bias
- Variance
- Generalization

### Deep Learning

- Neural Network
- Layer
- Input Layer
- Hidden Layer
- Output Layer
- Activation Function
- ReLU
- Sigmoid
- Softmax
- CNN
- RNN
- LSTM
- Transformer
- Attention
- Embedding

### 현대 AI / LLM

- Token
- Tokenization
- Context Window
- Embedding
- Vector
- Vector Database
- Cosine Similarity
- Semantic Search
- RAG
- Chunking
- Retrieval
- Retriever
- Prompt
- Prompt Engineering
- System Prompt
- Fine-tuning
- LoRA
- Quantization
- Inference
- Reasoning
- Agent
- Tool Calling
- Workflow
- Hallucination

# 3. 용어 데이터 구조

각 용어는 최소 다음 정보를 가진다.

```ts
interface Term {
  id: string
  name: string
  koreanName?: string
  category: string
  subcategory?: string

  oneLine: string
  explanation: string

  analogy?: string
  example?: string

  whyImportant?: string
  relatedTerms?: string[]

  difficulty: "Beginner" | "Intermediate" | "Advanced"
  importance: 1 | 2 | 3 | 4 | 5

  keywords?: string[]
}
```

예시:

```ts
{
  id: "overhead",
  name: "Overhead",
  koreanName: "오버헤드",
  category: "Common",
  subcategory: "Performance",

  oneLine: "실제 작업 외에 추가로 발생하는 비용",

  explanation:
    "프로그램이 핵심 작업을 수행하기 위해 추가적으로 사용하는 CPU, 메모리, 네트워크, 디스크 I/O 등의 비용을 의미한다.",

  analogy:
    "택배 물건 자체가 핵심 작업이라면 포장, 송장 출력, 분류 작업이 오버헤드에 해당한다.",

  example:
    "Docker OverlayFS에서 파일을 수정할 때 Copy-on-Write 때문에 추가 I/O 오버헤드가 발생할 수 있다.",

  whyImportant:
    "시스템 성능을 분석할 때 단순히 느리다고 표현하는 대신 어떤 추가 비용이 발생하는지를 설명할 수 있다.",

  relatedTerms: [
    "Latency",
    "Throughput",
    "I/O",
    "Bottleneck"
  ],

  difficulty: "Beginner",
  importance: 5,

  keywords: [
    "performance",
    "cost",
    "cpu",
    "memory"
  ]
}
```

# 4. 설명 방식

각 용어 설명은 반드시 다음 순서로 제공한다.

1. 한 줄 정의
2. 쉽게 설명
3. 비유
4. 실제 개발 예시
5. 왜 알아야 하는가
6. 관련 용어
7. 난이도
8. 중요도

설명은 교과서처럼 딱딱하게 쓰지 않는다.

예를 들어:

Latency

나쁜 설명:

"시스템에서 요청과 응답 사이에 발생하는 시간적 지연이다."

좋은 설명:

"요청을 보낸 뒤 결과가 돌아올 때까지 기다리는 시간이다."

예:

```text
사용자
↓ 요청
Server
↓ 처리
사용자에게 응답

왕복에 300ms 걸림
→ Latency = 약 300ms
```

이런 식으로 작성한다.

# 5. UI 구조

전체 디자인은 개발자용 문서 사이트와 학습 앱의 중간 형태로 만든다.

예시 분위기:

- Linear
- Vercel
- shadcn
- Stripe Docs
- modern developer documentation

지나치게 화려하지 않고 깔끔해야 한다.

## 상단

Header:

```text
Developer Dictionary
개발자가 자주 마주치는 핵심 용어 사전
```

상단에 검색창을 크게 배치한다.

Placeholder:

```text
"Latency, Docker, Transaction, RAG..."
```

# 6. Sidebar

왼쪽 Sidebar:

```text
All

Common / CS
Frontend
Backend
Database
Machine Learning
AI / LLM
```

각 카테고리 옆에 용어 수 표시.

예:

```text
Backend      48
Database     55
Machine Learning 72
```

# 7. Term Card

목록에서는 Card 형태로 보여준다.

예:

```text
Overhead

실제 작업 외에 추가로 발생하는 비용

Common · Performance

Beginner
★★★★★
```

카드를 클릭하면 상세 페이지 또는 Drawer를 연다.

# 8. 상세 화면

용어 상세 화면:

```text
Overhead
오버헤드

실제 작업 외에 추가로 발생하는 비용

────────────────────────

쉽게 설명

프로그램이 실제 작업을 하기 위해
추가적으로 사용하는 자원을 의미한다.

────────────────────────

비유

택배 물건을 배송하는 것이 실제 작업이라면
포장과 분류 작업은 Overhead다.

────────────────────────

개발 예시

Docker OverlayFS에서 파일을 수정하면
Copy-on-Write 처리 때문에 추가 I/O가 발생한다.

이 추가 작업을 I/O Overhead라고 표현할 수 있다.

────────────────────────

왜 중요한가?

성능 문제를 설명할 때
"느리다" 대신 정확한 원인을 표현할 수 있다.

────────────────────────

관련 용어

Latency
Throughput
Bottleneck
I/O
```

# 9. 검색

검색은 다음을 모두 대상으로 한다.

- 영어 이름
- 한국어 이름
- 설명
- keywords
- category
- related terms

예:

```text
"느림"
```

검색하면:

- Latency
- Bottleneck
- Overhead

등이 노출될 수 있도록 한다.

# 10. 필터

다음 필터 제공:

Difficulty:

```text
Beginner
Intermediate
Advanced
```

Category:

```text
Frontend
Backend
Database
Machine Learning
AI
Common
```

Importance:

```text
★★★★★
★★★★
★★★
```

# 11. 학습 기능

단순 용어집에서 끝내지 말고 학습 기능을 추가한다.

## 오늘의 단어

홈 화면에:

```text
오늘의 개발 용어 5개
```

를 랜덤으로 제공한다.

## 핵심 단어

importance 5인 용어만 볼 수 있는:

```text
Must Know
```

필터를 제공한다.

## 관련 용어 탐색

예:

```text
Latency
↓
Throughput
↓
Bottleneck
↓
Caching
```

처럼 연관 개념을 계속 탐색할 수 있도록 한다.

# 12. 비교 학습

헷갈리기 쉬운 개념은 비교 화면을 제공한다.

대표적으로 다음을 반드시 포함한다.

```text
Latency vs Throughput

Concurrency vs Parallelism

Blocking vs Non-blocking

Synchronous vs Asynchronous

Authentication vs Authorization

Stateful vs Stateless

Process vs Thread

Container vs VM

Image vs Container

Registry vs Repository

Volume vs Bind Mount

Primary Key vs Foreign Key

WHERE vs HAVING

INNER JOIN vs OUTER JOIN

DELETE vs TRUNCATE vs DROP

Precision vs Recall

Parameter vs Hyperparameter

Training vs Inference

Overfitting vs Underfitting

Embedding vs Token

RAG vs Fine-tuning
```

비교 화면에서는 두 개념을 표 형태로 보여준다.

예:

```text
                  Latency        Throughput

질문              얼마나 느린가?   얼마나 많이 처리하는가?
단위              ms             req/s
낮을수록 좋은가?    Yes            No
높을수록 좋은가?    No             Yes
```

# 13. 학습 경로

카테고리마다 Beginner Roadmap을 제공한다.

예:

Backend:

```text
Request / Response
↓
HTTP
↓
API
↓
Controller
↓
Service
↓
Repository
↓
Dependency Injection
↓
Transaction
↓
Cache
↓
Concurrency
↓
Message Queue
```

Database:

```text
Table
↓
Primary Key
↓
Foreign Key
↓
JOIN
↓
Index
↓
Transaction
↓
ACID
↓
Lock
↓
Execution Plan
↓
Replication / Sharding
```

Machine Learning:

```text
Dataset
↓
Feature / Label
↓
Training
↓
Loss
↓
Gradient
↓
Optimizer
↓
Validation
↓
Overfitting
↓
Evaluation Metric
↓
Inference
```

# 14. UX 요구사항

반드시 다음을 만족한다.

- Desktop / Tablet / Mobile 반응형
- Dark Mode 지원
- 검색 결과 즉시 업데이트
- URL query parameter로 검색 및 필터 유지
- Keyboard navigation 가능
- 카드 hover 효과는 과하지 않게
- 충분한 whitespace
- 읽기 편한 typography
- 접근성 고려
- 모바일에서는 Sidebar를 Drawer 형태로 변경

# 15. 초기 데이터

처음부터 빈 화면을 만들지 말고 **최소 150개 이상의 실제 용어 데이터를 직접 작성해서 넣어라.**

권장 분배:

```text
Common / CS        30+
Frontend           30+
Backend            40+
Database           35+
Machine Learning   40+
AI / LLM           30+
```

중복되는 용어는 하나의 canonical term으로 관리하고 여러 category에 연결 가능하도록 설계한다.

예:

```text
Cache

관련 분야:
Backend
Database
Frontend
Machine Learning
```

# 16. 중요 원칙

이 프로젝트의 가장 중요한 목적은:

"개발 강의에서 교수나 개발자가 사용하는 단어를 처음 듣더라도 이 사이트에서 검색하면 1~2분 안에 개념을 이해할 수 있게 만드는 것"

이다.

따라서 설명을 지나치게 축약하지 않는다.

하지만 Wikipedia처럼 길게 설명하지도 않는다.

각 용어는:

```text
한 줄 정의
→ 쉬운 설명
→ 비유
→ 실제 예시
→ 관련 개념
```

순서만 읽어도 이해할 수 있어야 한다.

# 17. 구현 방식

먼저 전체 프로젝트 구조를 설계한 뒤 구현한다.

권장 구조:

```text
src/
├── app/
├── components/
│   ├── dictionary/
│   ├── search/
│   ├── filters/
│   └── layout/
├── data/
│   └── terms.ts
├── lib/
├── types/
└── utils/
```

컴포넌트를 적절하게 분리한다.

예:

```text
TermCard
TermDetail
TermSearch
CategorySidebar
DifficultyBadge
ImportanceRating
RelatedTerms
ComparisonCard
LearningPath
```

TypeScript 타입을 명확하게 정의한다.

# 18. 작업 순서

다음 순서로 진행한다.

1. 프로젝트 구조 확인
2. 데이터 모델 설계
3. 용어 데이터 작성
4. 메인 Layout 구현
5. 검색 기능 구현
6. Category 필터 구현
7. Term Card 구현
8. 상세 화면 구현
9. Related Terms 구현
10. 비교 학습 기능 구현
11. Learning Roadmap 구현
12. Dark Mode
13. Responsive UI
14. UX 개선
15. 오류 확인
16. 전체 코드 정리

기존 프로젝트가 있다면 현재 구조를 먼저 분석한 뒤 최소한의 구조 변경으로 구현한다.

모든 구현이 끝나면 다음도 확인한다.

- TypeScript error
- build error
- broken imports
- 모바일 UI
- 검색 정확도
- 중복 데이터
- 잘못된 기술 설명

마지막으로 README에 프로젝트 구조와 데이터 추가 방법을 간단하게 문서화한다.