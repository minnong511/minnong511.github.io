<script setup lang="ts">
import type { BlogPost, ExplorerFolderNode } from '~/types/content'
import { normalizeContentPath, postMatches, postTimestamp } from '~/utils/content'

const props = defineProps<{
  node: ExplorerFolderNode
  query: string
  sort: 'newest' | 'oldest' | 'title'
}>()

const route = useRoute()
const workspace = useWorkspaceState()

function allPosts(node: ExplorerFolderNode): BlogPost[] {
  return [...node.posts, ...node.children.flatMap(allPosts)]
}

function nodeMatches(node: ExplorerFolderNode): boolean {
  const nameMatch = node.name.toLocaleLowerCase('ko-KR').includes(props.query.toLocaleLowerCase('ko-KR'))
  return nameMatch || allPosts(node).some(post => postMatches(post, props.query))
}

const folderPosts = computed(() => allPosts(props.node))
const visible = computed(() => !props.query || nodeMatches(props.node))
const activeInside = computed(() => folderPosts.value.some(post => normalizeContentPath(post.path) === normalizeContentPath(route.path)))
const open = computed(() => Boolean(props.query || activeInside.value || workspace.folderState.value[props.node.key]))
const sortedPosts = computed(() => [...props.node.posts]
  .filter(post => postMatches(post, props.query))
  .sort((a, b) => {
    if (props.sort === 'title') return a.title.localeCompare(b.title, 'ko')
    const delta = postTimestamp(a) - postTimestamp(b)
    return props.sort === 'oldest' ? delta : -delta
  }))

function toggle() {
  workspace.setFolder(props.node.key, !open.value)
}
</script>

<template>
  <div v-if="visible" class="ide-tree-folder" :class="{ 'is-open': open }" :data-category="node.key" :aria-expanded="open">
    <button class="ide-tree-folder-toggle" type="button" @click="toggle">
      <i class="ri-arrow-right-s-line" aria-hidden="true" />
      <i :class="open ? 'ri-folder-open-line' : 'ri-folder-3-line'" aria-hidden="true" />
      <span>{{ node.name.replaceAll('_', ' ') }}</span><small>{{ folderPosts.length }}</small>
    </button>
    <div v-show="open" class="ide-tree-children" role="group">
      <NuxtLink
        v-for="post in sortedPosts"
        :key="post.path"
        class="ide-tree-post"
        :class="{ 'is-current': normalizeContentPath(route.path) === post.path }"
        :to="post.path"
        role="treeitem"
        :aria-current="normalizeContentPath(route.path) === post.path ? 'page' : undefined"
        :title="post.title"
      ><i class="ri-markdown-line" aria-hidden="true" /><span>{{ post.title }}</span></NuxtLink>
      <IdeExplorerFolder
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :query="query"
        :sort="sort"
      />
    </div>
  </div>
</template>
