/**
 * Composable for admin simulation mode
 * Allows super admins to view the app as if they were a specific athlete, coach, or club admin
 */

export type SimulationType = 'athlete' | 'coach' | 'club_admin' | null

export interface SimulationTarget {
  type: SimulationType
  id: string // athlete_id, coach user_id, or club_id depending on type
  name: string // Display name for the indicator
  clubId?: string // Club context (required for athlete/coach)
}

export interface SimulationState {
  active: boolean
  target: SimulationTarget | null
}

const STORAGE_KEY = 'sportia-simulation'

export function useSimulation() {
  // Use Nuxt's useState for SSR-safe shared state
  const simulationState = useState<SimulationState>('simulation', () => ({
    active: false,
    target: null,
  }))

  // Initialize from localStorage on client
  const initFromStorage = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          simulationState.value = parsed
        } catch {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    }
  }

  // Persist to localStorage
  const persistState = () => {
    if (import.meta.client) {
      if (simulationState.value.active) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(simulationState.value))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  // Start simulation (admin check should be done at UI level)
  const startSimulation = (target: SimulationTarget) => {
    simulationState.value = {
      active: true,
      target,
    }
    persistState()
    return true
  }

  // Stop simulation
  const stopSimulation = () => {
    simulationState.value = {
      active: false,
      target: null,
    }
    persistState()
  }

  // Simulate as athlete
  const simulateAsAthlete = (athleteId: string, athleteName: string, clubId: string) => {
    return startSimulation({
      type: 'athlete',
      id: athleteId,
      name: athleteName,
      clubId,
    })
  }

  // Simulate as coach
  const simulateAsCoach = (coachUserId: string, coachName: string, clubId: string) => {
    return startSimulation({
      type: 'coach',
      id: coachUserId,
      name: coachName,
      clubId,
    })
  }

  // Simulate as club admin
  const simulateAsClubAdmin = (clubId: string, clubName: string) => {
    return startSimulation({
      type: 'club_admin',
      id: clubId,
      name: clubName,
      clubId,
    })
  }

  // Computed properties
  const isSimulating = computed(() => simulationState.value.active)
  const simulationTarget = computed(() => simulationState.value.target)
  const simulationType = computed(() => simulationState.value.target?.type || null)
  const simulatedClubId = computed(() => simulationState.value.target?.clubId || null)

  // Check if simulating as specific type
  const isSimulatingAsAthlete = computed(() =>
    simulationState.value.active && simulationState.value.target?.type === 'athlete'
  )
  const isSimulatingAsCoach = computed(() =>
    simulationState.value.active && simulationState.value.target?.type === 'coach'
  )
  const isSimulatingAsClubAdmin = computed(() =>
    simulationState.value.active && simulationState.value.target?.type === 'club_admin'
  )

  // Get effective permissions based on simulation
  const getEffectiveRole = computed(() => {
    if (!simulationState.value.active) return null

    switch (simulationState.value.target?.type) {
      case 'athlete':
        return 'ATHLETE'
      case 'coach':
        return 'COACH'
      case 'club_admin':
        return 'CLUB_ADMIN'
      default:
        return null
    }
  })

  // Initialize on mount
  onMounted(() => {
    initFromStorage()
  })

  return {
    // State
    simulationState: readonly(simulationState),
    isSimulating: readonly(isSimulating),
    simulationTarget: readonly(simulationTarget),
    simulationType: readonly(simulationType),
    simulatedClubId: readonly(simulatedClubId),
    isSimulatingAsAthlete: readonly(isSimulatingAsAthlete),
    isSimulatingAsCoach: readonly(isSimulatingAsCoach),
    isSimulatingAsClubAdmin: readonly(isSimulatingAsClubAdmin),
    getEffectiveRole: readonly(getEffectiveRole),

    // Actions
    startSimulation,
    stopSimulation,
    simulateAsAthlete,
    simulateAsCoach,
    simulateAsClubAdmin,
  }
}
