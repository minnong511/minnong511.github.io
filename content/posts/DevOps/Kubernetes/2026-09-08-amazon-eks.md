---
title: "Amazon EKS, Kubernetes, AWS 연결"
description: "EKS 정리."
date: "2026-09-08 00:00:00 +0900"
categories: ["DevOps", "Kubernetes"]
tags: [AWS, EKS, Kubernetes, IAM, VPC]
legacyPath: "/devops/kubernetes/amazon-eks/"
---

::kubernetes-journey{scenario="eks"}
::

# 1. What is EKS?

Kubernetes = Container 운영 시스템
EKS = AWS가 Control Plane까지 관리해주는 Kubernetes
Control Plane = AWS
Worker Node / Workload = 우리가 주로 다름

EKS = Amazon Elastic Kubernetes Services

> AWS가 Kubernetes의 Control Plane을 대신 운영해주는 관리형 Kubernetes 서비스

일반 Kubernetes를 직접 구훅하는 경우에는 아래의 목록과 같은 Control plane을 관리해야 한다.

```text
Kubernetes Cluster
├─ Control Plane
│  ├─ API Server
│  ├─ etcd
│  ├─ Scheduler
│  └─ Controller Manager
│
└─ Worker Node
   ├─ kubelet
   ├─ containerd
   └─ Pod
```

그런데 EKS에서는 이런 귀찮은 요소들을 알아서 관리해준다.

```text
AWS가 관리
└─ Control Plane
   ├─ API Server
   ├─ etcd
   ├─ Scheduler
   └─ Controller Manager
```

해주고, 우리가 관리하는 것은

```text
우리가 주로 관리
└─ Worker Node + Workload
   ├─ Node
   ├─ Deployment
   ├─ Service
   ├─ Pod
   └─ Container
```

EKS는 Control Plane을 AWS가 운영하고, 우리는 Node와 Workload를 주로 관리

# 2. 그렇다면 왜 EKS를 쓰는 것?

직접 Kubernetes를 설치하는 경우를 생각해보자면, 우리가 직접 Control Plane을 관리

EKS가 관리해주는 것...

- etcd 백업
- API server 가용성 -? 이거는 좀 알아보자
- 인증서 갱신 -> ?
- Kubernetes 버전 업그레이드
- 장애 대응
- Control Plane 서버 관리

EKS를 쓰면 AWS가 이 부분을 맡아서 처리해줌.
즉 Kubernetes 자체를 운영하는 부담을 줄여줌.

비교해서보면 더 좋음.

직접 kubernetes 구축

```text
우리
├─ Control Plane 관리
├─ etcd 백업
├─ 인증서
├─ HA
├─ 업그레이드
├─ Worker Node
└─ Application
```

EKS

```text
AWS
└─ Control Plane 관리 (역시 현질이 좋다.)

우리
├─ Worker Node
└─ Application
```

> Control plane 관리

# 3. Kubernetes 구조는 그대로 가져감

EKS 라고 해서

Deployment, ReplicaSet, Pod, Service, Ingress 개념이 바뀌는 것이 아니다.

```text
kubectl
↓
API Server
↓
Deployment Controller
↓
ReplicaSet
↓
Pod
↓
Scheduler
↓
Worker Node
↓
kubelet
↓
containerd
```

다만 여기서 여기서 Control Plane 의 컴퓨터를 AWS가 관리해줌.

# 4. EKS의 Control plane

```text
EKS Control Plane

API Server
├─ Kubernetes API 요청 처리

etcd
├─ Cluster 상태 저장

Scheduler
├─ Pod가 실행될 Node 결정

Controller Manager
└─ 원하는 상태와 현재 상태 조정
```

핵심 로직 역시 동일, Kubernetes Control Plane은 결정 Worker Node는 실행, 모든 변경이 API Server를 거쳐감.

단지 EKS에서는 우리가 Control Plane 서버에 직접 들어가서 관리하지 않을 뿐임.

# 5. Worker Node는 우리가 사용하는 실행 공간

애플리케이션은 실제로 Worker Node에서 돌아감.
AWS에서 Worker Node가 일반적으로 EC2 인스턴스

```text
EKS Cluster
│
├─ AWS 관리 Control Plane
│
└─ Worker Nodes
   │
   ├─ EC2 Node A
   │  ├─ kubelet
   │  ├─ containerd
   │  └─ Pod
   │
   ├─ EC2 Node B
   │  └─ Pod
   │
   └─ EC2 Node C
      └─ Pod
```

이렇게 구성되어 있음

예를 들어 Scheduler의 경우에

> shop-api pod를 Node B에서 실행하자~!

라고 결정하면, Node B의 Kubelet이 그 내용을 받아서 Containerd에 실행을 요청.

EKS에서는

Scheduler = Node, Kubelet = Node에서 실행 관리, Containerd = container 실제 실행

# 6. 그렇다면 작동은 어떻게...?

```bash
aws eks update-kubeconfig \
  --region ap-northeast-2 \
  --name skala-2026
```

같은 방식으로 로컬 kubectl이 EKS Cluster의 API Server를 바라보도록 설정.
이 명령은 EKS Cluster를 생성하는 명령이 아니고, 로컬에 접속 설정을 만들어주는 명령

