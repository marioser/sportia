<script setup lang="ts">
definePageMeta({

})

const router = useRouter()
const { athletes, loading, fetchAthletes } = useAthletes()
const { primaryClubId, isAthlete, isClubAdmin, isAdmin, linkedAthlete } = useProfile()

// Athletes should be redirected to their own profile
watch([isAthlete, linkedAthlete], ([athlete, linked]) => {
  if (athlete && linked) {
    router.replace(`/athletes/${linked.id}`)
  }
}, { immediate: true })

// Permission to create athletes
const canCreateAthletes = computed(() => isClubAdmin.value || isAdmin.value)

// Fetch athletes for user's primary club
onMounted(async () => {
  // Don't fetch if athlete (they'll be redirected)
  if (isAthlete.value) return

  if (primaryClubId.value) {
    await fetchAthletes(primaryClubId.value)
  } else {
    await fetchAthletes()
  }
})

// Re-fetch when club changes
watch(primaryClubId, async (clubId) => {
  if (isAthlete.value) return
  if (clubId) {
    await fetchAthletes(clubId)
  }
})

const activeAthletes = computed(() =>
  athletes.value.filter((a) => a.active !== false)
)
</script>

<template>
  <div>
    <SPageHeader
      title="Atletas"
      :subtitle="`${activeAthletes.length} activos`"
    >
      <template v-if="canCreateAthletes" #actions>
        <NuxtLink
          to="/athletes/new"
          class="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </NuxtLink>
      </template>
    </SPageHeader>

    <SLoadingState v-if="loading" text="Cargando atletas..." />

    <div v-else-if="activeAthletes.length > 0" class="space-y-3">
      <AthleteCard
        v-for="athlete in activeAthletes"
        :key="athlete.id!"
        :athlete="athlete"
      />
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Sin atletas"
      :description="canCreateAthletes ? 'Agrega tu primer atleta para comenzar a registrar entrenamientos.' : 'No hay atletas asignados.'"
      :action-label="canCreateAthletes ? 'Agregar atleta' : undefined"
      :action-to="canCreateAthletes ? '/athletes/new' : undefined"
    />

    <SFab v-if="canCreateAthletes" icon="plus" to="/athletes/new" />
  </div>
</template>
