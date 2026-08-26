---
layout: post
title: "Docker를 이해하기 위한 운영체제 기초"
description: "Program, Process, CPU, Memory, Kernel부터 Namespace와 cgroup까지 Docker 학습에 필요한 운영체제 핵심 개념을 흐름에 따라 정리한다."
date: 2026-08-24 00:10:00 +0900
categories: [Basic, OS]
tags: [OS, Linux, Docker, Process, Kernel, Namespace, cgroup]
legacyPath: "/basic/os/2026/08/24/docker-os-basics/"
---
Docker를 이해하려면 먼저 `Process`, `Kernel`, `Memory`, `CPU`, `Thread`, `Filesystem`, `Network`가 무엇인지 알아야 합니다.

이 글에서는 Docker를 공부할 때 자주 만나는 개념을 **운영체제 기초 단어장**처럼 정리합니다. 처음부터 모든 내용을 외우기보다는 각 개념이 어떻게 연결되는지 이해하는 것이 중요합니다.

## 1. Program

**프로그램 = 실행 가능한 코드가 저장된 파일**

예:

```text
nginx
java
python
chrome
```

아직 실행되지 않았다면 디스크에 저장된 파일일 뿐입니다.

```text
SSD

/usr/bin/python
/usr/bin/nginx
/app/my-server.jar

→ 아직 실행되지 않음
```

프로그램을 실행하면 **Process**가 됩니다.

```text
Program
   ↓ 실행
Process
```

---

## 2. Process

**프로세스 = 실행 중인 프로그램**

예를 들어:

```bash
python server.py
```

를 실행하면 Linux Kernel이 Python 프로세스를 만듭니다.

```text
Program
server.py
   ↓
Python 실행
   ↓
Process 생성
```

프로세스에는 보통 다음과 같은 정보와 자원이 포함됩니다.

```text
Process

PID
CPU 실행 상태
Memory
File Descriptor
Network Socket
환경 변수
권한
```

예를 들어 Chrome을 3개 실행했다고 생각해보면:

```text
Chrome 프로그램 파일
        ↓
 ┌──────┼──────┐
 ↓      ↓      ↓
PID 101 PID 102 PID 103
Process Process Process
```

같은 프로그램이라도 **여러 프로세스가 존재할 수 있습니다.**

Docker에서 가장 중요한 연결점:

> **컨테이너도 결국 Linux에서 실행되는 프로세스입니다.**

```text
Docker Container
       ↓
격리된 Process
       ↓
Linux Kernel
```

---

## 3. PID

**PID = Process ID**

Linux가 프로세스를 구분하기 위해 붙이는 번호입니다.

```text
PID 1    systemd
PID 421  nginx
PID 532  java
PID 991  postgres
```

Linux에서:

```bash
ps
```

를 입력하면 실행 중인 프로세스를 확인할 수 있습니다.

Docker Container 내부에서는 PID Namespace 때문에 Host와 다른 PID 목록을 볼 수 있습니다.

```text
Host

PID 1000 nginx

        ↓ PID Namespace

Container 내부에서는

PID 1 nginx
```

실제 프로세스는 같지만 **보이는 프로세스 공간을 격리**한 것입니다.

---

## 4. CPU

**CPU = 명령어를 실제로 실행하는 장치**

프로그램 코드가:

```python
a = 10
b = 20
c = a + b
```

라면 CPU가 실제 계산을 수행합니다.

```text
Program Code
     ↓
Process
     ↓
CPU
     ↓
명령어 실행
```

CPU에는 Core가 있습니다.

예:

```text
8 Core CPU

Core 1
Core 2
Core 3
Core 4
Core 5
Core 6
Core 7
Core 8
```

여러 프로세스가 CPU를 번갈아 사용합니다.

```text
CPU Core

시간 →
────────────────────────

Chrome
       Java
             Python
                    Chrome
```

이렇게 실행 대상을 바꾸는 것을 **Context Switching**이라고 합니다.

---

## 5. Memory / RAM

**Memory = 실행 중인 프로그램이 데이터를 임시로 저장하는 공간**

