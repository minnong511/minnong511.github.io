<script setup lang="ts">
import type { SidebarView } from '~/types/content'

defineProps<{ activeView: SidebarView }>()
const emit = defineEmits<{ select: [view: SidebarView] }>()
const items: Array<{ view: SidebarView, label: string, icon: string }> = [
  { view: 'explorer', label: 'Explorer', icon: 'ri-folder-3-line' },
  { view: 'search', label: 'Search', icon: 'ri-search-line' },
  { view: 'source', label: 'Source Control', icon: 'ri-git-branch-line' },
  { view: 'run', label: 'Run and Debug', icon: 'ri-bug-line' },
]
</script>

<template>
  <aside class="ide-activity" aria-label="주요 탐색">
    <nav aria-label="작업 영역">
      <button
        v-for="item in items"
        :key="item.view"
        class="ide-activity-item"
        :class="{ 'is-active': activeView === item.view }"
        type="button"
        :aria-label="item.label"
        :title="item.label"
        :aria-pressed="activeView === item.view"
        @click="emit('select', item.view)"
      ><i :class="item.icon" aria-hidden="true" /><span>{{ item.label }}</span></button>
    </nav>
    <nav aria-label="계정 및 저장소">
      <button class="ide-activity-item" :class="{ 'is-active': activeView === 'about' }" type="button" aria-label="소개와 바로가기" title="Manage" @click="emit('select', 'about')"><i class="ri-settings-3-line" /><span>Manage</span></button>
      <a class="ide-activity-item" href="https://www.linkedin.com/in/min-hyeong-lee-225294270/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="ri-linkedin-box-fill" /><span>LinkedIn</span></a>
      <a class="ide-activity-item ide-activity-github" href="https://github.com/minnong511" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="ri-github-line" /><span>GitHub</span></a>
    </nav>
  </aside>
</template>
