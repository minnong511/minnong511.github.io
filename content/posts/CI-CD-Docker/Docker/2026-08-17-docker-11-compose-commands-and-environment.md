---
layout: post
title: "Docker 기초 11편: Compose 명령어와 환경 변수"
description: "Docker Compose 생명주기 명령어와 환경 변수, env_file, .env 및 Secret 사용 방법을 정리한다."
date: 2026-08-17 12:50:00 +0900
categories: [DevOps, Docker]
tags: [Docker, Docker Compose, Docker CLI, Environment Variable, Secret]
series: "Docker 기초"
part: 11
legacyPath: "/devops/docker/2026/08/17/docker-11-compose-commands-and-environment/"
---
## 1. Compose 생명주기와 명령어

### 먼저 알아둘 단어

| 단어 | 뜻 | 쉬운 비유 |
|---|---|---|
| `up` | 필요한 리소스를 만들고 서비스를 시작 | 가게 전체 영업 시작 |
| `stop` | 컨테이너를 삭제하지 않고 중지 | 영업 일시 중단 |
| `start` | 중지된 기존 컨테이너 시작 | 다시 영업 시작 |
| `restart` | 기존 컨테이너 재시작 | 전원을 껐다 켜기 |
| `down` | Compose가 만든 컨테이너와 네트워크 제거 | 가게 철거 |
| Recreate | 기존 컨테이너를 새 설정으로 다시 생성 | 새 설계로 시설 교체 |

> 쉬운 비유: `stop`은 주차, `down`은 차량 폐차에 가깝다. `down`을 해도 기본적으로 named volume이라는 별도 창고는 남지만, `down -v`는 그 창고까지 없앤다.

### 명령어 이름의 유래와 기억법

Compose 명령어는 대부분 영어 동사나 Unix 명령어에서 가져왔다. 짧은 옵션은 긴 옵션의 앞글자를 딴 경우가 많다. 원래 단어를 알면 명령어를 외우기보다 뜻으로 이해할 수 있다.

| 명령어,옵션 | 원래 말 | 왜 이렇게 쓰나 |
|---|---|---|
| `up` / `down` | bring **up** / take **down** | 시스템을 올려 사용할 수 있게 하거나 내려서 정리한다는 표현입니다. 서버와 네트워크 분야에서도 흔히 사용합니다. |
| `-d` | `--detach` | **detach**는 분리한다는 뜻입니다. 터미널에서 프로세스를 분리해 백그라운드로 실행합니다. |
| `ps` | **process status** | Unix의 `ps` 명령에서 온 이름입니다. 원래는 실행 중인 프로세스 상태를 보여 주며, Compose에서는 서비스 컨테이너 상태를 보여 줍니다. |
| `-a` | `--all` | 실행 중인 컨테이너뿐 아니라 중지된 컨테이너까지 **모두** 표시합니다. |
| `logs` | log의 복수형 | 여러 서비스와 컨테이너가 남긴 로그를 모아서 보여 주므로 하위 명령 이름이 `log`가 아니라 `logs`입니다. |
| `-f` | `--follow` | 새 로그가 생길 때마다 계속 **따라가며** 출력합니다. Unix의 `tail -f`와 같은 감각입니다. |
| `--tail=100` | 로그의 tail | **tail**은 꼬리라는 뜻으로, 로그의 끝부분 100줄만 봅니다. |
| `exec` | **execute** | 이미 실행 중인 컨테이너 안에서 명령을 **실행**합니다. |
| `-q` | `--quiet` | 부가 설명 없이 조용히 ID만 출력합니다. 다른 명령에 결과를 넘길 때 편리합니다. |
| `rm` | **remove** | Unix의 파일 삭제 명령 `rm`처럼 대상을 제거한다는 뜻입니다. Compose에서는 중지된 서비스 컨테이너를 제거합니다. |
| `-v` | `--volumes` | 컨테이너와 네트워크뿐 아니라 연결된 Compose Volume도 함께 제거합니다. 데이터 삭제에 주의해야 합니다. |
| `-f` | `--file` | `docker compose -f compose.yaml`에서는 사용할 Compose **파일**을 지정합니다. 같은 `-f`라도 `logs -f`의 `follow`와는 문맥이 다릅니다. |
| `-p` | `--project-name` | Compose **프로젝트 이름**을 지정해 같은 설정을 서로 다른 묶음으로 실행합니다. |

