<script setup lang="ts">
definePageMeta({

})

const { sessions, loading, fetchSessions } = useTrainingSessions()
const { athletes, fetchAthletes } = useAthletes()
const { primaryClubId, isAthlete, isCoach, isClubAdmin, isAdmin, linkedAthlete } = useProfile()

// Filter state
const selectedAthleteId = ref<string | null>(null)

// Permissions - Athletes can also create their own trainings
const canCreateTraining = computed(() => isAthlete.value || isCoach.value || isClubAdmin.value || isAdmin.value)
const canFilterByAthlete = computed(() => isCoach.value || isClubAdmin.value || isAdmin.value)

// Fetch data on mount
onMounted(async () => {
  // Athletes only see their own trainings
  if (isAthlete.value && linkedAthlete.value) {
    await fetchSessions(linkedAthlete.value.id)
  } else {
    if (primaryClubId.value) {
      await fetchAthletes(primaryClubId.value)
    }
    await fetchSessions(selectedAthleteId.value || undefined)
  }
})

// Re-fetch when athlete filter changes (only for coaches/admins)
watch(selectedAthleteId, async (athleteId) => {
  if (!isAthlete.value) {
    await fetchSessions(athleteId || undefined)
  }
})

const athleteOptions = computed(() => [
  { value: '', label: 'Todos los atletas' },
  ...athletes.value
    .filter((a) => a.id !== null)
    .map((a) => ({
      value: a.id!,
      label: `${a.first_name} ${a.last_name}`,
    })),
])
</script>

<template>
  <div>
    <SPageHeader
      :title="isAthlete ? 'Mis Entrenamientos' : 'Entrenamientos'"
      :subtitle="`${sessions.length} sesiones`"
    >
      <template v-if="canCreateTraining" #actions>
        <NuxtLink
          to="/training/new"
          class="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </NuxtLink>
      </template>
    </SPageHeader>

    <!-- Filters - Only for coaches and admins -->
    <div v-if="canFilterByAthlete" class="mb-4">
      <SSelect
        v-model="selectedAthleteId"
        :options="athleteOptions"
        placeholder="Filtrar por atleta"
      />
    </div>

    <SLoadingState v-if="loading" text="Cargando sesiones..." />

    <div v-else-if="sessions.length > 0" class="space-y-3">
      <SessionCard
        v-for="session in sessions"
        :key="session.id!"
        :session="session"
      />
    </div>

    <SEmptyState
      v-else
      icon="chart"
      :title="isAthlete ? 'Sin entrenamientos registrados' : 'Sin entrenamientos'"
      :description="isAthlete ? 'Aún no tienes entrenamientos registrados.' : 'Registra tu primera sesion de entrenamiento.'"
      :action-label="canCreateTraining ? 'Registrar entrenamiento' : undefined"
      :action-to="canCreateTraining ? '/training/new' : undefined"
    />

    <SFab v-if="canCreateTraining" icon="plus" to="/training/new" />
  </div>
</template>
