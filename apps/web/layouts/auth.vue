<script setup lang="ts">
const colorMode = useColorMode()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const isDark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-800 flex flex-col transition-colors">
    <UNotifications />

    <!-- Color mode toggle in corner -->
    <div class="absolute top-4 right-4">
      <button
        type="button"
        class="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
        :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        @click="toggleColorMode"
      >
        <svg
          v-if="isDark"
          class="w-5 h-5 text-amber-400"
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
        <svg
          v-else
          class="w-5 h-5"
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
      </button>
    </div>

    <main class="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">SPORTIA</h1>
          <p class="text-gray-500 dark:text-slate-400">Measure what matters. Improve what counts.</p>
        </div>
        <slot />
      </div>
    </main>
    <footer class="py-4 text-center text-sm text-gray-400 dark:text-slate-500">
      &copy; {{ new Date().getFullYear() }} SPORTIA
    </footer>
  </div>
</template>
