---
title: "2. 클러스터는 명령을 어떻게 Pod로 바꿀까"
description: "API Server에서 ReplicaSet, Scheduler, kubelet과 containerd까지, Pod가 만들어지는 흐름으로 구성 요소의 역할을 이해한다."
date: "2026-09-07 08:01:00 +0900"
categories: ["DevOps","Kubernetes"]
tags: [Kubernetes, ControlPlane, Scheduler, kubelet, containerd]
series: "직접 실험하는 Kubernetes"
part: 2
summary: "API Server는 요청과 상태 변경의 관문이고, 컨트롤러는 객체의 목표를 맞추며, Scheduler는 노드를 고른다. kubelet은 자기 노드에 배정된 Pod를 런타임으로 실행하고 상태를 보고한다. 이 역할의 경계가 장애를 좁히는 기준이 된다."
key_concepts:
  - "Control Plane: API와 컨트롤러, 스케줄링을 담당하는 관리 영역"
  - "ReplicaSet Controller: 관리하는 Pod의 개수를 맞춘다"
  - "Scheduler: 미배정 Pod가 실행될 Node를 선택한다"
  - "CRI: kubelet과 컨테이너 런타임 사이의 인터페이스"
legacyPath: "/ci-cd-docker/kubernetes/part-2/"
---

## 컨트롤 플레인은 조정하고, 워커 노드는 실행한다

> 쿠버네티스는 하나의 프로그램이 모든 일을 처리하는 구조가 아님. 서로 다른 컴포넌트가 API에 기록된 객체를 관찰하며 자기 역할을 수행.

```text
Cluster
├── Control Plane
│   ├── API Server: 요청과 상태 변경의 관문
│   ├── etcd: API 객체 저장
│   ├── Controller Manager: 여러 조정 루프 실행
│   └── Scheduler: Pod의 실행 Node 선택
└── Worker Node
    ├── kubelet: 배정된 Pod를 실행 상태로 맞춤
    ├── containerd 등 런타임: 이미지와 컨테이너 처리
    └── Pod: 함께 배치되는 컨테이너 묶음
```
Controller가 Scheduler 함수를 직접 호출한다는 뜻은 아니다. 주요 컴포넌트는 API Server를 통해 객체 변경을 읽고 쓴다. 앱의 사용자 트래픽까지 API Server를 거쳐 흐르는 것은 아니다.

## 1. API Server는 요청을 받지만 컨테이너를 실행하지 않는다

> API Server는 요청을 받는다. 

**배포 요청이 받아들여졌다는 것은 선언이 저장됐다는 뜻이지, 앱이 준비됐다는 뜻은 아니다.** 실제 실행까지는 뒤의 단계가 남아 있다.

요청에는 인증, 인가, API 필드 검증과 admission 정책 같은 검사가 적용되며, 인증은 “누구인가”, 인가는 “이 작업을 해도 되는가”에 대응. 

권한이 있어도 별도 정책이나 자원 쿼터 때문에 생성이 거절될 수 있다.

| 관찰한 결과 | 먼저 구분할 문제 |
|---|---|
| Unauthorized | 자격증명과 인증 과정 |
| Forbidden | 권한 또는 오류 메시지가 가리키는 정책 |
| 필드 타입 검증 오류 | 매니페스트의 필드와 값 |
| 요청 성공, Pod는 미준비 | 저장 이후의 생성, 배치, 실행 과정 |

> etcd에는 요청받은 API 객체를 보관

etcd는 API 객체를 보관한다. 일반적으로 컨트롤러와 kubelet이 etcd를 직접 수정하는 것이 아니라 API Server를 통한다. 따라서 etcd와 API Server의 문제는 상태 조회와 새 변경에 큰 영향을 준다. 이미 실행 중인 컨테이너가 모두 즉시 종료된다고 단정할 수는 없다.

## 2. Deployment, ReplicaSet, Pod는 서로 다른 객체다

> **Deployment는 Pod template과 배포를 관리하고, ReplicaSet은 그 template으로 유지할 Pod 개수를 관리.** 

Pod는 그 결과로 생기는 실행 단위.

```text
Deployment demo-api: replicas=3, image=v1
    ↓ Deployment Controller
ReplicaSet v1: desired=3
    ↓ ReplicaSet Controller
Pod A, Pod B, Pod C
```

Pod B만 지워졌다면 ReplicaSet이 가진 목표 3은 그대로다. 그래서 ReplicaSet Controller가 새 Pod를 만든다. 반대로 Deployment의 목표를 5로 바꾸면 Deployment Controller가 ReplicaSet의 목표를 변경하고, 이후 ReplicaSet Controller가 부족한 Pod를 만든다.

이미지를 바꾸는 경우에는 새 Pod template에 대응하는 ReplicaSet을 키우고 이전 것을 줄임. 이 계층이 있어야 개수 조정과 버전 교체를 분리할 수 있다. 

## 3. Scheduler는 실행할 자리를 고른다

