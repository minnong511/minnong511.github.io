---
layout: post
title: "쿠버네티스"
description: "Docker는 컨테이너 하나를 만들고 실행하는 데 집중한다."
date: "2026-08-26 07:11:14 +0900"
categories: ["CI-CD-Docker", "kubernetes"]
tags: []
legacyPath: "/ci-cd-docker/kubernetes/2026/08/26/kubernetes1/"
---
# 쿠버네티스 

> 쿠버네티스는 여러 컴퓨터에서 컨테이너를 원하는 상태로 실행하고, 그 상태가 깨지면 자동으로 복구하는 컨테이너 오케스트레이션 시스템 

## 1. Docker와 쿠버네티스 차이 

Docker는 컨테이너 하나를 만들고 실행하는 데 집중한다. 

```bash
docker run nginx
```

쿠버네티스는 다음과 같은 운영 문제를 담당

- 컨테이너를 어느 서버에서 실행할지 결정 
- 컨테이너가 죽으면 다시 실행
- 사용자가 많아지면 여러 개로 확장 
- 여러 컨테이너로 트래픽 분산 
- 새 버전으로 점진적 교체 
- 설정과 저장 공간 관리 

```text
Docker
    이미지 → 컨테이너 실행

Kubernetes
    이미지 → 여러 서버에 배치 → 감시 → 복구 → 확장 → 트래픽 연결
```

쿠버네티스가 컨테이너 이미지를 만드는 것으 아니다. 일반적으로 Docker등으로 이미지를 만들고 저장소에 올리면, 쿠버네티스가 그 이미지를 가져와 실행한다. 

## 2. 가장 중요한 개념 : 원하는 상태 

> 선언적 명령 

쿠버네티스는 명령을 하나씩 내리기 보다는 원하는 상태를 선언 

예를 들어서 

```yaml
replicas: 3
image: nginx:1.27
```

의미는 다음과 같다. 

> nginx 1.27 컨테이너를 항상 3개 실행

그래서 3개의 Nginx 컨테이너가 정상적으로 돌아가고 있다면 아무것도 하지 않는다. 

```text
현재 3개 = 원하는 상태 3개
    → 유지
```

근데 만약 1개가 죽었다? 

```text
현재 2개 ≠ 원하는 상태 3개
    → 새 컨테이너 1개를 생성
    → 그리고서는 다시 3개로 복구한다.
```

이처럼 현재 상태를 원하는 상태에 맞추는 것을 Reconciliation

즉, 조정(Reconciliation) 이라고 한다. 

## 3. 전체 구조 

```text
Cluster
├── Control Plane
│   ├── API Server
│   ├── Scheduler
│   ├── Controller Manager
│   └── etcd
│
└── Worker Node
    ├── kubelet
    ├── Container Runtime
    └── Pod
        └── Container
```

### Cluster 

- 쿠버네티스가 관리하는 전체 시스템, 여러 서버를 하나의 묶음으로 관리 

### Control Plane 

- 클러스터의 두뇌 
    - 사용자의 요청을 받음
    - 현재 상태를 확인
    - 어느 서버에서 실행할지 결정
    - 원하는 상태와 다르면 수정 

### worker Node 

실제로 애플리케이션 컨테이너가 실행되는 서버 

### Pod 

쿠버네티스가 배포하는 가장 작은 실행 단위 

```text
Pod
└── nginx 컨테이너
```

컨테이너를 쿠버네티스에 직접 배포하기보다는, 컨테이너를 감싼 Pod를 배포한다고 생각하면 좋다

## 4. 핵심 단어

