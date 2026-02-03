<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'spinner' | 'skeleton' | 'dots'
    text?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    type: 'spinner',
    size: 'md',
  }
)

const spinnerSizes = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-8">
    <!-- Spinner -->
    <template v-if="type === 'spinner'">
      <svg
        :class="['animate-spin text-primary-600', spinnerSizes[size]]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </template>

    <!-- Dots -->
    <template v-else-if="type === 'dots'">
      <div class="flex space-x-2">
        <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 0ms" />
        <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 150ms" />
        <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 300ms" />
      </div>
    </template>

    <!-- Skeleton -->
    <template v-else-if="type === 'skeleton'">
      <div class="w-full space-y-3">
        <div class="h-4 bg-gray-200 rounded animate-pulse" />
        <div class="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </template>

    <p v-if="text" class="mt-3 text-sm text-gray-500">{{ text }}</p>
  </div>
</template>
