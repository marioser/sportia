<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

// Lazy load VChart for client-side only rendering
const VChart = defineAsyncComponent({
  loader: () => import('vue-echarts'),
  loadingComponent: {
    template: '<div class="w-full h-full flex items-center justify-center"><span class="text-gray-400 text-sm">Cargando...</span></div>',
  },
})

definePageMeta({})

const route = useRoute()
const athleteId = computed(() => route.params.id as string)
const supabase = useSupabaseClient()

const { currentAthlete, loading: loadingAthlete, fetchAthlete } = useAthletes()
const { isAthlete, isAdmin, isClubAdmin, isCoach, linkedAthlete } = useProfile()
const { exporting, exportElementToPDF } = useChartExport()

// Ref for PDF export
const chartsSection = ref<HTMLElement | null>(null)

// Check if this is the athlete viewing their own profile
const isOwnProfile = computed(() => {
  return isAthlete.value && linkedAthlete.value?.id === athleteId.value
})

// Check if user can view this athlete's times (admin, club admin, coach, or own profile)
const canViewTimes = computed(() => {
  return isAdmin.value || isClubAdmin.value || isCoach.value || isOwnProfile.value
})

// Export charts to PDF
const handleExportPDF = async () => {
  if (!chartsSection.value || !currentAthlete.value) return

  await exportElementToPDF(chartsSection.value, {
    title: 'Registro de Tiempos',
    athleteName: `${currentAthlete.value.first_name} ${currentAthlete.value.last_name}`,
    athleteInfo: `${currentAthlete.value.age_category} · ${currentAthlete.value.club_name || 'Sin club'}`,
    filename: `tiempos-${currentAthlete.value.first_name}-${currentAthlete.value.last_name}.pdf`,
  })
}

// Fetch athlete data
onMounted(() => {
  fetchAthlete(athleteId.value)
})

// Data for times
const trainingTimes = ref<any[]>([])
const competitionTimes = ref<any[]>([])
const loading = ref(true)

// Stroke labels for display
const strokeLabels: Record<string, string> = {
  FREE: 'Libre',
  BACK: 'Espalda',
  BREAST: 'Pecho',
  FLY: 'Mariposa',
  IM: 'Combinado',
}

// Fetch all time records
const fetchTimeRecords = async () => {
  loading.value = true

  // Fetch training times (from training_sets via training_sessions)
  const { data: trainingData, error: trainingError } = await supabase
    .from('training_sets')
    .select(`
      id,
      total_time_ms,
      created_at,
      training_sessions!inner (
        athlete_id,
        session_date
      ),
      tests (
        id,
        distance_m,
        pool_type,
        swim_strokes (code, name_es)
      )
    `)
    .eq('training_sessions.athlete_id', athleteId.value)
    .not('total_time_ms', 'is', null)
    .order('created_at', { ascending: true })

  if (trainingError) {
    console.error('Error fetching training times:', trainingError)
  }

  trainingTimes.value = (trainingData || []).map((t: any) => ({
    id: t.id,
    time_ms: t.total_time_ms,
    date: t.training_sessions?.session_date || t.created_at,
    source: 'training',
    test_id: t.tests?.id,
    distance: t.tests?.distance_m,
    pool_type: t.tests?.pool_type,
    stroke_code: t.tests?.swim_strokes?.code,
    stroke_name: t.tests?.swim_strokes?.name_es || strokeLabels[t.tests?.swim_strokes?.code] || t.tests?.swim_strokes?.code,
  }))

  // Fetch competition times by athlete_id (including seed times)
  const { data: competitionData, error: compError } = await supabase
    .from('swim_competition_results')
    .select('id, final_time_ms, seed_time_ms, event_date, tournament_name, distance_m, stroke')
    .eq('athlete_id', athleteId.value)
    .order('event_date', { ascending: true })

  if (compError) {
    console.error('Error fetching competition times:', compError)
  }

  competitionTimes.value = (competitionData || []).map((c: any) => ({
    id: c.id,
    time_ms: c.final_time_ms,
    seed_time_ms: c.seed_time_ms,
    date: c.event_date,
    source: 'competition',
    competition_name: c.tournament_name,
    distance: c.distance_m,
    pool_type: 'LCM', // Default, competition results don't store pool type
    stroke_code: c.stroke,
    stroke_name: strokeLabels[c.stroke] || c.stroke,
  }))

  loading.value = false
}

