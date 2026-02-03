<script setup lang="ts">
import type { UpdateClubForm } from '~/types'

definePageMeta({
  
})

const route = useRoute()
const router = useRouter()
const clubId = computed(() => route.params.id as string)

const { currentClub, loading, fetchClub, updateClub } = useClubs()

onMounted(async () => {
  await fetchClub(clubId.value)
  if (currentClub.value) {
    form.name = currentClub.value.name
    form.country = currentClub.value.country
    form.city = currentClub.value.city || ''
    form.logoUrl = currentClub.value.logo_url || undefined
  }
})

const form = reactive<UpdateClubForm>({
  name: '',
  country: '',
  city: '',
  logoUrl: undefined,
})

const countryOptions = [
  { value: 'MX', label: 'Mexico' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'ES', label: 'Espana' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Peru' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'GT', label: 'Guatemala' },
]

const saving = ref(false)

const handleSubmit = async () => {
  saving.value = true
  const updated = await updateClub(clubId.value, form)
  saving.value = false
  if (updated) {
    router.push(`/clubs/${clubId.value}`)
  }
}
</script>

<template>
  <div>
    <SPageHeader
      title="Editar Club"
      :back-to="`/clubs/${clubId}`"
    />

    <SLoadingState v-if="loading" text="Cargando..." />

    <SCard v-else>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <SInput
          v-model="form.name"
          label="Nombre del club"
          type="text"
          placeholder="Club de Natacion..."
          required
        />

        <SSelect
          v-model="form.country"
          label="Pais"
          :options="countryOptions"
          required
        />

        <SInput
          v-model="form.city"
          label="Ciudad (opcional)"
          type="text"
          placeholder="Ciudad de Mexico"
        />

        <SInput
          v-model="form.logoUrl"
          label="URL del logo (opcional)"
          type="url"
          placeholder="https://..."
        />

        <div class="flex gap-3 pt-4">
          <SButton
            variant="outline"
            :to="`/clubs/${clubId}`"
            class="flex-1"
          >
            Cancelar
          </SButton>
          <SButton
            type="submit"
            variant="primary"
            :loading="saving"
            class="flex-1"
          >
            Guardar cambios
          </SButton>
        </div>
      </form>
    </SCard>
  </div>
</template>
