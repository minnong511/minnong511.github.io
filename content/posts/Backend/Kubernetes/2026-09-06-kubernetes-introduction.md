---
layout: post
title: "쿠버네티스 입문"
description: "쿠버네티스의 핵심 용어와 아키텍처를 살펴보고, Nginx 배포 실습으로 원하는 상태를 유지하는 작동 과정을 정리한다."
date: "2026-09-06 09:00:00 +0900"
categories: [Backend, Kubernetes]
tags: [Kubernetes, Pod, Deployment, ReplicaSet, Service, kubectl, minikube]
legacyPath: "/backend/kubernetes/2026/09/06/kubernetes-introduction/"
---

# 쿠버네티스 입문

> 쿠버네티스는 “이 애플리케이션을 몇 개, 어떤 상태로 실행할지” 선언하면, 실제 실행 상태를 그 선언에 맞게 유지하는 시스템

"웹 서버를 3개 유지해"라고 설정하면, 처음에는 3개를 실행하는 것을 넘어서, 실행 단위가 계속 유지될 수 있도록 상태를 계속 조정해 주는 컨테이너 오케스트레이션 툴

# 1. 핵심 단어 정의

## 1-1. 무엇을 실행하고, 어디에서 실행할까?

| 용어 | 쉬운 정의 | 예시 |
|---|---|---|
| **Image** | 프로그램과 실행에 필요한 파일을 담은 패키지 | Nginx 이미지 |
| **Container** | 이미지를 바탕으로 실행한 격리된 프로그램 환경 | 실행 중인 Nginx |
| **Pod** | 쿠버네티스가 배포하고 관리하는 가장 작은 실행 단위. 하나 이상의 컨테이너를 묶음 | Nginx 컨테이너 하나가 들어 있는 Pod |
| **Node** | Pod를 실행하는 컴퓨터. 물리 서버나 가상 머신일 수 있음 | 서버 A |
| **Cluster** | 노드들과 이를 관리하는 구성 요소를 묶은 전체 시스템 | 우리 서비스의 쿠버네티스 운영 환경 |

용어 관계는 아래와 같다.

```text
Cluster
├── Node A
│   ├── Pod 1
│   │   └── Nginx 컨테이너
│   └── Pod 2
│       └── Nginx 컨테이너
│
└── Node B
    └── Pod 3
        └── Nginx 컨테이너
```

> Pod 3개가 반드시 서버 3대를 의미하지는 않아. 한 노드에서 여러 Pod를 실행할 수 있다.

### 근데 왜 컨테이너가 아니라 Pod를 관리할까?

함께 실행해야 하는 컨테이너들이 있기 때문.

예를 들어 애플리케이션 컨테이너와 그 애플리케이션을 보조하는 컨테이너를 하나의 Pod로 넣으면 같은 노드에 함께 배치되고 네트워크를 공유할 수 있다.

## 1-2. 실행 상태는 무엇으로 관리할까?

| 용어 | 쉬운 정의 |
|---|---|
| **Deployment** | 사용할 이미지, Pod 개수, 업데이트 방식 등을 선언하는 배포 관리 객체 |
| **ReplicaSet** | 같은 형태의 Pod가 지정한 개수만큼 존재하도록 관리하는 객체 |
| **Service** | Pod가 바뀌어도 일정한 이름과 접속 지점으로 접근하게 해 주는 네트워크 객체 |
| **Label / Selector** | Label은 객체에 붙이는 명찰, Selector는 그 명찰로 대상을 고르는 조건 |
| **Manifest** | 어떤 객체를 어떤 설정으로 만들지 적은 명세. 보통 YAML 파일로 작성 |
| **kubectl** | 쿠버네티스에 요청을 보내고 상태를 조회하는 명령줄 도구 |

- Deployment와 ReplicaSet은 Pod 운영을 담당
- Service는 Pod에 접근하는 방법을 제공
- Manifest는 이 객체들을 제공
- kubectl로 적용

예시

```text
Deployment: “이 웹 서버를 이런 설정으로 운영해.”
ReplicaSet: “그 설정의 Pod 개수를 유지해.”
Pod:        “실제 애플리케이션이 실행되는 단위야.”
Service:    “실행 중인 Pod에 이 이름으로 접속해.”
```

Deployment는 사용자가 작성하고, ReplicaSet, Pod는 쿠버네티스가 만들도록 맡긴다.

# 2. 아키텍처 철학 : 왜 이렇게 설계했을까?

## 2-1 "무엇을 할지"보다 "어떤 상태여야 하는지"를 선언

