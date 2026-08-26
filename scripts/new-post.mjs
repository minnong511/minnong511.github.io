#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) continue
    const key = argument.slice(2)
    if (key === 'draft') {
      values.draft = true
      continue
    }
    values[key] = argv[index + 1]
    index += 1
  }
  return values
}

function koreaDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function slugify(value) {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'post'
}

function categorySegments(value) {
  return value
    .split(/[/,]/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

const options = parseArgs(process.argv.slice(2))

if (!options.title || !options.category) {
  console.error('사용법: npm run post:new -- --title "글 제목" --category "DevOps/Docker" [--date YYYY-MM-DD] [--description "설명"] [--tags "Docker,OCI"] [--slug slug] [--draft]')
  process.exitCode = 1
} else {
  const date = options.date || koreaDate()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`날짜 형식이 올바르지 않습니다: ${date}`)
  }

  const categories = categorySegments(options.category)
  if (!categories.length) throw new Error('카테고리를 한 개 이상 입력해야 합니다.')
  const tags = (options.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  const slug = options.slug ? slugify(options.slug) : slugify(options.title)
  const categoryPath = categories.map(slugify).join('/')
  const legacyPath = `/${categoryPath}/${date.replaceAll('-', '/')}/${slug}/`
  const root = options.draft ? 'drafts' : 'content/posts'
  const directory = resolve(process.cwd(), root, ...categories)
  const target = resolve(directory, `${date}-${slug}.md`)

  if (existsSync(target)) {
    throw new Error(`이미 존재하는 파일입니다: ${target}`)
  }

  const frontMatter = [
    '---',
    `title: ${JSON.stringify(options.title)}`,
    `description: ${JSON.stringify(options.description || `${options.title}에 대해 정리한 글입니다.`)}`,
    `date: ${JSON.stringify(`${date}T00:00:00+09:00`)}`,
    `categories: ${JSON.stringify(categories)}`,
    `tags: ${JSON.stringify(tags)}`,
    `legacyPath: ${JSON.stringify(legacyPath)}`,
    `published: ${options.draft ? 'false' : 'true'}`,
    '---',
    '',
    `# ${options.title}`,
    '',
    '여기에 내용을 작성합니다.',
    ''
  ].join('\n')

  await mkdir(directory, { recursive: true })
  await writeFile(target, frontMatter, 'utf8')
  console.log(`${options.draft ? '초안' : '게시글'}을 만들었습니다: ${target}`)
  console.log(`예정 URL: ${legacyPath}`)
}
