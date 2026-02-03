<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

definePageMeta({

})

const route = useRoute()
const athleteId = computed(() => route.params.id as string)

const { currentAthlete, loading, fetchAthlete, deleteAthlete } = useAthletes()
const { isAthlete, isCoach, isClubAdmin, isAdmin, linkedAthlete } = useProfile()
const { success } = useAppToast()
const router = useRouter()
const { exporting, exportElementToPDF } = useChartExport()

// Ref for the charts section to export
const chartsSection = ref<HTMLElement | null>(null)

// Check if this is the athlete viewing their own profile
const isOwnProfile = computed(() => {
  return isAthlete.value && linkedAthlete.value?.id === athleteId.value
})

// Permissions
const canEditAthlete = computed(() => isClubAdmin.value || isAdmin.value)
const canDeleteAthlete = computed(() => isClubAdmin.value || isAdmin.value)
const canAssignObjectives = computed(() => isCoach.value || isClubAdmin.value || isAdmin.value)
const canRegisterTraining = computed(() => isCoach.value || isClubAdmin.value || isAdmin.value)

// Export charts to PDF
const handleExportPDF = async () => {
  if (!chartsSection.value || !currentAthlete.value) return

  await exportElementToPDF(chartsSection.value, {
    title: 'Reporte de Rendimiento',
    athleteName: `${currentAthlete.value.first_name} ${currentAthlete.value.last_name}`,
    athleteInfo: `${currentAthlete.value.age_category} · ${currentAthlete.value.club_name || 'Sin club'}`,
    filename: `reporte-${currentAthlete.value.first_name}-${currentAthlete.value.last_name}.pdf`,
  })
}

// Fetch athlete data
onMounted(() => {
  fetchAthlete(athleteId.value)
})

// Fetch best times for this athlete
const supabase = useSupabaseClient()
const bestTimes = ref<any[]>([])
const loadingTimes = ref(false)

const fetchBestTimes = async () => {
  loadingTimes.value = true
  const { data } = await supabase
    .from('athlete_best_times')
    .select('*')
    .eq('athlete_id', athleteId.value)
    .order('distance_m')

  bestTimes.value = data || []
  loadingTimes.value = false
}

onMounted(() => {
  fetchBestTimes()
})

const sexLabels = {
  M: 'Masculino',
  F: 'Femenino',
}

const showDeleteModal = ref(false)

const handleDelete = async () => {
  const deleted = await deleteAthlete(athleteId.value)
  if (deleted) {
    showDeleteModal.value = false
    router.push('/athletes')
  }
}
</script>

