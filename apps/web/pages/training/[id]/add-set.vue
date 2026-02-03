<script setup lang="ts">
import type { CreateSetForm, CreateSplitForm, CreateStrokeForm } from '~/types'

definePageMeta({
  
})

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => route.params.id as string)

const { fetchSession, currentSession } = useTrainingSessions()
const { createSet, createSplits, createStrokes, loading } = useTrainingSets()
const { tests, swimStrokes, fetchTests, fetchSwimStrokes } = useCatalogs()
const { calculateMetrics } = useSwimmingMetrics()

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchSession(sessionId.value),
    fetchTests(),
    fetchSwimStrokes(),
  ])
})

const form = reactive<CreateSetForm>({
  testId: '',
  totalTimeMs: 0,
  poolLengthM: 25,
  attemptNo: undefined,
})

// Track if user wants to add splits/strokes
const showSplits = ref(false)
const showStrokes = ref(false)

// Get selected test info
const selectedTest = computed(() =>
  tests.value.find((t) => t.id === form.testId)
)

// Calculate number of lengths based on test
const numLengths = computed(() => {
  if (!selectedTest.value) return 0
  return Math.ceil(selectedTest.value.distance_m / form.poolLengthM)
})

// Splits data
const splits = ref<CreateSplitForm[]>([])
const addSplit = () => {
  const index = splits.value.length
  splits.value.push({
    splitIndex: index,
    splitDistanceM: form.poolLengthM,
    splitTimeMs: 0,
  })
}
const removeSplit = (index: number) => {
  splits.value.splice(index, 1)
  // Re-index remaining splits
  splits.value.forEach((s, i) => {
    s.splitIndex = i
  })
}

// Strokes data
const strokeCounts = ref<number[]>([])

// Initialize stroke counts when number of lengths changes
watch(numLengths, (n) => {
  if (n > 0 && strokeCounts.value.length !== n) {
    strokeCounts.value = Array(n).fill(0)
  }
})

// Calculate preview metrics
const previewMetrics = computed(() => {
  if (!selectedTest.value || form.totalTimeMs <= 0) return null

  const totalStrokes = strokeCounts.value.reduce((sum, c) => sum + c, 0)
  if (totalStrokes === 0) return null

  return calculateMetrics(
    selectedTest.value.distance_m,
    form.totalTimeMs,
    totalStrokes
  )
})

const saving = ref(false)

const handleSubmit = async () => {
  if (!form.testId || form.totalTimeMs <= 0) return

  saving.value = true

  // Create the set
  const set = await createSet(sessionId.value, form)

  if (set) {
    // Create splits if any
    if (splits.value.length > 0) {
      await createSplits(set.id, splits.value)
    }

    // Create strokes if any non-zero
    const strokeForms: CreateStrokeForm[] = strokeCounts.value
      .map((count, index) => ({
        lengthIndex: index,
        strokeCount: count,
      }))
      .filter((s) => s.strokeCount > 0)

    if (strokeForms.length > 0) {
      await createStrokes(set.id, strokeForms)
    }

    // Ask if user wants to add another
    const addAnother = confirm('Serie guardada. ¿Deseas agregar otra serie?')
    if (addAnother) {
      // Reset form for next set
      form.totalTimeMs = 0
      splits.value = []
      strokeCounts.value = Array(numLengths.value).fill(0)
    } else {
      router.push(`/training/${sessionId.value}`)
    }
  }

  saving.value = false
}
</script>

<template>
  <div>
    <SPageHeader
      title="Agregar Serie"
      :back-to="`/training/${sessionId}`"
      :subtitle="currentSession?.athlete_name ?? undefined"
    />

    <div class="space-y-4">
      <SCard title="Prueba y Tiempo">
        <SetForm
          v-model="form"
          :tests="tests"
          :swim-strokes="swimStrokes"
        />
      </SCard>

      <!-- Optional: Stroke count -->
      <SCard>
        <div class="flex items-center justify-between mb-4">
          <span class="font-medium text-gray-900 dark:text-white">Conteo de brazadas</span>
          <button
            type="button"
            class="text-sm text-primary-600 font-medium"
            @click="showStrokes = !showStrokes"
          >
            {{ showStrokes ? 'Ocultar' : 'Agregar' }}
          </button>
        </div>

        <StrokeCounter
          v-if="showStrokes && numLengths > 0"
          v-model="strokeCounts"
          :lengths="numLengths"
        />
        <p v-else-if="showStrokes" class="text-sm text-gray-500 dark:text-slate-400">
          Selecciona una prueba primero
        </p>
      </SCard>

      <!-- Preview metrics -->
      <SCard v-if="previewMetrics" title="Metricas calculadas">
        <MetricsPanel :metrics="previewMetrics" />
      </SCard>

      <!-- Submit buttons -->
      <div class="flex gap-3">
        <SButton
          variant="outline"
          :to="`/training/${sessionId}`"
          class="flex-1"
        >
          Cancelar
        </SButton>
        <SButton
          variant="primary"
          :loading="saving"
          :disabled="!form.testId || form.totalTimeMs <= 0"
          class="flex-1"
          @click="handleSubmit"
        >
          Guardar serie
        </SButton>
      </div>
    </div>
  </div>
</template>
