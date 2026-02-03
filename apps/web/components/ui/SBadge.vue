<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string
    color?: 'primary' | 'success' | 'warning' | 'error' | 'gray' | 'amber' | 'violet' | 'teal'
    size?: 'sm' | 'md'
  }>(),
  {
    color: 'gray',
    size: 'sm',
  }
)

const colorClasses = computed(() => {
  const colors: Record<string, string> = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    violet: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  }
  return colors[props.color]
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }
  return sizes[props.size]
})
</script>

<template>
  <span
    class="inline-flex items-center font-medium rounded-full"
    :class="[colorClasses, sizeClasses]"
  >
    {{ text }}
  </span>
</template>
