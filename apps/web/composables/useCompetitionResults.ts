import { msToTimeString } from '@sportia/shared'

export interface CompetitionResult {
  id: number
  year: number
  tournament_name: string
  event_date: string | null
  gender: 'M' | 'F'
  distance_m: number
  stroke: 'FREE' | 'BACK' | 'BREAST' | 'FLY' | 'IM'
  round: string | null
  age: number | null
  swimmer_name: string
  swimmer_name_norm: string
  team_code: string | null
  rank: number | null
  final_time_ms: number
  seed_time_ms: number | null
  source: string | null
  created_at: string
}

export interface SearchFilters {
  swimmer_name?: string
  team_code?: string
  tournament?: string
  distance?: number
  stroke?: string
  gender?: string
  year?: number
}

export interface SwimmerEvent {
  distance_m: number
  stroke: string
  best_time_ms: number
  best_result: CompetitionResult
  count: number
}

export interface TournamentOption {
  tournament_name: string
  year: number
  result_count: number
}

export interface TeamCodeOption {
  team_code: string
  result_count: number
}

export function useCompetitionResults() {
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()
  const { error: showError } = useAppToast()

  const loading = ref(false)
  const results = ref<CompetitionResult[]>([])
  const totalCount = ref(0)
  const tournaments = ref<TournamentOption[]>([])
  const teamCodes = ref<TeamCodeOption[]>([])
  const loadingOptions = ref(false)

  // Stroke labels for display
  const strokeLabels: Record<string, string> = {
    FREE: 'Libre',
    BACK: 'Espalda',
    BREAST: 'Pecho',
    FLY: 'Mariposa',
    IM: 'Combinado',
  }

  // Search results with filters
  const searchResults = async (
    filters: SearchFilters,
    limit = 50,
    offset = 0
  ): Promise<CompetitionResult[]> => {
    loading.value = true

    try {
      let query = supabase
        .from('swim_competition_results')
        .select('*', { count: 'exact' })

      if (filters.swimmer_name) {
        query = query.ilike('swimmer_name_norm', `%${filters.swimmer_name.toLowerCase()}%`)
      }

      if (filters.team_code) {
        query = query.eq('team_code', filters.team_code.toUpperCase())
      }

      if (filters.tournament) {
        query = query.ilike('tournament_name', `%${filters.tournament}%`)
      }

      if (filters.distance) {
        query = query.eq('distance_m', filters.distance)
      }

      if (filters.stroke) {
        query = query.eq('stroke', filters.stroke)
      }

      if (filters.gender) {
        query = query.eq('gender', filters.gender)
      }

      if (filters.year) {
        query = query.eq('year', filters.year)
      }

      const { data, count, error } = await query
        .order('swimmer_name')
        .range(offset, offset + limit - 1)

      if (error) throw error

      results.value = data || []
      totalCount.value = count || 0
      return results.value
    } catch (e) {
      showError('Error buscando resultados')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch tournaments list for filter dropdown
  const fetchTournaments = async (): Promise<TournamentOption[]> => {
    if (tournaments.value.length > 0) return tournaments.value

    loadingOptions.value = true
    try {
      const { data, error } = await supabase.rpc('get_tournament_options')

      if (error) throw error

      tournaments.value = (data || []).map((row: { tournament_name: string; year: number; result_count: number }) => ({
        tournament_name: row.tournament_name,
        year: row.year,
        result_count: Number(row.result_count),
      }))
      return tournaments.value
    } catch (e) {
      console.error('Error fetching tournaments:', e)
      return []
    } finally {
      loadingOptions.value = false
    }
  }

  // Fetch team codes list for filter dropdown
  const fetchTeamCodes = async (): Promise<TeamCodeOption[]> => {
    if (teamCodes.value.length > 0) return teamCodes.value

    loadingOptions.value = true
    try {
      const { data, error } = await supabase.rpc('get_team_code_options')

      if (error) throw error

      teamCodes.value = (data || []).map((row: { team_code: string; result_count: number }) => ({
        team_code: row.team_code,
        result_count: Number(row.result_count),
      }))
      return teamCodes.value
    } catch (e) {
      console.error('Error fetching team codes:', e)
      return []
    } finally {
      loadingOptions.value = false
    }
  }

  // Get results for a specific swimmer
  const getSwimmerResults = async (
    swimmerName: string,
    limit = 100
  ): Promise<{ events: SwimmerEvent[]; results: CompetitionResult[] }> => {
    loading.value = true

    try {
      const { data, error } = await supabase
        .from('swim_competition_results')
        .select('*')
        .ilike('swimmer_name_norm', `%${swimmerName.toLowerCase()}%`)
        .order('distance_m')
        .order('stroke')
        .order('final_time_ms')
        .limit(limit)

      if (error) throw error

      // Group by event and find best times
      const eventsMap = new Map<string, SwimmerEvent>()

      for (const result of data || []) {
        const eventKey = `${result.distance_m}_${result.stroke}`

        if (!eventsMap.has(eventKey)) {
          eventsMap.set(eventKey, {
            distance_m: result.distance_m,
            stroke: result.stroke,
            best_time_ms: result.final_time_ms,
            best_result: result,
            count: 1,
          })
        } else {
          const event = eventsMap.get(eventKey)!
          event.count++
          if (result.final_time_ms < event.best_time_ms) {
            event.best_time_ms = result.final_time_ms
            event.best_result = result
          }
        }
      }

      return {
        events: Array.from(eventsMap.values()),
        results: data || [],
      }
    } catch (e) {
      showError('Error obteniendo resultados del nadador')
      console.error(e)
      return { events: [], results: [] }
    } finally {
      loading.value = false
    }
  }

  // Get rankings for a specific event
  const getRankings = async (
    distance: number,
    stroke: string,
    gender: string,
    options: { year?: number; ageMin?: number; ageMax?: number; limit?: number } = {}
  ): Promise<CompetitionResult[]> => {
    loading.value = true
    const limit = options.limit || 50

    try {
      let query = supabase
        .from('swim_competition_results')
        .select('*')
        .eq('distance_m', distance)
        .eq('stroke', stroke)
        .eq('gender', gender)

      if (options.year) {
        query = query.eq('year', options.year)
      }

      if (options.ageMin) {
        query = query.gte('age', options.ageMin)
      }

      if (options.ageMax) {
        query = query.lte('age', options.ageMax)
      }

      const { data, error } = await query
        .order('final_time_ms')
        .limit(limit * 3) // Get extra to handle duplicates

      if (error) throw error

      // Deduplicate by swimmer (keep best time)
      const seenSwimmers = new Set<string>()
      const rankings: CompetitionResult[] = []

      for (const result of data || []) {
        if (!seenSwimmers.has(result.swimmer_name_norm)) {
          seenSwimmers.add(result.swimmer_name_norm)
          rankings.push(result)
          if (rankings.length >= limit) break
        }
      }

      return rankings
    } catch (e) {
      showError('Error obteniendo rankings')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Format time for display
  const formatTime = (ms: number): string => {
    return msToTimeString(ms)
  }

  // Format event name
  const formatEvent = (distance: number, stroke: string): string => {
    return `${distance}m ${strokeLabels[stroke] || stroke}`
  }

  // Get stroke label
  const getStrokeLabel = (stroke: string): string => {
    return strokeLabels[stroke] || stroke
  }

  return {
    loading,
    loadingOptions,
    results,
    totalCount,
    tournaments,
    teamCodes,
    strokeLabels,
    searchResults,
    fetchTournaments,
    fetchTeamCodes,
    getSwimmerResults,
    getRankings,
    formatTime,
    formatEvent,
    getStrokeLabel,
  }
}
