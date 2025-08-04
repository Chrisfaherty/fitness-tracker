/**
 * API Optimization Service
 * Optimizes API calls with batching, caching, deduplication, and request management
 */

export class APIOptimizationService {
  constructor() {
    this.isInitialized = false
    this.requestCache = new Map()
    this.pendingRequests = new Map()
    this.batchQueue = new Map()
    this.requestStats = {
      totalRequests: 0,
      cachedResponses: 0,
      batchedRequests: 0,
      deduplicatedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0
    }
    this.config = {
      enableCaching: true,
      enableBatching: true,
      enableDeduplication: true,
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      batchDelay: 50, // 50ms
      maxBatchSize: 10,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000, // 10 seconds
      enableCompression: true,
      enableRequestCoalescing: true
    }
    this.interceptors = {
      request: [],
      response: []
    }
  }

  /**
   * Initialize API optimization service
   */
  async initialize(options = {}) {
    console.log('🚀 Initializing API Optimization Service')
    
    this.config = { ...this.config, ...options }
    
    // Setup request interceptors
    this.setupRequestInterceptors()
    
    // Setup response interceptors
    this.setupResponseInterceptors()
    
    // Setup batch processing
    this.setupBatchProcessing()
    
    // Setup cache management
    this.setupCacheManagement()
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring()
    
    this.isInitialized = true
    console.log('✅ API Optimization Service initialized')
    
    return true
  }

  /**
   * Optimized fetch with caching, batching, and deduplication
   */
  async optimizedFetch(url, options = {}) {
    const requestKey = this.generateRequestKey(url, options)
    const startTime = Date.now()
    
    try {
      this.requestStats.totalRequests++
      
      // Check cache first
      if (this.config.enableCaching && this.shouldCache(options)) {
        const cached = this.getCachedResponse(requestKey)
        if (cached) {
          this.requestStats.cachedResponses++
          return this.createCachedResponse(cached)
        }
      }
      
      // Check for duplicate in-flight requests
      if (this.config.enableDeduplication) {
        const pending = this.pendingRequests.get(requestKey)
        if (pending) {
          this.requestStats.deduplicatedRequests++
          return await pending
        }
      }
      
      // Check if request can be batched
      if (this.config.enableBatching && this.canBatch(url, options)) {
        return await this.batchRequest(url, options)
      }
      
      // Execute single request
      const requestPromise = this.executeRequest(url, options)
      
      // Store pending request for deduplication
      if (this.config.enableDeduplication) {
        this.pendingRequests.set(requestKey, requestPromise)
      }
      
      const response = await requestPromise
      
      // Clean up pending request
      this.pendingRequests.delete(requestKey)
      
      // Cache successful responses
      if (this.config.enableCaching && response.ok && this.shouldCache(options)) {
        await this.cacheResponse(requestKey, response.clone())
      }
      
      // Update performance metrics
      this.updatePerformanceMetrics(startTime, true)
      
      return response
      
    } catch (error) {
      this.pendingRequests.delete(requestKey)
      this.updatePerformanceMetrics(startTime, false)
      throw error
    }
  }

  /**
   * Execute single request with optimizations
   */
  async executeRequest(url, options = {}) {
    const optimizedOptions = await this.optimizeRequestOptions(options)
    
    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
    
    try {
      // Apply request interceptors
      const interceptedOptions = await this.applyRequestInterceptors(url, {
        ...optimizedOptions,
        signal: controller.signal
      })
      
      const response = await fetch(url, interceptedOptions)
      clearTimeout(timeoutId)
      
      // Apply response interceptors
      const interceptedResponse = await this.applyResponseInterceptors(response)
      
      return interceptedResponse
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Retry logic
      if (this.shouldRetry(error, options)) {
        return this.retryRequest(url, options)
      }
      
      throw error
    }
  }

  /**
   * Optimize request options
   */
  async optimizeRequestOptions(options) {
    const optimized = { ...options }
    
    // Add compression headers
    if (this.config.enableCompression) {
      optimized.headers = {
        'Accept-Encoding': 'gzip, deflate, br',
        ...optimized.headers
      }
    }
    
    // Add caching headers for GET requests
    if (!optimized.method || optimized.method === 'GET') {
      optimized.headers = {
        'Cache-Control': 'max-age=300', // 5 minutes
        ...optimized.headers
      }
    }
    
    // Compress request body if large
    if (optimized.body && typeof optimized.body === 'string' && optimized.body.length > 1024) {
      optimized.body = await this.compressRequestBody(optimized.body)
      optimized.headers = {
        'Content-Encoding': 'gzip',
        ...optimized.headers
      }
    }
    
    return optimized
  }

