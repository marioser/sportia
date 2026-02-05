<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { isAdmin } = useProfile()
const {
  syncing,
  syncProgress,
  syncAll,
  getSyncStats
} = useResultsSync()
const { fetchAthletes } = useAthletes()
const supabase = useSupabaseClient()

// Redirect if not admin
watch(isAdmin, (admin) => {
  if (admin === false) {
    navigateTo('/')
  }
}, { immediate: true })

// Stats
const stats = ref<any>(null)
const loadingStats = ref(false)

// Mapped athletes
const mappedAthletes = ref<any[]>([])
const loadingAthletes = ref(false)

// Sync log
const syncLog = ref<string[]>([])
const showSyncModal = ref(false)

const loadStats = async () => {
  loadingStats.value = true
  stats.value = await getSyncStats()
  loadingStats.value = false
}

const loadMappedAthletes = async () => {
  loadingAthletes.value = true

  try {
    // Obtener atletas con mapping confirmado
    const { data: mappings } = await supabase
      .from('athlete_external_mappings')
      .select(`
        id,
        athlete_id,
        external_name,
        sync_status,
        last_synced_at,
        results_count,
        sync_error,
        metadata
      `)
      .eq('source', 'FECNA')
      .eq('status', 'CONFIRMED')
      .order('last_synced_at', { ascending: false, nullsFirst: false })

    if (mappings) {
      // Obtener info de los atletas
      const athleteIds = mappings.map((m: any) => m.athlete_id)

      const { data: athletes } = await supabase
        .from('athletes_with_age')
        .select('*')
        .in('id', athleteIds)

      // Combinar datos
      mappedAthletes.value = mappings.map((m: any) => {
        const athlete = athletes?.find((a: any) => a.id === m.athlete_id)
        return {
          ...m,
          athlete_name: athlete ? `${athlete.first_name} ${athlete.last_name}` : m.external_name,
          athlete_age: athlete?.age,
          athlete_club: athlete?.club_name,
          document_number: athlete?.document_number
        }
      })
    }
  } catch (error) {
    console.error('Error cargando atletas:', error)
  } finally {
    loadingAthletes.value = false
  }
}

const handleSyncAll = async () => {
  syncLog.value = []
  showSyncModal.value = true

  const result = await syncAll({
    fechaInicio: '2024-01-01',
    fechaFin: new Date().toISOString().split('T')[0],
    onProgress: (current, total) => {
      syncLog.value.push(`Sincronizado ${current}/${total} atletas...`)
    }
  })

  if (result) {
    syncLog.value.push('')
    syncLog.value.push('='.repeat(60))
    syncLog.value.push(`✓ Sincronización completada`)
    syncLog.value.push(`Total: ${result.total_athletes}`)
    syncLog.value.push(`Exitosos: ${result.successful}`)
    syncLog.value.push(`Fallidos: ${result.failed}`)

    if (result.errors && result.errors.length > 0) {
      syncLog.value.push('')
      syncLog.value.push('Errores:')
      result.errors.forEach((e: any) => {
        syncLog.value.push(`  - ${e.athlete_id}: ${e.error}`)
      })
    }

    // Recargar datos
    await loadStats()
    await loadMappedAthletes()
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'SUCCESS': return 'green'
    case 'ERROR': return 'red'
    case 'IN_PROGRESS': return 'blue'
    case 'PENDING':
    default: return 'gray'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'SUCCESS': return 'Sincronizado'
    case 'ERROR': return 'Error'
    case 'IN_PROGRESS': return 'Sincronizando...'
    case 'PENDING':
    default: return 'Pendiente'
  }
}

const formatLastSync = (date: string | null) => {
  if (!date) return 'Nunca'

  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins}m`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`

  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
}

onMounted(() => {
  loadStats()
  loadMappedAthletes()
})
</script>

