import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '@nuxtjs/mdc/runtime/parser/index'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { normalizeMathDelimiters } from '../app/utils/markdown-math'

describe('study-note math rendering', () => {
  it('preserves front matter, code examples and ordinary dollar amounts', () => {
    const literal = '---\ntitle: "\\(example\\)"\n---\n\n```text\n\\[\nx = y\n\\]\n```\n\n`\\(x\\)` and $10, $20\n'
    expect(normalizeMathDelimiters(literal)).toBe(literal)
    expect(normalizeMathDelimiters('\\(y = Wx\\)')).toBe('$$y = Wx$$')
  })

  it('renders real LoRA equations without creating formula headings', async () => {
    const source = readFileSync('content/posts/AI/DeepLearning/LoRA/LoRA.md', 'utf8')
    const result = await parseMarkdown(normalizeMathDelimiters(source), {
      highlight: false,
      remark: { plugins: { math: { instance: remarkMath, options: { singleDollarTextMath: false } } } },
      rehype: { plugins: { katex: { instance: rehypeKatex, options: { trust: false, throwOnError: false } } } },
    })
    const nodes: Array<{ tag?: string, props?: Record<string, unknown>, children?: unknown[] }> = []
    function walk(node: unknown) {
      if (!node || typeof node !== 'object') return
      const item = node as typeof nodes[number]
      nodes.push(item)
      item.children?.forEach(walk)
    }
    walk(result.body)
    const headings = nodes.filter(node => node.tag === 'h1')
    expect(headings).toHaveLength(29)
    expect(nodes.some(node => node.props?.className?.toString().includes('katex'))).toBe(true)
    expect(nodes.some(node => node.props?.className?.toString().includes('katex-error'))).toBe(false)
  })
})
// @vitest-environment node