> **Pod 객체가 존재해도 Node가 정해지지 않았다면 컨테이너 실행은 시작되지 않음.** 

Scheduler는 미배정 Pod가 들어갈 수 있는 노드를 먼저 찾고, 후보를 평가해 배정. 

예를 들어서 식당에 세 팀의 손님이 왔다고 해보자. 자리를 고르기 전에 각 테이블에 필요한 인원이 들어가는지 확인해야 한다. 쿠버네티스에서도 Pod의 자원 요청, 노드 조건, taint와 toleration, 배치 제약 등을 확인한다.

```text
Pod 생성
  → 들어갈 수 없는 Node 제외
  → 남은 후보 평가
  → Node 배정 결과를 API에 기록
```

모든 후보가 탈락하면 Pod는 배정을 기다린다. 다만 `Pending`이라는 phase에는 이미지 준비 같은 다른 초기 과정도 포함될 수 있으므로, 이름만 보고 자원 부족으로 확정하지 않는다. `describe pod`의 Node와 Events를 함께 봐야 한다.

[4편 모형](/ci-cd-docker/kubernetes/part-4/)은 배정 시점을 보여주기 위해 Pod가 적은 Worker를 고른다. 실제 Scheduler의 자원 필터와 점수 계산 전체를 구현한 것은 아니다.

## 4. kubelet은 런타임을 통해 컨테이너를 실행한다

**kubelet은 자기 노드에 배정된 Pod를 보고, 런타임에 필요한 컨테이너 실행을 요청한다.** containerd 같은 런타임이 이미지를 준비하고 컨테이너를 실행하며, kubelet은 상태와 프로브 결과를 보고한다.

```text
Scheduler가 Worker 2에 배정
  → Worker 2의 kubelet이 Pod spec 확인
  → CRI로 containerd에 준비와 실행 요청
  → 컨테이너 Running
  → kubelet의 readiness 검사
  → Ready 조건 반영
```

CRI는 이 둘이 대화하는 인터페이스다. Docker로 이미지를 만드는 일과 Kubernetes 노드가 런타임으로 실행하는 일은 이 지점에서 연결된다. 이미지 형식의 호환성과 런타임 연결 방식은 서로 다른 문제다.

네트워크를 붙이는 CNI, 볼륨 작업에 참여하는 CSI 드라이버도 실행 과정에 영향을 준다. 그래서 `ContainerCreating`에서 멈추면 이미지뿐 아니라 볼륨과 네트워크 준비 Events도 살펴봐야 한다.

## 5. 이름 대신 Label과 Selector가 연결한다

**관리 대상과 트래픽 대상을 찾을 때는 Pod의 개별 이름보다 Label과 Selector의 관계가 중요하다.** 새 Pod의 이름이 달라져도 연결이 이어질 수 있는 이유다.

```yaml
# Pod template의 이름표
labels:
  app: demo-api

# Service가 찾는 조건
selector:
  app: demo-api
```

Deployment의 `selector.matchLabels`와 Pod template의 Label도 맞아야 한다. 개별 Pod 이름은 진단과 삭제에 사용할 수 있지만, 계속 교체되는 Pod 집합을 연결할 때는 이 분류 조건을 사용한다.

Namespace는 리소스의 이름과 권한, 쿼터를 나누는 논리적 범위다. Namespace가 다르다는 사실만으로 Pod 사이 통신이 차단되지는 않는다. Node와 PV처럼 Namespace에 속하지 않는 객체도 있다.

## 6. 장애가 난 컴포넌트와 영향을 나눠 본다

**관리 기능이 멈춘 것과 현재 사용자 요청이 끊긴 것은 구분해서 확인해야 한다.** 새 배포는 실패하는데 기존 앱은 응답하는 상황도 가능하다.

| 멈춘 부분 | 우선 확인할 영향 |
|---|---|
| API Server 또는 etcd | 상태 조회와 변경 요청이 가능한가 |
| Controller | Pod 개수 복구와 롤아웃이 진행되는가 |
| Scheduler | 새 Pod가 Node에 배정되는가 |
| 특정 Node의 kubelet | 그 Node의 Pod 관리와 상태 보고가 되는가 |
| Service 규칙을 관리하는 구성 요소 | 바뀐 연결 대상이 노드에 반영되는가 |
| CoreDNS | 서비스 이름을 주소로 해석할 수 있는가 |

기존 네트워크 규칙이나 연결이 남아 있으면 일부 트래픽은 계속 흐를 수 있다. 표는 원인을 확정하는 답안이 아니라, 증상에서 다음 확인 지점을 정하는 지도다.

## 자료와 다음 파트

**다음에는 이 내부 흐름이 kubectl 출력에 어떻게 보이는지 읽어 본다.** [3편, kubectl과 Pod 상태](/ci-cd-docker/kubernetes/part-3/)으로 이어진다. [전체 목차](/ci-cd-docker/kubernetes/part-1/)에서도 이동할 수 있다.

배포 계층과 컨트롤러의 동작은 [Kubernetes Deployment 문서](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)에서 더 확인할 수 있다.
