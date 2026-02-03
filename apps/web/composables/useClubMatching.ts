export interface TeamCode {
  team_code: string
  result_count: number
  swimmer_count: number
  is_linked: boolean
}

export interface LinkedTeamCode {
  mapping_id: string
  external_code: string
  result_count: number
  swimmer_count: number
}

export interface ClubUnmatchedSwimmer {
  swimmer_name: string
  swimmer_name_norm: string
  gender: string // Can be M, F, men, women, hombres, mujeres, etc.
  team_code: string
  result_count: number
}

export function useClubMatching() {
  const config = useRuntimeConfig()
  const { error: showError, success } = useAppToast()

  const loading = ref(false)
  const allTeamCodes = ref<TeamCode[]>([])
  const linkedTeamCodes = ref<LinkedTeamCode[]>([])
  const clubSwimmers = ref<ClubUnmatchedSwimmer[]>([])

  const apiBase = config.public.apiUrl || 'http://localhost:8000'

  // Track if API is available
  const apiAvailable = ref(true)

  // Get all team codes (for selection dropdown)
  const fetchAllTeamCodes = async (): Promise<TeamCode[]> => {
    if (!apiAvailable.value) return []
    loading.value = true
    try {
      const response = await $fetch<{ count: number; team_codes: TeamCode[] }>(
        `${apiBase}/api/matching/clubs/team-codes`
      )
      allTeamCodes.value = response.team_codes
      return response.team_codes
    } catch (e: any) {
      // Silently fail if API is not available (network error)
      if (e?.cause?.message === 'Failed to fetch' || e?.message?.includes('Failed to fetch')) {
        apiAvailable.value = false
        console.warn('API de matching no disponible')
      } else {
        showError('Error obteniendo códigos de equipo')
        console.error(e)
      }
      return []
    } finally {
      loading.value = false
    }
  }

  // Get team codes linked to a specific club
  const fetchClubTeamCodes = async (clubId: string): Promise<LinkedTeamCode[]> => {
    if (!apiAvailable.value) return []
    loading.value = true
    try {
      const response = await $fetch<{ club_id: string; count: number; team_codes: LinkedTeamCode[] }>(
        `${apiBase}/api/matching/clubs/${clubId}/team-codes`
      )
      linkedTeamCodes.value = response.team_codes
      return response.team_codes
    } catch (e: any) {
      // Silently fail if API is not available (network error)
      if (e?.cause?.message === 'Failed to fetch' || e?.message?.includes('Failed to fetch')) {
        apiAvailable.value = false
        console.warn('API de matching no disponible')
      } else {
        showError('Error obteniendo códigos vinculados')
        console.error(e)
      }
      return []
    } finally {
      loading.value = false
    }
  }

  // Link a team code to a club
  const linkTeamCode = async (clubId: string, teamCode: string): Promise<boolean> => {
    if (!apiAvailable.value) {
      showError('API de matching no disponible')
      return false
    }
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; error?: string }>(
        `${apiBase}/api/matching/clubs/${clubId}/team-codes`,
        {
          method: 'POST',
          body: { team_code: teamCode },
        }
      )

      if (response.success) {
        success(`Código "${teamCode}" vinculado correctamente`)
        // Refresh lists
        await Promise.all([
          fetchClubTeamCodes(clubId),
          fetchAllTeamCodes(),
        ])
        return true
      } else {
        showError(response.error || 'Error vinculando código')
        return false
      }
    } catch (e) {
      showError('Error vinculando código de equipo')
      console.error(e)
      return false
    } finally {
      loading.value = false
    }
  }

  // Unlink a team code from a club
  const unlinkTeamCode = async (clubId: string, teamCode: string): Promise<boolean> => {
    if (!apiAvailable.value) {
      showError('API de matching no disponible')
      return false
    }
    loading.value = true
    try {
      await $fetch(
        `${apiBase}/api/matching/clubs/${clubId}/team-codes/${teamCode}`,
        { method: 'DELETE' }
      )
      success(`Código "${teamCode}" desvinculado`)
      // Refresh lists
      await Promise.all([
        fetchClubTeamCodes(clubId),
        fetchAllTeamCodes(),
      ])
      return true
    } catch (e) {
      showError('Error desvinculando código')
      console.error(e)
      return false
    } finally {
      loading.value = false
    }
  }

  // Get unmatched swimmers for a club's linked team codes
  const fetchClubUnmatchedSwimmers = async (
    clubId: string,
    limit = 100
  ): Promise<ClubUnmatchedSwimmer[]> => {
    if (!apiAvailable.value) return []
    loading.value = true
    try {
      const response = await $fetch<{
        club_id: string
        team_codes: string[]
        count: number
        swimmers: ClubUnmatchedSwimmer[]
      }>(`${apiBase}/api/matching/clubs/${clubId}/unmatched-swimmers`, {
        params: { limit },
      })
      clubSwimmers.value = response.swimmers
      return response.swimmers
    } catch (e: any) {
      if (e?.cause?.message === 'Failed to fetch' || e?.message?.includes('Failed to fetch')) {
        apiAvailable.value = false
        console.warn('API de matching no disponible')
      } else {
        showError('Error obteniendo nadadores del club')
        console.error(e)
      }
      return []
    } finally {
      loading.value = false
    }
  }

  // Available (unlinked) team codes for selection
  const availableTeamCodes = computed(() =>
    allTeamCodes.value.filter((tc) => !tc.is_linked)
  )

  return {
    // State
    loading,
    allTeamCodes,
    linkedTeamCodes,
    clubSwimmers,
    availableTeamCodes,
    apiAvailable,

    // Actions
    fetchAllTeamCodes,
    fetchClubTeamCodes,
    linkTeamCode,
    unlinkTeamCode,
    fetchClubUnmatchedSwimmers,
  }
}
