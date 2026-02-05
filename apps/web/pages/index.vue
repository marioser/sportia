<script setup lang="ts">
definePageMeta({

})

const { profile, primaryClubId, isAdmin, isAthlete, isCoach, isClubAdmin, linkedAthlete } = useProfile()
const { athletes, loading: loadingAthletes, fetchAthletes } = useAthletes()
const { sessions, loading: loadingSessions, fetchSessions } = useTrainingSessions()
const { canInstall, install, isOnline } = usePWAInstall()

// Fetch data on mount
onMounted(async () => {
  // Athletes only see their own sessions
  if (isAthlete.value && linkedAthlete.value) {
    await fetchSessions(linkedAthlete.value.id)
  } else if (primaryClubId.value) {
    await Promise.all([
      fetchAthletes(primaryClubId.value),
      fetchSessions(),
    ])
  } else {
    await Promise.all([
      fetchAthletes(),
      fetchSessions(),
    ])
  }
})

// For athletes: can create athletes
const canCreateAthletes = computed(() => isClubAdmin.value || isAdmin.value)
// For coaches/admins: can see athlete list
const canSeeAthleteList = computed(() => isCoach.value || isClubAdmin.value || isAdmin.value)

// Computed stats
const activeAthletes = computed(() =>
  athletes.value.filter((a) => a.active !== false)
)

const recentSessions = computed(() =>
  sessions.value.slice(0, 5)
)

const thisWeekSessions = computed(() => {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return sessions.value.filter((s) => {
    if (!s.session_date) return false
    const date = new Date(s.session_date)
    return date >= weekAgo
  })
})

const totalLoad = computed(() =>
  thisWeekSessions.value.reduce((sum, s) => sum + (s.training_load || 0), 0)
)

const loading = computed(() => loadingAthletes.value || loadingSessions.value)

