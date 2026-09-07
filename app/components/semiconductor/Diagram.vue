<script setup lang="ts">
import type { Part } from '~/utils/semiconductor/model'
import { diagramParts, faces, project } from '~/utils/semiconductor/projection'

const props = defineProps<{ parts: Part[], cutaway?: boolean, label: string }>()
const visible = computed(() => diagramParts(props.parts, Boolean(props.cutaway)))
</script>

<template>
  <svg viewBox="0 0 600 390" role="img" :aria-label="label" class="semi-diagram">
    <title>{{ label }}</title>
    <path d="M55 312 L300 380 L552 274 M100 340 L345 225 M175 361 L420 247 M70 285 L360 367 M135 255 L460 347" stroke="#283849" fill="none" />
    <g v-for="part in visible" :key="part.id" :opacity="part.opacity ?? 1">
      <title>{{ part.label }}</title>
      <polyline v-if="part.kind === 'wire'" :points="part.points?.map(p => project(p).join(',')).join(' ')" :stroke="part.color" stroke-width="3" fill="none" stroke-linejoin="round" />
      <template v-else>
        <polygon v-for="(face, index) in faces(part)" :key="index" :points="face.points" :fill="face.color" :fill-opacity="face.shade" stroke="#101b2c" stroke-width="0.6" />
        <ellipse v-for="(hole, index) in part.holes || []" :key="`hole-${index}`" :cx="project([hole.x, part.position[1] + part.size[1] / 2, hole.z])[0]" :cy="project([hole.x, part.position[1] + part.size[1] / 2, hole.z])[1]" :rx="hole.radius * 36" :ry="hole.radius * 16" fill="#101b2c" stroke="#a1b3c5" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.semi-diagram { display: block; width: 100%; height: 100%; max-height: 430px; background: #101b2c; }
</style>
