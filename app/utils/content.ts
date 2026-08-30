import type { BlogPost, ContentManifestEntry, ExplorerFolderNode } from '~/types/content'

const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function normalizeDateTime(value: unknown): string {
  const source = String(value || '')
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(source)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : source
}

export function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean)
  if (typeof value === 'string') {
    const source = value.trim()
    if (source.startsWith('[') && source.endsWith(']')) {
      try {
        const parsed: unknown = JSON.parse(source)
        if (Array.isArray(parsed)) return stringList(parsed)
      } catch {
        // YAML-style arrays with single quotes are handled by the fallback below.
      }
    }
    return source
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map(item => item.trim().replace(/^['"]+|['"]+$/g, '').trim())
      .filter(Boolean)
  }
  return []
}

export function normalizeContentPath(value: unknown): string {
  let path = String(value || '').trim()
  if (!path) return '/'
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname
  } catch {
    // Keep the original path when it is not a valid absolute URL.
  }
  try {
    path = decodeURIComponent(path)
  } catch {
    // A partially encoded path is still usable for the normalization below.
  }
  path = path.normalize('NFC')
  path = path
    .replace(/^\.?\/?(?:public\/)?/, '/')
    .replace(/\/index\.html?$/i, '/')
    .replace(/\.html?$/i, '/')
    .replace(/\/{2,}/g, '/')
  if (!path.startsWith('/')) path = `/${path}`
  if (path !== '/' && !path.endsWith('/')) path += '/'
  return path
}

function matchManifest(
  document: Record<string, unknown>,
  entries: ContentManifestEntry[],
): ContentManifestEntry | undefined {
  const sourceCandidates = [document.source, document.sourcePath, document.id, document.stem]
    .filter(Boolean)
    .map(String)
  const pathCandidates = [document.path, document.legacyPath, document.route]
    .filter(Boolean)
    .map(normalizeContentPath)

  return entries.find((entry) => {
    if (entry.source && sourceCandidates.some(value => value === entry.source || value.endsWith(entry.source!))) return true
    const entryPath = entry.legacyPath || entry.route
    return Boolean(entryPath && pathCandidates.includes(normalizeContentPath(entryPath)))
  })
}

export function normalizeBlogPost(
  value: unknown,
  manifestEntries: ContentManifestEntry[] = [],
): BlogPost {
  const document = record(value)
  const metadata = record(document.meta)
  const manifest = matchManifest(document, manifestEntries) || {}
  const merged = { ...manifest, ...metadata, ...document }
  const source = String(merged.source || merged.sourcePath || merged.id || merged.stem || '')
  const path = normalizeContentPath(
    merged.legacyPath
    || merged.route
    || manifest.legacyPath
    || manifest.route
    || merged.path
    || manifest.target,
  )
  const title = String(merged.title || manifest.title || '제목 없는 문서')
  const description = String(merged.description || merged.excerpt || manifest.description || '')
  const date = normalizeDateTime(merged.date || manifest.date || '')
  const lastModifiedAt = normalizeDateTime(merged.last_modified_at || merged.lastModifiedAt || '')

  return {
    id: String(merged.id || source || path),
    source,
    path,
    title,
    description,
    date,
    lastModifiedAt,
    categories: stringList(merged.categories || manifest.categories),
    tags: stringList(merged.tags || manifest.tags),
    summary: String(merged.summary || ''),
    keyConcepts: stringList(merged.key_concepts || merged.keyConcepts),
    strengths: stringList(merged.strengths),
    tradeoffs: stringList(merged.tradeoffs),
    series: String(merged.series || ''),
    part: merged.part === undefined ? undefined : Number(merged.part),
    image: String(merged.image || ''),
    robots: String(merged.robots || ''),
  }
}

export function postTimestamp(post: BlogPost): number {
  const value = Date.parse(post.date)
  return Number.isFinite(value) ? value : 0
}

export function formatPostDate(value: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return value.slice(0, 10).replaceAll('-', '.')
  const parts = Object.fromEntries(
    SEOUL_DATE_FORMATTER
      .formatToParts(timestamp)
      .filter(part => ['year', 'month', 'day'].includes(part.type))
      .map(part => [part.type, part.value]),
  )
  return `${parts.year}.${parts.month}.${parts.day}`
}

export function primaryCategory(post: BlogPost): string {
  return post.categories[0] || 'workspace'
}

export function buildExplorerTree(posts: BlogPost[]): ExplorerFolderNode[] {
  const root: ExplorerFolderNode[] = []
  posts.forEach((post) => {
    const categories = post.categories.length ? post.categories : ['workspace']
    let siblings = root
    let parents: string[] = []
    let leaf: ExplorerFolderNode | undefined
    categories.forEach((name) => {
      parents = [...parents, name]
      const key = parents.map(part => part.toLocaleLowerCase('ko-KR')).join('/')
      let node = siblings.find(item => item.key === key)
      if (!node) {
        node = { key, name, posts: [], children: [] }
        siblings.push(node)
      }
      leaf = node
      siblings = node.children
    })
    leaf?.posts.push(post)
  })

  const sort = (nodes: ExplorerFolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    nodes.forEach(node => sort(node.children))
  }
  sort(root)
  return root
}

export function postMatches(post: BlogPost, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('ko-KR')
  if (!needle) return true
  return [post.title, post.description, ...post.categories, ...post.tags]
    .join(' ')
    .toLocaleLowerCase('ko-KR')
    .includes(needle)
}
