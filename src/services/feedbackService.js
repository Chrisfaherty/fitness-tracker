/**
 * User Feedback Collection Service
 * Handles feedback submission, error reporting, and analytics data collection
 */

export class FeedbackService {
  constructor() {
    this.feedbackStorage = new FeedbackStorage()
    this.analytics = new FeedbackAnalytics()
    this.apiMonitor = new APIMonitor()
    this.isInitialized = false
  }

  /**
   * Initialize feedback service
   */
  async initialize() {
    console.log('📝 Initializing Feedback Service')
    
    try {
      await this.feedbackStorage.initialize()
      await this.analytics.initialize()
      this.apiMonitor.initialize()
      
      this.isInitialized = true
      console.log('✅ Feedback service initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize feedback service:', error)
      return false
    }
  }

  /**
   * Submit barcode scan feedback
   */
  async submitScanFeedback(feedbackData) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const feedback = {
      type: 'barcode_scan_feedback',
      id: feedbackData.submissionId,
      timestamp: feedbackData.timestamp,
      data: {
        rating: feedbackData.rating,
        issue: feedbackData.issue,
        description: feedbackData.description,
        expectedProduct: feedbackData.expectedProduct,
        packageCondition: feedbackData.packageCondition,
        lightingCondition: feedbackData.lightingCondition,
        scanImageData: feedbackData.scanImageData,
        userSuggestion: feedbackData.userSuggestion,
        wouldRetry: feedbackData.wouldRetry
      },
      scanAttempt: feedbackData.scanAttempt,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: {
          width: screen.width,
          height: screen.height,
          density: window.devicePixelRatio
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      environment: {
        online: navigator.onLine,
        connection: this.getConnectionInfo(),
        timestamp: Date.now()
      }
    }

    try {
      // Store feedback locally
      await this.feedbackStorage.storeFeedback(feedback)
      
      // Track analytics
      this.analytics.trackFeedbackSubmission(feedback)
      
      // Attempt to sync to server
      await this.syncFeedbackToServer(feedback)
      
      console.log('✅ Barcode scan feedback submitted successfully')
      return { success: true, feedbackId: feedback.id }
      
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error)
      
      // Store error for later analysis
      await this.reportError('feedback_submission_failed', {
        feedbackId: feedback.id,
        error: error.message,
        stack: error.stack
      })
      
      throw error
    }
  }

  /**
   * Report system errors
   */
  async reportError(errorType, errorData) {
    const errorReport = {
      type: 'error_report',
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      errorType,
      data: errorData,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        userId: this.getUserId()
      }
    }

    try {
      // Store error locally
      await this.feedbackStorage.storeError(errorReport)
      
      // Track error analytics
      this.analytics.trackError(errorReport)
      
      // Attempt to sync error to server
      await this.syncErrorToServer(errorReport)
      
      console.log('✅ Error reported successfully:', errorType)
      return { success: true, errorId: errorReport.id }
      
    } catch (syncError) {
      console.error('❌ Failed to sync error report:', syncError)
      // Error reporting failed, but we've stored locally
      return { success: true, errorId: errorReport.id, syncFailed: true }
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName, context = {}) {
    const usageEvent = {
      type: 'feature_usage',
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      feature: featureName,
      context,
      sessionInfo: {
        sessionId: this.getSessionId(),
        userId: this.getUserId(),
        sessionDuration: this.getSessionDuration()
      }
    }

    try {
      // Store usage data locally
      await this.feedbackStorage.storeUsageEvent(usageEvent)
      
      // Track in analytics
      this.analytics.trackFeatureUsage(usageEvent)
      
      // Batch sync usage events periodically
      this.scheduleUsageSync()
      
      return { success: true, eventId: usageEvent.id }
      
    } catch (error) {
      console.error('❌ Failed to track feature usage:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Track daily logging completion
   */
  async trackDailyLoggingCompletion(completionData) {
    const completionEvent = {
      type: 'daily_logging_completion',
      id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      date: completionData.date,
      data: {
        totalMeals: completionData.totalMeals,
        loggedMeals: completionData.loggedMeals,
        completionRate: completionData.completionRate,
        barcodeScansUsed: completionData.barcodeScansUsed,
        manualEntriesUsed: completionData.manualEntriesUsed,
        timeToComplete: completionData.timeToComplete,
        challengesFaced: completionData.challengesFaced
      },
      userId: this.getUserId()
    }

    try {
      // Store completion data locally
      await this.feedbackStorage.storeCompletionEvent(completionEvent)
      
      // Track in analytics
      this.analytics.trackDailyCompletion(completionEvent)
      
      console.log('✅ Daily logging completion tracked')
      return { success: true, eventId: completionEvent.id }
      
    } catch (error) {
      console.error('❌ Failed to track daily completion:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Monitor API response times and failures
   */
  monitorAPICall(apiEndpoint, method = 'GET') {
    const startTime = performance.now()
    
    return {
      recordResponse: (success, responseData = {}) => {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        const apiEvent = {
          type: 'api_monitoring',
          id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          endpoint: apiEndpoint,
          method,
          responseTime,
          success,
          data: responseData
        }

        this.apiMonitor.recordAPICall(apiEvent)
        
        // Track significant delays or failures
        if (!success || responseTime > 5000) {
          this.analytics.trackAPIIssue(apiEvent)
        }
        
        return apiEvent.id
      }
    }
  }

  /**
   * Get aggregated feedback analytics
   */
  async getFeedbackAnalytics(timeRange = '7d') {
    try {
      const analytics = await this.analytics.generateAnalytics(timeRange)
      return {
        success: true,
        analytics
      }
    } catch (error) {
      console.error('❌ Failed to get feedback analytics:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Export feedback data
   */
  async exportFeedbackData(format = 'json', timeRange = '30d') {
    try {
      const data = await this.feedbackStorage.exportData(timeRange)
      
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2)
        case 'csv':
          return this.convertToCSV(data)
        default:
          return data
      }
    } catch (error) {
      console.error('❌ Failed to export feedback data:', error)
      throw error
    }
  }

  /**
   * Sync feedback to server
   */
  async syncFeedbackToServer(feedback) {
    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Feedback synced to server successfully')
      return result
      
    } catch (error) {
      console.warn('⚠️ Failed to sync feedback to server, stored locally:', error.message)
      // Don't throw - we want to continue even if server sync fails
      return { success: false, error: error.message, storedLocally: true }
    }
  }

  /**
   * Sync error to server
   */
  async syncErrorToServer(errorReport) {
    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      console.log('✅ Error report synced to server successfully')
      return await response.json()
      
    } catch (error) {
      console.warn('⚠️ Failed to sync error to server, stored locally:', error.message)
      throw error
    }
  }

  /**
   * Schedule usage data sync
   */
  scheduleUsageSync() {
    if (this.usageSyncTimeout) {
      return // Already scheduled
    }

    this.usageSyncTimeout = setTimeout(async () => {
      try {
        await this.syncPendingUsageData()
      } catch (error) {
        console.error('❌ Failed to sync usage data:', error)
      } finally {
        this.usageSyncTimeout = null
      }
    }, 60000) // Sync every minute
  }

  /**
   * Sync pending usage data to server
   */
  async syncPendingUsageData() {
    const pendingEvents = await this.feedbackStorage.getPendingUsageEvents()
    
    if (pendingEvents.length === 0) {
      return
    }

    try {
      const response = await fetch('/api/analytics/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: pendingEvents })
      })

      if (response.ok) {
        await this.feedbackStorage.markUsageEventsSynced(pendingEvents.map(e => e.id))
        console.log(`✅ Synced ${pendingEvents.length} usage events to server`)
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync usage events:', error.message)
    }
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('fitness-tracker-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('fitness-tracker-session-id', sessionId)
      sessionStorage.setItem('fitness-tracker-session-start', Date.now().toString())
    }
    return sessionId
  }

  /**
   * Get user ID (if available)
   */
  getUserId() {
    return localStorage.getItem('fitness-tracker-user-id') || 'anonymous'
  }

  /**
   * Get session duration
   */
  getSessionDuration() {
    const sessionStart = parseInt(sessionStorage.getItem('fitness-tracker-session-start') || '0')
    return sessionStart ? Date.now() - sessionStart : 0
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    const csvLines = []
    
    // Headers for feedback data
    csvLines.push([
      'Type', 'Timestamp', 'Rating', 'Issue', 'Description',
      'Device', 'Browser', 'Success', 'Response Time'
    ].join(','))
    
    // Process different data types
    data.forEach(item => {
      if (item.type === 'barcode_scan_feedback') {
        csvLines.push([
          item.type,
          item.timestamp,
          item.data.rating || '',
          item.data.issue || '',
          `"${(item.data.description || '').replace(/"/g, '""')}"`,
          item.deviceInfo?.platform || '',
          this.getBrowserFromUserAgent(item.deviceInfo?.userAgent),
          item.scanAttempt?.success || '',
          item.scanAttempt?.scanDuration || ''
        ].join(','))
      }
    })
    
    return csvLines.join('\n')
  }

  /**
   * Get browser name from user agent
   */
  getBrowserFromUserAgent(userAgent) {
    if (!userAgent) return 'Unknown'
    
    const ua = userAgent.toLowerCase()
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('chrome')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('edge')) return 'Edge'
    return 'Unknown'
  }
}

/**
 * Feedback Storage System
 */
class FeedbackStorage {
  constructor() {
    this.dbName = 'FeedbackStorage'
    this.dbVersion = 1
    this.db = null
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(new Error('Failed to open feedback database'))
      
      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Feedback store
        if (!db.objectStoreNames.contains('feedback')) {
          const feedbackStore = db.createObjectStore('feedback', { keyPath: 'id' })
          feedbackStore.createIndex('type', 'type')
          feedbackStore.createIndex('timestamp', 'timestamp')
        }
        
        // Error reports store
        if (!db.objectStoreNames.contains('errors')) {
          const errorStore = db.createObjectStore('errors', { keyPath: 'id' })
          errorStore.createIndex('errorType', 'errorType')
          errorStore.createIndex('timestamp', 'timestamp')
        }
        
        // Usage events store
        if (!db.objectStoreNames.contains('usage')) {
          const usageStore = db.createObjectStore('usage', { keyPath: 'id' })
          usageStore.createIndex('feature', 'feature')
          usageStore.createIndex('timestamp', 'timestamp')
          usageStore.createIndex('synced', 'synced')
        }
        
        // Completion events store
        if (!db.objectStoreNames.contains('completions')) {
          const completionStore = db.createObjectStore('completions', { keyPath: 'id' })
          completionStore.createIndex('date', 'date')
          completionStore.createIndex('userId', 'userId')
        }
      }
    })
  }

  async storeFeedback(feedback) {
    const transaction = this.db.transaction(['feedback'], 'readwrite')
    const store = transaction.objectStore('feedback')
    await store.put(feedback)
  }

  async storeError(errorReport) {
    const transaction = this.db.transaction(['errors'], 'readwrite')
    const store = transaction.objectStore('errors')
    await store.put(errorReport)
  }

  async storeUsageEvent(usageEvent) {
    const eventWithSync = { ...usageEvent, synced: false }
    const transaction = this.db.transaction(['usage'], 'readwrite')
    const store = transaction.objectStore('usage')
    await store.put(eventWithSync)
  }

  async storeCompletionEvent(completionEvent) {
    const transaction = this.db.transaction(['completions'], 'readwrite')
    const store = transaction.objectStore('completions')
    await store.put(completionEvent)
  }

  async getPendingUsageEvents() {
    const transaction = this.db.transaction(['usage'], 'readonly')
    const store = transaction.objectStore('usage')
    const index = store.index('synced')
    return await index.getAll(false) // Get unsynced events
  }

  async markUsageEventsSynced(eventIds) {
    const transaction = this.db.transaction(['usage'], 'readwrite')
    const store = transaction.objectStore('usage')
    
    for (const id of eventIds) {
      const event = await store.get(id)
      if (event) {
        event.synced = true
        await store.put(event)
      }
    }
  }

  async exportData(timeRange) {
    const cutoffDate = this.getTimeRangeCutoff(timeRange)
    const data = {
      feedback: [],
      errors: [],
      usage: [],
      completions: []
    }

    // Export feedback
    const feedbackTransaction = this.db.transaction(['feedback'], 'readonly')
    const feedbackStore = feedbackTransaction.objectStore('feedback')
    const feedbackData = await feedbackStore.getAll()
    data.feedback = feedbackData.filter(item => new Date(item.timestamp) >= cutoffDate)

    // Export errors
    const errorTransaction = this.db.transaction(['errors'], 'readonly')
    const errorStore = errorTransaction.objectStore('errors')
    const errorData = await errorStore.getAll()
    data.errors = errorData.filter(item => new Date(item.timestamp) >= cutoffDate)

    // Export usage
    const usageTransaction = this.db.transaction(['usage'], 'readonly')
    const usageStore = usageTransaction.objectStore('usage')
    const usageData = await usageStore.getAll()
    data.usage = usageData.filter(item => new Date(item.timestamp) >= cutoffDate)

    // Export completions
    const completionTransaction = this.db.transaction(['completions'], 'readonly')
    const completionStore = completionTransaction.objectStore('completions')
    const completionData = await completionStore.getAll()
    data.completions = completionData.filter(item => new Date(item.timestamp) >= cutoffDate)

    return data
  }

  getTimeRangeCutoff(timeRange) {
    const now = new Date()
    const days = parseInt(timeRange.replace('d', ''))
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
  }
}