const handleInstall = async () => {
  await install()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Offline indicator (client-only since isOnline is browser API) -->
    <ClientOnly>
      <div
        v-if="!isOnline"
        class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span>Sin conexion - Algunas funciones pueden estar limitadas</span>
      </div>
    </ClientOnly>

    <!-- Welcome header -->
    <div class="pt-2">
      <p class="text-gray-500 dark:text-slate-400 text-sm">Bienvenido,</p>
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">
        {{ profile?.full_name || 'Usuario' }}
      </h1>
    </div>

    <!-- Install banner (client-only since PWA install is browser API) -->
    <ClientOnly>
      <div
        v-if="canInstall"
        class="bg-primary-50 p-4 rounded-xl flex items-center justify-between"
      >
        <div>
          <p class="font-medium text-primary-900">Instala SPORTIA</p>
          <p class="text-sm text-primary-700">Acceso rapido desde tu pantalla de inicio</p>
        </div>
        <SButton variant="primary" size="sm" @click="handleInstall">
          Instalar
        </SButton>
      </div>
    </ClientOnly>

    <!-- Stats cards - Different for athletes vs coaches/admins -->
    <div v-if="canSeeAthleteList" class="grid grid-cols-3 gap-3">
      <SCard no-padding>
        <div class="p-3 text-center">
          <SLoadingState v-if="loading" type="dots" size="sm" />
          <template v-else>
            <p class="text-2xl font-bold text-primary-600">{{ activeAthletes.length }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Atletas</p>
          </template>
        </div>
      </SCard>

      <SCard no-padding>
        <div class="p-3 text-center">
          <SLoadingState v-if="loading" type="dots" size="sm" />
          <template v-else>
            <p class="text-2xl font-bold text-primary-600">{{ thisWeekSessions.length }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Sesiones (7d)</p>
          </template>
        </div>
      </SCard>

      <SCard no-padding>
        <div class="p-3 text-center">
          <SLoadingState v-if="loading" type="dots" size="sm" />
          <template v-else>
            <p class="text-2xl font-bold text-primary-600">{{ totalLoad }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Carga (7d)</p>
          </template>
        </div>
      </SCard>
    </div>

    <!-- Athlete-specific stats -->
    <div v-else-if="isAthlete" class="grid grid-cols-2 gap-3">
      <SCard no-padding>
        <div class="p-3 text-center">
          <SLoadingState v-if="loading" type="dots" size="sm" />
          <template v-else>
            <p class="text-2xl font-bold text-primary-600">{{ thisWeekSessions.length }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Mis entrenos (7d)</p>
          </template>
        </div>
      </SCard>

      <SCard no-padding>
        <div class="p-3 text-center">
          <SLoadingState v-if="loading" type="dots" size="sm" />
          <template v-else>
            <p class="text-2xl font-bold text-primary-600">{{ totalLoad }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">Mi carga (7d)</p>
          </template>
        </div>
      </SCard>
    </div>

    <!-- Quick actions - Role specific -->
    <SCard title="Acciones Rapidas">
      <div class="grid grid-cols-2 gap-3">
        <!-- Athletes: Quick actions for their data -->
        <template v-if="isAthlete && linkedAthlete">
          <NuxtLink
            to="/training/new"
            class="flex flex-col items-center p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
          >
            <div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span class="text-sm font-medium text-primary-900 dark:text-primary-100">Registrar Entreno</span>
          </NuxtLink>

          <NuxtLink
            to="/training"
            class="flex flex-col items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Mis Entrenos</span>
          </NuxtLink>

          <NuxtLink
            :to="`/athletes/${linkedAthlete.id}/achievements`"
            class="flex flex-col items-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
          >
            <div class="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-violet-900 dark:text-violet-100">Objetivos y Logros</span>
          </NuxtLink>

          <NuxtLink
            :to="`/athletes/${linkedAthlete.id}/times`"
            class="flex flex-col items-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
          >
            <div class="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-teal-900 dark:text-teal-100">Mis Tiempos</span>
          </NuxtLink>

          <NuxtLink
            :to="`/athletes/${linkedAthlete.id}#competitions`"
            class="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div class="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-amber-900 dark:text-amber-100">Campeonatos</span>
          </NuxtLink>

          <NuxtLink
            :to="`/athletes/${linkedAthlete.id}`"
            class="flex flex-col items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-slate-900 dark:text-slate-100">Mi Perfil</span>
          </NuxtLink>
        </template>

        <!-- Coaches and admins: Create training and athlete -->
        <template v-else>
          <NuxtLink
            to="/training/new"
            class="flex flex-col items-center p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
          >
            <div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span class="text-sm font-medium text-primary-900 dark:text-primary-100">Nuevo Entreno</span>
          </NuxtLink>

          <NuxtLink
            v-if="canCreateAthletes"
            to="/athletes/new"
            class="flex flex-col items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Nuevo Atleta</span>
          </NuxtLink>

          <NuxtLink
            v-else
            to="/athletes"
            class="flex flex-col items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">Ver Atletas</span>
          </NuxtLink>
        </template>
      </div>
    </SCard>

    <!-- Recent activity -->
    <SCard title="Actividad Reciente">
      <template #actions>
        <NuxtLink to="/training" class="text-sm text-primary-600 font-medium hover:underline">
          Ver todo
        </NuxtLink>
      </template>

      <SLoadingState v-if="loading" type="skeleton" />
      <div v-else-if="recentSessions.length > 0" class="space-y-2">
        <NuxtLink
          v-for="session in recentSessions"
          :key="session.id!"
          :to="`/training/${session.id}`"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ session.athlete_name }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ session.session_date }}</p>
          </div>
          <div class="text-right">
            <SBadge :text="`RPE ${session.session_rpe}`" color="primary" />
          </div>
        </NuxtLink>
      </div>
      <SEmptyState
        v-else
        icon="chart"
        title="Sin actividad"
        description="Registra tu primer entrenamiento"
      />
    </SCard>

    <!-- Athletes preview - only for coaches and admins -->
    <SCard v-if="canSeeAthleteList && activeAthletes.length > 0" title="Tus Atletas">
      <template #actions>
        <NuxtLink to="/athletes" class="text-sm text-primary-600 font-medium hover:underline">
          Ver todos
        </NuxtLink>
      </template>

      <div class="flex -space-x-2 overflow-hidden">
        <SAvatar
          v-for="athlete in activeAthletes.slice(0, 8)"
          :key="athlete.id!"
          :src="athlete.photo_url"
          :name="`${athlete.first_name} ${athlete.last_name}`"
          size="md"
          class="ring-2 ring-white dark:ring-slate-800"
        />
        <div
          v-if="activeAthletes.length > 8"
          class="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-slate-300"
        >
          +{{ activeAthletes.length - 8 }}
        </div>
      </div>
    </SCard>

    <!-- Admin section (client-only since isAdmin depends on async profile) -->
    <ClientOnly>
      <SCard v-if="isAdmin" title="Administración">
      <div class="grid grid-cols-2 gap-3">
        <NuxtLink
          to="/objectives"
          class="flex flex-col items-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
        >
          <div class="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center mb-2">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-sm font-medium text-violet-900 dark:text-violet-100">Objetivos</span>
          <span class="text-xs text-violet-600 dark:text-violet-400">Metas y medallas</span>
        </NuxtLink>

        <NuxtLink
          to="/competitions"
          class="flex flex-col items-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
        >
          <div class="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mb-2">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span class="text-sm font-medium text-teal-900 dark:text-teal-100">Competencias</span>
          <span class="text-xs text-teal-600 dark:text-teal-400">Buscar resultados</span>
        </NuxtLink>

        <NuxtLink
          to="/admin/matching"
          class="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <div class="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mb-2">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <span class="text-sm font-medium text-amber-900 dark:text-amber-100">Matching</span>
          <span class="text-xs text-amber-600 dark:text-amber-400">Vincular atletas</span>
        </NuxtLink>

        <NuxtLink
          to="/admin/sync"
          class="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span class="text-sm font-medium text-blue-900 dark:text-blue-100">Sincronización</span>
          <span class="text-xs text-blue-600 dark:text-blue-400">Competencias FECNA</span>
        </NuxtLink>
      </div>
    </SCard>
    </ClientOnly>
  </div>
</template>
