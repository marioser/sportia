import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface ChartExportOptions {
  title?: string
  athleteName?: string
  athleteInfo?: string
  filename?: string
}

export function useChartExport() {
  const exporting = ref(false)
  const { error: showError, success } = useAppToast()

  /**
   * Export a DOM element (with charts) to PDF
   */
  const exportElementToPDF = async (
    element: HTMLElement,
    options: ChartExportOptions = {}
  ) => {
    if (!element) {
      showError('No se encontró el contenido para exportar')
      return
    }

    exporting.value = true

    try {
      // Capture element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('portrait', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10

      // Header
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(14, 165, 233) // Primary color
      pdf.text(options.title || 'Reporte de Rendimiento', margin, 15)

      // Athlete info
      if (options.athleteName) {
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0)
        pdf.text(options.athleteName, margin, 23)
      }

      if (options.athleteInfo) {
        pdf.setFontSize(9)
        pdf.setTextColor(100)
        pdf.text(options.athleteInfo, margin, 29)
        pdf.setTextColor(0)
      }

      // Date
      pdf.setFontSize(8)
      pdf.setTextColor(150)
      const dateStr = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      pdf.text(`Generado: ${dateStr}`, pageWidth - margin - 40, 15)
      pdf.setTextColor(0)

      // Calculate image dimensions to fit page
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let yPosition = 35

      // If image is too tall, split across pages
      const maxImgHeight = pageHeight - yPosition - 15

      if (imgHeight <= maxImgHeight) {
        // Fits on one page
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight)
      } else {
        // Need multiple pages
        let remainingHeight = imgHeight
        let sourceY = 0

        while (remainingHeight > 0) {
          const sliceHeight = Math.min(remainingHeight, maxImgHeight)
          const sliceRatio = sliceHeight / imgHeight

          // Create a slice of the canvas
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = canvas.height * sliceRatio
          const ctx = sliceCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, sourceY * (canvas.height / imgHeight),
              canvas.width, sliceCanvas.height,
              0, 0,
              sliceCanvas.width, sliceCanvas.height
            )
            const sliceData = sliceCanvas.toDataURL('image/png')
            pdf.addImage(sliceData, 'PNG', margin, yPosition, imgWidth, sliceHeight)
          }

          remainingHeight -= sliceHeight
          sourceY += sliceHeight

          if (remainingHeight > 0) {
            pdf.addPage()
            yPosition = 15
          }
        }
      }

      // Footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(150)
        pdf.text('SPORTIA - Plataforma de Gestión Deportiva', margin, pageHeight - 8)
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 8)
      }

      // Download
      const filename = options.filename || `reporte-${options.athleteName?.replace(/\s+/g, '-').toLowerCase() || 'atleta'}-${Date.now()}.pdf`
      pdf.save(filename)
      success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showError('Error al generar el PDF')
    } finally {
      exporting.value = false
    }
  }

  /**
   * Export multiple chart images to a single PDF
   */
  const exportChartsToPDF = async (
    chartImages: Array<{ title: string; dataUrl: string }>,
    options: ChartExportOptions = {}
  ) => {
    if (chartImages.length === 0) {
      showError('No hay gráficos para exportar')
      return
    }

    exporting.value = true

    try {
      const pdf = new jsPDF('portrait', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - margin * 2

      // Header
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(options.title || 'Reporte de Rendimiento', margin, 20)

      if (options.athleteName) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'normal')
        pdf.text(options.athleteName, margin, 30)
      }

      if (options.athleteInfo) {
        pdf.setFontSize(10)
        pdf.setTextColor(100)
        pdf.text(options.athleteInfo, margin, 37)
        pdf.setTextColor(0)
      }

      const dateStr = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      pdf.setFontSize(9)
      pdf.setTextColor(150)
      pdf.text(`Generado: ${dateStr}`, margin, 44)
      pdf.setTextColor(0)

      let yPosition = 55

      for (const chart of chartImages) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text(chart.title, margin, yPosition)
        yPosition += 5

        const imgHeight = 70
        pdf.addImage(chart.dataUrl, 'PNG', margin, yPosition, contentWidth, imgHeight)
        yPosition += imgHeight + 15
      }

      pdf.setFontSize(8)
      pdf.setTextColor(150)
      pdf.text('SPORTIA - Plataforma de Gestión Deportiva', margin, pageHeight - 10)

      const filename = options.filename || `reporte-${options.athleteName?.replace(/\s+/g, '-').toLowerCase() || 'atleta'}-${Date.now()}.pdf`
      pdf.save(filename)
      success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showError('Error al generar el PDF')
    } finally {
      exporting.value = false
    }
  }

  /**
   * Get data URL from an ECharts instance
   */
  const getChartDataUrl = (chartInstance: any): string | null => {
    if (!chartInstance) return null

    try {
      return chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff',
      })
    } catch (e) {
      console.error('Error getting chart data URL:', e)
      return null
    }
  }

  return {
    exporting,
    exportElementToPDF,
    exportChartsToPDF,
    getChartDataUrl,
  }
}
