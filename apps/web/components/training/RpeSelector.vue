<script setup lang="ts">
import { RPE_SCALE } from '@sportia/config'

const props = withDefaults(
  defineProps<{
    modelValue?: number
  }>(),
  {
    modelValue: 5,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const rpeValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const currentRpe = computed(() =>
  RPE_SCALE.find((r) => r.value === rpeValue.value)
)

const rpeColor = computed(() => {
  const value = rpeValue.value
  if (value <= 3) return 'bg-green-500'
  if (value <= 5) return 'bg-yellow-500'
  if (value <= 7) return 'bg-orange-500'
  return 'bg-red-500'
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-between items-center">
      <label class="block text-sm font-medium text-gray-700">
        RPE (Esfuerzo Percibido)
      </label>
      <div class="flex items-center gap-2">
        <span
          class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
          :class="rpeColor"
        >
          {{ rpeValue }}
        </span>
      </div>
    </div>

    <input
      v-model.number="rpeValue"
      type="range"
      min="1"
      max="10"
      step="1"
      class="w-full h-3 rounded-lg appearance-none cursor-pointer"
      :style="{
        background: `linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)`,
      }"
    />

    <div class="flex justify-between text-xs text-gray-500">
      <span>1 - Muy facil</span>
      <span>10 - Maximo</span>
    </div>

    <p v-if="currentRpe" class="text-center text-sm text-gray-600 font-medium">
      {{ currentRpe.label }}
    </p>
  </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid rgb(14 165 233);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 3px solid rgb(14 165 233);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
</style>
