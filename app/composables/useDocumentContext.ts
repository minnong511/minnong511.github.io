import type { BlogPost } from '~/types/content'

export interface OutlineItem {
  id: string
  text: string
  level: 2 | 3
}

export function useDocumentContext() {
  const currentPost = useState<BlogPost | null>('ide:current-post', () => null)
  const outline = useState<OutlineItem[]>('ide:outline', () => [])
  const wordCount = useState<number>('ide:word-count', () => 0)
  const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)))

  function reset() {
    currentPost.value = null
    outline.value = []
    wordCount.value = 0
  }

  return { currentPost, outline, wordCount, readingMinutes, reset }
}
