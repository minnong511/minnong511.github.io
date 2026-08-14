# Lombok
> 개발자의 boilerplate code를 줄이고, 가독성을 높일 수 있도록 지원하는 Java 라이브러리 

- boilerplate code 
    - 반복적이고 본질절익 로직과 무관하지만 반드시 작성해야 하는 코드 
    - Java 에서는 객체의 필드를 다룰 때 getter(), setter(), equals(), hashCode(), toString() 메서드등이 대표적 사례 

| 어노테이션 | 역할 / 설명 | 코드 사용 위치 |
|---|---|---|
| `@Getter` | 모든 필드의 getter 메서드를 자동 생성 | 클래스 |
| `@Setter` | 모든 필드의 setter 메서드를 자동 생성 | 클래스 |
| `@ToString` | `toString()` 메서드를 자동 생성 | 클래스 |
| `@EqualsAndHashCode` | `equals()`와 `hashCode()` 메서드를 자동 생성 | 클래스 |
| `@NonNull` | `null` 값이 들어오면 즉시 `NullPointerException`이 발생하도록 검사 | 필드, 생성자·메서드 파라미터 |
| `@NoArgsConstructor` | 파라미터가 없는 기본 생성자를 자동 생성 | 클래스 |
| `@AllArgsConstructor` | 모든 필드를 파라미터로 받는 생성자를 자동 생성 | 클래스 |
| `@RequiredArgsConstructor` | `final` 또는 `@NonNull` 필드만 받는 생성자를 자동 생성 | 클래스 |
| `@Data` | `@Getter`, `@Setter`, `@ToString`, `@EqualsAndHashCode`, `@RequiredArgsConstructor`를 한 번에 적용 | 클래스 |
| `@Builder` | 빌더 패턴 코드를 자동 생성해 객체를 유연하게 생성 | 클래스, 생성자, 메서드 |
| `@Slf4j` | `log`라는 이름의 로그 객체를 자동 생성 | 클래스 |