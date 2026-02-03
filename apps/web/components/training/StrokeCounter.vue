<script setup lang="ts">
const props = defineProps<{
  modelValue: number[]
  lengths: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

// Initialize stroke counts array
const strokeCounts = computed({
  get: () => {
    // Ensure array has correct length
    const counts = [...props.modelValue]
    while (counts.length < props.lengths) {
      counts.push(0)
    }
    return counts.slice(0, props.lengths)
  },
  set: (value) => emit('update:modelValue', value),
})

const updateCount = (index: number, value: number) => {
  const newCounts = [...strokeCounts.value]
  newCounts[index] = Math.max(0, value)
  emit('update:modelValue', newCounts)
}

const increment = (index: number) => {
  updateCount(index, strokeCounts.value[index] + 1)
}

const decrement = (index: number) => {
  updateCount(index, strokeCounts.value[index] - 1)
}

const totalStrokes = computed(() =>
  strokeCounts.value.reduce((sum, count) => sum + count, 0)
)

const averageStrokes = computed(() => {
  if (props.lengths === 0) return 0
  return Math.round(totalStrokes.value / props.lengths * 10) / 10
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <label class="block text-sm font-medium text-gray-700">
        Conteo de brazadas
      </label>
      <div class="text-sm text-gray-500">
        Total: <span class="font-bold text-primary-600">{{ totalStrokes }}</span>
        <span class="mx-1">|</span>
        Promedio: <span class="font-bold text-primary-600">{{ averageStrokes }}</span>
      </div>
    </div>

    <div class="space-y-2">
      <div
        v-for="(count, index) in strokeCounts"
        :key="index"
        class="flex items-center gap-3"
      >
        <span class="w-20 text-sm text-gray-600">
          Largo {{ index + 1 }}
        </span>
        <button
          type="button"
          class="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 font-bold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
          @click="decrement(index)"
        >
          -
        </button>
        <input
          :value="count"
          type="number"
          min="0"
          max="99"
          class="w-16 text-center font-mono text-lg font-bold border border-gray-300 rounded-lg py-2"
          @input="updateCount(index, parseInt(($event.target as HTMLInputElement).value) || 0)"
        />
        <button
          type="button"
          class="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 font-bold flex items-center justify-center hover:bg-primary-200 active:bg-primary-300 transition-colors"
          @click="increment(index)"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>