긴 옵션도 단어를 `-`로 연결해 그대로 읽으면 이해하기 쉽습니다. 예를 들어 `--no-deps`는 "dependencies(의존 서비스) 없이", `--no-cache`는 "cache 없이", `--force-recreate`는 "강제로 다시 생성"이라는 뜻입니다.

### 1.1 빌드와 실행

```bash
# 포그라운드 실행
docker compose up

# 백그라운드 실행
docker compose up -d

# 이미지를 빌드한 뒤 실행
docker compose up -d --build

# 특정 서비스와 필요한 의존 서비스만 실행
docker compose up -d backend

# 특정 서비스를 의존 서비스 없이 실행
docker compose up -d --no-deps backend

# 이미지 빌드
docker compose build
docker compose build backend
docker compose build --no-cache backend
```

`up --build`는 빌드 후 실행하고, 설정이나 이미지가 달라졌다면 필요한 컨테이너를 재생성한다.

```bash
# 설정 변경을 확실히 반영하도록 강제 재생성
docker compose up -d --force-recreate backend
```

`docker compose restart`는 기존 컨테이너만 다시 시작합니다. Compose 파일에서 바꾼 환경 변수나 볼륨 설정을 반영하려면 `up`으로 재생성해야 한다.

### 1.2 상태, 로그, 설정 확인

```bash
# 서비스 상태
docker compose ps
docker compose ps -a

# 로그 확인
docker compose logs
docker compose logs -f --tail=100 backend

# 변수 치환과 파일 병합이 끝난 최종 구성 확인
docker compose config

# Compose가 변수 보간에 사용한 환경 확인
docker compose config --environment

# 실행 중인 컨테이너에서 명령 실행
docker compose exec backend sh
docker compose exec backend cat /etc/resolv.conf
docker compose exec backend getent hosts db
```

`logs -f`는 로그 출력을 끝내지 않고 새 로그를 계속 기다린다. 빠져나올 때는 `Ctrl+C`를 누릅니다. `ps -a`의 `-a`는 `all`, `ps -q`의 `-q`는 `quiet`를 뜻하므로 각각 "전부 보기", "ID만 간단히 보기"로 기억하면 된다.

이미지에 `bash`, `ping`, `curl` 등이 설치되어 있지 않을 수 있습니다. 이런 경우 `sh`, `getent`, 애플리케이션 자체 진단 명령을 사용하거나 별도의 디버깅 컨테이너를 실행해야 헌다.

컨테이너 단위의 상세 정보는 실제 컨테이너 이름 또는 ID를 구한 뒤 확인한다.

```bash
docker compose ps -q backend
docker inspect "$(docker compose ps -q backend)" | less
```

`docker inspect`에서는 상태, 종료 코드, OOM 여부, 네트워크, 마운트, 환경 변수, 실행 명령, Healthcheck 결과 등을 확인할 수 있다.

### 1.3 중지와 제거

```bash
# 삭제 없이 중지하고 다시 시작
docker compose stop
docker compose start
docker compose restart backend

# 중지된 서비스 컨테이너 제거
docker compose rm

# 컨테이너와 Compose 네트워크 제거
docker compose down

# 고아 컨테이너도 함께 제거
docker compose down --remove-orphans

# named volume까지 제거: 데이터 삭제 주의
docker compose down -v
```

`down -v`는 Compose 파일에 선언한 named volume과 연결된 anonymous volume을 제거할 수 있습니다. `external: true`로 선언한 외부 Volume과 Network는 Compose가 제거하지 않는다.

