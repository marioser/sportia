<script setup lang="ts">
import type { TrainingSplit } from '~/types'
import { msToTimeString } from '@sportia/shared'

defineProps<{
  splits: TrainingSplit[]
  editable?: boolean
}>()

const emit = defineEmits<{
  remove: [index: number]
}>()

const getCumulativeTime = (splits: TrainingSplit[], index: number) => {
  let total = 0
  for (let i = 0; i <= index; i++) {
    total += splits[i].split_time_ms
  }
  return total
}
</script>

<template>
  <div v-if="splits.length > 0" class="space-y-2">
    <div class="grid grid-cols-4 text-xs text-gray-500 uppercase px-2">
      <span>#</span>
      <span>Distancia</span>
      <span>Parcial</span>
      <span class="text-right">Acumulado</span>
    </div>
    <div
      v-for="(split, index) in splits"
      :key="split.split_index"
      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
    >
      <div class="grid grid-cols-4 flex-1 items-center">
        <span class="font-medium text-gray-900">{{ split.split_index + 1 }}</span>
        <span class="text-gray-600">{{ split.split_distance_m }}m</span>
        <span class="font-mono font-bold text-primary-600">
          {{ msToTimeString(split.split_time_ms) }}
        </span>
        <span class="font-mono text-gray-500 text-right">
          {{ msToTimeString(getCumulativeTime(splits, index)) }}
        </span>
      </div>
      <button
        v-if="editable"
        type="button"
        class="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        @click="emit('remove', index)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
  <div v-else class="text-center py-4 text-gray-500">
    Sin parciales registrados
  </div>
</template>
