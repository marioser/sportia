<script setup lang="ts">
import type { UnmatchedSwimmer, TeamSummary } from '~/composables/useMatching'

definePageMeta({
  
})

const {
  loading,
  stats,
  unmatchedSummary,
  searchResults,
  teamSwimmersCache,
  fetchStats,
  fetchUnmatchedSummary,
  fetchTeamSwimmers,
  searchMatches,
  createMatch,
  confirmMatch,
  autoMatch,
  clearTeamCache,
  clearAllCache,
  formatSimilarity,
} = useMatching()

const { athletes, fetchAthletes } = useAthletes()

// Tabs
type Tab = 'unmatched' | 'search'
const activeTab = ref<Tab>('unmatched')

// Search
const searchQuery = ref('')
const selectedUnmatched = ref<string | null>(null)

// Expanded teams (for collapsible UI)
const expandedTeams = ref<Set<string>>(new Set())

// Loading state for individual teams
const loadingTeams = ref<Set<string>>(new Set())

// Modal for manual matching
const showMatchModal = ref(false)
const selectedSwimmer = ref<UnmatchedSwimmer | null>(null)
const selectedAthleteId = ref<string | undefined>(undefined)
const matchingInProgress = ref(false)

// Auto-match modal
const showAutoMatchModal = ref(false)
const autoMatchConfidence = ref(0.8)
const autoMatchPreview = ref<any>(null)

// Initial loading state
const initialLoading = ref(true)

// Load initial data
onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchUnmatchedSummary(),
    fetchAthletes(),
  ])
  initialLoading.value = false
})

// Toggle team expansion (lazy load swimmers)
const toggleTeam = async (teamCode: string) => {
  if (expandedTeams.value.has(teamCode)) {
    expandedTeams.value.delete(teamCode)
  } else {
    expandedTeams.value.add(teamCode)
    // Lazy load swimmers if not cached
    if (!teamSwimmersCache.value[teamCode]) {
      loadingTeams.value.add(teamCode)
      await fetchTeamSwimmers(teamCode)
      loadingTeams.value.delete(teamCode)
    }
  }
}

// Normalize gender values (FECNA uses different formats)
const isMale = (gender: string) => {
  const g = gender?.toLowerCase()
  return g === 'm' || g === 'men' || g === 'hombres' || g === 'male' || g === 'masculino'
}

const isFemale = (gender: string) => {
  const g = gender?.toLowerCase()
  return g === 'f' || g === 'women' || g === 'mujeres' || g === 'female' || g === 'femenino'
}

// Get swimmers by gender for a team
const getTeamSwimmersByGender = (teamCode: string) => {
  const swimmers = teamSwimmersCache.value[teamCode] || []
  const males = swimmers
    .filter((s) => isMale(s.gender))
    .sort((a, b) => a.swimmer_name.localeCompare(b.swimmer_name))
  const females = swimmers
    .filter((s) => isFemale(s.gender))
    .sort((a, b) => a.swimmer_name.localeCompare(b.swimmer_name))
  return { males, females }
}

// Athlete options for matching dropdown
const athleteOptions = computed(() =>
  athletes.value
    .filter((a) => a.active !== false)
    .map((a) => ({
      label: `${a.first_name} ${a.last_name} (${a.sex === 'M' ? 'M' : 'F'}, ${a.age} años)`,
      value: a.id!,
    }))
)

// Total unmatched count
const totalUnmatched = computed(() =>
  unmatchedSummary.value.reduce((sum, t) => sum + t.swimmer_count, 0)
)

// Handle tab change
const handleTabChange = async (tab: Tab) => {
  activeTab.value = tab
}

// Search for matches
const handleSearch = async () => {
  if (searchQuery.value.length < 2) return
  await searchMatches(searchQuery.value)
}

// Find matches for unmatched swimmer
const handleFindMatches = async (swimmer: UnmatchedSwimmer) => {
  selectedUnmatched.value = swimmer.swimmer_name
  await searchMatches(swimmer.swimmer_name)
  activeTab.value = 'search'
  searchQuery.value = swimmer.swimmer_name
}

// Open match modal for a swimmer
const openMatchModal = (swimmer: UnmatchedSwimmer) => {
  selectedSwimmer.value = swimmer
  selectedAthleteId.value = undefined
  showMatchModal.value = true
}