### 1.4 Compose 파일과 프로젝트 이름 지정

```bash
# 특정 Compose 파일 사용
docker compose -f compose.app1.yaml ps

# 여러 파일을 순서대로 병합
docker compose \
  -f compose.yaml \
  -f compose.prod.yaml \
  up -d

# 프로젝트 이름 지정
docker compose -p app1 up -d
docker compose -p app1 logs -f
docker compose -p app1 down

# 같은 Compose 파일을 app2라는 별도 환경으로 실행
docker compose -p app2 up -d
```

#### 왜 `-f`를 사용하는가?

Compose는 `-f`를 생략하면 현재 디렉터리를 기준으로 `compose.yaml` 같은 기본 파일을 찾는다. `-f`는 **file**의 약자로, 기본 파일이 아닌 다른 Compose 파일을 선택할 때 사용한다.

개발과 운영처럼 환경마다 설정이 다르면 모든 내용을 한 파일에 넣기보다 공통 설정과 환경별 설정을 나눌 수 있다.

```text
compose.yaml          공통 기본 설정
        +
compose.prod.yaml     운영 환경에서 추가하거나 바꿀 설정
        =
운영 환경의 최종 Compose 설정
```

여러 `-f`를 사용하면 앞쪽 파일부터 순서대로 병합하며, 뒤쪽 파일이 앞쪽 설정을 보완하거나 덮어쓴다. 이를 이용하면 `compose.yaml`에는 공통 서비스 설정을 두고 `compose.prod.yaml`에는 운영용 포트, 재시작 정책 같은 차이만 둘 수 있다.

병합 규칙은 필드에 따라 다르므로 실행 전에 같은 `-f` 옵션과 `config` 명령으로 최종 결과를 확인하는 것이 안전하다.

```bash
docker compose \
  -f compose.yaml \
  -f compose.prod.yaml \
  config
```

#### 왜 `-p`를 사용하는가?

Compose는 컨테이너, 네트워크, Volume 같은 관련 리소스를 하나의 **프로젝트**로 묶어 관리한다. `-p`는 **project name**의 약자로, 이 묶음의 이름을 직접 지정할 때 사용한다. 생략하면 일반적으로 Compose 파일이 있는 디렉터리 이름을 기준으로 프로젝트 이름을 정한다.

같은 Compose 파일이라도 프로젝트 이름이 다르면 서로 독립된 환경으로 실행할 수 있다.

```text
app1 프로젝트 → app1-web-1 컨테이너, app1_default 네트워크
app2 프로젝트 → app2-web-1 컨테이너, app2_default 네트워크
```

따라서 같은 설정으로 개발 환경을 여러 개 띄우거나 개발, 테스트, CI 환경의 리소스가 서로 충돌하지 않게 할 때 유용하다. `-p app1`로 실행했다면 상태 확인, 로그 확인, 종료에도 같은 프로젝트 이름을 지정해야 해당 리소스를 찾을 수 있다.

```bash
docker compose -p app1 ps
docker compose -p app1 logs -f
docker compose -p app1 down
```

여기서 두 종류의 `-f`는 위치에 따라 의미가 다르다.

```bash
docker compose -f compose.yaml logs -f
#              └ file 지정       └ follow: 새 로그 계속 보기
```

> 쉬운 비유: `-f`는 "어떤 설계도를 사용할지", `-p`는 "그 설계도로 만든 건물을 어떤 단지 이름으로 관리할지" 정하는 옵션.

---

## 2. 환경 변수와 Secret

### 먼저 알아둘 단어

