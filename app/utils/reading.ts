import type { MinimarkNode, MinimarkTree } from '@nuxt/content'

// The page template owns H1. Keep saved Markdown and heading IDs intact.
export function normalizeReadingHeadings<T extends MinimarkTree>(body: T): T {
  function hasTitle(nodes: MinimarkNode[]): boolean {
    return nodes.some(node => Array.isArray(node) && (node[0] === 'h1' || hasTitle(node.slice(2) as MinimarkNode[])))
  }
  if (!hasTitle(body.value)) return body
  function shift(node: MinimarkNode): MinimarkNode {
    if (typeof node === 'string') return node
    const [tag, props, ...children] = node
    const level = /^h([1-6])$/.exec(tag)?.[1]
    return [level ? `h${Math.min(6, Number(level) + 1)}` : tag, { ...props }, ...children.map(shift)]
  }
  return { ...body, value: body.value.map(shift) }
}

export function highlightParts(text: string, query: string) {
  const needle = query.trim().toLocaleLowerCase('ko-KR')
  if (!needle) return [{ text, match: false }]
  const lower = text.toLocaleLowerCase('ko-KR')
  const parts: Array<{ text: string, match: boolean }> = []
  let cursor = 0
  let index = lower.indexOf(needle)
  while (index !== -1) {
    if (index > cursor) parts.push({ text: text.slice(cursor, index), match: false })
    parts.push({ text: text.slice(index, index + needle.length), match: true })
    cursor = index + needle.length
    index = lower.indexOf(needle, cursor)
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })
  return parts
}
