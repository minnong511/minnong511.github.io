#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const root = process.cwd()
const postsRoot = resolve(root, 'content/posts')
const baselinePath = resolve(root, 'data/content-manifest.json')
const outputPath = resolve(root, 'data/public-content-manifest.json')

function markdownFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(target) : /\.md$/i.test(entry.name) ? [target] : []
  })
}

function posixPath(value) {
  return value.split('\\').join('/')
}

function frontMatter(file) {
  const source = readFileSync(file, 'utf8')
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new Error(`${posixPath(relative(root, file))}: YAML front matter가 없습니다.`)
  return parseYaml(match[1]) || {}
}

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : { entries: [] }
const baselineByTarget = new Map((baseline.entries || baseline.posts || [])
  .filter((entry) => entry.visibility === 'public')
  .map((entry) => [entry.target, entry]))

const optionalFields = [
  'last_modified_at',
  'series',
  'part',
  'summary',
  'key_concepts',
  'strengths',
  'tradeoffs',
  'image',
  'robots',
]

const entries = markdownFiles(postsRoot).map((file) => {
  const target = posixPath(relative(root, file))
  const data = frontMatter(file)
  const baselineEntry = baselineByTarget.get(target)
  const date = data.date instanceof Date ? data.date.toISOString() : String(data.date || '')
  const entry = {
    source: baselineEntry?.source || target,
    target,
    visibility: 'public',
    published: data.published !== false,
    title: String(data.title || ''),
    description: String(data.description || ''),
    date,
    categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    legacyPath: String(data.legacyPath || ''),
    route: String(data.legacyPath || ''),
  }

  for (const field of optionalFields) {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') entry[field] = data[field]
  }
  if (baselineEntry?.inferredFields?.length) entry.inferredFields = baselineEntry.inferredFields
  if (baselineEntry?.warnings?.length) entry.warnings = baselineEntry.warnings
  return entry
}).sort((a, b) => a.target.localeCompare(b.target, 'ko'))

writeFileSync(outputPath, `${JSON.stringify({
  schemaVersion: 2,
  totals: { publicPosts: entries.length },
  entries,
}, null, 2)}\n`, 'utf8')

console.log(`공개 콘텐츠 인덱스 생성 완료: ${entries.length}개`)