우리가 자주 쓰는 명령형 방식을 살펴보자.
명령형 방식의 경우는 사용자가 직접 작업 순서를 지시한다.

1. 서버 A에 접속한다.
2. 컨테이너를 실행한다.
3. 서버 B에 접속한다.
4. 컨테이너를 실행한다.
5. 하나가 사라지면 사람이 다시 실행한다.

그러나!

쿠버네티스의 경우에는 이와 다른 "선언형 방식"을 사용한다.

> 선언형 방식이란, 최종적으로 원하는 상태를 적는 것

예시

```yaml
replicas: 3
```

이 설정의 의미는 "Pod를 3개 만들어"가 아닌, "이 애플리케이션의 원하는 Pod 개수는 3개야"라고 말하는 것.

쿠버네티스는 이 원하는 상태를 실제 상태와 비교하면서 조정한다.

참고로 우리가 앞서서 썼던 Docker Compose도 선언형 설정을 사용한다. 다만 쿠버네티스와 Docker Compose의 결정적 차이는, 쿠버네티스가 클러스터 수준에서 여러 관리 구성 요소가 상태를 지속적으로 조정한다는 점이다. (규모가 더 큰 것에 집중하면 될 것 같다.)

## 2-2. 원하는 상태와 실제 상태의 차이를 줄인다.

Reconciliation : 조정

```text
원하는 상태: Pod 3개
실제 상태:   Pod 2개

차이 발견
    ↓
부족한 Pod 1개 생성 요청
    ↓
실행 상태를 다시 확인
```

쿠버네티스에서는 Controller라는 프로그램을 통해서 원하는 상태와 실제 상태가 일치하도록 조정한다.

Pseudo Code

```python
while True:
    desired = read_desired_pod_count()   # 원하는 개수
    current = count_managed_pods()      # 현재 관리 중인 개수

    if current < desired:
        request_new_pods(desired - current)

    elif current > desired:
        request_pod_deletions(current - desired)

    wait_for_next_check()
```

핵심은 한 번 실행하고 끝나는 스크립트가 아니라, 계속 상태를 확인하는 관리 구조임에 집중하면 될 것 같다.

## 2-3. 개별 실행 인스턴스가 영원히 살아 있다고 가정하지 않는다.

쿠버네티스에서는 Pod를 영구적으로 유지해야 하는 존재로 생각하지 않는다. 다만 필요하면 삭제하고 새로운 Pod로 만들 뿐이다.

근데 컨테이너와 Pod 재생성은 다르니까 인지하자.

| 상황 | 대표적인 대응 |
|---|---|
| Pod 안의 컨테이너가 종료됨 | kubelet이 재시작 정책에 따라 컨테이너를 다시 시작 |
| Deployment가 관리하는 Pod 자체가 삭제됨 | ReplicaSet 컨트롤러가 대체할 새 Pod 생성 |

# 3. 시스템 아키텍처 : 누가 무엇을 담당하나?

쿠버네티스 구조는 크게 두 부분으로 나눠 보면 쉽다.

Control Plane은 전체 상태를 관리하고, Worker Node는 애플리케이션을 실행

```text
사용자
  │
  │ kubectl로 요청
  ▼
Control Plane: 전체 관리
  ├── API Server
  ├── etcd
  ├── Scheduler
  └── Controller Manager
          │
          │ API를 통한 상태 공유와 조정
          ▼
Worker Node: 실제 실행
  ├── kubelet
  ├── Container Runtime
  ├── 네트워크 관련 구성 요소
  └── Pod
       └── 애플리케이션 컨테이너
```

## 3-1. Control Plane : 전체 관리 담당

| 구성 요소 | 역할 | 쉽게 생각하면 |
|---|---|---|
| **API Server** | 쿠버네티스 관리 API를 제공하는 중심 창구 | 요청 접수처 |
| **etcd** | 쿠버네티스 객체와 상태 정보를 저장하는 저장소 | 관리 장부 |
| **Scheduler** | 아직 노드가 정해지지 않은 Pod를 적절한 노드에 배정 | 배치 담당자 |
| **Controller Manager** | 여러 컨트롤러를 실행하여 원하는 상태와 실제 상태를 조정 | 운영 관리자 집합 |

## 3-2. Worker Node : 실제 실행 담당

| 구성 요소 | 역할 |
|---|---|
| **kubelet: 큐블릿** | 자기 노드에 배정된 Pod가 실행되도록 관리하고 상태를 보고 |
| **Container Runtime** | 이미지를 준비하고 컨테이너를 실제로 실행. `containerd`, `CRI-O` 등이 있음 |
| **kube-proxy 또는 대체 구현** | Service로 들어오는 통신이 대상 Pod에 전달되도록 네트워크 규칙 등을 구성 |

