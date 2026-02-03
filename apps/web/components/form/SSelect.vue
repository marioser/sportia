<script setup lang="ts">
import type { SelectOption } from '~/types'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: SelectOption[]
    label?: string
    placeholder?: string
    error?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    disabled: false,
    required: false,
    placeholder: 'Seleccionar...',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const selectId = useId()

const selectValue = computed({
  get: () => props.modelValue ?? '',
  set: (value) => emit('update:modelValue', value === '' ? null : value),
})

const selectClasses = computed(() => [
  'w-full px-4 py-3 rounded-lg border transition-colors appearance-none',
  'bg-white dark:bg-slate-900 text-gray-900 dark:text-white',
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
      :for="selectId"
      class="block text-sm font-medium text-gray-700 dark:text-slate-200"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <select
        :id="selectId"
        v-model="selectValue"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
      >
        <option value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <div
        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
      >
        <svg
          class="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
    <p v-if="error" class="text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>
