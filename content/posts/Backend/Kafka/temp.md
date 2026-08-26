https://rainbow-beard-524.notion.site/Kafka-28775575898d8025a9c6e53ff533b89c

네. 이 Notion 페이지는 크게 두 부분입니다.

1. Kafka를 이용한 자동 메일 발송 구조
2. EC2에서 Kafka Broker를 실행하는 Docker 명령어

다만 실제 `OrderService`, `MailService`의 소스코드는 없고, Kafka 서버를 띄우는 명령어와 개념이 중심입니다. 아래는 [친구분의 Kafka 페이지](https://rainbow-beard-524.notion.site/Kafka-28775575898d8025a9c6e53ff533b89c)를 기준으로 정리한 내용입니다.

## 1. 전체 시스템 흐름

```text
OrderService
    │
    │ 주문 완료 이벤트 발행
    ▼
Kafka Producer
    │
    ▼
Kafka Broker
┌─────────────────────────┐
│ Topic: order-completed  │
│ Partition 0, 1, 2       │
└─────────────────────────┘
    │
    │ 메시지 소비
    ▼
MailService Consumer
    │
    ▼
사용자에게 주문 완료 메일 전송
```

예를 들어 사용자가 주문을 완료했다고 해보겠습니다.

```json
{
  "orderId": 1001,
  "userId": 25,
  "email": "user@example.com",
  "status": "COMPLETED"
}
```

처리 흐름은 다음과 같습니다.

```text
1. OrderService에서 주문이 완료된다.
2. Producer가 주문 완료 이벤트를 Kafka에 보낸다.
3. Kafka가 메시지를 Topic의 Partition에 저장한다.
4. MailService가 Kafka에서 메시지를 읽는다.
5. MailService가 사용자에게 메일을 보낸다.
6. 처리가 끝난 위치인 Offset을 기록한다.
```

여기서 중요한 점은 OrderService가 MailService를 직접 호출하지 않는다는 것입니다.

```text
직접 호출

OrderService ──API 호출──→ MailService
```

```text
Kafka 사용

OrderService → Kafka ← MailService
```

따라서 MailService에 일시적인 장애가 발생해도 Kafka에 메시지가 남아 있다면 나중에 다시 읽어서 처리할 수 있습니다.

## 2. 페이지의 용어를 예제에 연결하기

| Kafka 개념 | 이 시스템에서의 역할 |
|---|---|
| Producer | 주문 완료 메시지를 보내는 OrderService |
| Broker | 메시지를 받아 저장하는 Kafka 서버 |
| Topic | 주문 완료 메시지를 구분하는 이름 |
| Partition | Topic을 나누어 저장하는 공간 |
| Consumer | 주문 메시지를 읽는 MailService |
| Consumer Group | MailService Consumer들을 하나의 작업 그룹으로 묶는 이름 |
| Offset | Consumer가 Partition에서 어디까지 읽었는지 나타내는 위치 |

### Broker

Broker는 실행 중인 Kafka 서버 한 대입니다.

Notion의 다음 명령어는:

```bash
docker run ... apache/kafka:latest
```

Kafka Broker 한 대를 컨테이너로 실행한다는 의미입니다.

실제 운영에서는 보통 여러 Broker로 Cluster를 구성합니다.

```text
Kafka Cluster
├── Broker 1
├── Broker 2
└── Broker 3
```

하지만 친구분의 코드는 Broker가 한 대이고 복제 수도 `1`이므로 학습, 테스트용 구성에 가깝습니다.

### Topic

Topic은 메시지의 종류를 구분하는 이름입니다.

자동 메일 발송 시스템이라면 다음과 같이 정할 수 있습니다.

```text
order-completed
```

Producer는 이 Topic에 메시지를 보냅니다.

```python
producer.send("order-completed", order_event)
```

MailService는 같은 Topic을 읽습니다.

```python
consumer.subscribe(["order-completed"])
```

### Partition

친구분의 설정에는 다음 내용이 있습니다.

```bash
-e KAFKA_NUM_PARTITIONS=3
```

기본 Partition 개수를 3개로 설정한다는 의미입니다.

```text
order-completed Topic
├── Partition 0
├── Partition 1
└── Partition 2
```

Partition이 여러 개면 Consumer들이 메시지를 나누어 처리할 수 있습니다.

```text
Partition 0 → Mail Consumer 1
Partition 1 → Mail Consumer 2
Partition 2 → Mail Consumer 3
```

### Key와 메시지 순서

Producer가 메시지를 보낼 때 Key를 지정할 수 있습니다.

```text
Key: order-1001
Value: 주문 완료 이벤트
```

같은 Key를 사용하는 메시지는 같은 Partition으로 들어가므로 해당 Partition 안에서 순서가 유지됩니다.

```text
Key: order-1001

주문 생성 → 결제 완료 → 배송 시작
```

다만 Kafka는 Topic 전체의 순서가 아니라 **Partition 내부의 순서만 보장**합니다.

## 3. Consumer Group과 Offset

### Consumer Group

MailService 서버가 여러 대라면 같은 `group.id`를 사용하게 할 수 있습니다.

```text
Consumer Group: mail-service-group

Partition 0 → MailService 1
Partition 1 → MailService 2
Partition 2 → MailService 3
```

같은 Consumer Group의 Consumer들은 메시지를 나누어 처리합니다.

반면 메일 서비스와 재고 서비스가 같은 주문 메시지를 각각 받아야 한다면 서로 다른 Group을 사용합니다.

```text
order-completed Topic
├── mail-service-group      → 메일 발송
└── inventory-service-group → 재고 처리
```

정리하면 다음과 같습니다.

```text
같은 Consumer Group
→ 메시지를 나누어 처리

서로 다른 Consumer Group
→ 각 그룹이 같은 메시지를 독립적으로 처리
```

### Offset

Partition 안에서 메시지가 저장된 위치입니다.

```text
Partition 0

Offset       0         1         2
Message   주문1001   주문1002   주문1003
```

MailService가 Offset `1`까지 처리하고 커밋했다면, 다시 실행됐을 때 그 이후 위치부터 처리할 수 있습니다.

```text
마지막으로 커밋한 위치: 1
다음 처리 위치:        2
```

Kafka Consumer는 Partition별 처리 위치를 추적하고, 커밋한 Offset을 이용해 재시작 후 처리 위치를 복구할 수 있습니다. [Apache Kafka의 Offset 설명](https://kafka.apache.org/43/implementation/distribution/)

참고로 “Kafka가 메시지를 Consumer에게 밀어준다”기보다는 Consumer가 Kafka를 계속 확인하며 메시지를 가져오는 `poll` 방식이라고 이해하는 것이 더 정확합니다.

## 4. ZooKeeper 방식과 KRaft 방식

친구분의 페이지에는 두 가지 실행 방식이 섞여 있습니다.

### 예전 방식, ZooKeeper

```bash
docker run -d \
  --name zookeeper \
  -p 2181:2181 \
  zookeeper
```

```bash
-e KAFKA_ZOOKEEPER_CONNECT=3.35.8.111:2181
```

과거 Kafka는 Broker, Topic, Partition 등의 메타데이터를 관리하기 위해 별도의 ZooKeeper가 필요했습니다.

```text
Kafka Broker ↔ ZooKeeper
```

하지만 현재 Kafka 4.x는 ZooKeeper 방식을 제거하고 KRaft 방식만 지원합니다. 따라서 새로 공부하거나 구성한다면 이 부분은 실행용이 아니라 과거 구조를 이해하는 용도로만 보면 됩니다. [Apache Kafka 4.0 변경 사항](https://kafka.apache.org/40/getting-started/upgrade/)

### 현재 방식, KRaft

페이지의 다음 설정이 KRaft 방식입니다.

```bash
-e KAFKA_NODE_ID=1
-e KAFKA_PROCESS_ROLES=broker,controller
-e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER
-e KAFKA_CONTROLLER_QUORUM_VOTERS=1@broker:9093
```

KRaft에서는 Kafka 내부의 Controller가 메타데이터를 관리합니다.

```text
이전
Kafka Broker + ZooKeeper

현재
Kafka Broker + Kafka Controller
```

학습용 단일 서버에서는 하나의 Kafka 프로세스가 두 역할을 함께 수행할 수 있습니다.

```bash
KAFKA_PROCESS_ROLES=broker,controller
```

- `broker`: Producer와 Consumer의 메시지를 처리
- `controller`: Broker, Topic, Partition 등의 메타데이터 관리

## 5. Docker 설정에서 가장 어려운 Listener

페이지의 핵심 설정은 다음 부분입니다.

```bash
-e KAFKA_LISTENERS=\
INTERNAL://0.0.0.0:19092,\
EXTERNAL://0.0.0.0:9092,\
CONTROLLER://0.0.0.0:9093
```

```bash
-e KAFKA_ADVERTISED_LISTENERS=\
INTERNAL://localhost:19092,\
EXTERNAL://$EC2_PUBLIC_IP:9092
```

### `KAFKA_LISTENERS`

Kafka Broker가 실제로 연결을 기다릴 주소입니다.

문에 비유하면 Kafka가 실제로 열어 놓은 출입문입니다.

```text
19092 → 내부 클라이언트용 문
9092  → 외부 클라이언트용 문
9093  → Controller 통신용 문
```

### `KAFKA_ADVERTISED_LISTENERS`

Kafka가 클라이언트에게 알려주는 접속 주소입니다.

```text
listeners
→ Kafka가 실제로 연결을 받는 주소

advertised.listeners
→ 클라이언트에게 “앞으로 이 주소로 접속하세요”라고 알려주는 주소
```

EC2 환경에서는 외부 클라이언트가 `localhost`로 접근할 수 없기 때문에 퍼블릭 IP를 알려줘야 합니다.

```bash
EXTERNAL://3.35.8.111:9092
```

공식 문서에서도 `advertised.listeners`는 클라우드처럼 Kafka가 연결을 받는 주소와 클라이언트가 접속해야 하는 주소가 다를 때 사용한다고 설명합니다. [Apache Kafka Broker 설정](https://kafka.apache.org/43/configuration/broker-configs/)

### INTERNAL

```bash
INTERNAL://localhost:19092
```

Kafka가 실행되는 EC2 자체에서 실행한 애플리케이션이 사용할 주소입니다.

```text
EC2 내부 Spring 애플리케이션
→ localhost:19092
```

하지만 Spring 애플리케이션도 Docker 컨테이너에서 실행한다면 `localhost`를 사용하면 안 됩니다. 컨테이너에서 `localhost`는 Kafka가 아니라 해당 컨테이너 자신을 의미하기 때문입니다.

같은 Docker Network에서 접근한다면 보통 Kafka 컨테이너 이름을 사용합니다.

```text
broker:19092
```

### EXTERNAL

```bash
EXTERNAL://$EC2_PUBLIC_IP:9092
```

개발자의 로컬 PC처럼 EC2 외부에 있는 클라이언트가 사용하는 주소입니다.

```text
내 PC의 Spring 애플리케이션
→ EC2_PUBLIC_IP:9092
```

### CONTROLLER

```bash
CONTROLLER://0.0.0.0:9093
```

KRaft Controller 통신에 사용하는 내부 주소입니다. 일반 Producer나 Consumer가 접속하는 포트가 아닙니다.

## 6. 나머지 환경변수

```bash
-e KAFKA_NODE_ID=1
```

현재 Kafka 노드의 고유 번호입니다.

```bash
-e KAFKA_PROCESS_ROLES=broker,controller
```

하나의 프로세스가 Broker와 Controller 역할을 모두 수행합니다.

```bash
-e KAFKA_INTER_BROKER_LISTENER_NAME=INTERNAL
```

Kafka Broker끼리 통신할 때 `INTERNAL` Listener를 사용합니다.

```bash
-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
```

Consumer Offset을 저장하는 내부 Topic의 복제 수를 1로 설정합니다.

```bash
-e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1
-e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1
```

Transaction 상태를 저장하는 내부 Topic의 복제 관련 설정입니다. Broker가 한 대뿐이므로 모두 `1`로 지정한 것입니다.

```bash
-e KAFKA_HEAP_OPTS="-Xms256m -Xmx256m"
```

Kafka JVM이 사용할 Heap 메모리를 256MB로 제한합니다. 페이지에서는 EC2 `t3.micro`의 부족한 메모리를 고려한 설정입니다.

## 7. 이 코드에서 주의할 부분

친구분의 코드는 학습용으로는 구조를 이해하기 좋지만 다음은 주의해야 합니다.

- Kafka 4.x에서는 ZooKeeper를 사용하지 않으므로 `2181` 포트를 열 필요가 없습니다.
- `apache/kafka:latest`는 버전이 바뀔 수 있으므로 재현 가능한 환경에서는 명확한 버전을 지정하는 것이 좋습니다.
- Broker 1대, 복제 수 1은 장애 복구가 안 되므로 운영용 구성이 아닙니다.
- `PLAINTEXT`는 암호화와 인증이 없으므로 `9092`를 인터넷 전체에 공개하면 위험합니다.
- EC2 보안 그룹의 `9092`는 모든 IP가 아니라 자신의 IP나 필요한 서버로 제한하는 것이 좋습니다.
- `9093` Controller 포트는 외부 클라이언트에게 공개할 필요가 없습니다.
- `docker rm -f broker`는 기존 Broker 컨테이너를 강제로 삭제하므로 내용을 이해하지 않은 채 실행하면 안 됩니다.
- 같은 Docker Network의 애플리케이션은 `localhost:19092`가 아니라 보통 `broker:19092`를 사용해야 합니다.

## 8. Spring 코드로 표현하면

페이지의 구조를 Spring Kafka 코드로 단순하게 표현하면 다음과 같은 모양입니다.

Producer인 OrderService:

```java
@Service
@RequiredArgsConstructor
public class OrderEventProducer {

    private final KafkaTemplate<String, OrderCompletedEvent> kafkaTemplate;

    public void publish(OrderCompletedEvent event) {
        kafkaTemplate.send(
            "order-completed",
            String.valueOf(event.orderId()),
            event
        );
    }
}
```

Consumer인 MailService:

```java
@Service
public class OrderMailConsumer {

    @KafkaListener(
        topics = "order-completed",
        groupId = "mail-service-group"
    )
    public void consume(OrderCompletedEvent event) {
        System.out.println("주문 완료 메일 전송: " + event.email());
    }
}
```

호출 흐름은 다음과 같습니다.

```text
OrderService
→ KafkaTemplate.send()
→ order-completed Topic
→ Partition에 메시지 저장
→ @KafkaListener가 메시지 소비
→ MailService가 메일 발송
→ Offset 커밋
```

핵심 결론은 **친구분의 코드는 KRaft 방식의 Kafka Broker를 EC2에 띄우고, 내부 애플리케이션과 외부 클라이언트가 서로 다른 Listener로 접속하도록 만든 학습용 단일 Broker 구성**입니다.
