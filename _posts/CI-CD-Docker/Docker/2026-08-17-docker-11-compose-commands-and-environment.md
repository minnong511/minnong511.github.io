---
layout: post
title: "Docker 기초 11편: Compose 명령어와 환경 변수"
description: "Docker Compose 생명주기 명령어와 환경 변수, env_file, .env 및 Secret 사용 방법을 정리한다."
date: 2026-08-17 12:50:00 +0900
categories: [DevOps, Docker]
tags: [Docker, Docker Compose, Docker CLI, Environment Variable, Secret]
series: "Docker 기초"
part: 11
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

> 쉬운 비유: `stop`은 주차, `down`은 차량 폐차에 가깝습니다. `down`을 해도 기본적으로 named volume이라는 별도 창고는 남지만, `down -v`는 그 창고까지 없앱니다.

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

`up --build`는 빌드 후 실행하고, 설정이나 이미지가 달라졌다면 필요한 컨테이너를 재생성합니다.

```bash
# 설정 변경을 확실히 반영하도록 강제 재생성
docker compose up -d --force-recreate backend
```

`docker compose restart`는 기존 컨테이너만 다시 시작합니다. Compose 파일에서 바꾼 환경 변수나 볼륨 설정을 반영하려면 `up`으로 재생성해야 합니다.

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

이미지에 `bash`, `ping`, `curl` 등이 설치되어 있지 않을 수 있습니다. 이런 경우 `sh`, `getent`, 애플리케이션 자체 진단 명령을 사용하거나 별도의 디버깅 컨테이너를 실행해야 합니다.

컨테이너 단위의 상세 정보는 실제 컨테이너 이름 또는 ID를 구한 뒤 확인합니다.

```bash
docker compose ps -q backend
docker inspect "$(docker compose ps -q backend)" | less
```

`docker inspect`에서는 상태, 종료 코드, OOM 여부, 네트워크, 마운트, 환경 변수, 실행 명령, Healthcheck 결과 등을 확인할 수 있습니다.

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

`down -v`는 Compose 파일에 선언한 named volume과 연결된 anonymous volume을 제거할 수 있습니다. `external: true`로 선언한 외부 Volume과 Network는 Compose가 제거하지 않습니다.

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
docker compose -p app2 logs -f
```

여러 Compose 파일을 사용하면 뒤쪽 파일이 앞쪽 설정을 보완하거나 덮어씁니다. 병합 규칙은 필드에 따라 다르므로 실행 전 `docker compose config`로 최종 결과를 확인하는 것이 안전합니다.

---

## 2. 환경 변수와 Secret

### 먼저 알아둘 단어

| 단어 | 뜻 | 쉬운 비유 |
|---|---|---|
| Interpolation | `${VAR}` 자리에 값을 넣어 Compose 파일을 완성 | 문서의 빈칸 채우기 |
| `.env` | Compose 파일의 변수 치환에 기본적으로 사용하는 파일 | 설계도 작성용 값 목록 |
| `environment` | 컨테이너에 직접 전달할 환경 변수 | 작업자 주머니에 넣는 지시서 |
| `env_file` | 컨테이너 환경 변수를 여러 개 읽어올 파일 | 지시사항 묶음 파일 |
| Secret | 비밀번호·토큰 같은 민감한 값을 파일로 전달하는 기능 | 봉인된 보안 문서 |

> 쉬운 비유: `.env`는 설계도의 빈칸을 채우는 메모이고, `environment`와 `env_file`은 완성된 건물 안의 작업자에게 전달되는 값입니다. 둘은 목적이 다릅니다.

### 2.1 `environment`

Map 형태가 읽기 쉽고 타입 혼동을 줄이기 좋습니다. 숫자나 `true`, `false`처럼 YAML이 다른 타입으로 해석할 수 있는 값은 문자열로 따옴표 처리하는 편이 안전합니다.

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

같은 변수에 대해 서비스의 `environment`와 `env_file`이 모두 값을 제공하면 `environment`가 우선합니다. 이미지 Dockerfile의 `ENV`보다 Compose에서 전달한 값이 우선합니다.

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

`.env`의 모든 값이 컨테이너에 자동으로 주입되는 것은 아닙니다. 위 예제처럼 Compose 파일에서 `environment` 등에 참조해야 컨테이너로 전달됩니다.

비밀번호를 `.env`에 저장했다면 해당 파일도 Git에 커밋하지 않아야 합니다. `.env.example`에는 변수 이름과 안전한 예시만 남기는 방식이 일반적입니다.

다른 변수 파일을 보간에 사용하려면 다음처럼 실행합니다.

```bash
docker compose --env-file .env.production up -d
```

현재 Shell의 환경 변수는 일반적으로 `.env`보다 변수 보간 우선순위가 높습니다.

```bash
APP_ENV=production docker compose up -d
```

`docker compose up -e ...` 형태는 사용하지 않습니다. 일회성 컨테이너에 환경 변수를 전달할 때는 `run -e`를 사용할 수 있습니다.

```bash
docker compose run --rm -e APP_ENV=debug backend ./debug-task
```

### 2.4 Secret

민감한 값을 Compose 파일이나 이미지에 직접 적는 대신 파일 기반 Secret으로 마운트할 수 있습니다.

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

컨테이너에서는 `/run/secrets/db_password` 파일로 값을 읽습니다. 로컬 Secret 원본 파일은 Git에 커밋하지 않아야 합니다. 일반 Docker Compose의 파일 기반 Secret은 전문 Secret Manager와 동일한 보안·감사 기능을 제공하지 않으므로 운영 환경에서는 별도 비밀 관리 도구도 고려해야 합니다.

---
