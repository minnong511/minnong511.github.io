---
title: "3. kubectl과 Pod, 상태에서 원인을 찾는 법"
description: "get과 describe의 차이, Running과 Ready의 차이, 세 프로브와 장애 Events를 작은 예제로 구분한다."
date: "2026-09-07 08:02:00 +0900"
categories: ["DevOps","Kubernetes"]
tags: [Kubernetes, kubectl, Pod, Readiness, ImagePullBackOff]
series: "직접 실험하는 Kubernetes"
part: 3
summary: "Pod 진단은 목록에서 이상한 대상을 찾고, describe의 Events로 멈춘 단계를 확인하는 흐름이다. Running은 컨테이너 실행 상태이고 Ready는 요청을 받을 준비 조건이다. 이미지를 받지 못한 상황과 실행 뒤 준비 검사에 실패한 상황은 조치가 다르다."
key_concepts:
  - "get: 리소스 목록과 요약 상태 조회"
  - "describe: 객체의 조건과 Events 확인"
  - "Ready: 요청을 받을 준비 조건, Pod phase와 다름"
  - "Readiness 실패: 트래픽 대상에서 제외, 자체적으로 재시작하지 않음"
legacyPath: "/ci-cd-docker/kubernetes/part-3/"
---

## 진단은 상태를 보고, 증거로 원인을 좁히는 일이다

**Pod 상태 이름은 조사할 단계를 알려주지만, 원인을 하나로 확정해 주지는 않는다.** `ImagePullBackOff`를 보았다고 무조건 태그 오타라고 결론 내리면 안 된다. 실제 Events에서 다운로드 실패 이유를 확인해야 한다.

Pod의 문제를 조사할 때는 다음 순서로 범위를 좁힐 수 있다. [4편 실험실](/ci-cd-docker/kubernetes/part-4/)에서는 이 중 `get`과 `describe`를 모의 실행한다.

```text
get: 어떤 대상이 이상한가?
  → describe: 어떤 단계, 어떤 이벤트에서 멈췄나?
  → logs: 앱은 무엇을 기록했나?
  → exec / debug: 필요한 내부 정보를 더 확인할 수 있나?
```

## 1. kubectl은 클러스터의 API 클라이언트다

**kubectl 명령은 동사, 리소스 종류, 이름, 옵션을 조합해 읽으면 된다.** 어떤 정보를 원하는지 정한 뒤 필요한 범위를 붙이면 명령을 이해하기 쉽다.

```text
kubectl  describe  pod  demo-api-a
도구       동사     종류     이름

kubectl  scale  deployment  demo-api  --replicas=5
도구      동사      종류        이름       옵션
```

실제 클러스터에 연결할 때는 context가 가리키는 클러스터, 사용자와 Namespace를 먼저 확인한다. kubeconfig는 이런 접속 설정을 담는다. 접속 설정을 만드는 일과 클러스터를 생성하는 일은 다르다.

이 글의 실험실은 `lab` Namespace를 가정한 브라우저 모형이다. 별도 클러스터나 클라우드 계정, kubeconfig 없이 실행할 수 있다.

## 2. get은 목록, describe는 한 객체의 사정을 보여준다

**먼저 목록에서 대상을 고르고, 그 이름으로 상세 상태를 읽는다.** 모든 Pod에 같은 조치를 하기 전에 어떤 복제본이 문제인지 구분하는 과정이다.

```bash
kubectl get pods
kubectl describe pod demo-api-a
```

다음은 학습용 출력이다.

```text
NAME          READY   STATUS
demo-api-a    1/1     Running
demo-api-b    0/1     ImagePullBackOff
demo-api-c    0/1     Running
```

`a`는 컨테이너 하나가 준비됐다. `b`는 이미지 준비 과정에 실패했다. `c`는 실행은 시작했지만 준비되지 않았다. 같은 `0/1`이라도 `b`와 `c`의 다음 조사 지점이 다르다.

`describe pod`에서는 소유 ReplicaSet, 배정 Node, 이미지, Ready 조건과 Events를 함께 읽는다. **Failed to pull**, **Readiness probe failed**, **FailedScheduling**은 서로 다른 단계의 증거다.

## 3. Pod phase와 화면의 STATUS를 구분한다

**Ready, ContainerCreating, ImagePullBackOff를 전부 Pod phase로 외우면 상태 해석이 꼬인다.** API의 phase와 kubectl이 요약해 표시하는 STATUS는 완전히 같은 열거형이 아니다.

| 구분 | 의미 | 작은 예 |
|---|---|---|
| Pod phase | Pod 생명주기의 큰 구간 | Pending, Running, Succeeded, Failed, Unknown |
| 컨테이너 대기 사유 | 왜 컨테이너가 아직 실행되지 못하는가 | ContainerCreating, ImagePullBackOff |
| Ready 조건 | 요청을 받을 준비가 되었는가 | True 또는 False |
| 종료 표시 | 삭제 요청을 처리 중인가 | kubectl에 Terminating으로 표시 |

예를 들어 이미지 다운로드에 실패한 Pod는 phase가 `Pending`이면서 STATUS에 `ImagePullBackOff`가 보일 수 있다. Readiness가 실패한 Pod는 phase가 `Running`이면서 READY가 `0/1`일 수 있다. [공식 Pod 생명주기 문서](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)도 phase와 표시 상태를 구분한다.