// Fetch times when component mounts
onMounted(() => {
  fetchTimeRecords()
})

// Combine and group times by event (stroke + distance + pool)
const timesByEvent = computed(() => {
  const allTimes = [...trainingTimes.value, ...competitionTimes.value]

  // Group by event key
  const grouped: Record<string, {
    stroke_code: string
    stroke_name: string
    distance: number
    pool_type: string
    times: Array<{
      id: string
      time_ms: number
      seed_time_ms?: number | null
      date: string
      source: 'training' | 'competition'
      competition_name?: string
    }>
  }> = {}

  allTimes.forEach((t) => {
    if (!t.stroke_code || !t.distance) return

    const key = `${t.stroke_code}-${t.distance}-${t.pool_type}`

    if (!grouped[key]) {
      grouped[key] = {
        stroke_code: t.stroke_code,
        stroke_name: t.stroke_name || t.stroke_code,
        distance: t.distance,
        pool_type: t.pool_type,
        times: [],
      }
    }

    grouped[key].times.push({
      id: t.id,
      time_ms: t.time_ms,
      seed_time_ms: t.seed_time_ms,
      date: t.date,
      source: t.source,
      competition_name: t.competition_name,
    })
  })

  // Sort times by date within each event
  Object.values(grouped).forEach((event) => {
    event.times.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  // Convert to array and sort by stroke then distance
  return Object.values(grouped).sort((a, b) => {
    if (a.stroke_code !== b.stroke_code) {
      return a.stroke_code.localeCompare(b.stroke_code)
    }
    return a.distance - b.distance
  })
})

// Stroke colors for charts
const strokeColors: Record<string, string> = {
  FREE: '#0ea5e9', // sky
  BACK: '#10b981', // emerald
  BREAST: '#f59e0b', // amber
  FLY: '#8b5cf6', // violet
  IM: '#ec4899', // pink
}

// Generate ECharts options for an event
const getChartOptions = (event: { times: Array<{ time_ms: number; seed_time_ms?: number | null; date: string; source: string }> }) => {
  const sortedTimes = [...event.times].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Separate training, competition, and seed data
  const trainingData: [string, number][] = []
  const competitionData: [string, number][] = []
  const seedData: [string, number][] = []

  sortedTimes.forEach((t: any) => {
    const dateStr = formatDate(t.date)
    if (t.source === 'training') {
      trainingData.push([dateStr, t.time_ms])
    } else {
      competitionData.push([dateStr, t.time_ms])
      // Add seed time if available
      if (t.seed_time_ms) {
        seedData.push([dateStr, t.seed_time_ms])
      }
    }
  })

  // Get min/max for Y axis (include seed times in calculation)
  const allTimeMs = [
    ...sortedTimes.map((t) => t.time_ms),
    ...sortedTimes.filter((t: any) => t.seed_time_ms).map((t: any) => t.seed_time_ms),
  ]
  const minTime = Math.min(...allTimeMs)
  const maxTime = Math.max(...allTimeMs)
  const padding = (maxTime - minTime) * 0.1 || 1000

  return {
    grid: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 25,
      containLabel: true,
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const seriesName = params.seriesName
        return `${seriesName}<br/>${params.name}: ${msToTimeString(params.value[1])}`
      },
    },
    xAxis: {
      type: 'category',
      axisLabel: {
        fontSize: 10,
        rotate: 45,
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      inverse: false, // Normal orientation: lower times at bottom (improvement goes down)
      min: Math.max(0, minTime - padding),
      max: maxTime + padding,
      axisLabel: {
        formatter: (value: number) => msToTimeString(value),
        fontSize: 10,
      },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    series: [
      {
        name: 'Entrenamiento',
        type: 'line',
        data: trainingData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#0ea5e9', width: 2 },
        itemStyle: { color: '#0ea5e9' },
      },
      {
        name: 'Competencia',
        type: 'line',
        data: competitionData,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 10,
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: 'Tiempo Semilla',
        type: 'line',
        data: seedData,
        smooth: true,
        symbol: 'triangle',
        symbolSize: 8,
        lineStyle: { color: '#a855f7', width: 2, type: 'dashed' },
        itemStyle: { color: '#a855f7' },
      },
    ],
  }
}

// Get best time for an event
const getBestTime = (times: Array<{ time_ms: number }>) => {
  if (times.length === 0) return null
  return Math.min(...times.map((t) => t.time_ms))
}

// Get latest time for an event
const getLatestTime = (times: Array<{ time_ms: number; date: string }>) => {
  if (times.length === 0) return null
  const sorted = [...times].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return sorted[0].time_ms
}

// Calculate improvement
const getImprovement = (times: Array<{ time_ms: number; date: string }>) => {
  if (times.length < 2) return null
  const sorted = [...times].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const first = sorted[0].time_ms
  const last = sorted[sorted.length - 1].time_ms
  return first - last // Positive = improved (lower time)
}

// Get first seed time for an event (the starting point)
const getFirstSeedTime = (times: Array<{ seed_time_ms?: number | null; date: string }>) => {
  const withSeed = times.filter((t) => t.seed_time_ms)
  if (withSeed.length === 0) return null
  const sorted = [...withSeed].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return sorted[0].seed_time_ms
}

// Calculate improvement from seed time to best time
const getSeedImprovement = (times: Array<{ time_ms: number; seed_time_ms?: number | null; date: string }>) => {
  const firstSeed = getFirstSeedTime(times)
  if (!firstSeed) return null
  const bestTime = getBestTime(times)
  if (!bestTime) return null
  return firstSeed - bestTime // Positive = improved from seed
}

// Format date for display
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

// Selected event for detail view
const showEventDetail = ref(false)
const selectedEventKey = ref<string>('')
const selectedEventData = computed(() => {
  if (!selectedEventKey.value) return null
  return timesByEvent.value.find(
    (e) => `${e.stroke_code}-${e.distance}-${e.pool_type}` === selectedEventKey.value
  )
})

const openEventDetail = (eventKey: string) => {
  selectedEventKey.value = eventKey
  showEventDetail.value = true
}
</script>

<template>
  <div>
    <SPageHeader
      :title="isOwnProfile ? 'Mis Tiempos' : `Tiempos de ${currentAthlete?.first_name || 'Atleta'}`"
      :back-to="isOwnProfile ? '/' : `/athletes/${athleteId}`"
    />

    <SLoadingState v-if="loadingAthlete || loading" text="Cargando tiempos..." />

    <div v-else-if="currentAthlete" class="space-y-4">
      <!-- Athlete info header -->
      <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
        <SAvatar
          :src="currentAthlete.photo_url"
          :name="`${currentAthlete.first_name} ${currentAthlete.last_name}`"
          size="lg"
        />
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-slate-50">
            {{ currentAthlete.first_name }} {{ currentAthlete.last_name }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ currentAthlete.age_category }} · {{ currentAthlete.club_name }}
          </p>
        </div>
      </div>

      <!-- Legend and export button -->
      <div class="flex items-center justify-between">
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-primary-500" />
            <span class="text-gray-600 dark:text-slate-400">Entrenamiento</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-amber-500" />
            <span class="text-gray-600 dark:text-slate-400">Competencia</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-purple-500" />
            <span class="text-gray-600 dark:text-slate-400">Tiempo Semilla</span>
          </div>
        </div>
        <!-- Export PDF button -->
        <button
          v-if="timesByEvent.length > 0"
          class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
          :disabled="exporting"
          @click="handleExportPDF"
        >
          <svg v-if="!exporting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span class="hidden sm:inline">{{ exporting ? 'Generando...' : 'PDF' }}</span>
        </button>
      </div>

      <!-- Events grid -->
      <div v-if="timesByEvent.length > 0" ref="chartsSection" class="space-y-4">
        <UCard
          v-for="event in timesByEvent"
          :key="`${event.stroke_code}-${event.distance}-${event.pool_type}`"
          class="overflow-hidden"
        >
          <!-- Event header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                :style="{ backgroundColor: strokeColors[event.stroke_code] || '#6b7280' }"
              >
                {{ event.distance }}
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-slate-50">
                  {{ event.distance }}m {{ event.stroke_name }}
                </h3>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  Piscina {{ event.pool_type === 'LCM' ? '50m' : '25m' }} · {{ event.times.length }} registros
                </p>
              </div>
            </div>

            <!-- Best time badge -->
            <div class="text-right">
              <p class="text-xs text-gray-500 dark:text-slate-400">Mejor tiempo</p>
              <p class="font-mono font-bold text-lg text-primary-600">
                {{ msToTimeString(getBestTime(event.times) || 0) }}
              </p>
            </div>
          </div>

          <!-- ECharts Line Chart -->
          <div class="h-40 bg-gray-50 dark:bg-slate-800 rounded-lg mb-4">
            <ClientOnly>
              <VChart
                :option="getChartOptions(event)"
                autoresize
                class="w-full h-full"
              />
              <template #fallback>
                <div class="w-full h-full flex items-center justify-center">
                  <span class="text-gray-400 text-sm">Cargando gráfico...</span>
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- Stats row -->
          <div class="grid grid-cols-4 gap-3 text-center">
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Semilla</p>
              <p class="font-mono text-sm font-medium text-purple-600">
                <template v-if="getFirstSeedTime(event.times)">
                  {{ msToTimeString(getFirstSeedTime(event.times) || 0) }}
                </template>
                <template v-else>--</template>
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Mejor</p>
              <p class="font-mono text-sm font-medium text-primary-600">
                {{ msToTimeString(getBestTime(event.times) || 0) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Último</p>
              <p class="font-mono text-sm font-medium">
                {{ msToTimeString(getLatestTime(event.times) || 0) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Mejora</p>
              <p
                class="font-mono text-sm font-medium"
                :class="(getSeedImprovement(event.times) || getImprovement(event.times) || 0) > 0 ? 'text-green-600' : 'text-red-600'"
              >
                <template v-if="getSeedImprovement(event.times)">
                  {{ (getSeedImprovement(event.times) || 0) > 0 ? '-' : '+' }}{{ msToTimeString(Math.abs(getSeedImprovement(event.times) || 0)) }}
                </template>
                <template v-else-if="getImprovement(event.times)">
                  {{ (getImprovement(event.times) || 0) > 0 ? '-' : '+' }}{{ msToTimeString(Math.abs(getImprovement(event.times) || 0)) }}
                </template>
                <template v-else>--</template>
              </p>
            </div>
          </div>

          <!-- View details button -->
          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              class="w-full text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2"
              @click="openEventDetail(`${event.stroke_code}-${event.distance}-${event.pool_type}`)"
            >
              Ver todos los registros
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </UCard>
      </div>

      <SEmptyState
        v-else
        icon="chart"
        title="Sin registros de tiempo"
        description="Aun no hay tiempos registrados en entrenamientos o competencias."
      />
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Atleta no encontrado"
      action-label="Volver"
      :action-to="isOwnProfile ? '/' : '/athletes'"
    />

    <!-- Detail modal -->
    <SBottomSheet v-model="showEventDetail" :title="selectedEventData ? `${selectedEventData.distance}m ${selectedEventData.stroke_name}` : ''">
      <div v-if="selectedEventData" class="space-y-3 max-h-[60vh] overflow-y-auto">
        <div
          v-for="time in [...selectedEventData.times].reverse()"
          :key="time.id"
          class="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full"
                :class="time.source === 'competition' ? 'bg-amber-500' : 'bg-primary-500'"
              />
              <div>
                <p class="font-mono font-medium text-gray-900 dark:text-slate-50">
                  {{ msToTimeString(time.time_ms) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ formatDate(time.date) }}
                  <span v-if="time.competition_name" class="ml-1">· {{ time.competition_name }}</span>
                </p>
              </div>
            </div>
            <SBadge
              :text="time.source === 'competition' ? 'Competencia' : 'Entreno'"
              :color="time.source === 'competition' ? 'amber' : 'primary'"
              size="sm"
            />
          </div>
          <!-- Seed time info for competitions -->
          <div v-if="time.seed_time_ms" class="mt-2 pl-5 flex items-center gap-2 text-xs">
            <div class="w-2 h-2 rounded-full bg-purple-500" />
            <span class="text-gray-500 dark:text-slate-400">Semilla:</span>
            <span class="font-mono text-purple-600">{{ msToTimeString(time.seed_time_ms) }}</span>
            <span
              v-if="time.seed_time_ms > time.time_ms"
              class="text-green-600"
            >
              (-{{ msToTimeString(time.seed_time_ms - time.time_ms) }})
            </span>
            <span
              v-else-if="time.seed_time_ms < time.time_ms"
              class="text-red-600"
            >
              (+{{ msToTimeString(time.time_ms - time.seed_time_ms) }})
            </span>
          </div>
        </div>
      </div>
    </SBottomSheet>
  </div>
</template>