// Confirm the athlete match
const handleConfirmMatch = async () => {
  if (!selectedSwimmer.value || !selectedAthleteId.value) return

  matchingInProgress.value = true
  try {
    const match = await createMatch(
      selectedSwimmer.value.swimmer_name,
      selectedAthleteId.value,
      1.0,
      { team_code: selectedSwimmer.value.team_code, source: 'admin_matching' }
    )

    if (match) {
      await confirmMatch(match.id, selectedAthleteId.value)
      // Clear cache for this team and refresh
      clearTeamCache(selectedSwimmer.value.team_code)
      await Promise.all([
        fetchStats(),
        fetchUnmatchedSummary(),
      ])
      // Reload team swimmers if expanded
      if (expandedTeams.value.has(selectedSwimmer.value.team_code)) {
        await fetchTeamSwimmers(selectedSwimmer.value.team_code)
      }
    }

    showMatchModal.value = false
    selectedSwimmer.value = null
    selectedAthleteId.value = undefined
  } finally {
    matchingInProgress.value = false
  }
}

// Quick confirm from search results
const handleQuickConfirm = async (externalName: string, athleteId: string) => {
  matchingInProgress.value = true
  try {
    const match = await createMatch(externalName, athleteId, 1.0)
    if (match) {
      await confirmMatch(match.id, athleteId)
      clearAllCache()
      await Promise.all([
        fetchStats(),
        fetchUnmatchedSummary(),
      ])
      searchResults.value = []
      selectedUnmatched.value = null
    }
  } finally {
    matchingInProgress.value = false
  }
}

// Preview auto-match
const handleAutoMatchPreview = async () => {
  autoMatchPreview.value = await autoMatch(autoMatchConfidence.value, true)
}

// Execute auto-match
const handleAutoMatchExecute = async () => {
  await autoMatch(autoMatchConfidence.value, false)
  showAutoMatchModal.value = false
  autoMatchPreview.value = null
  clearAllCache()
  await Promise.all([fetchStats(), fetchUnmatchedSummary()])
}

// Refresh data
const handleRefresh = async () => {
  clearAllCache()
  expandedTeams.value.clear()
  await Promise.all([
    fetchStats(),
    fetchUnmatchedSummary(),
  ])
}
</script>

