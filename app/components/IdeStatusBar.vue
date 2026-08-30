<script setup lang="ts">
import type { FontSizePreference } from '~/types/content'

const workspace = useWorkspaceState()
const documentContext = useDocumentContext()
const main = inject<Ref<HTMLElement | null>>('ideMain', ref(null))
const sizes: Array<{ value: FontSizePreference, mark: string, label: string }> = [
  { value: 'small', mark: 'A−', label: '작게' },
  { value: 'medium', mark: 'A', label: '기본' },
  { value: 'large', mark: 'A＋', label: '크게' },
]

const folder = computed(() => documentContext.currentPost.value?.categories.join(' / ').replaceAll('_', ' ') || 'workspace')

function toggleMobileContext() {
  workspace.contextVisible.value = true
  workspace.mobileContextOpen.value = !workspace.mobileContextOpen.value
}
</script>

<template>
  <footer class="ide-statusbar" aria-label="문서 상태">
    <div>
      <span><i class="ri-git-branch-line" aria-hidden="true" /> main</span>
      <span><i class="ri-folder-2-line" aria-hidden="true" /> {{ folder }}</span>
    </div>
    <div>
      <button
        class="ide-mobile-context"
        type="button"
        :aria-expanded="workspace.mobileContextOpen.value"
        aria-controls="contextPanel"
        aria-label="목차 열기"
        @click="toggleMobileContext"
      ><i class="ri-list-ordered-2" aria-hidden="true" /><span>목차</span></button>
      <span>{{ documentContext.readingMinutes.value }} min read</span>
      <span>UTF-8</span>
      <span>Markdown</span>
      <fieldset class="ide-font-size-control">
        <legend class="sr-only">본문 글씨 크기</legend>
        <label v-for="size in sizes" :key="size.value" class="ide-font-size-option" :title="`본문 글씨 ${size.label}`">
          <input
            type="radio"
            name="ide-font-size"
            :value="size.value"
            :checked="workspace.fontSize.value === size.value"
            @change="workspace.setFontSize(size.value)"
          >
          <span aria-hidden="true">{{ size.mark }}</span><span class="ide-font-size-label">{{ size.label }}</span>
        </label>
      </fieldset>
      <button type="button" aria-label="맨 위로 이동" @click="main?.scrollTo({ top: 0, behavior: 'smooth' })">↑ TOP</button>
    </div>
  </footer>
</template>
