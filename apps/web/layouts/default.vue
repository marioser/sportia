<script setup lang="ts">
const colorMode = useColorMode()
const { isSimulating } = useSimulation()
const { effectiveIsAthlete, effectiveIsCoach, effectiveIsClubAdmin, effectiveIsAdmin } = useProfile()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const isDark = computed(() => colorMode.value === 'dark')

// Athletes should not see the Athletes tab (they only see their own profile)
const canSeeAthletesTab = computed(() => {
  return effectiveIsCoach.value || effectiveIsClubAdmin.value || effectiveIsAdmin.value
})

// Athletes should not see the Clubs tab (they see their club from their profile)
const canSeeClubsTab = computed(() => {
  return effectiveIsClubAdmin.value || effectiveIsAdmin.value
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
    <UNotifications />
    <!-- Simulation mode banner -->
    <SimulationBanner />
    <header
      class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky z-40 transition-colors"
      :class="isSimulating ? 'top-10' : 'top-0'"
    >
      <div class="px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-primary-600 dark:text-primary-400">
          SPORTIA
        </NuxtLink>
        <nav class="flex items-center gap-2">
          <slot name="header-actions" />
          <!-- Color mode toggle button -->
          <button
            type="button"
            class="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            @click="toggleColorMode"
          >
            <!-- Sun icon (shown in dark mode) -->
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
            <!-- Moon icon (shown in light mode) -->
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
        </nav>
      </div>
    </header>

    <main class="flex-1 px-4 py-4">
      <slot />
    </main>

    <nav class="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 fixed bottom-0 inset-x-0 safe-area-inset-bottom transition-colors">
      <div class="flex justify-around py-2">
        <NuxtLink
          to="/"
          class="flex flex-col items-center p-2 text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
          active-class="!text-primary-600 dark:!text-primary-400"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span class="text-xs mt-1">Inicio</span>
        </NuxtLink>

        <!-- Clubs tab - only for club admins and super admins -->
        <NuxtLink
          v-if="canSeeClubsTab"
          to="/clubs"
          class="flex flex-col items-center p-2 text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
          active-class="!text-primary-600 dark:!text-primary-400"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span class="text-xs mt-1">Clubes</span>
        </NuxtLink>

        <!-- Athletes tab - only for coaches, club admins, and super admins -->
        <NuxtLink
          v-if="canSeeAthletesTab"
          to="/athletes"
          class="flex flex-col items-center p-2 text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
          active-class="!text-primary-600 dark:!text-primary-400"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="text-xs mt-1">Atletas</span>
        </NuxtLink>

        <NuxtLink
          to="/training"
          class="flex flex-col items-center p-2 text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
          active-class="!text-primary-600 dark:!text-primary-400"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="text-xs mt-1">Entrenos</span>
        </NuxtLink>

        <NuxtLink
          to="/profile"
          class="flex flex-col items-center p-2 text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
          active-class="!text-primary-600 dark:!text-primary-400"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="text-xs mt-1">Perfil</span>
        </NuxtLink>
      </div>
    </nav>

    <div class="h-16" />
  </div>
</template>