| 단어 | 의미 |
|---|---|
| Cluster | 쿠버네티스가 관리하는 전체 서버 묶음 |
| Control Plane | 클러스터를 관리하는 두뇌 |
| Node | 쿠버네티스에 참여하는 서버 |
| Pod | 컨테이너가 실행되는 최소 단위 |
| Deployment | Pod의 개수, 이미지, 업데이트 방식을 관리 |
| Replica | 동일하게 실행할 Pod의 개수 |
| Service | 변경되는 Pod들을 하나의 고정된 주소로 연결 |
| Ingress | 외부 HTTP 요청을 적절한 Service로 전달 |
| Namespace | 리소스를 논리적으로 구분하는 공간 |
| ConfigMap | 일반 설정값을 분리해 저장 |
| Secret | 비밀번호, 토큰 같은 민감한 설정 관리 |
| Volume | 컨테이너가 사용할 저장 공간 |
| PVC | 필요한 저장 공간을 요청하는 객체 |
| Label | Pod 등의 리소스에 붙이는 분류표 |
| Selector | 특정 Label을 가진 리소스를 선택하는 조건 |
| Manifest | 원하는 상태를 작성한 YAML 파일 |

일단은 이 정도만 알고 있으면 되는 것은.. 

```text
Deployment
    ↓ Pod 생성 및 개수 유지
Pod
    ↓ 애플리케이션 실행
Service
    ↓ 여러 Pod를 하나의 주소로 연결
Ingress
    ↓ 외부 사용자의 요청을 Service로 전달
```

## 5. 요청이 들어오는 흐름 

웹 애플리케이션을 배포했다고 했을 때를 예시로 들어보자 

```text
사용자
    ↓
Ingress
    ↓
Service
    ↓
Pod 1, Pod 2, Pod 3
    ↓
컨테이너 애플리케이션
```

여기서 Pod는 언제든 죽거나 새로 생성될 수 있기 때문에 IP 주소가 바뀔 수 있다.

사용자는 Pod에 직접 연결하지 않는다. Service가 고정된 접근 지점을 제공하고, 적잘한 Pod으로 요청을 전달한다.

## 6. 배포할 때 내부에서 벌어지는 일 

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
```

적용 명령 

```bash
kubectl apply -f deployment.yaml
```

내부 흐름은 다음과 같다. 

1. Kubectl이 YAML을 API Server에 전달
2. API Server가 요청을 검사하고 etcd에 저장
3. Controller가 Pod 3개가 필요하다는 것을 확인
4. Scheduler가 각 Pod를 실행할 Node를 선택
5. 각 Node의 kubelet이 컨테이너 이미지 다운로드 
6. Container Runtime이 컨테이너 실행
7. Controller가 계속 상태를 감시

kubectl은 쿠버네티스 클러스터에 명령을 전달하는 도구 

확인 할 때는 다음 명령을 사용한다. 

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

## 7. 핵심 설계 철학 

### 선언적 관리 
"컨테이너 하나를 실행해" 라는 절차보다 "항상 3개가 실행되어야 한다~" 라는 결과를 선언

```text
명령형: 컨테이너를 하나 실행해
선언형: 컨테이너가 항상 3개 존재해야 해
```

### 지속적인 조정
쿠버네티스는 한 번 실행하고 끝나는 시스템이 아님 

```text
현재 상태 관찰
    → 원하는 상태와 비교
    → 차이가 있으면 수정
    → 다시 관찰
```

이 반복 구조를 Control Loop

### 장애를 정상적인 상황으로 간주 

쿠버네티스는 Pod가 서버가 언젠가 고장난다고 가정

그래서 개별 Pod이 죽으면, 새로운 Pod으로 교체한다. 

```text
기존 서버 운영: 이 서버가 절대 죽지 않도록 관리
쿠버네티스:     죽을 수 있으니 자동으로 대체
```

### 개별 객체보다 집합 관리 

Pod 하나를 직접 관리하기보다, Deployment로 Pod의 집합을 관리한다. 

```text
Pod 하나 직접 관리
    → 죽으면 끝

Deployment로 관리
    → Pod가 죽으면 새 Pod 생성
```

### 느슨한 연결 

Deployment는 실행, Service는 네트워크 연결, ConfigMap은 설정을, Volume은 저장 공간을 담당한다. 

기능을 분리해 필요한 부분만 교체할 수 있게 설계되어 있다. 

### 불변 이미지 

실행 중인 컨테이너 내부를 직접 수정하지 않고, 새 이미지를 만들고 기존 Pod를 새 Pod로 교체 

```text
nginx:1.0 Pod
    ↓ 점진적 교체
nginx:2.0 Pod
```
