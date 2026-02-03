<script setup lang="ts">
definePageMeta({})

const route = useRoute()
const clubId = computed(() => route.params.id as string)

const { currentClub, fetchClub } = useClubs()
const { coaches, loading, fetchCoaches } = useCoaches()
const { isAdmin, isClubAdmin } = useProfile()

const canEdit = computed(() => isAdmin.value || isClubAdmin.value)

onMounted(async () => {
  await fetchClub(clubId.value)
  await fetchCoaches(clubId.value)
})
</script>

<template>
  <div>
    <SPageHeader
      :title="`Entrenadores - ${currentClub?.name || ''}`"
      :back-to="`/clubs/${clubId}`"
    >
      <template v-if="canEdit" #actions>
        <UButton
          :to="`/clubs/${clubId}/coaches/new`"
          icon="i-heroicons-plus"
          color="primary"
          size="sm"
        />
      </template>
    </SPageHeader>

    <SLoadingState v-if="loading && coaches.length === 0" text="Cargando entrenadores..." />

    <div v-else-if="coaches.length > 0" class="space-y-3">
      <NuxtLink
        v-for="coach in coaches"
        :key="coach.id"
        :to="`/clubs/${clubId}/coaches/${coach.id}`"
        class="block"
      >
        <SCard class="!p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
          <div class="flex items-center gap-3">
            <SAvatar
              :src="(coach as any).profiles?.avatar_url"
              :name="(coach as any).profiles?.full_name || 'Entrenador'"
              size="md"
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-slate-50 truncate">
                {{ (coach as any).profiles?.full_name || 'Sin nombre' }}
              </div>
              <div class="text-sm text-gray-500 dark:text-slate-400">
                {{ coach.specialization || 'Entrenador' }}
              </div>
            </div>
            <SBadge
              v-if="coach.is_independent"
              text="Independiente"
              color="warning"
              size="sm"
            />
          </div>
        </SCard>
      </NuxtLink>
    </div>

    <SEmptyState
      v-else
      icon="users"
      title="Sin entrenadores"
      description="Este club aún no tiene entrenadores registrados."
      :action-label="canEdit ? 'Agregar entrenador' : undefined"
      :action-to="canEdit ? `/clubs/${clubId}/coaches/new` : undefined"
    />

    <SFab
      v-if="canEdit"
      icon="plus"
      :to="`/clubs/${clubId}/coaches/new`"
    />
  </div>
</template>
