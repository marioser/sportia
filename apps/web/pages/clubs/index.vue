<script setup lang="ts">
definePageMeta({
  
})

const { clubs, loading, fetchClubs } = useClubs()
const { isAdmin, isClubAdmin } = useProfile()

onMounted(() => {
  fetchClubs()
})

const canCreateClub = computed(() => isAdmin.value || isClubAdmin.value)
</script>

<template>
  <div>
    <SPageHeader
      title="Clubes"
      :subtitle="`${clubs.length} clubes`"
    >
      <template v-if="canCreateClub" #actions>
        <NuxtLink
          to="/clubs/new"
          class="p-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </NuxtLink>
      </template>
    </SPageHeader>

    <SLoadingState v-if="loading" text="Cargando clubes..." />

    <div v-else-if="clubs.length > 0" class="space-y-3">
      <NuxtLink
        v-for="club in clubs"
        :key="club.id"
        :to="`/clubs/${club.id}`"
        class="block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center gap-3">
          <div
            v-if="club.logo_url"
            class="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden"
          >
            <img :src="club.logo_url" :alt="club.name" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
          >
            <span class="text-primary-600 dark:text-primary-400 font-bold text-lg">
              {{ club.name.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-slate-50">{{ club.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ club.city ? `${club.city}, ` : '' }}{{ club.country }}
            </p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Sin clubes"
      description="Crea tu primer club para comenzar."
      :action-label="canCreateClub ? 'Crear club' : undefined"
      :action-to="canCreateClub ? '/clubs/new' : undefined"
    />

    <SFab v-if="canCreateClub" icon="plus" to="/clubs/new" />
  </div>
</template>
