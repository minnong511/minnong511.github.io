---
title: "쿠버네티스, 배포부터 요청과 장애 진단까지 따라가기"
description: "선언한 앱이 Pod로 실행되는 과정, 사용자 요청이 앱에 도착하는 경로, 장애 증거를 좁혀 복구하는 과정을 세로 애니메이션으로 따라간다."
date: "2026-09-07 16:00:00 +0900"
categories: ["DevOps","Kubernetes"]
tags: [Kubernetes, Deployment, Ingress, Service, EndpointSlice, 디버깅, 시각화]
legacyPath: "/ci-cd-docker/kubernetes/three-flows/"
---

쿠버네티스는 **앱을 띄우는 과정, 요청을 전달하는 과정, 문제를 찾아 복구하는 과정**으로 나눠 보면 이해하기 편하다. 보고 싶은 흐름을 골라 시작하고, 움직이는 칩을 따라가 보자.

::kubernetes-journey
::

<details>
<summary>이 글의 예시와 읽는 방법</summary>

**1. 배포 과정**

**배포는 내가 선언한 앱이 클러스터 안에서 실제 Pod로 실행되기까지의 과정이다.** 이 예시에서는 `product-api:v1`을 사용하는 Pod 3개를 선언하고, 그중 Pod A가 노드에 배정되어 실행되는 과정을 확대해서 본다.

사용자가 `kubectl apply`를 실행하면 kubectl이 매니페스트에 선언된 내용을 API Server에 전달한다. API Server는 인증, 인가, 검증을 거쳐 원하는 상태를 etcd에 저장한다. 이때 저장되는 것은 실행 결과가 아니라 **어떤 상태로 실행하고 싶은지에 대한 선언**이다.

이후 Deployment Controller가 API Server를 통해 Deployment의 상태를 확인하고 필요한 ReplicaSet을 만든다. ReplicaSet Controller는 원하는 Pod 개수와 현재 개수를 비교해 부족한 만큼 Pod 객체를 생성한다. 아직 실행할 노드가 정해지지 않았으므로, Scheduler가 자원과 제약 조건을 확인해 적절한 워커 노드를 선택한다.

선택된 노드의 kubelet은 자신에게 배정된 Pod를 확인하고, containerd에 컨테이너 실행을 요청한다. 이 예시에서는 컨테이너가 실행되면 Pod가 `Running`이 되고, 설정된 readinessProbe의 성공 조건까지 만족하면 `Ready`가 되어 트래픽을 받을 수 있다. **실행 중인 것과 요청을 받을 준비가 된 것은 다르다.** 다른 Pod도 같은 절차를 거친다.

각 역할은 이렇게 기억하면 된다.

- `kubectl`: 선언한 내용을 요청으로 전달
- API Server: 상태를 읽고 변경하는 관문
- etcd: 클러스터 상태 저장
- Deployment Controller: 배포와 ReplicaSet 관리
- ReplicaSet Controller: 원하는 Pod 개수 유지
- Scheduler: Pod가 실행될 노드 선택
- kubelet: 노드에서 Pod 실행과 상태 관리
- containerd: 컨테이너 실행

**2. 실제 요청 흐름**

**요청 흐름은 사용자의 요청이 실제 애플리케이션에 도착하고, 응답이 돌아오기까지의 과정이다.** 이 예시에서는 `https://shop.example.com/api/products?category=book` 요청으로 시작한다.

DNS로 주소를 찾고, Load Balancer가 연결할 Ingress Controller를 선택한다. Ingress Controller는 요청의 Host와 경로를 규칙과 비교해 Service를 결정한다. 이어 준비된 Pod를 선택하고, 앱이 요청을 처리해 상품 두 개를 반환한다.

이 예시에서는 Pod A가 Not Ready이고 B와 C가 Ready다. DNS 조회 결과, Ingress 규칙, EndpointSlice는 관련 단계 옆에 참조 정보로 표시했다. 세로선은 처리 순서이며, 모든 단계가 패킷이 통과하는 장치라는 뜻은 아니다.

**3. 디버깅과 장애 진단**

**장애 진단은 상태를 확인하고, 증거를 모아 원인을 좁히는 과정이다.** 먼저 `kubectl get`으로 Pod의 `STATUS`, `READY`, `RESTARTS`를 확인한다. 이어 `kubectl describe`의 Events에서 스케줄링 실패, 이미지 다운로드 실패, 프로브 실패 같은 단서를 찾는다.

컨테이너가 실행된 적이 있다면 `kubectl logs`로 앱 로그를 확인한다. 재시작 이전 컨테이너의 로그가 필요하면 `--previous`를 붙인다. 추가 확인이 필요하면 `exec`로 실행 중인 컨테이너 내부를 살펴보고, 진단 도구가 없는 이미지라면 `debug`로 임시 진단 컨테이너를 사용한다.

이 예시에서는 사용자 요청에 `503`이 돌아오는 별도의 장애 상황을 다룬다. Pod는 `Running`이지만 `Ready`는 아니고, 준비 검사 경로 `/ready`와 앱의 새 경로 `/health`가 일치하지 않는다.

`get → describe → logs → exec/debug`로 증거를 모으고, 네트워크는 `Pod → Service → DNS → Ingress/외부` 순서로 확인한다. 최근 배포의 변경이 원인임을 확인한 뒤 이전 버전으로 되돌리고, Pod의 Ready 상태와 실제 사용자 응답까지 확인한다.

실제 장애에서는 모든 검사를 끝까지 할 필요는 없다. 원인을 찾으면 필요한 조치로 넘어가면 된다. 서비스 영향이 크고 이전 버전으로 복구할 수 있다면 롤백 판단을 앞당긴다.

모든 명령, 주소와 출력은 **학습용 모의 예시**이며, 실제 클러스터나 외부 API를 호출하지 않는다. 시작하면 자동으로 진행하고, 이전·다음 버튼을 누르면 도착·판단·결과를 한 박자씩 살펴볼 수 있다. 용어와 예외 조건은 각 단계의 정보 버튼에서 확인하면 된다.

</details>

<details>
<summary>참고 자료와 이어 읽기</summary>

- [Deployment와 롤백, Kubernetes 공식 문서](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [ReplicaSet, Kubernetes 공식 문서](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)
- [Ingress, Kubernetes 공식 문서](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [EndpointSlice, Kubernetes 공식 문서](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/)
- [Pod 진단, Kubernetes 공식 문서](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/)
- [Service 진단, Kubernetes 공식 문서](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [2편, 클러스터는 명령을 어떻게 Pod로 바꿀까](/ci-cd-docker/kubernetes/part-2/)
- [3편, kubectl과 Pod, 상태에서 원인을 찾는 법](/ci-cd-docker/kubernetes/part-3/)
- [7편, 쿠버네티스 로드 밸런싱](/ci-cd-docker/kubernetes/part-7/)

</details>
