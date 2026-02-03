import type { Database } from '@sportia/shared'
import type {
  TrainingSetWithTest,
  TrainingSetInsert,
  TrainingSplit,
  TrainingSplitInsert,
  TrainingStroke,
  TrainingStrokeInsert,
  CreateSetForm,
  CreateSplitForm,
  CreateStrokeForm,
} from '~/types'

export function useTrainingSets() {
  const supabase = useSupabaseClient<Database>()
  const { success, error: showError } = useAppToast()

  const sets = ref<TrainingSetWithTest[]>([])
  const currentSet = ref<TrainingSetWithTest | null>(null)
  const splits = ref<TrainingSplit[]>([])
  const strokes = ref<TrainingStroke[]>([])
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const fetchSets = async (sessionId: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('training_sets')
        .select(`
          *,
          tests (
            distance_m,
            pool_type,
            swim_strokes (name_es, code)
          )
        `)
        .eq('session_id', sessionId)
        .order('attempt_no')

      if (error) {
        errorMessage.value = error.message
        return []
      }

      sets.value = data || []
      return data || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar series'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchSet = async (id: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('training_sets')
        .select(`
          *,
          tests (
            distance_m,
            pool_type,
            swim_strokes (name_es, code)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        errorMessage.value = error.message
        return null
      }

      currentSet.value = data
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar serie'
      errorMessage.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const createSet = async (sessionId: string, form: CreateSetForm) => {
    loading.value = true
    clearError()

    try {
      // Get current attempt count
      const { count } = await supabase
        .from('training_sets')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)

      const insert: TrainingSetInsert = {
        session_id: sessionId,
        test_id: form.testId,
        total_time_ms: form.totalTimeMs,
        pool_length_m: form.poolLengthM,
        attempt_no: form.attemptNo || (count || 0) + 1,
      }

      const { data, error } = await supabase
        .from('training_sets')
        .insert(insert)
        .select()
        .single()

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return null
      }

      success('Serie registrada')
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear serie'
      errorMessage.value = message
      showError(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteSet = async (id: string) => {
    loading.value = true
    clearError()

    try {
      const { error } = await supabase
        .from('training_sets')
        .delete()
        .eq('id', id)

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return false
      }

      success('Serie eliminada')
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar serie'
      errorMessage.value = message
      showError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  // Splits
  const fetchSplits = async (setId: string) => {
    try {
      const { data, error } = await supabase
        .from('training_splits')
        .select('*')
        .eq('training_set_id', setId)
        .order('split_index')

      if (error) return []
      splits.value = data || []
      return data || []
    } catch {
      return []
    }
  }

  const createSplit = async (setId: string, form: CreateSplitForm) => {
    try {
      const insert: TrainingSplitInsert = {
        training_set_id: setId,
        split_index: form.splitIndex,
        split_distance_m: form.splitDistanceM,
        split_time_ms: form.splitTimeMs,
      }

      const { data, error } = await supabase
        .from('training_splits')
        .insert(insert)
        .select()
        .single()

      if (error) {
        showError(error.message)
        return null
      }

      return data
    } catch {
      return null
    }
  }

  const createSplits = async (setId: string, forms: CreateSplitForm[]) => {
    try {
      const inserts: TrainingSplitInsert[] = forms.map((form) => ({
        training_set_id: setId,
        split_index: form.splitIndex,
        split_distance_m: form.splitDistanceM,
        split_time_ms: form.splitTimeMs,
      }))

      const { data, error } = await supabase
        .from('training_splits')
        .insert(inserts)
        .select()

      if (error) {
        showError(error.message)
        return null
      }

      return data
    } catch {
      return null
    }
  }

  // Strokes
  const fetchStrokes = async (setId: string) => {
    try {
      const { data, error } = await supabase
        .from('training_strokes')
        .select('*')
        .eq('training_set_id', setId)
        .order('length_index')

      if (error) return []
      strokes.value = data || []
      return data || []
    } catch {
      return []
    }
  }

  const createStroke = async (setId: string, form: CreateStrokeForm) => {
    try {
      const insert: TrainingStrokeInsert = {
        training_set_id: setId,
        length_index: form.lengthIndex,
        stroke_count: form.strokeCount,
      }

      const { data, error } = await supabase
        .from('training_strokes')
        .insert(insert)
        .select()
        .single()

      if (error) {
        showError(error.message)
        return null
      }

      return data
    } catch {
      return null
    }
  }

  const createStrokes = async (setId: string, forms: CreateStrokeForm[]) => {
    try {
      const inserts: TrainingStrokeInsert[] = forms.map((form) => ({
        training_set_id: setId,
        length_index: form.lengthIndex,
        stroke_count: form.strokeCount,
      }))

      const { data, error } = await supabase
        .from('training_strokes')
        .insert(inserts)
        .select()

      if (error) {
        showError(error.message)
        return null
      }

      return data
    } catch {
      return null
    }
  }

  return {
    sets: readonly(sets),
    currentSet: readonly(currentSet),
    splits: readonly(splits),
    strokes: readonly(strokes),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    fetchSets,
    fetchSet,
    createSet,
    deleteSet,
    fetchSplits,
    createSplit,
    createSplits,
    fetchStrokes,
    createStroke,
    createStrokes,
    clearError,
  }
}
