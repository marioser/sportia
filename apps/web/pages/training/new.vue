<script setup lang="ts">
import type { CreateSessionForm, SessionType } from '~/types'

definePageMeta({

})

const route = useRoute()
const router = useRouter()

const { createSession, loading } = useTrainingSessions()
const { athletes, fetchAthletes } = useAthletes()
const { sessionTypeOptions } = useCatalogs()
const { primaryClubId, isAthlete, linkedAthlete } = useProfile()

// Fetch athletes on mount (only for coaches/admins)
onMounted(async () => {
  if (!isAthlete.value) {
    if (primaryClubId.value) {
      await fetchAthletes(primaryClubId.value)
    } else {
      await fetchAthletes()
    }
  }
})

const athleteOptions = computed(() =>
  athletes.value
    .filter((a) => a.id !== null)
    .map((a) => ({
      value: a.id!,
      label: `${a.first_name} ${a.last_name}`,
    }))
)

// Today's date as default
const today = new Date().toISOString().split('T')[0]

// Initialize athlete: from query param, or if athlete user, use their linked athlete
const initialAthleteId = computed(() => {
  if (isAthlete.value && linkedAthlete.value) {
    return linkedAthlete.value.id
  }
  return (route.query.athlete as string) || ''
})

const form = reactive<CreateSessionForm>({
  athleteId: initialAthleteId.value,
  sessionDate: today,
  sessionType: 'AEROBIC' as SessionType,
  durationMin: 60,
  sessionRpe: 5,
  notes: '',
})

// Update athlete if query param or linked athlete changes
watch(initialAthleteId, (id) => {
  if (id) {
    form.athleteId = id
  }
}, { immediate: true })

const handleSubmit = async () => {
  const session = await createSession(form)
  if (session) {
    // Navigate to add set page to continue recording
    router.push(`/training/${session.id}/add-set`)
  }
}
</script>

<template>
  <div>
    <SPageHeader title="Nueva Sesion" back-to="/training" />

    <SCard>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Show athlete selector only for coaches/admins -->
        <SSelect
          v-if="!isAthlete"
          v-model="form.athleteId"
          label="Atleta"
          :options="athleteOptions"
          required
        />
        <!-- Show athlete name for athletes (read-only) -->
        <div v-else class="text-sm">
          <span class="text-gray-500 dark:text-slate-400">Atleta:</span>
          <span class="ml-2 font-medium">{{ linkedAthlete?.first_name }} {{ linkedAthlete?.last_name }}</span>
        </div>

        <SDatePicker
          v-model="form.sessionDate"
          label="Fecha"
          :max="today"
          required
        />

        <SSelect
          v-model="form.sessionType"
          label="Tipo de sesion"
          :options="sessionTypeOptions"
          required
        />

        <SNumberInput
          v-model="form.durationMin"
          label="Duracion"
          :min="1"
          :max="300"
          unit="min"
          required
        />

        <RpeSelector v-model="form.sessionRpe" />

        <STextarea
          v-model="form.notes"
          label="Notas (opcional)"
          placeholder="Observaciones de la sesion..."
          :rows="3"
        />

        <div class="flex gap-3 pt-4">
          <SButton
            variant="outline"
            to="/training"
            class="flex-1"
          >
            Cancelar
          </SButton>
          <SButton
            type="submit"
            variant="primary"
            :loading="loading"
            class="flex-1"
          >
            Crear y agregar series
          </SButton>
        </div>
      </form>
    </SCard>
  </div>
</template>
