import type { Database } from '@sportia/shared'
import type { Club, ClubInsert, ClubUpdate, CreateClubForm, UpdateClubForm } from '~/types'

export function useClubs() {
  const supabase = useSupabaseClient<Database>()
  const { success, error: showError } = useAppToast()

  const clubs = ref<Club[]>([])
  const currentClub = ref<Club | null>(null)
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)

  const clearError = () => {
    errorMessage.value = null
  }

  const fetchClubs = async () => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name')

      if (error) {
        errorMessage.value = error.message
        return []
      }

      clubs.value = data || []
      return data || []
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar clubs'
      errorMessage.value = message
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchClub = async (id: string) => {
    loading.value = true
    clearError()

    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        errorMessage.value = error.message
        return null
      }

      currentClub.value = data
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar club'
      errorMessage.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const createClub = async (form: CreateClubForm) => {
    loading.value = true
    clearError()

    try {
      const insert: ClubInsert = {
        name: form.name,
        country: form.country,
        city: form.city || null,
        logo_url: form.logoUrl || null,
      }

      const { data, error } = await supabase
        .from('clubs')
        .insert(insert)
        .select()
        .single()

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return null
      }

      success('Club creado')
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear club'
      errorMessage.value = message
      showError(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateClub = async (id: string, form: UpdateClubForm) => {
    loading.value = true
    clearError()

    try {
      const update: ClubUpdate = {}
      if (form.name !== undefined) update.name = form.name
      if (form.country !== undefined) update.country = form.country
      if (form.city !== undefined) update.city = form.city || null
      if (form.logoUrl !== undefined) update.logo_url = form.logoUrl || null

      const { data, error } = await supabase
        .from('clubs')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        errorMessage.value = error.message
        showError(error.message)
        return null
      }

      success('Club actualizado')
      currentClub.value = data
      return data
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar club'
      errorMessage.value = message
      showError(message)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    clubs: readonly(clubs),
    currentClub: readonly(currentClub),
    loading: readonly(loading),
    errorMessage: readonly(errorMessage),
    fetchClubs,
    fetchClub,
    createClub,
    updateClub,
    clearError,
  }
}
