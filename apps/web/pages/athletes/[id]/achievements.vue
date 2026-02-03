<script setup lang="ts">
definePageMeta({})

const route = useRoute()
const athleteId = computed(() => route.params.id as string)

const { currentAthlete, loading: loadingAthlete, fetchAthlete } = useAthletes()
const { isAthlete, linkedAthlete } = useProfile()

// Check if this is the athlete viewing their own profile
const isOwnProfile = computed(() => {
  return isAthlete.value && linkedAthlete.value?.id === athleteId.value
})

// Fetch athlete data
onMounted(() => {
  fetchAthlete(athleteId.value)
})
</script>

<template>
  <div>
    <SPageHeader
      :title="isOwnProfile ? 'Mis Objetivos y Logros' : 'Objetivos y Logros'"
      :back-to="isOwnProfile ? '/' : `/athletes/${athleteId}`"
    />

    <SLoadingState v-if="loadingAthlete" text="Cargando..." />

    <div v-else-if="currentAthlete" class="space-y-6">
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

      <!-- Badges Section -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Logros e Insignias
        </h3>
        <BadgesPanel :athlete-id="athleteId" />
      </section>

      <!-- Objectives Section -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Objetivos
        </h3>
        <ObjectivesPanel :athlete-id="athleteId" />
      </section>
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Atleta no encontrado"
      action-label="Volver"
      :action-to="isOwnProfile ? '/' : '/athletes'"
    />
  </div>
</template>
