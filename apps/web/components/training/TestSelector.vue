<script setup lang="ts">
import type { Test, SwimStroke } from '~/types'
import { SWIM_STROKES, OFFICIAL_DISTANCES, POOL_TYPES } from '@sportia/config'

const props = defineProps<{
  modelValue?: string
  tests: readonly Test[]
  swimStrokes: readonly SwimStroke[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type PoolType = 'SCM' | 'LCM'

// Filter state
const selectedStroke = ref<string | null>(null)
const selectedDistance = ref<number | null>(null)
const selectedPoolType = ref<PoolType | null>(null)

// Available options based on filters
const availableStrokes = computed(() => {
  const strokeIds = new Set(props.tests.map((t) => t.stroke_id))
  return props.swimStrokes.filter((s) => strokeIds.has(s.id))
})

const availableDistances = computed(() => {
  let filtered = props.tests
  if (selectedStroke.value) {
    const stroke = props.swimStrokes.find((s) => s.code === selectedStroke.value)
    if (stroke) {
      filtered = filtered.filter((t) => t.stroke_id === stroke.id)
    }
  }
  return [...new Set(filtered.map((t) => t.distance_m))].sort((a, b) => a - b)
})

const availablePoolTypes = computed(() => {
  let filtered = props.tests
  if (selectedStroke.value) {
    const stroke = props.swimStrokes.find((s) => s.code === selectedStroke.value)
    if (stroke) {
      filtered = filtered.filter((t) => t.stroke_id === stroke.id)
    }
  }
  if (selectedDistance.value) {
    filtered = filtered.filter((t) => t.distance_m === selectedDistance.value)
  }
  return [...new Set(filtered.map((t) => t.pool_type))]
})

// Find matching test when all filters are set
const matchingTest = computed(() => {
  if (!selectedStroke.value || !selectedDistance.value || !selectedPoolType.value) {
    return null
  }

  const stroke = props.swimStrokes.find((s) => s.code === selectedStroke.value)
  if (!stroke) return null

  return props.tests.find(
    (t) =>
      t.stroke_id === stroke.id &&
      t.distance_m === selectedDistance.value &&
      t.pool_type === selectedPoolType.value
  )
})

// Emit when matching test changes
watch(matchingTest, (test) => {
  if (test) {
    emit('update:modelValue', test.id)
  }
})

// Initialize from modelValue
watch(
  () => props.modelValue,
  (testId) => {
    if (testId) {
      const test = props.tests.find((t) => t.id === testId)
      if (test) {
        const stroke = props.swimStrokes.find((s) => s.id === test.stroke_id)
        if (stroke) {
          selectedStroke.value = stroke.code
          selectedDistance.value = test.distance_m
          selectedPoolType.value = test.pool_type
        }
      }
    }
  },
  { immediate: true }
)

// Reset dependent selections when parent changes
watch(selectedStroke, () => {
  if (!availableDistances.value.includes(selectedDistance.value!)) {
    selectedDistance.value = null
    selectedPoolType.value = null
  }
})

watch(selectedDistance, () => {
  if (!availablePoolTypes.value.includes(selectedPoolType.value!)) {
    selectedPoolType.value = null
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Stroke selector -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="stroke in availableStrokes"
          :key="stroke.id"
          type="button"
          class="px-4 py-2 rounded-lg border font-medium transition-colors"
          :class="
            selectedStroke === stroke.code
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
          "
          @click="selectedStroke = stroke.code"
        >
          {{ stroke.name_es }}
        </button>
      </div>
    </div>

    <!-- Distance selector -->
    <div v-if="selectedStroke">
      <label class="block text-sm font-medium text-gray-700 mb-2">Distancia</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="distance in availableDistances"
          :key="distance"
          type="button"
          class="px-4 py-2 rounded-lg border font-medium transition-colors"
          :class="
            selectedDistance === distance
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
          "
          @click="selectedDistance = distance"
        >
          {{ distance }}m
        </button>
      </div>
    </div>

    <!-- Pool type selector -->
    <div v-if="selectedDistance">
      <label class="block text-sm font-medium text-gray-700 mb-2">Piscina</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="poolType in availablePoolTypes"
          :key="poolType"
          type="button"
          class="px-4 py-2 rounded-lg border font-medium transition-colors"
          :class="
            selectedPoolType === poolType
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
          "
          @click="selectedPoolType = poolType"
        >
          {{ poolType === 'SCM' ? '25m' : '50m' }}
        </button>
      </div>
    </div>

    <!-- Selected test summary -->
    <div v-if="matchingTest" class="p-3 bg-primary-50 rounded-lg">
      <p class="text-sm text-primary-800 font-medium">
        Prueba seleccionada: {{ selectedDistance }}m {{ selectedStroke }}
        ({{ selectedPoolType === 'SCM' ? '25m' : '50m' }})
      </p>
    </div>
  </div>
</template>
