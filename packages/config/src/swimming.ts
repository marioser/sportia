import type { SwimStroke, PoolType } from '@sportia/shared'

export const SWIM_STROKES: Record<SwimStroke, { id: number; name: string; nameEs: string }> = {
  FREE: { id: 1, name: 'Freestyle', nameEs: 'Libre' },
  BACK: { id: 2, name: 'Backstroke', nameEs: 'Espalda' },
  BREAST: { id: 3, name: 'Breaststroke', nameEs: 'Pecho' },
  FLY: { id: 4, name: 'Butterfly', nameEs: 'Mariposa' },
  IM: { id: 5, name: 'Individual Medley', nameEs: 'Combinado' },
}

export const POOL_TYPES: Record<PoolType, { name: string; lengthM: number }> = {
  SCM: { name: 'Short Course Meters (25m)', lengthM: 25 },
  LCM: { name: 'Long Course Meters (50m)', lengthM: 50 },
}

/** Distancias oficiales por estilo (en metros) */
export const OFFICIAL_DISTANCES: Record<SwimStroke, number[]> = {
  FREE: [50, 100, 200, 400, 800, 1500],
  BACK: [50, 100, 200],
  BREAST: [50, 100, 200],
  FLY: [50, 100, 200],
  IM: [200, 400],
}

/** Categorías de edad para natación */
export const AGE_CATEGORIES = [
  { code: '10-', label: '10 y menores', minAge: 0, maxAge: 10 },
  { code: '11-12', label: '11-12 años', minAge: 11, maxAge: 12 },
  { code: '13-14', label: '13-14 años', minAge: 13, maxAge: 14 },
  { code: '15-16', label: '15-16 años', minAge: 15, maxAge: 16 },
  { code: '17-18', label: '17-18 años', minAge: 17, maxAge: 18 },
  { code: 'OPEN', label: 'Abierta', minAge: 19, maxAge: 99 },
]

/** Tipos de sesión de entrenamiento */
export const SESSION_TYPES = {
  AEROBIC: { name: 'Aeróbico', description: 'Trabajo de resistencia aeróbica' },
  THRESHOLD: { name: 'Umbral', description: 'Trabajo en umbral anaeróbico' },
  SPEED: { name: 'Velocidad', description: 'Series de velocidad y potencia' },
  TECH: { name: 'Técnica', description: 'Enfoque en técnica y corrección' },
}

/** Escala RPE (Rate of Perceived Exertion) */
export const RPE_SCALE = [
  { value: 1, label: 'Muy muy fácil' },
  { value: 2, label: 'Fácil' },
  { value: 3, label: 'Moderado' },
  { value: 4, label: 'Algo difícil' },
  { value: 5, label: 'Difícil' },
  { value: 6, label: 'Más difícil' },
  { value: 7, label: 'Muy difícil' },
  { value: 8, label: 'Muy muy difícil' },
  { value: 9, label: 'Casi máximo' },
  { value: 10, label: 'Máximo esfuerzo' },
]
