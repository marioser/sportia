<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: number
    min?: number
    max?: number
    step?: number
    label?: string
    labels?: Record<number, string>
    showValue?: boolean
    disabled?: boolean
  }>(),
  {
    min: 0,
    max: 10,
    step: 1,
    showValue: true,
    disabled: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const sliderId = useId()

const sliderValue = computed({
  get: () => props.modelValue ?? props.min,
  set: (value) => emit('update:modelValue', Number(value)),
})

const currentLabel = computed(() => {
  if (props.labels && props.labels[sliderValue.value]) {
    return props.labels[sliderValue.value]
  }
  return null
})

const percentage = computed(() => {
  const range = props.max - props.min
  return ((sliderValue.value - props.min) / range) * 100
})

// Track colors for light and dark modes
const trackStyle = computed(() => ({
  background: `linear-gradient(to right, rgb(14 165 233) ${percentage.value}%, var(--slider-track-bg, rgb(229 231 235)) ${percentage.value}%)`,
}))
</script>

<template>
  <div class="space-y-2">
    <div v-if="label || showValue" class="flex justify-between items-center">
      <label
        v-if="label"
        :for="sliderId"
        class="block text-sm font-medium text-gray-700 dark:text-slate-200"
      >
        {{ label }}
      </label>
      <div v-if="showValue" class="text-right">
        <span class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ sliderValue }}</span>
        <span v-if="currentLabel" class="text-sm text-gray-500 dark:text-slate-400 ml-2">
          {{ currentLabel }}
        </span>
      </div>
    </div>
    <input
      :id="sliderId"
      v-model="sliderValue"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :style="trackStyle"
      class="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb"
      :class="{ 'opacity-60 cursor-not-allowed': disabled }"
    />
    <div v-if="labels" class="flex justify-between text-xs text-gray-500 dark:text-slate-400 px-1">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Slider track background variable */
:root {
  --slider-track-bg: rgb(229 231 235);
}

:global(.dark) {
  --slider-track-bg: rgb(71 85 105);
}

.slider-thumb::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgb(14 165 233);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-thumb::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgb(14 165 233);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:global(.dark) .slider-thumb::-webkit-slider-thumb {
  border-color: rgb(30 41 59);
}

:global(.dark) .slider-thumb::-moz-range-thumb {
  border-color: rgb(30 41 59);
}
</style>