디스크보다 훨씬 빠르지만 전원을 끄면 내용이 사라집니다.

```text
SSD
프로그램 저장

        ↓ 실행

RAM
Process 데이터 저장

        ↓

CPU
계산
```

전체 구조:

```text
SSD
 │
 │ 프로그램 읽기
 ↓
RAM
 │
 │ 데이터 전달
 ↓
CPU
```

예:

```text
RAM 16GB

Chrome       3GB
IntelliJ     2GB
Docker       4GB
PostgreSQL   1GB
OS           3GB
기타         3GB
```

Docker에서:

```bash
docker run --memory=512m nginx
```

처럼 메모리 사용량을 제한할 수 있습니다.

이 제한은 **cgroup**을 통해 Kernel이 수행합니다.

---

## 6. Kernel

Docker를 이해할 때 특히 중요한 개념입니다.

**Kernel = 운영체제의 핵심 부분으로, 하드웨어와 프로그램 사이를 관리하는 소프트웨어**

쉽게 말하면 다음과 같습니다.

> Kernel은 모든 프로세스와 하드웨어 자원을 관리하는 관리자입니다.

```text
Application

Chrome
Spring
PostgreSQL
Docker Container
      ↓
────────────────
Linux Kernel
────────────────
CPU
RAM
Disk
Network
```

프로그램이 직접 RAM이나 SSD를 마음대로 제어하면 위험합니다.

그래서 Kernel이 중간에서 관리합니다.

```text
Process

"파일 읽어줘"
"메모리 줘"
"네트워크 보내줘"
"새 Process 만들어줘"

        ↓

Kernel

        ↓

CPU / RAM / SSD / Network
```

---

## 7. User Space와 Kernel Space

운영체제는 크게 두 영역으로 생각할 수 있습니다.

```text
User Space

Chrome
Java
Python
nginx
PostgreSQL

──────────────────

Kernel Space

Linux Kernel

──────────────────

Hardware

CPU
RAM
SSD
NIC
```

일반 프로그램은 **User Space**에서 실행됩니다.

Kernel만 **Kernel Space**에서 실행됩니다.

두 공간을 분리하는 이유는 일반 프로그램의 문제가 운영체제 전체에 영향을 주는 것을 막기 위해서입니다.

```text
Chrome 버그 발생
→ Chrome만 죽음

Chrome이 Kernel 메모리에 직접 접근 가능
→ OS 전체가 죽을 수도 있음
```

그래서 두 공간의 권한을 분리합니다.

---

## 8. System Call

그렇다면 프로그램은 Kernel의 기능을 어떻게 사용할까요?

프로그램은 **System Call**을 사용합니다.

```text
Application
    ↓
System Call
    ↓
Kernel
    ↓
Hardware
```

대표적인 System Call:

```text
open()   → 파일 열기
read()   → 데이터 읽기
write()  → 데이터 쓰기
fork()   → 프로세스 생성
exec()   → 프로그램 실행
socket() → 네트워크 Socket 생성
```

예:

```python
f = open("hello.txt")
```

Python 코드에서는 `open()`으로 보이지만 내부적으로는 Kernel에 파일을 열어달라고 요청합니다.

```text
Python
   ↓
open()
   ↓
System Call
   ↓
Linux Kernel
   ↓
Filesystem
   ↓
SSD
```

---

## 9. Thread

**Thread = 프로세스 내부의 실행 흐름**

프로세스 하나 안에 여러 Thread가 존재할 수 있습니다.

```text
Process

Memory
Heap
Files

 ├── Thread 1
 ├── Thread 2
 ├── Thread 3
 └── Thread 4
```

예를 들어 Spring 서버:

```text
Spring Process

Thread 1 → 사용자 A 요청
Thread 2 → 사용자 B 요청
Thread 3 → 사용자 C 요청
Thread 4 → 사용자 D 요청
```

Process와 Thread 차이:

| 개념 | 의미 |
|---|---|
| Process | 실행 중인 프로그램 단위 |
| Thread | Process 내부의 실행 단위 |

---

## 10. Stack

