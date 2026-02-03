<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

const props = withDefaults(
  defineProps<{
    ms: number
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    size: 'md',
  }
)

const formattedTime = computed(() => msToTimeString(props.ms))

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }
  return sizes[props.size]
})
</script>

<template>
  <span
    class="font-mono font-bold text-primary-600"
    :class="sizeClasses"
  >
    {{ formattedTime }}
  </span>
</template>
