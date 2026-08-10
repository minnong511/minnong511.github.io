
# JAVA의 주석 (Comment 방식 )

구분 사용 문법 용도 예시
한 줄 주석 //로 시작 간단한 설명, TODO, 디버깅 등 // 변수 초기화
여러 줄 주석 /* ... */로 감싸기 여러 줄 설명, 블록 주석 등 /* 여러 줄 주석입니다 */
문서 주석 /** ... */로 시작 (Javadoc) 메서드, 클래스 문서 자동화 /** 이름을 반환합니다 **/

public class Example {
// 한 줄 주석: 사용자 이름 출력
public static void main(String[] args) {
/* 여러 줄 주석:
변수 선언과 초기화 */
String name = "Skala";
/**
* 사용자 이름을 출력합니다.
* @param name 사용자 이름
*/
System.out.println("Hello, " + name);
}
}

# Javadoc 주요 태그 

@param - 메서드 매개변수 설명 
@return - 반환값 설명 
@throws - 예외 설명 
@author - 작성자 
@since - 버전표시 

/**
* 주어진 두 수의 합을 반환합니다.
* @param a 첫 번째 정수
* @param b 두 번째 정수
* @return 두 정수의 합
*/
public int add(int a, int b) {
return a + b;
}

가이드 항목 설명
필요한 경우만 작성 코드 자체로 의미가 명확할 경우 불필요한 주석은 피함
주석 내용은 왜(Why)와 무엇(What)를 설명 선택한 이유, 의도, 대안 비교 / 코드의 기능이나 동작 설명
오래된 주석 제거 코드가 변경되면 주석도 함께 업데이트
Javadoc 사용 권장 public 클래스/메서드는 /** ... */ 문서 주석 사용
*TODO / FIXME 주석 작업 항목 추적 시 명확히 구분: // TODO: 로그인 로직 추가
API 문서 자동 생성 시 문서 주석 활용 javadoc 도구로 HTML 문서 생성 가능


// TODO 와 //FIXME는 개발가 작업 중인 코드에 메모를 남길 때 사용하는 특별한 주석 패턴 

IDE(예: IntelliJ, Eclipse)에서도 자동으로 인식되어 작업 추적(TODO 리스트) 용도로 널리 사용
- // TODO : 해야 할 작업(T o-Do)을 기록해두는 주석
- // FIXME : 현재 코드에 문제가 있음을 나타내고 수정이 필요함을 알리는 주석