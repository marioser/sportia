<script setup lang="ts">
definePageMeta({

})

const { logout, loading: logoutLoading } = useAuth()
const { profile, loading, role, clubMemberships, isAdmin } = useProfile()
const { isSimulating, simulationTarget, stopSimulation } = useSimulation()

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  CLUB_ADMIN: 'Admin de Club',
  COACH: 'Entrenador',
  ATHLETE: 'Atleta',
}
</script>

<template>
  <div>
    <SPageHeader title="Mi Perfil" />

    <div class="space-y-4">
      <SCard>
        <SLoadingState v-if="loading" />
        <div v-else-if="profile" class="flex items-center gap-4">
          <SAvatar
            :src="profile.avatar_url"
            :name="profile.full_name"
            size="xl"
          />
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white truncate">
              {{ profile.full_name }}
            </h2>
            <SBadge
              v-if="role"
              :text="roleLabels[role] || role"
              color="primary"
            />
          </div>
        </div>
      </SCard>

      <SCard title="Mis Clubs" v-if="clubMemberships.length > 0">
        <SList>
          <SListItem
            v-for="membership in clubMemberships"
            :key="membership.club_id"
            :title="membership.club_id"
            :badge="membership.role_in_club"
          />
        </SList>
      </SCard>

      <SCard title="Configuracion">
        <div class="space-y-2">
          <NuxtLink
            to="/profile/edit"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="text-gray-900 dark:text-white">Editar perfil</span>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>

          <!-- Color mode toggle -->
          <ColorModeToggle />
        </div>
      </SCard>

      <!-- Admin tools (only for admins) -->
      <SCard v-if="isAdmin" title="Herramientas de Admin">
        <div class="space-y-2">
          <!-- User management link -->
          <NuxtLink
            to="/admin/users"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-users" class="w-5 h-5 text-primary-500" />
              <div>
                <span class="text-gray-900 dark:text-white">Gestión de Usuarios</span>
                <p class="text-xs text-gray-500 dark:text-slate-400">Crear y administrar cuentas</p>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>

          <!-- Simulation mode link -->
          <NuxtLink
            to="/admin/simulate"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-eye" class="w-5 h-5 text-violet-500" />
              <div>
                <span class="text-gray-900 dark:text-white">Modo Simulación</span>
                <p class="text-xs text-gray-500 dark:text-slate-400">Ver la app como otro usuario</p>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>

          <!-- Active simulation indicator -->
          <div
            v-if="isSimulating"
            class="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-violet-500" />
              <div>
                <span class="text-sm text-violet-800 dark:text-violet-200">Simulando:</span>
                <span class="text-sm font-medium text-violet-900 dark:text-violet-100 ml-1">
                  {{ simulationTarget?.name }}
                </span>
              </div>
            </div>
            <UButton size="xs" color="violet" variant="soft" @click="stopSimulation">
              Salir
            </UButton>
          </div>
        </div>
      </SCard>

      <!-- Account section -->
      <SCard title="Cuenta">
        <div class="space-y-2">
          <button
            class="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
            :disabled="logoutLoading"
            @click="logout"
          >
            <div class="flex items-center gap-3 text-error-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar sesion</span>
            </div>
            <svg
              v-if="logoutLoading"
              class="animate-spin w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </button>
        </div>
      </SCard>
    </div>
  </div>
</template>
