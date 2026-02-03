<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  avatar?: string
  avatarName?: string
  to?: string
  badge?: string
  badgeColor?: 'primary' | 'success' | 'warning' | 'error' | 'gray'
}>()
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    :class="to ? 'cursor-pointer' : ''"
  >
    <SAvatar
      v-if="avatar || avatarName"
      :src="avatar"
      :name="avatarName"
      size="md"
    />
    <div class="flex-1 min-w-0">
      <p class="font-medium text-gray-900 truncate">{{ title }}</p>
      <p v-if="subtitle" class="text-sm text-gray-500 truncate">{{ subtitle }}</p>
    </div>
    <SBadge v-if="badge" :color="badgeColor" :text="badge" />
    <slot name="actions" />
    <svg
      v-if="to"
      class="w-5 h-5 text-gray-400 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </component>
</template>
