import type { LoginForm, RegisterForm, ForgotPasswordForm } from '~/types'

export function useAuth() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { success, error: showError } = useAppToast()

  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const login = async (form: LoginForm) => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Inicio de sesion exitoso')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al iniciar sesion'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const register = async (form: RegisterForm) => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          },
        },
      })

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Cuenta creada. Revisa tu correo para confirmar.')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al registrar'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Sesion cerrada')
      await navigateTo('/login')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cerrar sesion'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const forgotPassword = async (form: ForgotPasswordForm) => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Revisa tu correo para restablecer tu contrasena')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al enviar correo'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const isAuthenticated = computed(() => !!user.value)

  return {
    user,
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    clearError,
  }
}
