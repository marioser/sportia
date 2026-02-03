<script setup lang="ts">
definePageMeta({})

const route = useRoute()
const clubId = computed(() => route.params.id as string)
const coachId = computed(() => route.params.coachId as string)

const { currentClub, fetchClub } = useClubs()
const { athletes, fetchAthletes } = useAthletes()
const {
  currentCoach,
  loading,
  fetchCoach,
  fetchCoachAthletes,
  assignAthleteToCoach,
  unassignAthleteFromCoach,
} = useCoaches()
const { isAdmin, isClubAdmin } = useProfile()

const canEdit = computed(() => isAdmin.value || isClubAdmin.value)

// Coach's assigned athletes
const assignedAthletes = ref<any[]>([])

onMounted(async () => {
  await Promise.all([
    fetchClub(clubId.value),
    fetchCoach(coachId.value),
    fetchAthletes(clubId.value),
  ])
  assignedAthletes.value = await fetchCoachAthletes(coachId.value)
})

// Athletes available for assignment (not already assigned)
const availableAthletes = computed(() => {
  const assignedIds = new Set(assignedAthletes.value.map((a) => a.id))
  return athletes.value.filter((a) => a.id && !assignedIds.has(a.id) && a.active !== false)
})

// Modal state
const showAssignModal = ref(false)
const selectedAthleteId = ref<string>('')

// Assign athlete
const assigning = ref(false)
const handleAssign = async () => {
  if (!selectedAthleteId.value) return

  assigning.value = true
  const success = await assignAthleteToCoach(coachId.value, selectedAthleteId.value)
  assigning.value = false

  if (success) {
    showAssignModal.value = false
    selectedAthleteId.value = ''
    // Refresh assigned athletes
    assignedAthletes.value = await fetchCoachAthletes(coachId.value)
  }
}

// Unassign athlete
const handleUnassign = async (athleteId: string) => {
  if (!confirm('¿Desasignar este atleta del entrenador?')) return

  const success = await unassignAthleteFromCoach(coachId.value, athleteId)
  if (success) {
    assignedAthletes.value = assignedAthletes.value.filter((a) => a.id !== athleteId)
  }
}

// Athlete options for select
const athleteOptions = computed(() =>
  availableAthletes.value.map((a) => ({
    value: a.id!,
    label: `${a.first_name} ${a.last_name}`,
  }))
)
</script>

<template>
  <div>
    <SPageHeader
      :title="(currentCoach as any)?.profiles?.full_name || 'Entrenador'"
      :back-to="`/clubs/${clubId}/coaches`"
    />

    <SLoadingState v-if="loading && !currentCoach" text="Cargando entrenador..." />

    <div v-else-if="currentCoach" class="space-y-4">
      <!-- Coach info -->
      <SCard>
        <div class="flex items-center gap-4">
          <SAvatar
            :src="(currentCoach as any).profiles?.avatar_url"
            :name="(currentCoach as any).profiles?.full_name"
            size="xl"
          />
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-slate-50">
              {{ (currentCoach as any).profiles?.full_name || 'Sin nombre' }}
            </h2>
            <p class="text-gray-500 dark:text-slate-400">
              {{ currentCoach.specialization || 'Entrenador' }}
            </p>
            <SBadge
              v-if="currentCoach.is_independent"
              text="Independiente"
              color="warning"
              size="sm"
              class="mt-2"
            />
          </div>
        </div>
      </SCard>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3">
        <SCard no-padding>
          <div class="p-4 text-center">
            <p class="text-3xl font-bold text-primary-600">{{ assignedAthletes.length }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Atletas asignados</p>
          </div>
        </SCard>
        <SCard v-if="canEdit" no-padding>
          <button
            class="w-full p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            @click="showAssignModal = true"
          >
            <div class="w-10 h-10 mx-auto mb-1 rounded-full bg-primary-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-primary-600">Asignar atleta</p>
          </button>
        </SCard>
      </div>

      <!-- Assigned athletes -->
      <SCard title="Atletas asignados">
        <div v-if="assignedAthletes.length > 0" class="space-y-2">
          <div
            v-for="athlete in assignedAthletes"
            :key="athlete.id"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <NuxtLink
              :to="`/athletes/${athlete.id}`"
              class="flex items-center gap-3 flex-1 min-w-0"
            >
              <SAvatar
                :src="athlete.photo_url"
                :name="`${athlete.first_name} ${athlete.last_name}`"
                size="sm"
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 dark:text-slate-50 truncate">
                  {{ athlete.first_name }} {{ athlete.last_name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ athlete.sex === 'M' ? 'Masculino' : 'Femenino' }}
                </p>
              </div>
            </NuxtLink>
            <UButton
              v-if="canEdit"
              icon="i-heroicons-x-mark"
              color="red"
              variant="ghost"
              size="xs"
              title="Desasignar"
              @click="handleUnassign(athlete.id)"
            />
          </div>
        </div>
        <SEmptyState
          v-else
          icon="users"
          title="Sin atletas asignados"
          description="Asigna atletas a este entrenador para comenzar."
        />
      </SCard>
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Entrenador no encontrado"
      action-label="Volver a entrenadores"
      :action-to="`/clubs/${clubId}/coaches`"
    />

    <!-- Assign athlete modal -->
    <SModal v-model="showAssignModal" title="Asignar Atleta">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-slate-400">
          Selecciona un atleta del club para asignar a este entrenador.
        </p>

        <UFormGroup label="Atleta">
          <USelectMenu
            v-model="selectedAthleteId"
            :options="athleteOptions"
            value-attribute="value"
            option-attribute="label"
            searchable
            placeholder="Buscar atleta..."
          />
        </UFormGroup>

        <p v-if="athleteOptions.length === 0" class="text-sm text-amber-600 dark:text-amber-400">
          No hay atletas disponibles para asignar.
        </p>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showAssignModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="primary"
            class="flex-1"
            :disabled="!selectedAthleteId"
            :loading="assigning"
            @click="handleAssign"
          >
            Asignar
          </SButton>
        </div>
      </template>
    </SModal>
  </div>
</template>
