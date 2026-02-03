import { msToTimeString } from '@sportia/shared'
import type { EChartsOption } from 'echarts'

// SPORTIA Design System Colors
export const chartColors = {
  primary: '#0EA5E9',
  primaryDark: '#0284C7',
  secondary: '#14B8A6',
  accent: '#F97316',
  success: '#10B981',
  error: '#F43F5E',
  warning: '#F59E0B',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
}

// Dark mode colors
export const chartColorsDark = {
  ...chartColors,
  gray: {
    50: '#0F172A',
    100: '#1E293B',
    200: '#334155',
    300: '#475569',
    400: '#64748B',
    500: '#94A3B8',
    600: '#CBD5E1',
    700: '#E2E8F0',
    800: '#F1F5F9',
    900: '#F8FAFC',
  },
}

export interface TimeProgressData {
  date: string
  time_ms: number
  test_name: string
  session_id: string
}

export interface MetricsData {
  date: string
  dps: number | null
  stroke_rate: number | null
  swim_index: number | null
}

export function useCharts() {
  const colorMode = useColorMode()
  const supabase = useSupabaseClient()

  const isDark = computed(() => colorMode.value === 'dark')

  const colors = computed(() => isDark.value ? chartColorsDark : chartColors)

  // Base chart options with theme
  const baseChartOptions = computed<Partial<EChartsOption>>(() => ({
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: colors.value.gray[700],
    },
    grid: {
      left: 12,
      right: 12,
      top: 40,
      bottom: 24,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? colors.value.gray[100] : colors.value.gray[50],
      borderColor: isDark.value ? colors.value.gray[200] : colors.value.gray[200],
      textStyle: {
        color: colors.value.gray[700],
      },
    },
  }))

  // Fetch time progression data for an athlete
  const fetchTimeProgress = async (
    athleteId: string,
    testId?: number
  ): Promise<TimeProgressData[]> => {
    let query = supabase
      .from('training_sets')
      .select(`
        total_time_ms,
        test_id,
        training_session:training_sessions!inner(
          id,
          session_date,
          athlete_id
        ),
        test:tests(
          distance_m,
          stroke,
          pool_type
        )
      `)
      .eq('training_sessions.athlete_id', athleteId)
      .not('total_time_ms', 'is', null)
      .order('training_sessions.session_date', { ascending: true })

    if (testId) {
      query = query.eq('test_id', testId)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((item: any) => ({
      date: item.training_session.session_date,
      time_ms: item.total_time_ms,
      test_name: item.test
        ? `${item.test.distance_m}m ${item.test.stroke}`
        : 'Sin prueba',
      session_id: item.training_session.id,
    }))
  }

  // Fetch swimming metrics data for an athlete
  const fetchMetricsProgress = async (
    athleteId: string,
    testId?: number
  ): Promise<MetricsData[]> => {
    let query = supabase
      .from('training_sets')
      .select(`
        id,
        total_time_ms,
        test_id,
        training_session:training_sessions!inner(
          session_date,
          athlete_id
        ),
        test:tests(
          distance_m
        ),
        strokes:training_strokes(
          stroke_count
        )
      `)
      .eq('training_sessions.athlete_id', athleteId)
      .not('total_time_ms', 'is', null)
      .order('training_sessions.session_date', { ascending: true })

    if (testId) {
      query = query.eq('test_id', testId)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((item: any) => {
      const totalStrokes = item.strokes?.reduce(
        (sum: number, s: any) => sum + (s.stroke_count || 0),
        0
      ) || null
      const distance = item.test?.distance_m || 0
      const timeSeconds = item.total_time_ms / 1000

      // Calculate metrics
      let dps = null
      let strokeRate = null
      let swimIndex = null

      if (totalStrokes && totalStrokes > 0 && distance > 0) {
        dps = distance / totalStrokes
        strokeRate = (totalStrokes / timeSeconds) * 60
        const velocity = distance / timeSeconds
        swimIndex = dps * velocity
      }

      return {
        date: item.training_session.session_date,
        dps,
        stroke_rate: strokeRate,
        swim_index: swimIndex,
      }
    }).filter((m: MetricsData) => m.dps !== null)
  }

  // Format time for tooltip/axis
  const formatTime = (ms: number): string => {
    return msToTimeString(ms)
  }

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  // Create time progress chart options
  const createTimeProgressOptions = (
    data: TimeProgressData[],
    title?: string
  ): EChartsOption => {
    const dates = data.map((d) => formatDate(d.date))
    const times = data.map((d) => d.time_ms)
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    return {
      ...baseChartOptions.value,
      title: title
        ? {
            text: title,
            left: 'center',
            textStyle: {
              fontSize: 14,
              fontWeight: 600,
              color: colors.value.gray[800],
            },
          }
        : undefined,
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: { color: colors.value.gray[300] },
        },
        axisLabel: {
          color: colors.value.gray[500],
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'value',
        inverse: true, // Lower times are better
        min: Math.floor(minTime * 0.95),
        max: Math.ceil(maxTime * 1.05),
        axisLabel: {
          formatter: (value: number) => formatTime(value),
          color: colors.value.gray[500],
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: colors.value.gray[200], type: 'dashed' },
        },
      },
      tooltip: {
        ...baseChartOptions.value.tooltip,
        formatter: (params: any) => {
          const point = Array.isArray(params) ? params[0] : params
          const dataIndex = point.dataIndex
          const item = data[dataIndex]
          return `
            <div style="font-size: 12px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${item.test_name}</div>
              <div>Fecha: ${item.date}</div>
              <div>Tiempo: <span style="color: ${colors.value.primary}; font-weight: 600;">${formatTime(item.time_ms)}</span></div>
            </div>
          `
        },
      },
      series: [
        {
          type: 'line',
          data: times,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: colors.value.primary,
            width: 3,
          },
          itemStyle: {
            color: colors.value.primary,
            borderColor: '#fff',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${colors.value.primary}40` },
                { offset: 1, color: `${colors.value.primary}05` },
              ],
            },
          },
          markLine: times.length > 1
            ? {
                silent: true,
                data: [{ type: 'min', name: 'Mejor' }],
                lineStyle: { color: colors.value.success, type: 'dashed' },
                label: {
                  formatter: (params: any) => `PR: ${formatTime(params.value)}`,
                  color: colors.value.success,
                },
              }
            : undefined,
        },
      ],
    } as EChartsOption
  }

  // Create metrics comparison chart options
  const createMetricsOptions = (
    data: MetricsData[],
    metric: 'dps' | 'stroke_rate' | 'swim_index' = 'dps'
  ): EChartsOption => {
    const dates = data.map((d) => formatDate(d.date))
    const values = data.map((d) => d[metric] || 0)

    const metricConfig = {
      dps: {
        title: 'Distancia por Brazada (DPS)',
        unit: 'm',
        color: colors.value.secondary,
        decimals: 2,
      },
      stroke_rate: {
        title: 'Frecuencia de Brazada',
        unit: 'br/min',
        color: colors.value.accent,
        decimals: 1,
      },
      swim_index: {
        title: 'Índice de Nado',
        unit: '',
        color: colors.value.primary,
        decimals: 2,
      },
    }

    const config = metricConfig[metric]

    return {
      ...baseChartOptions.value,
      title: {
        text: config.title,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
          color: colors.value.gray[800],
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: { color: colors.value.gray[300] },
        },
        axisLabel: {
          color: colors.value.gray[500],
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) =>
            `${value.toFixed(config.decimals)}${config.unit}`,
          color: colors.value.gray[500],
          fontSize: 11,
        },
        splitLine: {
          lineStyle: { color: colors.value.gray[200], type: 'dashed' },
        },
      },
      tooltip: {
        ...baseChartOptions.value.tooltip,
        formatter: (params: any) => {
          const point = Array.isArray(params) ? params[0] : params
          return `
            <div style="font-size: 12px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>
              <div>${config.title}: <span style="color: ${config.color}; font-weight: 600;">${point.value.toFixed(config.decimals)}${config.unit}</span></div>
            </div>
          `
        },
      },
      series: [
        {
          type: 'bar',
          data: values,
          barWidth: '60%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: config.color },
                { offset: 1, color: `${config.color}80` },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    } as EChartsOption
  }

  return {
    colors,
    isDark,
    baseChartOptions,
    fetchTimeProgress,
    fetchMetricsProgress,
    formatTime,
    formatDate,
    createTimeProgressOptions,
    createMetricsOptions,
  }
}
