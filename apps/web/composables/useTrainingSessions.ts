import type { Database } from '@sportia/shared'
import type {
  TrainingSessionWithLoad,
  TrainingSessionInsert,
  TrainingSessionUpdate,
  CreateSessionForm,
  UpdateSessionForm,
} from '~/types'

export function useTrainingSessions() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { success, error: showError } = useAppToast()

  const sessions = ref<TrainingSessionWithLoad[]>([])
  const currentSession = ref<TrainingSessionWithLoad | null>(null)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const fetchSessions = async (athleteId?: string, limit = 50) => {
    loading.value = true
    clearError()

    try {
      let query = supabase
        .from('training_sessions_with_load')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(limit)

      if (athleteId) {
        query = query.eq('athlete_id', athleteId)
      }

      const { data, error } = await query

      if (error) {
        errorMessage.value = error.message
        return []
      }

      sessions.value = data || []
      return data || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar sesiones'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchSession = async (id: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('training_sessions_with_load')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        errorMessage.value = error.message
        return null
      }

      currentSession.value = data
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar sesion'
      errorMessage.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const createSession = async (form: CreateSessionForm) => {
    if (!user.value) {
      showError('Debes iniciar sesion')
      return null
    }

    loading.value = true
    clearError()

    try {
      const insert: TrainingSessionInsert = {
        athlete_id: form.athleteId,
        session_date: form.sessionDate,
        session_type: form.sessionType,
        duration_min: form.durationMin,
        session_rpe: form.sessionRpe,
        notes: form.notes || null,
        created_by: user.value.id,
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .insert(insert)
        .select()
        .single()

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return null
      }

      success('Sesion creada')
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear sesion'
      errorMessage.value = message
      showError(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateSession = async (id: string, form: UpdateSessionForm) => {
    loading.value = true
    clearError()

    try {
      const update: TrainingSessionUpdate = {}
      if (form.sessionDate !== undefined) update.session_date = form.sessionDate
      if (form.sessionType !== undefined) update.session_type = form.sessionType
      if (form.durationMin !== undefined) update.duration_min = form.durationMin
      if (form.sessionRpe !== undefined) update.session_rpe = form.sessionRpe
      if (form.notes !== undefined) update.notes = form.notes || null

      const { error } = await supabase
        .from('training_sessions')
        .update(update)
        .eq('id', id)

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Sesion actualizada')
      await fetchSession(id)
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar sesion'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteSession = async (id: string) => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', id)

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Sesion eliminada')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar sesion'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    sessions: readonly(sessions),
    currentSession: readonly(currentSession),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    fetchSessions,
    fetchSession,
    createSession,
    updateSession,
    deleteSession,
    clearError,
  }
}
