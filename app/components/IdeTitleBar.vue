<script setup lang="ts">
const route = useRoute()
const workspace = useWorkspaceState()
const documentContext = useDocumentContext()
const fullscreen = ref(false)

const title = computed(() => documentContext.currentPost.value?.title || String(route.meta.title || 'Minnong\'s Study Log'))
const address = computed(() => {
  if (documentContext.currentPost.value) return `minnong511.github.io / posts / ${documentContext.currentPost.value.path.split('/').filter(Boolean).at(-1)}`
  return `minnong511.github.io / ${route.path.split('/').filter(Boolean).join(' / ') || 'workspace'}`
})

function history(direction: 'back' | 'forward') {
  if (!import.meta.client) return
  if (direction === 'back') window.history.back()
  else window.history.forward()
}

async function toggleFullscreen() {
  if (!import.meta.client || !document.fullscreenEnabled) return
  if (document.fullscreenElement) await document.exitFullscreen()
  else await document.documentElement.requestFullscreen()
}

function syncFullscreen() {
  fullscreen.value = Boolean(document.fullscreenElement)
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreen)
})

onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen))
</script>

<template>
  <header class="ide-titlebar" aria-label="사이트 도구 모음">
    <div class="ide-window-controls" aria-hidden="true"><span /><span /><span /></div>
    <div class="ide-history-controls">
      <button class="ide-icon-button" type="button" aria-label="이전 페이지" title="이전 페이지" @click="history('back')"><i class="ri-arrow-left-line" /></button>
      <button class="ide-icon-button" type="button" aria-label="다음 페이지" title="다음 페이지" @click="history('forward')"><i class="ri-arrow-right-line" /></button>
    </div>
    <button class="ide-addressbar" type="button" aria-label="검색 팔레트 열기" @click="workspace.paletteOpen.value = true">
      <i class="ri-terminal-box-line" aria-hidden="true" /><span>{{ address }}</span><kbd><span class="mac-only">⌘</span><span class="win-only">Ctrl</span>K</kbd>
    </button>
    <span class="ide-mobile-title">{{ title }}</span>
    <div class="ide-titlebar-actions">
      <button
        id="ideThemeToggle"
        class="ide-icon-button ide-theme-toggle"
        type="button"
        aria-label="테마 전환"
        title="테마 전환"
        :aria-pressed="workspace.theme.value === 'dark'"
        @click="workspace.setTheme(workspace.theme.value === 'dark' ? 'light' : 'dark')"
      ><i class="ri-contrast-2-line" /></button>
      <button
        class="ide-icon-button ide-context-toggle"
        type="button"
        :aria-expanded="workspace.contextVisible.value"
        :aria-label="workspace.contextVisible.value ? '목차 패널 숨기기' : '목차 패널 열기'"
        @click="workspace.contextVisible.value = !workspace.contextVisible.value"
      ><i class="ri-layout-right-line" /></button>
      <button class="ide-icon-button" type="button" :aria-label="fullscreen ? '전체 화면 닫기' : '전체 화면'" @click="toggleFullscreen"><i :class="fullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" /></button>
      <button
        class="ide-icon-button ide-mobile-menu"
        type="button"
        aria-label="탐색 메뉴 열기"
        :aria-expanded="workspace.sidebarOpen.value"
        @click="workspace.showSidebar('explorer')"
      ><i class="ri-menu-line" /></button>
    </div>
  </header>
</template>
