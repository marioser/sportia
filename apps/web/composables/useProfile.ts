import type { Database } from '@sportia/shared'
import type { Profile, ProfileForm, UserRole, ClubMember } from '~/types'
import type { SimulationState } from './useSimulation'

export function useProfile() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { success, error: showError } = useAppToast()

  // Access shared simulation state (uses same key as useSimulation)
  const simulationState = useState<SimulationState>('simulation', () => ({
    active: false,
    target: null,
  }))

  const profile = ref<Profile | null>(null)
  const clubMemberships = ref<ClubMember[]>([])
  const linkedAthlete = ref<{ id: string; first_name: string; last_name: string; club_id: string } | null>(null)
  const linkedCoach = ref<{ id: string; user_id: string } | null>(null)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const fetchProfile = async () => {
    if (!user.value) return null

    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) {
        errorMessage.value = error.message
        return null
      }

      profile.value = data
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar perfil'
      errorMessage.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchClubMemberships = async () => {
    if (!user.value) return []

    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('*')
        .eq('user_id', user.value.id)

      if (error) {
        errorMessage.value = error.message
        return []
      }

      clubMemberships.value = data || []
      return data || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar membresías'
      errorMessage.value = message
      return []
    }
  }

  const fetchLinkedAthlete = async () => {
    if (!user.value) return null

    try {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, club_id')
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching linked athlete:', error)
        return null
      }

      linkedAthlete.value = data
      return data
    } catch (e) {
      console.error('Error fetching linked athlete:', e)
      return null
    }
  }

  const fetchLinkedCoach = async () => {
    if (!user.value) return null

    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('id, user_id')
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching linked coach:', error)
        return null
      }

      linkedCoach.value = data
      return data
    } catch (e) {
      console.error('Error fetching linked coach:', e)
      return null
    }
  }

  const updateProfile = async (form: ProfileForm) => {
    if (!user.value) return false

    loading.value = true
    clearError()

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.fullName,
          avatar_url: form.avatarUrl || null,
        })
        .eq('id', user.value.id)

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      await fetchProfile()
      success('Perfil actualizado')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar perfil'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const role = computed<UserRole | null>(() => profile.value?.role || null)

  const isAdmin = computed(() => role.value === 'ADMIN')
  const isClubAdmin = computed(() => role.value === 'CLUB_ADMIN' || role.value === 'ADMIN')
  const isCoach = computed(() =>
    role.value === 'COACH' || role.value === 'CLUB_ADMIN' || role.value === 'ADMIN'
  )
  const isAthlete = computed(() => role.value === 'ATHLETE')

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!role.value) return false

    const hierarchy: Record<UserRole, number> = {
      ADMIN: 4,
      CLUB_ADMIN: 3,
      COACH: 2,
      ATHLETE: 1,
    }

    return hierarchy[role.value] >= hierarchy[requiredRole]
  }

  const primaryClubId = computed(() => {
    if (clubMemberships.value.length === 0) return null
    // Return first club where user is admin, or first club
    const adminClub = clubMemberships.value.find((m) => m.role_in_club === 'ADMIN')
    return adminClub?.club_id || clubMemberships.value[0]?.club_id || null
  })

  // ===== Effective permissions (simulation-aware) =====
  // These return the simulated values when in simulation mode

  const effectiveRole = computed<UserRole | null>(() => {
    if (simulationState.value.active && simulationState.value.target) {
      switch (simulationState.value.target.type) {
        case 'athlete':
          return 'ATHLETE'
        case 'coach':
          return 'COACH'
        case 'club_admin':
          return 'CLUB_ADMIN'
      }
    }
    return role.value
  })

  const effectiveClubId = computed<string | null>(() => {
    if (simulationState.value.active && simulationState.value.target?.clubId) {
      return simulationState.value.target.clubId
    }
    return primaryClubId.value
  })

  // Effective permission checks (use these when determining what UI to show)
  const effectiveIsAdmin = computed(() => {
    // In simulation mode, only actual ADMIN can still be admin
    if (simulationState.value.active) {
      return false // Simulating as non-admin
    }
    return isAdmin.value
  })

  const effectiveIsClubAdmin = computed(() => {
    if (simulationState.value.active) {
      return simulationState.value.target?.type === 'club_admin'
    }
    return isClubAdmin.value
  })

  const effectiveIsCoach = computed(() => {
    if (simulationState.value.active) {
      return (
        simulationState.value.target?.type === 'coach' ||
        simulationState.value.target?.type === 'club_admin'
      )
    }
    return isCoach.value
  })

  const effectiveIsAthlete = computed(() => {
    if (simulationState.value.active) {
      return simulationState.value.target?.type === 'athlete'
    }
    return isAthlete.value
  })

  // Initialize profile when user changes
  watch(user, async (newUser) => {
    if (newUser) {
      await Promise.all([
        fetchProfile(),
        fetchClubMemberships(),
        fetchLinkedAthlete(),
        fetchLinkedCoach(),
      ])
    } else {
      profile.value = null
      clubMemberships.value = []
      linkedAthlete.value = null
      linkedCoach.value = null
    }
  }, { immediate: true })

  return {
    profile: readonly(profile),
    clubMemberships: readonly(clubMemberships),
    linkedAthlete: readonly(linkedAthlete),
    linkedCoach: readonly(linkedCoach),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    // Real permissions (use for actual data access and RLS)
    role,
    isAdmin,
    isClubAdmin,
    isCoach,
    isAthlete,
    primaryClubId,
    // Effective permissions (simulation-aware, use for UI display)
    effectiveRole,
    effectiveClubId,
    effectiveIsAdmin,
    effectiveIsClubAdmin,
    effectiveIsCoach,
    effectiveIsAthlete,
    // Methods
    fetchProfile,
    fetchClubMemberships,
    fetchLinkedAthlete,
    fetchLinkedCoach,
    updateProfile,
    hasPermission,
    clearError,
  }
}
