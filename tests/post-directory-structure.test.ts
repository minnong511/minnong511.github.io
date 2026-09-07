import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { normalizeBlogPost } from '../app/utils/content'
import { topicForPost } from '../app/utils/topics'

const root = path.resolve('content/posts')
const topics: Record<string, string> = {
  Backend: 'backend', Frontend: 'frontend', AI: 'ai', AX: 'ax',
  DevOps: 'devops', CS: 'cs', Algorithm: 'algorithm', Projects: 'projects', Notes: 'notes',
}

function walk(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  expect(entries.length, `Empty post directory: ${directory}`).toBeGreaterThan(0)
  return entries.flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(file) : file.endsWith('.md') ? [file] : []
  })
}

describe('post directory taxonomy', () => {
  it('mirrors category hierarchy in physical folders and assigns each post to its top-level topic', () => {
    const files = walk(root)
    expect(files.length).toBeGreaterThan(0)
    const routes = new Set<string>()
    for (const file of files) {
      const categories = path.relative(root, path.dirname(file)).split(path.sep)
      const source = fs.readFileSync(file, 'utf8')
      const header = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      expect(header, file).not.toBeNull()
      const metadata = parse(header![1]!)
      expect(topics[categories[0]!], file).toBeDefined()
      expect(metadata.categories, file).toEqual(categories)
      expect(topicForPost(normalizeBlogPost(metadata)).key, file).toBe(topics[categories[0]!])
      expect(routes.has(metadata.legacyPath), file).toBe(false)
      routes.add(metadata.legacyPath)
    }
  })
})
