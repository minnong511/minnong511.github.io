<script setup lang="ts">
const route = useRoute()
const workspace = useWorkspaceState()
let observer: MutationObserver | null = null
let queued = false
let sequence = 0
let renderQueue = Promise.resolve()
let mermaidPromise: Promise<typeof import('mermaid')['default']> | null = null

function getMermaid() {
  mermaidPromise ||= import('mermaid').then(module => module.default)
  return mermaidPromise
}

function sourceFromPre(pre: HTMLPreElement): string {
  return (pre.querySelector('code')?.textContent || pre.textContent || '').trim()
}

function findMermaidBlocks(): HTMLPreElement[] {
  const blocks = new Set<HTMLPreElement>()
  document.querySelectorAll<HTMLElement>('#postContent pre.language-mermaid, #postContent code.language-mermaid').forEach((node) => {
    const pre = node instanceof HTMLPreElement ? node : node.closest('pre')
    if (pre && !pre.dataset.mermaidPending) blocks.add(pre)
  })
  return [...blocks]
}

function createFigure(source: string): HTMLElement {
  const figure = document.createElement('figure')
  figure.className = 'ide-mermaid'
  const heading = document.createElement('figcaption')
  heading.innerHTML = '<span>MERMAID DIAGRAM</span><i class="ri-flow-chart" aria-hidden="true"></i>'
  const output = document.createElement('div')
  output.className = 'ide-mermaid-output'
  output.setAttribute('role', 'img')
  output.setAttribute('aria-label', 'Mermaid 다이어그램')
  const details = document.createElement('details')
  details.className = 'ide-mermaid-source'
  const summary = document.createElement('summary')
  summary.textContent = '원문 보기'
  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.textContent = source
  pre.appendChild(code)
  details.append(summary, pre)
  figure.append(heading, output, details)
  return figure
}

async function renderIntoFigure(figure: HTMLElement, source: string) {
  const output = figure.querySelector<HTMLElement>('.ide-mermaid-output')
  if (!output) return
  output.classList.add('is-loading')
  output.textContent = '다이어그램을 렌더링하고 있습니다.'
  try {
    const mermaid = await getMermaid()
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: workspace.theme.value === 'light' ? 'neutral' : 'dark',
      suppressErrorRendering: true,
      fontFamily: 'Pretendard, sans-serif',
    })
    const { svg, bindFunctions } = await mermaid.render(`minnong-mermaid-${Date.now()}-${sequence++}`, source)
    output.innerHTML = svg
    output.classList.remove('is-loading', 'is-error')
    bindFunctions?.(output)
  } catch (error) {
    console.warn('[mermaid] Diagram rendering failed; source kept as fallback.', error)
    output.classList.remove('is-loading')
    output.classList.add('is-error')
    output.textContent = '다이어그램을 렌더링하지 못했습니다. 아래 원문을 확인해 주세요.'
    figure.querySelector<HTMLDetailsElement>('.ide-mermaid-source')?.setAttribute('open', '')
  }
}

async function renderBlock(pre: HTMLPreElement) {
  const source = sourceFromPre(pre)
  if (!source) return
  pre.dataset.mermaidPending = 'true'
  const host = pre.parentElement?.classList.contains('ide-code-wrap') ? pre.parentElement : pre
  const figure = createFigure(source)
  host.replaceWith(figure)
  await renderIntoFigure(figure, source)
}

function scan() {
  queued = false
  findMermaidBlocks().forEach((pre) => {
    renderQueue = renderQueue.then(() => renderBlock(pre))
  })
}

function scheduleScan() {
  if (queued) return
  queued = true
  requestAnimationFrame(scan)
}

function rerenderFigures() {
  document.querySelectorAll<HTMLElement>('#postContent .ide-mermaid').forEach((figure) => {
    const source = figure.querySelector<HTMLElement>('.ide-mermaid-source code')?.textContent?.trim()
    if (source) renderQueue = renderQueue.then(() => renderIntoFigure(figure, source))
  })
}

watch(() => route.fullPath, async () => {
  await nextTick()
  scheduleScan()
})
watch(() => workspace.theme.value, rerenderFigures)

onMounted(() => {
  const main = document.getElementById('main-content')
  if (main) {
    observer = new MutationObserver(scheduleScan)
    observer.observe(main, { childList: true, subtree: true })
  }
  scheduleScan()
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template><span class="ide-mermaid-runtime" hidden /></template>
