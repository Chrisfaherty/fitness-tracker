/**
 * Analytics Service for Feature Usage and Daily Logging Completion
 * Tracks user interactions, completion rates, and app usage patterns
 */

import { feedbackService } from './feedbackService.js'

export class AnalyticsService {
  constructor() {
    this.sessionStartTime = Date.now()
    this.currentSession = this.initializeSession()
    this.featureUsage = new Map()
    this.completionTracking = new Map()
    this.isTracking = false
  }

  /**
   * Initialize analytics service
   */
  async initialize() {
    console.log('📊 Initializing Analytics Service')
    
    // Ensure feedback service is initialized
    await feedbackService.initialize()
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Start tracking session
    this.startSession()
    
    this.isTracking = true
    console.log('✅ Analytics service initialized')
    return true
  }

  /**
   * Initialize session data
   */
  initializeSession() {
    const sessionId = this.generateSessionId()
    const session = {
      id: sessionId,
      startTime: this.sessionStartTime,
      endTime: null,
      duration: 0,
      pageViews: [],
      features: new Set(),
      interactions: 0,
      barcodeScans: 0,
      manualEntries: 0,
      mealsLogged: 0,
      completedDays: 0
    }
    
    // Store session in sessionStorage
    sessionStorage.setItem('analytics-session', JSON.stringify(session))
    return session
  }

  /**
   * Start tracking session
   */
  startSession() {
    // Track page load
    this.trackPageView(window.location.pathname)
    
    // Track session start
    feedbackService.trackFeatureUsage('session_start', {
      sessionId: this.currentSession.id,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer
    })

    console.log(`📱 Analytics session started: ${this.currentSession.id}`)
  }

