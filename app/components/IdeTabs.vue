<script setup lang="ts">
import { normalizeContentPath } from '~/utils/content'

const route = useRoute()
const workspace = useWorkspaceState()

function isActive(url: string): boolean {
  return normalizeContentPath(route.path) === normalizeContentPath(url)
}

async function closeTab(url: string) {
  const index = workspace.tabs.value.findIndex(tab => tab.url === url)
  const wasActive = isActive(url)
  const nextUrl = workspace.tabs.value[index - 1]?.url
    || workspace.tabs.value[index + 1]?.url
    || '/'
  workspace.closeTab(url)
  if (wasActive) await navigateTo(nextUrl)
}
</script>

<template>
  <div class="ide-tabs" :class="{ 'is-empty': !workspace.tabs.value.length }" role="tablist" aria-label="최근 게시물">
    <div v-if="!workspace.tabs.value.length" class="ide-tabs-empty">열린 문서가 없습니다.</div>
    <div
      v-for="tab in workspace.tabs.value"
      :key="tab.url"
      class="ide-tab"
      :class="{ 'is-active': isActive(tab.url) }"
      role="tab"
      :aria-selected="isActive(tab.url)"
    >
      <NuxtLink class="ide-tab-link" :to="tab.url" :title="tab.title">
        <i class="ri-markdown-line" aria-hidden="true" />
        <span>{{ tab.title }}</span>
        <small v-if="isActive(tab.url)" aria-hidden="true">●</small>
      </NuxtLink>
      <button type="button" :aria-label="`${tab.title} 탭 닫기`" @click="closeTab(tab.url)">
        <i class="ri-close-line" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
