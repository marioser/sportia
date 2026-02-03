<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    min?: string
    max?: string
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
  'update:modelValue': [value: string]
}>()

const inputId = useId()

const dateValue = computed({
  get: () => props.modelValue ?? '',
  set: (value) => emit('update:modelValue', value),
})

const inputClasses = computed(() => [
  'w-full px-4 py-3 rounded-lg border transition-colors',
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
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-slate-200"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="inputId"
      v-model="dateValue"
      type="date"
      :min="min"
      :max="max"
      :disabled="disabled"
      :required="required"
      :class="inputClasses"
    />
    <p v-if="error" class="text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>
