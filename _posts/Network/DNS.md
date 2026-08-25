# DNS = Domain Name System

사람이 읽기 쉬운 도메인 이름을 컴퓨터가 사용하는 IP 주소로 바꿔주는 시스템

```text
google.com
    ↓
DNS 조회
    ↓
142.250.xxx.xxx
    ↓
해당 서버에 접속
```

## 1. 핵심 단어 정의 

### 도메인, Domain 

사람이 기억하기 쉽게 만든 인터넷 주소 

```text
google.com
naver.com
github.com
```

### IP 주소, IP Address

인터넷에서 컴퓨터나 서버를 구분하는 실제 주소

```text
142.250.xxx.xxx
```

### DNS, Domain Name System

- 도메인 이름에 연결된 IP 주소를 찾아주는 시스템

### DNS 서버

- 도메인과 IP 주소의 연결 정보를 찾아서 알려주는 시스템

### DNS 조회, DNS Query

- 컴퓨터가 DNS 서버에 도메인의 IP 주소를 물어보는 과정

### DNS 캐시

- 이전에 조회한 DNS 결과를 일정 시간 저장하는 공간

## 2. DNS란? 

DNS는 사람이 읽기 쉬운 도메인 이름을 컴퓨터가 사용하는 IP 주소로 변환해 주는 시스템

```text
Google.com
    ↓
DNS 조회
    ↓
142.250.xxx.xxx
    ↓
Google 서버에 접속
```

DNS는 웹페이지를 직접 보내주는 서버가 아니다. 
DNS는 브라우저가 접속해야 할 서버의 IP 주소만 알려준다. 

## 3. DNS가 필요한 이유 

사람은 다음과 같은 도메일을 기억하기 쉽다.

```text
google.com
```

다만, 컴퓨터는 이러한 도메인을 이해할 수 없다. 

따라서 컴퓨터가 인터넷에서 서버를 찾으려면 IP 주소가 필요하다. 

```text
142.250.xxx.xxx
```

DNS가 없다면 사용자가 웹사이트마다 IP 주소를 기억해야한다. (정말 끔찍하군!)

```text
DNS가 없을 때
    → 142.250.xxx.xxx 입력

DNS가 있을 때
    → Google.com 입력
```

DNS는 사람이 사용하는 이름과 컴퓨터가 사용하는 주소를 연결

## 4. DNS 동작 과정 

사용자가 브라우저에 google.com을 입력했다고 가정

1. 사용자가 Google.com 입력 
2. 브라우저와 컴퓨터가 DNS 캐시 확인
3. 저장된 정보가 없으면 DNS 서버에 요청
4. DNS 서버가 google.com의 IP 주소를 검색
5. DNS 서버가 IP 주소 반환 
6. 브라우저가 해당 IP 주소의 서버에 접속 
7. 서버가 웹페이지 응답 

전체 흐름은 다음과 같다. 

```text
사용자
    │ google.com 입력
    ▼
브라우저
    │ IP 주소 요청
    ▼
DNS 서버
    │ 142.250.xxx.xxx 응답
    ▼
브라우저
    │ 해당 IP로 접속
    ▼
Google 서버
    │ 웹페이지 응답
    ▼
사용자
```

## 5. DNS 조회 과정 

DNS 서버 하나가 세상의 모든 도메인 정보를 가지고 있는 것은 아니다. 

필요하면 여러 DNS 서버를 거쳐 IP 주소

```text
브라우저
    ↓
DNS Resolver
    ↓
Root DNS Server
    ↓
TLD DNS Server
    ↓
Authoritative DNS Server
    ↓
IP 주소 반환
```

### DNS Resolver

사용자를 대신해 여러 DNS 서버에 정보를 물어보는 서버입니다.

### Root DNS Server

.com, .net, .kr 등을 담당하는 TLD DNS 서버의 위치를 알려줍니다.

### TLD DNS Server

.com, .kr 같은 최상위 도메인을 담당합니다.
예를 들어 google.com에서는 .com 부분을 담당합니다.

### Authoritative DNS Server

해당 도메인의 실제 DNS 정보를 관리합니다.
최종적으로 google.com에 연결된 IP 주소를 알려줍니다.

## 6. DNS의 설계 목적

### 사람이 쉬운 이름을 사용하게 함
복잡한 IP 주소 대신 기억하기 쉬운 도메인을 사용할 수 있다. 

### 도메인과 서버를 분리함
서버 IP 주소가 바뀌어도 DNS 설정만 변경하면 된다. 

```text
변경 전
    google.com → 1.1.1.1

변경 후
    google.com → 2.2.2.2
```

사용자는 IP 변경과 관계없이 계속 google.com을 사용

### 조회 결과를 캐시함 

같은 도메인을 요청할 때마다 모든 DNS 서버를 거치면 느려진다. 

그래서 이전 조회 결과를 일정 시간 저장하고 재사용

```text
첫 번째 접속
    DNS 서버까지 조회 → 비교적 느림

두 번째 접속
    DNS 캐시 사용 → 빠름
```

## 7. 핵심 정리 

```text
도메인
    → 사람이 사용하는 서버 이름

IP 주소
    → 컴퓨터가 서버를 찾는 실제 주소

DNS
    → 도메인을 IP 주소를 연결

DNS 캐시
    → 이전 조회 결과를 저장하여 조회 속도 향상
```

> DNS는 인터넷의 전화번호부처럼 도메인 이름에 해당하는 서버의 IP 주소를 찾아주는 시스템
