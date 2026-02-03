<script setup lang="ts">
import type { SwimmingMetrics } from '~/types'

defineProps<{
  metrics: SwimmingMetrics
}>()

const formatValue = (value: number, decimals = 2) => {
  return value.toFixed(decimals)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- DPS -->
    <div class="p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center gap-2 mb-1">
        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span class="text-xs text-gray-500 uppercase">DPS</span>
      </div>
      <p class="text-xl font-bold text-gray-900">
        {{ formatValue(metrics.dps) }}
        <span class="text-sm font-normal text-gray-500">m/brazada</span>
      </p>
    </div>

    <!-- Stroke Frequency -->
    <div class="p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center gap-2 mb-1">
        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span class="text-xs text-gray-500 uppercase">Frecuencia</span>
      </div>
      <p class="text-xl font-bold text-gray-900">
        {{ formatValue(metrics.strokeFrequency, 1) }}
        <span class="text-sm font-normal text-gray-500">braz/min</span>
      </p>
    </div>

    <!-- Velocity -->
    <div class="p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center gap-2 mb-1">
        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span class="text-xs text-gray-500 uppercase">Velocidad</span>
      </div>
      <p class="text-xl font-bold text-gray-900">
        {{ formatValue(metrics.velocity) }}
        <span class="text-sm font-normal text-gray-500">m/s</span>
      </p>
    </div>

    <!-- Swim Index -->
    <div class="p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center gap-2 mb-1">
        <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span class="text-xs text-gray-500 uppercase">Indice</span>
      </div>
      <p class="text-xl font-bold text-gray-900">
        {{ formatValue(metrics.swimIndex) }}
      </p>
    </div>

    <!-- Training Load (if available) -->
    <div v-if="metrics.trainingLoad" class="col-span-2 p-3 bg-primary-50 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          <span class="text-sm text-primary-800">Carga de entrenamiento</span>
        </div>
        <p class="text-2xl font-bold text-primary-600">
          {{ metrics.trainingLoad }}
        </p>
      </div>
    </div>
  </div>
</template>
