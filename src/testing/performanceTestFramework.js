/**
 * Comprehensive Performance Testing Framework
 * Tests memory usage, battery impact, database performance, and camera initialization
 */

export class PerformanceTestFramework {
  constructor() {
    this.testResults = []
    this.performanceObserver = null
    this.memoryMonitor = null
    this.batteryMonitor = null
    this.isMonitoring = false
    this.testStartTime = null
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    console.log('🔬 Initializing Performance Test Framework')
    
    // Setup performance observers
    this.setupPerformanceObservers()
    
    // Setup memory monitoring
    this.setupMemoryMonitoring()
    
    // Setup battery monitoring
    await this.setupBatteryMonitoring()
    
    // Setup network monitoring
    this.setupNetworkMonitoring()
    
    console.log('✅ Performance monitoring initialized')
  }

  /**
   * Setup performance observers for various metrics
   */
  setupPerformanceObservers() {
    if ('PerformanceObserver' in window) {
      // Monitor navigation timing
      this.performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordMetric('navigation', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType
          })
        })
      })

      try {
        this.performanceObserver.observe({ 
          entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] 
        })
      } catch (error) {
        console.warn('Some performance observers not supported:', error)
      }
    }
  }

  /**
   * Setup memory usage monitoring
   */
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      this.memoryMonitor = setInterval(() => {
        const memory = performance.memory
        this.recordMetric('memory', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
          timestamp: Date.now()
        })
      }, 5000) // Every 5 seconds
    }
  }

  /**
   * Setup battery monitoring
   */
  async setupBatteryMonitoring() {
    if ('getBattery' in navigator) {
      try {
        this.battery = await navigator.getBattery()
        
        const recordBatteryMetric = () => {
          this.recordMetric('battery', {
            level: this.battery.level,
            charging: this.battery.charging,
            chargingTime: this.battery.chargingTime,
            dischargingTime: this.battery.dischargingTime,
            timestamp: Date.now()
          })
        }

        // Initial reading
        recordBatteryMetric()

        // Monitor battery changes
        this.battery.addEventListener('levelchange', recordBatteryMetric)
        this.battery.addEventListener('chargingchange', recordBatteryMetric)
      } catch (error) {
        console.warn('Battery API not available:', error)
      }
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const recordNetworkMetric = () => {
        const connection = navigator.connection
        this.recordMetric('network', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          timestamp: Date.now()
        })
      }

      recordNetworkMetric()
      navigator.connection.addEventListener('change', recordNetworkMetric)
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(category, data) {
    const metric = {
      category,
      data,
      timestamp: Date.now(),
      relativeTime: this.testStartTime ? Date.now() - this.testStartTime : 0
    }
    
    this.testResults.push(metric)
    
    // Check for performance issues
    this.checkPerformanceThresholds(metric)
  }

  /**
   * Check performance thresholds and warn if exceeded
   */
  checkPerformanceThresholds(metric) {
    switch (metric.category) {
      case 'memory':
        if (metric.data.used > 100) { // 100MB
          console.warn(`🚨 High memory usage: ${metric.data.used}MB`)
        }
        break
      case 'battery':
        if (metric.data.level < 0.2 && !metric.data.charging) {
          console.warn(`🔋 Low battery: ${(metric.data.level * 100).toFixed(1)}%`)
        }
        break
      case 'network':
        if (metric.data.rtt > 1000) { // 1 second RTT
          console.warn(`🌐 High network latency: ${metric.data.rtt}ms`)
        }
        break
    }
  }

  /**
   * Start performance test session
   */
  startTest(testName) {
    console.log(`🚀 Starting performance test: ${testName}`)
    this.testStartTime = Date.now()
    this.isMonitoring = true
    
    this.recordMetric('test_session', {
      event: 'start',
      testName,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    })
  }

  /**
   * End performance test session
   */
  endTest(testName) {
    console.log(`🏁 Ending performance test: ${testName}`)
    
    this.recordMetric('test_session', {
      event: 'end',
      testName,
      duration: Date.now() - this.testStartTime
    })
    
    this.isMonitoring = false
    return this.generateReport()
  }

  /**
   * Test large food database performance
   */
  async testFoodDatabasePerformance() {
    console.log('🍕 Testing food database performance')
    
    const testStartTime = performance.now()
    
    const tests = {
      // Search performance tests
      searchPerformance: await this.testFoodSearch(),
      
      // Barcode lookup performance
      barcodeLookupPerformance: await this.testBarcodeLookup(),
      
      // Cache performance
      cachePerformance: await this.testCachePerformance(),
      
      // Database operations
      databaseOperations: await this.testDatabaseOperations()
    }
    
    const totalTime = performance.now() - testStartTime
    
    return {
      totalDuration: totalTime,
      tests,
      passed: Object.values(tests).every(test => test.passed),
      score: Object.values(tests).reduce((sum, test) => sum + test.score, 0) / Object.keys(tests).length
    }
  }

  /**
   * Test food search performance
   */
  async testFoodSearch() {
    const searchTerms = [
      'chicken', 'apple', 'rice', 'bread', 'milk', 
      'chocolate', 'banana', 'pasta', 'cheese', 'yogurt'
    ]
    
    const results = []
    
    for (const term of searchTerms) {
      const startTime = performance.now()
      
      try {
        // Simulate food search - replace with actual search function
        await this.simulateSearch(term)
        const duration = performance.now() - startTime
        
        results.push({
          term,
          duration,
          success: true
        })
        
        this.recordMetric('food_search', {
          term,
          duration,
          success: true
        })
      } catch (error) {
        const duration = performance.now() - startTime
        results.push({
          term,
          duration,
          success: false,
          error: error.message
        })
      }
    }
    
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    const successRate = results.filter(r => r.success).length / results.length * 100
    
    return {
      averageDuration,
      successRate,
      passed: averageDuration < 500 && successRate > 95, // 500ms, 95% success
      score: Math.max(0, 100 - averageDuration / 10), // Score based on speed
      details: results
    }
  }

  /**
   * Test barcode lookup performance
   */
  async testBarcodeLookup() {
    const testBarcodes = [
      '038000000805', '3017620422003', '028400647465',
      '075720001026', '044000032456', '602652171000'
    ]
    
    const results = []
    
    for (const barcode of testBarcodes) {
      const startTime = performance.now()
      
      try {
        // Simulate barcode lookup - replace with actual lookup function
        await this.simulateBarcodeLookup(barcode)
        const duration = performance.now() - startTime
        
        results.push({
          barcode,
          duration,
          success: true
        })
        
        this.recordMetric('barcode_lookup', {
          barcode,
          duration,
          success: true
        })
      } catch (error) {
        const duration = performance.now() - startTime
        results.push({
          barcode,
          duration,
          success: false,
          error: error.message
        })
      }
    }
    
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    const successRate = results.filter(r => r.success).length / results.length * 100
    
    return {
      averageDuration,
      successRate,
      passed: averageDuration < 2000 && successRate > 90, // 2s, 90% success
      score: Math.max(0, 100 - averageDuration / 50),
      details: results
    }
  }

  /**
   * Test cache performance
   */
  async testCachePerformance() {
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: `test-${i}`,
      data: `Test data item ${i}`,
      timestamp: Date.now()
    }))
    
    // Test cache write performance
    const writeStartTime = performance.now()
    for (const item of testData) {
      localStorage.setItem(`cache-${item.id}`, JSON.stringify(item))
    }
    const writeTime = performance.now() - writeStartTime
    
    // Test cache read performance
    const readStartTime = performance.now()
    const readResults = []
    for (const item of testData) {
      const cached = localStorage.getItem(`cache-${item.id}`)
      if (cached) {
        readResults.push(JSON.parse(cached))
      }
    }
    const readTime = performance.now() - readStartTime
    
    // Cleanup
    for (const item of testData) {
      localStorage.removeItem(`cache-${item.id}`)
    }
    
    this.recordMetric('cache_performance', {
      writeTime,
      readTime,
      itemCount: testData.length,
      readSuccessRate: readResults.length / testData.length * 100
    })
    
    return {
      writeTime,
      readTime,
      itemCount: testData.length,
      passed: writeTime < 100 && readTime < 50, // 100ms write, 50ms read
      score: Math.max(0, 100 - (writeTime + readTime) / 2)
    }
  }

  /**
   * Test database operations performance
   */
  async testDatabaseOperations() {
    const operations = []
    
    // Test IndexedDB operations if available
    if ('indexedDB' in window) {
      try {
        const dbTest = await this.testIndexedDBPerformance()
        operations.push({ type: 'indexedDB', ...dbTest })
      } catch (error) {
        operations.push({ 
          type: 'indexedDB', 
          passed: false, 
          error: error.message,
          score: 0 
        })
      }
    }
    
    // Test localStorage operations
    try {
      const localStorageTest = await this.testLocalStoragePerformance()
      operations.push({ type: 'localStorage', ...localStorageTest })
    } catch (error) {
      operations.push({ 
        type: 'localStorage', 
        passed: false, 
        error: error.message,
        score: 0 
      })
    }
    
    const averageScore = operations.reduce((sum, op) => sum + op.score, 0) / operations.length
    
    return {
      operations,
      passed: operations.every(op => op.passed),
      score: averageScore
    }
  }

  /**
   * Test IndexedDB performance
   */
  async testIndexedDBPerformance() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PerformanceTestDB', 1)
      const startTime = performance.now()
      
      request.onerror = () => reject(new Error('IndexedDB open failed'))
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        const store = db.createObjectStore('testStore', { keyPath: 'id' })
      }
      
      request.onsuccess = async (event) => {
        const db = event.target.result
        const transaction = db.transaction(['testStore'], 'readwrite')
        const store = transaction.objectStore('testStore')
        
        // Write test
        const writeStartTime = performance.now()
        for (let i = 0; i < 100; i++) {
          store.add({ id: i, data: `Test data ${i}` })
        }
        
        transaction.oncomplete = () => {
          const writeTime = performance.now() - writeStartTime
          
          // Read test
          const readTransaction = db.transaction(['testStore'], 'readonly')
          const readStore = readTransaction.objectStore('testStore')
          const readStartTime = performance.now()
          
          let readCount = 0
          const readRequest = readStore.openCursor()
          
          readRequest.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor) {
              readCount++
              cursor.continue()
            } else {
              const readTime = performance.now() - readStartTime
              const totalTime = performance.now() - startTime
              
              // Cleanup
              db.close()
              indexedDB.deleteDatabase('PerformanceTestDB')
              
              resolve({
                writeTime,
                readTime,
                totalTime,
                itemCount: 100,
                readCount,
                passed: totalTime < 500, // 500ms total
                score: Math.max(0, 100 - totalTime / 10)
              })
            }
          }
        }
      }
    })
  }

  /**
   * Test localStorage performance
   */
  async testLocalStoragePerformance() {
    const itemCount = 100
    const testKey = 'performance-test-'
    
    // Write test
    const writeStartTime = performance.now()
    for (let i = 0; i < itemCount; i++) {
      localStorage.setItem(`${testKey}${i}`, JSON.stringify({
        id: i,
        data: `Test data ${i}`,
        timestamp: Date.now()
      }))
    }
    const writeTime = performance.now() - writeStartTime
    
    // Read test
    const readStartTime = performance.now()
    let readCount = 0
    for (let i = 0; i < itemCount; i++) {
      const item = localStorage.getItem(`${testKey}${i}`)
      if (item) {
        JSON.parse(item)
        readCount++
      }
    }
    const readTime = performance.now() - readStartTime
    
    // Cleanup
    for (let i = 0; i < itemCount; i++) {
      localStorage.removeItem(`${testKey}${i}`)
    }
    
    return {
      writeTime,
      readTime,
      itemCount,
      readCount,
      passed: writeTime < 100 && readTime < 50,
      score: Math.max(0, 100 - (writeTime + readTime) / 2)
    }
  }

  /**
   * Test camera initialization speed
   */
  async testCameraInitializationSpeed() {
    console.log('📸 Testing camera initialization speed')
    
    const results = []
    const testCount = 5
    
    for (let i = 0; i < testCount; i++) {
      const startTime = performance.now()
      
      try {
        // Test camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        
        const initTime = performance.now() - startTime
        
        // Test camera capabilities detection
        const track = stream.getVideoTracks()[0]
        const capabilitiesStartTime = performance.now()
        const capabilities = track.getCapabilities()
        const capabilitiesTime = performance.now() - capabilitiesStartTime
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
        
        results.push({
          attempt: i + 1,
          initTime,
          capabilitiesTime,
          totalTime: initTime + capabilitiesTime,
          success: true,
          capabilities: Object.keys(capabilities).length
        })
        
        this.recordMetric('camera_init', {
          attempt: i + 1,
          initTime,
          capabilitiesTime,
          success: true
        })
        
        // Wait between attempts
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        const failTime = performance.now() - startTime
        results.push({
          attempt: i + 1,
          initTime: failTime,
          success: false,
          error: error.message
        })
      }
    }
    
    const successfulResults = results.filter(r => r.success)
    const averageInitTime = successfulResults.length > 0 ? 
      successfulResults.reduce((sum, r) => sum + r.initTime, 0) / successfulResults.length : 0
    const successRate = successfulResults.length / testCount * 100
    
    return {
      averageInitTime,
      successRate,
      testCount,
      passed: averageInitTime < 3000 && successRate > 80, // 3s, 80% success
      score: Math.max(0, 100 - averageInitTime / 100),
      details: results
    }
  }

  /**
   * Test memory usage with extended use
   */
  async testExtendedMemoryUsage(durationMinutes = 30) {
    console.log(`🧠 Testing memory usage over ${durationMinutes} minutes`)
    
    const startTime = Date.now()
    const endTime = startTime + (durationMinutes * 60 * 1000)
    const memorySnapshots = []
    
    // Take memory snapshot every 30 seconds
    const snapshotInterval = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(snapshotInterval)
        return
      }
      
      if ('memory' in performance) {
        const memory = performance.memory
        const snapshot = {
          timestamp: Date.now() - startTime,
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        }
        
        memorySnapshots.push(snapshot)
        this.recordMetric('extended_memory', snapshot)
      }
    }, 30000) // Every 30 seconds
    
    // Simulate extended usage patterns
    const usageSimulation = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(usageSimulation)
        return
      }
      
      // Simulate various operations
      this.simulateUserActions()
    }, 5000) // Every 5 seconds
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, durationMinutes * 60 * 1000))
    
    // Analyze memory usage
    const initialMemory = memorySnapshots[0]?.used || 0
    const finalMemory = memorySnapshots[memorySnapshots.length - 1]?.used || 0
    const maxMemory = Math.max(...memorySnapshots.map(s => s.used))
    const memoryGrowth = finalMemory - initialMemory
    
    return {
      durationMinutes,
      initialMemory,
      finalMemory,
      maxMemory,
      memoryGrowth,
      snapshots: memorySnapshots,
      passed: memoryGrowth < 20, // Less than 20MB growth
      score: Math.max(0, 100 - memoryGrowth * 2)
    }
  }

  /**
   * Test battery impact during scanning
   */
  async testBatteryImpact(durationMinutes = 60) {
    console.log(`🔋 Testing battery impact over ${durationMinutes} minutes`)
    
    if (!this.battery) {
      return {
        supported: false,
        message: 'Battery API not available'
      }
    }
    
    const initialLevel = this.battery.level
    const startTime = Date.now()
    const batteryReadings = []
    
    // Record battery level every minute
    const batteryInterval = setInterval(() => {
      const reading = {
        timestamp: Date.now() - startTime,
        level: this.battery.level,
        charging: this.battery.charging
      }
      
      batteryReadings.push(reading)
      this.recordMetric('battery_impact', reading)
    }, 60000) // Every minute
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, durationMinutes * 60 * 1000))
    
    clearInterval(batteryInterval)
    
    const finalLevel = this.battery.level
    const batteryDrain = initialLevel - finalLevel
    const drainPercentage = batteryDrain * 100
    const drainPerHour = (drainPercentage / durationMinutes) * 60
    
    return {
      durationMinutes,
      initialLevel,
      finalLevel,
      batteryDrain,
      drainPercentage,
      drainPerHour,
      readings: batteryReadings,
      passed: drainPerHour < 15, // Less than 15% per hour
      score: Math.max(0, 100 - drainPerHour * 2)
    }
  }

  /**
   * Simulate user actions for testing
   */
  simulateUserActions() {
    // Simulate DOM operations
    const element = document.createElement('div')
    element.innerHTML = 'Test content'
    document.body.appendChild(element)
    setTimeout(() => document.body.removeChild(element), 100)
    
    // Simulate data operations
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() }))
    data.sort((a, b) => a.value - b.value)
    
    // Simulate network request
    fetch('/api/health-check').catch(() => {}) // Ignore errors
  }

  /**
   * Simulate search operation
   */
  async simulateSearch(term) {
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
    
    // Simulate processing
    const results = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      name: `${term} result ${i}`,
      score: Math.random()
    }))
    
    return results
  }

  /**
   * Simulate barcode lookup
   */
  async simulateBarcodeLookup(barcode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    return {
      barcode,
      name: `Product for ${barcode}`,
      calories: Math.floor(Math.random() * 500) + 100,
      found: true
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    const report = {
      testSession: {
        startTime: this.testStartTime,
        endTime: Date.now(),
        duration: Date.now() - this.testStartTime
      },
      summary: {
        totalMetrics: this.testResults.length,
        categories: [...new Set(this.testResults.map(r => r.category))],
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          memory: navigator.deviceMemory || 'unknown',
          cores: navigator.hardwareConcurrency || 'unknown'
        }
      },
      performance: this.analyzePerformanceMetrics(),
      memory: this.analyzeMemoryMetrics(),
      battery: this.analyzeBatteryMetrics(),
      network: this.analyzeNetworkMetrics(),
      recommendations: []
    }
    
    // Generate recommendations
    report.recommendations = this.generateRecommendations(report)
    
    return report
  }

  /**
   * Analyze performance metrics
   */
  analyzePerformanceMetrics() {
    const navigationMetrics = this.testResults.filter(r => r.category === 'navigation')
    const searchMetrics = this.testResults.filter(r => r.category === 'food_search')
    const scanMetrics = this.testResults.filter(r => r.category === 'barcode_lookup')
    
    return {
      navigation: this.calculateMetricStats(navigationMetrics, 'duration'),
      search: this.calculateMetricStats(searchMetrics, 'duration'),
      scanning: this.calculateMetricStats(scanMetrics, 'duration')
    }
  }

  /**
   * Analyze memory metrics
   */
  analyzeMemoryMetrics() {
    const memoryMetrics = this.testResults.filter(r => r.category === 'memory')
    
    if (memoryMetrics.length === 0) {
      return { available: false }
    }
    
    const usedMemory = memoryMetrics.map(m => m.data.used)
    const initialMemory = usedMemory[0] || 0
    const currentMemory = usedMemory[usedMemory.length - 1] || 0
    const maxMemory = Math.max(...usedMemory)
    
    return {
      available: true,
      initial: initialMemory,
      current: currentMemory,
      maximum: maxMemory,
      growth: currentMemory - initialMemory,
      trend: this.calculateTrend(usedMemory)
    }
  }

  /**
   * Analyze battery metrics
   */
  analyzeBatteryMetrics() {
    const batteryMetrics = this.testResults.filter(r => r.category === 'battery')
    
    if (batteryMetrics.length === 0) {
      return { available: false }
    }
    
    const levels = batteryMetrics.map(m => m.data.level)
    const initialLevel = levels[0] || 1
    const currentLevel = levels[levels.length - 1] || 1
    const drain = initialLevel - currentLevel
    
    return {
      available: true,
      initialLevel,
      currentLevel,
      drain,
      drainPercentage: drain * 100
    }
  }

  /**
   * Analyze network metrics
   */
  analyzeNetworkMetrics() {
    const networkMetrics = this.testResults.filter(r => r.category === 'network')
    
    if (networkMetrics.length === 0) {
      return { available: false }
    }
    
    const latestMetric = networkMetrics[networkMetrics.length - 1]
    return {
      available: true,
      effectiveType: latestMetric.data.effectiveType,
      downlink: latestMetric.data.downlink,
      rtt: latestMetric.data.rtt,
      saveData: latestMetric.data.saveData
    }
  }

  /**
   * Calculate statistics for metrics
   */
  calculateMetricStats(metrics, field) {
    if (metrics.length === 0) return { available: false }
    
    const values = metrics.map(m => m.data[field]).filter(v => v !== undefined)
    
    return {
      available: true,
      count: values.length,
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      median: this.calculateMedian(values)
    }
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid]
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable'
    
    const initial = values[0]
    const final = values[values.length - 1]
    const change = final - initial
    const changePercentage = (change / initial) * 100
    
    if (changePercentage > 10) return 'increasing'
    if (changePercentage < -10) return 'decreasing'
    return 'stable'
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(report) {
    const recommendations = []
    
    // Memory recommendations
    if (report.memory.available && report.memory.growth > 20) {
      recommendations.push({
        category: 'memory',
        severity: 'high',
        issue: 'High memory growth detected',
        recommendation: 'Investigate memory leaks and optimize cleanup'
      })
    }
    
    // Battery recommendations
    if (report.battery.available && report.battery.drainPercentage > 15) {
      recommendations.push({
        category: 'battery',
        severity: 'medium',
        issue: 'High battery drain detected',
        recommendation: 'Optimize camera usage and background processing'
      })
    }
    
    // Performance recommendations
    if (report.performance.scanning.available && report.performance.scanning.average > 3000) {
      recommendations.push({
        category: 'performance',
        severity: 'medium',
        issue: 'Slow barcode scanning performance',
        recommendation: 'Optimize barcode detection algorithms'
      })
    }
    
    return recommendations
  }

  /**
   * Cleanup monitoring
   */
  cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor)
    }
    
    console.log('🧹 Performance monitoring cleaned up')
  }
}

export default PerformanceTestFramework