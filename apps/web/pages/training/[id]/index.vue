<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

definePageMeta({
  
})

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => route.params.id as string)

const { currentSession, loading, fetchSession, deleteSession } = useTrainingSessions()
const { sets, fetchSets, deleteSet } = useTrainingSets()
const { calculateMetrics, getTotalStrokeCount } = useSwimmingMetrics()

// Fetch session and sets
onMounted(async () => {
  await fetchSession(sessionId.value)
  await fetchSets(sessionId.value)
})

const sessionTypeLabels: Record<string, string> = {
  AEROBIC: 'Aerobico',
  THRESHOLD: 'Umbral',
  SPEED: 'Velocidad',
  TECH: 'Tecnica',
}

const showDeleteModal = ref(false)

const handleDelete = async () => {
  const deleted = await deleteSession(sessionId.value)
  if (deleted) {
    showDeleteModal.value = false
    router.push('/training')
  }
}

const handleDeleteSet = async (setId: string) => {
  const deleted = await deleteSet(setId)
  if (deleted) {
    await fetchSets(sessionId.value)
  }
}

// Calculate metrics for display (simple version - would need stroke data for full metrics)
const sessionMetrics = computed(() => {
  if (!currentSession.value) return null
  return {
    trainingLoad: currentSession.value.training_load,
  }
})
</script>

<template>
  <div>
    <SPageHeader
      :title="currentSession?.session_date || 'Sesion'"
      back-to="/training"
    >
      <template #actions>
        <button
          class="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          @click="showDeleteModal = true"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </template>
    </SPageHeader>

    <SLoadingState v-if="loading" text="Cargando sesion..." />

    <div v-else-if="currentSession" class="space-y-4">
      <!-- Session info card -->
      <SCard>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ currentSession.athlete_name }}
            </h2>
            <SBadge
              v-if="currentSession.session_type"
              :text="sessionTypeLabels[currentSession.session_type] || currentSession.session_type"
              color="primary"
            />
          </div>

          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ currentSession.duration_min }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">Minutos</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ currentSession.session_rpe }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">RPE</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-primary-600">{{ currentSession.training_load }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">Carga</p>
            </div>
          </div>

          <p v-if="currentSession.notes" class="text-sm text-gray-600 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700">
            {{ currentSession.notes }}
          </p>
        </div>
      </SCard>

      <!-- Sets card -->
      <SCard title="Series">
        <template #actions>
          <NuxtLink
            :to="`/training/${sessionId}/add-set`"
            class="text-sm text-primary-600 font-medium hover:underline"
          >
            + Agregar
          </NuxtLink>
        </template>

        <div v-if="sets.length > 0" class="space-y-3">
          <div
            v-for="set in sets"
            :key="set.id"
            class="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white">
                    #{{ set.attempt_no }}
                  </span>
                  <span v-if="set.tests" class="text-sm text-gray-500 dark:text-slate-400">
                    {{ set.tests.distance_m }}m
                    {{ set.tests.swim_strokes?.name_es }}
                    ({{ set.tests.pool_type === 'SCM' ? '25m' : '50m' }})
                  </span>
                </div>
                <TimeDisplay :ms="set.total_time_ms" size="lg" class="mt-1" />
              </div>
              <button
                type="button"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                @click="handleDeleteSet(set.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <SEmptyState
          v-else
          icon="chart"
          title="Sin series"
          description="Agrega series para registrar tiempos."
          action-label="Agregar serie"
          :action-to="`/training/${sessionId}/add-set`"
        />
      </SCard>
    </div>

    <SEmptyState
      v-else
      icon="chart"
      title="Sesion no encontrada"
      action-label="Volver a entrenamientos"
      action-to="/training"
    />

    <SFab icon="plus" :to="`/training/${sessionId}/add-set`" />

    <!-- Delete confirmation modal -->
    <SModal v-model="showDeleteModal" title="Eliminar sesion">
      <p class="text-gray-600 dark:text-slate-400 mb-4">
        ¿Estas seguro de que deseas eliminar esta sesion de entrenamiento?
        Se eliminaran todas las series asociadas. Esta accion no se puede deshacer.
      </p>
      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showDeleteModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="danger"
            class="flex-1"
            :loading="loading"
            @click="handleDelete"
          >
            Eliminar
          </SButton>
        </div>
      </template>
    </SModal>
  </div>
</template>
