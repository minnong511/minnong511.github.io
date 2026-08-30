#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const root = process.cwd()
const manifestPath = resolve(root, 'data/content-manifest.json')
const publicManifestPath = resolve(root, 'data/public-content-manifest.json')
const legacyRoutesPath = resolve(root, 'data/legacy-public-routes.json')
const errors = []
const warnings = []

function markdownFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(target) : /\.md$/i.test(entry.name) ? [target] : []
  })
}

function readPost(file) {
  const source = readFileSync(file, 'utf8')
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) {
    errors.push(`${file}: YAML front matter가 없습니다.`)
    return { data: {}, body: source }
  }

  try {
    return { data: parseYaml(match[1]) || {}, body: source.slice(match[0].length) }
  } catch (error) {
    errors.push(`${file}: YAML 파싱 실패 (${error.message})`)
    return { data: {}, body: source.slice(match[0].length) }
  }
}

function routeOf(entry) {
  return entry.legacyPath || entry.route || entry.path || entry.url
}

function targetOf(entry) {
  return entry.target || entry.targetPath
}

function balancedFences(body, file) {
  const stack = []
  for (const [index, line] of body.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*(`{3,}|~{3,})/)
    if (!match) continue
    const marker = match[1][0]
    if (stack.at(-1)?.marker === marker) stack.pop()
    else stack.push({ marker, line: index + 1 })
  }
  if (stack.length) errors.push(`${file}: 닫히지 않은 코드 fence가 있습니다.`)
}

if (!existsSync(manifestPath)) errors.push('data/content-manifest.json이 없습니다. `npm run content:migrate`를 먼저 실행하세요.')
if (!existsSync(publicManifestPath)) errors.push('data/public-content-manifest.json이 없습니다. `npm run content:index`를 먼저 실행하세요.')

const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { entries: [] }
const entries = manifest.entries || manifest.posts || []
const publicEntries = entries.filter((entry) => entry.visibility === 'public' || entry.published === true)
const draftEntries = entries.filter((entry) => entry.visibility === 'draft' || entry.published === false)
const publicFiles = markdownFiles(resolve(root, 'content/posts'))
const draftFiles = markdownFiles(resolve(root, 'drafts'))
let runtimePublicEntries = []

if (existsSync(publicManifestPath)) {
  const publicManifest = JSON.parse(readFileSync(publicManifestPath, 'utf8'))
  runtimePublicEntries = publicManifest.entries || publicManifest.posts || []
  if (runtimePublicEntries.length !== publicFiles.length) {
    errors.push(`클라이언트 공개 manifest 문서 수(${runtimePublicEntries.length})와 content/posts 파일 수(${publicFiles.length})가 다릅니다.`)
  }
  if (runtimePublicEntries.some((entry) => entry.visibility === 'draft' || entry.published === false)) {
    errors.push('클라이언트 공개 manifest에 비공개 문서가 포함됐습니다.')
  }
}

if (entries.length !== 137) errors.push(`마이그레이션 기준 manifest 문서 수가 137개가 아닙니다: ${entries.length}`)
if (publicEntries.length !== 134) errors.push(`마이그레이션 기준 공개 문서 수가 134개가 아닙니다: ${publicEntries.length}`)
if (draftEntries.length !== 3) errors.push(`마이그레이션 기준 비공개 문서 수가 3개가 아닙니다: ${draftEntries.length}`)

const seenRoutes = new Map()
let mermaidBlocks = 0
let fenceBlocks = 0
const publicMetadata = new Map()

for (const file of [...publicFiles, ...draftFiles]) {
  const { data, body } = readPost(file)
  const isDraft = file.startsWith(resolve(root, 'drafts'))
  const target = relative(root, file).split('\\').join('/')
  if (!isDraft) publicMetadata.set(target, data)
  for (const field of ['title', 'description', 'date', 'categories', 'tags', 'legacyPath']) {
    if (data[field] === undefined || data[field] === null || data[field] === '') errors.push(`${file}: ${field} 필드가 없습니다.`)
  }
  if (!Array.isArray(data.categories) || data.categories.length === 0) errors.push(`${file}: categories는 비어 있지 않은 배열이어야 합니다.`)
  if (!Array.isArray(data.tags)) errors.push(`${file}: tags는 배열이어야 합니다.`)
  if (!/^\/.*\/$/.test(data.legacyPath || '')) errors.push(`${file}: legacyPath는 /로 시작하고 끝나야 합니다.`)
  if (Number.isNaN(Date.parse(data.date))) errors.push(`${file}: date를 해석할 수 없습니다 (${data.date}).`)
  if (isDraft && data.published !== false) errors.push(`${file}: drafts 문서는 published: false여야 합니다.`)
  if (!isDraft && data.published === false) errors.push(`${file}: published: false 문서는 content/posts에 둘 수 없습니다.`)

  if (seenRoutes.has(data.legacyPath)) errors.push(`${file}: legacyPath가 ${seenRoutes.get(data.legacyPath)}와 중복됩니다 (${data.legacyPath}).`)
  else seenRoutes.set(data.legacyPath, file)

  if (/{%\s*(capture|include|raw|endraw)\b/.test(body)) errors.push(`${file}: 제거되지 않은 Jekyll Liquid 문법이 있습니다.`)
  if (/\]\(image\.png\)/.test(body)) errors.push(`${file}: 깨진 상대 이미지 image.png가 남아 있습니다.`)
  balancedFences(body, file)
  mermaidBlocks += (body.match(/^\s*(?:```|~~~)mermaid\b/gm) || []).length
  fenceBlocks += Math.floor((body.match(/^\s*(?:```|~~~)/gm) || []).length / 2)
}

for (const entry of runtimePublicEntries) {
  const target = targetOf(entry)
  const data = publicMetadata.get(target)
  if (!data) {
    errors.push(`클라이언트 공개 manifest 대상 파일이 없습니다: ${target || 'unknown'}`)
    continue
  }
  if (routeOf(entry) !== data.legacyPath) errors.push(`클라이언트 공개 manifest URL이 front matter와 다릅니다: ${target}`)
  if (String(entry.title || '') !== String(data.title || '')) errors.push(`클라이언트 공개 manifest 제목이 front matter와 다릅니다: ${target}`)
}
for (const target of publicMetadata.keys()) {
  if (!runtimePublicEntries.some((entry) => targetOf(entry) === target)) errors.push(`클라이언트 공개 manifest에 파일이 없습니다: ${target}`)
}

for (const entry of entries) {
  const target = targetOf(entry)
  if (target && !existsSync(resolve(root, target))) errors.push(`manifest 대상 파일이 없습니다: ${target}`)
  const route = routeOf(entry)
  if (!route) errors.push(`manifest entry에 route가 없습니다: ${entry.source || entry.sourcePath || 'unknown'}`)
}

if (mermaidBlocks < 45) errors.push(`Mermaid 블록이 45개보다 적습니다: ${mermaidBlocks}`)
if (fenceBlocks < 1188) warnings.push(`코드 블록 집계가 기존 기준 1,188개보다 적습니다: ${fenceBlocks}`)

if (existsSync(legacyRoutesPath)) {
  const legacyData = JSON.parse(readFileSync(legacyRoutesPath, 'utf8'))
  const legacyRoutes = Array.isArray(legacyData) ? legacyData : legacyData.routes || legacyData.entries || []
  const normalized = legacyRoutes.map((item) => typeof item === 'string' ? item : routeOf(item)).filter(Boolean)
  if (normalized.length !== 82) errors.push(`기존 공개 URL 기준 목록이 82개가 아닙니다: ${normalized.length}`)
  for (const route of normalized) {
    if (!runtimePublicEntries.some((entry) => routeOf(entry) === route)) errors.push(`기존 공개 URL이 새 공개 manifest에 없습니다: ${route}`)
  }
} else {
  errors.push('data/legacy-public-routes.json이 없습니다.')
}

for (const warning of warnings) console.warn(`WARN: ${warning}`)
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`)
  console.error(`콘텐츠 검증 실패: ${errors.length}개 오류, ${warnings.length}개 경고`)
  process.exitCode = 1
} else {
  console.log(`콘텐츠 검증 완료: 전체 ${publicFiles.length + draftFiles.length}, 공개 ${publicFiles.length}, 비공개 ${draftFiles.length}, Mermaid ${mermaidBlocks}, 코드 블록 ${fenceBlocks}`)
}
