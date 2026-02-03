<script setup lang="ts">
definePageMeta({})

const router = useRouter()
const supabase = useSupabaseClient()
const { isAdmin, profile } = useProfile()
const { isSimulating, simulationTarget, simulateAsAthlete, simulateAsCoach, simulateAsClubAdmin, stopSimulation } = useSimulation()
const { success, error: showError } = useAppToast()

// Redirect if not admin (wait for profile to load first)
watch([isAdmin, profile], ([admin, prof]) => {
  // Only redirect once profile is loaded and user is not admin
  if (prof && !admin) {
    router.push('/')
  }
})

// Load clubs
const clubs = ref<any[]>([])
const loadingClubs = ref(false)

const loadClubs = async () => {
  loadingClubs.value = true
  const { data } = await supabase.from('clubs').select('id, name').order('name')
  clubs.value = data || []
  loadingClubs.value = false
}

// Load athletes for selected club
const athletes = ref<any[]>([])
const loadingAthletes = ref(false)
const selectedClubId = ref('')

const loadAthletes = async (clubId: string) => {
  if (!clubId) {
    athletes.value = []
    return
  }
  loadingAthletes.value = true
  const { data } = await supabase
    .from('athletes_with_age')
    .select('id, first_name, last_name, age_category')
    .eq('club_id', clubId)
    .eq('active', true)
    .order('last_name')
  athletes.value = data || []
  loadingAthletes.value = false
}

// Load coaches for selected club
const coaches = ref<any[]>([])
const loadingCoaches = ref(false)

const loadCoaches = async (clubId: string) => {
  if (!clubId) {
    coaches.value = []
    return
  }
  loadingCoaches.value = true

  // Get club members with COACH role
  const { data: clubCoaches } = await supabase
    .from('club_members')
    .select(`
      user_id,
      profiles (id, full_name)
    `)
    .eq('club_id', clubId)
    .eq('role_in_club', 'COACH')

  coaches.value = clubCoaches?.map((c: any) => ({
    user_id: c.user_id,
    full_name: c.profiles?.full_name || 'Sin nombre',
  })) || []

  loadingCoaches.value = false
}

// Watch club selection
watch(selectedClubId, (clubId) => {
  loadAthletes(clubId)
  loadCoaches(clubId)
})

// Initialize
onMounted(() => {
  loadClubs()
})

// Club options
const clubOptions = computed(() =>
  clubs.value.map((c) => ({ value: c.id, label: c.name }))
)

// Athlete options
const athleteOptions = computed(() =>
  athletes.value.map((a) => ({
    value: a.id,
    label: `${a.first_name} ${a.last_name}`,
    subtitle: a.age_category,
  }))
)

// Coach options
const coachOptions = computed(() =>
  coaches.value.map((c) => ({
    value: c.user_id,
    label: c.full_name,
  }))
)

// Selection state
const simulationType = ref<'athlete' | 'coach' | 'club_admin'>('athlete')
const selectedAthleteId = ref('')
const selectedCoachId = ref('')

// Start simulation
const handleStartSimulation = () => {
  if (!selectedClubId.value) {
    showError('Selecciona un club')
    return
  }

  const clubName = clubs.value.find((c) => c.id === selectedClubId.value)?.name || 'Club'

  if (simulationType.value === 'athlete') {
    if (!selectedAthleteId.value) {
      showError('Selecciona un atleta')
      return
    }
    const athlete = athletes.value.find((a) => a.id === selectedAthleteId.value)
    const name = athlete ? `${athlete.first_name} ${athlete.last_name}` : 'Atleta'
    simulateAsAthlete(selectedAthleteId.value, name, selectedClubId.value)
    success(`Simulando como atleta: ${name}`)
  } else if (simulationType.value === 'coach') {
    if (!selectedCoachId.value) {
      showError('Selecciona un entrenador')
      return
    }
    const coach = coaches.value.find((c) => c.user_id === selectedCoachId.value)
    const name = coach?.full_name || 'Entrenador'
    simulateAsCoach(selectedCoachId.value, name, selectedClubId.value)
    success(`Simulando como entrenador: ${name}`)
  } else if (simulationType.value === 'club_admin') {
    simulateAsClubAdmin(selectedClubId.value, clubName)
    success(`Simulando como admin de: ${clubName}`)
  }

  router.push('/')
}

// Stop simulation
const handleStopSimulation = () => {
  stopSimulation()
  success('Simulación finalizada')
}
</script>

