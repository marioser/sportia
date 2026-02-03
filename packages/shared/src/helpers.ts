/**
 * Convierte milisegundos a formato de tiempo legible (mm:ss.cc)
 */
export function msToTimeString(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const formattedSeconds = seconds.toFixed(2).padStart(5, '0')
  return minutes > 0 ? `${minutes}:${formattedSeconds}` : formattedSeconds
}

/**
 * Convierte string de tiempo (mm:ss.cc o ss.cc) a milisegundos
 */
export function timeStringToMs(time: string): number {
  const parts = time.split(':')
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10)
    const seconds = parseFloat(parts[1])
    return Math.round((minutes * 60 + seconds) * 1000)
  }
  return Math.round(parseFloat(time) * 1000)
}

/**
 * Calcula Distance Per Stroke (metros por brazada)
 */
export function calculateDPS(distanceM: number, strokeCount: number): number {
  if (strokeCount <= 0) return 0
  return distanceM / strokeCount
}

/**
 * Calcula frecuencia de brazada (brazadas por minuto)
 */
export function calculateStrokeFrequency(strokeCount: number, timeMs: number): number {
  if (timeMs <= 0) return 0
  const timeMinutes = timeMs / 60000
  return strokeCount / timeMinutes
}

/**
 * Calcula velocidad en m/s
 */
export function calculateVelocity(distanceM: number, timeMs: number): number {
  if (timeMs <= 0) return 0
  return distanceM / (timeMs / 1000)
}

/**
 * Calcula índice de nado (DPS × velocidad)
 */
export function calculateSwimIndex(dps: number, velocity: number): number {
  return dps * velocity
}

/**
 * Calcula carga de entrenamiento (session-RPE × duración)
 */
export function calculateTrainingLoad(rpe: number, durationMin: number): number {
  return rpe * durationMin
}

/**
 * Calcula edad a partir de fecha de nacimiento
 */
export function calculateAge(birthDate: string, referenceDate = new Date()): number {
  const birth = new Date(birthDate)
  let age = referenceDate.getFullYear() - birth.getFullYear()
  const monthDiff = referenceDate.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Obtiene categoría de edad (para natación)
 */
export function getAgeCategory(age: number): string {
  if (age <= 10) return '10-'
  if (age <= 12) return '11-12'
  if (age <= 14) return '13-14'
  if (age <= 16) return '15-16'
  if (age <= 18) return '17-18'
  return 'OPEN'
}
