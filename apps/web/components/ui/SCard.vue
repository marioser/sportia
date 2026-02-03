<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  noPadding?: boolean
}>()
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-dark-sm border border-gray-100 dark:border-slate-700 transition-colors">
    <div
      v-if="title || $slots.actions"
      class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700"
    >
      <div>
        <h3 v-if="title" class="font-semibold text-gray-900 dark:text-slate-50">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-slate-400">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>
    <div :class="noPadding ? '' : 'p-4'">
      <slot />
    </div>
  </div>
</template>
