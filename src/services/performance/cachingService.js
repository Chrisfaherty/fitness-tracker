/**
 * Advanced Caching Service
 * Implements multi-level caching with Service Worker, IndexedDB, and memory cache
 */

export class CachingService {
  constructor() {
    this.isInitialized = false
    this.memoryCache = new Map()
    this.cacheStrategies = new Map()
    this.cacheStats = {
      memoryHits: 0,
      memoryMisses: 0,
      indexedDBHits: 0,
      indexedDBMisses: 0,
      serviceWorkerHits: 0,
      serviceWorkerMisses: 0,
      totalRequests: 0,
      averageResponseTime: 0
    }
    this.config = {
      enableServiceWorker: true,
      enableIndexedDB: true,
      enableMemoryCache: true,
      memoryLimit: 50 * 1024 * 1024, // 50MB
      indexedDBLimit: 200 * 1024 * 1024, // 200MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000,
      enableCompression: true,
      enableVersioning: true,
      enableMetrics: true
    }
    this.cacheVersions = new Map()
    this.compressionWorker = null
  }

  /**
   * Initialize caching service
   */
  async initialize(options = {}) {
    console.log('💾 Initializing Advanced Caching Service')
    
    this.config = { ...this.config, ...options }
    
    // Initialize cache layers
    await this.initializeMemoryCache()
    
    if (this.config.enableIndexedDB) {
      await this.initializeIndexedDB()
    }
    
    if (this.config.enableServiceWorker) {
      await this.initializeServiceWorker()
    }
    
    // Setup cache strategies
    this.setupCacheStrategies()
    
    // Setup compression worker
    if (this.config.enableCompression) {
      await this.initializeCompressionWorker()
    }
    
    // Setup cache maintenance
    this.setupCacheMaintenance()
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring()
    
    this.isInitialized = true
    console.log('✅ Advanced Caching Service initialized')
    
    return true
  }

  /**
   * Initialize memory cache
   */
  async initializeMemoryCache() {
    this.memoryCache = new Map()
    this.memoryCacheSize = 0
    
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('memoryCacheIndex')
      if (saved) {
        const index = JSON.parse(saved)
        console.log(`📁 Loaded ${Object.keys(index).length} cache entries from storage`)
      }
    } catch (error) {
      console.warn('Failed to load memory cache index:', error)
    }
    