**Stack = 함수 호출과 지역 변수를 저장하는 메모리 영역**

예:

```java
void hello() {
    int x = 10;
}
```

실행하면 대략:

```text
Stack

hello()
 ├── x = 10
 └── return address
```

함수가 끝나면 자동으로 제거됩니다.

```text
함수 호출

Stack
↓
생성

함수 종료
↓
제거
```

Thread마다 자신의 Stack을 가지고 있습니다.

```text
Process

Heap

Thread 1 Stack
Thread 2 Stack
Thread 3 Stack
```

---

## 11. Heap

**Heap = 동적으로 생성된 객체를 저장하는 메모리 영역**

Java 예:

```java
User user = new User();
```

대략:

```text
Stack

user
 │
 │ reference
 ↓

Heap

User Object
```

Spring에서:

```java
@Service
UserService
```

같은 객체들도 JVM Heap에 존재합니다.

Java에서는 Garbage Collector가 Heap을 관리합니다.

---

## 12. Virtual Memory

Virtual Memory는 프로세스가 실제 RAM 주소를 직접 사용하지 않고 **자신만의 메모리 공간이 있다고 생각하게 만드는 기술**입니다.

```text
Process A

0x0000
0x0001
0x0002
...

Process B

0x0000
0x0001
0x0002
...
```

둘 다 같은 주소를 사용하는 것처럼 보이지만 Kernel이 실제 RAM 주소로 변환합니다.

```text
Process Virtual Address

       ↓

Kernel

Page Table

       ↓

Physical RAM
```

덕분에:

```text
Process A
```

가

```text
Process B
```

의 메모리를 마음대로 읽지 못합니다.

즉 **프로세스 격리의 핵심 기술 중 하나**입니다.

---

## 13. File System

**File System = 파일과 디렉터리를 저장하고 관리하는 방식**

Linux:

```text
/
├── bin
├── etc
├── home
├── usr
├── var
└── tmp
```

Docker 컨테이너도 자기만의 파일시스템이 있는 것처럼 보인다.

```text
Container A

/
├── bin
├── app
└── etc

Container B

/
├── bin
├── app
└── etc
```

하지만 실제로는 Linux Kernel의 Filesystem 기능과 Namespace를 이용합니다.

---

## 14. File Descriptor

File Descriptor는 Linux에서 중요한 개념입니다.

**File Descriptor = 프로세스가 열어놓은 파일이나 I/O 자원을 나타내는 번호**

기본적으로:

```text
0 = stdin
1 = stdout
2 = stderr
```

그래서:

```bash
echo hello
```

를 실행하면:

```text
Process
   ↓
stdout
FD 1
   ↓
Terminal
```

Docker가 로그를 받을 수 있는 것도 이 구조와 관련이 있습니다.

```text
Container nginx

stdout
stderr
   ↓
containerd-shim
   ↓
Docker logs
```

---

## 15. Socket

**Socket = 네트워크 통신을 위한 프로세스의 통신 endpoint**

Spring 서버가:

```text
localhost:8080
```

에서 기다린다고 하면:

```text
Spring Process

Socket
IP : 0.0.0.0
Port : 8080
```

클라이언트가 연결하면:

```text
Browser
   ↓
TCP
   ↓
Socket :8080
   ↓
Spring Process
```

Docker에서는 Network Namespace를 이용해서 컨테이너마다 네트워크 환경을 분리합니다.

---

## 16. Port

**Port = 한 컴퓨터에서 어떤 프로세스로 네트워크 데이터를 전달할지 구분하는 번호**

```text
Computer
IP 192.168.0.10

22   → SSH
80   → nginx
3306 → MySQL
8080 → Spring
```

Docker:

```bash
docker run -p 8080:80 nginx
```

이면:

```text
Host

8080
 ↓
Docker Network
 ↓
Container
80
 ↓
nginx
```

---

## 17. Namespace

Namespace는 Docker의 격리 구조를 이해할 때 매우 중요합니다.

**Namespace = 프로세스가 볼 수 있는 시스템 자원을 격리하는 Linux Kernel 기능**

예:

