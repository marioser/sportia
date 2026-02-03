<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'

definePageMeta({})

const { primaryClubId } = useProfile()
const {
  loading,
  objectives,
  fetchObjectives,
  deleteObjective,
  formatObjective,
  strokeLabels,
} = useObjectives()

// Fetch objectives for user's club
onMounted(async () => {
  await fetchObjectives(primaryClubId.value || undefined)
})

// Delete confirmation
const showDeleteModal = ref(false)
const objectiveToDelete = ref<string | null>(null)

const confirmDelete = (id: string) => {
  objectiveToDelete.value = id
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (objectiveToDelete.value) {
    await deleteObjective(objectiveToDelete.value)
    showDeleteModal.value = false
    objectiveToDelete.value = null
  }
}

// Scope labels
const scopeLabels: Record<string, string> = {
  GLOBAL: 'Global',
  CLUB: 'Club',
  TEMPLATE: 'Plantilla',
}

const scopeColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'gray'> = {
  GLOBAL: 'primary',
  CLUB: 'success',
  TEMPLATE: 'warning',
}
</script>

<template>
  <div>
    <SPageHeader
      title="Objetivos"
      subtitle="Define metas de tiempo para tus atletas"
    >
      <template #actions>
        <UButton
          to="/objectives/new"
          icon="i-heroicons-plus"
          color="primary"
          size="sm"
        />
      </template>
    </SPageHeader>

    <SLoadingState v-if="loading && objectives.length === 0" text="Cargando objetivos..." />

    <div v-else-if="objectives.length > 0" class="space-y-3">
      <SCard
        v-for="obj in objectives"
        :key="obj.id"
        class="!p-3"
      >
        <div class="flex items-center gap-3">
          <!-- Icon -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-slate-50">
              {{ obj.test ? `${obj.test.distance_m}m ${strokeLabels[obj.test.swim_stroke?.code] || ''}` : 'Objetivo' }}
            </div>
            <div class="text-sm text-gray-500 dark:text-slate-400">
              Meta: {{ msToTimeString(obj.target_time_ms) }}
              <span v-if="obj.test" class="ml-1">({{ obj.test.pool_type }})</span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <SBadge
                :text="scopeLabels[obj.scope] || obj.scope"
                :color="scopeColors[obj.scope] || 'gray'"
                size="sm"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <UButton
              :to="`/objectives/${obj.id}/assign`"
              icon="i-heroicons-user-plus"
              color="gray"
              variant="ghost"
              size="sm"
              title="Asignar"
            />
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              size="sm"
              title="Eliminar"
              @click="confirmDelete(obj.id)"
            />
          </div>
        </div>
      </SCard>
    </div>

    <SEmptyState
      v-else
      icon="target"
      title="Sin objetivos"
      description="Crea objetivos de tiempo para motivar a tus atletas."
      action-label="Crear objetivo"
      action-to="/objectives/new"
    />

    <!-- FAB for mobile -->
    <SFab
      icon="plus"
      to="/objectives/new"
    />

    <!-- Delete confirmation modal -->
    <SModal v-model="showDeleteModal" title="Eliminar objetivo">
      <p class="text-gray-600 dark:text-slate-400 mb-4">
        ¿Estás seguro de eliminar este objetivo? Las asignaciones existentes también serán eliminadas.
      </p>
      <template #footer>
        <div class="flex gap-3">
          <SButton
            variant="outline"
            class="flex-1"
            @click="showDeleteModal = false"
          >
            Cancelar
          </SButton>
          <SButton
            variant="danger"
            class="flex-1"
            :loading="loading"
            @click="handleDelete"
          >
            Eliminar
          </SButton>
        </div>
      </template>
    </SModal>
  </div>
</template>