> 쿠버네티스는 반드시 Docker Engine을 통해 컨테이너를 실행하는 것은 아님. containerd 같은 런타임을 사용할 수 있다.

다시 한번 정리해 보자면

Deployment는 “운영 계획을 담은 객체”이고, Deployment Controller는 “그 계획을 읽고 실행 상태를 조정하는 프로그램”

매니페스트에 Deployment를 작성하는 것은 새로운 관리 프로그램을 코딩하는 일이 아니라, 이미 실행 중인 관리 프로그램에 원하는 상태를 전달하는 일

# 4. 코드로 따라가는 작동 과정

예시 상황

> Nginx 웹 서버 Pod를 3개 실행하고, 접속한 뒤, Pod를 하나 지워서 다시 생성되는지 확인

## 4-1. 연습용 쿠버네티스 준비

```bash
# 필요한 도구 설치
brew install minikube kubectl

# 연습용 클러스터 생성
minikube start -p k8s-intro --driver=docker --container-runtime=containerd

# 이후 명령을 보낼 클러스터 선택
kubectl config use-context k8s-intro

# 현재 선택된 클러스터 확인
kubectl config current-context

# 노드 상태 확인
kubectl get nodes
```

> Context는 kubectl이 어느 클러스터에 접속할지 정하는 연결 설정

## 4-2. 원하는 상태를 YAML로 작성

### 1. 웹 서버 Pod의 운영 설정

```yaml
apiVersion: apps/v1
kind: Deployment

metadata:
  name: web

spec:
  replicas: 3                  # 원하는 Pod 개수

  selector:
    matchLabels:
      app: web                 # 관리할 Pod를 찾는 조건

  template:                    # 앞으로 만들 Pod의 설계도
    metadata:
      labels:
        app: web               # Pod에 붙일 명찰

    spec:
      containers:
        - name: nginx
          image: nginx:stable-alpine

          ports:
            - containerPort: 80

          readinessProbe:      # 요청을 받을 준비가 됐는지 검사
            httpGet:
              path: /
              port: 80
```

### 2. 웹 서버 Pod들에 접근할 접속 지점

```yaml
---
apiVersion: v1
kind: Service

metadata:
  name: web

spec:
  type: ClusterIP              # 클러스터 내부용 접속 지점

  selector:
    app: web                   # 이 명찰이 있는 Pod에 연결

  ports:
    - port: 80                 # Service가 제공하는 포트
      targetPort: 80           # 대상 Pod의 애플리케이션 포트
```

### 가장 중요한 부분 해석

`replicas: 3`

이 설계도를 사용하는 Pod의 개수를 3개로 설정

`template`

새 Pod를 사용할 때 사용할 설계도, 어떤 이미지와 설정으로 실행할지 들어 있음

Label과 Selector

둘을 연결해서 읽어야 함.

```text
Pod에 붙인 명찰:          app=web
Deployment의 선택 조건:  app=web
Service의 선택 조건:     app=web
```

즉, 이름이 같아서 자동으로 연결되는 것이 아니라, 명찰과 선택 조건이 맞기 때문에 연결되는 것.

`readinessProbe`

“이 컨테이너가 요청을 받을 준비가 됐는가?”를 검사

## 4-3. 쿠버네티스에 적용

`web.yaml`이 있는 폴더에서 실행

### 파일에 정의한 원하는 상태 적용

```bash
kubectl apply -f web.yaml
```

### 배포가 준비되는지 확인

```bash
kubectl rollout status deployment/web --timeout=180s
```

### 생성된 Pod 확인

```bash
kubectl get pods
```

정상 실행되었을 때 출력 예시는 다음과 같다.

```text
NAME                  READY   STATUS    RESTARTS   AGE
web-xxxxxx-aaaaa       1/1     Running   0          30s
web-xxxxxx-bbbbb       1/1     Running   0          30s
web-xxxxxx-ccccc       1/1     Running   0          30s
```

`apply`는 객체 설정을 적용하는 명령. `rollout status`는 배포 진행 상태를 확인하는 명령.
설정이 접수되는 것과 모든 Pod의 실행 준비가 끝나는 것은 같은 순간이 아니므로 구분해서 확인

### apply 이후 내부에서는 무슨 일이 일어날까?