```text
PID Namespace
→ 다른 프로세스 안 보이게

Network Namespace
→ 네트워크 따로

Mount Namespace
→ 파일시스템 따로

UTS Namespace
→ hostname 따로

IPC Namespace
→ IPC 따로
```

이러한 격리를 통해 컨테이너는 다음과 같이 독립된 환경을 사용하는 것처럼 느낍니다.

```text
"나 혼자 컴퓨터를 사용하는 것 같은데?"
```

라고 느끼게 만듭니다.

---

## 18. cgroup

**cgroup = 프로세스가 사용할 수 있는 자원의 양을 제한하고 측정하는 Linux Kernel 기능**

```text
Container A

CPU ≤ 2 Core
Memory ≤ 2GB

Container B

CPU ≤ 4 Core
Memory ≤ 8GB
```

Kernel이 실제로 자원 사용량을 제한합니다.

```text
Process
   ↓
cgroup
   ↓
CPU / RAM 제한
```

그래서:

```text
Namespace
= 무엇을 볼 수 있는가

cgroup
= 얼마나 사용할 수 있는가
```

이렇게 구분하면 두 개념을 쉽게 이해할 수 있습니다.

---

## 19. Context Switch

CPU 하나가 여러 프로세스를 실행할 때 아주 빠르게 실행 대상을 바꾼다.

```text
CPU

시간 →

Process A
        Process B
                  Process C
                            Process A
```

전환할 때 CPU 상태를 저장하고 다시 불러와야 합니다.

이 과정을 **Context Switch**라고 합니다.

Context Switch가 너무 많으면 성능 비용, 즉 **Overhead**가 발생합니다.

---

## 20. 전체 연결

지금까지 살펴본 개념을 하나로 연결하면 다음과 같습니다.

```text
                   Application
              Spring / nginx / DB
                       │
                       │ Process
                       ▼
              ┌─────────────────┐
              │   User Space    │
              │                 │
              │ Process         │
              │ ├─ Thread       │
              │ ├─ Stack        │
              │ ├─ Heap         │
              │ ├─ Socket       │
              │ └─ File         │
              └────────┬────────┘
                       │
                   System Call
                       │
───────────────────────┼────────────────────
                       ▼
              ┌─────────────────┐
              │  Linux Kernel   │
              │                 │
              │ Process 관리    │
              │ Memory 관리     │
              │ Filesystem      │
              │ Network         │
              │ Namespace       │
              │ cgroup          │
              └────────┬────────┘
                       │
───────────────────────┼────────────────────
                       ▼
              ┌─────────────────┐
              │    Hardware     │
              │                 │
              │ CPU             │
              │ RAM             │
              │ SSD             │
              │ Network Card    │
              └─────────────────┘
```

그리고 Docker를 여기다 올리면:

```text
Docker

docker run nginx
        ↓
dockerd
        ↓
containerd
        ↓
runc
        ↓

Linux Kernel

Namespace 설정
cgroup 설정
rootfs 설정
        ↓

nginx Process
        ↓

CPU / RAM / Network / Disk 사용
```

## 학습 우선순위

처음부터 전부 외울 필요는 없습니다. **아래 순서대로 개념의 연결 관계를 익히는 것을 추천합니다.**

```text
1. Program
   ↓
2. Process
   ↓
3. Thread
   ↓
4. CPU
   ↓
5. Memory
   ↓
6. Kernel
   ↓
7. User Space / Kernel Space
   ↓
8. System Call
   ↓
9. Filesystem
   ↓
10. Network / Socket / Port
    ↓
11. Namespace
    ↓
12. cgroup
```

특히 Docker를 공부하고 있다면 다음 관계를 먼저 기억하면 됩니다.

```text
Program
→ 실행하면 Process

Process
→ CPU에서 실행되고 Memory를 사용함

Kernel
→ Process와 CPU/Memory/Network를 관리함

Docker Container
→ Kernel이 실행하는 Process를
   Namespace로 격리하고
   cgroup으로 자원을 제한한 것
```

이 **4줄이 Docker를 이해하기 위한 운영체제 기초의 핵심**입니다.
