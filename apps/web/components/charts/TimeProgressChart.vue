<script setup lang="ts">
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  athleteId: string
  testId?: number
  title?: string
  height?: string
}>()

const { fetchTimeProgress, createTimeProgressOptions } = useCharts()

const loading = ref(true)
const chartOptions = ref<EChartsOption | null>(null)
const hasData = ref(false)
const chartRef = ref<any>(null)

const loadChart = async () => {
  loading.value = true
  const data = await fetchTimeProgress(props.athleteId, props.testId)

  if (data.length > 0) {
    chartOptions.value = createTimeProgressOptions(data, props.title)
    hasData.value = true
  } else {
    hasData.value = false
  }

  loading.value = false
}

onMounted(loadChart)

watch(() => [props.athleteId, props.testId], loadChart)

// Expose chart instance for PDF export
defineExpose({
  getChartInstance: () => chartRef.value,
  hasData,
})
</script>

<template>
  <div class="w-full">
    <SLoadingState v-if="loading" type="skeleton" />

    <div v-else-if="hasData && chartOptions" :style="{ height: height || '280px' }">
      <VChart
        ref="chartRef"
        :option="chartOptions"
        autoresize
        class="w-full h-full"
      />
    </div>

    <SEmptyState
      v-else
      icon="chart"
      title="Sin datos"
      description="Registra entrenamientos para ver el progreso de tiempos."
    />
  </div>
</template>
