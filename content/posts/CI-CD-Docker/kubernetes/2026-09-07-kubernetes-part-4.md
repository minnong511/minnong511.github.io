---
title: "4. 직접 실험하는 Kubernetes, Pod 복구부터 롤백까지"
description: "3D 클러스터와 모의 kubectl 터미널로 Pod 조회, 삭제와 복구, 확장, 이미지 교체, 장애 진단과 롤백을 직접 관찰한다."
date: "2026-09-07 08:03:00 +0900"
categories: [CI-CD-Docker, kubernetes]
tags: [Kubernetes, kubectl, 시뮬레이션, Deployment, ReplicaSet, 롤백]
series: "직접 실험하는 Kubernetes"
part: 4
summary: "목표를 바꾸는 명령과 실제 Pod가 준비되는 시점은 다르다. 이 실험실은 같은 모의 상태를 터미널, 3D 장면과 미션에 연결한다. 원하는 개수, 실제 개수, Ready 수, 연결 대상의 차이를 보며 조정 루프와 롤아웃을 이해한다."
key_concepts:
  - "Desired / Actual / Ready: 목표, 종료 중을 제외한 Pod 수, 준비된 Pod 수"
  - "RollingUpdate: 새 Pod의 준비를 확인하며 이전 Pod를 교체"
  - "maxSurge=1: 목표보다 한 개 더 생성할 수 있는 여유"
  - "rollout undo: 이전 Pod template으로 복귀"
legacyPath: "/ci-cd-docker/kubernetes/part-4/"
---

## 목표를 바꾸고, 실제 상태가 따라오는지 보자

**이 실험실은 kubectl 명령이 바꾼 목표를 컨트롤러와 노드가 어떻게 실행 결과로 만드는지 보여준다.** 3D 바로 아래에 터미널이 있어 명령을 입력하면서 변화를 함께 볼 수 있다. 오른쪽 패널에서 미션과 힌트, 리소스 상세, 지원 명령을 골라 확인한다. 좁은 화면에서는 3D 아래의 패널을 전환하며, Auto-fill을 누르면 터미널로 돌아온다.

터미널은 브라우저의 교육용 상태만 변경한다. 실제 셸 명령, Kubernetes API 호출, 이미지 다운로드는 실행하지 않는다. 필요한 도구를 설치하거나 클라우드에 접속할 필요 없이 바로 시작하면 된다.

::kubernetes-lab
::

## 1. 화면의 네 숫자는 서로 다른 것을 센다

**Desired가 바뀌었다고 Ready까지 즉시 바뀌는 것은 아니다.** 중간 숫자의 차이를 보는 것이 이 실습의 출발점이다.

| 화면 | 세는 것 | 삭제 직후의 예 |
|---|---|---|
| Desired | Deployment가 원하는 복제본 수 | 3으로 유지 |
| Actual | 종료 중인 Pod를 제외한 현재 Pod 수 | 2로 감소 |
| Ready | 요청을 받을 준비가 된 Pod 수 | 2로 감소 |
| Endpoints | Service가 연결할 Ready 주소 수 | 해당 주소 제외 |

종료 표시가 된 Pod는 아직 화면에 남아 있지만 Actual에서 제외한다. 다음 단계에서 객체가 사라진다. 새로운 Pod가 생성되면 Actual은 다시 늘지만, 이미지 준비와 readiness 검사가 남아 있으므로 Ready는 잠시 적을 수 있다.

장면의 Pod를 누르면 이름, 소유 ReplicaSet, Node와 상태를 볼 수 있다. 일시 정지 후 **한 단계**로 진행하면 관찰 중 명령을 추가해도 자동 시간이 흐르지 않는다. 터미널 조회 결과는 실행 시점의 스냅샷이고, 뒤이어 붙는 컴포넌트 이벤트와 장면은 후속 변화를 보여준다.

## 2. 미션은 명령을 외웠는지보다 결과를 확인한다

