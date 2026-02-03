<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    placeholder?: string
    rows?: number
    error?: string
    disabled?: boolean
    required?: boolean
    maxlength?: number
  }>(),
  {
    rows: 3,
    disabled: false,
    required: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaId = useId()

const textValue = computed({
  get: () => props.modelValue ?? '',
  set: (value) => emit('update:modelValue', value),
})

const characterCount = computed(() => textValue.value.length)

const textareaClasses = computed(() => [
  'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
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
      :for="textareaId"
      class="block text-sm font-medium text-gray-700 dark:text-slate-200"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <textarea
      :id="textareaId"
      v-model="textValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :maxlength="maxlength"
      :class="textareaClasses"
    />
    <div class="flex justify-between text-xs text-gray-500 dark:text-slate-400">
      <span v-if="error" class="text-red-500">{{ error }}</span>
      <span v-else></span>
      <span v-if="maxlength">{{ characterCount }}/{{ maxlength }}</span>
    </div>
  </div>
</template>
