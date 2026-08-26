export interface ContentManifestEntry {
  source?: string
  target?: string
  visibility?: 'public' | 'draft'
  inferredFields?: string[]
  legacyPath?: string
  route?: string
  title?: string
  date?: string
  categories?: string[] | string
  tags?: string[] | string
  description?: string
  warnings?: string[]
  [key: string]: unknown
}

export interface ContentManifest {
  schemaVersion?: number
  generatedAt?: string
  totals?: Record<string, number>
  entries?: ContentManifestEntry[]
  posts?: ContentManifestEntry[]
}

export interface BlogPost {
  id: string
  source: string
  path: string
  title: string
  description: string
  date: string
  lastModifiedAt: string
  categories: string[]
  tags: string[]
  summary: string
  keyConcepts: string[]
  strengths: string[]
  tradeoffs: string[]
  series: string
  part?: number
  image: string
  robots: string
}

export interface ExplorerFolderNode {
  key: string
  name: string
  posts: BlogPost[]
  children: ExplorerFolderNode[]
}

export interface WorkspaceTab {
  url: string
  title: string
}

export interface WorkspaceBookmark {
  url: string
  title: string
}

export type FontSizePreference = 'small' | 'medium' | 'large'
export type ThemePreference = 'dark' | 'light'
export type SidebarView = 'explorer' | 'search' | 'source' | 'run' | 'about'
