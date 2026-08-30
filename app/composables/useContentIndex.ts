import manifestJson from '~~/data/public-content-manifest.json'
import type { BlogPost, ContentManifest } from '~/types/content'
import { normalizeBlogPost, normalizeContentPath, postTimestamp } from '~/utils/content'

export async function useContentIndex() {
  const manifest = manifestJson as ContentManifest
  const publicEntries = (manifest.entries || manifest.posts || [])
    .filter(entry => entry.visibility !== 'draft')
  const index = publicEntries
    .map(entry => normalizeBlogPost(entry))
    .filter(post => post.path !== '/')
    .sort((a, b) => postTimestamp(b) - postTimestamp(a) || a.path.localeCompare(b.path, 'ko'))
  const posts = computed<BlogPost[]>(() => index)
  const findByPath = (path: string) => {
    const normalized = normalizeContentPath(path)
    return posts.value.find(post => post.path === normalized)
  }

  return {
    posts,
    findByPath,
    manifest,
  }
}
