<script setup lang="ts">
import type { LoginForm } from '~/types'

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
})

const { login, loading, errorMessage, clearError } = useAuth()
const router = useRouter()
const route = useRoute()

const form = reactive<LoginForm>({
  email: '',
  password: '',
})

// Get redirect URL from query params (set by auth middleware)
const redirectTo = computed(() => {
  const redirect = route.query.redirect as string | undefined
  return redirect || '/'
})

const handleSubmit = async () => {
  const success = await login(form)
  if (success) {
    router.push(redirectTo.value)
  }
}
</script>

<template>
  <div>
    <SCard title="Iniciar Sesion">
      <form class="space-y-4" @submit.prevent="handleSubmit">
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
          placeholder="********"
          autocomplete="current-password"
          required
          @focus="clearError"
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
          Iniciar sesion
        </SButton>
      </form>

      <div class="mt-4 text-center space-y-2">
        <NuxtLink
          to="/forgot-password"
          class="text-sm text-primary-600 hover:underline"
        >
          ¿Olvidaste tu contrasena?
        </NuxtLink>
      </div>
    </SCard>

    <p class="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
      ¿No tienes cuenta?
      <NuxtLink to="/register" class="text-primary-600 dark:text-primary-400 font-medium hover:underline">
        Registrate
      </NuxtLink>
    </p>
  </div>
</template>