  /**
   * Setup event listeners for automatic tracking
   */
  setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackFeatureUsage('page_hidden')
      } else {
        this.trackFeatureUsage('page_visible')
      }
    })

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.endSession()
    })

    // Track clicks on key elements
    document.addEventListener('click', (event) => {
      this.trackInteraction(event)
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      this.trackFormSubmission(event)
    })

    // Track barcode scanner usage
    window.addEventListener('barcode-scanner-opened', () => {
      this.trackFeatureUsage('barcode_scanner_opened')
    })

    window.addEventListener('barcode-scanned-success', (event) => {
      this.trackBarcodeSuccess(event.detail)
    })

    window.addEventListener('barcode-scanned-failed', (event) => {
      this.trackBarcodeFailure(event.detail)
    })

    // Track meal logging
    window.addEventListener('meal-logged', (event) => {
      this.trackMealLogged(event.detail)
    })

    // Track daily completion
    window.addEventListener('daily-logging-completed', (event) => {
      this.trackDailyCompletion(event.detail)
    })
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName, context = {}) {
    if (!this.isTracking) return

    const usage = {
      feature: featureName,
      timestamp: Date.now(),
      sessionId: this.currentSession.id,
      context
    }

    // Update local tracking
    const currentCount = this.featureUsage.get(featureName) || 0
    this.featureUsage.set(featureName, currentCount + 1)
    
    // Add to session features
    this.currentSession.features.add(featureName)
    this.updateSessionStorage()

    // Track in feedback service
    await feedbackService.trackFeatureUsage(featureName, {
      ...context,
      sessionId: this.currentSession.id,
      featureCount: currentCount + 1
    })

    console.log(`📊 Feature tracked: ${featureName}`)
  }

  /**
   * Track page view
   */
  async trackPageView(path) {
    const pageView = {
      path,
      timestamp: Date.now(),
      sessionId: this.currentSession.id,
      referrer: document.referrer,
      title: document.title
    }

    this.currentSession.pageViews.push(pageView)
    this.updateSessionStorage()

    await this.trackFeatureUsage('page_view', {
      path,
      title: document.title
    })
  }

  /**
   * Track user interactions
   */
  trackInteraction(event) {
    this.currentSession.interactions++
    
    // Track specific button clicks
    const target = event.target
    if (target.dataset.analytics) {
      this.trackFeatureUsage(target.dataset.analytics, {
        elementType: target.tagName.toLowerCase(),
        elementId: target.id,
        elementClass: target.className
      })
    }

    // Track navigation
    if (target.closest('nav') || target.closest('[role="navigation"]')) {
      this.trackFeatureUsage('navigation_interaction', {
        targetText: target.textContent?.trim()
      })
    }

    // Track form interactions
    if (target.closest('form')) {
      this.trackFeatureUsage('form_interaction', {
        formId: target.closest('form').id,
        inputType: target.type
      })
    }

    this.updateSessionStorage()
  }

  /**
   * Track form submissions
   */
  trackFormSubmission(event) {
    const form = event.target
    const formId = form.id || 'unknown'
    
    this.trackFeatureUsage('form_submission', {
      formId,
      action: form.action,
      method: form.method
    })
  }

  /**
   * Track barcode scan success
   */
  async trackBarcodeSuccess(scanData) {
    this.currentSession.barcodeScans++
    this.updateSessionStorage()

    await this.trackFeatureUsage('barcode_scan_success', {
      barcode: scanData.barcode,
      product: scanData.product?.name,
      scanTime: scanData.scanTime,
      attempts: scanData.attempts
    })

    // Track scan performance
    if (scanData.scanTime) {
      this.trackPerformanceMetric('barcode_scan_time', scanData.scanTime)
    }
  }

  /**
   * Track barcode scan failure
   */
  async trackBarcodeFailure(scanData) {
    await this.trackFeatureUsage('barcode_scan_failure', {
      barcode: scanData.barcode,
      error: scanData.error,
      attempts: scanData.attempts,
      scanTime: scanData.scanTime
    })
  }

  /**
   * Track manual food entry
   */
  async trackManualEntry(entryData) {
    this.currentSession.manualEntries++
    this.updateSessionStorage()

    await this.trackFeatureUsage('manual_food_entry', {
      foodName: entryData.name,
      method: entryData.method, // search, custom, etc.
      timeToComplete: entryData.duration
    })
  }

  /**
   * Track meal logging
   */
  async trackMealLogged(mealData) {
    this.currentSession.mealsLogged++
    this.updateSessionStorage()

    await this.trackFeatureUsage('meal_logged', {
      mealType: mealData.mealType,
      itemCount: mealData.items?.length || 0,
      totalCalories: mealData.totalCalories,
      method: mealData.method, // barcode, manual, etc.
      duration: mealData.duration
    })

    // Update daily progress
    this.updateDailyProgress()
  }

  /**
   * Track daily logging completion
   */
  async trackDailyCompletion(completionData) {
    this.currentSession.completedDays++
    this.updateSessionStorage()

    const completion = {
      date: completionData.date,
      totalMeals: completionData.totalMeals,
      loggedMeals: completionData.loggedMeals,
      completionRate: (completionData.loggedMeals / completionData.totalMeals) * 100,
      barcodeScansUsed: completionData.barcodeScansUsed || 0,
      manualEntriesUsed: completionData.manualEntriesUsed || 0,
      timeToComplete: completionData.timeToComplete,
      challengesFaced: completionData.challengesFaced || []
    }

    // Store in completion tracking
    this.completionTracking.set(completionData.date, completion)

    // Track with feedback service
    await feedbackService.trackDailyLoggingCompletion(completion)

    await this.trackFeatureUsage('daily_completion', {
      completionRate: completion.completionRate,
      totalMeals: completion.totalMeals,
      methodsUsed: {
        barcode: completion.barcodeScansUsed,
        manual: completion.manualEntriesUsed
      }
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetric(metricName, value, context = {}) {
    this.trackFeatureUsage(`performance_${metricName}`, {
      value,
      ...context
    })
  }

  /**
   * Update daily progress tracking
   */
  updateDailyProgress() {
    const today = new Date().toISOString().split('T')[0]
    const todaysProgress = this.getTodaysProgress()
    
    // Check if daily goal is reached
    const targetMeals = 3 // breakfast, lunch, dinner
    if (todaysProgress.mealsLogged >= targetMeals) {
      this.trackDailyCompletion({
        date: today,
        totalMeals: targetMeals,
        loggedMeals: todaysProgress.mealsLogged,
        barcodeScansUsed: todaysProgress.barcodeScans,
        manualEntriesUsed: todaysProgress.manualEntries,
        timeToComplete: Date.now() - this.sessionStartTime
      })
    }
  }

  /**
   * Get today's progress
   */
  getTodaysProgress() {
    // This would typically integrate with your meal logging system
    // For now, return session-based data
    return {
      mealsLogged: this.currentSession.mealsLogged,
      barcodeScans: this.currentSession.barcodeScans,
      manualEntries: this.currentSession.manualEntries
    }
  }

  /**
   * Get feature usage statistics
   */
  getFeatureUsageStats(timeRange = '7d') {
    const stats = {
      timeRange,
      sessionStats: {
        currentSessionId: this.currentSession.id,
        sessionDuration: Date.now() - this.sessionStartTime,
        featuresUsed: this.currentSession.features.size,
        totalInteractions: this.currentSession.interactions,
        pageViews: this.currentSession.pageViews.length
      },
      featureUsage: Object.fromEntries(this.featureUsage),
      topFeatures: this.getTopFeatures(),
      completionRates: this.getCompletionRates(),
      performanceMetrics: this.getPerformanceMetrics()
    }

    return stats
  }

  /**
   * Get top used features
   */
  getTopFeatures(limit = 10) {
    const features = Array.from(this.featureUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([feature, count]) => ({ feature, count }))

    return features
  }

  /**
   * Get completion rates
   */
  getCompletionRates() {
    const completions = Array.from(this.completionTracking.values())
    
    if (completions.length === 0) {
      return { available: false }
    }

    const totalRate = completions.reduce((sum, c) => sum + c.completionRate, 0)
    const averageRate = totalRate / completions.length
    
    const methodStats = completions.reduce((stats, c) => {
      stats.barcode += c.barcodeScansUsed
      stats.manual += c.manualEntriesUsed
      return stats
    }, { barcode: 0, manual: 0 })

    return {
      available: true,
      averageCompletionRate: averageRate,
      totalDays: completions.length,
      methodUsage: {
        barcodePercentage: (methodStats.barcode / (methodStats.barcode + methodStats.manual)) * 100,
        manualPercentage: (methodStats.manual / (methodStats.barcode + methodStats.manual)) * 100
      },
      recentCompletions: completions.slice(-7) // Last 7 days
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const performanceFeatures = Array.from(this.featureUsage.entries())
      .filter(([feature]) => feature.startsWith('performance_'))
      .map(([feature, count]) => ({
        metric: feature.replace('performance_', ''),
        occurrences: count
      }))

    return performanceFeatures
  }

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(timeRange = '7d') {
    const report = {
      reportGenerated: new Date().toISOString(),
      timeRange,
      sessionInfo: {
        currentSessionId: this.currentSession.id,
        sessionDuration: Date.now() - this.sessionStartTime,
        sessionStartTime: new Date(this.sessionStartTime).toISOString()
      },
      usage: this.getFeatureUsageStats(timeRange),
      feedback: await feedbackService.getFeedbackAnalytics(timeRange),
      recommendations: this.generateRecommendations()
    }

    console.log('📊 Generated analytics report')
    return report
  }

  /**
   * Generate recommendations based on usage patterns
   */
  generateRecommendations() {
    const recommendations = []
    const topFeatures = this.getTopFeatures(5)
    const completionRates = this.getCompletionRates()

    // Barcode scanner usage recommendations
    const barcodeUsage = this.featureUsage.get('barcode_scan_success') || 0
    const manualUsage = this.featureUsage.get('manual_food_entry') || 0
    
    if (manualUsage > barcodeUsage * 2) {
      recommendations.push({
        category: 'feature_adoption',
        priority: 'medium',
        title: 'Promote Barcode Scanner Usage',
        description: 'Users are using manual entry more than barcode scanning. Consider highlighting barcode scanner benefits.',
        data: { barcodeUsage, manualUsage }
      })
    }

    // Completion rate recommendations
    if (completionRates.available && completionRates.averageCompletionRate < 70) {
      recommendations.push({
        category: 'user_engagement',
        priority: 'high',
        title: 'Improve Daily Completion Rates',
        description: `Average completion rate is ${completionRates.averageCompletionRate.toFixed(1)}%. Consider adding reminders or gamification.`,
        data: completionRates
      })
    }

    // Session engagement recommendations
    if (this.currentSession.interactions < 10) {
      recommendations.push({
        category: 'user_engagement',
        priority: 'medium',
        title: 'Increase User Interaction',
        description: 'Low interaction count in current session. Consider improving UI engagement.',
        data: { interactions: this.currentSession.interactions }
      })
    }

    return recommendations
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(format = 'json') {
    const data = {
      exportTimestamp: new Date().toISOString(),
      sessionData: this.currentSession,
      featureUsage: Object.fromEntries(this.featureUsage),
      completionTracking: Object.fromEntries(this.completionTracking),
      analyticsReport: await this.generateAnalyticsReport()
    }

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'csv':
        return this.convertAnalyticsToCSV(data)
      default:
        return data
    }
  }

  /**
   * Convert analytics data to CSV
   */
  convertAnalyticsToCSV(data) {
    const csvLines = []

    // Feature usage CSV
    csvLines.push('Feature Usage Data')
    csvLines.push('Feature,Usage Count,Session ID')
    for (const [feature, count] of Object.entries(data.featureUsage)) {
      csvLines.push(`${feature},${count},${data.sessionData.id}`)
    }
    csvLines.push('')

    // Completion tracking CSV
    csvLines.push('Daily Completion Data')
    csvLines.push('Date,Total Meals,Logged Meals,Completion Rate,Barcode Scans,Manual Entries')
    for (const [date, completion] of Object.entries(data.completionTracking)) {
      csvLines.push([
        date,
        completion.totalMeals,
        completion.loggedMeals,
        completion.completionRate.toFixed(1),
        completion.barcodeScansUsed,
        completion.manualEntriesUsed
      ].join(','))
    }

    return csvLines.join('\n')
  }

  /**
   * End current session
   */
  endSession() {
    this.currentSession.endTime = Date.now()
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime
    
    this.trackFeatureUsage('session_end', {
      sessionDuration: this.currentSession.duration,
      featuresUsed: this.currentSession.features.size,
      interactions: this.currentSession.interactions,
      mealsLogged: this.currentSession.mealsLogged
    })

    this.updateSessionStorage()
    console.log(`📱 Analytics session ended: ${this.currentSession.id}`)
  }

  /**
   * Update session storage
   */
  updateSessionStorage() {
    sessionStorage.setItem('analytics-session', JSON.stringify(this.currentSession))
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
export default analyticsService