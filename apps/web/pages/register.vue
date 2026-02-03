<script setup lang="ts">
import type { RegisterForm } from '~/types'

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
})

const { register, loading, errorMessage, clearError } = useAuth()
const router = useRouter()

const form = reactive<RegisterForm>({
  email: '',
  password: '',
  fullName: '',
})

const confirmPassword = ref('')
const passwordError = ref('')

const handleSubmit = async () => {
  if (form.password !== confirmPassword.value) {
    passwordError.value = 'Las contrasenas no coinciden'
    return
  }

  if (form.password.length < 6) {
    passwordError.value = 'La contrasena debe tener al menos 6 caracteres'
    return
  }

  passwordError.value = ''
  const success = await register(form)
  if (success) {
    router.push('/login')
  }
}
</script>

<template>
  <div>
    <SCard title="Crear Cuenta">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <SInput
          v-model="form.fullName"
          label="Nombre completo"
          type="text"
          placeholder="Juan Perez"
          autocomplete="name"
          required
          @focus="clearError"
        />

        <SInput
          v-model="form.email"
          label="Correo electronico"
          type="email"
          placeholder="tu@email.com"
          autocomplete="email"
          inputmode="email"
          required
          @focus="clearError"
        />

        <SInput
          v-model="form.password"
          label="Contrasena"
          type="password"
          placeholder="Min. 6 caracteres"
          autocomplete="new-password"
          required
          :error="passwordError"
          @focus="passwordError = ''"
        />

        <SInput
          v-model="confirmPassword"
          label="Confirmar contrasena"
          type="password"
          placeholder="Repite tu contrasena"
          autocomplete="new-password"
          required
          @focus="passwordError = ''"
        />

        <p v-if="errorMessage" class="text-sm text-red-500">
          {{ errorMessage }}
        </p>

        <SButton
          type="submit"
          variant="primary"
          :loading="loading"
          block
        >
          Crear cuenta
        </SButton>
      </form>
    </SCard>

    <p class="mt-6 text-center text-sm text-gray-600">
      ¿Ya tienes cuenta?
      <NuxtLink to="/login" class="text-primary-600 font-medium hover:underline">
        Inicia sesion
      </NuxtLink>
    </p>
  </div>
</template>
