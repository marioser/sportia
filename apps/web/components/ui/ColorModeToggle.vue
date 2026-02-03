<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})

const toggleColorMode = () => {
  isDark.value = !isDark.value
}

const modeLabel = computed(() => isDark.value ? 'Modo oscuro' : 'Modo claro')
</script>

<template>
  <button
    type="button"
    class="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
    @click="toggleColorMode"
  >
    <div class="flex items-center gap-3">
      <!-- Sun icon for light mode -->
      <svg
        v-if="!isDark"
        class="w-5 h-5 text-amber-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <!-- Moon icon for dark mode -->
      <svg
        v-else
        class="w-5 h-5 text-primary-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
      <span class="text-gray-900 dark:text-slate-100">{{ modeLabel }}</span>
    </div>

    <!-- Toggle switch -->
    <div
      class="relative w-11 h-6 rounded-full transition-colors"
      :class="isDark ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-600'"
    >
      <div
        class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
        :class="isDark ? 'translate-x-5' : 'translate-x-0.5'"
      />
    </div>
  </button>
</template>
