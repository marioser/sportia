/**
 * Composable para sincronización de resultados de competencias desde FECNA
 */
import type { Ref } from 'vue'

export interface SyncStatus {
  athlete_id: string
  sync_status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'ERROR'
  last_synced_at: string | null
  results_count: number
  sync_error: string | null
}

export interface SyncResult {
  success: boolean
  athlete_id: string
  athlete_name: string
  fecna_id: string
  total_results: number
  new_results: number
  existing_results: number
  fecha_inicio?: string
  fecha_fin?: string
}

export interface SyncStats {
  total_athletes: number
  matched_athletes: number
  pending_match: number
  last_sync_at: string | null
  last_sync_results: number
}

export const useResultsSync = () => {
  const config = useRuntimeConfig()
  const toast = useAppToast()

  const loading = ref(false)
  const syncing = ref(false)
  const syncProgress = ref(0)

  /**
   * Sincronizar resultados de un atleta específico
   */
  const syncAthlete = async (
    athleteId: string,
    options: {
      fechaInicio?: string
      fechaFin?: string
      showToast?: boolean
    } = {}
  ): Promise<SyncResult | null> => {
    const { fechaInicio, fechaFin, showToast = true } = options

    syncing.value = true

    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append('fecha_inicio', fechaInicio)
      if (fechaFin) params.append('fecha_fin', fechaFin)

      const url = `${config.public.apiUrl}/sync/athlete/${athleteId}${
        params.toString() ? '?' + params.toString() : ''
      }`

      const result = await $fetch<SyncResult>(url, {
        method: 'POST'
      })

      if (showToast) {
        if (result.new_results > 0) {
          toast.success(
            `Sincronización exitosa: ${result.new_results} resultado(s) nuevo(s)`
          )
        } else {
          toast.info('Todos los resultados ya están actualizados')
        }
      }

      return result
    } catch (error: any) {
      console.error('Error sincronizando atleta:', error)

      if (showToast) {
        const message = error?.data?.detail || 'Error al sincronizar resultados'
        toast.error(message)
      }

      return null
    } finally {
      syncing.value = false
    }
  }

  /**
   * Sincronizar todos los atletas con mapping confirmado
   */
  const syncAll = async (
    options: {
      fechaInicio?: string
      fechaFin?: string
      onProgress?: (current: number, total: number) => void
    } = {}
  ): Promise<any> => {
    const { fechaInicio, fechaFin, onProgress } = options

    syncing.value = true
    syncProgress.value = 0

    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append('fecha_inicio', fechaInicio)
      if (fechaFin) params.append('fecha_fin', fechaFin)

      const url = `${config.public.apiUrl}/sync/all${
        params.toString() ? '?' + params.toString() : ''
      }`

      const result = await $fetch(url, {
        method: 'POST'
      })

      if (onProgress) {
        onProgress(result.successful, result.total_athletes)
      }

      syncProgress.value = 100

      toast.success(
        `Sincronización masiva completada: ${result.successful}/${result.total_athletes} exitosos`
      )

      return result
    } catch (error: any) {
      console.error('Error en sincronización masiva:', error)
      const message = error?.data?.detail || 'Error en sincronización masiva'
      toast.error(message)
      return null
    } finally {
      syncing.value = false
    }
  }

  /**
   * Obtener estado de sincronización de un atleta
   */
  const getSyncStatus = async (athleteId: string): Promise<SyncStatus | null> => {
    loading.value = true

    try {
      const url = `${config.public.apiUrl}/sync/status/${athleteId}`
      const status = await $fetch<SyncStatus>(url)
      return status
    } catch (error: any) {
      // Si no hay mapping, no es un error crítico
      if (error?.statusCode === 404) {
        return null
      }

      console.error('Error obteniendo estado de sync:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener estadísticas globales de sincronización
   */
  const getSyncStats = async (): Promise<SyncStats | null> => {
    loading.value = true

    try {
      const url = `${config.public.apiUrl}/sync/stats`
      const stats = await $fetch<SyncStats>(url)
      return stats
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      toast.error('Error al obtener estadísticas de sincronización')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Helper: Formatear fecha relativa de última sincronización
   */
  const formatLastSync = (lastSyncedAt: string | null): string => {
    if (!lastSyncedAt) return 'Nunca sincronizado'

    const date = new Date(lastSyncedAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Helper: Obtener color del badge según estado
   */
  const getStatusColor = (status: SyncStatus['sync_status']): string => {
    switch (status) {
      case 'SUCCESS':
        return 'green'
      case 'ERROR':
        return 'red'
      case 'IN_PROGRESS':
        return 'blue'
      case 'PENDING':
      default:
        return 'gray'
    }
  }

  /**
   * Helper: Obtener label del estado
   */
  const getStatusLabel = (status: SyncStatus['sync_status']): string => {
    switch (status) {
      case 'SUCCESS':
        return 'Sincronizado'
      case 'ERROR':
        return 'Error'
      case 'IN_PROGRESS':
        return 'Sincronizando...'
      case 'PENDING':
      default:
        return 'Pendiente'
    }
  }

  return {
    // Estado
    loading: readonly(loading),
    syncing: readonly(syncing),
    syncProgress: readonly(syncProgress),

    // Métodos
    syncAthlete,
    syncAll,
    getSyncStatus,
    getSyncStats,

    // Helpers
    formatLastSync,
    getStatusColor,
    getStatusLabel
  }
}
