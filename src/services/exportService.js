/**
 * Export Service
 * Handles export functionality for trainer reports in multiple formats
 */

import { trainerReportService } from './trainerReportService.js'

export class ExportService {
  constructor() {
    this.exportQueue = []
    this.emailConfig = null
  }

  /**
   * Initialize export service
   */
  async initialize(emailConfig = null) {
    console.log('📤 Initializing Export Service')
    this.emailConfig = emailConfig
    return true
  }

  /**
   * Export weekly report as PDF
   */
  async exportToPDF(reportData, options = {}) {
    console.log('📄 Generating PDF report...')
    
    const defaultOptions = {
      format: 'A4',
      orientation: 'portrait',
      includeCharts: true,
      includeSummary: true,
      includeDetailedBreakdown: true,
      clientBranding: true,
      fileName: `trainer_report_${reportData.period.startDate}_to_${reportData.period.endDate}.pdf`
    }
    
    const pdfOptions = { ...defaultOptions, ...options }
    
    try {
      const pdfDocument = await this.generatePDFDocument(reportData, pdfOptions)
      
      return {
        success: true,
        format: 'pdf',
        fileName: pdfOptions.fileName,
        data: pdfDocument,
        size: this.calculateDocumentSize(pdfDocument),
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      return {
        success: false,
        error: error.message,
        format: 'pdf'
      }
    }
  }

  /**
   * Export weekly report as CSV
   */
  async exportToCSV(reportData, options = {}) {
    console.log('📊 Generating CSV export...')
    
    const defaultOptions = {
      includeHeaders: true,
      delimiter: ',',
      includeMetrics: true,
      includeDailyBreakdown: true,
      fileName: `trainer_report_${reportData.period.startDate}_to_${reportData.period.endDate}.csv`
    }
    
    const csvOptions = { ...defaultOptions, ...options }
    
    try {
      const csvData = await this.generateCSVData(reportData, csvOptions)
      
      return {
        success: true,
        format: 'csv',
        fileName: csvOptions.fileName,
        data: csvData,
        size: new Blob([csvData]).size,
        generatedAt: new Date().toISOString(),
        rowCount: this.countCSVRows(csvData)
      }
    } catch (error) {
      console.error('Failed to generate CSV:', error)
      return {
        success: false,
        error: error.message,
        format: 'csv'
      }
    }
  }

  /**
   * Export weekly report as JSON
   */
  async exportToJSON(reportData, options = {}) {
    console.log('🔗 Generating JSON export...')
    
    const defaultOptions = {
      includeRawData: true,
      includeChartData: true,
      formatted: true,
      apiCompatible: true,
      fileName: `trainer_report_${reportData.period.startDate}_to_${reportData.period.endDate}.json`
    }
    
    const jsonOptions = { ...defaultOptions, ...options }
    
    try {
      const jsonData = await this.generateJSONData(reportData, jsonOptions)
      const jsonString = jsonOptions.formatted 
        ? JSON.stringify(jsonData, null, 2)
        : JSON.stringify(jsonData)
      
      return {
        success: true,
        format: 'json',
        fileName: jsonOptions.fileName,
        data: jsonString,
        size: new Blob([jsonString]).size,
        generatedAt: new Date().toISOString(),
        structure: this.analyzeJSONStructure(jsonData)
      }
    } catch (error) {
      console.error('Failed to generate JSON:', error)
      return {
        success: false,
        error: error.message,
        format: 'json'
      }
    }
  }

  /**
   * Generate and email report to trainer
   */
  async emailToTrainer(reportData, trainerEmail, options = {}) {
    if (!this.emailConfig) {
      console.warn('⚠️ Email configuration not provided')
      return {
        success: false,
        error: 'Email configuration not provided'
      }
    }

    console.log(`📧 Preparing email report for ${trainerEmail}...`)
    
    const defaultOptions = {
      includeAttachments: true,
      attachmentFormats: ['pdf', 'csv'],
      includeInlineCharts: true,
      emailTemplate: 'trainer_weekly_report',
      priority: 'normal',
      includeNextSteps: true
    }
    
    const emailOptions = { ...defaultOptions, ...options }
    
    try {
      // Generate attachments
      const attachments = []
      
      if (emailOptions.includeAttachments) {
        for (const format of emailOptions.attachmentFormats) {
          let exportResult
          
          switch (format) {
            case 'pdf':
              exportResult = await this.exportToPDF(reportData)
              break
            case 'csv':
              exportResult = await this.exportToCSV(reportData)
              break
            case 'json':
              exportResult = await this.exportToJSON(reportData)
              break
          }
          
          if (exportResult.success) {
            attachments.push({
              filename: exportResult.fileName,
              content: exportResult.data,
              contentType: this.getContentType(format)
            })
          }
        }
      }
      
      // Generate email content
      const emailContent = await this.generateEmailContent(reportData, emailOptions)
      
      // This would integrate with actual email service (SendGrid, AWS SES, etc.)
      const emailResult = await this.sendEmail({
        to: trainerEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments,
        ...this.emailConfig
      })
      
      return {
        success: true,
        emailSent: true,
        recipient: trainerEmail,
        attachmentCount: attachments.length,
        sentAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('Failed to send email:', error)
      return {
        success: false,
        error: error.message,
        emailSent: false
      }
    }
  }

  /**
   * Batch export in multiple formats
   */
  async batchExport(reportData, formats = ['pdf', 'csv', 'json'], options = {}) {
    console.log(`📦 Starting batch export for formats: ${formats.join(', ')}`)
    
    const results = {}
    const errors = []
    
    for (const format of formats) {
      try {
        let result
        
        switch (format) {
          case 'pdf':
            result = await this.exportToPDF(reportData, options.pdf)
            break
          case 'csv':
            result = await this.exportToCSV(reportData, options.csv)
            break
          case 'json':
            result = await this.exportToJSON(reportData, options.json)
            break
          default:
            throw new Error(`Unsupported format: ${format}`)
        }
        
        results[format] = result
        
        if (!result.success) {
          errors.push(`${format}: ${result.error}`)
        }
        
      } catch (error) {
        errors.push(`${format}: ${error.message}`)
        results[format] = {
          success: false,
          error: error.message,
          format
        }
      }
    }
    
    return {
      success: errors.length === 0,
      results,
      errors,
      totalFormats: formats.length,
      successfulFormats: Object.values(results).filter(r => r.success).length,
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * Generate PDF document (placeholder - would integrate with PDF library)
   */
  async generatePDFDocument(reportData, options) {
    // This would integrate with a PDF generation library like jsPDF, Puppeteer, or server-side solution
    console.log('📄 Generating PDF content...')
    
    const pdfContent = {
      header: this.generatePDFHeader(reportData, options),
      summary: this.generatePDFSummary(reportData),
      charts: options.includeCharts ? this.generatePDFCharts(reportData) : null,
      detailed: options.includeDetailedBreakdown ? this.generatePDFDetailedBreakdown(reportData) : null,
      recommendations: this.generatePDFRecommendations(reportData),
      footer: this.generatePDFFooter(reportData)
    }
    
    // For now, return a structured representation of the PDF
    // In a real implementation, this would generate actual PDF binary data
    return JSON.stringify(pdfContent, null, 2)
  }

  /**
   * Generate CSV data
   */
  async generateCSVData(reportData, options) {
    const csvSections = []
    
    // Report metadata
    csvSections.push([
      'Report Information',
      '',
      '',
      ''
    ])
    csvSections.push([
      'Report ID',
      reportData.reportId,
      '',
      ''
    ])
    csvSections.push([
      'Period',
      `${reportData.period.startDate} to ${reportData.period.endDate}`,
      '',
      ''
    ])
    csvSections.push([
      'Client',
      reportData.client.name,
      '',
      ''
    ])
    csvSections.push([
      '',
      '',
      '',
      ''
    ])
    
    // Macro adherence summary
    if (reportData.summary.macroAdherence.available) {
      csvSections.push([
        'Macro Adherence',
        'Target %',
        'Actual %',
        'Status'
      ])
      
      const macros = reportData.summary.macroAdherence.adherence
      for (const [macro, percentage] of Object.entries(macros)) {
        csvSections.push([
          macro.charAt(0).toUpperCase() + macro.slice(1),
          '100%',
          `${percentage.toFixed(1)}%`,
          percentage >= 90 ? 'Excellent' : percentage >= 70 ? 'Good' : 'Needs Improvement'
        ])
      }
      csvSections.push(['', '', '', ''])
    }
    
    // Daily breakdown
    if (options.includeDailyBreakdown && reportData.detailed.dailyBreakdown) {
      csvSections.push([
        'Daily Breakdown',
        'Calories',
        'Protein (g)',
        'Sleep (hrs)',
        'Workouts',
        'Compliance'
      ])
      
      reportData.detailed.dailyBreakdown.forEach(day => {
        csvSections.push([
          day.date,
          day.nutrition?.calories || 0,
          day.nutrition?.protein || 0,
          day.wellness?.sleepHours || 0,
          day.activity?.workouts || 0,
          `${(day.compliance?.overall || 0).toFixed(1)}%`
        ])
      })
      csvSections.push(['', '', '', '', '', ''])
    }
    
    // Weight trends
    if (reportData.summary.weightTrends.available) {
      csvSections.push([
        'Weight Trends',
        'Value',
        'Unit',
        'Change'
      ])
      csvSections.push([
        'Start Weight',
        reportData.summary.weightTrends.startWeight,
        'lbs',
        ''
      ])
      csvSections.push([
        'End Weight',
        reportData.summary.weightTrends.endWeight,
        'lbs',
        `${reportData.summary.weightTrends.weightChange > 0 ? '+' : ''}${reportData.summary.weightTrends.weightChange.toFixed(1)}`
      ])
      csvSections.push(['', '', '', ''])
    }
    
    // Recommendations
    if (reportData.recommendations.length > 0) {
      csvSections.push([
        'Recommendations',
        'Priority',
        'Category',
        'Action'
      ])
      
      reportData.recommendations.forEach(rec => {
        csvSections.push([
          rec.title,
          rec.priority,
          rec.category,
          rec.action
        ])
      })
    }
    
    return csvSections.map(row => row.join(options.delimiter)).join('\n')
  }

  /**
   * Generate JSON data for API integration
   */
  async generateJSONData(reportData, options) {
    const baseData = {
      ...reportData,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: '1.0',
        apiCompatible: options.apiCompatible
      }
    }
    
    if (!options.includeRawData) {
      delete baseData.detailed
    }
    
    if (!options.includeChartData) {
      delete baseData.charts
    }
    
    if (options.apiCompatible) {
      // Transform data for API compatibility
      return {
        report: baseData,
        summary: this.createAPISummary(reportData),
        metrics: this.createAPIMetrics(reportData),
        recommendations: reportData.recommendations
      }
    }
    
    return baseData
  }

  /**
   * Generate email content
   */
  async generateEmailContent(reportData, options) {
    const client = reportData.client
    const period = reportData.period
    const summary = reportData.summary
    
    const subject = `Weekly Progress Report - ${client.name} (${period.startDate} to ${period.endDate})`
    
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .summary { padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 8px; }
            .metric { display: inline-block; margin: 10px; padding: 15px; background: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .recommendations { margin-top: 20px; }
            .rec-item { margin: 10px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; }
            .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Weekly Progress Report</h1>
            <h2>${client.name}</h2>
            <p>${period.startDate} to ${period.endDate}</p>
          </div>
          
          <div class="summary">
            <h3>Key Highlights</h3>
            ${this.generateEmailSummaryHTML(summary)}
          </div>
          
          ${options.includeNextSteps ? `
            <div class="recommendations">
              <h3>Trainer Recommendations</h3>
              ${reportData.recommendations.map(rec => `
                <div class="rec-item">
                  <strong>${rec.title}</strong> (${rec.priority} priority)
                  <p>${rec.description}</p>
                  <em>Action: ${rec.action}</em>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="footer">
            <p>This report was automatically generated by the Fitness Tracker system.</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `
    
    const text = this.generateEmailTextContent(reportData)
    
    return { subject, html, text }
  }

  /**
   * Download file to user's device
   */
  downloadFile(data, fileName, mimeType) {
    const blob = new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log(`📥 Downloaded: ${fileName}`)
  }

  // Helper methods

  calculateDocumentSize(document) {
    return new Blob([document]).size
  }

  countCSVRows(csvData) {
    return csvData.split('\n').length
  }

  getContentType(format) {
    const contentTypes = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      json: 'application/json'
    }
    return contentTypes[format] || 'application/octet-stream'
  }

  analyzeJSONStructure(jsonData) {
    return {
      keys: Object.keys(jsonData),
      hasNested: Object.values(jsonData).some(v => typeof v === 'object' && v !== null),
      estimatedSize: JSON.stringify(jsonData).length
    }
  }

  generatePDFHeader(reportData, options) {
    return {
      title: 'Weekly Progress Report',
      client: reportData.client.name,
      period: `${reportData.period.startDate} to ${reportData.period.endDate}`,
      generatedAt: new Date().toLocaleDateString(),
      branding: options.clientBranding
    }
  }

  generatePDFSummary(reportData) {
    return {
      macroAdherence: reportData.summary.macroAdherence,
      weightChange: reportData.summary.weightTrends.available 
        ? reportData.summary.weightTrends.weightChange 
        : null,
      sleepAverage: reportData.summary.sleepQuality.available 
        ? reportData.summary.sleepQuality.averageHours 
        : null,
      workoutCount: reportData.summary.trainingPerformance.available 
        ? reportData.summary.trainingPerformance.totalWorkouts 
        : 0
    }
  }

  generatePDFCharts(reportData) {
    return reportData.charts
  }

  generatePDFDetailedBreakdown(reportData) {
    return reportData.detailed
  }

  generatePDFRecommendations(reportData) {
    return reportData.recommendations
  }

  generatePDFFooter(reportData) {
    return {
      reportId: reportData.reportId,
      generatedAt: reportData.generatedAt,
      disclaimer: 'This report is generated automatically based on logged data.'
    }
  }

  generateEmailSummaryHTML(summary) {
    let html = ''
    
    if (summary.macroAdherence.available) {
      const adherence = summary.macroAdherence.adherence
      html += `
        <div class="metric">
          <strong>Macro Adherence</strong><br>
          Protein: ${adherence.protein.toFixed(1)}%<br>
          Carbs: ${adherence.carbs.toFixed(1)}%<br>
          Fats: ${adherence.fats.toFixed(1)}%
        </div>
      `
    }
    
    if (summary.weightTrends.available) {
      html += `
        <div class="metric">
          <strong>Weight Change</strong><br>
          ${summary.weightTrends.weightChange > 0 ? '+' : ''}${summary.weightTrends.weightChange.toFixed(1)} lbs
        </div>
      `
    }
    
    if (summary.sleepQuality.available) {
      html += `
        <div class="metric">
          <strong>Sleep Average</strong><br>
          ${summary.sleepQuality.averageHours.toFixed(1)} hours/night
        </div>
      `
    }
    
    return html
  }

  generateEmailTextContent(reportData) {
    return `
Weekly Progress Report - ${reportData.client.name}
Period: ${reportData.period.startDate} to ${reportData.period.endDate}

KEY HIGHLIGHTS:
${reportData.summary.macroAdherence.available ? 
  `Macro Adherence: ${Object.entries(reportData.summary.macroAdherence.adherence)
    .map(([macro, percent]) => `${macro}: ${percent.toFixed(1)}%`).join(', ')}` : 
  'No nutrition data available'}

${reportData.summary.weightTrends.available ? 
  `Weight Change: ${reportData.summary.weightTrends.weightChange > 0 ? '+' : ''}${reportData.summary.weightTrends.weightChange.toFixed(1)} lbs` : 
  'No weight data available'}

RECOMMENDATIONS:
${reportData.recommendations.map(rec => `- ${rec.title}: ${rec.description}`).join('\n')}

This report was automatically generated by the Fitness Tracker system.
    `.trim()
  }

  createAPISummary(reportData) {
    return {
      clientId: reportData.client.id,
      period: reportData.period,
      overallCompliance: this.calculateOverallCompliance(reportData),
      keyMetrics: {
        macroAdherence: reportData.summary.macroAdherence.available ? reportData.summary.macroAdherence.adherence : null,
        weightChange: reportData.summary.weightTrends.available ? reportData.summary.weightTrends.weightChange : null,
        sleepAverage: reportData.summary.sleepQuality.available ? reportData.summary.sleepQuality.averageHours : null,
        workoutCount: reportData.summary.trainingPerformance.available ? reportData.summary.trainingPerformance.totalWorkouts : 0
      }
    }
  }

  createAPIMetrics(reportData) {
    return {
      nutrition: reportData.summary.macroAdherence,
      body: reportData.summary.weightTrends,
      sleep: reportData.summary.sleepQuality,
      activity: reportData.summary.trainingPerformance,
      wellness: reportData.summary.energyStressCorrelation
    }
  }

  calculateOverallCompliance(reportData) {
    const metrics = []
    
    if (reportData.summary.macroAdherence.available) {
      const adherence = reportData.summary.macroAdherence.adherence
      const avgAdherence = Object.values(adherence).reduce((sum, val) => sum + val, 0) / Object.keys(adherence).length
      metrics.push(avgAdherence)
    }
    
    if (reportData.summary.sleepQuality.available) {
      const sleepScore = Math.min(100, (reportData.summary.sleepQuality.averageHours / 8) * 100)
      metrics.push(sleepScore)
    }
    
    return metrics.length > 0 ? metrics.reduce((sum, val) => sum + val, 0) / metrics.length : 0
  }

  // Placeholder for actual email sending (would integrate with email service)
  async sendEmail(emailData) {
    console.log('📧 Sending email to', emailData.to)
    // This would integrate with SendGrid, AWS SES, Mailgun, etc.
    return {
      messageId: `email_${Date.now()}`,
      status: 'sent'
    }
  }
}

// Export singleton instance
export const exportService = new ExportService()
export default exportService