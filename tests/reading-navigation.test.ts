import { describe, expect, it } from 'vitest'
import type { MinimarkTree } from '@nuxt/content'
import { normalizeBlogPost } from '../app/utils/content'
import { highlightParts, normalizeReadingHeadings } from '../app/utils/reading'
import { categoryKey, postMatchesCategory, topicForPost, topicSummaries } from '../app/utils/topics'

describe('reading heading hierarchy', () => {
  it('moves legacy body chapters below the page title, preserving links, text and the source tree', () => {
    const body: MinimarkTree = { type: 'minimark', value: [
      ['h1', { id: 'lora' }, 'What is LoRA'],
      ['h2', { id: 'rank' }, 'Rank'],
      ['pre', {}, ['code', {}, '# This is code']],
      ['p', {}, ['a', { href: '#rank' }, 'See rank']],
    ] }
    const original = JSON.stringify(body)
    const result = normalizeReadingHeadings(body)
    expect(result.value[0]).toEqual(['h2', { id: 'lora' }, 'What is LoRA'])
    expect(result.value[1]).toEqual(['h3', { id: 'rank' }, 'Rank'])
    expect(result.value.slice(2)).toEqual(body.value.slice(2))
    expect(JSON.stringify(body)).toBe(original)
    expect(normalizeReadingHeadings(result)).toEqual(result)
  })

  it('preserves already-correct documents and embedded learning components', () => {
    const body: MinimarkTree = { type: 'minimark', value: [['h2', { id: 'chapter' }, 'Chapter'], ['kubernetes-lab', { mode: 'service' }]] }
    expect(normalizeReadingHeadings(body)).toBe(body)
  })
})

describe('topic discovery', () => {
  it('keeps old category URLs matching equivalent spellings', () => {
    const post = normalizeBlogPost({ categories: ['DeepLearning', 'LoRA'] })
    expect(postMatchesCategory(post, 'deep-learning')).toBe(true)
    expect(postMatchesCategory(post, 'Deep_Learning')).toBe(true)
    expect(postMatchesCategory(post, 'backend')).toBe(false)
    expect(categoryKey('basics')).toBe(categoryKey('Basic'))
  })

  it('counts each post once and retains unknown and uncategorized posts', () => {
    const posts = [
      normalizeBlogPost({ categories: ['Deep_Learning', 'LoRA', 'AI'] }),
      normalizeBlogPost({ categories: ['java', 'spring'] }),
      normalizeBlogPost({ categories: ['Something new'] }),
      normalizeBlogPost({ categories: [] }),
    ]
    const topics = topicSummaries(posts)
    expect(topics.reduce((sum, topic) => sum + topic.count, 0)).toBe(posts.length)
    expect(topics.find(topic => topic.key === 'ai')?.count).toBe(1)
    expect(topics.find(topic => topic.key === 'notes')?.count).toBe(2)
    expect(topicForPost(posts[1]!).key).toBe('backend')
  })

  it('separates AI and AX and resolves Notes without relying on the topic array order', () => {
    const posts = [
      normalizeBlogPost({ categories: ['AI', 'DeepLearning', 'sLLM'] }),
      normalizeBlogPost({ categories: ['AX', '반도체'] }),
      normalizeBlogPost({ categories: ['Notes', 'Thinking'] }),
      normalizeBlogPost({ categories: ['Unknown'] }),
    ]
    expect(posts.map(post => topicForPost(post).key)).toEqual(['ai', 'ax', 'notes', 'notes'])
    expect(topicSummaries(posts).map(topic => [topic.key, topic.count])).toEqual([
      ['ai', 1], ['ax', 1], ['notes', 2],
    ])
    expect(topicSummaries(posts).some(topic => topic.key === 'projects')).toBe(false)
  })

  it('keeps renamed category filters matching their new folder names', () => {
    for (const [categories, oldName] of [
      [['DevOps', 'Kubernetes'], 'CI-CD-Docker'],
      [['Backend', 'Database', 'PostgreSQL'], 'DB'],
      [['Backend', 'SpringAI'], 'SPRING_AI'],
      [['Backend', 'Spring', 'Boot'], 'springboot'],
      [['Backend', 'Spring', 'Container'], 'Spring_Container'],
      [['Notes', 'Interview'], '면접'],
      [['Notes', 'PostingDesign'], '포스팅용_디자인'],
    ] as const) {
      expect(postMatchesCategory(normalizeBlogPost({ categories }), oldName), oldName).toBe(true)
    }
  })
})

describe('safe search highlights', () => {
  it('treats punctuation and markup as literal text and never drops content', () => {
    const text = '<script>alert(1)</script> C++와 c++'
    const parts = highlightParts(text, 'C++')
    expect(parts.map(part => part.text).join('')).toBe(text)
    expect(parts.filter(part => part.match).map(part => part.text)).toEqual(['C++', 'c++'])
    expect(highlightParts('한글 검색과 검색', '검색').filter(part => part.match)).toHaveLength(2)
    expect(highlightParts('내용', '   ')).toEqual([{ text: '내용', match: false }])
  })
})
