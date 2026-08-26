<script setup lang="ts">
const route = useRoute()
const workspace = useWorkspaceState()
const mount = ref<HTMLElement | null>(null)
let frameObserver: MutationObserver | null = null
let frameReady = false

const canonicalUrl = computed(() => `https://minnong511.github.io${route.path}`)
const loginUrl = computed(() => `https://github.com/login?return_to=${encodeURIComponent(canonicalUrl.value)}`)

function giscusTheme(): string {
  return workspace.theme.value === 'light' ? 'light' : 'transparent_dark'
}

function syncTheme() {
  if (!frameReady) return
  const frame = mount.value?.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, 'https://giscus.app')
}

function observeFrame() {
  const frame = mount.value?.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (!frame || frame.dataset.themeListener === 'true') return
  frame.dataset.themeListener = 'true'
  frame.addEventListener('load', () => {
    frameReady = true
    syncTheme()
  }, { once: true })
}

function loadGiscus() {
  if (!mount.value) return
  frameReady = false
  mount.value.replaceChildren()
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  const config: Record<string, string> = {
    repo: 'minnong511/minnong511.github.io',
    'repo-id': 'R_kgDONte4cw',
    category: 'General',
    'category-id': 'DIC_kwDONte4c84C3PLr',
    mapping: 'pathname',
    strict: '0',
    'reactions-enabled': '1',
    'emit-metadata': '0',
    'input-position': 'top',
    theme: giscusTheme(),
    lang: 'ko',
    loading: 'lazy',
  }
  Object.entries(config).forEach(([key, value]) => script.setAttribute(`data-${key}`, value))
  mount.value.appendChild(script)
}

onMounted(() => {
  if (mount.value) {
    frameObserver = new MutationObserver(observeFrame)
    frameObserver.observe(mount.value, { childList: true, subtree: true })
  }
  loadGiscus()
})
onBeforeUnmount(() => frameObserver?.disconnect())
watch(() => workspace.theme.value, syncTheme)
watch(() => route.path, () => nextTick(loadGiscus))
</script>

<template>
  <section class="ide-comments" aria-labelledby="commentsTitle">
    <header class="ide-comments-heading">
      <span class="ide-panel-label">DISCUSSION</span>
      <h2 id="commentsTitle">COMMENTS</h2>
      <p>GitHub 계정으로 로그인하여 댓글을 남길 수 있습니다. 댓글은 GitHub Discussions에 공개 저장되며, 작성 내용과 GitHub 프로필 정보가 다른 방문자에게 보일 수 있습니다.</p>
      <div class="ide-comments-actions">
        <a class="ide-comments-action" :href="loginUrl" target="_blank" rel="noopener noreferrer"><i class="ri-github-line" aria-hidden="true" /><span>GitHub 로그인 후 댓글 쓰기</span><i class="ri-external-link-line" aria-hidden="true" /></a>
        <a class="ide-comments-action ide-comments-action-secondary" href="https://github.com/minnong511/minnong511.github.io/discussions" target="_blank" rel="noopener noreferrer"><i class="ri-discuss-line" aria-hidden="true" /><span>Discussion 열기</span><i class="ri-external-link-line" aria-hidden="true" /></a>
      </div>
    </header>
    <div ref="mount" class="giscus" aria-label="댓글" />
  </section>
</template>
