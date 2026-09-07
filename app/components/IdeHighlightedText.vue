<script setup lang="ts">
import { highlightParts } from '~/utils/reading'

const props = withDefaults(defineProps<{ text: string, query?: string }>(), { query: '' })
const parts = computed(() => highlightParts(props.text, props.query))
</script>

<template>
  <template v-for="(part, index) in parts" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template>
</template>
