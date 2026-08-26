---
layout: post
title: "OCI: 컨테이너 이미지와 런타임의 공통 표준"
description: "OCI가 등장한 배경과 Image, Runtime, Distribution Specification의 역할, Docker와 Kubernetes에서 OCI가 사용되는 흐름을 정리한다."
date: 2026-08-24 00:50:00 +0900
categories: [DevOps, Docker]
tags: [OCI, Docker, Container, containerd, runc, Kubernetes]
legacyPath: "/devops/docker/2026/08/24/oci-container-standard/"
---
## OCI(Open Container Initiative)란?

> OCI는 "컨테이너 이미지와 컨테이너 실행 방식에 대한 국제 공통 규격"

Docker가 만든 이미지를 Docker에서만 실행하는 게 아니라, containerd, CRI-O, Kubernetes, Podman 같은 다른 생태계에서도 동일하게 사용할 수 있게 해주는 표준

# 1. OCI는 왜 등장했는가? 

초창기 컨테이너 시장 -> Docker가 거의 표준처럼 쓰임

```text
Docker Image
    ↓
Docker Engine
    ↓
Container
```

문제는 이러면 Docker라는 특정 회사와 구현체에 생태계가 강하게 종속될 수 있다는 것 

```text
Docker Image
    ↓
Docker에서만 실행 가능

A회사 Image
    ↓
A회사 Runtime에서만 실행 가능

B회사 Image
    ↓
B회사 Runtime에서만 실행 가능
```

따라서 Docker, Google, Red Hat, IBM, Microsoft 등 여러 기업이 참여해서 만든 표준화 프로젝트가 OCI(Open Container Initiative)

이와 같이 모인 목적은 

> 컨테이너를 어떤 형식으로 만들고, 어떻게 실행하면 좋을까하는 공통 규격을 만들자. 

라는 일념하에 힘을 합치게 된다. 

# 2. OCI는 프로그램이 아니다. 

> OCI는 설계도 / 규격이고 runc 같은 프로그램이 그 규격을 구현

OCI 자체는 Docker나 containerd처럼 실행되는 프로그램이 아니다. 

```text
Docker      → 프로그램
containerd  → 프로그램
runc        → 프로그램

OCI         → 표준 Specification
```

비유를 해보자면 

```text
HTTP   = 웹 통신 규칙
Chrome = HTTP를 사용하는 프로그램

OCI    = 컨테이너 규칙
runc   = OCI 규칙을 구현한 프로그램
```


# 3. OCI의 핵심 3가지 표준

OCI에서는 크게 세 가지를 정의

```text
OCI
├── Image Specification
├── Runtime Specification
└── Distribution Specification
```

각각이 약간씩 다르므로 아래서 좀 설명을 해보려 한다. 

# 4. OCI Image Specification

컨테이너 이미지를 어떤 구조로 저장할 것인가를 정의

Docker 이미지를 생각하면 된다.

예를 들어 

```text
nginx image
├── Layer 4  nginx 설정
├── Layer 3  nginx 설치
├── Layer 2  라이브러리
└── Layer 1  Ubuntu filesystem
```

OCI Image Spec은 다음과 같은 것을 정의

```text
Image
├── Manifest
├── Config
└── Layers
```

예를 들면 

```text
Manifest
    ↓
어떤 Config와 Layer를 사용하는지 기록

Config
    ├── 환경변수
    ├── 실행 명령어
    ├── Working Directory
    └── Architecture

Layers
    ↓
실제 파일 시스템 데이터
```

이런 식으로 규격을 표준화했기 때문에, 덕분에 Docker에서 만든 이미지도 다른 OCI 호환 프로그램에서 사용할 수 있다. (오우? 굉장히 좋다고 할 수 있다.)

```text
Docker build
    ↓
OCI Image
    ├── Docker
    ├── Podman
    └── containerd
```

# 5. OCI Runtime Specification

Runtime Spec은:

> "컨테이너를 실제 Linux 프로세스로 어떻게 실행할 것인가?"

를 정의 

예를 들어 컨테이너 실행하려면 이런 정보가 필요하다 

어떤 프로그램을 실행할 것인가?

```text
nginx
```

어떤 환경변수를 사용할 것인가?

```text
PORT=80
```

어떤 namespace를 만들 것인가?

```text
PID Namespace
Network Namespace
Mount Namespace
```

어떤 resource 제한을 적용할 것인가?

```text
CPU
Memory
```

이런 실행 정보를 OCI Runtime Spec에서 규정 

대표적인 설정 파일이 

`config.json`

개념적으로 

```json
{
  "process": {
    "args": ["nginx"]
  },
  "linux": {
    "namespaces": [
      "..."
    ]
  }
}
```

이런 정보를 Runtime이 읽는다. 

대표적인 OCI Runtime 구현체가

`runc`

## runc가 중요한 이유

Docker에서 

```bash
docker run nginx
```

를 실행한다고, Docker가 직접 Linux Namespace와 cgroup을 전부 만드는 구조는 아니다.

```text
사용자
    │
    │ docker run nginx
    ▼
Docker CLI
    │
    ▼
dockerd
    │
    ▼
containerd
    │
    ▼
runc
    │
    ▼
Linux Kernel
    ├── Namespace
    ├── cgroup
    ├── capabilities
    └── filesystem
    │
    ▼
nginx process
```

