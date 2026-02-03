import type { Database } from '@sportia/shared'
import type { Coach, CoachInsert } from '~/types'

export function useCoaches() {
  const supabase = useSupabaseClient<Database>()
  const { success, error: showError } = useAppToast()

  const coaches = ref<Coach[]>([])
  const currentCoach = ref<Coach | null>(null)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const fetchCoaches = async (clubId?: string) => {
    loading.value = true
    clearError()

    try {
      if (clubId) {
        // First get the user_ids of club members with COACH role in this club
        const { data: clubCoaches, error: clubError } = await supabase
          .from('club_members')
          .select('user_id')
          .eq('club_id', clubId)
          .eq('role_in_club', 'COACH')

        if (clubError) {
          errorMessage.value = clubError.message
          return []
        }

        const coachUserIds = clubCoaches?.map((c) => c.user_id) || []

        if (coachUserIds.length === 0) {
          coaches.value = []
          return []
        }

        // Then fetch coaches that match those user_ids
        const { data, error } = await supabase
          .from('coaches')
          .select(`
            *,
            profiles (full_name, avatar_url)
          `)
          .in('user_id', coachUserIds)

        if (error) {
          errorMessage.value = error.message
          return []
        }

        coaches.value = data || []
        return data || []
      } else {
        // Fetch all coaches
        const { data, error } = await supabase
          .from('coaches')
          .select(`
            *,
            profiles (full_name, avatar_url)
          `)

        if (error) {
          errorMessage.value = error.message
          return []
        }

        coaches.value = data || []
        return data || []
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar entrenadores'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchCoach = async (id: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('coaches')
        .select(`
          *,
          profiles (full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) {
        errorMessage.value = error.message
        return null
      }

      currentCoach.value = data
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar entrenador'
      errorMessage.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const createCoach = async (userId: string, specialization?: string, isIndependent = false) => {
    loading.value = true
    clearError()

    try {
      const insert: CoachInsert = {
        user_id: userId,
        is_independent: isIndependent,
        specialization: specialization || null,
      }

      const { data, error } = await supabase
        .from('coaches')
        .insert(insert)
        .select()
        .single()

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return null
      }

      success('Entrenador creado')
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear entrenador'
      errorMessage.value = message
      showError(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const assignAthleteToCoach = async (coachId: string, athleteId: string) => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase
        .from('coach_athlete')
        .insert({
          coach_id: coachId,
          athlete_id: athleteId,
        })

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Atleta asignado')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al asignar atleta'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const unassignAthleteFromCoach = async (coachId: string, athleteId: string) => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase
        .from('coach_athlete')
        .delete()
        .eq('coach_id', coachId)
        .eq('athlete_id', athleteId)

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Atleta desasignado')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al desasignar atleta'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // Fetch athletes assigned to a coach
  const fetchCoachAthletes = async (coachId: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('coach_athlete')
        .select(`
          athlete_id,
          assigned_at,
          athletes (
            id,
            first_name,
            last_name,
            birth_date,
            sex,
            photo_url,
            active
          )
        `)
        .eq('coach_id', coachId)

      if (error) {
        errorMessage.value = error.message
        return []
      }

      return data?.map((ca: any) => ({
        ...ca.athletes,
        assigned_at: ca.assigned_at,
      })) || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar atletas'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch coaches for a specific athlete
  const fetchAthleteCoaches = async (athleteId: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('coach_athlete')
        .select(`
          coach_id,
          assigned_at,
          coaches (
            id,
            specialization,
            profiles (full_name, avatar_url)
          )
        `)
        .eq('athlete_id', athleteId)

      if (error) {
        errorMessage.value = error.message
        return []
      }

      return data?.map((ca: any) => ({
        ...ca.coaches,
        assigned_at: ca.assigned_at,
      })) || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar entrenadores'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  // Update a coach's role in club
  const updateCoachRole = async (userId: string, clubId: string, role: 'COACH' | 'ADMIN' = 'COACH') => {
    loading.value = true
    try {
      const { error } = await supabase
        .from('club_members')
        .upsert({
          user_id: userId,
          club_id: clubId,
          role_in_club: role,
        }, { onConflict: 'club_id,user_id' })

      if (error) throw error
      success('Rol actualizado')
      return true
    } catch (e) {
      showError('Error actualizando rol')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    coaches: readonly(coaches),
    currentCoach: readonly(currentCoach),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    fetchCoaches,
    fetchCoach,
    createCoach,
    assignAthleteToCoach,
    unassignAthleteFromCoach,
    fetchCoachAthletes,
    fetchAthleteCoaches,
    updateCoachRole,
    clearError,
  }
}
