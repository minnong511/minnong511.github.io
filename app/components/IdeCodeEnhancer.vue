<script setup lang="ts">
const route = useRoute()
const documentContext = useDocumentContext()
let observer: MutationObserver | null = null
let scheduled = false

function slugify(text: string, fallback: string): string {
  return text
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-') || fallback
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.readOnly = true
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('copy failed')
}

function updateScrollHint(wrapper: HTMLElement, pre: HTMLPreElement) {
  wrapper.dataset.scrollHint = String(pre.scrollWidth > pre.clientWidth + 2)
}

function enhanceCodeBlocks(content: HTMLElement) {
  content.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
    if (pre.parentElement?.classList.contains('ide-code-wrap')) {
      updateScrollHint(pre.parentElement, pre)
      return
    }
    const code = pre.querySelector('code')
    const wrapper = document.createElement('div')
    wrapper.className = 'ide-code-wrap'
    const text = code?.textContent || pre.textContent || ''
    const languageClass = `${pre.className} ${code?.className || ''}`.match(/language-([\w-]+)/)?.[1]
    if (languageClass === 'mermaid') return
    const isDiagram = ['text', 'plaintext'].includes(languageClass || '') && /[↓↑↕⇄⇅→←┌┐└┘├┤┬┴│─]/.test(text)
    if (isDiagram) wrapper.classList.add('ide-diagram-card')

    const toolbar = document.createElement('div')
    toolbar.className = 'ide-code-toolbar'
    const label = document.createElement('span')
    label.className = 'ide-code-language'
    label.textContent = isDiagram ? 'DIAGRAM' : (languageClass || 'CODE').toUpperCase()
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'ide-copy-code'
    button.setAttribute('aria-label', '코드 복사')
    button.innerHTML = '<i class="ri-file-copy-line" aria-hidden="true"></i><span>복사</span>'
    button.addEventListener('click', async () => {
      try {
        await copyText(text)
        button.classList.add('is-copied')
        button.setAttribute('aria-label', '코드가 복사되었습니다')
        button.innerHTML = '<i class="ri-check-line" aria-hidden="true"></i><span>복사됨</span>'
        window.setTimeout(() => {
          button.classList.remove('is-copied')
          button.setAttribute('aria-label', '코드 복사')
          button.innerHTML = '<i class="ri-file-copy-line" aria-hidden="true"></i><span>복사</span>'
        }, 1600)
      } catch {
        button.setAttribute('aria-label', '코드를 복사하지 못했습니다')
        button.innerHTML = '<i class="ri-error-warning-line" aria-hidden="true"></i><span>실패</span>'
      }
    })
    pre.parentNode?.insertBefore(wrapper, pre)
    toolbar.append(label, button)
    wrapper.append(toolbar, pre)
    requestAnimationFrame(() => updateScrollHint(wrapper, pre))
  })
}

function scanDocument() {
  scheduled = false
  const content = document.querySelector<HTMLElement>('.ide-document-content')
  if (!content) {
    documentContext.outline.value = []
    documentContext.wordCount.value = 0
    return
  }
  const used = new Set<string>()
  const outline = [...content.querySelectorAll<HTMLHeadingElement>('h2, h3')].map((heading, index) => {
    const base = heading.id || slugify(heading.textContent || '', `section-${index + 1}`)
    let id = base
    let suffix = 2
    while (used.has(id)) id = `${base}-${suffix++}`
    used.add(id)
    heading.id = id
    return { id, text: heading.textContent?.trim() || id, level: heading.tagName === 'H3' ? 3 as const : 2 as const }
  })
  documentContext.outline.value = outline
  const text = content.innerText.trim()
  documentContext.wordCount.value = text ? text.split(/\s+/).length : 0
  enhanceCodeBlocks(content)
}

function scheduleScan() {
  if (!import.meta.client || scheduled) return
  scheduled = true
  requestAnimationFrame(scanDocument)
}

function refreshScrollHints() {
  document.querySelectorAll<HTMLElement>('.ide-code-wrap').forEach((wrapper) => {
    const pre = wrapper.querySelector<HTMLPreElement>('pre')
    if (pre) updateScrollHint(wrapper, pre)
  })
}

watch(() => route.fullPath, async () => {
  await nextTick()
  scheduleScan()
})

onMounted(() => {
  const main = document.getElementById('main-content')
  if (main) {
    observer = new MutationObserver(scheduleScan)
    observer.observe(main, { childList: true, subtree: true })
  }
  window.addEventListener('resize', refreshScrollHints, { passive: true })
  scheduleScan()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('resize', refreshScrollHints)
})
</script>

<template><span class="ide-runtime-enhancer" hidden /></template>
