import type { Database } from '@sportia/shared'

// ==================== DATABASE TYPE ALIASES ====================

// Tables
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Club = Database['public']['Tables']['clubs']['Row']
export type ClubInsert = Database['public']['Tables']['clubs']['Insert']
export type ClubUpdate = Database['public']['Tables']['clubs']['Update']

export type ClubMember = Database['public']['Tables']['club_members']['Row']
export type ClubMemberInsert = Database['public']['Tables']['club_members']['Insert']

export type Athlete = Database['public']['Tables']['athletes']['Row']
export type AthleteInsert = Database['public']['Tables']['athletes']['Insert']
export type AthleteUpdate = Database['public']['Tables']['athletes']['Update']

export type Coach = Database['public']['Tables']['coaches']['Row']
export type CoachInsert = Database['public']['Tables']['coaches']['Insert']
export type CoachUpdate = Database['public']['Tables']['coaches']['Update']

export type Test = Database['public']['Tables']['tests']['Row']
export type SwimStroke = Database['public']['Tables']['swim_strokes']['Row']

export type TrainingSession = Database['public']['Tables']['training_sessions']['Row']
export type TrainingSessionInsert = Database['public']['Tables']['training_sessions']['Insert']
export type TrainingSessionUpdate = Database['public']['Tables']['training_sessions']['Update']

export type TrainingSet = Database['public']['Tables']['training_sets']['Row']
export type TrainingSetInsert = Database['public']['Tables']['training_sets']['Insert']
export type TrainingSetUpdate = Database['public']['Tables']['training_sets']['Update']

// Training set with joined test info
export interface TrainingSetWithTest extends TrainingSet {
  tests?: {
    distance_m: number
    pool_type: PoolType
    swim_strokes?: {
      name_es: string
      code: SwimStrokeCode
    }
  }
}

export type TrainingSplit = Database['public']['Tables']['training_splits']['Row']
export type TrainingSplitInsert = Database['public']['Tables']['training_splits']['Insert']

export type TrainingStroke = Database['public']['Tables']['training_strokes']['Row']
export type TrainingStrokeInsert = Database['public']['Tables']['training_strokes']['Insert']

// Views
export type AthleteWithAge = Database['public']['Views']['athletes_with_age']['Row']
export type TrainingSessionWithLoad = Database['public']['Views']['training_sessions_with_load']['Row']
export type AthleteBestTime = Database['public']['Views']['athlete_best_times']['Row']

// Enums
export type UserRole = Database['public']['Enums']['user_role']
export type ClubRole = Database['public']['Enums']['club_role']
export type Sex = Database['public']['Enums']['sex']
export type PoolType = Database['public']['Enums']['pool_type']
export type SessionType = Database['public']['Enums']['session_type']
export type SwimStrokeCode = Database['public']['Enums']['swim_stroke']
export type ObjectiveStatus = Database['public']['Enums']['objective_status']
export type ObjectiveScope = Database['public']['Enums']['objective_scope']

// ==================== FORM INTERFACES ====================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  fullName: string
}

export interface ForgotPasswordForm {
  email: string
}

export interface ProfileForm {
  fullName: string
  avatarUrl?: string
}

export interface CreateAthleteForm {
  firstName: string
  lastName: string
  birthDate: string
  sex: Sex
  clubId: string
  photoUrl?: string
  documentNumber?: string
}

export interface UpdateAthleteForm {
  firstName?: string
  lastName?: string
  birthDate?: string
  sex?: Sex
  photoUrl?: string
  active?: boolean
  documentNumber?: string
}

export interface CreateClubForm {
  name: string
  country: string
  city?: string
  logoUrl?: string
}

export interface UpdateClubForm {
  name?: string
  country?: string
  city?: string
  logoUrl?: string
}

export interface CreateSessionForm {
  athleteId: string
  sessionDate: string
  sessionType: SessionType
  durationMin: number
  sessionRpe: number
  notes?: string
}

export interface UpdateSessionForm {
  sessionDate?: string
  sessionType?: SessionType
  durationMin?: number
  sessionRpe?: number
  notes?: string
}

export interface CreateSetForm {
  testId: string
  totalTimeMs: number
  poolLengthM: number
  attemptNo?: number
}

export interface CreateSplitForm {
  splitIndex: number
  splitDistanceM: number
  splitTimeMs: number
}

export interface CreateStrokeForm {
  lengthIndex: number
  strokeCount: number
}

// ==================== UI TYPES ====================

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SwimmingMetrics {
  dps: number
  strokeFrequency: number
  swimIndex: number
  velocity: number
  trainingLoad?: number
}

// ==================== COMPONENT PROPS ====================

export interface ListItemProps {
  title: string
  subtitle?: string
  avatar?: string
  to?: string
  badge?: string
  badgeColor?: 'primary' | 'success' | 'warning' | 'error' | 'gray'
}

export interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
}

// ==================== API RESPONSE TYPES ====================

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}
