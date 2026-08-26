#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const root = process.cwd()
const outputRoot = resolve(root, '.output/public')
const siteUrl = 'https://minnong511.github.io'
const defaultOgImage = `${siteUrl}/assets/base_image/og-study-blog.png`
const staticPageRoutes = ['/', '/about/', '/archive/', '/tags/', '/search/']
const manifest = JSON.parse(readFileSync(resolve(root, 'data/public-content-manifest.json'), 'utf8'))
const legacyData = JSON.parse(readFileSync(resolve(root, 'data/legacy-public-routes.json'), 'utf8'))
const entries = manifest.entries || manifest.posts || []
const publicEntries = entries.filter((entry) => entry.visibility !== 'draft' && entry.published !== false)
const legacyRoutes = (Array.isArray(legacyData) ? legacyData : legacyData.routes || legacyData.entries || [])
  .map((item) => typeof item === 'string' ? item : item.legacyPath || item.route || item.path || item.url)
  .filter(Boolean)
const errors = []
let searchEntries = []
let renderedCodeBlocks = 0
let renderedMermaidBlocks = 0
let renderedTables = 0
let renderedImages = 0

function routeOf(entry) {
  return entry.legacyPath || entry.route || entry.path || entry.url
}

function routeFile(route) {
  const pathname = decodeURI(new URL(route, siteUrl).pathname)
  if (pathname === '/') return resolve(outputRoot, 'index.html')
  if (pathname.endsWith('/')) return resolve(outputRoot, pathname.slice(1), 'index.html')
  return resolve(outputRoot, pathname.slice(1))
}

function tagsOf(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0])
}

function tagsWithAttributes(html, name, attributes) {
  return tagsOf(html, name).filter((tag) => Object.entries(attributes)
    .every(([attribute, value]) => tag.includes(`${attribute}="${value}"`)))
}

function absoluteUrl(value) {
  if (/^https?:\/\//i.test(value)) return value
  return `${siteUrl}${String(value).startsWith('/') ? '' : '/'}${value}`
}

function normalizeDateTime(value) {
  const source = String(value || '')
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(source)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : source
}

function verifySharedSeo(html, route, expectedImage = defaultOgImage) {
  const canonical = absoluteUrl(route)
  const canonicalTags = tagsWithAttributes(html, 'link', { rel: 'canonical', href: canonical })
  if (canonicalTags.length !== 1) errors.push(`canonical이 정확히 1개가 아닙니다: ${route} (${canonicalTags.length})`)
  if (!tagsWithAttributes(html, 'meta', { property: 'og:url', content: canonical }).length) errors.push(`og:url이 올바르지 않습니다: ${route}`)
  if (!tagsWithAttributes(html, 'meta', { property: 'og:image', content: expectedImage }).length) errors.push(`og:image가 올바르지 않습니다: ${route}`)
  if (!tagsWithAttributes(html, 'meta', { name: 'twitter:card', content: 'summary_large_image' }).length) errors.push(`twitter:card가 없습니다: ${route}`)
  if (!tagsWithAttributes(html, 'meta', { name: 'twitter:image', content: expectedImage }).length) errors.push(`twitter:image가 올바르지 않습니다: ${route}`)
}

function articleJsonLd(html) {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!match[1].includes('application/ld+json')) continue
    try {
      const value = JSON.parse(match[2])
      if (value?.['@type'] === 'BlogPosting') return value
    } catch {
      // Invalid JSON-LD is reported as a missing BlogPosting below.
    }
  }
  return null
}

function textFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name)
    if (entry.isDirectory()) return textFiles(target)
    return /\.(?:html|json|xml|txt|js|mjs)$/i.test(entry.name) ? [target] : []
  })
}

function markdownFiles(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(target) : /\.md$/i.test(entry.name) ? [target] : []
  })
}

function routeForHtml(file) {
  const target = relative(outputRoot, file).split('\\').join('/')
  if (target === 'index.html') return '/'
  if (target.endsWith('/index.html')) return `/${target.slice(0, -'index.html'.length)}`
  return `/${target}`
}

function staticTargetExists(pathname) {
  let decoded
  try {
    decoded = decodeURI(pathname)
  } catch {
    return false
  }
  const target = resolve(outputRoot, decoded.replace(/^\/+/, ''))
  if (existsSync(target)) return true
  if (decoded.endsWith('/')) return existsSync(resolve(target, 'index.html'))
  return existsSync(resolve(target, 'index.html')) || existsSync(`${target}.html`)
}

const draftEntries = markdownFiles(resolve(root, 'drafts')).map((file) => {
  const source = readFileSync(file, 'utf8')
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) {
    errors.push(`비공개 문서의 front matter가 없습니다: ${relative(root, file)}`)
    return { target: relative(root, file).split('\\').join('/') }
  }
  const data = parseYaml(match[1]) || {}
  return {
    source: relative(root, file).split('\\').join('/'),
    target: relative(root, file).split('\\').join('/'),
    title: String(data.title || ''),
    legacyPath: String(data.legacyPath || ''),
    route: String(data.legacyPath || ''),
    published: false,
  }
})

