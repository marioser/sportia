<script setup lang="ts">
defineProps<{
  loading?: boolean
  emptyText?: string
  emptyIcon?: 'users' | 'chart' | 'calendar' | 'search' | 'inbox'
}>()

const slots = useSlots()
const hasItems = computed(() => !!slots.default)
</script>

<template>
  <div>
    <SLoadingState v-if="loading" type="skeleton" />
    <div v-else-if="hasItems" class="divide-y divide-gray-100">
      <slot />
    </div>
    <SEmptyState
      v-else
      :icon="emptyIcon || 'inbox'"
      :title="emptyText || 'Sin elementos'"
    />
  </div>
</template>