**성공 조건은 정확한 문자열 일치가 아니라, 의미 있는 관찰이나 목표 상태의 도달이다.** 예를 들어 확장 미션은 목표 5와 Ready 5가 모두 맞아야 완료된다.

| 미션 | 할 일 | 완료에 필요한 상태 또는 증거 |
|---|---|---|
| 01 | Pod 살펴보기 | Pod 목록을 조회함 |
| 02 | Pod 삭제와 복구 | 삭제된 이름은 사라지고 새 Pod로 Ready 3 복구 |
| 03 | 3개에서 5개로 확장 | Desired 5, Ready 5, 조정 완료 |
| 04 | v2 배포 | 다섯 Pod가 v2로 준비되고 이전 RS의 목표는 0 |
| 05 | ImagePullBackOff 진단 | 실패 Pod Events를 보고 이미지 오류를 선택 |
| 06 | Readiness 실패 진단 | 실패 Pod Events와 Endpoints 조회 후 Readiness 원인 선택 |
| 07 | Service 연결 대상 확인 | Service와 Endpoints를 읽고 Ready 3과 전체 Pod 4를 비교 |
| 08 | 실패 배포 롤백 | 이전 v1으로 복귀해 실패 Pod 없이 Ready 3 |

조회와 진단 미션은 읽기 자체가 학습 목표라서, 어떤 객체를 관찰했는지와 진단 근거를 기록한다. 복구나 배포 미션은 비동기 단계가 끝나 실제 목표에 도달해야 완료된다.

각 미션은 필요한 초기 상황으로 재설정된다. 앞 미션에서 자유 실험으로 개수를 바꿔도 다음 미션의 시작 조건은 일정하다. 실패 진단 미션은 처음부터 장애 상태를 준비하며, 완료한 미션 수는 같은 페이지 안에서 유지된다.

## 3. 미션의 명령을 실행하거나 힌트로 직접 풀 수 있다

**미션 패널의 명령 옆에서 실행 버튼을 누르면, 직접 입력했을 때와 같은 모의 동작을 확인할 수 있다.** Pod 조회 미션은 `kubectl get pods`, 삭제 미션은 조회 후 현재 Pod 이름을 넣은 삭제 명령, 확장 미션은 `kubectl scale deployment demo-api --replicas=5`를 보여준다. 한 단계를 실행하면 다음에 필요한 명령으로 바뀐다.

실행 버튼은 명령과 결과를 터미널에 기록하고 같은 상태를 3D 장면에 반영한다. **입력만 하기**는 명령을 입력 칸에 넣기만 하며, Enter를 눌러야 실행된다. 미션을 선택하는 것만으로 명령이 실행되지는 않는다.

명령을 직접 떠올리고 싶으면 **힌트로 직접 풀기**를 선택한다. 이 모드에서는 관찰할 대상에서 문법, 구체적인 명령으로 힌트를 좁혀 간다.

```text
Hint       → 무엇을 먼저 확인하면 좋을까?
Show More  → 어떤 동사와 리소스를 쓰면 될까?
Show More  → 지금 상태에 맞는 실제 명령
Auto-fill  → 입력 칸에만 삽입
Enter      → 사용자가 직접 실행
```

Pod 목록을 조회하면 다음 힌트는 삭제할 행동으로 바뀐다. 생성된 Pod 이름이 달라지는 경우에도 현재 상태에서 대상 이름을 고른다. 복구가 진행 중일 때는 불필요한 명령 대신 상태가 변하는 단계를 관찰하도록 안내한다.

## 4. Pod 삭제는 ReplicaSet의 목표를 지우지 않는다

**Pod를 하나 삭제해도 그 Pod를 관리하는 ReplicaSet의 목표가 남아 있으므로 새 Pod가 만들어진다.** 같은 Pod가 부활하는 것이 아니다.

