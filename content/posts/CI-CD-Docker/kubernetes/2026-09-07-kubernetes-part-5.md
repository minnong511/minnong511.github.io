---
title: "5. Service와 Ingress, 요청은 어디로 흐를까"
description: "Pod IP, Service, Endpoints, DNS와 Ingress를 하나의 요청 경로로 연결하고, 통신 장애를 구간별로 좁혀 본다."
date: "2026-09-07 08:04:00 +0900"
categories: [CI-CD-Docker, kubernetes]
tags: [Kubernetes, Service, EndpointSlice, DNS, Ingress, 네트워크]
series: "직접 실험하는 Kubernetes"
part: 5
summary: "Service는 바뀌는 Pod 앞에 일관된 접근 지점을 제공하고, 연결 대상 정보는 Pod의 Label과 준비 상태에 따라 갱신된다. DNS는 이름을 주소로 찾고, Ingress는 외부 HTTP 요청의 경로를 정한다. 장애는 이 역할의 경계를 따라 확인한다."
key_concepts:
  - "Service: Pod 집합에 대한 일관된 접근 지점"
  - "EndpointSlice: Service 뒤 연결 대상과 조건을 기록하는 객체"
  - "port / targetPort: Service 쪽 포트 / 대상 Pod 쪽 포트"
  - "Ingress / Controller: 라우팅 규칙 / 규칙을 구현하는 구성 요소"
legacyPath: "/ci-cd-docker/kubernetes/part-5/"
---

## 연결은 고정된 입구와 바뀌는 대상으로 나뉜다

**Pod가 교체될 때마다 클라이언트 설정을 수정하지 않으려면, 바뀌지 않는 접근 지점이 필요하다.** Service가 그 역할을 하고, 뒤쪽의 실제 연결 대상은 자동으로 갱신된다.

```text
클라이언트
  → Service 이름
  → Service의 접근 주소
  → 준비된 Pod 중 연결 대상
  → app 프로세스
```

Pod가 삭제되고 새 Pod가 만들어지면 이름과 IP가 달라질 수 있다. 같은 Pod 안에서 컨테이너만 재시작하는 것까지 항상 새 Pod IP를 받는 것으로 이해하지는 말자. 또한 Service의 ClusterIP도 그 Service 객체의 수명 안에서 유지되는 것이지, 삭제 후 재생성까지 같은 값이라고 보장되는 것은 아니다.

## 1. Service는 Label로 대상을 찾는다

**Service 이름과 Pod 이름이 같아서 연결되는 것이 아니다. Selector가 Pod의 Label과 맞아야 한다.** 그래서 새 이름의 Pod도 같은 Label을 가지면 대상이 될 수 있다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-api
spec:
  selector:
    app: demo-api
  ports:
    - name: http
      port: 80
      targetPort: 8080
```

`port: 80`은 Service에 접근할 포트다. `targetPort: 8080`은 Pod 쪽에서 실제 앱이 받아야 할 포트다. Deployment의 `containerPort`를 적는 것만으로 앱이 해당 포트에서 자동으로 수신하는 것은 아니다.

앱이 다른 포트에서 실행되거나 외부에서 접근할 수 없는 주소에만 바인딩하면, Label이 맞아도 요청은 성공하지 않는다. 객체의 연결 규칙과 실제 프로세스 수신 상태를 함께 확인해야 한다.

## 2. Endpoints는 전체 Pod 목록과 다를 수 있다

**기본적인 Service 라우팅에서는 준비되지 않은 Pod를 일반 요청의 대상으로 사용하지 않는다.** Pod가 네 개 있어도 Ready가 세 개라면 사용할 수 있는 연결 주소는 세 개일 수 있다.

```text
Pod A: Running, Ready=True   → 연결 대상
Pod B: Running, Ready=True   → 연결 대상
Pod C: Running, Ready=True   → 연결 대상
Pod D: Running, Ready=False  → 일반 트래픽 대상 제외
```

[실험실 미션 7](/ci-cd-docker/kubernetes/part-4/)이 바로 이 상황이다. Service 조회 후 Endpoints를 읽고, 어느 Pod의 주소가 빠졌는지 비교해 보자.

이 실험실은 `kubectl get endpoints`라는 명령을 사용한다. 다만 **기존 Endpoints API는 Kubernetes 1.33부터 deprecated이며, 현대적인 대상 관리는 EndpointSlice가 중심**이다. EndpointSlice는 주소뿐 아니라 ready, serving, terminating 같은 조건도 표현한다. 따라서 실제 객체에 주소가 기록되는 것과 지금 정상 라우팅 대상으로 사용되는 것을 구분해야 한다. [공식 Service 문서](https://kubernetes.io/docs/concepts/services-networking/service/#endpoints-deprecated)

실제 환경에서 다음과 같이 Service에 대응하는 EndpointSlice를 확인할 수 있다. 이 명령은 글의 설명용이며 모의 터미널 지원 범위에는 포함하지 않았다.

```bash
kubectl get endpointslices -l kubernetes.io/service-name=demo-api
```

## 3. Service 종류는 접근 방식을 정한다

**먼저 누가 어디에서 이 앱을 호출하는지 정하고 노출 방식을 고른다.** 모든 서비스를 외부 로드밸런서에 붙일 이유는 없다.

| 구분 | 역할 | 함께 알아둘 점 |
|---|---|---|
| ClusterIP | 클러스터 안의 가상 주소 제공 | 일반적인 내부 서비스 접근 |
| NodePort | Node의 지정 포트로 Service 접근 | 기본 포트 범위와 방화벽, 트래픽 정책 확인 |
| LoadBalancer | 외부 로드밸런서 통합 | 제공자와 컨트롤러에 따라 구현과 비용이 다름 |
| ExternalName | 외부 이름에 대한 DNS 별칭 | 프록시나 Pod 부하분산을 자동으로 만드는 것은 아님 |
| Headless | ClusterIP 없이 대상 주소를 찾도록 구성 | 별도 type이 아니라 clusterIP: None 설정 |

Service의 가상 주소를 동작시키는 방법도 하나로 고정되지 않는다. kube-proxy의 구현 모드나 이를 대체하는 네트워크 구현에 따라 패킷 처리 방식이 달라진다. iptables는 이러한 패킷 처리에 사용할 수 있는 구현 방식 중 하나다.

요청이 매번 정확히 순서대로 A, B, C에 분산된다고 가정하지도 말자. 연결 재사용, 세션 고정과 라우팅 정책에 따라 특정 Pod로 계속 이어질 수 있다. 그래서 세션과 중요한 상태를 개별 Pod 메모리에만 두면 교체와 확장에서 문제가 생길 수 있다.

## 4. DNS와 Ingress는 서로 다른 일을 한다

**DNS는 이름을 주소로 찾고, Ingress는 들어온 HTTP 요청을 어느 서비스로 보낼지 정한다.** 도메인이 해석된다는 사실만으로 앱까지 정상 연결됐다고 볼 수 없다.

클러스터 안에서는 Service의 이름을 사용할 수 있다. 일반적인 클러스터 도메인 설정에서 전체 이름은 다음 형태다.

```text
demo-api.lab.svc.cluster.local
서비스   Namespace   서비스 영역  클러스터 도메인

