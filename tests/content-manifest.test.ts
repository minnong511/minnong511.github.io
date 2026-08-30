import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

interface ManifestEntry {
  source: string
  target: string
  visibility: 'public' | 'draft'
  route: string
  inferredFields: string[]
  warnings: string[]
}

const root = process.cwd()
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'data/content-manifest.json'), 'utf8'),
) as {
  schemaVersion: number
  totals?: Record<string, number>
  entries?: ManifestEntry[]
  posts?: ManifestEntry[]
}
const entries = manifest.entries ?? manifest.posts ?? []
const legacyRoutes = JSON.parse(
  fs.readFileSync(path.join(root, 'data/legacy-public-routes.json'), 'utf8'),
) as Array<{ source: string, path: string, canonical: string }>
const publicIndex = JSON.parse(
  fs.readFileSync(path.join(root, 'data/public-content-manifest.json'), 'utf8'),
) as { schemaVersion: number, entries: ManifestEntry[] }
const migrationReport = JSON.parse(
  fs.readFileSync(path.join(root, 'reports/content-migration.json'), 'utf8'),
) as {
  documents: Array<{
    source: string
    metadata: { title: string, published: boolean }
    publicUrl: string | null
    warnings: string[]
  }>
}

function markdownFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(file) : /\.md$/i.test(entry.name) ? [file] : []
  })
}

describe('content migration manifest', () => {
  it('contains exactly 134 public posts and 3 private drafts', () => {
    const publicPosts = entries.filter(entry => entry.visibility === 'public')
    const drafts = entries.filter(entry => entry.visibility === 'draft')

    expect(manifest.schemaVersion).toBe(1)
    expect(entries).toHaveLength(137)
    expect(publicPosts).toHaveLength(134)
    expect(drafts).toHaveLength(3)
    expect(publicPosts.every(entry => entry.target.startsWith('content/posts/'))).toBe(true)
    expect(drafts.every(entry => entry.target.startsWith('drafts/'))).toBe(true)
  })

  it('assigns every source and route exactly once', () => {
    const sources = entries.map(entry => entry.source)
    const routes = entries.map(entry => entry.route)

    expect(new Set(sources).size).toBe(entries.length)
    expect(new Set(routes).size).toBe(entries.length)
  })

  it('emits normalized routes without changing legacy case or underscores', () => {
    for (const entry of entries) {
      expect(entry.route, entry.source).toMatch(/^\/.+\/$/u)
      expect(entry.route, entry.source).not.toContain('//')
      expect(entry.route, entry.source).not.toContain(' ')
      expect(entry.route, entry.source).not.toMatch(/\/index\.html?\/?$/i)
    }

    expect(entries.find(entry => entry.source.endsWith('/알고리즘 논리.md'))?.route)
      .toBe('/algorithm/greedy/2026/08/12/알고리즘-논리/')
    expect(entries.find(entry => entry.source.endsWith('/2026-08-07-Devops_1.md'))?.route)
      .toBe('/devops/2026/08/07/Devops_1/')
  })

  it('preserves all 82 previously public Jekyll routes exactly', () => {
    expect(legacyRoutes).toHaveLength(82)
    const bySource = new Map(entries.map(entry => [entry.source, entry]))

    for (const legacy of legacyRoutes) {
      const migrated = bySource.get(legacy.source)
      expect(migrated, legacy.source).toBeDefined()
      expect(migrated?.visibility, legacy.source).toBe('public')
      expect(migrated?.route, legacy.source).toBe(legacy.path)
      expect(legacy.canonical, legacy.source).toBe(`https://minnong511.github.io${legacy.path}`)
    }
  })

  it('keeps draft files outside the Nuxt Content public collection', () => {
    const drafts = entries.filter(entry => entry.visibility === 'draft')

    for (const draft of drafts) {
      expect(fs.existsSync(path.join(root, draft.target)), draft.target).toBe(true)
      expect(fs.existsSync(path.join(root, 'content/posts', path.relative('drafts', draft.target))), draft.source).toBe(false)
    }
  })

  it('keeps the runtime public index synchronized with current Markdown files', () => {
    const files = markdownFiles(path.join(root, 'content/posts'))
      .map(file => path.relative(root, file).split(path.sep).join('/'))
      .sort()
    const targets = publicIndex.entries.map(entry => entry.target).sort()

    expect(publicIndex.schemaVersion).toBe(2)
    expect(targets).toEqual(files)
    expect(publicIndex.entries.every(entry => entry.visibility === 'public')).toBe(true)
  })

  it('provides a document-by-document migration review report', () => {
    expect(migrationReport.documents).toHaveLength(entries.length)

    for (const entry of entries) {
      const review = migrationReport.documents.find(document => document.source === entry.source)
      expect(review, entry.source).toBeDefined()
      expect(review?.metadata.title, entry.source).toBeTruthy()
      expect(Array.isArray(review?.warnings), entry.source).toBe(true)
      expect(review?.publicUrl, entry.source).toBe(
        entry.visibility === 'public' ? `https://minnong511.github.io${entry.route}` : null,
      )
    }
  })
})