실험실은 전이를 보기 쉽도록 `Pending → ContainerCreating → Running → Ready`를 장면에 표시한다. 마지막 Ready는 새로운 phase가 아니라 **Ready 조건이 참이 된 시점**이다.

## 4. 세 프로브는 실패했을 때의 행동이 다르다

**Readiness는 트래픽 준비, Liveness는 실행 중인 컨테이너의 회복 필요성, Startup은 초기 기동을 판단한다.** 이름보다 실패 후 무엇을 하는지를 먼저 구분하면 된다.

| 프로브 | 질문 | 실패 기준에 도달했을 때 |
|---|---|---|
| readinessProbe | 지금 요청을 받아도 되는가? | Ready=False로 보고해 일반 트래픽 대상에서 제외 |
| livenessProbe | 이 컨테이너가 스스로 회복할 수 있는 상태인가? | 컨테이너를 종료하고 재시작 정책에 따라 처리 |
| startupProbe | 초기 기동을 마쳤는가? | 기동 실패로 컨테이너 종료, 재시작 정책에 따라 처리 |

Startup probe가 설정되면 성공 전까지 Liveness와 Readiness 검사를 시작하지 않는다. 느리게 시작하는 앱을 Liveness가 너무 일찍 종료하지 않도록 하는 데 의미가 있다.

DB 장애를 무조건 Liveness 실패로 연결하면, 앱을 재시작해도 DB는 그대로인데 모든 복제본이 재시작할 수 있다. 검사 대상과 실패 후 행동이 문제를 해결하는 방향인지 생각해야 한다.

## 5. 이미지 실패와 Readiness 실패는 다른 문제다

**이미지 실패는 실행 재료를 준비하지 못한 것이고, Readiness 실패는 실행 후 요청을 받을 조건을 만족하지 못한 것이다.** 따라서 확인할 증거가 다르다.

```text
이미지 실패
  이미지 가져오기 → 실패 → 컨테이너 미실행 → Ready=False

Readiness 실패
  이미지 준비 → 컨테이너 실행 → /ready 응답 503 → Ready=False
```

실제 `ImagePullBackOff`에서는 이미지 이름과 태그, 저장소 접근 권한, 네트워크 등을 확인한다. 런타임이 이미지를 받아 실행한 뒤 CPU 구조 문제로 실패한 경우라면 기동 오류 등 다른 증거가 나올 수 있다. [공식 이미지 문서](https://kubernetes.io/docs/concepts/containers/images/)에서 이미지 pull 실패와 재시도 동작을 확인할 수 있다.

Readiness 실패에서는 검사 경로, 포트, 응답, 필요한 의존성과 기동 시간을 살핀다. 컨테이너가 살아 있다는 이유만으로 사용자의 요청도 성공한다고 판단해서는 안 된다.

## 6. 종료와 재시작도 다른 사건이다

**컨테이너 재시작은 같은 Pod 안에서 일어날 수 있고, Pod 삭제 후 복구는 새 Pod 객체를 만드는 일이다.** 이름, UID와 IP가 무엇을 가리키는지 함께 보면 구분할 수 있다.

Pod 삭제 요청에는 유예 시간이 있다. kubelet은 종료 훅과 신호 전달, 런타임 정리를 수행한다. 한편 연결 대상의 준비 상태도 갱신된다. 실제 환경에서는 여러 작업이 비동기로 진행돼 이미 전달된 요청이나 전파 지연을 고려해야 한다.

`emptyDir`는 같은 Pod 안의 컨테이너 재시작을 넘어 유지되지만 Pod가 제거되면 사라진다. 영속 데이터가 필요한 경우는 [6편 저장소](/ci-cd-docker/kubernetes/part-6/)의 영역이다.

## 7. 더 깊이 조사할 도구도 질문에서 고른다

**명령을 길게 외우기보다, 필요한 증거와 도구를 연결해 두는 편이 좋다.** 아래 명령은 실제 kubectl의 도구 범위를 설명하며, 모의 터미널에서는 지원하지 않는다.

| 알고 싶은 것 | 실제 도구 | 읽을 때의 기준 |
|---|---|---|
| 직전 컨테이너가 왜 종료됐나 | logs --previous | 이전 실행의 로그와 종료 상태 |
| 특정 Pod만 응답하는가 | port-forward | 임시 연결이며 대표성은 제한됨 |
| 컨테이너 내부 정보가 필요한가 | exec 또는 debug | 도구 유무와 필요한 권한 |
| 자원을 얼마나 쓰는가 | top | 메트릭 수집 구성과 관찰 시간 |
| 적용하면 무엇이 달라지는가 | diff, server dry-run | 현재 객체와 선언의 차이, 정책 검사 |
| 어떤 필드와 종류가 있는가 | explain, api-resources | 연결한 클러스터의 API 정보 |
| 특정 값을 자동 처리할 수 있나 | JSONPath, custom-columns | 실제 객체의 필드 경로 |

k9s는 같은 리소스를 터미널 화면에서 관찰하고 조작하는 도구다. 도구가 바뀌어도 “대상 식별 → 상태와 증거 확인 → 조치”라는 순서는 유지된다.

## 다음 파트

**이제 상태를 읽은 뒤 직접 목표를 바꾸며 관찰해 보자.** [4편, 복구와 배포 실험실](/ci-cd-docker/kubernetes/part-4/)에서 여덟 미션을 진행할 수 있다. [전체 목차](/ci-cd-docker/kubernetes/part-1/)로 돌아갈 수도 있다.
