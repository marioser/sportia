<script setup lang="ts">
import type { ProfileForm } from '~/types'

definePageMeta({
  
})

const router = useRouter()
const { profile, loading, updateProfile } = useProfile()

const form = reactive<ProfileForm>({
  fullName: '',
  avatarUrl: undefined,
})

// Initialize form when profile loads
watch(
  () => profile.value,
  (p) => {
    if (p) {
      form.fullName = p.full_name
      form.avatarUrl = p.avatar_url || undefined
    }
  },
  { immediate: true }
)

const saving = ref(false)

const handleSubmit = async () => {
  saving.value = true
  const success = await updateProfile(form)
  saving.value = false
  if (success) {
    router.push('/profile')
  }
}
</script>

<template>
  <div>
    <SPageHeader title="Editar Perfil" back-to="/profile" />

    <SCard>
      <SLoadingState v-if="loading && !profile" />
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div class="flex justify-center mb-4">
          <SAvatar
            :src="form.avatarUrl"
            :name="form.fullName"
            size="xl"
          />
        </div>

        <SInput
          v-model="form.fullName"
          label="Nombre completo"
          type="text"
          placeholder="Tu nombre"
          autocomplete="name"
          required
        />

        <SInput
          v-model="form.avatarUrl"
          label="URL del avatar (opcional)"
          type="text"
          placeholder="https://..."
        />

        <div class="flex gap-3 pt-4">
          <SButton
            variant="outline"
            to="/profile"
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
            Guardar
          </SButton>
        </div>
      </form>
    </SCard>
  </div>
</template>
