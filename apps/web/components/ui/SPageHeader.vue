<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  backTo?: string
}>()

const slots = useSlots()
const hasActions = computed(() => !!slots.actions)
</script>

<template>
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-1">
      <NuxtLink
        v-if="backTo"
        :to="backTo"
        class="p-2 -ml-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-gray-900 dark:text-slate-50">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-slate-400">{{ subtitle }}</p>
      </div>
      <div v-if="hasActions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
