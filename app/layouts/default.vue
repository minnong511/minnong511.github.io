<script setup lang="ts">
import type { SidebarView } from '~/types/content'

const route = useRoute()
const main = ref<HTMLElement | null>(null)
const { posts, findByPath } = await useContentIndex()
const workspace = useWorkspacePersistence()
const documentContext = useDocumentContext()

const shellClasses = computed(() => ({
  'sidebar-collapsed': !workspace.sidebarOpen.value,
  'explorer-open': workspace.sidebarOpen.value,
  'context-collapsed': !workspace.contextVisible.value,
}))

const shellStyle = computed(() => ({
  '--explorer-width': `${workspace.panelWidths.value.explorer}px`,
  '--context-width': `${workspace.panelWidths.value.context}px`,
}))

function closeMobilePanels() {
  if (!import.meta.client || window.innerWidth > 767) return
  workspace.sidebarOpen.value = false
  workspace.mobileContextOpen.value = false
}

function startResize(panel: 'explorer' | 'context', event: PointerEvent) {
  if (!import.meta.client || window.innerWidth < 1200) return
  event.preventDefault()
  const startX = event.clientX
  const start = workspace.panelWidths.value[panel]
  const move = (moveEvent: PointerEvent) => {
    const delta = moveEvent.clientX - startX
    const next = panel === 'explorer' ? start + delta : start - delta
    workspace.panelWidths.value = {
      ...workspace.panelWidths.value,
      [panel]: Math.max(220, Math.min(420, next)),
    }
  }
  const stop = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop, { once: true })
}

function openSidebar(view: SidebarView) {
  workspace.showSidebar(view)
}

watch(() => route.fullPath, async () => {
  closeMobilePanels()
  await nextTick()
  main.value?.scrollTo({ top: 0, behavior: 'auto' })
  const post = findByPath(route.path)
  if (post) {
    documentContext.currentPost.value = post
    workspace.addTab({ url: post.path, title: post.title })
  } else {
    documentContext.reset()
  }
}, { immediate: true })

function handleKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && ['k', 'p'].includes(event.key.toLowerCase())) {
    event.preventDefault()
    workspace.paletteOpen.value = true
  }
  if (event.key === 'Escape') {
    workspace.paletteOpen.value = false
    if (window.innerWidth <= 767) closeMobilePanels()
  }
}

function handleViewport() {
  workspace.sidebarOpen.value = false
  workspace.mobileContextOpen.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKey)
  window.addEventListener('resize', handleViewport, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
  window.removeEventListener('resize', handleViewport)
})

provide('ideMain', main)
</script>

<template>
  <div class="ide-layout-root">
    <a class="skip-link" href="#main-content">본문으로 바로가기</a>
    <div id="ideApp" class="ide-app" :class="shellClasses" :style="shellStyle">
      <IdeTitleBar />
      <IdeActivityBar :active-view="workspace.activeSidebar.value" @select="openSidebar" />
      <IdeExplorer :posts="posts" @resize="startResize('explorer', $event)" />

      <button
        class="ide-explorer-backdrop"
        type="button"
        aria-label="탐색기 닫기"
        :hidden="!workspace.sidebarOpen.value"
        @click="workspace.sidebarOpen.value = false"
      />
      <button
        class="ide-context-backdrop"
        type="button"
        aria-label="목차 패널 닫기"
        :hidden="!workspace.mobileContextOpen.value"
        @click="workspace.mobileContextOpen.value = false"
      />

      <main id="main-content" ref="main" class="ide-main">
        <IdeTabs />
        <IdeBreadcrumbs />
        <div class="ide-document-area">
          <slot />
        </div>
      </main>

      <IdeContextPanel :posts="posts" @resize="startResize('context', $event)" />
      <IdeStatusBar />
    </div>
    <IdeCommandPalette :posts="posts" />
    <IdeMermaidRenderer />
    <IdeCodeEnhancer />
  </div>
</template>