그다음은 :

```text
내 PC
│
│ kubectl apply
↓
EKS API Server
```

로 요청함.

kubectl은 aws에 직접 EC2 생성 요청을 보내는 도구가 아니라 여전히 Kubernetes API Client

# 7. 인증은 AWS IAM과 Kubernetes RBAC이 연결

접속과정

```text
사용자
↓
AWS IAM

"너 누구야?"
↓
인증(Authentication)

Kubernetes RBAC
↓
"그런데 이 사람이 Pod를 삭제할 권한은 있어?"
↓
인가(Authorization)
```

라고 이해,

- IAM으로 누구인지 확인
- RBAC = 무엇을 할 수 있는가

로 구분하면 편함.

kubectl auth can-i create deployment 으로 실제 권한을 확인할 수 있음

# 8. AWS와 Kubernetes가 연결되는 지점

EKS의 중요한 특징은 Kubernetes 리소스를 만들었는데 실제 AWS 인프라가 생길 수 있는 것.

```yaml
kind: Service
spec:
  type: LoadBalancer
```

라고 만들면 Kubernetes 안에 Service 객체만 생기는 것이 아니라 AWS 쪽 Load Balancer가 생성될 수 있음

```text
Kubernetes Manifest
↓
Service type: LoadBalancer
↓
AWS 연동
↓
AWS Load Balancer 생성
```

LoadBalancer Service나 EBS 등의 AWS 자원이 Kubernetes 요청으로 생성될 수 있다.

> 연동해놓고 명령어 잘못치면 다 AWS 비용

# 9. EKS 네트워크 : VPC와 Pod

EKS에서는 Kubernetes가 AWS 네트워크와 연결
VPC CNI를 사용해서 Pod가 실제 VPC IP를 받음.

```text
AWS VPC
│
├─ EC2 Worker Node
│
├─ Pod A → VPC IP
├─ Pod B → VPC IP
└─ Pod C → VPC IP
```

근데 VPC가 뭐임?

# 10. EKS에서 Storage

스토리지도 비슷

Pod이 PVC -> "10Gi 필요" 라고 요청하는 경우에
Kubernetes 의 StorageClass와 CSI Driver를 통해 AWS의 EBS 같은 저장소를 붙일 수 있다.

```text
Pod
↓
PVC
↓
StorageClass
↓
EBS CSI Driver
↓
AWS EBS
```

PVC = 저장공간 요청
StorageClass = 어떤 저장소를 만들지 정의
CSI = Kubernetes와 Storage 연결
EBS = 실제 AWS 디스크

# 11. EKS에서 외부 요청은 어떻게 들어오나?

앞에서 배운 요청 흐름도 EKS에 그대로 적용.

```text
사용자
↓
DNS
↓
AWS Load Balancer
↓
Ingress Controller
↓
Service
↓
Endpoint
↓
Pod
↓
Container
↓
Application
```

AWS가 Kubernetes 앞단의 Load Balancer나 네트워크 자원을 제공하고, Kubernetes 내부에서는 Ingress, Service, Pod 같은 객체들이 요청을 이어받는 구조

# 12. 그래서 EKS는?

```text
               AWS
┌──────────────────────────────────┐

        EKS Control Plane
          AWS가 관리

          API Server
          etcd
          Scheduler
          Controller

────────────────────────────────────

             AWS VPC

      EC2 Worker Nodes

      Node A       Node B
        │            │
      Pod A        Pod C
      Pod B        Pod D

────────────────────────────────────

AWS 인프라와 연결

Load Balancer
EBS
EFS
VPC Network

└──────────────────────────────────┘
```

# 13. Kubernetes와 EKS 차이를 한 번에 정리하면

EKS는 Kubernetes를 대체하는 기술이 아님,

> EKS ⊃ Kubernetes

이런 게 아님.

단지 EKS는 AWS가 운영해주는 Kubernetes Cluster 서비스

> EKS = AWS가 운영해주는 Kubernetes Cluster 서비스

이렇게 생각하자.

| Kubernetes | EKS |
|---|---|
| 컨테이너 오케스트레이션 플랫폼 | AWS의 관리형 Kubernetes |
| Control Plane 직접 운영 가능 | AWS가 Control Plane 관리 |
| Node에서 Pod 실행 | AWS의 EC2 등의 Node에서 Pod 실행 |
| 자체 네트워크/Storage 플러그인 | VPC CNI, EBS/EFS CSI 등 AWS 연동 |
| Kubernetes API 사용 | 똑같이 Kubernetes API 사용 |
| Deployment/Pod/Service 사용 | 똑같이 사용 |

정리해보자면, Amazon EKS는 Kubernetes의 Control Plane을 대신 관리해주는 관리형 Kubernetes 서비스. API Server, etcd, Scheduler, Controller 같은 Control Plane 구성요소는 AWS가 운영하고, 사용자는 주로 Workdr Node와 그 위의 Deployment, Pod, Service 같은 Workload를 관리함. Kubernetes 자체의 동작 방식은 그대로 유지, EKS에서는 VPC, Load Balancer, EBS 같은 AWS 인프라와 Kubernetes가 연결되어 동작함.