<template>
  <div>
    <SPageHeader
      title="Matching de Atletas"
      subtitle="Vincula atletas externos con el sistema"
    >
      <template #actions>
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-arrow-path"
            color="gray"
            variant="ghost"
            size="sm"
            :loading="loading"
            @click="handleRefresh"
          />
          <UButton
            icon="i-heroicons-sparkles"
            color="primary"
            variant="soft"
            size="sm"
            @click="showAutoMatchModal = true"
          >
            Auto-match
          </UButton>
        </div>
      </template>
    </SPageHeader>

    <!-- Stats cards skeleton -->
    <div v-if="initialLoading" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <SCard v-for="i in 4" :key="i" class="!p-3">
        <div class="animate-pulse">
          <div class="h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
          <div class="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
        </div>
      </SCard>
    </div>

    <!-- Stats cards -->
    <div v-else-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <SCard class="!p-3">
        <div class="text-2xl font-bold text-warning-600">
          {{ totalUnmatched }}
        </div>
        <div class="text-sm text-gray-500 dark:text-slate-400">Sin emparejar</div>
      </SCard>
      <SCard class="!p-3">
        <div class="text-2xl font-bold text-success-600">
          {{ stats.athlete_mappings.confirmed }}
        </div>
        <div class="text-sm text-gray-500 dark:text-slate-400">Confirmados</div>
      </SCard>
      <SCard class="!p-3">
        <div class="text-2xl font-bold text-primary-600">
          {{ stats.competition_results.linked }}
        </div>
        <div class="text-sm text-gray-500 dark:text-slate-400">Resultados vinculados</div>
      </SCard>
      <SCard class="!p-3">
        <div class="text-2xl font-bold text-gray-600 dark:text-slate-400">
          {{ unmatchedSummary.length }}
        </div>
        <div class="text-sm text-gray-500 dark:text-slate-400">Equipos</div>
      </SCard>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-4 border-b border-gray-200 dark:border-slate-700">
      <button
        class="px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'unmatched'
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'"
        @click="handleTabChange('unmatched')"
      >
        Sin emparejar ({{ totalUnmatched }})
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'search'
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'"
        @click="handleTabChange('search')"
      >
        Buscar
      </button>
    </div>

    <!-- Team list skeleton -->
    <div v-if="initialLoading && activeTab === 'unmatched'" class="space-y-2">
      <div
        v-for="i in 6"
        :key="i"
        class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden animate-pulse"
      >
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700" />
            <div>
              <div class="h-5 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
              <div class="h-3 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-5 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
            <div class="h-5 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- Unmatched swimmers tab (collapsible by team) -->
    <div v-else-if="activeTab === 'unmatched'">
      <div v-if="unmatchedSummary.length > 0" class="space-y-2">
        <!-- Collapsible team cards -->
        <div
          v-for="team in unmatchedSummary"
          :key="team.team_code"
          class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
        >
          <!-- Team header (clickable to expand) -->
          <button
            class="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
            @click="toggleTeam(team.team_code)"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center"
                :class="expandedTeams.has(team.team_code) ? 'rotate-90' : ''"
              >
                <svg class="w-4 h-4 text-primary-600 dark:text-primary-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div>
                <span class="font-mono font-bold text-gray-900 dark:text-slate-50">
                  {{ team.team_code }}
                </span>
                <span class="text-sm text-gray-500 dark:text-slate-400 ml-2">
                  {{ team.swimmer_count }} nadadores
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                M: {{ team.male_count }}
              </span>
              <span class="text-xs bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded">
                F: {{ team.female_count }}
              </span>
            </div>
          </button>

          <!-- Expanded content -->
          <div v-if="expandedTeams.has(team.team_code)" class="p-3 border-t border-gray-200 dark:border-slate-700">
            <!-- Skeleton loading for swimmers -->
            <div v-if="loadingTeams.has(team.team_code)" class="space-y-4 animate-pulse">
              <!-- Masculino skeleton -->
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900" />
                  <div class="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
                <div class="space-y-1">
                  <div
                    v-for="j in 3"
                    :key="`m-${j}`"
                    class="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-700"
                  >
                    <div class="flex-1">
                      <div class="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
                      <div class="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div class="flex gap-1">
                      <div class="w-7 h-7 bg-gray-200 dark:bg-slate-700 rounded" />
                      <div class="w-7 h-7 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                </div>
              </div>
              <!-- Femenino skeleton -->
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900" />
                  <div class="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
                <div class="space-y-1">
                  <div
                    v-for="j in 2"
                    :key="`f-${j}`"
                    class="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-700"
                  >
                    <div class="flex-1">
                      <div class="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
                      <div class="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div class="flex gap-1">
                      <div class="w-7 h-7 bg-gray-200 dark:bg-slate-700 rounded" />
                      <div class="w-7 h-7 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Swimmers grouped by gender -->
            <div v-else class="space-y-4 max-h-96 overflow-y-auto">
              <!-- Masculino -->
              <div v-if="getTeamSwimmersByGender(team.team_code).males.length > 0">
                <h5 class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs">M</span>
                  Masculino ({{ getTeamSwimmersByGender(team.team_code).males.length }})
                </h5>
                <div class="space-y-1">
                  <div
                    v-for="swimmer in getTeamSwimmersByGender(team.team_code).males"
                    :key="swimmer.swimmer_name_norm"
                    class="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-700"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-slate-50 truncate">
                        {{ swimmer.swimmer_name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ swimmer.result_count }} resultados
                      </p>
                    </div>
                    <div class="flex gap-1 ml-2">
                      <UButton
                        icon="i-heroicons-magnifying-glass"
                        color="gray"
                        variant="ghost"
                        size="xs"
                        @click.stop="handleFindMatches(swimmer)"
                      />
                      <UButton
                        icon="i-heroicons-link"
                        color="primary"
                        variant="soft"
                        size="xs"
                        @click.stop="openMatchModal(swimmer)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Femenino -->
              <div v-if="getTeamSwimmersByGender(team.team_code).females.length > 0">
                <h5 class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center text-pink-600 dark:text-pink-400 text-xs">F</span>
                  Femenino ({{ getTeamSwimmersByGender(team.team_code).females.length }})
                </h5>
                <div class="space-y-1">
                  <div
                    v-for="swimmer in getTeamSwimmersByGender(team.team_code).females"
                    :key="swimmer.swimmer_name_norm"
                    class="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-700"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-slate-50 truncate">
                        {{ swimmer.swimmer_name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">
                        {{ swimmer.result_count }} resultados
                      </p>
                    </div>
                    <div class="flex gap-1 ml-2">
                      <UButton
                        icon="i-heroicons-magnifying-glass"
                        color="gray"
                        variant="ghost"
                        size="xs"
                        @click.stop="handleFindMatches(swimmer)"
                      />
                      <UButton
                        icon="i-heroicons-link"
                        color="primary"
                        variant="soft"
                        size="xs"
                        @click.stop="openMatchModal(swimmer)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty state if no swimmers loaded -->
              <div
                v-if="getTeamSwimmersByGender(team.team_code).males.length === 0 && getTeamSwimmersByGender(team.team_code).females.length === 0"
                class="text-center py-4 text-gray-500 dark:text-slate-400 text-sm"
              >
                No se encontraron nadadores sin emparejar
              </div>
            </div>
          </div>
        </div>
      </div>
      <SEmptyState
        v-else
        icon="users"
        title="Todos emparejados"
        description="No hay nadadores externos sin emparejar"
      />
    </div>

    <!-- Search tab -->
    <div v-else-if="activeTab === 'search'">
      <div class="mb-4">
        <UInput
          v-model="searchQuery"
          placeholder="Buscar atleta externo..."
          icon="i-heroicons-magnifying-glass"
          size="lg"
          @keyup.enter="handleSearch"
        />
      </div>

      <div v-if="selectedUnmatched" class="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <div class="text-sm text-primary-600 dark:text-primary-400">
          Buscando matches para: <strong>{{ selectedUnmatched }}</strong>
        </div>
      </div>

      <div v-if="searchResults.length > 0" class="space-y-2">
        <SCard
          v-for="result in searchResults"
          :key="result.athlete_id"
          class="!p-3"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-gray-900 dark:text-slate-50">
                {{ result.full_name }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ formatSimilarity(result.similarity_score) }} similitud
                <span v-if="result.club_name" class="ml-2">· {{ result.club_name }}</span>
              </div>
            </div>
            <UButton
              v-if="selectedUnmatched"
              icon="i-heroicons-link"
              color="primary"
              variant="soft"
              size="xs"
              :loading="matchingInProgress"
              @click="handleQuickConfirm(selectedUnmatched, result.athlete_id)"
            >
              Vincular
            </UButton>
          </div>
        </SCard>
      </div>
      <SEmptyState
        v-else-if="searchQuery.length >= 2"
        icon="search"
        title="Sin resultados"
        description="No se encontraron atletas con ese nombre"
      />
    </div>

    <!-- Match Swimmer Modal -->
    <SModal v-model="showMatchModal" title="Emparejar Nadador">
      <div v-if="selectedSwimmer" class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <p class="font-medium text-gray-900 dark:text-slate-50">
            {{ selectedSwimmer.swimmer_name }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ isMale(selectedSwimmer.gender) ? 'Masculino' : 'Femenino' }}
            · {{ selectedSwimmer.result_count }} resultados
            · {{ selectedSwimmer.team_code }}
          </p>
        </div>

        <UFormGroup label="Seleccionar atleta">
          <USelectMenu
            v-model="selectedAthleteId"
            :options="athleteOptions"
            value-attribute="value"
            option-attribute="label"
            searchable
            placeholder="Buscar atleta..."
          />
        </UFormGroup>

        <p v-if="selectedAthleteId" class="text-xs text-gray-500 dark:text-slate-500">
          Al confirmar, los resultados de "{{ selectedSwimmer.swimmer_name }}" se vincularán
          al atleta seleccionado.
        </p>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showMatchModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="primary"
            class="flex-1"
            :disabled="!selectedAthleteId"
            :loading="matchingInProgress"
            @click="handleConfirmMatch"
          >
            Confirmar
          </SButton>
        </div>
      </template>
    </SModal>

    <!-- Auto-match modal -->
    <SModal v-model="showAutoMatchModal" title="Auto-match">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-slate-400">
          Confirma automáticamente los matches con alta confianza.
        </p>

        <UFormGroup label="Confianza mínima">
          <USelect
            v-model="autoMatchConfidence"
            :options="[
              { label: '60%', value: 0.6 },
              { label: '65%', value: 0.65 },
              { label: '70%', value: 0.7 },
              { label: '75%', value: 0.75 },
              { label: '80%', value: 0.8 },
              { label: '85%', value: 0.85 },
              { label: '90%', value: 0.9 },
              { label: '95%', value: 0.95 },
              { label: '99%', value: 0.99 },
            ]"
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>
        <p class="text-xs text-gray-500 dark:text-slate-500">
          60-70%: Más matches, menor precisión · 80%: Balanceado · 90-99%: Alta precisión
        </p>

        <UButton
          block
          color="gray"
          variant="soft"
          :loading="loading"
          @click="handleAutoMatchPreview"
        >
          Vista previa
        </UButton>

        <div v-if="autoMatchPreview" class="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <p class="text-sm">
            <strong>{{ autoMatchPreview.wouldConfirm || 0 }}</strong>
            matches serían confirmados automáticamente.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showAutoMatchModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="primary"
            class="flex-1"
            :disabled="!autoMatchPreview?.wouldConfirm"
            :loading="loading"
            @click="handleAutoMatchExecute"
          >
            Ejecutar
          </SButton>
        </div>
      </template>
    </SModal>
  </div>
</template>
