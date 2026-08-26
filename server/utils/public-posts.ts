import { queryCollection } from '@nuxt/content/server'
import type { H3Event } from 'h3'

interface ContentNode {
  type?: string
  value?: string
  children?: ContentNode[]
}

export function contentText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const contentNode = node as ContentNode
  if (typeof contentNode.value === 'string') return contentNode.value
  return (contentNode.children || []).map(contentText).join(' ')
}

export async function getPublicPosts(event: H3Event) {
  return queryCollection(event, 'posts')
    .where('published', '=', true)
    .order('date', 'DESC')
    .order('legacyPath', 'ASC')
    .all()
}

export function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
