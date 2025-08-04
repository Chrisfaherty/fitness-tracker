/**
 * Testing Data Collection System
 * Collects, stores, and analyzes comprehensive test results
 */

export class TestDataCollectionSystem {
  constructor() {
    this.testSession = null
    this.collectors = new Map()
    this.storage = new TestDataStorage()
    this.analytics = new TestAnalytics()
    this.isCollecting = false
  }

  /**
   * Initialize data collection system
   */
  async initialize() {
    console.log('📊 Initializing Test Data Collection System')
    
    await this.storage.initialize()
    this.setupCollectors()
    this.setupEventListeners()
    
    console.log('✅ Data collection system ready')
    return true
  }

  /**
   * Start new test session
   */
  startTestSession(sessionConfig) {
    this.testSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      endTime: null,
      config: sessionConfig,
      environment: this.captureEnvironment(),
      results: [],
      metrics: [],
      events: []
    }
    
    this.isCollecting = true
    console.log(`📋 Started test session: ${this.testSession.id}`)
    
    return this.testSession.id
  }

  /**
   * End current test session
   */
  async endTestSession() {
    if (!this.testSession) {
      console.warn('No active test session to end')
      return null
    }
    
    this.testSession.endTime = Date.now()
    this.testSession.duration = this.testSession.endTime - this.testSession.startTime
    this.isCollecting = false
    
    // Generate final analytics
    const analytics = await this.analytics.generateSessionAnalytics(this.testSession)
    this.testSession.analytics = analytics
    
    // Store session data
    await this.storage.storeTestSession(this.testSession)
    
    console.log(`📋 Ended test session: ${this.testSession.id}`)
    return this.testSession
  }

  /**
   * Collect test result data
   */
  collectTestResult(testType, testData) {
    if (!this.isCollecting || !this.testSession) {
      console.warn('No active test session for data collection')
      return
    }
    
    const result = {
      id: this.generateResultId(),
      timestamp: Date.now(),
      relativeTime: Date.now() - this.testSession.startTime,
      testType,
      data: testData,
      environment: this.captureCurrentEnvironment()
    }
    
    this.testSession.results.push(result)
    
    // Real-time analysis
    this.analyzeResult(result)
    
    // Store individual result
    this.storage.storeTestResult(this.testSession.id, result)
    
    console.log(`📝 Collected ${testType} test result`)
  }

  /**
   * Collect performance metric
   */
  collectMetric(metricType, value, context = {}) {
    if (!this.isCollecting || !this.testSession) return
    
    const metric = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      relativeTime: Date.now() - this.testSession.startTime,
      type: metricType,
      value,
      context,
      environment: this.captureCurrentEnvironment()
    }
    
    this.testSession.metrics.push(metric)
    
    // Check for performance alerts
    this.checkPerformanceThresholds(metric)
    
    console.log(`📈 Collected ${metricType} metric: ${value}`)
  }

  /**
   * Collect event data
   */
  collectEvent(eventType, eventData) {
    if (!this.isCollecting || !this.testSession) return
    
    const event = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      relativeTime: Date.now() - this.testSession.startTime,
      type: eventType,
      data: eventData,
      environment: this.captureCurrentEnvironment()
    }
    
    this.testSession.events.push(event)
    
    console.log(`🎯 Collected ${eventType} event`)
  }

  /**
   * Setup data collectors for different test types
   */
  setupCollectors() {
    // Barcode scan result collector
    this.collectors.set('barcode_scan', new BarcodeScanCollector())
    
    // Performance metric collector
    this.collectors.set('performance', new PerformanceMetricCollector())
    
    // User interaction collector
    this.collectors.set('user_interaction', new UserInteractionCollector())
    
    // Error event collector
    this.collectors.set('error', new ErrorEventCollector())
    
    // Environment condition collector
    this.collectors.set('environment', new EnvironmentCollector())
  }

  /**
   * Setup event listeners for automatic data collection
   */
  setupEventListeners() {
    // Listen for barcode scan events
    window.addEventListener('barcode-scanned', (event) => {
      this.collectTestResult('barcode_scan', event.detail)
    })
    
    // Listen for performance events
    window.addEventListener('performance-metric', (event) => {
      this.collectMetric(event.detail.type, event.detail.value, event.detail.context)
    })
    
    // Listen for user interaction events
    window.addEventListener('user-interaction', (event) => {
      this.collectEvent('user_interaction', event.detail)
    })
    
    // Listen for error events
    window.addEventListener('error', (event) => {
      this.collectEvent('error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      })
    })
  }

  /**
   * Capture current environment state
   */
  captureEnvironment() {
    return {
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        memory: navigator.deviceMemory || 'unknown',
        cores: navigator.hardwareConcurrency || 'unknown'
      },
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: screen.orientation?.type || 'unknown'
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      network: this.captureNetworkInfo(),
      battery: this.captureBatteryInfo(),
      performance: this.capturePerformanceInfo()
    }
  }

  /**
   * Capture current environment (lighter version)
   */
  captureCurrentEnvironment() {
    return {
      timestamp: Date.now(),
      online: navigator.onLine,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : null,
      network: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    }
  }

  /**
   * Capture network information
   */
  captureNetworkInfo() {
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
   * Capture battery information
   */
  async captureBatteryInfo() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery()
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        }
      } catch (error) {
        return null
      }
    }
    return null
  }

  /**
   * Capture performance information
   */
  capturePerformanceInfo() {
    const perfInfo = {
      timing: null,
      memory: null,
      navigation: null
    }
    
    if ('performance' in window) {
      // Memory information
      if (performance.memory) {
        perfInfo.memory = {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        }
      }
      
      // Navigation timing
      if (performance.timing) {
        const timing = performance.timing
        perfInfo.timing = {
          navigationStart: timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart
        }
      }
      
      // Navigation entries
      const navEntries = performance.getEntriesByType('navigation')
      if (navEntries.length > 0) {
        const nav = navEntries[0]
        perfInfo.navigation = {
          type: nav.type,
          redirectCount: nav.redirectCount,
          transferSize: nav.transferSize
        }
      }
    }
    
    return perfInfo
  }

  /**
   * Analyze test result in real-time
   */
  analyzeResult(result) {
    // Check for common issues
    if (result.testType === 'barcode_scan') {
      if (result.data.scanTime > 5000) {
        this.collectEvent('performance_alert', {
          type: 'slow_scan',
          scanTime: result.data.scanTime,
          threshold: 5000
        })
      }
      
      if (!result.data.success) {
        this.collectEvent('scan_failure', {
          barcode: result.data.barcode,
          error: result.data.error,
          attempt: result.data.attempt
        })
      }
    }
  }

  /**
   * Check performance thresholds
   */
  checkPerformanceThresholds(metric) {
    const thresholds = {
      memory_usage: 100, // MB
      scan_time: 5000,   // ms
      camera_init: 3000, // ms
      battery_drain: 20  // % per hour
    }
    
    const threshold = thresholds[metric.type]
    if (threshold && metric.value > threshold) {
      this.collectEvent('performance_threshold_exceeded', {
        metric: metric.type,
        value: metric.value,
        threshold,
        context: metric.context
      })
    }
  }

  /**
   * Generate session analytics
   */
  async generateSessionAnalytics() {
    if (!this.testSession) return null
    
    return await this.analytics.generateSessionAnalytics(this.testSession)
  }

  /**
   * Export test data
   */
  async exportTestData(sessionId = null, format = 'json') {
    const sessions = sessionId ? 
      [await this.storage.getTestSession(sessionId)] : 
      await this.storage.getAllTestSessions()
    
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      format,
      sessions: sessions.filter(s => s !== null)
    }
    
    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2)
      case 'csv':
        return this.convertToCSV(exportData)
      default:
        return exportData
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    const csvLines = []
    
    // Headers
    csvLines.push([
      'Session ID', 'Start Time', 'Duration', 'Test Type', 
      'Success Rate', 'Average Scan Time', 'Device', 'Browser'
    ].join(','))
    
    // Data rows
    data.sessions.forEach(session => {
      if (session.analytics) {
        csvLines.push([
          session.id,
          new Date(session.startTime).toISOString(),
          session.duration,
          'Mixed',
          session.analytics.successRate || 0,
          session.analytics.averageScanTime || 0,
          session.environment.device.platform || 'Unknown',
          this.getBrowserFromUserAgent(session.environment.device.userAgent)
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

  /**
   * Generate unique IDs
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateResultId() {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateMetricId() {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Test Data Storage System
 */
class TestDataStorage {
  constructor() {
    this.dbName = 'TestDataCollection'
    this.dbVersion = 1
    this.db = null
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(new Error('Failed to open test data database'))
      
      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Test sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
          sessionStore.createIndex('startTime', 'startTime')
          sessionStore.createIndex('duration', 'duration')
        }
        
        // Test results store
        if (!db.objectStoreNames.contains('results')) {
          const resultStore = db.createObjectStore('results', { keyPath: 'id' })
          resultStore.createIndex('sessionId', 'sessionId')
          resultStore.createIndex('testType', 'testType')
          resultStore.createIndex('timestamp', 'timestamp')
        }
        
        // Metrics store
        if (!db.objectStoreNames.contains('metrics')) {
          const metricStore = db.createObjectStore('metrics', { keyPath: 'id' })
          metricStore.createIndex('sessionId', 'sessionId')
          metricStore.createIndex('type', 'type')
          metricStore.createIndex('timestamp', 'timestamp')
        }
      }
    })
  }

  async storeTestSession(session) {
    const transaction = this.db.transaction(['sessions'], 'readwrite')
    const store = transaction.objectStore('sessions')
    await store.put(session)
  }

  async storeTestResult(sessionId, result) {
    const resultWithSession = { ...result, sessionId }
    const transaction = this.db.transaction(['results'], 'readwrite')
    const store = transaction.objectStore('results')
    await store.put(resultWithSession)
  }

  async getTestSession(sessionId) {
    const transaction = this.db.transaction(['sessions'], 'readonly')
    const store = transaction.objectStore('sessions')
    return await store.get(sessionId)
  }

  async getAllTestSessions() {
    const transaction = this.db.transaction(['sessions'], 'readonly')
    const store = transaction.objectStore('sessions')
    return await store.getAll()
  }

  async getSessionResults(sessionId) {
    const transaction = this.db.transaction(['results'], 'readonly')
    const store = transaction.objectStore('results')
    const index = store.index('sessionId')
    return await index.getAll(sessionId)
  }
}

/**
 * Test Analytics System
 */
class TestAnalytics {
  async generateSessionAnalytics(session) {
    const analytics = {
      sessionInfo: {
        id: session.id,
        duration: session.duration,
        totalResults: session.results.length,
        totalMetrics: session.metrics.length,
        totalEvents: session.events.length
      },
      performance: this.analyzePerformance(session),
      scanning: this.analyzeScanningResults(session),
      environment: this.analyzeEnvironmentData(session),
      issues: this.identifyIssues(session),
      recommendations: this.generateRecommendations(session)
    }
    
    return analytics
  }

  analyzePerformance(session) {
    const performanceMetrics = session.metrics.filter(m => 
      ['scan_time', 'camera_init', 'memory_usage'].includes(m.type)
    )
    
    const scanTimes = performanceMetrics
      .filter(m => m.type === 'scan_time')
      .map(m => m.value)
    
    const memoryUsage = performanceMetrics
      .filter(m => m.type === 'memory_usage')
      .map(m => m.value)
    
    return {
      averageScanTime: scanTimes.length > 0 ? 
        scanTimes.reduce((sum, time) => sum + time, 0) / scanTimes.length : 0,
      maxScanTime: scanTimes.length > 0 ? Math.max(...scanTimes) : 0,
      averageMemoryUsage: memoryUsage.length > 0 ?
        memoryUsage.reduce((sum, mem) => sum + mem, 0) / memoryUsage.length : 0,
      maxMemoryUsage: memoryUsage.length > 0 ? Math.max(...memoryUsage) : 0
    }
  }

  analyzeScanningResults(session) {
    const scanResults = session.results.filter(r => r.testType === 'barcode_scan')
    
    if (scanResults.length === 0) {
      return { noData: true }
    }
    
    const successful = scanResults.filter(r => r.data.success === true)
    const failed = scanResults.filter(r => r.data.success === false)
    
    return {
      totalScans: scanResults.length,
      successfulScans: successful.length,
      failedScans: failed.length,
      successRate: (successful.length / scanResults.length) * 100,
      averageScanTime: scanResults.reduce((sum, r) => sum + (r.data.scanTime || 0), 0) / scanResults.length,
      failureReasons: this.analyzeFailureReasons(failed)
    }
  }

  analyzeFailureReasons(failedScans) {
    const reasons = {}
    
    failedScans.forEach(scan => {
      const reason = scan.data.error || 'Unknown'
      reasons[reason] = (reasons[reason] || 0) + 1
    })
    
    return reasons
  }

  analyzeEnvironmentData(session) {
    const networkChanges = session.events.filter(e => e.type === 'network_change')
    const performanceAlerts = session.events.filter(e => e.type === 'performance_alert')
    
    return {
      networkStability: networkChanges.length,
      performanceIssues: performanceAlerts.length,
      initialEnvironment: session.environment,
      environmentChanges: networkChanges.length + performanceAlerts.length
    }
  }

  identifyIssues(session) {
    const issues = []
    
    // Check scan success rate
    const scanning = this.analyzeScanningResults(session)
    if (!scanning.noData && scanning.successRate < 80) {
      issues.push({
        type: 'low_success_rate',
        severity: 'high',
        description: `Scan success rate is ${scanning.successRate.toFixed(1)}% (target: 80%+)`
      })
    }
    
    // Check performance
    const performance = this.analyzePerformance(session)
    if (performance.averageScanTime > 3000) {
      issues.push({
        type: 'slow_scanning',
        severity: 'medium',
        description: `Average scan time is ${performance.averageScanTime.toFixed(0)}ms (target: <3000ms)`
      })
    }
    
    if (performance.maxMemoryUsage > 100) {
      issues.push({
        type: 'high_memory_usage',
        severity: 'medium',
        description: `Peak memory usage is ${performance.maxMemoryUsage.toFixed(1)}MB (target: <100MB)`
      })
    }
    
    return issues
  }

  generateRecommendations(session) {
    const recommendations = []
    const issues = this.identifyIssues(session)
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'low_success_rate':
          recommendations.push('Improve barcode detection algorithms and lighting adaptation')
          break
        case 'slow_scanning':
          recommendations.push('Optimize camera initialization and barcode processing')
          break
        case 'high_memory_usage':
          recommendations.push('Review memory management and implement cleanup routines')
          break
      }
    })
    
    return recommendations
  }
}

/**
 * Specialized Data Collectors
 */
class BarcodeScanCollector {
  collect(scanResult) {
    return {
      barcode: scanResult.barcode,
      success: scanResult.success,
      scanTime: scanResult.scanTime,
      attempts: scanResult.attempts,
      error: scanResult.error,
      product: scanResult.product,
      confidence: scanResult.confidence
    }
  }
}

class PerformanceMetricCollector {
  collect(metric) {
    return {
      type: metric.type,
      value: metric.value,
      timestamp: metric.timestamp,
      context: metric.context
    }
  }
}

class UserInteractionCollector {
  collect(interaction) {
    return {
      type: interaction.type,
      target: interaction.target,
      duration: interaction.duration,
      successful: interaction.successful
    }
  }
}

class ErrorEventCollector {
  collect(error) {
    return {
      message: error.message,
      stack: error.stack,
      source: error.source,
      category: error.category
    }
  }
}

class EnvironmentCollector {
  collect(environment) {
    return {
      lighting: environment.lighting,
      network: environment.network,
      device_state: environment.device_state
    }
  }
}

export default TestDataCollectionSystem