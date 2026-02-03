import { msToTimeString } from '@sportia/shared'

export type ObjectiveScope = 'GLOBAL' | 'CLUB' | 'TEMPLATE'
export type ObjectiveStatus = 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'FAILED'

export interface Objective {
  id: string
  test_id: string
  target_time_ms: number
  scope: ObjectiveScope
  club_id: string | null
  created_by: string
  created_at: string
  // Joined fields
  test?: {
    id: string
    distance_m: number
    pool_type: string
    swim_stroke: {
      code: string
      name_es: string
    }
  }
}

export interface ObjectiveAssignment {
  id: string
  objective_id: string
  athlete_id: string
  custom_target_time_ms: number | null
  status: ObjectiveStatus
  achieved_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  objective?: Objective
  athlete?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface BadgeType {
  id: number
  code: string
  name_es: string
  name_en: string
  description_es: string | null
  description_en: string | null
  icon: string
  color: string
  category: string
  points: number
}

export interface AthleteBadge {
  id: string
  athlete_id: string
  badge_type_id: number
  objective_assignment_id: string | null
  earned_at: string
  metadata: Record<string, unknown>
  // Joined
  badge_type?: BadgeType
}

export interface CreateObjectiveForm {
  test_id: string
  target_time_ms: number
  scope: ObjectiveScope
  club_id?: string
}

export function useObjectives() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { success, error: showError } = useAppToast()

  const loading = ref(false)
  const objectives = ref<Objective[]>([])
  const assignments = ref<ObjectiveAssignment[]>([])
  const badges = ref<AthleteBadge[]>([])
  const badgeTypes = ref<BadgeType[]>([])

  // Stroke labels for display
  const strokeLabels: Record<string, string> = {
    FREE: 'Libre',
    BACK: 'Espalda',
    BREAST: 'Pecho',
    FLY: 'Mariposa',
    IM: 'Combinado',
  }

  // Format objective display name
  const formatObjective = (obj: Objective): string => {
    if (!obj.test) return msToTimeString(obj.target_time_ms)
    const stroke = strokeLabels[obj.test.swim_stroke?.code] || obj.test.swim_stroke?.code
    return `${obj.test.distance_m}m ${stroke} - ${msToTimeString(obj.target_time_ms)}`
  }

