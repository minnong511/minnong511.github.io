#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const manifestPath = resolve(root, 'data/content-manifest.json')
const reportPath = resolve(root, 'reports/content-migration.json')
const siteUrl = 'https://minnong511.github.io'
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const entries = manifest.entries || manifest.posts || []

report.documents = entries.map((entry) => ({
  source: entry.source,
  target: entry.target,
  visibility: entry.visibility,
  metadata: {
    title: entry.title,
    description: entry.description,
    date: entry.date,
    categories: entry.categories,
    tags: entry.tags,
    published: entry.published,
  },
  legacyPath: entry.legacyPath || entry.route,
  publicUrl: entry.visibility === 'public'
    ? `${siteUrl}${entry.legacyPath || entry.route}`
    : null,
  inferredFields: entry.inferredFields || [],
  warnings: entry.warnings || [],
  transformations: entry.transformations || {},
}))

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`문서별 마이그레이션 검토 보고서 생성 완료: ${report.documents.length}개`)
