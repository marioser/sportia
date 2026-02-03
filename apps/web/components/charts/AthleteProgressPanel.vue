<script setup lang="ts">
const props = defineProps<{
  athleteId: string
}>()

// Fetch tests that the athlete has data for
const supabase = useSupabaseClient()
const availableTests = ref<Array<{ id: number; name: string }>>([])
const selectedTestId = ref<number | undefined>(undefined)
const activeMetric = ref<'dps' | 'stroke_rate' | 'swim_index'>('dps')
const loading = ref(true)

const metricTabs = [
  { key: 'dps', label: 'DPS' },
  { key: 'stroke_rate', label: 'Frecuencia' },
  { key: 'swim_index', label: 'Índice' },
]

const fetchAvailableTests = async () => {
  loading.value = true

  try {
    // First get session IDs for this athlete
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('id')
      .eq('athlete_id', props.athleteId)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)

      // Then get unique tests from those sessions
      const { data: sets } = await supabase
        .from('training_sets')
        .select('test_id, tests(id, distance_m, stroke, pool_type)')
        .in('session_id', sessionIds)
        .not('test_id', 'is', null)

      if (sets) {
        const testsMap = new Map<number, { id: number; name: string }>()
        sets.forEach((set: any) => {
          if (set.tests && !testsMap.has(set.tests.id)) {
            testsMap.set(set.tests.id, {
              id: set.tests.id,
              name: `${set.tests.distance_m}m ${set.tests.stroke} (${set.tests.pool_type})`,
            })
          }
        })
        availableTests.value = Array.from(testsMap.values())

        if (availableTests.value.length > 0) {
          selectedTestId.value = availableTests.value[0].id
        }
      }
    }
  } catch (e) {
    console.error('Error fetching tests:', e)
  }

  loading.value = false
}

onMounted(fetchAvailableTests)
</script>

<template>
  <div class="space-y-4">
    <!-- Test selector -->
    <div v-if="availableTests.length > 1" class="mb-4">
      <USelectMenu
        v-model="selectedTestId"
        :options="availableTests"
        value-attribute="id"
        option-attribute="name"
        placeholder="Seleccionar prueba"
        size="sm"
      />
    </div>

    <SLoadingState v-if="loading" type="skeleton" />

    <template v-else-if="availableTests.length > 0">
      <!-- Time Progress Chart -->
      <SCard title="Progreso de Tiempos">
        <TimeProgressChart
          :athlete-id="athleteId"
          :test-id="selectedTestId"
        />
      </SCard>

      <!-- Metrics Charts -->
      <SCard title="Métricas de Nado">
        <div class="mb-4">
          <div class="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
            <button
              v-for="tab in metricTabs"
              :key="tab.key"
              class="flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="activeMetric === tab.key
                ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'"
              @click="activeMetric = tab.key as typeof activeMetric"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <MetricsChart
          :athlete-id="athleteId"
          :test-id="selectedTestId"
          :metric="activeMetric"
        />
      </SCard>
    </template>

    <SEmptyState
      v-else
      icon="chart"
      title="Sin datos de entrenamiento"
      description="Registra sesiones de entrenamiento para ver el progreso del atleta."
      action-label="Registrar entrenamiento"
      :action-to="`/training/new?athlete=${athleteId}`"
    />
  </div>
</template>