    console.log('🧠 Memory cache initialized')
  }

  /**
   * Initialize IndexedDB cache
   */
  async initializeIndexedDB() {
    try {
      this.db = await this.openIndexedDB()
      console.log('💿 IndexedDB cache initialized')
    } catch (error) {
      console.warn('IndexedDB initialization failed:', error)
      this.config.enableIndexedDB = false
    }
  }

  /**
   * Open IndexedDB connection
   */
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CacheDB', 2)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Cache store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
          cacheStore.createIndex('strategy', 'strategy', { unique: false })
          cacheStore.createIndex('size', 'size', { unique: false })
        }
        
        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          const metaStore = db.createObjectStore('metadata', { keyPath: 'key' })
          metaStore.createIndex('category', 'category', { unique: false })
        }
      }
    })
  }

  /**
   * Initialize Service Worker for network-level caching
   */
  async initializeServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      this.config.enableServiceWorker = false
      return
    }
    
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw-cache.js')
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      
      // Setup message communication
      this.setupServiceWorkerCommunication()
      
      console.log('🔧 Service Worker cache initialized')
      
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
      this.config.enableServiceWorker = false
    }
  }

  /**
   * Setup Service Worker communication
   */
  setupServiceWorkerCommunication() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data
      
      switch (type) {
        case 'CACHE_HIT':
          this.cacheStats.serviceWorkerHits++
          break
        case 'CACHE_MISS':
          this.cacheStats.serviceWorkerMisses++
          break
        case 'CACHE_UPDATE':
          this.handleServiceWorkerCacheUpdate(data)
          break
      }
    })
  }

  /**
   * Initialize compression worker
   */
  async initializeCompressionWorker() {
    try {
      this.compressionWorker = new Worker('/workers/compression-worker.js')
      
      this.compressionWorker.onmessage = (event) => {
        const { id, compressed, decompressed, error } = event.data
        
        if (error) {
          console.error('Compression worker error:', error)
          return
        }
        
        // Handle compression/decompression results
        this.handleCompressionResult(id, compressed, decompressed)
      }
      
      console.log('🗜️ Compression worker initialized')
      
    } catch (error) {
      console.warn('Compression worker initialization failed:', error)
      this.config.enableCompression = false
    }
  }

  /**
   * Setup cache strategies
   */
  setupCacheStrategies() {
    // Cache First - Try cache first, then network
    this.cacheStrategies.set('cache-first', {
      name: 'Cache First',
      execute: async (key, fetchFunction, options) => {
        const cached = await this.get(key)
        if (cached) return cached
        
        const data = await fetchFunction()
        await this.set(key, data, options)
        return data
      }
    })
    
    // Network First - Try network first, fallback to cache
    this.cacheStrategies.set('network-first', {
      name: 'Network First',
      execute: async (key, fetchFunction, options) => {
        try {
          const data = await fetchFunction()
          await this.set(key, data, options)
          return data
        } catch (error) {
          const cached = await this.get(key)
          if (cached) return cached
          throw error
        }
      }
    })
    
    // Stale While Revalidate - Return cache immediately, update in background
    this.cacheStrategies.set('stale-while-revalidate', {
      name: 'Stale While Revalidate',
      execute: async (key, fetchFunction, options) => {
        const cached = await this.get(key)
        
        // Background update
        fetchFunction()
          .then(data => this.set(key, data, options))
          .catch(error => console.warn('Background cache update failed:', error))
        
        return cached || await fetchFunction()
      }
    })
    
    // Network Only - Always fetch from network
    this.cacheStrategies.set('network-only', {
      name: 'Network Only',
      execute: async (key, fetchFunction, options) => {
        return await fetchFunction()
      }
    })
    
    // Cache Only - Only use cache, never network
    this.cacheStrategies.set('cache-only', {
      name: 'Cache Only',
      execute: async (key, fetchFunction, options) => {
        const cached = await this.get(key)
        if (cached) return cached
        throw new Error('No cached data available')
      }
    })
    
    console.log(`🎯 Initialized ${this.cacheStrategies.size} cache strategies`)
  }

  /**
   * Generic cache get with multi-level fallback
   */
  async get(key, options = {}) {
    const startTime = Date.now()
    this.cacheStats.totalRequests++
    
    try {
      // Level 1: Memory cache
      if (this.config.enableMemoryCache) {
        const memoryResult = this.getFromMemory(key)
        if (memoryResult) {
          this.cacheStats.memoryHits++
          this.updateResponseTimeMetric(startTime)
          return memoryResult.data
        }
        this.cacheStats.memoryMisses++
      }
      
      // Level 2: IndexedDB cache
      if (this.config.enableIndexedDB) {
        const indexedDBResult = await this.getFromIndexedDB(key)
        if (indexedDBResult) {
          this.cacheStats.indexedDBHits++
          
          // Promote to memory cache
          this.setInMemory(key, indexedDBResult.data, indexedDBResult.ttl)
          
          this.updateResponseTimeMetric(startTime)
          return indexedDBResult.data
        }
        this.cacheStats.indexedDBMisses++
      }
      
      // Level 3: Service Worker cache
      if (this.config.enableServiceWorker) {
        const swResult = await this.getFromServiceWorker(key)
        if (swResult) {
          this.cacheStats.serviceWorkerHits++
          
          // Promote to higher levels
          this.setInMemory(key, swResult.data, swResult.ttl)
          if (this.config.enableIndexedDB) {
            await this.setInIndexedDB(key, swResult.data, swResult)
          }
          
          this.updateResponseTimeMetric(startTime)
          return swResult.data
        }
        this.cacheStats.serviceWorkerMisses++
      }
      
      return null
      
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Generic cache set with multi-level storage
   */
  async set(key, data, options = {}) {
    const config = {
      ttl: options.ttl || this.config.defaultTTL,
      strategy: options.strategy || 'default',
      compress: options.compress !== false && this.config.enableCompression,
      version: options.version || this.getNextVersion(key),
      metadata: options.metadata || {}
    }
    
    try {
      let processedData = data
      
      // Compress data if enabled and beneficial
      if (config.compress && this.shouldCompress(data)) {
        processedData = await this.compressData(data)
        config.metadata.compressed = true
      }
      
      const cacheEntry = {
        key,
        data: processedData,
        timestamp: Date.now(),
        ttl: config.ttl,
        strategy: config.strategy,
        version: config.version,
        metadata: config.metadata,
        size: this.calculateSize(processedData)
      }
      
      // Store in all enabled cache levels
      const promises = []
      
      if (this.config.enableMemoryCache) {
        promises.push(this.setInMemory(key, processedData, cacheEntry))
      }
      
      if (this.config.enableIndexedDB) {
        promises.push(this.setInIndexedDB(key, processedData, cacheEntry))
      }
      
      if (this.config.enableServiceWorker) {
        promises.push(this.setInServiceWorker(key, processedData, cacheEntry))
      }
      
      await Promise.all(promises)
      
      // Update version tracking
      this.cacheVersions.set(key, config.version)
      
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Memory cache operations
   */
  getFromMemory(key) {
    const entry = this.memoryCache.get(key)
    if (!entry) return null
    
    // Check expiration
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.memoryCache.delete(key)
      this.memoryCacheSize -= entry.size
      return null
    }
    
    // Update access time for LRU
    entry.lastAccessed = Date.now()
    
    return entry
  }

  setInMemory(key, data, options) {
    const entry = {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      ttl: options.ttl || this.config.defaultTTL,
      size: this.calculateSize(data),
      ...options
    }
    
    // Check memory limit
    if (this.memoryCacheSize + entry.size > this.config.memoryLimit) {
      this.evictMemoryCache()
    }
    
    this.memoryCache.set(key, entry)
    this.memoryCacheSize += entry.size
  }

  /**
   * IndexedDB cache operations
   */
  async getFromIndexedDB(key) {
    if (!this.db) return null
    
    try {
      const transaction = this.db.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)
      
      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      if (!result) return null
      
      // Check expiration
      if (Date.now() > result.timestamp + result.ttl) {
        await this.deleteFromIndexedDB(key)
        return null
      }
      
      // Decompress if needed
      let data = result.data
      if (result.metadata?.compressed) {
        data = await this.decompressData(data)
      }
      
      return { data, ...result }
      
    } catch (error) {
      console.error('IndexedDB get error:', error)
      return null
    }
  }

  async setInIndexedDB(key, data, options) {
    if (!this.db) return
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      
      const entry = {
        key,
        data,
        timestamp: Date.now(),
        ...options
      }
      
      await new Promise((resolve, reject) => {
        const request = store.put(entry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      
    } catch (error) {
      console.error('IndexedDB set error:', error)
    }
  }

  async deleteFromIndexedDB(key) {
    if (!this.db) return
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      await store.delete(key)
    } catch (error) {
      console.error('IndexedDB delete error:', error)
    }
  }

  /**
   * Service Worker cache operations
   */
  async getFromServiceWorker(key) {
    if (!this.config.enableServiceWorker) return null
    
    try {
      const response = await this.sendMessageToServiceWorker({
        type: 'GET_CACHE',
        key
      })
      
      return response?.data || null
      
    } catch (error) {
      console.error('Service Worker get error:', error)
      return null
    }
  }

  async setInServiceWorker(key, data, options) {
    if (!this.config.enableServiceWorker) return
    
    try {
      await this.sendMessageToServiceWorker({
        type: 'SET_CACHE',
        key,
        data,
        options
      })
      
    } catch (error) {
      console.error('Service Worker set error:', error)
    }
  }

  sendMessageToServiceWorker(message) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data)
        }
      }
      
      navigator.serviceWorker.controller?.postMessage(message, [messageChannel.port2])
    })
  }

  /**
   * Cache strategy execution
   */
  async executeStrategy(strategy, key, fetchFunction, options = {}) {
    const strategyImpl = this.cacheStrategies.get(strategy)
    if (!strategyImpl) {
      throw new Error(`Unknown cache strategy: ${strategy}`)
    }
    
    return await strategyImpl.execute(key, fetchFunction, options)
  }

  /**
   * Compression operations
   */
  shouldCompress(data) {
    const size = this.calculateSize(data)
    return size > 1024 && // Only compress data > 1KB
           (typeof data === 'string' || typeof data === 'object')
  }

  async compressData(data) {
    if (!this.compressionWorker) {
      return data // Fallback to uncompressed
    }
    
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      const handler = (event) => {
        if (event.data.id === id) {
          this.compressionWorker.removeEventListener('message', handler)
          resolve(event.data.compressed || data)
        }
      }
      
      this.compressionWorker.addEventListener('message', handler)
      this.compressionWorker.postMessage({
        id,
        action: 'compress',
        data: typeof data === 'string' ? data : JSON.stringify(data)
      })
    })
  }

  async decompressData(compressedData) {
    if (!this.compressionWorker) {
      return compressedData
    }
    
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      const handler = (event) => {
        if (event.data.id === id) {
          this.compressionWorker.removeEventListener('message', handler)
          const decompressed = event.data.decompressed || compressedData
          
          try {
            resolve(JSON.parse(decompressed))
          } catch {
            resolve(decompressed)
          }
        }
      }
      
      this.compressionWorker.addEventListener('message', handler)
      this.compressionWorker.postMessage({
        id,
        action: 'decompress',
        data: compressedData
      })
    })
  }

  /**
   * Cache maintenance
   */
  setupCacheMaintenance() {
    // Periodic cleanup
    setInterval(() => {
      this.performMaintenance()
    }, 60 * 1000) // Every minute
    
    // Memory pressure handling
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory
        const usage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
        
        if (usage > 0.8) {
          this.handleMemoryPressure()
        }
      }, 10 * 1000) // Every 10 seconds
    }
    
    console.log('🧹 Cache maintenance scheduled')
  }

  async performMaintenance() {
    // Clean expired entries
    await this.cleanExpiredEntries()
    
    // Optimize memory usage
    this.optimizeMemoryUsage()
    
    // Update statistics
    this.updateCacheStatistics()
  }

  async cleanExpiredEntries() {
    const now = Date.now()
    
    // Clean memory cache
    const memoryKeysToDelete = []
    this.memoryCache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        memoryKeysToDelete.push(key)
      }
    })
    
    memoryKeysToDelete.forEach(key => {
      const entry = this.memoryCache.get(key)
      this.memoryCache.delete(key)
      this.memoryCacheSize -= entry.size
    })
    
    // Clean IndexedDB cache
    if (this.config.enableIndexedDB && this.db) {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite')
        const store = transaction.objectStore('cache')
        const index = store.index('timestamp')
        
        const range = IDBKeyRange.upperBound(now - this.config.defaultTTL)
        const request = index.openCursor(range)
        
        request.onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          }
        }
      } catch (error) {
        console.error('IndexedDB cleanup error:', error)
      }
    }
  }

  evictMemoryCache() {
    // LRU eviction
    const entries = Array.from(this.memoryCache.entries())
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25)
    
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i]
      this.memoryCache.delete(key)
      this.memoryCacheSize -= entry.size
    }
  }

  handleMemoryPressure() {
    console.warn('🔥 Memory pressure detected, performing aggressive cleanup')
    
    // More aggressive eviction
    const entries = Array.from(this.memoryCache.entries())
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    // Remove oldest 50% of entries
    const toRemove = Math.ceil(entries.length * 0.5)
    
    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i]
      this.memoryCache.delete(key)
      this.memoryCacheSize -= entry.size
    }
  }

  /**
   * Performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!this.config.enableMetrics) return
    
    // Log cache performance periodically
    setInterval(() => {
      this.logCachePerformance()
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  updateResponseTimeMetric(startTime) {
    const responseTime = Date.now() - startTime
    this.cacheStats.averageResponseTime = 
      (this.cacheStats.averageResponseTime + responseTime) / 2
  }

  logCachePerformance() {
    const hitRate = this.calculateHitRate()
    const memoryUsage = (this.memoryCacheSize / this.config.memoryLimit * 100).toFixed(1)
    
    console.log(`📊 Cache Performance:
      Hit Rate: ${hitRate.toFixed(1)}%
      Memory Usage: ${memoryUsage}%
      Avg Response Time: ${this.cacheStats.averageResponseTime.toFixed(1)}ms
      Total Requests: ${this.cacheStats.totalRequests}`)
  }

  /**
   * Utility methods
   */
  calculateSize(data) {
    if (typeof data === 'string') {
      return data.length * 2 // Approximate UTF-16 size
    }
    if (typeof data === 'object') {
      return JSON.stringify(data).length * 2
    }
    return 100 // Default size estimate
  }

  calculateHitRate() {
    const totalHits = this.cacheStats.memoryHits + 
                     this.cacheStats.indexedDBHits + 
                     this.cacheStats.serviceWorkerHits
    
    return this.cacheStats.totalRequests > 0 
      ? (totalHits / this.cacheStats.totalRequests) * 100 
      : 0
  }

  getNextVersion(key) {
    const current = this.cacheVersions.get(key) || 0
    return current + 1
  }

  updateCacheStatistics() {
    // Calculate derived metrics
    this.cacheStats.hitRate = this.calculateHitRate()
    this.cacheStats.memoryUsagePercent = 
      (this.memoryCacheSize / this.config.memoryLimit) * 100
  }

  // API methods
  async clear(pattern = null) {
    if (pattern) {
      await this.clearPattern(pattern)
    } else {
      await this.clearAll()
    }
  }

  async clearPattern(pattern) {
    const regex = new RegExp(pattern)
    
    // Clear from memory cache
    const keysToDelete = []
    this.memoryCache.forEach((entry, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      const entry = this.memoryCache.get(key)
      this.memoryCache.delete(key)
      this.memoryCacheSize -= entry.size
    })
    
    // Clear from IndexedDB
    if (this.config.enableIndexedDB && this.db) {
      // Implementation would iterate through IndexedDB entries
    }
  }

  async clearAll() {
    // Clear memory cache
    this.memoryCache.clear()
    this.memoryCacheSize = 0
    
    // Clear IndexedDB
    if (this.config.enableIndexedDB && this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      await store.clear()
    }
    
    // Clear Service Worker cache
    if (this.config.enableServiceWorker) {
      await this.sendMessageToServiceWorker({ type: 'CLEAR_CACHE' })
    }
    
    console.log('🧹 All caches cleared')
  }

  getCacheStats() {
    return {
      ...this.cacheStats,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.memoryCacheSize,
      memoryUsagePercent: (this.memoryCacheSize / this.config.memoryLimit) * 100,
      entriesCount: this.memoryCache.size
    }
  }

  getCacheInfo() {
    return {
      config: this.config,
      stats: this.getCacheStats(),
      strategies: Array.from(this.cacheStrategies.keys()),
      versions: Object.fromEntries(this.cacheVersions)
    }
  }

  async exportCache() {
    const memoryEntries = Object.fromEntries(this.memoryCache)
    
    return {
      memory: memoryEntries,
      stats: this.getCacheStats(),
      timestamp: new Date().toISOString()
    }
  }

  stop() {
    if (this.compressionWorker) {
      this.compressionWorker.terminate()
    }
    
    this.memoryCache.clear()
    this.memoryCacheSize = 0
    
    if (this.db) {
      this.db.close()
    }
    
    this.isInitialized = false
    console.log('🛑 Advanced Caching Service stopped')
  }
}

export const cachingService = new CachingService()
export default cachingService