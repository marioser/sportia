<script setup lang="ts">
/**
 * Time picker for swimming times in format mm:ss.cc
 * Accepts and emits time in milliseconds
 */
import { msToTimeString, timeStringToMs } from '@sportia/shared'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    label?: string
    error?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    disabled: false,
    required: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputId = useId()

// Internal string representation for the input
const timeString = ref('')

// Initialize from modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined && newValue > 0) {
      timeString.value = msToTimeString(newValue)
    }
  },
  { immediate: true }
)

// Parse and emit on blur or enter
const handleInput = () => {
  // Clean up the input (allow only digits, colons, and periods)
  timeString.value = timeString.value.replace(/[^\d:.]/g, '')
}

const handleBlur = () => {
  if (!timeString.value) {
    emit('update:modelValue', 0)
    return
  }

  try {
    const ms = timeStringToMs(timeString.value)
    emit('update:modelValue', ms)
    // Normalize the display
    timeString.value = msToTimeString(ms)
  } catch {
    // Invalid format, keep current value
  }
}

const inputClasses = computed(() => [
  'w-full px-4 py-3 rounded-lg border transition-colors font-mono text-center text-lg',
  'bg-white dark:bg-slate-900 text-gray-900 dark:text-white',
  'placeholder:text-gray-400 dark:placeholder:text-slate-500',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  props.error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 dark:border-slate-600',
  props.disabled ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : '',
])
</script>

<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-slate-200"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="inputId"
      v-model="timeString"
      type="text"
      inputmode="decimal"
      placeholder="mm:ss.cc"
      :disabled="disabled"
      :required="required"
      :class="inputClasses"
      @input="handleInput"
      @blur="handleBlur"
      @keyup.enter="handleBlur"
    />
    <p class="text-xs text-gray-500 dark:text-slate-400">Formato: mm:ss.cc (ej: 1:05.23)</p>
    <p v-if="error" class="text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>
