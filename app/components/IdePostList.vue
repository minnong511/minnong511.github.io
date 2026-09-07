<script setup lang="ts">
import type { BlogPost } from '~/types/content'
import { formatPostDate } from '~/utils/content'
import { categoryLabel, topicForPost } from '~/utils/topics'

const props = withDefaults(defineProps<{ posts: BlogPost[], query?: string, compact?: boolean }>(), { query: '', compact: false })

function matchedTags(post: BlogPost): string[] {
  const needle = props.query.trim().toLocaleLowerCase('ko-KR')
  return needle ? [...new Set([...post.categories, ...post.tags])]
    .filter(tag => tag.toLocaleLowerCase('ko-KR').includes(needle)).slice(0, 3) : []
}
</script>

<template>
  <div class="ide-post-list" :class="{ 'is-compact': compact }">
    <NuxtLink v-for="post in posts" :key="post.path" class="ide-post-row" :to="post.path">
      <div class="ide-post-row-content">
        <strong class="ide-post-title"><IdeHighlightedText :text="post.title" :query="query" /></strong>
        <p v-if="!compact && (post.description || post.summary)" class="ide-post-description"><IdeHighlightedText :text="post.description || post.summary" :query="query" /></p>
        <div class="ide-post-meta">
          <time :datetime="post.date">{{ formatPostDate(post.date) }}</time>
          <span>{{ topicForPost(post).name }}</span>
          <span v-if="post.categories.length > 1" class="ide-post-subcategory">{{ categoryLabel(post.categories.at(-1) || '') }}</span>
        </div>
        <div v-if="matchedTags(post).length" class="ide-post-matches"><span v-for="tag in matchedTags(post)" :key="tag">#<IdeHighlightedText :text="tag" :query="query" /></span></div>
      </div>
      <i class="ri-arrow-right-line" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>
