/**
 * Wrapper around Nuxt UI's useToast to provide a simpler API
 * Compatible with existing composables
 */
export function useAppToast() {
  const toast = useToast()

  const success = (message: string) => {
    toast.add({
      title: 'Éxito',
      description: message,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  }

  const error = (message: string) => {
    toast.add({
      title: 'Error',
      description: message,
      color: 'red',
      icon: 'i-heroicons-x-circle',
    })
  }

  const warning = (message: string) => {
    toast.add({
      title: 'Advertencia',
      description: message,
      color: 'yellow',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }

  const info = (message: string) => {
    toast.add({
      title: 'Info',
      description: message,
      color: 'blue',
      icon: 'i-heroicons-information-circle',
    })
  }

  return {
    success,
    error,
    warning,
    info,
    // Also expose raw toast for advanced usage
    toast,
  }
}