| 단어 | 뜻 | 쉬운 비유 |
|---|---|---|
| Interpolation | `${VAR}` 자리에 값을 넣어 Compose 파일을 완성 | 문서의 빈칸 채우기 |
| `.env` | Compose 파일의 변수 치환에 기본적으로 사용하는 파일 | 설계도 작성용 값 목록 |
| `environment` | 컨테이너에 직접 전달할 환경 변수 | 작업자 주머니에 넣는 지시서 |
| `env_file` | 컨테이너 환경 변수를 여러 개 읽어올 파일 | 지시사항 묶음 파일 |
| Secret | 비밀번호,토큰 같은 민감한 값을 파일로 전달하는 기능 | 봉인된 보안 문서 |

> 쉬운 비유: `.env`는 설계도의 빈칸을 채우는 메모이고, `environment`와 `env_file`은 완성된 건물 안의 작업자에게 전달되는 값입니다. 둘은 목적이 다르다.

### 2.1 `environment`

Map 형태가 읽기 쉽고 타입 혼동을 줄이기 좋다. 숫자나 `true`, `false`처럼 YAML이 다른 타입으로 해석할 수 있는 값은 문자열로 따옴표 처리하는 편이 안전하다.

```yaml
services:
  web:
    image: nginx:alpine
    environment:
      APP_ENV: production
      PORT: "8080"
```

List 형태도 사용할 수 있습니다.

```yaml
services:
  web:
    image: nginx:alpine
    environment:
      - APP_ENV=production
      - PORT=8080
```

### 2.2 `env_file`

```dotenv
# config/backend.env
APP_ENV=development
DB_HOST=db
DB_PORT=5432
```

```yaml
services:
  backend:
    image: my-backend:1.0
    env_file:
      - ./config/backend.env
```

같은 변수에 대해 서비스의 `environment`와 `env_file`이 모두 값을 제공하면 `environment`가 우선합니다. 이미지 Dockerfile의 `ENV`보다 Compose에서 전달한 값이 우선한다.

### 2.3 `.env`와 변수 보간

프로젝트 루트의 `.env` 파일입니다.

```dotenv
FRONTEND_PORT=8080
DB_PASSWORD=local-development-only
```

Compose 파일에서 값을 참조합니다.

```yaml
services:
  frontend:
    image: nginx:alpine
    ports:
      - "${FRONTEND_PORT:-8080}:80"

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: "${DB_PASSWORD:?DB_PASSWORD를 설정하세요}"
```

- `${VAR}`: 변수 값 사용
- `${VAR:-default}`: 값이 없거나 비어 있으면 기본값 사용
- `${VAR:?message}`: 값이 없거나 비어 있으면 오류 발생

`.env`의 모든 값이 컨테이너에 자동으로 주입되는 것은 아니다. 위 예제처럼 Compose 파일에서 `environment` 등에 참조해야 컨테이너로 전달된다.

비밀번호를 `.env`에 저장했다면 해당 파일도 Git에 커밋하지 않아야 한다. `.env.example`에는 변수 이름과 안전한 예시만 남기는 방식이 일반적.

다른 변수 파일을 보간에 사용하려면 다음처럼 실행.

```bash
docker compose --env-file .env.production up -d
```

현재 Shell의 환경 변수는 일반적으로 `.env`보다 변수 보간 우선순위가 높다.

```bash
APP_ENV=production docker compose up -d
```

`docker compose up -e ...` 형태는 사용하지 않는다. 일회성 컨테이너에 환경 변수를 전달할 때는 `run -e`를 사용할 수 있다.

```bash
docker compose run --rm -e APP_ENV=debug backend ./debug-task
```

### 2.4 Secret

민감한 값을 Compose 파일이나 이미지에 직접 적는 대신 파일 기반 Secret으로 마운트할 수 있다.

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

컨테이너에서는 `/run/secrets/db_password` 파일로 값을 읽는다. 로컬 Secret 원본 파일은 Git에 커밋하지 않아야 한다. 일반 Docker Compose의 파일 기반 Secret은 전문 Secret Manager와 동일한 보안,감사 기능을 제공하지 않으므로 운영 환경에서는 별도 비밀 관리 도구도 고려해야 한다.

---
