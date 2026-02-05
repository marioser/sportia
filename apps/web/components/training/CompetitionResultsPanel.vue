<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

const props = defineProps<{
  athleteId: string
}>()

const supabase = useSupabaseClient()
const { error: showError } = useAppToast()

const loading = ref(false)
const events = ref<any[]>([])
const allResults = ref<any[]>([])
const showAllResults = ref(false)

// Stroke labels for display
const strokeLabels: Record<string, string> = {
  FREE: 'Libre',
  BACK: 'Espalda',
  BREAST: 'Pecho',
  FLY: 'Mariposa',
  IM: 'Combinado',
}

const formatEvent = (distance: number, stroke: string): string => {
  return `${distance}m ${strokeLabels[stroke] || stroke}`
}

const loadResults = async () => {
  if (!props.athleteId) return
  loading.value = true

  try {
    // Query results linked to this athlete, ordered by date
    const { data, error } = await supabase
      .from('swim_competition_results')
      .select('*')
      .eq('athlete_id', props.athleteId)
      .order('event_date', { ascending: true }) // Oldest first
      .limit(200)

    if (error) throw error

    // Calculate seed times (best previous time for each result)
    const resultsWithSeed = []
    const bestTimesByEvent = new Map<string, number>()

    for (const result of data || []) {
      const eventKey = `${result.distance_m}_${result.stroke}`
      const currentBest = bestTimesByEvent.get(eventKey)

      // Seed time is the best time before this competition
      const seedTime = currentBest || null

      resultsWithSeed.push({
        ...result,
        seed_time_ms: seedTime
      })

      // Update best time for this event
      if (!currentBest || result.final_time_ms < currentBest) {
        bestTimesByEvent.set(eventKey, result.final_time_ms)
      }
    }

    // Group by event for best times display
    const eventsMap = new Map<string, any>()

    for (const result of resultsWithSeed) {
      const eventKey = `${result.distance_m}_${result.stroke}`

      if (!eventsMap.has(eventKey)) {
        eventsMap.set(eventKey, {
          distance_m: result.distance_m,
          stroke: result.stroke,
          best_time_ms: result.final_time_ms,
          best_result: result,
          count: 1,
        })
      } else {
        const event = eventsMap.get(eventKey)!
        event.count++
        if (result.final_time_ms < event.best_time_ms) {
          event.best_time_ms = result.final_time_ms
          event.best_result = result
        }
      }
    }

    events.value = Array.from(eventsMap.values())

    // Reverse to show newest first in the list
    allResults.value = resultsWithSeed.reverse()
  } catch (e) {
    console.error(e)
    showError('Error obteniendo resultados de competencia')
  } finally {
    loading.value = false
  }
}

onMounted(loadResults)
watch(() => props.athleteId, loadResults)

const displayResults = computed(() =>
  showAllResults.value ? allResults.value : allResults.value.slice(0, 5)
)
</script>

<template>
  <div class="space-y-4">
    <!-- Best times by event -->
    <SCard title="Mejores Marcas en Competencia">
      <SLoadingState v-if="loading" type="skeleton" />

      <div v-else-if="events.length > 0" class="space-y-2">
        <div
          v-for="event in events"
          :key="`${event.distance_m}-${event.stroke}`"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
        >
          <div>
            <span class="font-medium text-gray-900 dark:text-slate-50">
              {{ formatEvent(event.distance_m, event.stroke) }}
            </span>
            <span class="text-gray-500 dark:text-slate-400 text-sm ml-2">
              ({{ event.count }} {{ event.count === 1 ? 'resultado' : 'resultados' }})
            </span>
          </div>
          <div class="text-right">
            <span class="font-mono font-bold text-primary-600 dark:text-primary-400">
              {{ msToTimeString(event.best_time_ms) }}
            </span>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ event.best_result.tournament_name?.substring(0, 30) }}
              <span v-if="event.best_result.tournament_name?.length > 30">...</span>
            </p>
          </div>
        </div>
      </div>

      <SEmptyState
        v-else
        icon="chart"
        title="Sin resultados de competencia"
        description="No se encontraron resultados para este atleta en la base de datos."
      />
    </SCard>

    <!-- Recent competition results -->
    <SCard v-if="allResults.length > 0" title="Historial de Competencias">
      <div class="space-y-2">
        <div
          v-for="result in displayResults"
          :key="result.id"
          class="p-3 border-b border-gray-100 dark:border-slate-700 last:border-0"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-slate-100">
                {{ formatEvent(result.distance_m, result.stroke) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400 truncate">
                {{ result.tournament_name }}
              </div>
              <div class="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {{ result.event_date ? new Date(result.event_date).toLocaleDateString('es-ES') : '' }}
              </div>
            </div>
            <div class="text-right ml-2">
              <div class="font-mono text-sm font-medium text-gray-900 dark:text-slate-100">
                {{ msToTimeString(result.final_time_ms) }}
              </div>
              <div v-if="result.seed_time_ms" class="text-xs text-gray-500 dark:text-slate-400">
                Semilla: {{ msToTimeString(result.seed_time_ms) }}
              </div>
              <div v-else class="text-xs text-gray-400 dark:text-slate-500">
                Semilla: ---
              </div>
              <div v-if="result.seed_time_ms" class="text-xs" :class="result.final_time_ms < result.seed_time_ms ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'">
                {{ result.final_time_ms < result.seed_time_ms ? '-' : '+' }}{{ Math.abs((result.final_time_ms - result.seed_time_ms) / 1000).toFixed(2) }}s
              </div>
            </div>
          </div>
        </div>

        <button
          v-if="allResults.length > 5"
          class="w-full text-center text-sm text-primary-600 dark:text-primary-400 py-2 hover:underline"
          @click="showAllResults = !showAllResults"
        >
          {{ showAllResults ? 'Ver menos' : `Ver todos (${allResults.length})` }}
        </button>
      </div>
    </SCard>
  </div>
</template>
