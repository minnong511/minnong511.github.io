---
layout: post
title: "Docker 기초 5편: 컨테이너 기본 명령어와 Volume"
description: " Docker Network, 컨테이너 명령어와 Volume."
date: 2026-08-17 12:20:00 +0900
categories: [DevOps, Docker]
tags: [Docker, Container, Network, Volume, Docker CLI]
series: "Docker 기초"
part: 5
legacyPath: "/devops/docker/2026/08/17/docker-05-container-commands-and-volumes/"
---
## Docker 볼륨

Docker 볼륨은 컨테이너의 데이터를 컨테이너 밖에 따로 보관하는 저장 공간이다.

컨테이너를 임시 작업실이라고 보면 볼륨은 작업실이 철거되어도 남아 있는 외부 창고와 같다.

> 컨테이너의 화물이 잘 보관되려면 창고에 가야하지 않겠는가? 그 창고 역할을 하는 것이 Volume이다. 

```text
컨테이너 삭제
  └── 컨테이너 내부에만 저장한 데이터 삭제

컨테이너 삭제
  └── 볼륨에 저장한 데이터 유지
```

DB 컨테이너를 볼륨 없이 삭제하면 데이터베이스 데이터도 함께 사라진다. 볼륨을 연결하면 새 컨테이너에서도 기존 데이터를 다시 사용할 수 있다.

> 어때요, 참 쉽죠?

```bash
# mariadb-data 볼륨 생성
docker volume create mariadb-data

# MariaDB 데이터 저장 경로에 볼륨 연결
docker run -d \
  --name mariadb \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=skala \
  -p 3306:3306 \
  -v mariadb-data:/var/lib/mysql \
  mariadb:latest
```

볼륨 연결 옵션은 `-v mariadb-data:/var/lib/mysql`이다.

| 구분 | 의미 |
| --- | --- |
| `mariadb-data` | Docker가 관리하는 볼륨 이름 |
| `/var/lib/mysql` | 컨테이너에서 MariaDB 데이터가 저장되는 경로 |
| `:` | 왼쪽 저장 공간과 오른쪽 경로를 연결 |

```text
MariaDB가 /var/lib/mysql에 데이터 저장
  ↓
mariadb-data 볼륨에 실제 데이터 보관
  ↓
MariaDB 컨테이너를 삭제해도 볼륨 유지
  ↓
새 컨테이너에 같은 볼륨을 연결해 데이터 재사용
```

```bash
# 볼륨 목록 확인
docker volume ls

# 볼륨 상세 정보 확인
docker volume inspect mariadb-data

# 사용하지 않는 볼륨 정리
docker volume prune
```

> `docker volume prune`은 사용하지 않는 볼륨을 삭제하므로 삭제 대상을 먼저 확인한다.

## 컨테이너 기본 활용

Docker 명령은 일반적으로 `docker <대상> <명령> [옵션]` 형식으로 작성한다. 사용자 권한과 설치 방식에 따라 `sudo`가 필요할 수 있지만 항상 root 권한으로 실행해야 하는 것은 아니다.

이미지는 Docker Hub 같은 공개 Registry 또는 조직에서 운영하는 Private Registry에 저장할 수 있다.

### 참고: Docker Hub 이미지 이름

Docker Hub의 공식 `nginx` 이미지를 전체 이름으로 표현하면 다음과 같다.

```text
nginx → docker.io/library/nginx:latest
```

- Registry가 생략되면 기본적으로 `docker.io`를 사용한다.
- Namespace가 생략된 공식 이미지는 `library`에서 찾는다.
- Tag가 생략되면 기본적으로 `latest`를 사용한다.
- Podman과 Buildah의 비정규화 이미지 검색 Registry는 `/etc/containers/registries.conf`에서 확인할 수 있다.

```bash
cat /etc/containers/registries.conf
```

## 프로세스와 포트 강제 종료

```bash
sudo pkill -9 -f -i docker
```

- `sudo`: 관리자 권한으로 실행
- `pkill`: 조건에 맞는 프로세스 종료
- `-9`: 프로세스 즉시 강제 종료
- `-f`: 프로세스의 전체 실행 명령 검색
- `-i`: 대소문자를 구분하지 않고 검색

```bash
lsof -ti :8080 | xargs kill -9
```

- `lsof -ti :8080`: 8080 포트를 사용하는 프로세스 ID(PID) 출력
- `|`: 앞 명령의 출력을 다음 명령으로 전달
- `xargs kill -9`: 전달받은 PID의 프로세스를 즉시 강제 종료

> 두 명령 모두 프로세스를 강제로 종료하므로 일반적인 종료 명령이 실패했을 때만 사용한다.
