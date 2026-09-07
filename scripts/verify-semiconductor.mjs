#!/usr/bin/env node
// Run after `npm run generate`. Counts gzip estimates, not localhost's uncompressed HTTP.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = process.cwd()
const manifestFile = ['node_modules/.cache/nuxt/.nuxt/dist/server/client.manifest.mjs', '.nuxt/dist/server/client.manifest.mjs']
  .map(file => resolve(root, file)).find(existsSync)
if (!manifestFile) throw new Error('Run npm run generate before the semiconductor checks.')
const { default: manifest } = await import(pathToFileURL(manifestFile).href)
const output = resolve(root, process.argv[2] || '.output/public')
const component = Object.keys(manifest).find(key => key.endsWith('content/SemiconductorExplorer.vue'))
const renderer = Object.keys(manifest).find(key => key.endsWith('semiconductor/renderer.ts'))
if (!component || !renderer) throw new Error('Learning component or 3D renderer is missing from the build.')

function closure(key, found = new Set()) {
  if (found.has(key)) return found
  found.add(key)
  for (const dependency of manifest[key]?.imports || []) closure(dependency, found)
  return found
}
function filesFor(keys) {
  return new Set([...keys].flatMap(key => [manifest[key]?.file, ...(manifest[key]?.css || [])]).filter(Boolean))
}
const common = filesFor(closure('pages/[...slug].vue'))
const initial = filesFor(closure(component))
for (const file of common) initial.delete(file)
for (const entry of Object.values(manifest)) if (entry.file?.startsWith('SemiconductorExplorer.') && entry.file.endsWith('.css')) initial.add(entry.file)
const activated = filesFor(closure(renderer))
for (const file of common) activated.delete(file)
for (const file of initial) activated.delete(file)
const bytes = file => gzipSync(readFileSync(resolve(output, '_nuxt', file))).byteLength
const initialCodeGzip = [...initial].reduce((sum, file) => sum + bytes(file), 0)
const activatedCodeGzip = [...activated].reduce((sum, file) => sum + bytes(file), 0)
const totalFeatureCodeGzip = initialCodeGzip + activatedCodeGzip
const pages = []
const expectedScenes = [['industry-chain'], ['mosfet', 'dram-cell'], ['wafer-process', 'packaging'], ['nand-3d', 'hbm']]
for (const part of [1, 2, 3, 4]) {
  const route = `ax/semiconductor/part-${part}/`
  const html = readFileSync(resolve(output, route, 'index.html'), 'utf8')
  const payloadPath = resolve(output, route, '_payload.json')
  const payload = existsSync(payloadPath) ? readFileSync(payloadPath, 'utf8') : ''
  for (const scene of expectedScenes[part - 1]) {
    if (!html.includes(`data-scene="${scene}"`)) throw new Error(`Missing learning scene in part ${part}: ${scene}`)
  }
  if (/skala|walker80|박준영|조별 토론/i.test(html + payload)) throw new Error(`Excluded material found in part ${part}.`)
  const hints = html.match(/<link\b[^>]+>/g) || []
  for (const file of activated) {
    if (hints.some(tag => /rel="(?:prefetch|preload|modulepreload)"/.test(tag) && tag.includes(file))) throw new Error(`3D prefetch leaked into part ${part}: ${file}`)
  }
  const documentsGzip = gzipSync(html).byteLength + gzipSync(payload).byteLength
  const initialUpperBound = initialCodeGzip + documentsGzip
  if (initialUpperBound > 100_000) throw new Error(`Initial feature budget exceeded in part ${part}: ${initialUpperBound}`)
  pages.push({ part, htmlAndPayloadGzip: documentsGzip, initialUpperBound })
}
if (totalFeatureCodeGzip > 600_000) throw new Error(`3D budget exceeded: ${totalFeatureCodeGzip}`)
const report = {
  initialCodeGzip,
  activatedCodeGzip,
  totalFeatureCodeGzip,
  initialFiles: [...initial],
  activatedFiles: [...activated],
  pages,
  method: 'gzip estimates; excludes existing shared app chunks; includes whole HTML and payload as a conservative initial-page bound; validates no 3D resource hints',
}
writeFileSync(resolve(root, 'reports/semiconductor-bundle.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
