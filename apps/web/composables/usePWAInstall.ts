export function usePWAInstall() {
  const isInstalled = ref(false)
  const isOnline = ref(true)
  const canInstall = ref(false)
  const deferredPrompt = ref<any>(null)

  // Check if running as installed PWA
  const checkInstalled = () => {
    if (import.meta.client) {
      isInstalled.value =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    }
  }

  // Check online status
  const updateOnlineStatus = () => {
    if (import.meta.client) {
      isOnline.value = navigator.onLine
    }
  }

  // Handle install prompt
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  }

  // Trigger install prompt
  const install = async (): Promise<boolean> => {
    if (!deferredPrompt.value) return false

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    deferredPrompt.value = null
    canInstall.value = false

    return outcome === 'accepted'
  }

  // Setup event listeners
  onMounted(() => {
    if (import.meta.client) {
      checkInstalled()
      updateOnlineStatus()

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
      window.addEventListener('appinstalled', () => {
        isInstalled.value = true
        canInstall.value = false
      })
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  })

  return {
    isInstalled: readonly(isInstalled),
    isOnline: readonly(isOnline),
    canInstall: readonly(canInstall),
    install,
  }
}
