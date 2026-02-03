export default defineNuxtRouteMiddleware(async (to) => {
  // This middleware handles redirecting authenticated users away from auth pages
  // The @nuxtjs/supabase module handles redirecting unauthenticated users to login

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some((route) => to.path.startsWith(route))

  // Only need to handle the case where authenticated user tries to access auth pages
  if (!isPublicRoute) {
    return // Let Supabase module handle protected route access
  }

  // Skip on server - let client handle this after session is restored
  if (import.meta.server) {
    return
  }

  // On client, check if user is authenticated and redirect away from auth pages
  const user = useSupabaseUser()

  // Wait a tick for the user state to be populated
  if (!user.value) {
    const supabase = useSupabaseClient()
    const { data } = await supabase.auth.getSession()

    if (data.session?.user) {
      // User is authenticated, redirect to home or the redirect param
      const redirect = to.query.redirect as string
      return navigateTo(redirect || '/')
    }
  } else {
    // User is already authenticated
    const redirect = to.query.redirect as string
    return navigateTo(redirect || '/')
  }
})