<template>
  <div>
    <SPageHeader
      title="Sincronización de Competencias"
      subtitle="Sincronizar resultados desde FECNA API"
      back-to="/"
    />

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-slate-400">Total Atletas</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-slate-50 mt-1">
            {{ stats?.total_athletes || 0 }}
          </p>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-slate-400">Con Mapping</p>
          <p class="text-3xl font-bold text-primary-600 mt-1">
            {{ stats?.matched_athletes || 0 }}
          </p>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-slate-400">Pendientes</p>
          <p class="text-3xl font-bold text-warning-500 mt-1">
            {{ stats?.pending_match || 0 }}
          </p>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-slate-400">Última Sync</p>
          <p class="text-sm font-medium text-gray-900 dark:text-slate-50 mt-2">
            {{ formatLastSync(stats?.last_sync_at) }}
          </p>
          <p v-if="stats?.last_sync_results" class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {{ stats.last_sync_results }} resultados
          </p>
        </div>
      </UCard>
    </div>

    <!-- Actions -->
    <UCard class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-50">
            Sincronización Masiva
          </h3>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Sincronizar todos los atletas con número de documento desde 2024
          </p>
        </div>
        <UButton
          color="primary"
          size="lg"
          :loading="syncing"
          :disabled="!stats?.matched_athletes"
          @click="handleSyncAll"
        >
          <svg v-if="!syncing" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ syncing ? 'Sincronizando...' : 'Sincronizar Todos' }}
        </UButton>
      </div>
    </UCard>

    <!-- Athletes Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            Atletas Vinculados ({{ mappedAthletes.length }})
          </h3>
          <UButton
            variant="outline"
            size="sm"
            :loading="loadingAthletes"
            @click="loadMappedAthletes"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </UButton>
        </div>
      </template>

      <SLoadingState v-if="loadingAthletes" type="skeleton" />

      <div v-else-if="mappedAthletes.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
                Atleta
              </th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
                Documento
              </th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
                Club
              </th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
                Estado
              </th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
                Última Sync
              </th>
              <th class="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
                Resultados
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr
              v-for="athlete in mappedAthletes"
              :key="athlete.id"
              class="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <td class="py-3 px-4">
                <NuxtLink
                  :to="`/athletes/${athlete.athlete_id}`"
                  class="font-medium text-primary-600 hover:text-primary-700"
                >
                  {{ athlete.athlete_name }}
                </NuxtLink>
                <p v-if="athlete.athlete_age" class="text-xs text-gray-500 dark:text-slate-400">
                  {{ athlete.athlete_age }} años
                </p>
              </td>
              <td class="py-3 px-4 text-sm">
                {{ athlete.document_number || '-' }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                {{ athlete.athlete_club || '-' }}
              </td>
              <td class="py-3 px-4">
                <SBadge
                  :text="getStatusLabel(athlete.sync_status || 'PENDING')"
                  :color="getStatusColor(athlete.sync_status || 'PENDING')"
                  size="sm"
                />
              </td>
              <td class="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">
                {{ formatLastSync(athlete.last_synced_at) }}
              </td>
              <td class="py-3 px-4 text-right text-sm font-medium">
                {{ athlete.results_count || 0 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SEmptyState
        v-else
        icon="users"
        title="Sin atletas vinculados"
        description="Agrega el número de documento a los atletas para poder sincronizar sus resultados"
        action-label="Ver atletas"
        action-to="/athletes"
      />
    </UCard>

    <!-- Sync Log Modal -->
    <SModal v-model="showSyncModal" title="Registro de Sincronización" size="lg">
      <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
        <div v-for="(line, i) in syncLog" :key="i">
          {{ line }}
        </div>
        <div v-if="syncing" class="mt-2 flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Procesando...</span>
        </div>
      </div>

      <template #footer>
        <UButton
          variant="outline"
          block
          :disabled="syncing"
          @click="showSyncModal = false"
        >
          Cerrar
        </UButton>
      </template>
    </SModal>
  </div>
</template>
