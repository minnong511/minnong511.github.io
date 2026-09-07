<script setup lang="ts">
import type { SidebarView } from '~/types/content'

defineProps<{ activeView: SidebarView }>()
const emit = defineEmits<{ select: [view: SidebarView] }>()
</script>

<template>
  <aside class="ide-activity" aria-label="주요 탐색">
    <nav aria-label="블로그 탐색">
      <NuxtLink class="ide-activity-item" to="/" aria-label="홈" title="홈"><i class="ri-home-5-line" aria-hidden="true" /><span>홈</span></NuxtLink>
      <NuxtLink class="ide-activity-item" to="/archive/" aria-label="전체 글" title="전체 글"><i class="ri-file-list-3-line" aria-hidden="true" /><span>전체 글</span></NuxtLink>
      <button class="ide-activity-item" type="button" aria-label="주제 탐색" title="주제 탐색" @click="emit('select', 'explorer')"><i class="ri-folder-3-line" aria-hidden="true" /><span>주제</span></button>
      <NuxtLink class="ide-activity-item" to="/search/" aria-label="검색" title="검색"><i class="ri-search-line" aria-hidden="true" /><span>검색</span></NuxtLink>
      <NuxtLink class="ide-activity-item" to="/about/" aria-label="소개" title="소개"><i class="ri-information-line" aria-hidden="true" /><span>소개</span></NuxtLink>
    </nav>
    <nav aria-label="외부 프로필">
      <a class="ide-activity-item" href="https://www.linkedin.com/in/min-hyeong-lee-225294270/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="ri-linkedin-box-fill" aria-hidden="true" /><span>LinkedIn</span></a>
      <a class="ide-activity-item ide-activity-github" href="https://github.com/minnong511" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="ri-github-line" aria-hidden="true" /><span>GitHub</span></a>
    </nav>
  </aside>
</template>