<template>
  <div>
    <SPageHeader title="Modo Simulación" back-to="/profile" />

    <!-- Only show for admins -->
    <template v-if="isAdmin">
      <!-- Current simulation status -->
      <UCard v-if="isSimulating" class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-slate-400">Simulación activa:</p>
            <p class="font-medium text-gray-900 dark:text-slate-50">
              {{ simulationTarget?.name }}
              <SBadge
                :text="simulationTarget?.type === 'athlete' ? 'Atleta' : simulationTarget?.type === 'coach' ? 'Entrenador' : 'Admin'"
                :color="simulationTarget?.type === 'athlete' ? 'violet' : simulationTarget?.type === 'coach' ? 'teal' : 'amber'"
                size="sm"
                class="ml-2"
              />
            </p>
          </div>
          <UButton color="red" variant="soft" @click="handleStopSimulation">
            Finalizar
          </UButton>
        </div>
      </UCard>

      <!-- Simulation selector -->
      <UCard>
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-slate-400">
            Selecciona un perfil para ver la aplicación desde su perspectiva.
            Esto es útil para soporte y debugging.
          </p>

          <!-- Club selection -->
          <UFormGroup label="Club" required>
            <USelectMenu
              v-model="selectedClubId"
              :options="clubOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecciona un club"
              :loading="loadingClubs"
              searchable
            />
          </UFormGroup>

          <!-- Simulation type -->
          <UFormGroup label="Simular como">
            <div class="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors"
                :class="simulationType === 'athlete' ? 'bg-white dark:bg-slate-700 shadow text-violet-600' : 'text-gray-600 dark:text-slate-400'"
                @click="simulationType = 'athlete'"
              >
                Atleta
              </button>
              <button
                type="button"
                class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors"
                :class="simulationType === 'coach' ? 'bg-white dark:bg-slate-700 shadow text-teal-600' : 'text-gray-600 dark:text-slate-400'"
                @click="simulationType = 'coach'"
              >
                Entrenador
              </button>
              <button
                type="button"
                class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors"
                :class="simulationType === 'club_admin' ? 'bg-white dark:bg-slate-700 shadow text-amber-600' : 'text-gray-600 dark:text-slate-400'"
                @click="simulationType = 'club_admin'"
              >
                Admin Club
              </button>
            </div>
          </UFormGroup>

          <!-- Athlete selection -->
          <UFormGroup v-if="simulationType === 'athlete'" label="Atleta" required>
            <USelectMenu
              v-model="selectedAthleteId"
              :options="athleteOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecciona un atleta"
              :loading="loadingAthletes"
              :disabled="!selectedClubId"
              searchable
            >
              <template #option="{ option }">
                <span>{{ option.label }}</span>
                <span v-if="option.subtitle" class="text-gray-400 ml-2 text-xs">
                  {{ option.subtitle }}
                </span>
              </template>
            </USelectMenu>
            <p v-if="selectedClubId && athletes.length === 0 && !loadingAthletes" class="text-sm text-amber-600 mt-1">
              No hay atletas en este club
            </p>
          </UFormGroup>

          <!-- Coach selection -->
          <UFormGroup v-if="simulationType === 'coach'" label="Entrenador" required>
            <USelectMenu
              v-model="selectedCoachId"
              :options="coachOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Selecciona un entrenador"
              :loading="loadingCoaches"
              :disabled="!selectedClubId"
              searchable
            />
            <p v-if="selectedClubId && coaches.length === 0 && !loadingCoaches" class="text-sm text-amber-600 mt-1">
              No hay entrenadores en este club
            </p>
          </UFormGroup>

          <!-- Club admin info -->
          <div v-if="simulationType === 'club_admin' && selectedClubId" class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p class="text-sm text-amber-800 dark:text-amber-200">
              Verás la aplicación como administrador del club seleccionado.
              Tendrás acceso a gestionar atletas, entrenadores y configuración del club.
            </p>
          </div>

          <!-- Start button -->
          <UButton
            color="primary"
            block
            :disabled="!selectedClubId || (simulationType === 'athlete' && !selectedAthleteId) || (simulationType === 'coach' && !selectedCoachId)"
            @click="handleStartSimulation"
          >
            <UIcon name="i-heroicons-eye" class="w-4 h-4 mr-2" />
            Iniciar Simulación
          </UButton>
        </div>
      </UCard>

      <!-- Info card -->
      <UCard class="mt-4">
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary-500" />
          </div>
          <div class="text-sm text-gray-600 dark:text-slate-400">
            <p class="font-medium text-gray-900 dark:text-slate-50 mb-1">Sobre el modo simulación</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Puedes ver la app como si fueras otro usuario</li>
              <li>Las acciones que realices afectarán datos reales</li>
              <li>Usa el botón "Salir" en el banner superior para finalizar</li>
              <li>La simulación persiste entre recargas de página</li>
            </ul>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Not admin -->
    <SEmptyState
      v-else
      icon="users"
      title="Acceso restringido"
      description="Solo los administradores pueden usar el modo simulación."
      action-label="Volver al inicio"
      action-to="/"
    />
  </div>
</template>
