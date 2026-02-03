<script setup lang="ts">
definePageMeta({})

const router = useRouter()
const { isAdmin, profile } = useProfile()
const { loading, getAllUsers } = useUserManagement()

// Redirect if not admin (wait for profile to load first)
watch([isAdmin, profile], ([admin, prof]) => {
  if (prof && !admin) {
    router.push('/')
  }
})

// Load users
const users = ref<any[]>([])
const loadingUsers = ref(false)

const loadUsers = async () => {
  loadingUsers.value = true
  users.value = await getAllUsers()
  loadingUsers.value = false
}

onMounted(() => {
  loadUsers()
})

// Role labels
const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  CLUB_ADMIN: 'Admin de Club',
  COACH: 'Entrenador',
  ATHLETE: 'Atleta',
}

// Role colors
const roleColors: Record<string, string> = {
  ADMIN: 'red',
  CLUB_ADMIN: 'amber',
  COACH: 'teal',
  ATHLETE: 'violet',
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div>
    <SPageHeader title="Usuarios" back-to="/profile">
      <template #actions>
        <UButton
          to="/admin/users/new"
          icon="i-heroicons-plus"
          color="primary"
          size="sm"
        />
      </template>
    </SPageHeader>

    <template v-if="isAdmin">
      <!-- Stats -->
      <div class="grid grid-cols-4 gap-2 mb-4">
        <UCard class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-slate-50">{{ users.length }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">Total</p>
        </UCard>
        <UCard class="text-center">
          <p class="text-2xl font-bold text-violet-600">{{ users.filter(u => u.role === 'ATHLETE').length }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">Atletas</p>
        </UCard>
        <UCard class="text-center">
          <p class="text-2xl font-bold text-teal-600">{{ users.filter(u => u.role === 'COACH').length }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">Coaches</p>
        </UCard>
        <UCard class="text-center">
          <p class="text-2xl font-bold text-amber-600">{{ users.filter(u => u.role === 'CLUB_ADMIN' || u.role === 'ADMIN').length }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">Admins</p>
        </UCard>
      </div>

      <!-- Users list -->
      <SLoadingState v-if="loadingUsers" text="Cargando usuarios..." />

      <div v-else-if="users.length > 0" class="space-y-2">
        <UCard
          v-for="user in users"
          :key="user.id"
          class="!p-3"
        >
          <div class="flex items-center gap-3">
            <SAvatar
              :src="user.avatar_url"
              :name="user.full_name"
              size="md"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-slate-50 truncate">
                {{ user.full_name }}
              </p>
              <div class="flex items-center gap-2">
                <SBadge
                  :text="roleLabels[user.role] || user.role"
                  :color="roleColors[user.role] || 'gray'"
                  size="sm"
                />
                <span class="text-xs text-gray-500 dark:text-slate-400">
                  {{ formatDate(user.created_at) }}
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <SEmptyState
        v-else
        icon="users"
        title="Sin usuarios"
        description="No hay usuarios registrados."
        action-label="Crear usuario"
        action-to="/admin/users/new"
      />
    </template>

    <SEmptyState
      v-else
      icon="users"
      title="Acceso restringido"
      description="Solo los administradores pueden gestionar usuarios."
      action-label="Volver al inicio"
      action-to="/"
    />

    <!-- FAB -->
    <SFab v-if="isAdmin" icon="plus" to="/admin/users/new" />
  </div>
</template>
