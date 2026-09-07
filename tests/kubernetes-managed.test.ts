import { describe, expect, it } from 'vitest'
import { advanceManagedStep, managedResponsibilities, managedScenarios, managedSteps } from '../app/utils/kubernetes/managed'

describe('managed Kubernetes responsibility examples', () => {
  it('changes infrastructure ownership while keeping application work with the team', () => {
    const self = managedResponsibilities('self')
    const eks = managedResponsibilities('eks')
    expect(self.control.owner).toBe('우리 팀 운영')
    expect(eks.control.owner).toBe('AWS 운영')
    expect(eks.nodes.owner).toBe('AWS + 우리 팀')
    expect(eks.app).toEqual(self.app)
    expect(eks.nodes.note).toContain('패치 버전 적용은 우리 팀 책임')
  })

  it('retains Kubernetes deployment behavior in both modes and distinguishes Running from Ready', () => {
    const self = managedSteps('self', 'deploy')
    const eks = managedSteps('eks', 'deploy')
    expect(eks).toEqual(self)
    expect(eks[0]!.pods).toHaveLength(0)
    expect(eks[2]!.pods).toEqual(['Pending', 'Pending', 'Pending'])
    expect(eks[3]!.pods).toEqual(['Not Ready', 'Not Ready', 'Not Ready'])
    expect(eks[3]!.endpoints).toBe(0)
    expect(eks[4]!.endpoints).toBe(3)
  })

  it('shows delayed endpoint changes and team-owned application recovery', () => {
    for (const mode of ['self', 'eks'] as const) {
      const flow = managedSteps(mode, 'app')
      expect(flow[1]!.pods[1]).toBe('Not Ready')
      expect(flow[1]!.endpoints).toBe(3)
      expect(flow[2]!.endpoints).toBe(2)
      expect(flow[3]!.actor).toBe('우리 팀 · 개발')
      expect(flow[4]!.pods.every(pod => pod === 'Ready')).toBe(true)
      expect(flow[4]!.endpoints).toBe(3)
    }
  })

  it('assigns control-plane infrastructure recovery to AWS in EKS, and to the team when self-operated', () => {
    expect(managedSteps('eks', 'control')[2]!.actor).toBe('AWS · EKS')
    expect(managedSteps('self', 'control')[2]!.actor).toBe('우리 팀 · 플랫폼 운영')
    expect(managedSteps('eks', 'control')[1]!.control).toBe('인스턴스 1개 장애')
    expect(managedSteps('eks', 'control').every(step => step.pods.length === 3)).toBe(true)
  })

  it('requires team initiation before managed node updates', () => {
    const flow = managedSteps('eks', 'update')
    expect(flow[0]!.actor).toContain('AMI 제공')
    expect(flow[1]!.actor).toBe('우리 팀 · 운영')
    expect(flow[1]!.decision).toContain('PodDisruptionBudget')
    expect(flow[2]!.actor).toBe('AWS · 관리형 노드 그룹')
    expect(flow[2]!.input).toContain('우리 팀이 시작한')
    expect(flow[3]!.actor).toBe('우리 팀 · 운영')
  })

  it('advances exactly one stage and stops at the final result in every scenario', () => {
    for (const mode of ['self', 'eks'] as const) {
      for (const scenario of managedScenarios) {
        const flow = managedSteps(mode, scenario.id)
        let index = 0
        for (let i = 1; i < flow.length; i++) {
          index = advanceManagedStep(index, flow.length)
          expect(index).toBe(i)
          expect(flow[index]!.actor).toBeTruthy()
          expect(flow[index]!.input).toBeTruthy()
          expect(flow[index]!.decision).toBeTruthy()
          expect(flow[index]!.output).toBeTruthy()
        }
        expect(advanceManagedStep(index, flow.length)).toBe(index)
      }
    }
  })
})
