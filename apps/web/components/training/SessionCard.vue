<script setup lang="ts">
import type { TrainingSessionWithLoad } from '~/types'
import { SESSION_TYPES } from '@sportia/config'

defineProps<{
  session: TrainingSessionWithLoad
}>()

const sessionTypeLabels: Record<string, string> = {
  AEROBIC: 'Aerobico',
  THRESHOLD: 'Umbral',
  SPEED: 'Velocidad',
  TECH: 'Tecnica',
}

type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'gray'

const sessionTypeColors: Record<string, BadgeColor> = {
  AEROBIC: 'primary',
  THRESHOLD: 'warning',
  SPEED: 'error',
  TECH: 'success',
}
</script>

<template>
  <NuxtLink
    :to="`/training/${session.id}`"
    class="block"
  >
    <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-2">
        <div>
          <p class="text-sm text-gray-500">{{ session.session_date }}</p>
          <h3 class="font-semibold text-gray-900 mt-0.5">
            {{ session.athlete_name || 'Atleta' }}
          </h3>
        </div>
        <SBadge
          v-if="session.session_type"
          :text="sessionTypeLabels[session.session_type] || session.session_type"
          :color="sessionTypeColors[session.session_type] || 'gray'"
        />
      </div>

      <div class="flex items-center gap-4 text-sm">
        <div class="flex items-center gap-1">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-gray-600">{{ session.duration_min }} min</span>
        </div>

        <div class="flex items-center gap-1">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="text-gray-600">RPE {{ session.session_rpe }}</span>
        </div>

        <div v-if="session.training_load" class="flex items-center gap-1">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="text-gray-600">Carga {{ session.training_load }}</span>
        </div>
      </div>

      <p v-if="session.notes" class="mt-2 text-sm text-gray-500 truncate">
        {{ session.notes }}
      </p>
    </div>
  </NuxtLink>
</template>
