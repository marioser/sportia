// ==================== ENUMS ====================

export type UserRole = 'ADMIN' | 'CLUB_ADMIN' | 'COACH' | 'ATHLETE'

export type ClubRole = 'ADMIN' | 'COACH' | 'ATHLETE'

export type Sex = 'M' | 'F'

export type PoolType = 'SCM' | 'LCM' // Short Course Meters / Long Course Meters

export type SwimStroke = 'FREE' | 'BACK' | 'BREAST' | 'FLY' | 'IM'

export type SessionType = 'AEROBIC' | 'THRESHOLD' | 'SPEED' | 'TECH'

export type ObjectiveScope = 'GLOBAL' | 'CLUB' | 'TEMPLATE'

export type ObjectiveStatus = 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'FAILED'

// ==================== ENTITIES ====================

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Club {
  id: string
  name: string
  country: string
  city: string
  created_at: string
}

export interface ClubMember {
  club_id: string
  user_id: string
  role_in_club: ClubRole
}

export interface Athlete {
  id: string
  user_id: string | null
  club_id: string
  first_name: string
  last_name: string
  birth_date: string
  sex: Sex
  created_at: string
}

export interface Coach {
  id: string
  user_id: string
  is_independent: boolean
  created_at: string
}

export interface Test {
  id: string
  distance_m: number
  stroke_id: number
  pool_type: PoolType
}

export interface TrainingSession {
  id: string
  athlete_id: string
  session_date: string
  session_type: SessionType
  duration_min: number
  session_rpe: number // 1-10
  created_by: string
  validated_by: string | null
  notes: string | null
}

export interface TrainingSet {
  id: string
  session_id: string
  test_id: string
  total_time_ms: number
  pool_length_m: number
  attempt_no: number
  is_best: boolean
}

export interface TrainingSplit {
  training_set_id: string
  split_index: number
  split_distance_m: number
  split_time_ms: number
}

export interface TrainingStroke {
  training_set_id: string
  length_index: number
  stroke_count: number
}

// ==================== CALCULATED METRICS ====================

export interface SwimmingMetrics {
  /** Distance Per Stroke (m) */
  dps: number
  /** Strokes per minute */
  strokeFrequency: number
  /** DPS × velocity (efficiency index) */
  swimIndex: number
  /** Session RPE × duration (load) */
  trainingLoad: number
}
