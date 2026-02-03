<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

definePageMeta({

})

// Simple debounce helper
function useDebounceFn<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const {
  loading,
  loadingOptions,
  results,
  totalCount,
  tournaments,
  teamCodes,
  searchResults,
  fetchTournaments,
  fetchTeamCodes,
  formatEvent,
} = useCompetitionResults()

// Search filters
const filters = reactive({
  swimmer_name: '',
  tournament: undefined as string | undefined,
  team_code: undefined as string | undefined,
  distance: undefined as number | undefined,
  stroke: undefined as string | undefined,
  gender: undefined as string | undefined,
  year: undefined as number | undefined,
})

// Track if initial search has been done
const hasSearched = ref(false)

// Count active filters (for 3-minimum validation)
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.swimmer_name && filters.swimmer_name.length >= 3) count++
  if (filters.tournament) count++
  if (filters.team_code) count++
  if (filters.distance) count++
  if (filters.stroke) count++
  if (filters.gender) count++
  if (filters.year) count++
  return count
})

const canSearch = computed(() => activeFiltersCount.value >= 3)

// Filter options
const distanceOptions = [
  { label: 'Todas', value: undefined },
  { label: '50m', value: 50 },
  { label: '100m', value: 100 },
  { label: '200m', value: 200 },
  { label: '400m', value: 400 },
  { label: '800m', value: 800 },
  { label: '1500m', value: 1500 },
]

const strokeOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Libre', value: 'FREE' },
  { label: 'Espalda', value: 'BACK' },
  { label: 'Pecho', value: 'BREAST' },
  { label: 'Mariposa', value: 'FLY' },
  { label: 'Combinado', value: 'IM' },
]

const genderOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
]

const currentYear = new Date().getFullYear()
const yearOptions = [
  { label: 'Todos', value: undefined },
  ...Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - i),
    value: currentYear - i,
  })),
]

// Tournament options from composable
const tournamentOptions = computed(() => [
  { label: 'Todas las competencias', value: undefined },
  ...tournaments.value.map((t) => ({
    label: `${t.tournament_name} (${t.year})`,
    value: t.tournament_name,
  })),
])

// Team code options from composable
const teamCodeOptions = computed(() => [
  { label: 'Todos los clubes', value: undefined },
  ...teamCodes.value.map((t) => ({
    label: `${t.team_code} (${t.result_count})`,
    value: t.team_code,
  })),
])

// Pagination
const page = ref(1)
const pageSize = 50

// Perform search
const doSearch = async () => {
  if (!canSearch.value) return

  page.value = 1
  hasSearched.value = true
  await searchResults(
    {
      swimmer_name: filters.swimmer_name || undefined,
      tournament: filters.tournament,
      team_code: filters.team_code,
      distance: filters.distance,
      stroke: filters.stroke,
      gender: filters.gender,
      year: filters.year,
    },
    pageSize,
    0
  )
}

// Load more results
const loadMore = async () => {
  page.value++
  await searchResults(
    {
      swimmer_name: filters.swimmer_name || undefined,
      tournament: filters.tournament,
      team_code: filters.team_code,
      distance: filters.distance,
      stroke: filters.stroke,
      gender: filters.gender,
      year: filters.year,
    },
    pageSize,
    (page.value - 1) * pageSize
  )
}

// Load filter options on mount (NOT search results)
onMounted(async () => {
  await Promise.all([fetchTournaments(), fetchTeamCodes()])
})

// Debounced search on swimmer name change
const debouncedSearch = useDebounceFn(doSearch, 300)

watch(
  () => filters.swimmer_name,
  () => {
    if (canSearch.value) {
      debouncedSearch()
    }
  }
)

// Watch other filters for immediate search when criteria met
watch(
  () => [
    filters.tournament,
    filters.team_code,
    filters.distance,
    filters.stroke,
    filters.gender,
    filters.year,
  ],
  () => {
    if (canSearch.value) {
      doSearch()
    }
  }
)
</script>

