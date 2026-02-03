<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

definePageMeta({})

const route = useRoute()
const router = useRouter()
const objectiveId = computed(() => route.params.id as string)

const { primaryClubId } = useProfile()
const { athletes, fetchAthletes } = useAthletes()
const {
  loading,
  objectives,
  fetchObjectives,
  assignObjective,
  fetchObjectiveAssignments,
  strokeLabels,
} = useObjectives()

// Current objective
const objective = computed(() => objectives.value.find((o) => o.id === objectiveId.value))

// Selected athletes
const selectedAthleteIds = ref<string[]>([])

// Existing assignments
const existingAssignments = ref<string[]>([])

// Load data
onMounted(async () => {
  const clubId = primaryClubId.value || undefined

  await Promise.all([
    fetchObjectives(clubId),
    fetchAthletes(),
  ])

  // Get existing assignments to disable already assigned athletes
  const assignments = await fetchObjectiveAssignments(objectiveId.value)
  existingAssignments.value = assignments.map((a) => a.athlete_id)
})

// Athletes available for assignment (not already assigned)
const availableAthletes = computed(() => {
  return athletes.value
    .filter((a): a is typeof a & { id: string } => !!a.id && !existingAssignments.value.includes(a.id))
})

// Toggle athlete selection
const toggleAthlete = (athleteId: string) => {
  const idx = selectedAthleteIds.value.indexOf(athleteId)
  if (idx === -1) {
    selectedAthleteIds.value.push(athleteId)
  } else {
    selectedAthleteIds.value.splice(idx, 1)
  }
}

// Select all
const selectAll = () => {
  selectedAthleteIds.value = availableAthletes.value.map((a) => a.id!).filter(Boolean)
}

// Clear selection
const clearSelection = () => {
  selectedAthleteIds.value = []
}

// Submit
const saving = ref(false)
const handleSubmit = async () => {
  if (selectedAthleteIds.value.length === 0) return

  saving.value = true
  const success = await assignObjective(objectiveId.value, selectedAthleteIds.value)
  saving.value = false

  if (success) {
    router.push('/objectives')
  }
}
</script>

<template>
  <div>
    <SPageHeader
      title="Asignar Objetivo"
      back-to="/objectives"
    />

    <!-- Objective info -->
    <SCard v-if="objective" class="mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div class="font-medium text-gray-900 dark:text-slate-50">
            {{ objective.test ? `${objective.test.distance_m}m ${strokeLabels[objective.test.swim_stroke?.code] || ''}` : 'Objetivo' }}
          </div>
          <div class="text-lg font-mono font-bold text-primary-600 dark:text-primary-400">
            {{ msToTimeString(objective.target_time_ms) }}
          </div>
        </div>
      </div>
    </SCard>

    <SLoadingState v-if="loading && athletes.length === 0" text="Cargando atletas..." />

    <template v-else>
      <!-- Selection controls -->
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-gray-500 dark:text-slate-400">
          {{ selectedAthleteIds.length }} seleccionado(s)
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="selectedAthleteIds.length < availableAthletes.length"
            size="xs"
            color="gray"
            variant="ghost"
            @click="selectAll"
          >
            Seleccionar todos
          </UButton>
          <UButton
            v-if="selectedAthleteIds.length > 0"
            size="xs"
            color="gray"
            variant="ghost"
            @click="clearSelection"
          >
            Limpiar
          </UButton>
        </div>
      </div>

      <!-- Athletes list -->
      <div v-if="availableAthletes.length > 0" class="space-y-2 mb-4">
        <SCard
          v-for="athlete in availableAthletes"
          :key="athlete.id"
          class="!p-3 cursor-pointer transition-colors"
          :class="selectedAthleteIds.includes(athlete.id) ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''"
          @click="toggleAthlete(athlete.id)"
        >
          <div class="flex items-center gap-3">
            <UCheckbox
              :model-value="selectedAthleteIds.includes(athlete.id)"
              @click.stop
              @change="toggleAthlete(athlete.id)"
            />
            <SAvatar
              :src="athlete.photo_url"
              :name="`${athlete.first_name} ${athlete.last_name}`"
              size="sm"
            />
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-slate-50">
                {{ athlete.first_name }} {{ athlete.last_name }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ athlete.age_category || '' }}
              </div>
            </div>
          </div>
        </SCard>
      </div>

      <SEmptyState
        v-else-if="existingAssignments.length > 0"
        icon="check"
        title="Todos asignados"
        description="Todos los atletas ya tienen este objetivo asignado."
      />

      <SEmptyState
        v-else
        icon="users"
        title="Sin atletas"
        description="No hay atletas disponibles para asignar."
      />

      <!-- Submit button -->
      <div v-if="availableAthletes.length > 0" class="pt-4">
        <UButton
          color="primary"
          block
          :loading="saving"
          :disabled="selectedAthleteIds.length === 0"
          @click="handleSubmit"
        >
          Asignar a {{ selectedAthleteIds.length }} atleta(s)
        </UButton>
      </div>
    </template>
  </div>
</template>
