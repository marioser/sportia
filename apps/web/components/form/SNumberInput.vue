<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: number
    label?: string
    min?: number
    max?: number
    step?: number
    error?: string
    disabled?: boolean
    required?: boolean
    unit?: string
  }>(),
  {
    step: 1,
    disabled: false,
    required: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputId = useId()

const numberValue = computed({
  get: () => props.modelValue ?? 0,
  set: (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    emit('update:modelValue', isNaN(num) ? 0 : num)
  },
})

const increment = () => {
  if (props.disabled) return
  const newValue = numberValue.value + props.step
  if (props.max === undefined || newValue <= props.max) {
    numberValue.value = newValue
  }
}

const decrement = () => {
  if (props.disabled) return
  const newValue = numberValue.value - props.step
  if (props.min === undefined || newValue >= props.min) {
    numberValue.value = newValue
  }
}

const inputClasses = computed(() => [
  'w-full px-4 py-3 rounded-lg border transition-colors text-center',
  'bg-white dark:bg-slate-900 text-gray-900 dark:text-white',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  props.error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 dark:border-slate-600',
  props.disabled ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : '',
])

const buttonClasses = computed(() => [
  'flex items-center justify-center w-12 h-12 rounded-lg border',
  'border-gray-300 dark:border-slate-600',
  'text-gray-600 dark:text-slate-300 font-bold text-xl transition-colors',
  'hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600',
  props.disabled ? 'opacity-60 cursor-not-allowed' : '',
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
    <div class="flex items-center gap-2">
      <button
        type="button"
        :class="buttonClasses"
        :disabled="disabled || (min !== undefined && numberValue <= min)"
        @click="decrement"
      >
        -
      </button>
      <div class="flex-1 relative">
        <input
          :id="inputId"
          v-model="numberValue"
          type="number"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
          :required="required"
          :class="inputClasses"
        />
        <span
          v-if="unit"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400"
        >
          {{ unit }}
        </span>
      </div>
      <button
        type="button"
        :class="buttonClasses"
        :disabled="disabled || (max !== undefined && numberValue >= max)"
        @click="increment"
      >
        +
      </button>
    </div>
    <p v-if="error" class="text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>
