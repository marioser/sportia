<script setup lang="ts">
import type { UpdateAthleteForm, Sex } from '~/types'

definePageMeta({

})

const route = useRoute()
const router = useRouter()
const athleteId = computed(() => route.params.id as string)

const { currentAthlete, loading, fetchAthlete, updateAthlete } = useAthletes()
const { isAdmin, isClubAdmin, profile } = useProfile()

// Permission check - only admins and club admins can edit
const canEdit = computed(() => isAdmin.value || isClubAdmin.value)

// Wait for profile to load before checking permissions
const profileLoaded = computed(() => profile.value !== null)

// Redirect if no permission (only after profile is loaded)
watch([canEdit, profileLoaded], ([hasPermission, loaded]) => {
  if (loaded && !hasPermission) {
    router.push(`/athletes/${athleteId.value}`)
  }
})

// Fetch athlete data
onMounted(() => {
  fetchAthlete(athleteId.value)
})

// Calculate max date (today) and default min date (120 years ago)
const today = new Date().toISOString().split('T')[0]
const minDate = new Date()
minDate.setFullYear(minDate.getFullYear() - 120)
const minDateStr = minDate.toISOString().split('T')[0]

const sexOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

const form = reactive<UpdateAthleteForm>({
  firstName: '',
  lastName: '',
  birthDate: '',
  sex: 'M',
  photoUrl: undefined,
  active: true,
  documentNumber: undefined,
})

// Initialize form when athlete loads
watch(
  () => currentAthlete.value,
  (athlete) => {
    if (athlete) {
      form.firstName = athlete.first_name || ''
      form.lastName = athlete.last_name || ''
      form.birthDate = athlete.birth_date || ''
      form.sex = (athlete.sex as Sex) || 'M'
      form.photoUrl = athlete.photo_url || undefined
      form.active = athlete.active !== false
      form.documentNumber = (athlete as any).document_number || undefined
    }
  },
  { immediate: true }
)

const saving = ref(false)

const handleSubmit = async () => {
  saving.value = true
  const updated = await updateAthlete(athleteId.value, form)
  saving.value = false
  if (updated) {
    router.push(`/athletes/${athleteId.value}`)
  }
}
</script>

<template>
  <div>
    <SPageHeader
      title="Editar Atleta"
      :back-to="`/athletes/${athleteId}`"
    />

    <!-- Loading profile -->
    <SLoadingState v-if="!profileLoaded" text="Verificando permisos..." />

    <!-- Permission check (only show after profile loaded) -->
    <SEmptyState
      v-else-if="!canEdit"
      icon="warning"
      title="Sin permisos"
      description="No tienes permisos para editar atletas."
      action-label="Volver"
      :action-to="`/athletes/${athleteId}`"
    />

    <UCard v-else>
      <div v-if="loading && !currentAthlete" class="text-center py-8">
        <p>Cargando...</p>
      </div>
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Nombre" required>
            <UInput
              v-model="form.firstName"
              placeholder="Juan"
              autocomplete="given-name"
              required
            />
          </UFormGroup>

          <UFormGroup label="Apellido" required>
            <UInput
              v-model="form.lastName"
              placeholder="Perez"
              autocomplete="family-name"
              required
            />
          </UFormGroup>
        </div>

        <UFormGroup label="Fecha de nacimiento" required>
          <UInput
            v-model="form.birthDate"
            type="date"
            :min="minDateStr"
            :max="today"
            required
          />
        </UFormGroup>

        <UFormGroup label="Sexo" required>
          <USelect
            v-model="form.sex"
            :options="sexOptions"
            option-attribute="label"
            value-attribute="value"
          />
        </UFormGroup>

        <UFormGroup label="Número de documento (ID nacional)" help="Usado para sincronizar resultados de competencias oficiales">
          <UInput
            v-model="form.documentNumber"
            placeholder="1234567890"
            type="text"
            maxlength="20"
          />
        </UFormGroup>

        <UFormGroup label="URL de foto (opcional)">
          <UInput
            v-model="form.photoUrl"
            type="url"
            placeholder="https://..."
          />
        </UFormGroup>

        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <UCheckbox
            id="active"
            v-model="form.active"
            label="Atleta activo"
          />
        </div>

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
            :loading="saving"
            class="flex-1"
            block
          >
            Guardar
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