같은 Namespace → demo-api
다른 Namespace → demo-api.lab
```

클러스터 도메인은 환경 설정에 따라 다를 수 있다. CoreDNS 등 클러스터 DNS 구성이 서비스 검색을 지원한다.

외부에서는 DNS와 로드밸런서, Ingress 구현, Service 대상이 함께 연결된다. 다음은 논리적인 관계이며, 모든 구현의 패킷이 반드시 각 객체를 하나의 서버처럼 순서대로 통과한다는 뜻은 아니다.

```text
사용자 → DNS로 주소 조회 → 외부 진입점
  → Ingress의 host/path 규칙
  → 연결된 Service의 대상
  → Pod IP:targetPort → 앱 프로세스
```

Ingress는 규칙이고, Ingress Controller는 그 규칙을 읽어 실제 프록시나 로드밸런서 설정에 반영하는 구성 요소다. Ingress 리소스만 만든다고 외부 진입점이 자동으로 완성되지는 않는다.

## 5. Ingress 설정은 설치된 컨트롤러에 맞춘다

**매니페스트의 Ingress class와 애노테이션은 실제 설치된 컨트롤러에 맞아야 한다.** 같은 Kubernetes를 사용해도 컨트롤러가 다르면 지원하는 설정이 달라질 수 있다.

먼저 설치된 컨트롤러가 어떤 IngressClass를 처리하는지 확인한다. 그런 다음 그 컨트롤러의 문서에서 지원하는 애노테이션과 옵션을 골라 적용한다. 다른 구현의 예제를 가져올 때도 이 대응 관계를 다시 확인해야 한다.

경로 규칙은 단순한 파일 줄 순서만으로 해석하지 않는다. 기본 Ingress 명세에서는 일치한 경로 가운데 더 긴 경로를 우선하고, 같은 길이라면 Exact를 Prefix보다 우선한다. 컨트롤러 고유 확장은 해당 구현을 따로 확인한다. [공식 Ingress 문서](https://kubernetes.io/docs/concepts/services-networking/ingress/#multiple-matches)

HTTPS에서는 인증서와 TLS 종료 위치, 원래 요청의 프로토콜 전달도 중요하다. 앞단에서 HTTPS를 종료하고 앱에는 HTTP로 전달한다면, 앱이 신뢰할 프록시 정보와 전달 헤더를 어떻게 해석하는지 맞춰야 한다.

## 6. 통신 장애는 구간별 증거를 비교한다

**“접속이 안 된다”를 하나의 원인으로 보지 말고, 어디까지 성공하는지 비교하면 조사 범위가 줄어든다.** 상태가 Running이라는 이유만으로 네트워크 앞단만 조사하지 말자.

| 확인할 대상 | 확인의 의미 | 다음에 좁힐 것 |
|---|---|---|
| 앱의 실제 수신 포트와 응답 | 프로세스가 요청을 받을 수 있는가 | 앱, 바인딩 주소, 포트 |
| Pod의 Ready 조건 | 라우팅 대상이 될 준비가 되었는가 | 프로브와 의존성 |
| EndpointSlice 또는 Endpoints | 예상 주소가 준비된 대상으로 잡혔는가 | Selector, Label, 준비 상태 |
| Service 주소와 포트 | 가상 서비스 경로가 동작하는가 | 포트 설정과 네트워크 구현 |
| Service 이름 | DNS 해석까지 동작하는가 | Namespace, DNS 설정 |
| Ingress, 외부 DNS와 TLS | 외부 진입 구간이 동작하는가 | class, host/path, 인증서, 대상 상태 |

503, 연결 거부와 타임아웃은 구현과 실패 구간에 따라 다르게 나타난다. 특정 응답 코드 하나만으로 원인을 확정하지 않고, 위 계층의 결과와 함께 판단한다. 실제 영향이 크면 검증된 복구 방법으로 영향을 줄이는 작업과 증거 수집을 함께 진행한다.

## 다음 파트

**연결이 유지되어도 설정과 데이터가 사라지면 앱은 제대로 동작하지 않는다.** [6편, 설정과 저장소, 운영 조건](/ci-cd-docker/kubernetes/part-6/)으로 이어진다. [전체 목차](/ci-cd-docker/kubernetes/part-1/)에서도 이동할 수 있다.
