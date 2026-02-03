import {
  calculateDPS,
  calculateStrokeFrequency,
  calculateVelocity,
  calculateSwimIndex,
  calculateTrainingLoad,
} from '@sportia/shared'
import type { SwimmingMetrics, TrainingSplit, TrainingStroke } from '~/types'

export function useSwimmingMetrics() {
  /**
   * Calculate swimming metrics for a training set
   */
  const calculateMetrics = (
    distanceM: number,
    totalTimeMs: number,
    totalStrokeCount: number,
    rpe?: number,
    durationMin?: number
  ): SwimmingMetrics => {
    const dps = calculateDPS(distanceM, totalStrokeCount)
    const strokeFrequency = calculateStrokeFrequency(totalStrokeCount, totalTimeMs)
    const velocity = calculateVelocity(distanceM, totalTimeMs)
    const swimIndex = calculateSwimIndex(dps, velocity)
    const trainingLoad = rpe && durationMin ? calculateTrainingLoad(rpe, durationMin) : undefined

    return {
      dps: Math.round(dps * 100) / 100,
      strokeFrequency: Math.round(strokeFrequency * 10) / 10,
      swimIndex: Math.round(swimIndex * 100) / 100,
      velocity: Math.round(velocity * 100) / 100,
      trainingLoad,
    }
  }

  /**
   * Calculate total stroke count from individual length counts
   */
  const getTotalStrokeCount = (strokes: TrainingStroke[]): number => {
    return strokes.reduce((sum, s) => sum + s.stroke_count, 0)
  }

  /**
   * Calculate split velocities
   */
  const calculateSplitVelocities = (splits: TrainingSplit[]): number[] => {
    return splits.map((split) => calculateVelocity(split.split_distance_m, split.split_time_ms))
  }

  /**
   * Calculate cumulative times from splits
   */
  const getCumulativeTimes = (splits: TrainingSplit[]): number[] => {
    const cumulative: number[] = []
    let total = 0
    for (const split of splits) {
      total += split.split_time_ms
      cumulative.push(total)
    }
    return cumulative
  }

  /**
   * Find the fastest split
   */
  const getFastestSplit = (splits: TrainingSplit[]): TrainingSplit | null => {
    if (splits.length === 0) return null
    return splits.reduce((fastest, current) =>
      current.split_time_ms < fastest.split_time_ms ? current : fastest
    )
  }

  /**
   * Find the slowest split
   */
  const getSlowestSplit = (splits: TrainingSplit[]): TrainingSplit | null => {
    if (splits.length === 0) return null
    return splits.reduce((slowest, current) =>
      current.split_time_ms > slowest.split_time_ms ? current : slowest
    )
  }

  /**
   * Calculate average split time
   */
  const getAverageSplitTime = (splits: TrainingSplit[]): number => {
    if (splits.length === 0) return 0
    const total = splits.reduce((sum, s) => sum + s.split_time_ms, 0)
    return Math.round(total / splits.length)
  }

  /**
   * Calculate split consistency (standard deviation)
   */
  const getSplitConsistency = (splits: TrainingSplit[]): number => {
    if (splits.length < 2) return 0
    const avg = getAverageSplitTime(splits)
    const variance = splits.reduce((sum, s) => sum + Math.pow(s.split_time_ms - avg, 2), 0) / splits.length
    return Math.round(Math.sqrt(variance))
  }

  return {
    calculateMetrics,
    getTotalStrokeCount,
    calculateSplitVelocities,
    getCumulativeTimes,
    getFastestSplit,
    getSlowestSplit,
    getAverageSplitTime,
    getSplitConsistency,
  }
}
