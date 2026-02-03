<script setup lang="ts">
import type { ForgotPasswordForm } from '~/types'

definePageMeta({
  layout: 'auth',
  middleware: 'auth',
})

const { forgotPassword, loading, errorMessage, clearError } = useAuth()

const form = reactive<ForgotPasswordForm>({
  email: '',
})

const emailSent = ref(false)

const handleSubmit = async () => {
  const success = await forgotPassword(form)
  if (success) {
    emailSent.value = true
  }
}
</script>

<template>
  <div>
    <SCard title="Recuperar Contrasena">
      <div v-if="emailSent" class="text-center py-4">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Correo enviado</h3>
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contrasena.
        </p>
        <NuxtLink
          to="/login"
          class="text-primary-600 font-medium hover:underline"
        >
          Volver a iniciar sesion
        </NuxtLink>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu contrasena.
        </p>

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

        <p v-if="errorMessage" class="text-sm text-red-500">
          {{ errorMessage }}
        </p>

        <SButton
          type="submit"
          variant="primary"
          :loading="loading"
          block
        >
          Enviar enlace
        </SButton>
      </form>
    </SCard>

    <p class="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
      <NuxtLink to="/login" class="text-primary-600 font-medium hover:underline">
        Volver a iniciar sesion
      </NuxtLink>
    </p>
  </div>
</template>