```text
demo-api-b 삭제 요청
  → Terminating, Ready 연결 대상에서 제외
  → Pod 객체 제거, Actual 2
  → ReplicaSet Controller: desired 3 ≠ actual 2
  → 새 Pod 객체, Pending
  → Scheduler가 Worker 선택
  → kubelet이 containerd에 준비 요청, ContainerCreating
  → 컨테이너 실행, Running
  → readiness 검사 통과, Ready=True
  → Service 연결 대상 자동 갱신
```

실제 Kubernetes는 여러 작업을 비동기로 처리한다. 모형에서는 차이를 읽기 쉽도록 삭제 후 부족 감지와 생성 순서를 나누었다. 컨테이너와 노드의 전체 장애 처리, 종료 유예 시간과 네트워크 전파 지연까지 그대로 재현한 것은 아니다.

## 5. 새 이미지 배포는 ReplicaSet 사이의 교체다

**롤링 업데이트는 기존 Pod 안의 이미지 파일을 덮어쓰는 작업이 아니라, 새 template의 Pod로 교체하는 과정이다.** 이 모형은 `maxSurge=1`, `maxUnavailable=0`으로 새 Pod가 준비된 다음 이전 Pod를 줄인다.

```text
목표 3, 모두 v1 Ready
  → v2 Pod 1개 추가: 총 4개, 처음에는 Ready 3
  → v2 Ready: Ready 4
  → v1 Pod 1개 종료: Ready 3
  → 반복
  → v2 Ready 3, v1 ReplicaSet 목표 0
```

새 Pod가 이미지를 받지 못하거나 readiness에 실패하면 교체가 지연된다. 기존 Ready Pod가 유지되어 전체 배포 실패와 현재 서비스 중단을 구분해 볼 수 있다. 다만 실제로 무중단인지 판단하려면 처리 중 요청, 종료 동작, 인프라 장애와 용량도 함께 확인해야 한다.

`set image`는 변경 요청의 접수 결과를 보여준다. `rollout status`는 준비된 새 복제본 수를 읽고, 진행 중이면 완료 이벤트를 이 터미널에 추가한다. 모형에서는 상태 관찰을 계속할 수 있도록 입력을 잠그지 않는다.

## 6. 모의 이미지와 롤백의 범위를 알아두자

**이미지 이름은 실습 시나리오를 고르는 값이며 실제 레지스트리의 존재 여부를 검사하지 않는다.** 성공과 실패를 같은 조건에서 다시 관찰하기 위한 약속이다.

| 이미지 | 모의 동작 |
|---|---|
| demo-api:v1 | 정상 실행과 readiness 통과 |
| demo-api:v2 | 정상 새 버전으로 롤링 업데이트 |
| demo-api:unready | 컨테이너는 실행되지만 /ready가 503 반환 |
| 그 외 이름 | 모의 이미지 저장소에 없어 ImagePullBackOff |

미션 8에서 `demo-api:v2-missing`은 준비되지 않은 v2 이미지를 나타낸다. 이전 정상 버전은 v1이다. `rollout undo`를 사용하거나 정상 이전 이미지로 다시 변경해도 최종 상태가 목표와 같으면 성공할 수 있다.

롤백은 이전 Pod template을 복원한다. Desired 복제본 수나 DB 데이터, 외부 ConfigMap의 내용까지 과거로 돌리는 기능은 아니다. 이전 ReplicaSet을 재사용하는 과정도 장면과 `get rs`로 확인할 수 있다. [공식 Deployment 문서](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)의 롤아웃과 롤백 설명을 기준으로 삼았다.

## 다음 파트

**이제 Ready Pod만 연결되는 이유를 요청 경로로 확장해 보자.** [5편, Service와 네트워크](/ci-cd-docker/kubernetes/part-5/)로 이어진다. 앞 개념이 필요하면 [3편 Pod 상태](/ci-cd-docker/kubernetes/part-3/), [전체 목차](/ci-cd-docker/kubernetes/part-1/)를 확인하면 된다.