<template>
  <div>
    <SPageHeader
      title="Resultados de Competencia"
      subtitle="Busca y compara tiempos de competencias oficiales"
    />

    <!-- Search filters -->
    <SCard class="mb-4">
      <div class="space-y-4">
        <!-- Swimmer name search -->
        <UInput
          v-model="filters.swimmer_name"
          placeholder="Nombre del nadador (mínimo 3 caracteres)..."
          icon="i-heroicons-magnifying-glass"
          size="lg"
        />

        <!-- Tournament and Club selects -->
        <div class="grid grid-cols-2 gap-3">
          <USelectMenu
            v-model="filters.tournament"
            :options="tournamentOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Competencia"
            searchable
            :loading="loadingOptions"
          />
          <USelectMenu
            v-model="filters.team_code"
            :options="teamCodeOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Club"
            searchable
            :loading="loadingOptions"
          />
        </div>

        <!-- Other filters -->
        <div class="grid grid-cols-2 gap-3">
          <USelectMenu
            v-model="filters.distance"
            :options="distanceOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Distancia"
          />
          <USelectMenu
            v-model="filters.stroke"
            :options="strokeOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Estilo"
          />
          <USelectMenu
            v-model="filters.gender"
            :options="genderOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Género"
          />
          <USelectMenu
            v-model="filters.year"
            :options="yearOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Año"
          />
        </div>

        <!-- Search button and filter count -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500 dark:text-slate-400">
            <span v-if="!canSearch">
              Selecciona al menos 3 filtros para buscar
              <span class="font-medium">({{ activeFiltersCount }}/3)</span>
            </span>
            <span v-else class="text-green-600 dark:text-green-400">
              {{ activeFiltersCount }} filtros activos
            </span>
          </div>
          <UButton
            color="primary"
            :disabled="!canSearch"
            :loading="loading"
            @click="doSearch"
          >
            Buscar
          </UButton>
        </div>
      </div>
    </SCard>

    <!-- Initial state - no search yet -->
    <SEmptyState
      v-if="!hasSearched"
      icon="search"
      title="Buscar resultados"
      description="Selecciona al menos 3 filtros y presiona Buscar para ver los resultados de competencia."
    />

    <!-- Results count -->
    <div v-else-if="hasSearched" class="text-sm text-gray-500 dark:text-slate-400 mb-2">
      {{ totalCount.toLocaleString() }} resultados encontrados
    </div>

    <!-- Loading state -->
    <SLoadingState v-if="loading && results.length === 0 && hasSearched" text="Buscando..." />

    <!-- Results list -->
    <div v-else-if="results.length > 0" class="space-y-2">
      <SCard
        v-for="result in results"
        :key="result.id"
        class="!p-3"
      >
        <div class="flex items-center gap-3">
          <!-- Avatar with gender styling -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            :class="result.gender === 'M' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'"
          >
            <!-- Male avatar -->
            <svg
              v-if="result.gender === 'M'"
              class="w-10 h-10 text-blue-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" fill="currentColor"/>
              <path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" fill="currentColor"/>
            </svg>
            <!-- Female avatar -->
            <svg
              v-else
              class="w-10 h-10 text-pink-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="4" fill="currentColor"/>
              <ellipse cx="12" cy="7" rx="5" ry="2" fill="currentColor" opacity="0.5"/>
              <path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" fill="currentColor"/>
            </svg>
          </div>

          <!-- Swimmer info -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-slate-50 truncate">
              {{ result.swimmer_name }}
            </div>
            <div class="text-sm text-gray-500 dark:text-slate-400">
              {{ formatEvent(result.distance_m, result.stroke) }}
              <span v-if="result.team_code" class="ml-1">({{ result.team_code }})</span>
            </div>
            <div class="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {{ result.tournament_name }}
              <span v-if="result.event_date">· {{ result.event_date }}</span>
            </div>
          </div>

          <!-- Time -->
          <div class="text-right ml-3">
            <div class="text-lg font-mono font-bold text-primary-600 dark:text-primary-400">
              {{ msToTimeString(result.final_time_ms) }}
            </div>
            <div v-if="result.rank" class="text-xs text-gray-500 dark:text-slate-400">
              #{{ result.rank }}
            </div>
          </div>
        </div>
      </SCard>

      <!-- Load more button -->
      <div v-if="results.length < totalCount" class="pt-4">
        <UButton
          block
          color="gray"
          variant="soft"
          :loading="loading"
          @click="loadMore"
        >
          Cargar más resultados ({{ results.length }}/{{ totalCount.toLocaleString() }})
        </UButton>
      </div>
    </div>

    <!-- No results after search -->
    <SEmptyState
      v-else-if="hasSearched && !loading"
      icon="search"
      title="Sin resultados"
      description="No se encontraron resultados con los filtros seleccionados. Intenta con otros filtros."
    />
  </div>
</template>