if (!existsSync(outputRoot)) errors.push('.output/public이 없습니다.')

for (const relative of ['index.html', 'about/index.html', 'archive/index.html', 'tags/index.html', 'search/index.html', 'feed.xml', 'search.json', 'sitemap.xml', 'robots.txt', '404.html']) {
  if (!existsSync(resolve(outputRoot, relative))) errors.push(`정적 결과물이 없습니다: /${relative}`)
}
if (!existsSync(resolve(outputRoot, 'assets/base_image/og-study-blog.png'))) errors.push('기본 OG 이미지가 정적 결과물에 없습니다.')

if (existsSync(resolve(outputRoot, 'write/index.html'))) errors.push('/write/ 결과물이 남아 있습니다.')

for (const route of staticPageRoutes) {
  const file = routeFile(route)
  if (!existsSync(file)) continue
  verifySharedSeo(readFileSync(file, 'utf8'), route)
}

for (const entry of publicEntries) {
  const route = routeOf(entry)
  const file = routeFile(route)
  if (!existsSync(file)) {
    errors.push(`게시글 정적 HTML이 없습니다: ${route}`)
    continue
  }
  const html = readFileSync(file, 'utf8')
  renderedCodeBlocks += (html.match(/<pre\b/gi) || []).length
  renderedMermaidBlocks += (html.match(/<pre\b[^>]*\bclass="[^"]*\blanguage-mermaid\b[^>]*>/gi) || []).length
  renderedTables += (html.match(/<table\b/gi) || []).length
  renderedImages += (html.match(/<img\b/gi) || []).length
  const canonical = absoluteUrl(route)
  const expectedImage = absoluteUrl(entry.image || '/assets/base_image/og-study-blog.png')
  const expectedPublished = normalizeDateTime(entry.date)
  const expectedModified = normalizeDateTime(entry.last_modified_at || entry.lastModifiedAt || entry.date)
  const expectedSection = (Array.isArray(entry.categories) ? entry.categories[0] : entry.categories) || 'workspace'
  const expectedTags = Array.isArray(entry.tags) ? entry.tags : []
  verifySharedSeo(html, route, expectedImage)
  if (!tagsWithAttributes(html, 'meta', { property: 'og:type', content: 'article' }).length) errors.push(`게시글 og:type이 article이 아닙니다: ${route}`)
  if (!tagsWithAttributes(html, 'meta', { property: 'article:published_time', content: expectedPublished }).length) errors.push(`게시 시간이 메타데이터에 없습니다: ${route}`)
  if (!tagsWithAttributes(html, 'meta', { property: 'article:modified_time', content: expectedModified }).length) errors.push(`수정 시간이 메타데이터에 없습니다: ${route}`)
  if (!tagsWithAttributes(html, 'meta', { property: 'article:section', content: expectedSection }).length) errors.push(`게시글 섹션 메타데이터가 없습니다: ${route}`)
  for (const tag of expectedTags) {
    if (!tagsWithAttributes(html, 'meta', { property: 'article:tag', content: tag }).length) errors.push(`게시글 태그 메타데이터가 없습니다: ${route} (${tag})`)
  }

  const jsonLd = articleJsonLd(html)
  if (!jsonLd) {
    errors.push(`Article JSON-LD가 없습니다: ${route}`)
    continue
  }
  if (jsonLd.mainEntityOfPage?.['@id'] !== canonical) errors.push(`JSON-LD mainEntityOfPage가 올바르지 않습니다: ${route}`)
  if (!Array.isArray(jsonLd.image) || !jsonLd.image.includes(expectedImage)) errors.push(`JSON-LD 이미지가 올바르지 않습니다: ${route}`)
  if (jsonLd.datePublished !== expectedPublished) errors.push(`JSON-LD 게시 시간이 올바르지 않습니다: ${route}`)
  if (jsonLd.dateModified !== expectedModified) errors.push(`JSON-LD 수정 시간이 올바르지 않습니다: ${route}`)
  if (jsonLd.articleSection !== expectedSection) errors.push(`JSON-LD 섹션이 올바르지 않습니다: ${route}`)
  if (JSON.stringify(jsonLd.keywords || []) !== JSON.stringify(expectedTags)) errors.push(`JSON-LD 키워드가 올바르지 않습니다: ${route}`)
}

if (renderedCodeBlocks < 1188) errors.push(`정적 HTML 코드 블록이 기존 기준보다 적습니다: ${renderedCodeBlocks}/1188`)
if (renderedMermaidBlocks < 45) errors.push(`정적 HTML Mermaid 블록이 기존 기준보다 적습니다: ${renderedMermaidBlocks}/45`)
if (renderedTables < 1) errors.push('정적 HTML에 렌더링된 표가 없습니다.')
if (renderedImages < 1) errors.push('정적 HTML에 렌더링된 이미지가 없습니다.')