```text
kubectl이 YAML 내용을 API Server에 전달
    ↓
API Server가 검증한 객체 정보를 저장
    ↓
Deployment Controller가 ReplicaSet을 생성하도록 요청
    ↓
ReplicaSet Controller가 Pod 3개를 생성하도록 요청
    ↓
Scheduler가 각 Pod를 실행할 노드 결정
    ↓
해당 노드의 kubelet이 런타임을 통해 컨테이너 실행
    ↓
실행 상태와 준비 상태가 보고됨
```

> 각 구성 요소가 API를 통해 상태를 확인하고, 자기 역할에 해당하는 작업을 수행한 결과가 이어지는 구조

## 4-4. 웹 서버에 접속

이번 Service는 ClusterIP이므로 기본적으로 클러스터 내부에서 사용하는 접속 지점임. 따라서 내 브라우저에서 확인하기 위해서는 개발용 포트 포워딩을 임시로 사용한다.

```bash
kubectl port-forward service/web 8080:80
```

터미널을 실행 상태로 두고, 브라우저에서 다음 주소에 접속

http://localhost:8080

> “내 컴퓨터의 8080번 포트를 Service가 선택하는 Pod의 대상 포트에 연결”

```text
요청을 보내는 애플리케이션
    ↓
Service의 이름 또는 IP로 접속
    ↓
Service 전달 규칙
    ↓
대상 Pod 중 하나
    ↓
그 Pod 안의 웹 서버
```

Deployment는 배포를 관리하고, Service는 접속 지점을 제공해
일반적인 웹 요청이 Deployment나 Scheduler를 거쳐 처리되는 것은 아니다.

## 4-5. Pod를 하나 삭제해서 자동 복구 확인

Pod 하나를 강제로 삭제해 보자!

```bash
# app=web인 Pod 중 하나의 이름을 변수에 저장
POD=$(kubectl get pods -l app=web -o jsonpath='{.items[0].metadata.name}')

# 선택한 Pod 삭제
kubectl delete pod "$POD"

# Pod 상태를 계속 관찰
kubectl get pods -l app=web -w
```

`-l app=web`은 해당 명찰이 붙은 Pod만 선택하고, `-w`는 변경되는 상태를 계속 보여 달라는 의미

삭제하고 나면, 잠시 후 다른 이름의 새 Pod가 나타나고, 다시 3개가 준비되는 것을 확인할 수 있다.

개수가 계속 유지되는 것은 ReplicaSet이 우리가 선언한 개수를 유지하도록 동작하기 때문이다.

```text
내가 한 행동:
Pod 하나 삭제

남아 있는 운영 설정:
Pod 3개 유지

쿠버네티스의 대응:
부족한 자리를 채울 새 Pod 생성
```

삭제된 Pod가 부활한 것이 아니라, 대체할 새 Pod가 만들어진 것

## 4-6. Pod를 3개에서 5개로 늘리기

```bash
# 원하는 개수를 5개로 변경
kubectl scale deployment/web --replicas=5

# 변경 결과 확인
kubectl rollout status deployment/web --timeout=180s
kubectl get pods -l app=web
```

이 명령은 Deployment의 원하는 개수를 변경하고, 관련 컨트롤러들이 실제 개수를 맞춘다.

## 4-7. Pod를 순차적으로 교체하기

### Rolling Update

Deployment는 Pod를 한꺼번에 모두 없애는 대신, 설정된 전략에 따라 새 Pod로 교체할 수 있어. 이를 Rolling Update: 롤링 업데이트라 한다.

```bash
# Pod들을 새 Pod로 교체하는 재시작 요청
kubectl rollout restart deployment/web

# 교체 진행 상태 확인
kubectl rollout status deployment/web --timeout=180s
```

새 이미지 버전을 배포할 때는 매니페스트의 `image` 값을 변경하고 적용하는 방식으로 진행할 수 있어. 다만 롤링 업데이트를 사용한다는 사실만으로 모든 요청의 무중단 처리가 보장되는 것은 아니고, 준비 상태 검사와 애플리케이션의 종료 처리도 중요

# 5. 마지막으로 구분해야 할 것

자동 복구는 애플리케이션의 버그를 고치는 기능이 아니다. 재시작해도 같은 버그가 발생하면 계속 실패할 수 있다. 단지 쿠버네티스가 할 수 있는 것은 설정된 정책에 따라 실행 상태를 조정하는 일

한 줄 요약

> Deployment에 원하는 실행 상태를 적으면, 컨트롤러는 필요한 Pod를 만들도록 조정하고, Scheduler는 실행할 노드를 정하며, kubelet과 런타임은 컨테이너를 실행한다. Service는 그렇게 실행되는 Pod에 접근할 접속 지점을 제공한다.
