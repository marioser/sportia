<script setup lang="ts">
import type { CreateClubForm } from '~/types'

definePageMeta({
  
})

const router = useRouter()
const { createClub, loading } = useClubs()

const form = reactive<CreateClubForm>({
  name: '',
  country: 'MX',
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

const handleSubmit = async () => {
  const club = await createClub(form)
  if (club) {
    router.push(`/clubs/${club.id}`)
  }
}
</script>

<template>
  <div>
    <SPageHeader title="Nuevo Club" back-to="/clubs" />

    <SCard>
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
            to="/clubs"
            class="flex-1"
          >
            Cancelar
          </SButton>
          <SButton
            type="submit"
            variant="primary"
            :loading="loading"
            class="flex-1"
          >
            Crear club
          </SButton>
        </div>
      </form>
    </SCard>
  </div>
</template>
