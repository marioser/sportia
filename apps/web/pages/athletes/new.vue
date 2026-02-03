<script setup lang="ts">
import type { CreateAthleteForm } from '~/types'

definePageMeta({

})

const router = useRouter()
const { createAthlete, loading } = useAthletes()
const { primaryClubId, isClubAdmin, isAdmin, profile } = useProfile()
const { clubs, fetchClubs } = useClubs()

// Only club admins and super admins can create athletes
const canCreateAthletes = computed(() => isClubAdmin.value || isAdmin.value)

// Redirect if not authorized
watch([canCreateAthletes, profile], ([canCreate, prof]) => {
  if (prof && !canCreate) {
    router.push('/athletes')
  }
})

// Fetch clubs for selection
onMounted(() => {
  fetchClubs()
})

// Options for selects
const sexOptions = [
  { label: 'Masculino', value: 'M' },
  { label: 'Femenino', value: 'F' },
]

const clubItems = computed(() =>
  clubs.value.map((c) => ({
    label: c.name,
    value: c.id,
    suffix: c.city || c.country,
  }))
)

// Calculate max date (today) and default min date (120 years ago)
const today = new Date().toISOString().split('T')[0]
const minDate = new Date()
minDate.setFullYear(minDate.getFullYear() - 120)
const minDateStr = minDate.toISOString().split('T')[0]

const form = reactive<CreateAthleteForm>({
  firstName: '',
  lastName: '',
  birthDate: '',
  sex: 'M',
  clubId: primaryClubId.value || '',
  photoUrl: undefined,
})

// Set club when primaryClubId loads
watch(primaryClubId, (clubId) => {
  if (clubId && !form.clubId) {
    form.clubId = clubId
  }
}, { immediate: true })

const handleSubmit = async () => {
  const athlete = await createAthlete(form)
  if (athlete) {
    router.push(`/athletes/${athlete.id}`)
  }
}
</script>

<template>
  <div>
    <SPageHeader title="Nuevo Atleta" back-to="/athletes" />

    <UCard>
      <form class="space-y-4" @submit.prevent="handleSubmit">
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

        <UFormGroup label="Club" required>
          <USelectMenu
            v-model="form.clubId"
            :options="clubItems"
            option-attribute="label"
            value-attribute="value"
            searchable
            searchable-placeholder="Buscar club..."
            placeholder="Seleccionar club..."
            :loading="clubs.length === 0"
          >
            <template #option="{ option }">
              <div>
                <p class="font-medium">{{ option.label }}</p>
                <p v-if="option.suffix" class="text-xs text-gray-500">{{ option.suffix }}</p>
              </div>
            </template>
          </USelectMenu>
        </UFormGroup>

        <UFormGroup label="URL de foto (opcional)">
          <UInput
            v-model="form.photoUrl"
            type="url"
            placeholder="https://..."
          />
        </UFormGroup>

        <div class="flex gap-3 pt-4">
          <UButton
            variant="outline"
            to="/athletes"
            class="flex-1"
            block
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            class="flex-1"
            block
          >
            Crear atleta
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
