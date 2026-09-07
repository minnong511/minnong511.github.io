import type { BlogPost } from '../types/content'

export const blogTopics = [
  { key: 'backend', name: '백엔드', description: 'Java, Spring, API와 데이터베이스', categories: ['backend', 'java', 'spring', 'database'] },
  { key: 'frontend', name: '프론트엔드', description: 'Vue와 웹 인터페이스', categories: ['frontend', 'vue'] },
  { key: 'ai', name: 'AI', description: '딥러닝, LLM과 모델 학습', categories: ['ai', 'deep-learning', 'sllm', 'llm'] },
  { key: 'ax', name: 'AX', description: '업무 적용, 제조 AI와 반도체', categories: ['ax'] },
  { key: 'devops', name: '인프라 · DevOps', description: 'Docker, Kubernetes와 배포', categories: ['devops', 'ci-cd-docker', 'ci-cd'] },
  { key: 'cs', name: '컴퓨터 기초', description: '운영체제, 네트워크와 개발 기초', categories: ['basic', 'cs', 'network', 'os'] },
  { key: 'algorithm', name: 'Python · 알고리즘', description: '파이썬 문법과 문제 풀이', categories: ['algorithm', 'python'] },
  { key: 'projects', name: '프로젝트', description: '직접 만들고 연결한 기록', categories: ['projects', 'project', '깃허브-프로젝트'] },
  { key: 'notes', name: '생각 · 학습 기록', description: '공부 방법, 협업과 짧은 생각', categories: ['notes', 'thinking', 'agile', 'interview', 'postingdesign'] },
] as const

export function categoryKey(value: string): string {
  const key = value.trim().toLocaleLowerCase('ko-KR').replaceAll('_', '-')
    .replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]+/gu, '').replace(/-+/g, '-')
  return ({
    deeplearning: 'deep-learning', basics: 'basic', 'network중요': 'network',
    'ci-cd-docker': 'devops', db: 'database', springai: 'spring-ai',
    boot: 'springboot', 'spring-container': 'container',
    '면접': 'interview', '포스팅용-디자인': 'postingdesign',
  } as Record<string, string>)[key] || key
}

export function categoryLabel(value: string): string {
  const labels: Record<string, string> = {
    'deep-learning': 'Deep Learning', basic: '기초', java: 'Java', spring: 'Spring', springboot: 'Spring Boot',
    'spring-ai': 'Spring AI', container: 'Spring Container', kubernetes: 'Kubernetes',
    frontend: 'Frontend', backend: 'Backend', devops: 'DevOps', network: 'Network',
    ai: 'AI', ax: 'AX', cs: '컴퓨터 기초', notes: '생각 · 학습 기록',
    database: 'Database', interview: '면접', postingdesign: '포스팅 디자인',
    sllm: 'sLLM', oop: 'OOP', jvm: 'JVM', project: '프로젝트', projects: '프로젝트',
  }
  return labels[categoryKey(value)] || value.replaceAll('_', ' ')
}

export function topicForPost(post: BlogPost) {
  const primary = categoryKey(post.categories[0] || '')
  return blogTopics.find(topic => (topic.categories as readonly string[]).includes(primary))
    || blogTopics.find(topic => topic.key === 'notes')!
}

export function topicSummaries(posts: BlogPost[]) {
  return blogTopics.map(topic => ({
    ...topic,
    count: posts.filter(post => topicForPost(post).key === topic.key).length,
  })).filter(topic => topic.count > 0)
}

export function postMatchesCategory(post: BlogPost, category: string): boolean {
  return !category || post.categories.some(value => categoryKey(value) === categoryKey(category))
}