  /**
   * Batch multiple requests together
   */
  async batchRequest(url, options) {
    const batchKey = this.getBatchKey(url)
    
    return new Promise((resolve, reject) => {
      // Add to batch queue
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, [])
      }
      
      this.batchQueue.get(batchKey).push({
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      })
      
      // Schedule batch execution
      this.scheduleBatchExecution(batchKey)
    })
  }

  /**
   * Schedule batch execution
   */
  scheduleBatchExecution(batchKey) {
    if (this.batchTimers?.[batchKey]) return
    
    if (!this.batchTimers) this.batchTimers = {}
    
    this.batchTimers[batchKey] = setTimeout(async () => {
      await this.executeBatch(batchKey)
      delete this.batchTimers[batchKey]
    }, this.config.batchDelay)
  }

  /**
   * Execute batched requests
   */
  async executeBatch(batchKey) {
    const batch = this.batchQueue.get(batchKey)
    if (!batch || batch.length === 0) return
    
    this.batchQueue.delete(batchKey)
    this.requestStats.batchedRequests += batch.length
    
    try {
      // Group requests by similarity
      const groups = this.groupSimilarRequests(batch)
      
      // Execute each group
      for (const group of groups) {
        if (group.length === 1) {
          // Single request
          const request = group[0]
          try {
            const response = await this.executeRequest(request.url, request.options)
            request.resolve(response)
          } catch (error) {
            request.reject(error)
          }
        } else {
          // Multiple requests - execute in parallel
          const promises = group.map(request => 
            this.executeRequest(request.url, request.options)
              .then(response => ({ request, response, success: true }))
              .catch(error => ({ request, error, success: false }))
          )
          
          const results = await Promise.all(promises)
          
          results.forEach(result => {
            if (result.success) {
              result.request.resolve(result.response)
            } else {
              result.request.reject(result.error)
            }
          })
        }
      }
      
    } catch (error) {
      // If batch execution fails, reject all requests
      batch.forEach(request => request.reject(error))
    }
  }

  /**
   * Group similar requests for batch optimization
   */
  groupSimilarRequests(batch) {
    const groups = []
    const processed = new Set()
    
    for (let i = 0; i < batch.length; i++) {
      if (processed.has(i)) continue
      
      const group = [batch[i]]
      processed.add(i)
      
      // Find similar requests
      for (let j = i + 1; j < batch.length; j++) {
        if (processed.has(j)) continue
        
        if (this.areRequestsSimilar(batch[i], batch[j])) {
          group.push(batch[j])
          processed.add(j)
        }
      }
      
      groups.push(group)
    }
    
    return groups
  }

  /**
   * Check if requests are similar enough to batch
   */
  areRequestsSimilar(req1, req2) {
    // Same domain and path structure
    const url1 = new URL(req1.url, window.location.origin)
    const url2 = new URL(req2.url, window.location.origin)
    
    return url1.origin === url2.origin && 
           url1.pathname.split('/')[1] === url2.pathname.split('/')[1] &&
           req1.options.method === req2.options.method
  }

  /**
   * Setup request interceptors
   */
  setupRequestInterceptors() {
    // Add authentication interceptor
    this.addRequestInterceptor(async (url, options) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        options.headers = {
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      }
      return options
    })
    
    // Add request ID for tracking
    this.addRequestInterceptor(async (url, options) => {
      options.headers = {
        'X-Request-ID': this.generateRequestId(),
        ...options.headers
      }
      return options
    })
    
    // Add telemetry headers
    this.addRequestInterceptor(async (url, options) => {
      options.headers = {
        'X-Client-Version': '1.0.0',
        'X-Client-Platform': navigator.platform,
        ...options.headers
      }
      return options
    })
  }

  /**
   * Setup response interceptors
   */
  setupResponseInterceptors() {
    // Handle authentication errors
    this.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        localStorage.removeItem('authToken')
        window.dispatchEvent(new CustomEvent('auth-expired'))
      }
      return response
    })
    
    // Handle rate limiting
    this.addResponseInterceptor(async (response) => {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        if (retryAfter) {
          console.warn(`Rate limited. Retry after ${retryAfter} seconds`)
        }
      }
      return response
    })
    
    // Add response timing
    this.addResponseInterceptor(async (response) => {
      const responseTime = response.headers.get('X-Response-Time')
      if (responseTime) {
        this.recordResponseTime(parseFloat(responseTime))
      }
      return response
    })
  }

  /**
   * Setup batch processing
   */
  setupBatchProcessing() {
    // Periodically flush batches
    setInterval(() => {
      this.flushPendingBatches()
    }, this.config.batchDelay * 2)
    
    console.log('📦 Batch processing configured')
  }

  /**
   * Setup cache management
   */
  setupCacheManagement() {
    if (!this.config.enableCaching) return
    
    // Load existing cache
    this.loadCache()
    
    // Periodic cache cleanup
    setInterval(() => {
      this.cleanupCache()
    }, 60 * 1000) // Every minute
    
    // Save cache before page unload
    window.addEventListener('beforeunload', () => {
      this.saveCache()
    })
    
    console.log('💾 API caching configured')
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor request performance
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          this.recordNetworkTiming(entry)
        }
      }
    })
    
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver.observe({ entryTypes: ['resource'] })
    }
    
    console.log('📊 API performance monitoring active')
  }

  /**
   * Cache management methods
   */
  getCachedResponse(key) {
    const cached = this.requestCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.config.cacheExpiry) {
      this.requestCache.delete(key)
      return null
    }
    
    return cached
  }

  async cacheResponse(key, response) {
    try {
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text(),
        timestamp: Date.now()
      }
      
      this.requestCache.set(key, responseData)
      
    } catch (error) {
      console.warn('Failed to cache response:', error)
    }
  }

  createCachedResponse(cached) {
    return new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers: cached.headers
    })
  }

  /**
   * Request retry logic
   */
  async retryRequest(url, options, attempt = 1) {
    if (attempt > this.config.maxRetries) {
      throw new Error(`Request failed after ${this.config.maxRetries} retries`)
    }
    
    const delay = this.config.retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
    
    console.log(`Retrying request (attempt ${attempt}/${this.config.maxRetries}) in ${delay}ms`)
    
    await this.sleep(delay)
    
    try {
      return await this.executeRequest(url, options)
    } catch (error) {
      return this.retryRequest(url, options, attempt + 1)
    }
  }

  /**
   * Request coalescing for identical requests
   */
  setupRequestCoalescing() {
    if (!this.config.enableRequestCoalescing) return
    
    this.coalescedRequests = new Map()
    
    // Cleanup coalesced requests periodically
    setInterval(() => {
      const now = Date.now()
      for (const [key, request] of this.coalescedRequests) {
        if (now - request.timestamp > 10000) { // 10 seconds
          this.coalescedRequests.delete(key)
        }
      }
    }, 5000)
  }

  /**
   * GraphQL query optimization
   */
  optimizeGraphQLQuery(query, variables = {}) {
    // Remove unnecessary whitespace and comments
    const minified = query
      .replace(/\s+/g, ' ')
      .replace(/#.*$/gm, '')
      .trim()
    
    // Generate cache key based on query structure
    const queryHash = this.hashString(minified + JSON.stringify(variables))
    
    return {
      query: minified,
      variables,
      cacheKey: `gql_${queryHash}`
    }
  }

  /**
   * Request prefetching
   */
  async prefetchRequest(url, options = {}) {
    try {
      const response = await this.optimizedFetch(url, {
        ...options,
        priority: 'low'
      })
      
      console.log(`🚀 Prefetched: ${url}`)
      return response
      
    } catch (error) {
      console.warn('Prefetch failed:', url, error)
    }
  }

  /**
   * Parallel request execution
   */
  async executeParallel(requests, maxConcurrency = 5) {
    const results = []
    const executing = []
    
    for (const [index, request] of requests.entries()) {
      const promise = this.optimizedFetch(request.url, request.options)
        .then(response => ({ index, response, success: true }))
        .catch(error => ({ index, error, success: false }))
        .finally(() => {
          executing.splice(executing.indexOf(promise), 1)
        })
      
      results.push(promise)
      executing.push(promise)
      
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }
    
    return Promise.all(results)
  }

  /**
   * Utility methods
   */
  generateRequestKey(url, options) {
    const key = `${options.method || 'GET'}_${url}_${JSON.stringify(options.body || {})}`
    return this.hashString(key)
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  shouldCache(options) {
    return (!options.method || options.method === 'GET') && 
           !options.headers?.['Cache-Control']?.includes('no-cache')
  }

  canBatch(url, options) {
    return (!options.method || options.method === 'GET') && 
           !options.urgent &&
           !url.includes('/realtime/')
  }

  shouldRetry(error, options) {
    return !options.noRetry &&
           (error.name === 'TypeError' || // Network error
            (error.status >= 500 && error.status < 600)) // Server error
  }

  getBatchKey(url) {
    const urlObj = new URL(url, window.location.origin)
    return `${urlObj.origin}${urlObj.pathname.split('/').slice(0, 3).join('/')}`
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async compressRequestBody(body) {
    // Simple compression simulation
    // In a real implementation, you'd use actual compression
    return body
  }

  /**
   * Performance tracking
   */
  updatePerformanceMetrics(startTime, success) {
    const responseTime = Date.now() - startTime
    
    // Update average response time
    this.requestStats.averageResponseTime = 
      (this.requestStats.averageResponseTime + responseTime) / 2
    
    // Update error rate
    if (!success) {
      this.requestStats.errorRate = 
        (this.requestStats.errorRate * 0.9) + (1 * 0.1) // Exponential moving average
    } else {
      this.requestStats.errorRate = this.requestStats.errorRate * 0.9
    }
  }

  recordResponseTime(time) {
    this.requestStats.averageResponseTime = 
      (this.requestStats.averageResponseTime + time) / 2
  }

  recordNetworkTiming(entry) {
    console.log(`📊 Network timing: ${entry.name} - ${entry.duration}ms`)
  }

  /**
   * Cache persistence
   */
  loadCache() {
    try {
      const cached = localStorage.getItem('apiCache')
      if (cached) {
        const data = JSON.parse(cached)
        Object.entries(data).forEach(([key, value]) => {
          this.requestCache.set(key, value)
        })
      }
    } catch (error) {
      console.warn('Failed to load API cache:', error)
    }
  }

  saveCache() {
    try {
      const cacheData = Object.fromEntries(
        Array.from(this.requestCache.entries()).slice(-100) // Keep only last 100
      )
      localStorage.setItem('apiCache', JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to save API cache:', error)
    }
  }

  cleanupCache() {
    const now = Date.now()
    const toDelete = []
    
    this.requestCache.forEach((value, key) => {
      if (now - value.timestamp > this.config.cacheExpiry) {
        toDelete.push(key)
      }
    })
    
    toDelete.forEach(key => this.requestCache.delete(key))
  }

  flushPendingBatches() {
    const now = Date.now()
    
    this.batchQueue.forEach((batch, key) => {
      const oldestRequest = Math.min(...batch.map(r => r.timestamp))
      if (now - oldestRequest > this.config.batchDelay * 2) {
        this.executeBatch(key)
      }
    })
  }

  /**
   * Interceptor management
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor)
  }

  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor)
  }

  async applyRequestInterceptors(url, options) {
    let modifiedOptions = options
    
    for (const interceptor of this.interceptors.request) {
      modifiedOptions = await interceptor(url, modifiedOptions)
    }
    
    return modifiedOptions
  }

  async applyResponseInterceptors(response) {
    let modifiedResponse = response
    
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse)
    }
    
    return modifiedResponse
  }

  // API methods
  getRequestStats() {
    return { ...this.requestStats }
  }

  getCacheStats() {
    return {
      size: this.requestCache.size,
      hitRate: this.requestStats.cachedResponses / this.requestStats.totalRequests,
      entries: Array.from(this.requestCache.keys()).slice(0, 10)
    }
  }

  getBatchStats() {
    return {
      pendingBatches: this.batchQueue.size,
      batchedRequests: this.requestStats.batchedRequests,
      batchEfficiency: this.requestStats.batchedRequests / this.requestStats.totalRequests
    }
  }

  clearCache() {
    this.requestCache.clear()
    localStorage.removeItem('apiCache')
    console.log('🧹 API cache cleared')
  }

  stop() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    
    this.saveCache()
    this.requestCache.clear()
    this.pendingRequests.clear()
    this.batchQueue.clear()
    
    this.isInitialized = false
    console.log('🛑 API Optimization Service stopped')
  }
}

export const apiOptimizationService = new APIOptimizationService()
export default apiOptimizationService