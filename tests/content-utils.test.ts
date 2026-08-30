import { describe, expect, it } from 'vitest'

import {
  buildExplorerTree,
  formatPostDate,
  normalizeBlogPost,
  normalizeContentPath,
  postMatches,
  stringList,
} from '../app/utils/content'
import type { BlogPost, ContentManifestEntry } from '../app/types/content'

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: '/sample/',
    source: 'content/posts/sample.md',
    path: '/sample/',
    title: 'Sample',
    description: 'Description',
    date: '2026-08-26 00:00:00 +0900',
    categories: ['DevOps'],
    tags: ['Nuxt'],
    summary: '',
    keyConcepts: [],
    strengths: [],
    tradeoffs: [],
    series: '',
    image: '',
    ...overrides,
  }
}

describe('normalizeContentPath', () => {
  it.each([
    ['', '/'],
    ['/', '/'],
    ['devops/docker', '/devops/docker/'],
    ['/devops/docker', '/devops/docker/'],
    ['/devops//docker///', '/devops/docker/'],
    ['/devops/docker/index.html', '/devops/docker/'],
    ['/devops/docker.html', '/devops/docker/'],
    ['public/assets/base_image/image.png', '/assets/base_image/image.png/'],
    ['https://minnong511.github.io/java/spring/2026/08/22/spring-async/', '/java/spring/2026/08/22/spring-async/'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeContentPath(input)).toBe(expected)
  })

  it('keeps case, underscores and Korean slugs used by legacy URLs', () => {
    expect(normalizeContentPath('/mlops/2026/08/07/Devops_1')).toBe('/mlops/2026/08/07/Devops_1/')
    expect(normalizeContentPath('/algorithm/greedy/2026/08/12/알고리즘-논리')).toBe('/algorithm/greedy/2026/08/12/알고리즘-논리/')
  })
})

describe('content metadata normalization', () => {
  it('converts list-like metadata into trimmed arrays', () => {
    expect(stringList([' DevOps ', '', 'Docker'])).toEqual(['DevOps', 'Docker'])
    expect(stringList('["DevOps", "Docker"]')).toEqual(['DevOps', 'Docker'])
    expect(stringList(undefined)).toEqual([])
  })

  it('uses manifest metadata when a content document omits legacy fields', () => {
    const manifest: ContentManifestEntry[] = [{
      source: '_posts/Network/DNS.md',
      route: '/network/2026/08/26/DNS/',
      title: 'DNS 기초',
      description: 'DNS가 주소를 찾는 흐름',
      date: '2026-08-26 00:00:00 +0900',
      categories: ['Network'],
      tags: ['DNS'],
    }]

    const normalized = normalizeBlogPost({
      id: 'posts/Network/DNS',
      sourcePath: '_posts/Network/DNS.md',
    }, manifest)

    expect(normalized).toMatchObject({
      path: '/network/2026/08/26/DNS/',
      title: 'DNS 기초',
      description: 'DNS가 주소를 찾는 흐름',
      categories: ['Network'],
      tags: ['DNS'],
    })
  })

  it('prefers document fields while preserving a manifest legacy route', () => {
    const normalized = normalizeBlogPost({
      source: '_posts/Basic/example.md',
      title: '문서 제목',
      categories: 'Basic, CS',
      tags: ['기초'],
      date: new Date('2026-08-24T00:00:00.000Z'),
    }, [{
      source: '_posts/Basic/example.md',
      legacyPath: '/basic/cs/2026/08/24/example/',
      title: '매니페스트 제목',
    }])

    expect(normalized.title).toBe('문서 제목')
    expect(normalized.path).toBe('/basic/cs/2026/08/24/example/')
    expect(normalized.categories).toEqual(['Basic', 'CS'])
    expect(normalized.date).toBe('2026-08-24T00:00:00.000Z')
  })

  it('formats valid and fallback dates consistently', () => {
    expect(formatPostDate('2026-08-04T12:00:00+09:00')).toBe('2026.08.04')
    expect(formatPostDate('not-a-date')).toBe('not.a.date')
  })

  it('keeps the Asia/Seoul calendar date when the host timezone is UTC', () => {
    const previousTimezone = process.env.TZ
    process.env.TZ = 'UTC'
    try {
      expect(formatPostDate('2026-08-24 00:50:00 +0900')).toBe('2026.08.24')
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ
      else process.env.TZ = previousTimezone
    }
  })
})

describe('Explorer helpers', () => {
  const posts = [
    post({ id: 'docker', path: '/docker/', title: 'Docker 레이어', categories: ['DevOps', 'Docker'] }),
    post({ id: 'nginx', path: '/nginx/', title: 'Nginx 프록시', categories: ['DevOps', 'Nginx'], tags: ['proxy'] }),
    post({ id: 'orphan', path: '/orphan/', title: '분류 없는 글', categories: [], tags: [] }),
  ]

  it('builds a deterministic category tree and falls back to workspace', () => {
    const tree = buildExplorerTree(posts)

    expect(tree.map(node => node.name)).toEqual(['DevOps', 'workspace'])
    expect(tree[0]?.children.map(node => node.name)).toEqual(['Docker', 'Nginx'])
    expect(tree[0]?.children[0]?.posts[0]?.id).toBe('docker')
    expect(tree[1]?.posts[0]?.id).toBe('orphan')
  })

  it('matches title, description, category and tag without case sensitivity', () => {
    expect(postMatches(posts[0]!, 'docker')).toBe(true)
    expect(postMatches(posts[1]!, 'PROXY')).toBe(true)
    expect(postMatches(posts[1]!, 'DevOps')).toBe(true)
    expect(postMatches(posts[0]!, '없는 검색어')).toBe(false)
    expect(postMatches(posts[0]!, '')).toBe(true)
  })
})
