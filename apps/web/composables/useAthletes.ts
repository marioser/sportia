import type { Database } from '@sportia/shared'
import type {
  AthleteWithAge,
  AthleteInsert,
  AthleteUpdate,
  CreateAthleteForm,
  UpdateAthleteForm,
} from '~/types'

export function useAthletes() {
  const supabase = useSupabaseClient<Database>()
  const { success, error: showError } = useAppToast()

  const athletes = ref<AthleteWithAge[]>([])
  const currentAthlete = ref<AthleteWithAge | null>(null)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const fetchAthletes = async (clubId?: string) => {
    loading.value = true
    clearError()

    try {
      let query = supabase
        .from('athletes_with_age')
        .select('*')
        .order('last_name')

      if (clubId) {
        query = query.eq('club_id', clubId)
      }

      const { data, error } = await query

      if (error) {
        errorMessage.value = error.message
        return []
      }

      athletes.value = data || []
      return data || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar atletas'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchAthlete = async (id: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('athletes_with_age')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        errorMessage.value = error.message
        return null
      }

      currentAthlete.value = data
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar atleta'
      errorMessage.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const createAthlete = async (form: CreateAthleteForm) => {
    loading.value = true
    clearError()

    try {
      const insert: AthleteInsert = {
        first_name: form.firstName,
        last_name: form.lastName,
        birth_date: form.birthDate,
        sex: form.sex,
        club_id: form.clubId,
        photo_url: form.photoUrl || null,
        document_number: form.documentNumber || null,
      }

      const { data, error } = await supabase
        .from('athletes')
        .insert(insert)
        .select()
        .single()

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return null
      }

      success('Atleta creado')
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear atleta'
      errorMessage.value = message
      showError(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateAthlete = async (id: string, form: UpdateAthleteForm) => {
    loading.value = true
    clearError()

    try {
      const update: AthleteUpdate = {}
      if (form.firstName !== undefined) update.first_name = form.firstName
      if (form.lastName !== undefined) update.last_name = form.lastName
      if (form.birthDate !== undefined) update.birth_date = form.birthDate
      if (form.sex !== undefined) update.sex = form.sex
      if (form.photoUrl !== undefined) update.photo_url = form.photoUrl || null
      if (form.active !== undefined) update.active = form.active
      if (form.documentNumber !== undefined) update.document_number = form.documentNumber || null

      const { error } = await supabase
        .from('athletes')
        .update(update)
        .eq('id', id)

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Atleta actualizado')
      // Refresh current athlete data
      await fetchAthlete(id)
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar atleta'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteAthlete = async (id: string) => {
    loading.value = true
    clearError()

    try {
      // Soft delete by setting active to false
      const { error } = await supabase
        .from('athletes')
        .update({ active: false })
        .eq('id', id)

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Atleta eliminado')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar atleta'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // Get user account info for athlete (if exists)
  const getAthleteUserAccount = async (athleteId: string) => {
    try {
      const config = useRuntimeConfig()
      const user = useSupabaseUser()

      if (!user.value) return null

      // Get current session token
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      if (!token) return null

      const response = await $fetch<{
        has_account: boolean
        user_account: {
          userId: string
          fullName: string
          email: string
          role: string
        } | null
      }>(`${config.public.apiUrl}/api/admin/athletes/${athleteId}/user-account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.has_account ? response.user_account : null
    } catch (e) {
      console.error('Error getting user account:', e)
      return null
    }
  }

  // Create user account for athlete
  const createUserAccountForAthlete = async (
    athleteId: string,
    email: string,
    password: string,
    fullName: string
  ) => {
    loading.value = true
    clearError()

    try {
      const config = useRuntimeConfig()
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      if (!token) {
        showError('No hay sesión activa')
        return false
      }

      await $fetch(`${config.public.apiUrl}/api/admin/athletes/create-user-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          athlete_id: athleteId,
          email,
          password,
          full_name: fullName,
        },
      })

      success('Cuenta de usuario creada')
      return true
    } catch (e: any) {
      const message = e.data?.detail || e.message || 'Error al crear cuenta'
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // Update user account email
  const updateUserEmail = async (userId: string, newEmail: string) => {
    loading.value = true
    clearError()

    try {
      const config = useRuntimeConfig()
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      if (!token) {
        showError('No hay sesión activa')
        return false
      }

      await $fetch(`${config.public.apiUrl}/api/admin/users/update-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          user_id: userId,
          new_email: newEmail,
        },
      })

      success('Email actualizado')
      return true
    } catch (e: any) {
      const message = e.data?.detail || e.message || 'Error al actualizar email'
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // Update user account password
  const updateUserPassword = async (userId: string, newPassword: string) => {
    loading.value = true
    clearError()

    try {
      const config = useRuntimeConfig()
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token

      if (!token) {
        showError('No hay sesión activa')
        return false
      }

      await $fetch(`${config.public.apiUrl}/api/admin/users/update-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          user_id: userId,
          new_password: newPassword,
        },
      })

      success('Contraseña actualizada')
      return true
    } catch (e: any) {
      const message = e.data?.detail || e.message || 'Error al actualizar contraseña'
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    athletes: readonly(athletes),
    currentAthlete: readonly(currentAthlete),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    fetchAthletes,
    fetchAthlete,
    createAthlete,
    updateAthlete,
    deleteAthlete,
    getAthleteUserAccount,
    createUserAccountForAthlete,
    updateUserEmail,
    updateUserPassword,
    clearError,
  }
}
