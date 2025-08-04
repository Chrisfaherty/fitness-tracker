/**
 * Performance Monitoring Service
 * Comprehensive performance tracking and analytics for the fitness tracker app
 */

export class PerformanceMonitoringService {
  constructor() {
    this.isInitialized = false
    this.metrics = new Map()
    this.observers = new Map()
    this.config = {
      enableCoreWebVitals: true,
      enableUserTiming: true,
      enableResourceTiming: true,
      enableNavigationTiming: true,
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      sampleRate: 1.0, // 100% sampling
      bufferSize: 100,
      reportingInterval: 30000, // 30 seconds
      thresholds: {
        fcp: 1800, // First Contentful Paint (ms)
        lcp: 2500, // Largest Contentful Paint (ms)
        fid: 100,  // First Input Delay (ms)
        cls: 0.1,  // Cumulative Layout Shift
        ttfb: 600, // Time to First Byte (ms)
        memory: 50 // Memory usage (MB)
      }
    }
    this.performanceBuffer = []
    this.alerts = []
    this.sessionMetrics = {
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
      warnings: 0
    }
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(options = {}) {
    console.log('📊 Initializing Performance Monitoring Service')
    
    this.config = { ...this.config, ...options }
    
    // Setup Core Web Vitals monitoring
    if (this.config.enableCoreWebVitals) {
      this.setupCoreWebVitalsMonitoring()
    }
    
    // Setup user timing monitoring
    if (this.config.enableUserTiming) {
      this.setupUserTimingMonitoring()
    }
    
    // Setup resource timing monitoring
    if (this.config.enableResourceTiming) {
      this.setupResourceTimingMonitoring()
    }
    
    // Setup navigation timing monitoring
    if (this.config.enableNavigationTiming) {
      this.setupNavigationTimingMonitoring()
    }
    
    // Setup memory monitoring
    if (this.config.enableMemoryMonitoring) {
      this.setupMemoryMonitoring()
    }
    
    // Setup network monitoring
    if (this.config.enableNetworkMonitoring) {
      this.setupNetworkMonitoring()
    }
    
    // Setup automatic reporting
    this.setupAutomaticReporting()
    
    // Setup error tracking
    this.setupErrorTracking()
    
    // Start session tracking
    this.startSessionTracking()
    
    this.isInitialized = true
    console.log('✅ Performance Monitoring Service initialized')
    
    return true
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  setupCoreWebVitalsMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return
    
    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime, {
            threshold: this.config.thresholds.fcp,
            good: entry.startTime <= 1800,
            category: 'core-web-vitals'
          })
        }
      }
    })
    
    try {
      fcpObserver.observe({ entryTypes: ['paint'] })
      this.observers.set('fcp', fcpObserver)
    } catch (e) {
      console.warn('FCP observer not supported')
    }
    
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.recordMetric('LCP', lastEntry.startTime, {
        threshold: this.config.thresholds.lcp,
        good: lastEntry.startTime <= 2500,
        category: 'core-web-vitals',
        element: lastEntry.element?.tagName
      })
    })
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)
    } catch (e) {
      console.warn('LCP observer not supported')
    }
    
    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('FID', entry.processingStart - entry.startTime, {
          threshold: this.config.thresholds.fid,
          good: (entry.processingStart - entry.startTime) <= 100,
          category: 'core-web-vitals',
          eventType: entry.name
        })
      }
    })
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)
    } catch (e) {
      console.warn('FID observer not supported')
    }
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      
      this.recordMetric('CLS', clsValue, {
        threshold: this.config.thresholds.cls,
        good: clsValue <= 0.1,
        category: 'core-web-vitals'
      })
    })
    
    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    } catch (e) {
      console.warn('CLS observer not supported')
    }
    
    console.log('🎯 Core Web Vitals monitoring active')
  }

  /**
   * Setup user timing monitoring
   */
  setupUserTimingMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return
    
    const userTimingObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          this.recordMetric(`UserTiming_${entry.name}`, entry.duration, {
            category: 'user-timing',
            startTime: entry.startTime,
            detail: entry.detail
          })
        } else if (entry.entryType === 'mark') {
          this.recordMetric(`UserMark_${entry.name}`, entry.startTime, {
            category: 'user-timing',
            detail: entry.detail
          })
        }
      }
    })
    
    try {
      userTimingObserver.observe({ entryTypes: ['measure', 'mark'] })
      this.observers.set('userTiming', userTimingObserver)
    } catch (e) {
      console.warn('User Timing observer not supported')
    }
    
    console.log('⏱️ User timing monitoring active')
  }

  /**
   * Setup resource timing monitoring
   */
  setupResourceTimingMonitoring() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return
    
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceType = entry.initiatorType
        const duration = entry.responseEnd - entry.startTime
        const size = entry.transferSize || 0
        
        this.recordMetric(`Resource_${resourceType}`, duration, {
          category: 'resource-timing',
          url: entry.name,
          size: size,
          cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
          protocol: entry.protocol,
          ttfb: entry.responseStart - entry.requestStart
        })
        
        // Monitor slow resources
        if (duration > 1000) {
          this.recordAlert('slow-resource', {
            url: entry.name,
            duration: duration,
            type: resourceType
          })
        }
      }
    })
    
    try {
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)
    } catch (e) {
      console.warn('Resource Timing observer not supported')
    }
    
    console.log('📦 Resource timing monitoring active')
  }

  /**
   * Setup navigation timing monitoring
   */
  setupNavigationTimingMonitoring() {
    if (typeof window === 'undefined' || !performance.timing) return
    
    // Wait for page load to complete
    window.addEventListener('load', () => {
      const timing = performance.timing
      const navigation = performance.navigation
      
      // Calculate key metrics
      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.navigationStart,
        download: timing.responseEnd - timing.responseStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      }
      
      // Record all navigation metrics
      Object.entries(metrics).forEach(([name, value]) => {
        this.recordMetric(`Navigation_${name}`, value, {
          category: 'navigation-timing',
          navigationType: navigation.type,
          redirectCount: navigation.redirectCount
        })
      })
      
      // Check TTFB threshold
      if (metrics.ttfb > this.config.thresholds.ttfb) {
        this.recordAlert('slow-ttfb', {
          ttfb: metrics.ttfb,
          threshold: this.config.thresholds.ttfb
        })
      }
    })
    
    console.log('🧭 Navigation timing monitoring active')
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if (typeof window === 'undefined' || !('memory' in performance)) return
    
    const monitorMemory = () => {
      const memory = performance.memory
      const used = Math.round(memory.usedJSHeapSize / 1048576) // MB
      const total = Math.round(memory.totalJSHeapSize / 1048576) // MB
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      
      this.recordMetric('Memory_Used', used, {
        category: 'memory',
        total: total,
        limit: limit,
        percentage: (used / limit) * 100
      })
      
      // Check memory threshold
      if (used > this.config.thresholds.memory) {
        this.recordAlert('high-memory-usage', {
          used: used,
          limit: limit,
          percentage: (used / limit) * 100
        })
      }
    }
    
    // Monitor every 10 seconds
    setInterval(monitorMemory, 10000)
    monitorMemory() // Initial measurement
    
    console.log('🧠 Memory monitoring active')
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    if (typeof window === 'undefined' || !('connection' in navigator)) return
    
    const connection = navigator.connection
    
    const recordConnectionInfo = () => {
      this.recordMetric('Network_Connection', 0, {
        category: 'network',
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      })
    }
    
    // Record initial connection info
    recordConnectionInfo()
    
    // Monitor connection changes
    connection.addEventListener('change', recordConnectionInfo)
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.recordMetric('Network_Status', 1, {
        category: 'network',
        status: 'online'
      })
    })
    
    window.addEventListener('offline', () => {
      this.recordMetric('Network_Status', 0, {
        category: 'network',
        status: 'offline'
      })
      
      this.recordAlert('network-offline', {
        timestamp: Date.now()
      })
    })
    
    console.log('📡 Network monitoring active')
  }

  /**
   * Setup error tracking
   */
  setupErrorTracking() {
    if (typeof window === 'undefined') return
    
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError('javascript-error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('unhandled-rejection', {
        reason: event.reason,
        promise: event.promise
      })
    })
    
    console.log('🚨 Error tracking active')
  }

  /**
   * Start session tracking
   */
  startSessionTracking() {
    this.sessionMetrics.startTime = Date.now()
    this.sessionMetrics.pageViews = 1
    
    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.sessionMetrics.pageViews++
        }
      })
    }
    
    console.log('📈 Session tracking started')
  }

  /**
   * Setup automatic reporting
   */
  setupAutomaticReporting() {
    setInterval(() => {
      this.generatePerformanceReport()
    }, this.config.reportingInterval)
    
    // Report on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.generatePerformanceReport(true)
      })
    }
    
    console.log('📋 Automatic reporting configured')
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    }
    
    // Store in metrics map
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name).push(metric)
    
    // Add to performance buffer
    this.performanceBuffer.push(metric)
    
    // Maintain buffer size
    if (this.performanceBuffer.length > this.config.bufferSize) {
      this.performanceBuffer.shift()
    }
    
    // Emit event for real-time monitoring
    this.emitPerformanceEvent('metric-recorded', metric)
  }

  /**
   * Record a performance alert
   */
  recordAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type)
    }
    
    this.alerts.push(alert)
    
    // Maintain alerts buffer
    if (this.alerts.length > 50) {
      this.alerts.shift()
    }
    
    console.warn(`⚠️ Performance Alert [${type}]:`, data)
    this.emitPerformanceEvent('alert-triggered', alert)
  }

  /**
   * Record an error
   */
  recordError(type, data) {
    this.sessionMetrics.errors++
    
    const error = {
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    }
    
    this.recordMetric(`Error_${type}`, 1, error)
    this.recordAlert('error-occurred', error)
  }

  /**
   * Custom performance timing
   */
  startTiming(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`)
    }
    return Date.now()
  }

  endTiming(name, startTime) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }
    
    this.recordMetric(`CustomTiming_${name}`, duration, {
      category: 'custom-timing'
    })
    
    return duration
  }

  /**
   * Track user interaction
   */
  trackInteraction(type, target, metadata = {}) {
    this.sessionMetrics.interactions++
    
    this.recordMetric(`Interaction_${type}`, 1, {
      category: 'user-interaction',
      target: target,
      ...metadata
    })
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(isFinal = false) {
    const report = {
      timestamp: new Date().toISOString(),
      sessionMetrics: { ...this.sessionMetrics },
      coreWebVitals: this.getCoreWebVitals(),
      resourcePerformance: this.getResourcePerformance(),
      navigationMetrics: this.getNavigationMetrics(),
      memoryUsage: this.getMemoryUsage(),
      networkInfo: this.getNetworkInfo(),
      customMetrics: this.getCustomMetrics(),
      alerts: this.alerts.slice(-10), // Last 10 alerts
      recommendations: this.generateRecommendations(),
      isFinal
    }
    
    // Log summary
    console.log('📊 Performance Report Generated:', {
      coreWebVitals: report.coreWebVitals,
      sessionDuration: Date.now() - this.sessionMetrics.startTime,
      alertCount: this.alerts.length
    })
    
    this.emitPerformanceEvent('report-generated', report)
    
    return report
  }

  /**
   * Get Core Web Vitals summary
   */
  getCoreWebVitals() {
    const vitals = {}
    
    const fcpMetrics = this.metrics.get('FCP') || []
    const lcpMetrics = this.metrics.get('LCP') || []
    const fidMetrics = this.metrics.get('FID') || []
    const clsMetrics = this.metrics.get('CLS') || []
    
    if (fcpMetrics.length > 0) {
      vitals.fcp = {
        value: fcpMetrics[fcpMetrics.length - 1].value,
        good: fcpMetrics[fcpMetrics.length - 1].metadata.good
      }
    }
    
    if (lcpMetrics.length > 0) {
      vitals.lcp = {
        value: lcpMetrics[lcpMetrics.length - 1].value,
        good: lcpMetrics[lcpMetrics.length - 1].metadata.good
      }
    }
    
    if (fidMetrics.length > 0) {
      vitals.fid = {
        value: fidMetrics[fidMetrics.length - 1].value,
        good: fidMetrics[fidMetrics.length - 1].metadata.good
      }
    }
    
    if (clsMetrics.length > 0) {
      vitals.cls = {
        value: clsMetrics[clsMetrics.length - 1].value,
        good: clsMetrics[clsMetrics.length - 1].metadata.good
      }
    }
    
    return vitals
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = []
    const vitals = this.getCoreWebVitals()
    
    // FCP recommendations
    if (vitals.fcp && !vitals.fcp.good) {
      recommendations.push({
        metric: 'FCP',
        issue: 'Slow First Contentful Paint',
        suggestion: 'Optimize critical rendering path, minimize render-blocking resources',
        priority: 'high'
      })
    }
    
    // LCP recommendations
    if (vitals.lcp && !vitals.lcp.good) {
      recommendations.push({
        metric: 'LCP',
        issue: 'Slow Largest Contentful Paint',
        suggestion: 'Optimize largest element loading, improve server response times',
        priority: 'high'
      })
    }
    
    // Memory recommendations
    const memoryAlerts = this.alerts.filter(alert => alert.type === 'high-memory-usage')
    if (memoryAlerts.length > 3) {
      recommendations.push({
        metric: 'Memory',
        issue: 'High memory usage detected',
        suggestion: 'Review memory leaks, optimize data structures, implement object pooling',
        priority: 'medium'
      })
    }
    
    return recommendations
  }

  /**
   * Utility methods
   */
  getResourcePerformance() {
    const resources = Array.from(this.metrics.entries())
      .filter(([name]) => name.startsWith('Resource_'))
      .map(([name, metrics]) => ({
        type: name.replace('Resource_', ''),
        count: metrics.length,
        averageDuration: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
        totalSize: metrics.reduce((sum, m) => sum + (m.metadata.size || 0), 0)
      }))
    
    return resources
  }

  getNavigationMetrics() {
    const navigation = {}
    
    Array.from(this.metrics.entries())
      .filter(([name]) => name.startsWith('Navigation_'))
      .forEach(([name, metrics]) => {
        const key = name.replace('Navigation_', '')
        navigation[key] = metrics.length > 0 ? metrics[0].value : null
      })
    
    return navigation
  }

  getMemoryUsage() {
    const memoryMetrics = this.metrics.get('Memory_Used') || []
    return memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1] : null
  }

  getNetworkInfo() {
    const networkMetrics = this.metrics.get('Network_Connection') || []
    return networkMetrics.length > 0 ? networkMetrics[networkMetrics.length - 1].metadata : null
  }

  getCustomMetrics() {
    const custom = {}
    
    Array.from(this.metrics.entries())
      .filter(([name]) => name.startsWith('CustomTiming_'))
      .forEach(([name, metrics]) => {
        const key = name.replace('CustomTiming_', '')
        custom[key] = {
          count: metrics.length,
          average: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
          min: Math.min(...metrics.map(m => m.value)),
          max: Math.max(...metrics.map(m => m.value))
        }
      })
    
    return custom
  }

  getAlertSeverity(type) {
    const severityMap = {
      'slow-resource': 'medium',
      'slow-ttfb': 'high',
      'high-memory-usage': 'medium',
      'network-offline': 'high',
      'error-occurred': 'high'
    }
    
    return severityMap[type] || 'low'
  }

  getSessionId() {
    if (!this._sessionId) {
      this._sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    return this._sessionId
  }

  emitPerformanceEvent(eventType, data) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`performance-${eventType}`, {
        detail: data
      }))
    }
  }

  // API methods
  getMetrics(metricName = null) {
    if (metricName) {
      return this.metrics.get(metricName) || []
    }
    return Object.fromEntries(this.metrics)
  }

  getAlerts(limit = 10) {
    return this.alerts.slice(-limit)
  }

  getSessionMetrics() {
    return {
      ...this.sessionMetrics,
      duration: Date.now() - this.sessionMetrics.startTime
    }
  }

  clearMetrics() {
    this.metrics.clear()
    this.performanceBuffer = []
    console.log('🧹 Performance metrics cleared')
  }

  stop() {
    // Disconnect all observers
    this.observers.forEach((observer, name) => {
      try {
        observer.disconnect()
      } catch (e) {
        console.warn(`Failed to disconnect ${name} observer:`, e)
      }
    })
    
    this.observers.clear()
    this.isInitialized = false
    
    console.log('🛑 Performance Monitoring Service stopped')
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService()
export default performanceMonitoringService