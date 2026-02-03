<script setup lang="ts">
defineProps<{
  icon?: 'plus' | 'edit' | 'check'
  position?: 'bottom-right' | 'bottom-center'
  to?: string
}>()

const emit = defineEmits<{
  click: []
}>()

const icons = {
  plus: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`,
  edit: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />`,
  check: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`,
}

const positionClasses = {
  'bottom-right': 'right-4 bottom-20',
  'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20',
}
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'button'"
    :to="to"
    class="fixed z-40 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all"
    :class="positionClasses[position || 'bottom-right']"
    @click="!to && emit('click')"
  >
    <svg
      class="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      v-html="icons[icon || 'plus']"
    />
  </component>
</template>
