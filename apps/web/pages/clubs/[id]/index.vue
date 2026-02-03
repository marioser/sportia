<script setup lang="ts">
import type { ClubUnmatchedSwimmer } from '~/composables/useClubMatching'

definePageMeta({
  
})

const route = useRoute()
const clubId = computed(() => route.params.id as string)

const { currentClub, loading, fetchClub } = useClubs()
const { athletes, fetchAthletes } = useAthletes()
const { isAdmin, isClubAdmin } = useProfile()
const {
  loading: matchingLoading,
  allTeamCodes,
  linkedTeamCodes,
  clubSwimmers,
  availableTeamCodes,
  fetchAllTeamCodes,
  fetchClubTeamCodes,
  linkTeamCode,
  unlinkTeamCode,
  fetchClubUnmatchedSwimmers,
} = useClubMatching()
const { createMatch, confirmMatch } = useMatching()

// Selected team code for linking
const selectedTeamCode = ref<string | undefined>(undefined)
const showLinkModal = ref(false)

// Athlete matching state
const showMatchModal = ref(false)
const selectedSwimmer = ref<ClubUnmatchedSwimmer | null>(null)
const selectedAthleteId = ref<string | undefined>(undefined)
const matchingInProgress = ref(false)

onMounted(async () => {
  await fetchClub(clubId.value)
  await Promise.all([
    fetchAthletes(clubId.value),
    fetchClubTeamCodes(clubId.value),
  ])
})

// Load unmatched swimmers when team codes are linked
watch(linkedTeamCodes, async (codes) => {
  if (codes.length > 0) {
    await fetchClubUnmatchedSwimmers(clubId.value, 50)
  }
}, { immediate: true })

const activeAthletes = computed(() =>
  athletes.value.filter((a) => a.active !== false)
)

const canEdit = computed(() => isAdmin.value || isClubAdmin.value)

// Normalize gender values (FECNA uses different formats)
const isMale = (gender: string) => {
  const g = gender?.toLowerCase()
  return g === 'm' || g === 'men' || g === 'hombres' || g === 'male' || g === 'masculino'
}

const isFemale = (gender: string) => {
  const g = gender?.toLowerCase()
  return g === 'f' || g === 'women' || g === 'mujeres' || g === 'female' || g === 'femenino'
}

// Group swimmers by gender
const swimmersByGender = computed(() => {
  const males = clubSwimmers.value
    .filter((s) => isMale(s.gender))
    .sort((a, b) => a.swimmer_name.localeCompare(b.swimmer_name))
  const females = clubSwimmers.value
    .filter((s) => isFemale(s.gender))
    .sort((a, b) => a.swimmer_name.localeCompare(b.swimmer_name))
  return { males, females }
})

// Athlete options for matching dropdown
const athleteOptions = computed(() =>
  activeAthletes.value.map((a) => ({
    label: `${a.first_name} ${a.last_name} (${a.sex === 'M' ? 'M' : 'F'}, ${a.age} años)`,
    value: a.id!,
  }))
)

// Open modal and load team codes
const openLinkModal = async () => {
  showLinkModal.value = true
  if (allTeamCodes.value.length === 0) {
    await fetchAllTeamCodes()
  }
}

// Link selected team code
const handleLinkTeamCode = async () => {
  if (!selectedTeamCode.value) return
  await linkTeamCode(clubId.value, selectedTeamCode.value)
  selectedTeamCode.value = undefined
  showLinkModal.value = false
  // Reload unmatched swimmers
  await fetchClubUnmatchedSwimmers(clubId.value, 50)
}

// Unlink team code
const handleUnlinkTeamCode = async (teamCode: string) => {
  if (confirm(`¿Desvincular el código "${teamCode}" de este club?`)) {
    await unlinkTeamCode(clubId.value, teamCode)
  }
}

// Team code options for select
const teamCodeOptions = computed(() =>
  availableTeamCodes.value.map((tc) => ({
    label: `${tc.team_code} (${tc.result_count} resultados, ${tc.swimmer_count} nadadores)`,
    value: tc.team_code,
  }))
)

// Open match modal for a swimmer
const openMatchModal = (swimmer: ClubUnmatchedSwimmer) => {
  selectedSwimmer.value = swimmer
  selectedAthleteId.value = undefined
  showMatchModal.value = true
}