  // Fetch all objectives (optionally filtered by club)
  const fetchObjectives = async (clubId?: string): Promise<Objective[]> => {
    loading.value = true
    try {
      let query = supabase
        .from('objectives')
        .select(`
          *,
          test:tests (
            id,
            distance_m,
            pool_type,
            swim_stroke:swim_strokes (
              code,
              name_es
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (clubId) {
        query = query.or(`club_id.eq.${clubId},scope.eq.GLOBAL`)
      }

      const { data, error } = await query

      if (error) throw error

      objectives.value = data || []
      return objectives.value
    } catch (e) {
      showError('Error cargando objetivos')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Create a new objective
  const createObjective = async (form: CreateObjectiveForm): Promise<Objective | null> => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('objectives')
        .insert({
          test_id: form.test_id,
          target_time_ms: form.target_time_ms,
          scope: form.scope,
          club_id: form.club_id || null,
          created_by: user.value?.id,
        })
        .select(`
          *,
          test:tests (
            id,
            distance_m,
            pool_type,
            swim_stroke:swim_strokes (
              code,
              name_es
            )
          )
        `)
        .single()

      if (error) throw error

      objectives.value.unshift(data)
      success('Objetivo creado')
      return data
    } catch (e) {
      showError('Error creando objetivo')
      console.error(e)
      return null
    } finally {
      loading.value = false
    }
  }

  // Delete an objective
  const deleteObjective = async (objectiveId: string): Promise<boolean> => {
    loading.value = true
    try {
      const { error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', objectiveId)

      if (error) throw error

      objectives.value = objectives.value.filter((o) => o.id !== objectiveId)
      success('Objetivo eliminado')
      return true
    } catch (e) {
      showError('Error eliminando objetivo')
      console.error(e)
      return false
    } finally {
      loading.value = false
    }
  }

  // Fetch assignments for an athlete
  const fetchAthleteAssignments = async (athleteId: string): Promise<ObjectiveAssignment[]> => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('objective_assignments')
        .select(`
          *,
          objective:objectives (
            *,
            test:tests (
              id,
              distance_m,
              pool_type,
              swim_stroke:swim_strokes (
                code,
                name_es
              )
            )
          )
        `)
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })

      if (error) throw error

      assignments.value = data || []
      return assignments.value
    } catch (e) {
      showError('Error cargando asignaciones')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Fetch all assignments for an objective
  const fetchObjectiveAssignments = async (objectiveId: string): Promise<ObjectiveAssignment[]> => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('objective_assignments')
        .select(`
          *,
          athlete:athletes (
            id,
            first_name,
            last_name
          )
        `)
        .eq('objective_id', objectiveId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (e) {
      showError('Error cargando asignaciones')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Assign objective to athlete(s)
  const assignObjective = async (
    objectiveId: string,
    athleteIds: string[],
    customTargetTimeMs?: number
  ): Promise<boolean> => {
    loading.value = true
    try {
      const inserts = athleteIds.map((athleteId) => ({
        objective_id: objectiveId,
        athlete_id: athleteId,
        custom_target_time_ms: customTargetTimeMs || null,
        status: 'PENDING' as ObjectiveStatus,
      }))

      const { error } = await supabase.from('objective_assignments').insert(inserts)

      if (error) throw error

      success(`Objetivo asignado a ${athleteIds.length} atleta(s)`)
      return true
    } catch (e) {
      showError('Error asignando objetivo')
      console.error(e)
      return false
    } finally {
      loading.value = false
    }
  }

  // Update assignment status
  const updateAssignmentStatus = async (
    assignmentId: string,
    status: ObjectiveStatus
  ): Promise<boolean> => {
    loading.value = true
    try {
      const updates: Record<string, unknown> = { status }
      if (status === 'ACHIEVED') {
        updates.achieved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('objective_assignments')
        .update(updates)
        .eq('id', assignmentId)

      if (error) throw error

      // Update local state
      const idx = assignments.value.findIndex((a) => a.id === assignmentId)
      if (idx !== -1) {
        assignments.value[idx].status = status
        if (status === 'ACHIEVED') {
          assignments.value[idx].achieved_at = new Date().toISOString()
        }
      }

      success(status === 'ACHIEVED' ? '¡Objetivo logrado!' : 'Estado actualizado')
      return true
    } catch (e) {
      showError('Error actualizando estado')
      console.error(e)
      return false
    } finally {
      loading.value = false
    }
  }

  // Remove assignment
  const removeAssignment = async (assignmentId: string): Promise<boolean> => {
    loading.value = true
    try {
      const { error } = await supabase
        .from('objective_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      assignments.value = assignments.value.filter((a) => a.id !== assignmentId)
      success('Asignación eliminada')
      return true
    } catch (e) {
      showError('Error eliminando asignación')
      console.error(e)
      return false
    } finally {
      loading.value = false
    }
  }

  // Fetch all badge types
  const fetchBadgeTypes = async (): Promise<BadgeType[]> => {
    try {
      const { data, error } = await supabase
        .from('badge_types')
        .select('*')
        .order('category')
        .order('points')

      if (error) throw error

      badgeTypes.value = data || []
      return badgeTypes.value
    } catch (e) {
      console.error('Error fetching badge types:', e)
      return []
    }
  }

  // Fetch badges for an athlete
  const fetchAthleteBadges = async (athleteId: string): Promise<AthleteBadge[]> => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('athlete_badges')
        .select(`
          *,
          badge_type:badge_types (*)
        `)
        .eq('athlete_id', athleteId)
        .order('earned_at', { ascending: false })

      if (error) throw error

      badges.value = data || []
      return badges.value
    } catch (e) {
      showError('Error cargando medallas')
      console.error(e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get total points for an athlete
  const getAthletePoints = computed(() => {
    return badges.value.reduce((sum, b) => sum + (b.badge_type?.points || 0), 0)
  })

  // Get status label in Spanish
  const getStatusLabel = (status: ObjectiveStatus): string => {
    const labels: Record<ObjectiveStatus, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En progreso',
      ACHIEVED: 'Logrado',
      FAILED: 'No logrado',
    }
    return labels[status] || status
  }

  // Get status color for badge
  const getStatusColor = (status: ObjectiveStatus): string => {
    const colors: Record<ObjectiveStatus, string> = {
      PENDING: 'gray',
      IN_PROGRESS: 'primary',
      ACHIEVED: 'success',
      FAILED: 'error',
    }
    return colors[status] || 'gray'
  }

  return {
    loading,
    objectives,
    assignments,
    badges,
    badgeTypes,
    strokeLabels,
    formatObjective,
    fetchObjectives,
    createObjective,
    deleteObjective,
    fetchAthleteAssignments,
    fetchObjectiveAssignments,
    assignObjective,
    updateAssignmentStatus,
    removeAssignment,
    fetchBadgeTypes,
    fetchAthleteBadges,
    getAthletePoints,
    getStatusLabel,
    getStatusColor,
  }
}
