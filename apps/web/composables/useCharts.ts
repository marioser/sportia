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
  type: 'training' | 'competition'
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
    const allData: TimeProgressData[] = []

    // 1. Fetch training data
    let trainingQuery = supabase
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
      trainingQuery = trainingQuery.eq('test_id', testId)
    }

    const { data: trainingData } = await trainingQuery

    if (trainingData) {
      allData.push(...trainingData.map((item: any) => ({
        date: item.training_session.session_date,
        time_ms: item.total_time_ms,
        test_name: item.test
          ? `${item.test.distance_m}m ${item.test.stroke}`
          : 'Sin prueba',
        session_id: item.training_session.id,
        type: 'training' as const,
      })))
    }

    // 2. Fetch competition results
    let competitionQuery = supabase
      .from('swim_competition_results')
      .select('*')
      .eq('athlete_id', athleteId)
      .not('final_time_ms', 'is', null)
      .order('event_date', { ascending: true })

    // Filter by test if provided
    if (testId) {
      // Get test info to filter competitions
      const { data: testInfo } = await supabase
        .from('tests')
        .select('distance_m, stroke')
        .eq('id', testId)
        .single()

      if (testInfo) {
        competitionQuery = competitionQuery
          .eq('distance_m', testInfo.distance_m)
          .eq('stroke', testInfo.stroke)
      }
    }

    const { data: competitionData } = await competitionQuery

    if (competitionData && competitionData.length > 0) {
      // Add competition results
      for (const result of competitionData) {
        allData.push({
          date: result.event_date,
          time_ms: result.final_time_ms,
          test_name: `${result.distance_m}m ${result.stroke}`,
          session_id: result.id,
          type: 'competition' as const,
        })
      }
    }

    // Sort all data by date
    return allData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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

  // Helper: Calculate linear regression for trend line
  const calculateTrendLine = (data: TimeProgressData[]) => {
    if (data.length < 2) return null

    // Convert dates to numeric values (days from first date)
    const firstDate = new Date(data[0].date).getTime()
    const dataPoints = data.map((item) => ({
      x: (new Date(item.date).getTime() - firstDate) / (1000 * 60 * 60 * 24), // days
      y: item.time_ms,
    }))

    // Calculate linear regression (y = mx + b)
    const n = dataPoints.length
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0)
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0)
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0)

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const b = (sumY - m * sumX) / n

    // Only show trend if it's improving (negative slope = times getting faster)
    if (m >= 0) return null

    return { slope: m, intercept: b, firstDate }
  }

  // Create time progress chart options
  const createTimeProgressOptions = (
    data: TimeProgressData[],
    title?: string
  ): EChartsOption => {
    // Get all unique dates
    const allDates = [...new Set(data.map((d) => d.date))].sort()
    const formattedDates = allDates.map(formatDate)

    // Create date to index mapping
    const dateToIndex = new Map(allDates.map((date, idx) => [date, idx]))

    // Prepare data arrays for each series
    const trainingData = new Array(allDates.length).fill(null)
    const competitionData = new Array(allDates.length).fill(null)

    // Fill data arrays
    data.forEach((item) => {
      const idx = dateToIndex.get(item.date)
      if (idx === undefined) return

      if (item.type === 'training') {
        trainingData[idx] = item.time_ms
      } else if (item.type === 'competition') {
        competitionData[idx] = item.time_ms
      }
    })

    // Calculate trend line
    const trendLine = calculateTrendLine(data)
    const trendData = new Array(allDates.length).fill(null)

    if (trendLine) {
      allDates.forEach((date, idx) => {
        const daysSinceFirst = (new Date(date).getTime() - trendLine.firstDate) / (1000 * 60 * 60 * 24)
        trendData[idx] = trendLine.slope * daysSinceFirst + trendLine.intercept
      })
    }

    // Get min/max for y-axis
    const allTimes = data.map((d) => d.time_ms)
    const minTime = Math.min(...allTimes)
    const maxTime = Math.max(...allTimes)

    const legendData = ['Entrenamiento', 'Competencia']
    if (trendLine) legendData.push('Tendencia')

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
      legend: {
        data: legendData,
        top: title ? 30 : 10,
        textStyle: {
          color: colors.value.gray[600],
          fontSize: 11,
        },
      },
      xAxis: {
        type: 'category',
        data: formattedDates,
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
          const points = Array.isArray(params) ? params : [params]

          // Filtrar la línea de tendencia del tooltip
          const dataPoints = points.filter(p => p.seriesName !== 'Tendencia')
          if (dataPoints.length === 0) return ''

          const dateIdx = dataPoints[0].dataIndex
          const date = allDates[dateIdx]
          const items = data.filter((d) => d.date === date)

          let html = `<div style="font-size: 12px;">`
          html += `<div style="font-weight: 600; margin-bottom: 8px;">${items[0]?.test_name || ''}</div>`
          html += `<div style="margin-bottom: 4px;">Fecha: ${date}</div>`

          items.forEach((item) => {
            if (item.type === 'training') {
              html += `<div>Entrenamiento: <span style="color: ${colors.value.primary}; font-weight: 600;">${formatTime(item.time_ms)}</span></div>`
            } else if (item.type === 'competition') {
              html += `<div>Competencia: <span style="color: ${colors.value.accent}; font-weight: 600;">${formatTime(item.time_ms)}</span></div>`
            }
          })

          html += `</div>`
          return html
        },
      },
      series: [
        // Training times
        {
          name: 'Entrenamiento',
          type: 'line',
          data: trainingData,
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
          connectNulls: false,
        },
        // Competition times
        {
          name: 'Competencia',
          type: 'line',
          data: competitionData,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 10,
          lineStyle: {
            color: colors.value.accent,
            width: 3,
          },
          itemStyle: {
            color: colors.value.accent,
            borderColor: '#fff',
            borderWidth: 2,
          },
          connectNulls: false,
        },
        // Trend line (if available)
        ...(trendLine
          ? [
              {
                name: 'Tendencia',
                type: 'line' as const,
                data: trendData,
                smooth: false,
                symbol: 'none',
                lineStyle: {
                  color: colors.value.success,
                  width: 2,
                  type: 'dashed' as const,
                },
                itemStyle: {
                  color: colors.value.success,
                },
              },
            ]
          : []),
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
