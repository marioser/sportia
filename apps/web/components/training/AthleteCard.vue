<script setup lang="ts">
import type { AthleteWithAge } from '~/types'

defineProps<{
  athlete: AthleteWithAge
  showClub?: boolean
}>()

const sexLabels = {
  M: 'Masculino',
  F: 'Femenino',
}
</script>

<template>
  <NuxtLink
    :to="`/athletes/${athlete.id}`"
    class="block"
  >
    <div class="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <SAvatar
        :src="athlete.photo_url"
        :name="`${athlete.first_name} ${athlete.last_name}`"
        size="lg"
      />
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900 truncate">
          {{ athlete.first_name }} {{ athlete.last_name }}
        </h3>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span v-if="athlete.age">{{ athlete.age }} años</span>
          <span v-if="athlete.age_category" class="text-primary-600 font-medium">
            ({{ athlete.age_category }})
          </span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <SBadge
            v-if="athlete.sex"
            :text="sexLabels[athlete.sex] || athlete.sex"
            :color="athlete.sex === 'M' ? 'primary' : 'warning'"
            size="sm"
          />
          <SBadge
            v-if="showClub && athlete.club_name"
            :text="athlete.club_name"
            color="gray"
            size="sm"
          />
          <SBadge
            v-if="athlete.active === false"
            text="Inactivo"
            color="error"
            size="sm"
          />
        </div>
      </div>
      <svg
        class="w-5 h-5 text-gray-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </NuxtLink>
</template>
