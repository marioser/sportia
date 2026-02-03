<script setup lang="ts">
import type { AthleteBadge } from '~/composables/useObjectives'

const props = defineProps<{
  athleteId: string
}>()

const { loading, badges, fetchAthleteBadges, getAthletePoints } = useObjectives()

// Fetch badges on mount
onMounted(() => {
  fetchAthleteBadges(props.athleteId)
})

// Badge icon mapping
const badgeIcons: Record<string, string> = {
  trophy: 'i-heroicons-trophy',
  star: 'i-heroicons-star',
  medal: 'i-heroicons-academic-cap',
  award: 'i-heroicons-sparkles',
  crown: 'i-heroicons-crown',
  zap: 'i-heroicons-bolt',
  flame: 'i-heroicons-fire',
}

// Badge color classes
const badgeColors: Record<string, string> = {
  gold: 'from-amber-400 to-amber-600',
  sky: 'from-sky-400 to-sky-600',
  emerald: 'from-emerald-400 to-emerald-600',
  amber: 'from-amber-400 to-amber-600',
  violet: 'from-violet-400 to-violet-600',
  rose: 'from-rose-400 to-rose-600',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-red-400 to-red-600',
}

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <SCard title="Medallas">
    <template #header-actions>
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500 dark:text-slate-400">Puntos:</span>
        <span class="font-bold text-primary-600 dark:text-primary-400">{{ getAthletePoints }}</span>
      </div>
    </template>

    <SLoadingState v-if="loading && badges.length === 0" type="skeleton" />

    <div v-else-if="badges.length > 0" class="grid grid-cols-3 gap-3">
      <div
        v-for="badge in badges"
        :key="badge.id"
        class="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800"
      >
        <!-- Badge icon -->
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-gradient-to-br"
          :class="badgeColors[badge.badge_type?.color || 'gold']"
        >
          <UIcon
            :name="badgeIcons[badge.badge_type?.icon || 'trophy'] || 'i-heroicons-trophy'"
            class="w-6 h-6 text-white"
          />
        </div>

        <!-- Badge name -->
        <div class="text-xs font-medium text-center text-gray-900 dark:text-slate-50">
          {{ badge.badge_type?.name_es || 'Medalla' }}
        </div>

        <!-- Earned date -->
        <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {{ formatDate(badge.earned_at) }}
        </div>
      </div>
    </div>

    <SEmptyState
      v-else
      icon="chart"
      title="Sin medallas"
      description="Completa objetivos para ganar medallas."
    />
  </SCard>
</template>