const regressionFixtures = [
  {
    targetSuffix: 'Frontend/Vue/2026-08-02-vue-composition-api.md',
    expected: '{{ count }}',
    label: 'Vue 중괄호 예제',
  },
  {
    targetSuffix: 'CI-CD-Docker/Docker/2026-08-17-docker-06-image-build-and-layers.md',
    expected: '{{json .RootFS.Layers}}',
    label: 'Docker Go 템플릿 예제',
  },
]
for (const fixture of regressionFixtures) {
  const entry = publicEntries.find(item => String(item.target || '').endsWith(fixture.targetSuffix))
  if (!entry) {
    errors.push(`${fixture.label} 검증 문서를 찾을 수 없습니다.`)
    continue
  }
  const html = readFileSync(routeFile(routeOf(entry)), 'utf8')
  if (!html.includes(fixture.expected)) errors.push(`${fixture.label}가 정적 HTML에서 원문대로 보존되지 않았습니다.`)
}

for (const route of legacyRoutes) {
  if (!existsSync(routeFile(route))) errors.push(`기존 URL 정적 HTML이 없습니다: ${route}`)
}

const searchPath = resolve(outputRoot, 'search.json')
if (existsSync(searchPath)) {
  searchEntries = JSON.parse(readFileSync(searchPath, 'utf8'))
  if (!Array.isArray(searchEntries) || searchEntries.length !== publicEntries.length) {
    errors.push(`search.json 문서 수가 공개 글 수와 다릅니다: ${searchEntries.length}/${publicEntries.length}`)
  }
}

const outputText = textFiles(outputRoot).map((file) => readFileSync(file, 'utf8')).join('\n')
for (const entry of draftEntries) {
  const route = routeOf(entry)
  if (route && existsSync(routeFile(route))) errors.push(`비공개 URL 결과물이 생성됐습니다: ${route}`)
  if (route && outputText.includes(route)) errors.push(`비공개 URL이 정적 데이터에 포함됐습니다: ${route}`)

  const indexedDraft = searchEntries.some((item) => {
    const indexedRoute = item.legacyPath || item.route || item.path || item.url
    return indexedRoute === route
  })
  if (indexedDraft) errors.push(`비공개 글이 검색 인덱스에 포함됐습니다: ${route}`)

  for (const privatePath of [entry.source, entry.target].filter(Boolean)) {
    if (outputText.includes(privatePath)) errors.push(`비공개 원본 경로가 정적 데이터에 포함됐습니다: ${privatePath}`)
  }

  // MLOps처럼 공개 글에서도 쓰이는 짧은 제목은 단순 문자열 검색으로는
  // 유출 여부를 판별할 수 없다. 경로와 검색 문서 단위로 확인하고,
  // 충분히 고유한 긴 제목만 추가로 검사한다.
  if (entry.title?.length >= 16 && outputText.includes(entry.title)) {
    errors.push(`비공개 글 제목이 정적 결과물에 포함됐습니다: ${entry.title}`)
  }

  if (entry.target && existsSync(resolve(root, entry.target))) {
    const draftBody = readFileSync(resolve(root, entry.target), 'utf8')
      .replace(/^---[\s\S]*?---\s*/, '')
    const fingerprints = draftBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length >= 16 && !line.startsWith('#'))
      .slice(0, 3)
    for (const fingerprint of fingerprints) {
      if (outputText.includes(fingerprint)) errors.push(`비공개 본문이 정적 결과물에 포함됐습니다: ${entry.title}`)
    }
  }
}
if (/{%\s*(capture|include|raw|endraw)\b/.test(outputText)) errors.push('정적 결과물에 Jekyll Liquid 문법이 남아 있습니다.')

const brokenLinks = new Set()
for (const file of textFiles(outputRoot).filter((target) => target.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8')
  const pageUrl = new URL(routeForHtml(file), siteUrl)
  for (const match of html.matchAll(/\b(?:href|src)=(?:"([^"]+)"|'([^']+)')/gi)) {
    const reference = match[1] || match[2]
    if (!reference || reference.startsWith('#') || /^(?:data:|mailto:|tel:|javascript:)/i.test(reference)) continue
    let targetUrl
    try {
      targetUrl = new URL(reference, pageUrl)
    } catch {
      brokenLinks.add(`${routeForHtml(file)} -> ${reference}`)
      continue
    }
    if (targetUrl.origin !== pageUrl.origin) continue
    if (!staticTargetExists(targetUrl.pathname)) brokenLinks.add(`${routeForHtml(file)} -> ${targetUrl.pathname}`)
  }
}
for (const brokenLink of brokenLinks) errors.push(`내부 정적 링크 대상이 없습니다: ${brokenLink}`)

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`)
  console.error(`정적 결과 검증 실패: ${errors.length}개 오류`)
  process.exitCode = 1
} else {
  console.log(`정적 결과 검증 완료: 공개 ${publicEntries.length}개, 기존 URL ${legacyRoutes.length}개, 비공개 ${draftEntries.length}개 제외`)
}
