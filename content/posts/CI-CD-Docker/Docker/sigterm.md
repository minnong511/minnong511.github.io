---
layout: post
title: "sigterm"
description: "Docker 컨테이너가 종료될 때 Docker는 컨테이너의 PID 1 프로세스에 SIGTERM을 보냅니다. 따라서 어떤 프로세스가 PID 1인지가 Graceful Shutdown의 핵심입니다."
date: "2026-08-24 13:57:58 +0900"
categories: ["CI-CD-Docker", "Docker"]
tags: []
legacyPath: "/ci-cd-docker/docker/2026/08/24/sigterm/"
---
## 세 가지 CMD 실행 방식 비교

Docker 컨테이너가 종료될 때 Docker는 컨테이너의 **PID 1 프로세스에 SIGTERM**을 보냅니다. 따라서 어떤 프로세스가 PID 1인지가 Graceful Shutdown의 핵심입니다.

---

## 실습 1. Exec Form, Python 직접 실행

### Dockerfile

```dockerfile
ARG UBUNTU_VERSION=22.04
FROM ubuntu:${UBUNTU_VERSION}

RUN apt-get update && \
    apt-get install -y python3 python3-pip

WORKDIR /app
COPY webserver.py .

CMD ["python3", "-u", "webserver.py"]
```

### 프로세스 구조

```text
Docker
└── PID 1: python3 -u webserver.py
```

컨테이너 내부에서 확인하면:

```bash
ps -ef
```

```text
UID    PID  PPID  CMD
root     1     0  python3 -u webserver.py
root     7     0  /bin/bash
root    15     7  ps -ef
```

Python이 직접 `PID 1`로 실행됩니다.

### 종료 과정

```bash
docker stop linux-container
```

```text
Docker
  │
  │ SIGTERM
  ▼
PID 1: Python
  │
  ▼
handle_sigterm() 실행
  │
  ▼
서버와 자원 정리 후 종료
```

따라서 다음 로그가 바로 출력됩니다.

```text
SIGTERM 신호 수신
SIGTERM 처리 종료
```

### 왜 사용하는가?

Python, Spring Boot, FastAPI 같은 애플리케이션이 SIGTERM을 직접 받을 수 있기 때문입니다.

SIGTERM을 받은 애플리케이션은 다음 작업을 수행할 수 있습니다.

- 처리 중인 요청 마무리
- HTTP 서버 종료
- 데이터베이스 연결 해제
- 파일과 네트워크 자원 정리
- 로그 저장
- Graceful Shutdown 수행

별도의 셸 기능이 필요 없다면 가장 권장되는 방식입니다.

```dockerfile
CMD ["python3", "-u", "webserver.py"]
```

---

## 실습 2. Shell을 거쳐 자식 프로세스로 실행

### Dockerfile

```dockerfile
CMD ["/bin/sh", "-c", "python3 -u webserver.py"]
```

엄밀히 말하면 Dockerfile 문법 자체는 JSON 배열을 사용한 Exec Form입니다. 하지만 `/bin/sh -c`를 직접 실행하므로 실제 동작은 셸을 거치는 Shell Form과 비슷합니다.

일반적인 Shell Form으로 작성하면 다음과 같습니다.

```dockerfile
CMD python3 -u webserver.py
```

두 방식 모두 셸이 중간에 들어갈 수 있습니다.

### 프로세스 구조

```text
Docker
└── PID 1: /bin/sh
    └── PID 7: python3 -u webserver.py
```

`ps -ef` 결과:

```text
UID    PID  PPID  CMD
root     1     0  /bin/sh -c python3 -u webserver.py
root     7     1  python3 -u webserver.py
```

- `/bin/sh`: PID 1
- `python3`: 셸이 생성한 자식 프로세스
- Python의 PPID: 셸의 PID인 `1`

### 종료 과정

```bash
docker stop linux-container
```

Docker는 Python이 아니라 PID 1인 셸에 SIGTERM을 보냅니다.

```text
Docker
  │
  │ SIGTERM
  ▼
PID 1: /bin/sh
  │
  │ Python에 전달되지 않을 수 있음
  ▼
PID 7: Python
```

셸이 SIGTERM을 Python에 전달하지 않으면 Python의 신호 처리 함수가 실행되지 않습니다.

```python
def handle_sigterm(signum, frame):
    print("SIGTERM 신호 수신")
    httpd.server_close()
    sys.exit(0)
```

따라서 다음 로그가 나오지 않을 수 있습니다.

```text
SIGTERM 신호 수신
SIGTERM 처리 종료
```

### Docker의 실제 종료 동작

`docker stop`이 곧바로 SIGKILL을 보내는 것은 아닙니다.

```text
SIGTERM 전송
    ↓
기본 10초 동안 종료 대기
    ↓
종료되지 않으면 SIGKILL 전송
```

Kubernetes에서는 일반적으로 종료 유예 시간이 기본 30초입니다. 이 시간이 지나도 종료되지 않으면 강제 종료될 수 있습니다.

### 왜 사용하는가?

셸 기능이 필요할 때 사용할 수 있습니다.

예를 들면:

```dockerfile
CMD ["/bin/sh", "-c", "python3 $APP_FILE"]
```

```dockerfile
CMD ["/bin/sh", "-c", "python3 webserver.py > server.log 2>&1"]
```

