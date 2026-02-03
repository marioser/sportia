import type { Database } from '@sportia/shared'
import type { Test, SwimStroke, SelectOption } from '~/types'
import { SWIM_STROKES, SESSION_TYPES, POOL_TYPES, RPE_SCALE } from '@sportia/config'

export function useCatalogs() {
  const supabase = useSupabaseClient<Database>()

  const tests = ref<Test[]>([])
  const swimStrokes = ref<SwimStroke[]>([])
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const fetchTests = async () => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('tests')
        .select(`
          *,
          swim_stroke:swim_strokes (
            id,
            code,
            name_es,
            name_en
          )
        `)
        .order('distance_m')

      if (error) {
        errorMessage.value = error.message
        return []
      }

      tests.value = data || []
      return data || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar pruebas'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchSwimStrokes = async () => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('swim_strokes')
        .select('*')
        .order('id')

      if (error) {
        errorMessage.value = error.message
        return []
      }

      swimStrokes.value = data || []
      return data || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar estilos'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  // Static options from config
  const swimStrokeOptions = computed<SelectOption[]>(() =>
    Object.entries(SWIM_STROKES).map(([key, value]) => ({
      value: key,
      label: value.nameEs,
    }))
  )

  const sessionTypeOptions = computed<SelectOption[]>(() =>
    Object.entries(SESSION_TYPES).map(([key, value]) => ({
      value: key,
      label: value.name,
    }))
  )

  const poolTypeOptions = computed<SelectOption[]>(() =>
    Object.entries(POOL_TYPES).map(([key, value]) => ({
      value: key,
      label: `${value.name} (${value.lengthM}m)`,
    }))
  )

  const sexOptions = computed<SelectOption[]>(() => [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
  ])

  const rpeLabels = computed(() =>
    Object.fromEntries(
      RPE_SCALE.map((r) => [r.value, r.label])
    )
  )

  // Build test options from fetched tests (grouped by stroke)
  const testOptions = computed<SelectOption[]>(() => {
    // Sort by stroke name, then distance
    const sorted = [...tests.value].sort((a, b) => {
      const strokeA = (a as any).swim_stroke?.name_es || ''
      const strokeB = (b as any).swim_stroke?.name_es || ''
      if (strokeA !== strokeB) return strokeA.localeCompare(strokeB)
      return (a.distance_m || 0) - (b.distance_m || 0)
    })

    return sorted.map((test) => {
      const stroke = (test as any).swim_stroke
      return {
        value: test.id,
        label: `${stroke?.name_es || 'Sin estilo'} ${test.distance_m}m (${test.pool_type})`,
      }
    })
  })

  return {
    tests: readonly(tests),
    swimStrokes: readonly(swimStrokes),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    swimStrokeOptions,
    sessionTypeOptions,
    poolTypeOptions,
    sexOptions,
    rpeLabels,
    testOptions,
    fetchTests,
    fetchSwimStrokes,
    clearError,
  }
}
