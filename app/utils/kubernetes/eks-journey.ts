import type { Journey } from './journey'
import type { DetailScene, DetailStep } from './detailed-flows'
const values = (...text: string[]): DetailScene => ({ kind: 'values', items: text.map(text => ({ text })) })
const compare = (...text: string[]): DetailScene => ({ ...values(...text), kind: 'compare', success: true })
const step = (id: string, label: string, arrival: DetailScene, decision: DetailScene, result: string, info: string): DetailStep => ({ id, label, arrival, decision, result: values(result), info })
export const eksJourney: Journey = {
  id: 'deploy', label: 'EKS · 접속에서 Pod 실행까지', references: ['config', 'persist'],
  note: '이미 생성된 skala-2026 클러스터와 EC2 노드 두 개를 사용하는 모의 배포입니다. 리전은 ap-northeast-2, 네임스페이스는 default, Deployment는 shop-api, replicas는 1, 이미지는 nginx:1.27입니다. IAM 역할의 access entry를 Kubernetes 그룹에 연결하고 RBAC 권한을 부여한 경우입니다. 실제 AWS 요청이나 비용은 발생하지 않습니다. 세로선은 제어 작업의 순서이며, 컨트롤러와 노드는 API Server를 통해 상태를 읽고 갱신합니다.',
  sources: [
    { label: 'EKS kubeconfig', href: 'https://docs.aws.amazon.com/eks/latest/userguide/create-kubeconfig.html' },
    { label: 'EKS 접근 권한', href: 'https://docs.aws.amazon.com/eks/latest/userguide/grant-k8s-access.html' },
    { label: 'Pod 수명 주기', href: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/' },
  ],
  steps: [
    step('config', '내 PC · 접속 설정', values('skala-2026', 'ap-northeast-2'), values('EKS endpoint + CA', 'kubeconfig에 기록'), '접속 설정 완료', 'aws eks update-kubeconfig --region ap-northeast-2 --name skala-2026. 클러스터 정보를 조회해 로컬 kubeconfig를 설정합니다. 클러스터나 EC2를 생성하는 명령이 아닙니다.'),
    step('apply', 'kubectl apply · 배포 선언', values('shop-api.yaml'), values('nginx:1.27', 'replicas: 1'), 'Deployment 요청', 'kubectl apply -f shop-api.yaml. 예시 매니페스트는 app=shop-api 라벨, 컨테이너 포트 80, HTTP / readinessProbe를 사용합니다. kubectl은 EKS의 Kubernetes API endpoint로 요청합니다.'),
    step('identity', 'AWS 관리 · IAM 인증', values('IAM 역할: eks-deployer'), compare('토큰의 IAM 역할', '등록된 access entry'), '사용자 식별 완료', 'kubectl의 exec 인증 플러그인은 aws eks get-token을 사용합니다. EKS Control Plane이 IAM 신원을 인증합니다. 이 예시는 해당 역할의 access entry가 미리 등록되어 있습니다.'),
    step('access', 'AWS 관리 · RBAC 인가', values('deployments 생성', 'namespace: default'), compare('요청: create', '허용: create'), '권한 확인 완료', 'access entry에 연결된 그룹에 RoleBinding으로 권한을 준 예시입니다. 실제 apply에는 get, patch 등의 권한도 필요할 수 있습니다. EKS access policy로 권한을 부여하는 방식도 있지만 여기서는 RBAC 경로를 보여줍니다.'),
    step('persist', 'AWS 관리 · API Server / etcd', values('Deployment 요청'), values('검증 · admission 통과', 'etcd에 상태 저장'), '원하는 Pod: 1개', 'API Server의 검증과 admission을 통과한 선언을 저장합니다. etcd는 상태 저장소이며 다른 구성 요소에 실행 명령을 보내지 않습니다.'),
    step('controllers', 'AWS 관리 · 컨트롤러', values('Deployment: shop-api'), values('Deployment → ReplicaSet', 'ReplicaSet → Pod 생성'), 'Pending Pod 1개', 'Deployment Controller가 ReplicaSet을 만들고 ReplicaSet Controller가 Pod를 생성합니다. 각 작업은 API Server를 통해 수행되며 실제 실행은 아직 시작하지 않았습니다.'),
    step('scheduler', 'AWS 관리 · Scheduler', values('미배정 Pod'), { kind: 'values', items: [{ text: 'Node A · 자원 부족' }, { text: 'Node B · 수용 가능', selected: true }] }, 'nodeName: Node B', '스케줄러는 requests, 제약 조건과 노드 상태를 평가해 Node B에 바인딩합니다. 새 EC2를 직접 생성하거나 컨테이너를 실행하지 않습니다.'),
    step('kubelet', '내 EC2 · kubelet', values('Node B에 배정된 Pod'), compare('nodeName: Node B', '현재 노드: Node B'), 'CRI 실행 요청', 'Node B의 kubelet이 API Server에서 자신에게 배정된 Pod를 관찰하고 containerd에 CRI 요청을 보냅니다.'),
    step('runtime', '내 EC2 · containerd / CNI', values('nginx:1.27'), values('이미지 준비 · 컨테이너 시작', 'VPC CNI → Pod IP'), 'Running · 10.0.2.15', 'Pod sandbox와 네트워크 설정, 이미지 가져오기, 컨테이너 실행을 요약한 단계입니다. VPC CNI를 사용하는 예시이며 10.0.2.15는 예시 주소입니다. CNI 설정은 컨테이너 시작 과정에서 수행됩니다.'),
    step('probe', '내 EC2 · 준비 확인', values('Running · Ready=false'), compare('HTTP GET / → 200', '성공 기준: 200–399'), 'Running / Ready', 'kubelet의 HTTP readinessProbe가 성공하면 컨테이너의 준비 상태를 갱신합니다. 이 예시는 컨테이너가 하나이며 별도 readiness gate는 없습니다. Running만으로 요청 처리 준비를 보장하지 않습니다.'),
  ],
}