셸은 다음 기능을 사용할 때 필요합니다.

- 환경변수 치환
- 파이프 `|`
- 출력 리다이렉션 `>`
- 여러 명령 연결 `&&`
- 와일드카드 `*`

하지만 셸을 단순히 Python 실행용으로만 사용하면 신호 전달과 프로세스 관리가 복잡해집니다.

---

## 실습 3. Shell with Exec, 프로세스 치환

### Dockerfile

```dockerfile
CMD ["/bin/sh", "-c", "exec python3 -u webserver.py"]
```

처음에는 셸이 실행되지만, `exec`가 셸을 Python 프로세스로 교체합니다.

### 실행 직후

```text
PID 1: /bin/sh
```

셸이 다음 명령을 처리합니다.

```bash
exec python3 -u webserver.py
```

### exec 실행 후

```text
PID 1: python3 -u webserver.py
```

새로운 자식 프로세스를 만드는 것이 아니라, 기존 셸 프로세스가 Python으로 바뀝니다. PID는 그대로 `1`입니다.

`ps -ef` 결과:

```text
UID    PID  PPID  CMD
root     1     0  python3 -u webserver.py
root     7     0  /bin/bash
root    15     7  ps -ef
```

### 종료 과정

```text
Docker
  │
  │ SIGTERM
  ▼
PID 1: Python
  │
  ▼
handle_sigterm() 실행
  │
  ▼
Graceful Shutdown
```

따라서 실습 1과 마찬가지로 Python이 SIGTERM을 직접 받습니다.

### 왜 사용하는가?

셸 기능이 필요하지만, 최종 애플리케이션이 PID 1이 되어야 할 때 사용합니다.

예를 들어 환경변수를 조합하거나 실행 전 작업이 필요할 수 있습니다.

```dockerfile
CMD ["/bin/sh", "-c", "echo '서버 시작' && exec python3 -u webserver.py"]
```

여기서 중요한 부분은 마지막의 `exec`입니다.

```bash
exec python3 -u webserver.py
```

`exec`가 없으면 Python은 셸의 자식 프로세스가 됩니다. `exec`가 있으면 셸이 Python으로 교체됩니다.

---

## 세 방식 요약

| 방식 | PID 1 | Python의 SIGTERM 수신 | 주요 용도 |
|---|---|---:|---|
| `CMD ["python3", "-u", "webserver.py"]` | Python | 직접 수신 | 일반적으로 가장 권장 |
| `CMD ["/bin/sh", "-c", "python3 -u webserver.py"]` | Shell | 전달되지 않을 수 있음 | 셸 기능이 필요하지만 신호 처리에 주의 |
| `CMD ["/bin/sh", "-c", "exec python3 -u webserver.py"]` | 최종적으로 Python | 직접 수신 | 셸 처리 후 애플리케이션을 PID 1로 실행 |

### 선택 기준

단순히 프로그램 하나만 실행한다면:

```dockerfile
CMD ["python3", "-u", "webserver.py"]
```

셸 기능이 반드시 필요하다면:

```dockerfile
CMD ["/bin/sh", "-c", "exec python3 -u webserver.py"]
```

피하는 편이 좋은 구조:

```dockerfile
CMD ["/bin/sh", "-c", "python3 -u webserver.py"]
```

---

## `-u` 옵션의 의미

```bash
python3 -u webserver.py
```

`-u`는 SIGTERM과 직접 관계가 없습니다. Python의 표준 출력과 표준 오류를 버퍼링하지 않도록 설정합니다.

따라서 다음 로그가 바로 `docker logs`에 나타납니다.

```text
Starting server on port 8080...
SIGTERM 신호 수신
SIGTERM 처리 종료
```

컨테이너 환경에서는 로그를 즉시 확인하기 위해 자주 사용합니다.

---

## 현재 폴더 구조에서 실습하는 명령어

현재 파일 위치가 다음과 같기 때문에:

```text
ubuntu/
├── dockerfile
└── mydata/
    └── webserver.py
```

각 버전의 Dockerfile을 수정한 다음 프로젝트 루트에서 빌드합니다.

### 1.0, Exec Form

```bash
docker build -f ubuntu/dockerfile -t linux-container:1.0 ubuntu/mydata
```

### 1.1, Shell 실행

```bash
docker build -f ubuntu/dockerfile -t linux-container:1.1 ubuntu/mydata
```

### 1.2, Shell with Exec

```bash
docker build -f ubuntu/dockerfile -t linux-container:1.2 ubuntu/mydata
```

실행:

```bash
docker run --rm -d \
  --name linux-container \
  -p 8080:8080 \
  linux-container:1.2
```

프로세스 확인:

```bash
docker exec -it linux-container /bin/bash
ps -ef
```

로그를 띄운 상태에서:

```bash
docker logs -f linux-container
```

다른 터미널에서 종료합니다.

```bash
docker stop linux-container
```

참고로 `--rm`으로 실행한 컨테이너는 종료 후 자동으로 삭제됩니다. 따라서 이후의 `docker rm linux-container`는 필요하지 않습니다. 또한 자료의 `docker exec -it python-container`는 컨테이너 이름이 잘못된 것으로 보이며, 다음이 맞습니다.

```bash
docker exec -it linux-container /bin/bash
```