// Confirm the athlete match
const handleConfirmMatch = async () => {
  if (!selectedSwimmer.value || !selectedAthleteId.value) return

  matchingInProgress.value = true
  try {
    // Create and immediately confirm the match
    const match = await createMatch(
      selectedSwimmer.value.swimmer_name,
      selectedAthleteId.value,
      1.0, // Manual match = 100% confidence
      { team_code: selectedSwimmer.value.team_code, source: 'club_matching' }
    )

    if (match) {
      await confirmMatch(match.id, selectedAthleteId.value)
      // Refresh the unmatched swimmers list
      await fetchClubUnmatchedSwimmers(clubId.value, 50)
    }

    showMatchModal.value = false
    selectedSwimmer.value = null
    selectedAthleteId.value = undefined
  } finally {
    matchingInProgress.value = false
  }
}
</script>

<template>
  <div>
    <SPageHeader
      :title="currentClub?.name || 'Club'"
      back-to="/clubs"
    >
      <template v-if="canEdit" #actions>
        <NuxtLink
          :to="`/clubs/${clubId}/edit`"
          class="p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </NuxtLink>
      </template>
    </SPageHeader>

    <SLoadingState v-if="loading" text="Cargando club..." />

    <div v-else-if="currentClub" class="space-y-4">
      <!-- Club info -->
      <SCard>
        <div class="flex items-center gap-4">
          <div
            v-if="currentClub.logo_url"
            class="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0"
          >
            <img :src="currentClub.logo_url" :alt="currentClub.name" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
          >
            <span class="text-primary-600 font-bold text-2xl">
              {{ currentClub.name.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ currentClub.name }}</h2>
            <p class="text-gray-500 dark:text-slate-400">
              {{ currentClub.city ? `${currentClub.city}, ` : '' }}{{ currentClub.country }}
            </p>
          </div>
        </div>
      </SCard>

      <!-- Stats & Quick Actions -->
      <div class="grid grid-cols-3 gap-3">
        <SCard no-padding>
          <div class="p-4 text-center">
            <p class="text-3xl font-bold text-primary-600">{{ activeAthletes.length }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Atletas</p>
          </div>
        </SCard>
        <SCard no-padding>
          <NuxtLink
            :to="`/clubs/${clubId}/coaches`"
            class="block p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="w-10 h-10 mx-auto mb-1 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-teal-600 dark:text-teal-400">Entrenadores</p>
          </NuxtLink>
        </SCard>
        <SCard no-padding>
          <NuxtLink
            :to="`/athletes/new?club=${clubId}`"
            class="block p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="w-10 h-10 mx-auto mb-1 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-primary-600 dark:text-primary-400">Nuevo atleta</p>
          </NuxtLink>
        </SCard>
      </div>

      <!-- FECNA Team Codes (Admin only) -->
      <SCard v-if="isAdmin" title="Códigos FECNA">
        <template #actions>
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            variant="soft"
            size="xs"
            @click="openLinkModal"
          >
            Vincular
          </UButton>
        </template>

        <div v-if="linkedTeamCodes.length > 0" class="space-y-2">
          <div
            v-for="tc in linkedTeamCodes"
            :key="tc.external_code"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
          >
            <div>
              <span class="font-mono font-bold text-primary-600">{{ tc.external_code }}</span>
              <span class="text-sm text-gray-500 dark:text-slate-400 ml-2">
                {{ tc.result_count }} resultados · {{ tc.swimmer_count }} nadadores
              </span>
            </div>
            <UButton
              icon="i-heroicons-x-mark"
              color="red"
              variant="ghost"
              size="xs"
              @click="handleUnlinkTeamCode(tc.external_code)"
            />
          </div>
        </div>
        <p v-else class="text-sm text-gray-500 dark:text-slate-400">
          No hay códigos FECNA vinculados a este club.
          Vincula códigos para importar atletas desde los resultados de competencia.
        </p>
      </SCard>

      <!-- Unmatched Swimmers from FECNA (Admin only) -->
      <SCard
        v-if="isAdmin && linkedTeamCodes.length > 0 && clubSwimmers.length > 0"
        title="Nadadores sin emparejar"
      >
        <template #actions>
          <span class="text-xs text-gray-500 dark:text-slate-400">
            {{ clubSwimmers.length }} pendientes
          </span>
        </template>

        <p class="text-sm text-gray-600 dark:text-slate-400 mb-3">
          Estos nadadores aparecen en resultados FECNA pero no están vinculados a atletas del club.
        </p>

        <div class="space-y-4 max-h-96 overflow-y-auto">
          <!-- Masculino -->
          <div v-if="swimmersByGender.males.length > 0">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs">M</span>
              Masculino ({{ swimmersByGender.males.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="swimmer in swimmersByGender.males"
                :key="swimmer.swimmer_name_norm"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-slate-50 truncate">
                    {{ swimmer.swimmer_name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    {{ swimmer.result_count }} resultados · {{ swimmer.team_code }}
                  </p>
                </div>
                <UButton
                  icon="i-heroicons-link"
                  color="primary"
                  variant="soft"
                  size="xs"
                  @click="openMatchModal(swimmer)"
                >
                  Emparejar
                </UButton>
              </div>
            </div>
          </div>

          <!-- Femenino -->
          <div v-if="swimmersByGender.females.length > 0">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center text-pink-600 dark:text-pink-400 text-xs">F</span>
              Femenino ({{ swimmersByGender.females.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="swimmer in swimmersByGender.females"
                :key="swimmer.swimmer_name_norm"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-slate-50 truncate">
                    {{ swimmer.swimmer_name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    {{ swimmer.result_count }} resultados · {{ swimmer.team_code }}
                  </p>
                </div>
                <UButton
                  icon="i-heroicons-link"
                  color="primary"
                  variant="soft"
                  size="xs"
                  @click="openMatchModal(swimmer)"
                >
                  Emparejar
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </SCard>

      <!-- Athletes list -->
      <SCard title="Atletas del club">
        <template #actions>
          <NuxtLink
            :to="`/athletes?club=${clubId}`"
            class="text-sm text-primary-600 font-medium hover:underline"
          >
            Ver todos
          </NuxtLink>
        </template>

        <div v-if="activeAthletes.length > 0" class="space-y-2">
          <NuxtLink
            v-for="athlete in activeAthletes.slice(0, 5)"
            :key="athlete.id!"
            :to="`/athletes/${athlete.id}`"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
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
                {{ athlete.age }} anos - {{ athlete.age_category }}
              </p>
            </div>
          </NuxtLink>
        </div>
        <SEmptyState
          v-else
          icon="users"
          title="Sin atletas"
          description="Este club aun no tiene atletas registrados."
        />
      </SCard>
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Club no encontrado"
      action-label="Volver a clubes"
      action-to="/clubs"
    />

    <!-- Link Team Code Modal -->
    <SModal v-model="showLinkModal" title="Vincular Código FECNA">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-slate-400">
          Selecciona el código de equipo de FECNA que corresponde a este club.
        </p>

        <UFormGroup label="Código de equipo">
          <USelectMenu
            v-model="selectedTeamCode"
            :options="teamCodeOptions"
            value-attribute="value"
            option-attribute="label"
            searchable
            placeholder="Buscar código..."
            :loading="matchingLoading"
          />
        </UFormGroup>

        <p v-if="selectedTeamCode" class="text-xs text-gray-500 dark:text-slate-500">
          Al vincular este código, podrás ver y emparejar los nadadores de este equipo
          con los atletas de tu club.
        </p>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showLinkModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="primary"
            class="flex-1"
            :disabled="!selectedTeamCode"
            :loading="matchingLoading"
            @click="handleLinkTeamCode"
          >
            Vincular
          </SButton>
        </div>
      </template>
    </SModal>

    <!-- Match Swimmer Modal -->
    <SModal v-model="showMatchModal" title="Emparejar Nadador">
      <div v-if="selectedSwimmer" class="space-y-4">
        <div class="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <p class="font-medium text-gray-900 dark:text-slate-50">
            {{ selectedSwimmer.swimmer_name }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ isMale(selectedSwimmer.gender) ? 'Masculino' : 'Femenino' }}
            · {{ selectedSwimmer.result_count }} resultados en FECNA
          </p>
        </div>

        <UFormGroup label="Seleccionar atleta del club">
          <USelectMenu
            v-model="selectedAthleteId"
            :options="athleteOptions"
            value-attribute="value"
            option-attribute="label"
            searchable
            placeholder="Buscar atleta..."
          />
        </UFormGroup>

        <p v-if="selectedAthleteId" class="text-xs text-gray-500 dark:text-slate-500">
          Al confirmar, los resultados de "{{ selectedSwimmer.swimmer_name }}" se vincularán
          al atleta seleccionado.
        </p>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showMatchModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="primary"
            class="flex-1"
            :disabled="!selectedAthleteId"
            :loading="matchingInProgress"
            @click="handleConfirmMatch"
          >
            Confirmar
          </SButton>
        </div>
      </template>
    </SModal>
  </div>
</template>
