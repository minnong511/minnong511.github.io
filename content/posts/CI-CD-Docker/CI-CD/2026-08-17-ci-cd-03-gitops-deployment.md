---
layout: post
title: "CI/CD 기초 3편: Jenkins와 Argo CD를 이용한 GitOps 배포"
description: "컨테이너 이미지를 Build, Push하고 GitOps Repository와 Argo CD를 통해 Kubernetes에 배포하는 흐름을 정리한다."
date: 2026-08-17 14:30:00 +0900
categories: [DevOps, CI-CD]
tags: [CI/CD, Docker, Jenkins, GitOps, Argo CD, Kubernetes]
series: "Docker 기반 CI/CD"
part: 3
legacyPath: "/devops/ci-cd/2026/08/17/ci-cd-03-gitops-deployment/"
---
## 참고: CI/CD(Continuous Integration & Continuous Deployment)

애플리케이션을 컨테이너 이미지로 Build, Push한 후 실행 환경에 배포하는 흐름이다.

```mermaid
flowchart LR
    DEV[개발자<br/>코드 작성]
    SRC[(Source Repository<br/>애플리케이션 소스 코드)]
    CI[Jenkins<br/>CI/CD Pipeline]
    REG[(Docker Registry<br/>컨테이너 이미지 저장)]
    GITOPS[(GitOps Repository<br/>배포 설정 저장)]
    ARGO[Argo CD<br/>배포 상태 동기화]

    subgraph K8S[Kubernetes 실행 환경]
        DEV_CLUSTER[DEV Cluster<br/>개발 환경]
        UAT_CLUSTER[UAT Cluster<br/>검증 환경]
        RELEASE_CLUSTER[Release Cluster<br/>운영 환경]
    end

    DEV -->|1. Commit & Push| SRC
    SRC -->|2. 변경 감지| CI
    CI -->|3. Build & Push| REG
    CI -->|4. Image Tag 등<br/>배포 값 변경| GITOPS
    GITOPS -->|5. Webhook 또는 Poll| ARGO
    ARGO -->|6. Sync| DEV_CLUSTER
    ARGO -->|6. Sync| UAT_CLUSTER
    ARGO -->|6. Sync| RELEASE_CLUSTER
    REG -.->|7. Image Pull| DEV_CLUSTER
    REG -.->|7. Image Pull| UAT_CLUSTER
    REG -.->|7. Image Pull| RELEASE_CLUSTER
```

```text
개발자 → Source Repository → Jenkins → Docker Registry
                              │
                              └→ GitOps Repository ↔ Argo CD
                                                       ├→ DEV Cluster
                                                       ├→ UAT Cluster
                                                       └→ Release Cluster
```

| 단계 | 동작 | 결과 |
| --- | --- | --- |
| 1 | 개발자가 코드를 Commit하고 Source Repository에 Push | 소스 코드 변경 |
| 2 | Jenkins가 변경을 감지하여 CI/CD Pipeline 실행 | Build와 테스트 시작 |
| 3 | 컨테이너 이미지를 Build하고 Docker Registry에 Push | 배포할 이미지 저장 |
| 4 | GitOps Repository의 Image Tag 등 배포 설정 갱신 | 원하는 배포 상태 기록 |
| 5 | Argo CD가 Webhook 또는 Poll 방식으로 변경 감지 | 실제 상태와 원하는 상태 비교 |
| 6 | Argo CD가 각 Kubernetes Cluster에 설정 동기화 | DEV, UAT, Release 환경에 배포 |
| 7 | Kubernetes가 Registry에서 컨테이너 이미지를 Pull | 새 버전 컨테이너 실행 |

### CI와 CD의 역할

| 구분 | 의미 | 담당 작업 |
| --- | --- | --- |
| CI | Continuous Integration, 지속적 통합 | 코드 통합, Build, 테스트, 이미지 생성과 Push |
| CD | Continuous Deployment, 지속적 배포 | 배포 설정 변경 감지, 실행 환경 동기화, 컨테이너 배포 |

- Jenkins는 애플리케이션을 Build하고 컨테이너 이미지를 Registry에 Push한다.
- GitOps Repository에는 Kubernetes가 어떤 이미지 버전을 실행해야 하는지 기록한다.
- Argo CD는 GitOps Repository의 원하는 상태와 Kubernetes의 실제 상태를 비교하고 동기화한다.
- DEV, UAT, Release Cluster는 목적이 다른 실행 환경이며 동일한 방식으로 배포할 수 있다.
