<script setup lang="ts">
import { msToTimeString } from '@sportia/shared'
import type { ObjectiveStatus } from '~/composables/useObjectives'

const props = defineProps<{
  athleteId: string
}>()

const {
  loading,
  assignments,
  fetchAthleteAssignments,
  updateAssignmentStatus,
  strokeLabels,
  getStatusLabel,
  getStatusColor,
} = useObjectives()

// Fetch assignments on mount
onMounted(() => {
  fetchAthleteAssignments(props.athleteId)
})

// Status icon mapping
const statusIcons: Record<ObjectiveStatus, string> = {
  PENDING: 'i-heroicons-clock',
  IN_PROGRESS: 'i-heroicons-arrow-path',
  ACHIEVED: 'i-heroicons-check-circle',
  FAILED: 'i-heroicons-x-circle',
}

// Status background colors
const statusBgColors: Record<ObjectiveStatus, string> = {
  PENDING: 'bg-gray-100 dark:bg-slate-700',
  IN_PROGRESS: 'bg-primary-100 dark:bg-primary-900/30',
  ACHIEVED: 'bg-green-100 dark:bg-green-900/30',
  FAILED: 'bg-red-100 dark:bg-red-900/30',
}

// Mark as achieved
const markAchieved = async (assignmentId: string) => {
  await updateAssignmentStatus(assignmentId, 'ACHIEVED')
}

// Mark as in progress
const markInProgress = async (assignmentId: string) => {
  await updateAssignmentStatus(assignmentId, 'IN_PROGRESS')
}

// Get target time (custom or from objective)
const getTargetTime = (assignment: typeof assignments.value[0]): number => {
  return assignment.custom_target_time_ms || assignment.objective?.target_time_ms || 0
}
</script>

<template>
  <SCard title="Objetivos">
    <SLoadingState v-if="loading && assignments.length === 0" type="skeleton" />

    <div v-else-if="assignments.length > 0" class="space-y-3">
      <div
        v-for="assignment in assignments"
        :key="assignment.id"
        class="p-3 rounded-lg"
        :class="statusBgColors[assignment.status]"
      >
        <div class="flex items-start gap-3">
          <!-- Status icon -->
          <div class="mt-1">
            <UIcon
              :name="statusIcons[assignment.status]"
              class="w-5 h-5"
              :class="{
                'text-gray-500': assignment.status === 'PENDING',
                'text-primary-500': assignment.status === 'IN_PROGRESS',
                'text-green-500': assignment.status === 'ACHIEVED',
                'text-red-500': assignment.status === 'FAILED',
              }"
            />
          </div>

          <!-- Objective info -->
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-slate-50">
              {{
                assignment.objective?.test
                  ? `${assignment.objective.test.distance_m}m ${strokeLabels[assignment.objective.test.swim_stroke?.code] || ''}`
                  : 'Objetivo'
              }}
            </div>
            <div class="text-sm">
              <span class="text-gray-600 dark:text-slate-300">Meta: </span>
              <span class="font-mono font-bold text-primary-600 dark:text-primary-400">
                {{ msToTimeString(getTargetTime(assignment)) }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <SBadge
                :text="getStatusLabel(assignment.status)"
                :color="getStatusColor(assignment.status) as any"
                size="sm"
              />
              <span v-if="assignment.achieved_at" class="text-xs text-gray-500 dark:text-slate-400">
                {{ new Date(assignment.achieved_at).toLocaleDateString('es-MX') }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="assignment.status !== 'ACHIEVED'" class="flex gap-1">
            <UButton
              v-if="assignment.status === 'PENDING'"
              icon="i-heroicons-play"
              color="primary"
              variant="ghost"
              size="xs"
              title="Marcar en progreso"
              @click="markInProgress(assignment.id)"
            />
            <UButton
              icon="i-heroicons-check"
              color="green"
              variant="ghost"
              size="xs"
              title="Marcar como logrado"
              @click="markAchieved(assignment.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <SEmptyState
      v-else
      icon="chart"
      title="Sin objetivos"
      description="No hay objetivos asignados a este atleta."
    />
  </SCard>
</template>
