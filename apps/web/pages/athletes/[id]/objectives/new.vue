<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

definePageMeta({})

const route = useRoute()
const router = useRouter()
const athleteId = computed(() => route.params.id as string)

const { currentAthlete, fetchAthlete } = useAthletes()
const { primaryClubId } = useProfile()
const { testOptions, fetchTests } = useCatalogs()
const {
  loading,
  objectives,
  fetchObjectives,
  createObjective,
  assignObjective,
} = useObjectives()

// Load data
onMounted(async () => {
  await Promise.all([
    fetchAthlete(athleteId.value),
    fetchTests(),
    fetchObjectives(primaryClubId.value),
  ])
})

// Form state - select existing or create new
const mode = ref<'select' | 'create'>('select')
const selectedObjectiveId = ref('')

// New objective form
const newObjectiveForm = reactive({
  test_id: '',
  target_time_ms: 0,
})
const timeInput = ref('')

// Parse time string to milliseconds
const parseTimeToMs = (time: string): number => {
  const parts = time.split(':')
  let minutes = 0
  let secondsAndCentis = ''

  if (parts.length === 2) {
    minutes = parseInt(parts[0]) || 0
    secondsAndCentis = parts[1]
  } else {
    secondsAndCentis = parts[0]
  }

  const [seconds, centis] = secondsAndCentis.split('.')
  const secs = parseInt(seconds) || 0
  const cs = parseInt((centis || '0').padEnd(2, '0').slice(0, 2)) || 0

  return (minutes * 60 + secs) * 1000 + cs * 10
}

watch(timeInput, (val) => {
  newObjectiveForm.target_time_ms = parseTimeToMs(val)
})

// Objective options formatted for select
const objectiveOptions = computed(() => {
  return objectives.value.map((o) => {
    const test = o.test
    const stroke = test?.swim_stroke?.name_es || ''
    return {
      value: o.id,
      label: `${stroke} ${test?.distance_m || ''}m - ${msToTimeString(o.target_time_ms)} (${test?.pool_type || ''})`,
    }
  })
})

// Validation
const isValid = computed(() => {
  if (mode.value === 'select') {
    return !!selectedObjectiveId.value
  } else {
    return newObjectiveForm.test_id && newObjectiveForm.target_time_ms > 0
  }
})

// Submit
const saving = ref(false)
const handleSubmit = async () => {
  if (!isValid.value) return

  saving.value = true

  let objectiveId = selectedObjectiveId.value

  // If creating new objective
  if (mode.value === 'create') {
    const created = await createObjective({
      test_id: newObjectiveForm.test_id,
      target_time_ms: newObjectiveForm.target_time_ms,
      scope: 'CLUB',
      club_id: primaryClubId.value,
    })

    if (!created) {
      saving.value = false
      return
    }

    objectiveId = created.id
  }

  // Assign to athlete
  const success = await assignObjective(objectiveId, [athleteId.value])
  saving.value = false

  if (success) {
    router.push(`/athletes/${athleteId.value}`)
  }
}
</script>

<template>
  <div>
    <SPageHeader
      :title="`Asignar Objetivo - ${currentAthlete ? `${currentAthlete.first_name} ${currentAthlete.last_name}` : ''}`"
      :back-to="`/athletes/${athleteId}`"
    />

    <UCard>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Mode selection -->
        <div class="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            :class="mode === 'select' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-gray-600 dark:text-slate-400'"
            @click="mode = 'select'"
          >
            Seleccionar existente
          </button>
          <button
            type="button"
            class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            :class="mode === 'create' ? 'bg-white dark:bg-slate-700 shadow text-primary-600' : 'text-gray-600 dark:text-slate-400'"
            @click="mode = 'create'"
          >
            Crear nuevo
          </button>
        </div>

        <!-- Select existing objective -->
        <template v-if="mode === 'select'">
          <UFormGroup label="Objetivo" required>
            <USelectMenu
              v-model="selectedObjectiveId"
              :options="objectiveOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecciona un objetivo"
              searchable
            />
          </UFormGroup>

          <p v-if="objectiveOptions.length === 0" class="text-sm text-amber-600 dark:text-amber-400">
            No hay objetivos disponibles. Crea uno nuevo.
          </p>
        </template>

        <!-- Create new objective -->
        <template v-else>
          <UFormGroup label="Prueba" required>
            <USelectMenu
              v-model="newObjectiveForm.test_id"
              :options="testOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecciona una prueba"
              searchable
            />
          </UFormGroup>

          <UFormGroup label="Tiempo objetivo" required hint="Formato: mm:ss.cc (ej: 1:05.30)">
            <UInput
              v-model="timeInput"
              placeholder="1:05.30"
              size="lg"
              class="font-mono"
            />
            <p v-if="newObjectiveForm.target_time_ms > 0" class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {{ newObjectiveForm.target_time_ms }} ms
            </p>
          </UFormGroup>
        </template>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <UButton
            variant="outline"
            :to="`/athletes/${athleteId}`"
            class="flex-1"
            block
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="saving || loading"
            :disabled="!isValid"
            class="flex-1"
            block
          >
            {{ mode === 'create' ? 'Crear y asignar' : 'Asignar objetivo' }}
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
