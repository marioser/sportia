/**
 * Composable for user management (admin only)
 * Uses Edge Function to create users with credentials
 */

import type { UserRole } from '~/types'

export interface CreateUserForm {
  email: string
  password: string
  fullName: string
  role: UserRole
  clubId?: string
  clubRole?: 'ADMIN' | 'COACH' | 'ATHLETE'
  athleteId?: string // Link to existing athlete
  coachId?: string // Link to existing coach
}

export interface CreatedUser {
  id: string
  email: string
  fullName: string
  role: UserRole
}

export function useUserManagement() {
  const supabase = useSupabaseClient()
  const { success, error: showError } = useAppToast()

  const loading = ref(false)

  /**
   * Create a new user with credentials
   * Only callable by admins
   */
  const createUser = async (form: CreateUserForm): Promise<CreatedUser | null> => {
    loading.value = true

    try {
      // Get current session to include access token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        showError('Error de sesión')
        return null
      }

      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        console.error('No access token found in session:', sessionData)
        showError('No hay sesión activa. Por favor inicia sesión nuevamente.')
        return null
      }

      console.log('Calling Edge Function with token:', accessToken.substring(0, 20) + '...')

      // Call Edge Function with explicit Authorization header
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: form,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (error) {
        console.error('Create user error:', error)
        // Check if it's a FunctionsHttpError to get more details
        if (error.message?.includes('non-2xx')) {
          console.error('Edge function returned error status')
        }
        showError(error.message || 'Error al crear usuario')
        return null
      }

      if (data?.error) {
        showError(data.error)
        return null
      }

      success('Usuario creado exitosamente')
      return data.user
    } catch (e) {
      console.error('Create user error:', e)
      showError('Error al crear usuario')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Generate a random password
   */
  const generatePassword = (length = 12): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  /**
   * Get athletes without linked user accounts
   */
  const getUnlinkedAthletes = async (clubId?: string) => {
    let query = supabase
      .from('athletes_with_age')
      .select('id, first_name, last_name, club_id, age_category')
      .is('user_id', null)
      .eq('active', true)

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    const { data, error } = await query.order('last_name')

    if (error) {
      console.error('Error fetching unlinked athletes:', error)
      return []
    }

    return data || []
  }

  /**
   * Get coaches without linked user accounts
   */
  const getUnlinkedCoaches = async () => {
    const { data, error } = await supabase
      .from('coaches')
      .select('id, specialization, user_id')
      .is('user_id', null)

    if (error) {
      console.error('Error fetching unlinked coaches:', error)
      return []
    }

    return data || []
  }

  /**
   * Get all users (profiles) for management
   */
  const getAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        avatar_url,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data || []
  }

  return {
    loading: readonly(loading),
    createUser,
    generatePassword,
    getUnlinkedAthletes,
    getUnlinkedCoaches,
    getAllUsers,
  }
}
