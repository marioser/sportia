import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

export default defineNuxtPlugin((nuxtApp) => {
  // Register ECharts components
  use([
    CanvasRenderer,
    LineChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
    MarkLineComponent,
    MarkPointComponent,
  ])

  // Register VChart component globally
  nuxtApp.vueApp.component('VChart', VChart)
})
