<script setup lang="ts">
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  athleteId: string
  testId?: number
  metric?: 'dps' | 'stroke_rate' | 'swim_index'
  height?: string
}>()

const { fetchMetricsProgress, createMetricsOptions } = useCharts()

const loading = ref(true)
const chartOptions = ref<EChartsOption | null>(null)
const hasData = ref(false)
const chartRef = ref<any>(null)

const loadChart = async () => {
  loading.value = true
  const data = await fetchMetricsProgress(props.athleteId, props.testId)

  if (data.length > 0) {
    chartOptions.value = createMetricsOptions(data, props.metric || 'dps')
    hasData.value = true
  } else {
    hasData.value = false
  }

  loading.value = false
}

onMounted(loadChart)

watch(() => [props.athleteId, props.testId, props.metric], loadChart)

// Expose chart instance for PDF export
defineExpose({
  getChartInstance: () => chartRef.value,
  hasData,
})
</script>

<template>
  <div class="w-full">
    <SLoadingState v-if="loading" type="skeleton" />

    <div v-else-if="hasData && chartOptions" :style="{ height: height || '240px' }">
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
      title="Sin métricas"
      description="Registra brazadas en entrenamientos para ver métricas."
    />
  </div>
</template>