<template>
  <div>
    <SPageHeader
      :title="isOwnProfile ? 'Mi Perfil de Atleta' : (currentAthlete ? `${currentAthlete.first_name} ${currentAthlete.last_name}` : 'Cargando...')"
      :back-to="isOwnProfile ? '/' : '/athletes'"
    >
      <template v-if="canEditAthlete && currentAthlete" #actions>
        <NuxtLink
          :to="`/athletes/${athleteId}/edit`"
          class="p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </NuxtLink>
      </template>
    </SPageHeader>

    <SLoadingState v-if="loading" text="Cargando atleta..." />

    <div v-else-if="currentAthlete" class="space-y-4">
      <!-- Profile card -->
      <SCard>
        <div class="flex items-center gap-4">
          <SAvatar
            :src="currentAthlete.photo_url"
            :name="`${currentAthlete.first_name} ${currentAthlete.last_name}`"
            size="xl"
          />
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900 dark:text-slate-50">
              {{ currentAthlete.first_name }} {{ currentAthlete.last_name }}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              <SBadge
                v-if="currentAthlete.sex"
                :text="sexLabels[currentAthlete.sex] || currentAthlete.sex"
                :color="currentAthlete.sex === 'M' ? 'primary' : 'warning'"
              />
              <SBadge
                v-if="currentAthlete.age_category"
                :text="currentAthlete.age_category"
                color="gray"
              />
            </div>
          </div>
          <!-- Edit button for admins -->
          <NuxtLink
            v-if="canEditAthlete"
            :to="`/athletes/${athleteId}/edit`"
            class="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
            title="Editar atleta"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </NuxtLink>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-slate-400">Edad</span>
            <p class="font-medium">{{ currentAthlete.age }} años</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400">Nacimiento</span>
            <p class="font-medium">{{ currentAthlete.birth_date }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400">Club</span>
            <p class="font-medium">{{ currentAthlete.club_name || '-' }}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-slate-400">Estado</span>
            <p class="font-medium">
              <span :class="currentAthlete.active !== false ? 'text-success-500' : 'text-error-500'">
                {{ currentAthlete.active !== false ? 'Activo' : 'Inactivo' }}
              </span>
            </p>
          </div>
        </div>
      </SCard>

      <!-- Best times -->
      <SCard title="Mejores Tiempos">
        <template #actions>
          <NuxtLink
            :to="`/athletes/${athleteId}/times`"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            Ver gráficos
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </NuxtLink>
        </template>
        <SLoadingState v-if="loadingTimes" type="skeleton" />
        <div v-else-if="bestTimes.length > 0" class="space-y-2">
          <div
            v-for="time in bestTimes"
            :key="time.test_id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
          >
            <div>
              <span class="font-medium">{{ time.distance_m }}m {{ time.stroke }}</span>
              <span class="text-gray-500 dark:text-slate-400 text-sm ml-1">({{ time.pool_type }})</span>
            </div>
            <div class="text-right">
              <span class="font-mono font-bold text-primary-600">
                {{ time.best_time_formatted || msToTimeString(time.best_time_ms) }}
              </span>
              <p v-if="time.achieved_date" class="text-xs text-gray-500 dark:text-slate-400">
                {{ time.achieved_date }}
              </p>
            </div>
          </div>
        </div>
        <SEmptyState
          v-else
          icon="chart"
          title="Sin registros"
          description="Registra entrenamientos para ver los mejores tiempos."
        />
      </SCard>

      <!-- Badges (Medals) -->
      <BadgesPanel :athlete-id="athleteId" />

      <!-- Objectives -->
      <ObjectivesPanel :athlete-id="athleteId" />

      <!-- Charts section for PDF export -->
      <div ref="chartsSection" class="space-y-4">
        <!-- Export PDF button -->
        <div class="flex justify-end">
          <button
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
            :disabled="exporting"
            @click="handleExportPDF"
          >
            <svg v-if="!exporting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ exporting ? 'Generando PDF...' : 'Descargar PDF' }}
          </button>
        </div>

        <!-- Progress Charts -->
        <AthleteProgressPanel :athlete-id="athleteId" />

        <!-- Competition Results -->
        <div id="competitions">
          <CompetitionResultsPanel
            v-if="currentAthlete"
            :athlete-id="athleteId"
          />
        </div>
      </div>

      <!-- Quick actions - Only show for coaches/admins -->
      <SCard v-if="canRegisterTraining || canAssignObjectives || canDeleteAthlete" title="Acciones">
        <div class="space-y-2">
          <NuxtLink
            v-if="canRegisterTraining"
            :to="`/training/new?athlete=${athleteId}`"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar entrenamiento</span>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>

          <NuxtLink
            v-if="canAssignObjectives"
            :to="`/athletes/${athleteId}/objectives/new`"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Asignar objetivo</span>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>

          <button
            v-if="canDeleteAthlete"
            class="flex items-center justify-between w-full p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-left"
            @click="showDeleteModal = true"
          >
            <div class="flex items-center gap-3 text-red-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Eliminar atleta</span>
            </div>
          </button>
        </div>
      </SCard>
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Atleta no encontrado"
      action-label="Volver a atletas"
      action-to="/athletes"
    />

    <!-- Delete confirmation modal -->
    <SModal v-model="showDeleteModal" title="Eliminar atleta">
      <p class="text-gray-600 mb-4">
        ¿Estas seguro de que deseas eliminar a
        <strong>{{ currentAthlete?.first_name }} {{ currentAthlete?.last_name }}</strong>?
        Esta accion no se puede deshacer.
      </p>
      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showDeleteModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="danger"
            class="flex-1"
            :loading="loading"
            @click="handleDelete"
          >
            Eliminar
          </SButton>
        </div>
      </template>
    </SModal>
  </div>
</template>