여기서 

`runc`

가 OCI Runtime Specification을 구현한 프로그램이다. 

> Docker가 최종적으로 컨테이너라는 특별한 VM을 만드는 것이 아니라, runc를 통해 Linux Kernel 기능을 이용해서 격리된 프로세스를 만들어낸다.

결국은

> "컨테이너의 실체는 결국 Linux에서 실행되는 프로세스다"

라는 개념을 구현하는 것은 OCI Runtime

# 6. Kubernetes에서도 OCI가 사용된다

OCI가 중요한 이유는 Docker만의 이야기가 아니기 때문. 

Kubernetes에서 사용되기 때문이다. 

에를 들어 Kubernetes에서 Pod를 생성

```bash
kubectl apply -f nginx.yaml
```

라고 하면 

```text
kubectl
    │
    ▼
Kubernetes API Server
    │
    ▼
kubelet
    │
    ▼
CRI
    │
    ▼
containerd
    │
    ▼
OCI Runtime
    │
    ▼
runc
    │
    ▼
Linux Kernel
    │
    ▼
nginx process
```

라고 하면서, 

OCI Runtime을 사용하게 된다. 

# 7. CRI와 OCI는 다른 것

CRI
OCI

### CRI 
- Container Runtime Interface

```text
Kubernetes
    ↕
containerd / CRI-O
```

> Kubernetes와 Container Runtime 사이의 API 규격


### OCI 
- Open Container Initiative 

> 컨테이너 이미지와 실제 실행 규격

```text
Kubernetes
    │
    ▼
kubelet
    │ CRI
    ▼
containerd
    │ OCI
    ▼
runc
    │
    ▼
Linux Kernel
```

# 8. OCI가 실제로 어디에 응용?

OCI 표준 덕분에 다양한 컨테이너 기술이 서로 호환

Docker 
Podman 
containerd 
CRI-0 
Kubernetes 
AWS ECS / EKS 
Google GKE 
Azure AKS 
Github Actions 
CI/CD 시스템 

등이 컨테이너 이미지를 다룰 수 있음 

예를 들어 

```bash
docker build -t myapp .
```

해서 이미지를 만들고 Registry에 올리면 

```text
Developer Laptop
    │ docker build
    ▼
OCI Image
    │
    ▼
Container Registry
    ├── Docker
    ├── Kubernetes
    ├── AWS ECS
    ├── GKE
    └── Azure AKS
```

어디에서 실행하든 OCI 규격을 이해하기 때문에 동일한 이미지를 사용할 수 있다.

# 9. Docker Registry에서도 OCI가 응용

OCI에는 Distribution Specification도 있다.

이건 

> "컨테이너 이미지를 Registry와 어떻게 주고받을 것인가"

를 정의 

```bash
docker pull nginx
```

```text
Docker
    │ Registry API
    ▼
Docker Hub
    ├── Manifest
    ├── Config
    └── Layers
```

그래서 다음과 같은 Registry들이 서로 비슷한 방식으로 OCI 이미지를 저장

Docker Hub

GitHub Container Registry

Amazon ECR

Google Artifact Registry

Azure Container Registry

Harbor

# 10. OCI 때문에 Docker가 없어도 된다. 

OCI 표준이 있기 때문에 

```text
Docker Build
    ↓
OCI Image
    ├── Podman
    ├── containerd
    └── Kubernetes
```

처럼 사용할 수 있다. 

이는 Vendor Lock-in을 줄이는 역할을 한다.

# 결론

```text
Docker CLI
    │
    ▼
dockerd
    │
    ▼
containerd
    │ OCI Runtime Specification
    ▼
runc
    │
    ▼
Linux Kernel
    ├── Namespace
    ├── cgroup
    └── capability
    │
    ▼
Container
(= isolated process)
```


이미지는 

```text
Dockerfile
    │
    ▼
docker build
    │
    ▼
OCI Image
    ├── Manifest
    ├── Config
    └── Layers
    │
    ▼
Container Registry
    │
    ▼
containerd
    │
    ▼
runc
    │
    ▼
Linux Process
```

면접에서 나온다면 ...

OCI는 Open Container Initiative로, 컨테이너 이미지 형식과 컨테이너 실행 방식 등을 표준화한 규격입니다. 대표적으로 OCI Image Spec, Runtime Spec, Distribution Spec이 있습니다. Docker나 Kubernetes 생태계에서 서로 다른 Runtime과 Registry가 동일한 컨테이너 이미지를 호환해서 사용할 수 있도록 해줍니다. 대표적인 OCI Runtime 구현체가 runc입니다.

```text
Docker       = 컨테이너를 사용하는 플랫폼
containerd   = 컨테이너 생명주기 관리자
OCI          = 컨테이너 표준 규격
runc         = OCI Runtime 규격 구현체
Linux Kernel = 실제 격리를 수행하는 주체
Container    = 결국 격리된 Linux Process
```


여기까지 연결하면 

```text
Kubernetes
    ↓
CRI
    ↓
containerd
    ↓
OCI
    ↓
runc
    ↓
Linux Kernel
    ↓
Process
```