/**
 * Feedback Analytics System
 */
class FeedbackAnalytics {
  constructor() {
    this.metrics = new Map()
  }

  async initialize() {
    console.log('📊 Initializing Feedback Analytics')
  }

  trackFeedbackSubmission(feedback) {
    this.updateMetric('feedback_submissions_total', 1)
    this.updateMetric(`feedback_submissions_${feedback.data.issue}`, 1)
    this.updateMetric(`feedback_rating_${feedback.data.rating}`, 1)
  }

  trackError(errorReport) {
    this.updateMetric('errors_total', 1)
    this.updateMetric(`errors_${errorReport.errorType}`, 1)
  }

  trackFeatureUsage(usageEvent) {
    this.updateMetric('feature_usage_total', 1)
    this.updateMetric(`feature_usage_${usageEvent.feature}`, 1)
  }

  trackDailyCompletion(completionEvent) {
    this.updateMetric('daily_completions_total', 1)
    this.updateMetric('completion_rate_sum', completionEvent.data.completionRate)
  }

  trackAPIIssue(apiEvent) {
    this.updateMetric('api_issues_total', 1)
    this.updateMetric(`api_issues_${apiEvent.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, 1)
  }

  updateMetric(key, value) {
    const current = this.metrics.get(key) || 0
    this.metrics.set(key, current + value)
  }

  async generateAnalytics(timeRange) {
    return {
      timeRange,
      generatedAt: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      summary: this.generateSummary()
    }
  }

  generateSummary() {
    const totalFeedback = this.metrics.get('feedback_submissions_total') || 0
    const totalErrors = this.metrics.get('errors_total') || 0
    const totalUsage = this.metrics.get('feature_usage_total') || 0
    
    return {
      totalFeedbackSubmissions: totalFeedback,
      totalErrorsReported: totalErrors,
      totalFeatureUsage: totalUsage,
      topIssues: this.getTopIssues(),
      averageRating: this.getAverageRating()
    }
  }

  getTopIssues() {
    const issues = []
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith('feedback_submissions_') && key !== 'feedback_submissions_total') {
        const issue = key.replace('feedback_submissions_', '')
        issues.push({ issue, count: value })
      }
    }
    return issues.sort((a, b) => b.count - a.count).slice(0, 5)
  }

  getAverageRating() {
    let totalRating = 0
    let ratingCount = 0
    
    for (let rating = 1; rating <= 5; rating++) {
      const count = this.metrics.get(`feedback_rating_${rating}`) || 0
      totalRating += rating * count
      ratingCount += count
    }
    
    return ratingCount > 0 ? totalRating / ratingCount : 0
  }
}

/**
 * API Monitoring System
 */
class APIMonitor {
  constructor() {
    this.apiCalls = []
    this.responseTimeThreshold = 5000 // 5 seconds
    this.errorRateThreshold = 0.1 // 10%
  }

  initialize() {
    console.log('🌐 Initializing API Monitor')
    
    // Monitor fetch requests globally
    this.interceptFetch()
  }

  recordAPICall(apiEvent) {
    this.apiCalls.push(apiEvent)
    
    // Keep only recent calls (last 1000)
    if (this.apiCalls.length > 1000) {
      this.apiCalls = this.apiCalls.slice(-1000)
    }
    
    // Check for performance issues
    this.checkAPIHealth(apiEvent)
  }

  checkAPIHealth(apiEvent) {
    // Check response time
    if (apiEvent.responseTime > this.responseTimeThreshold) {
      console.warn(`🚨 Slow API response: ${apiEvent.endpoint} took ${apiEvent.responseTime}ms`)
    }
    
    // Check error rate for this endpoint
    const recentCalls = this.apiCalls
      .filter(call => call.endpoint === apiEvent.endpoint)
      .slice(-10) // Last 10 calls
    
    const errorRate = recentCalls.filter(call => !call.success).length / recentCalls.length
    
    if (errorRate > this.errorRateThreshold) {
      console.warn(`🚨 High error rate for ${apiEvent.endpoint}: ${(errorRate * 100).toFixed(1)}%`)
    }
  }

  interceptFetch() {
    const originalFetch = window.fetch
    
    window.fetch = async (url, options = {}) => {
      const startTime = performance.now()
      const method = options.method || 'GET'
      
      try {
        const response = await originalFetch(url, options)
        const endTime = performance.now()
        
        this.recordAPICall({
          type: 'api_monitoring',
          id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          endpoint: url.toString(),
          method,
          responseTime: endTime - startTime,
          success: response.ok,
          statusCode: response.status,
          data: {
            status: response.status,
            statusText: response.statusText
          }
        })
        
        return response
      } catch (error) {
        const endTime = performance.now()
        
        this.recordAPICall({
          type: 'api_monitoring',
          id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          endpoint: url.toString(),
          method,
          responseTime: endTime - startTime,
          success: false,
          data: {
            error: error.message
          }
        })
        
        throw error
      }
    }
  }

  getAPIMetrics() {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    const recentCalls = this.apiCalls.filter(call => 
      new Date(call.timestamp).getTime() > oneHourAgo
    )
    
    const totalCalls = recentCalls.length
    const successfulCalls = recentCalls.filter(call => call.success).length
    const failedCalls = totalCalls - successfulCalls
    
    const averageResponseTime = totalCalls > 0 ? 
      recentCalls.reduce((sum, call) => sum + call.responseTime, 0) / totalCalls : 0
    
    return {
      timeWindow: '1 hour',
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      averageResponseTime,
      slowCalls: recentCalls.filter(call => call.responseTime > this.responseTimeThreshold).length
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService()
export default feedbackService