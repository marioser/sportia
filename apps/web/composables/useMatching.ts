export interface MatchCandidate {
  athlete_id: string
  first_name: string
  last_name: string
  full_name: string
  birth_date: string | null
  club_name: string | null
  similarity_score: number
}

export interface AthleteMapping {
  id: string
  athlete_id: string | null
  external_name: string
  external_name_norm: string
  confidence_score: number
  source: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  metadata: Record<string, any>
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface UnmatchedSwimmer {
  swimmer_name: string
  swimmer_name_norm: string
  gender: 'M' | 'F' | string
  team_code: string
  result_count: number
  years?: number[]
  best_time_ms?: number
  events?: string[]
}

export interface UnmatchedResponse {
  total: number
  group_by: 'team' | 'gender' | 'both'
  groups: Record<string, UnmatchedSwimmer[] | Record<string, UnmatchedSwimmer[]>>
}

export interface TeamSummary {
  team_code: string
  swimmer_count: number
  male_count: number
  female_count: number
}

export interface UnmatchedSummaryResponse {
  total_teams: number
  total_swimmers: number
  teams: TeamSummary[]
}

export interface MatchStats {
  athlete_mappings: {
    pending: number
    confirmed: number
    rejected: number
  }
  competition_results: {
    linked: number
    unlinked: number
  }
}

export interface MatchSuggestion {
  external_name: string
  matches: MatchCandidate[]
  best_match: MatchCandidate | null
}

export function useMatching() {
  const config = useRuntimeConfig()
  const { error: showError, success } = useAppToast()

  const loading = ref(false)
  const stats = ref<MatchStats | null>(null)
  const pendingMatches = ref<AthleteMapping[]>([])
  const unmatchedSwimmers = ref<UnmatchedSwimmer[]>([])
  const unmatchedSummary = ref<TeamSummary[]>([])
  const totalPending = ref(0)
  const searchResults = ref<MatchCandidate[]>([])

  // Cache for loaded team swimmers (lazy loading)
  const teamSwimmersCache = ref<Record<string, UnmatchedSwimmer[]>>({})

  const apiBase = config.public.apiUrl || 'http://localhost:8000'

  // Fetch unmatched summary (team codes with counts)
  const fetchUnmatchedSummary = async (): Promise<TeamSummary[]> => {
    loading.value = true
    try {
      const response = await $fetch<UnmatchedSummaryResponse>(
        `${apiBase}/api/matching/athletes/unmatched-summary`
      )
      unmatchedSummary.value = response.teams
      return response.teams
    } catch (e) {
      showError('Error obteniendo resumen de equipos')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch swimmers for a specific team (lazy loading)
  const fetchTeamSwimmers = async (
    teamCode: string,
    limit = 100
  ): Promise<UnmatchedSwimmer[]> => {
    // Return cached if available
    if (teamSwimmersCache.value[teamCode]) {
      return teamSwimmersCache.value[teamCode]
    }

    loading.value = true
    try {
      const response = await $fetch<UnmatchedResponse>(
        `${apiBase}/api/matching/athletes/unmatched`,
        { params: { team_code: teamCode, limit, group_by: 'gender' } }
      )

      // Flatten groups into a list
      const swimmers: UnmatchedSwimmer[] = []
      for (const groupSwimmers of Object.values(response.groups)) {
        if (Array.isArray(groupSwimmers)) {
          swimmers.push(...groupSwimmers)
        }
      }

      // Cache the result
      teamSwimmersCache.value[teamCode] = swimmers
      return swimmers
    } catch (e) {
      showError('Error obteniendo nadadores del equipo')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Clear cache for a team (after matching)
  const clearTeamCache = (teamCode: string) => {
    delete teamSwimmersCache.value[teamCode]
  }

  // Clear all cache
  const clearAllCache = () => {
    teamSwimmersCache.value = {}
  }

  // Fetch matching statistics
  const fetchStats = async (): Promise<MatchStats | null> => {
    loading.value = true
    try {
      const response = await $fetch<MatchStats>(`${apiBase}/api/matching/stats`)
      stats.value = response
      return response
    } catch (e) {
      showError('Error obteniendo estadísticas de matching')
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  // Get unmatched swimmers
  const fetchUnmatchedSwimmers = async (
    limit = 100,
    groupBy: 'team' | 'gender' | 'both' = 'team'
  ): Promise<UnmatchedSwimmer[]> => {
    loading.value = true
    try {
      const response = await $fetch<UnmatchedResponse>(
        `${apiBase}/api/matching/athletes/unmatched`,
        { params: { limit, group_by: groupBy } }
      )

      // Flatten grouped response into a list
      const swimmers: UnmatchedSwimmer[] = []

      if (groupBy === 'both') {
        // Nested: { team: { M: [...], F: [...] } }
        for (const teamData of Object.values(response.groups)) {
          if (typeof teamData === 'object' && !Array.isArray(teamData)) {
            for (const genderSwimmers of Object.values(teamData)) {
              swimmers.push(...(genderSwimmers as UnmatchedSwimmer[]))
            }
          }
        }
      } else {
        // Flat: { team: [...] } or { M: [...], F: [...] }
        for (const groupSwimmers of Object.values(response.groups)) {
          if (Array.isArray(groupSwimmers)) {
            swimmers.push(...groupSwimmers)
          }
        }
      }

      unmatchedSwimmers.value = swimmers
      return swimmers
    } catch (e) {
      showError('Error obteniendo nadadores sin emparejar')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get pending matches
  const fetchPendingMatches = async (
    limit = 50,
    offset = 0
  ): Promise<AthleteMapping[]> => {
    loading.value = true
    try {
      const response = await $fetch<{ total: number; matches: AthleteMapping[] }>(
        `${apiBase}/api/matching/athletes/pending`,
        { params: { limit, offset } }
      )
      pendingMatches.value = response.matches
      totalPending.value = response.total
      return response.matches
    } catch (e) {
      showError('Error obteniendo matches pendientes')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Search for potential matches
  const searchMatches = async (
    name: string,
    clubId?: string,
    minSimilarity = 0.5
  ): Promise<MatchCandidate[]> => {
    loading.value = true
    try {
      const params: Record<string, any> = {
        name,
        min_similarity: minSimilarity,
      }
      if (clubId) params.club_id = clubId

      const response = await $fetch<{
        external_name: string
        count: number
        matches: MatchCandidate[]
      }>(`${apiBase}/api/matching/athletes/search`, { params })

      searchResults.value = response.matches
      return response.matches
    } catch (e) {
      showError('Error buscando coincidencias')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Batch suggest matches
  const suggestBatchMatches = async (
    names: string[],
    minSimilarity = 0.6
  ): Promise<MatchSuggestion[]> => {
    loading.value = true
    try {
      const response = await $fetch<{
        count: number
        suggestions: MatchSuggestion[]
      }>(`${apiBase}/api/matching/athletes/suggest-batch`, {
        method: 'POST',
        body: {
          external_names: names,
          min_similarity: minSimilarity,
        },
      })
      return response.suggestions
    } catch (e) {
      showError('Error generando sugerencias')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Create a match suggestion
  const createMatch = async (
    externalName: string,
    internalId?: string,
    confidenceScore = 0.5,
    metadata?: Record<string, any>
  ): Promise<AthleteMapping | null> => {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; match: AthleteMapping }>(
        `${apiBase}/api/matching/athletes/create`,
        {
          method: 'POST',
          body: {
            external_name: externalName,
            internal_id: internalId,
            confidence_score: confidenceScore,
            source: 'FECNA',
            metadata,
          },
        }
      )
      success('Sugerencia de match creada')
      return response.match
    } catch (e) {
      showError('Error creando match')
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  // Confirm a match
  const confirmMatch = async (
    mappingId: string,
    internalId: string,
    reviewedBy?: string
  ): Promise<AthleteMapping | null> => {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; match: AthleteMapping }>(
        `${apiBase}/api/matching/athletes/${mappingId}/confirm`,
        {
          method: 'POST',
          body: {
            internal_id: internalId,
            reviewed_by: reviewedBy,
          },
        }
      )
      success('Match confirmado correctamente')

      // Remove from pending list
      pendingMatches.value = pendingMatches.value.filter(
        (m) => m.id !== mappingId
      )
      totalPending.value = Math.max(0, totalPending.value - 1)

      return response.match
    } catch (e) {
      showError('Error confirmando match')
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  // Reject a match
  const rejectMatch = async (
    mappingId: string,
    reviewedBy?: string
  ): Promise<AthleteMapping | null> => {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean; match: AthleteMapping }>(
        `${apiBase}/api/matching/athletes/${mappingId}/reject`,
        {
          method: 'POST',
          params: { reviewed_by: reviewedBy },
        }
      )
      success('Match rechazado')

      // Remove from pending list
      pendingMatches.value = pendingMatches.value.filter(
        (m) => m.id !== mappingId
      )
      totalPending.value = Math.max(0, totalPending.value - 1)

      return response.match
    } catch (e) {
      showError('Error rechazando match')
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  // Auto-match high confidence
  const autoMatch = async (
    minConfidence = 0.9,
    dryRun = true
  ): Promise<{
    dryRun: boolean
    confirmed?: number
    wouldConfirm?: number
    matches?: AthleteMapping[]
  }> => {
    loading.value = true
    try {
      const response = await $fetch<{
        dry_run: boolean
        confirmed?: number
        would_confirm?: number
        matches?: AthleteMapping[]
      }>(`${apiBase}/api/matching/athletes/auto-match`, {
        method: 'POST',
        params: {
          min_confidence: minConfidence,
          dry_run: dryRun,
        },
      })

      if (!dryRun && response.confirmed) {
        success(`${response.confirmed} matches confirmados automáticamente`)
      }

      return {
        dryRun: response.dry_run,
        confirmed: response.confirmed,
        wouldConfirm: response.would_confirm,
        matches: response.matches,
      }
    } catch (e) {
      showError('Error en auto-match')
      console.error(e)
      return { dryRun: true }
    } finally {
      loading.value = false
    }
  }

  // Format similarity as percentage
  const formatSimilarity = (score: number): string => {
    return `${Math.round(score * 100)}%`
  }

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'CONFIRMED':
        return 'success'
      case 'REJECTED':
        return 'error'
      default:
        return 'warning'
    }
  }

  // Get status label
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmado'
      case 'REJECTED':
        return 'Rechazado'
      default:
        return 'Pendiente'
    }
  }

  return {
    // State
    loading,
    stats,
    pendingMatches,
    unmatchedSwimmers,
    unmatchedSummary,
    totalPending,
    searchResults,
    teamSwimmersCache,

    // Actions
    fetchStats,
    fetchUnmatchedSwimmers,
    fetchUnmatchedSummary,
    fetchTeamSwimmers,
    fetchPendingMatches,
    searchMatches,
    suggestBatchMatches,
    createMatch,
    confirmMatch,
    rejectMatch,
    autoMatch,
    clearTeamCache,
    clearAllCache,

    // Helpers
    formatSimilarity,
    getStatusColor,
    getStatusLabel,
  }
}
