/**
 * Enterprise Performance Optimization Service
 * Handles large datasets, efficient search, memory management, and background sync
 */

import { openDB } from 'idb'
import useFitnessStore from '../store/fitnessStore.js'

export class PerformanceService {
  constructor() {
    this.searchIndexes = new Map()
    this.dataCache = new Map()
    this.backgroundTasks = new Map()
    this.memoryMonitor = null
    this.performanceMetrics = {
      searchQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      backgroundSyncs: 0,
      memoryUsage: 0,
      queryTimes: []
    }
    this.isInitialized = false
    this.workerPool = []
    this.maxCacheSize = 100 * 1024 * 1024 // 100MB
    this.indexDB = null
  }

  /**
   * Initialize performance service
   */
  async initialize(config = {}) {
    console.log('⚡ Initializing Performance Service')
    
    this.config = {
      enableIndexing: config.enableIndexing !== false,
      enableCaching: config.enableCaching !== false,
      enableBackgroundSync: config.enableBackgroundSync !== false,
      maxWorkers: config.maxWorkers || 4,
      cacheSize: config.cacheSize || this.maxCacheSize,
      indexUpdateInterval: config.indexUpdateInterval || 30000, // 30 seconds
      memoryCheckInterval: config.memoryCheckInterval || 60000, // 1 minute
      syncInterval: config.syncInterval || 300000, // 5 minutes
      virtualScrollThreshold: config.virtualScrollThreshold || 100,
      ...config
    }

    // Initialize IndexedDB for performance data
    await this.initializePerformanceDB()
    
    // Setup search indexes
    if (this.config.enableIndexing) {
      await this.initializeSearchIndexes()
    }
    
    // Setup caching
    if (this.config.enableCaching) {
      this.initializeCache()
    }
    
    // Setup memory monitoring
    this.startMemoryMonitoring()
    
    // Setup background sync
    if (this.config.enableBackgroundSync) {
      this.initializeBackgroundSync()
    }
    
    // Setup worker pool
    await this.initializeWorkerPool()
    
    // Setup data change listeners
    this.setupDataChangeListeners()

    this.isInitialized = true
    console.log('✅ Performance Service initialized')
    
    return true
  }

  /**
   * Initialize performance database
   */
  async initializePerformanceDB() {
    this.indexDB = await openDB('fitness-performance-db', 2, {
      upgrade(db, oldVersion, newVersion) {
        // Search indexes store
        if (!db.objectStoreNames.contains('search-indexes')) {
          const indexStore = db.createObjectStore('search-indexes', { keyPath: 'id' })
          indexStore.createIndex('type', 'type')
          indexStore.createIndex('lastUpdated', 'lastUpdated')
        }

        // Performance metrics store
        if (!db.objectStoreNames.contains('performance-metrics')) {
          const metricsStore = db.createObjectStore('performance-metrics', { keyPath: 'id' })
          metricsStore.createIndex('timestamp', 'timestamp')
          metricsStore.createIndex('type', 'type')
        }

        // Background sync queue
        if (!db.objectStoreNames.contains('sync-queue')) {
          const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' })
          syncStore.createIndex('priority', 'priority')
          syncStore.createIndex('createdAt', 'createdAt')
        }
      }
    })
  }

  /**
   * Initialize search indexes
   */
  async initializeSearchIndexes() {
    console.log('🔍 Building search indexes...')
    
    const fitnessData = useFitnessStore.getState()
    
    // Build nutrition index
    if (fitnessData.nutrition?.meals) {
      await this.buildSearchIndex('nutrition', fitnessData.nutrition.meals, [
        'name', 'brand', 'category', 'ingredients'
      ])
    }
    
    // Build activity index
    if (fitnessData.activity?.workouts) {
      await this.buildSearchIndex('activity', fitnessData.activity.workouts, [
        'name', 'type', 'muscle_groups', 'equipment'
      ])
    }
    
    // Build food database index
    await this.buildFoodDatabaseIndex()
    
    // Start periodic index updates
    setInterval(() => {
      this.updateSearchIndexes()
    }, this.config.indexUpdateInterval)
  }

  /**
   * Build search index for a data type
   */
  async buildSearchIndex(type, data, searchFields) {
    const startTime = performance.now()
    const index = new Map()
    
    data.forEach((item, itemIndex) => {
      searchFields.forEach(field => {
        if (item[field]) {
          const words = this.extractSearchTerms(item[field].toString())
          words.forEach(word => {
            if (!index.has(word)) {
              index.set(word, new Set())
            }
            index.get(word).add(itemIndex)
          })
        }
      })
    })
    
    // Convert Sets to Arrays for storage
    const serializedIndex = {}
    index.forEach((indices, word) => {
      serializedIndex[word] = Array.from(indices)
    })
    
    this.searchIndexes.set(type, {
      index: serializedIndex,
      data,
      lastUpdated: Date.now(),
      buildTime: performance.now() - startTime,
      size: Object.keys(serializedIndex).length
    })
    
    // Store in IndexedDB
    await this.indexDB.put('search-indexes', {
      id: type,
      type,
      index: serializedIndex,
      lastUpdated: Date.now(),
      buildTime: performance.now() - startTime,
      size: Object.keys(serializedIndex).length
    })
    
    console.log(`✅ Built ${type} search index: ${Object.keys(serializedIndex).length} terms in ${Math.round(performance.now() - startTime)}ms`)
  }

  /**
   * Build food database index
   */
  async buildFoodDatabaseIndex() {
    // This would build an index of common foods for quick lookup
    // For now, we'll create a mock food database
    const commonFoods = [
      { name: 'Apple', category: 'Fruit', calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
      { name: 'Banana', category: 'Fruit', calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
      { name: 'Chicken Breast', category: 'Protein', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      { name: 'Rice', category: 'Grain', calories: 205, protein: 4.3, carbs: 45, fats: 0.4 },
      { name: 'Broccoli', category: 'Vegetable', calories: 55, protein: 3.7, carbs: 11, fats: 0.6 }
    ]
    
    await this.buildSearchIndex('foods', commonFoods, ['name', 'category'])
  }

  /**
   * Extract search terms from text
   */
  extractSearchTerms(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2) // Ignore short words
      .concat(this.generateNGrams(text, 2)) // Add bigrams
  }

  /**
   * Generate n-grams from text
   */
  generateNGrams(text, n) {
    const words = text.toLowerCase().split(/\s+/)
    const ngrams = []
    
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '))
    }
    
    return ngrams
  }

  /**
   * Initialize cache
   */
  initializeCache() {
    this.dataCache = new Map()
    
    // Setup cache cleanup
    setInterval(() => {
      this.cleanupCache()
    }, 60000) // Every minute
  }

  /**
   * Perform efficient search
   */
  async performSearch(query, type, options = {}) {
    const startTime = performance.now()
    this.performanceMetrics.searchQueries++
    
    try {
      // Check cache first
      const cacheKey = `search:${type}:${query}:${JSON.stringify(options)}`
      if (this.dataCache.has(cacheKey)) {
        this.performanceMetrics.cacheHits++
        const cached = this.dataCache.get(cacheKey)
        
        // Update cache access time
        cached.lastAccessed = Date.now()
        
        console.log(`🎯 Cache hit for search: "${query}" (${Math.round(performance.now() - startTime)}ms)`)
        return cached.data
      }
      
      this.performanceMetrics.cacheMisses++
      
      // Perform search using index
      const results = await this.searchWithIndex(query, type, options)
      
      // Cache results
      this.cacheSearchResults(cacheKey, results)
      
      const searchTime = performance.now() - startTime
      this.performanceMetrics.queryTimes.push(searchTime)
      
      // Keep only last 100 query times
      if (this.performanceMetrics.queryTimes.length > 100) {
        this.performanceMetrics.queryTimes.shift()
      }
      
      console.log(`🔍 Search completed: "${query}" (${Math.round(searchTime)}ms, ${results.length} results)`)
      
      return results
      
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }

  /**
   * Search using built indexes
   */
  async searchWithIndex(query, type, options) {
    const searchIndex = this.searchIndexes.get(type)
    if (!searchIndex) {
      console.warn(`No search index found for type: ${type}`)
      return []
    }
    
    const queryTerms = this.extractSearchTerms(query)
    const matchingIndices = new Set()
    
    // Find all items that match any query term
    queryTerms.forEach(term => {
      if (searchIndex.index[term]) {
        searchIndex.index[term].forEach(index => {
          matchingIndices.add(index)
        })
      }
    })
    
    // Get actual items and calculate relevance scores
    const results = Array.from(matchingIndices)
      .map(index => {
        const item = searchIndex.data[index]
        const score = this.calculateRelevanceScore(item, queryTerms, type)
        return { item, score, index }
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
    
    // Apply options
    let filteredResults = results
    
    if (options.limit) {
      filteredResults = filteredResults.slice(0, options.limit)
    }
    
    if (options.minScore) {
      filteredResults = filteredResults.filter(r => r.score >= options.minScore)
    }
    
    return filteredResults.map(r => r.item)
  }

  /**
   * Calculate relevance score
   */
  calculateRelevanceScore(item, queryTerms, type) {
    let score = 0
    const itemText = this.getSearchableText(item, type).toLowerCase()
    
    queryTerms.forEach(term => {
      const termCount = (itemText.match(new RegExp(term, 'g')) || []).length
      
      if (termCount > 0) {
        score += termCount
        
        // Boost score for exact matches
        if (itemText.includes(term)) {
          score += 2
        }
        
        // Boost score for name matches
        if (item.name && item.name.toLowerCase().includes(term)) {
          score += 5
        }
      }
    })
    
    return score
  }

  /**
   * Get searchable text from item
   */
  getSearchableText(item, type) {
    const searchableFields = {
      nutrition: ['name', 'brand', 'category', 'ingredients'],
      activity: ['name', 'type', 'muscle_groups', 'equipment'],
      foods: ['name', 'category', 'brand']
    }
    
    const fields = searchableFields[type] || ['name']
    
    return fields
      .map(field => item[field] || '')
      .join(' ')
  }

  /**
   * Cache search results
   */
  cacheSearchResults(key, data) {
    const cacheEntry = {
      data,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
      size: this.estimateSize(data)
    }
    
    // Check cache size limits
    if (this.getCurrentCacheSize() + cacheEntry.size > this.config.cacheSize) {
      this.evictCacheEntries()
    }
    
    this.dataCache.set(key, cacheEntry)
  }

  /**
   * Estimate object size in bytes
   */
  estimateSize(obj) {
    return JSON.stringify(obj).length * 2 // Rough estimate
  }

  /**
   * Get current cache size
   */
  getCurrentCacheSize() {
    let totalSize = 0
    this.dataCache.forEach(entry => {
      totalSize += entry.size
    })
    return totalSize
  }

  /**
   * Evict cache entries using LRU strategy
   */
  evictCacheEntries() {
    const entries = Array.from(this.dataCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25)
    
    for (let i = 0; i < toRemove; i++) {
      this.dataCache.delete(entries[i][0])
    }
    
    console.log(`🧹 Evicted ${toRemove} cache entries`)
  }

  /**
   * Cleanup cache
   */
  cleanupCache() {
    const now = Date.now()
    const maxAge = 30 * 60 * 1000 // 30 minutes
    
    for (const [key, entry] of this.dataCache.entries()) {
      if (now - entry.lastAccessed > maxAge) {
        this.dataCache.delete(key)
      }
    }
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (!('memory' in performance)) {
      console.warn('Memory monitoring not supported in this browser')
      return
    }
    
    this.memoryMonitor = setInterval(() => {
      const memInfo = performance.memory
      this.performanceMetrics.memoryUsage = memInfo.usedJSHeapSize
      
      // Check for memory pressure
      const memoryPressure = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize
      
      if (memoryPressure > 0.9) {
        console.warn('⚠️ High memory usage detected, performing cleanup...')
        this.performMemoryCleanup()
      }
      
    }, this.config.memoryCheckInterval)
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    // Clear cache
    this.dataCache.clear()
    
    // Clear old search indexes
    this.searchIndexes.forEach((index, type) => {
      if (Date.now() - index.lastUpdated > 600000) { // 10 minutes
        this.searchIndexes.delete(type)
      }
    })
    
    // Clear performance metrics history
    this.performanceMetrics.queryTimes = this.performanceMetrics.queryTimes.slice(-50)
    
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc()
    }
    
    console.log('🧹 Memory cleanup completed')
  }

  /**
   * Initialize worker pool
   */
  async initializeWorkerPool() {
    if (!window.Worker) {
      console.warn('Web Workers not supported')
      return
    }
    
    // Create worker pool for heavy computations
    for (let i = 0; i < this.config.maxWorkers; i++) {
      try {
        const worker = new Worker('/workers/dataWorker.js')
        worker.onmessage = this.handleWorkerMessage.bind(this)
        worker.onerror = this.handleWorkerError.bind(this)
        
        this.workerPool.push({
          worker,
          busy: false,
          id: i
        })
      } catch (error) {
        console.warn('Failed to create worker:', error)
      }
    }
    
    console.log(`👷 Initialized ${this.workerPool.length} workers`)
  }

  /**
   * Get available worker
   */
  getAvailableWorker() {
    return this.workerPool.find(w => !w.busy)
  }

  /**
   * Execute task in worker
   */
  async executeInWorker(task, data) {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker()
      
      if (!worker) {
        // Fallback to main thread
        resolve(this.executeTaskMainThread(task, data))
        return
      }
      
      worker.busy = true
      
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const timeout = setTimeout(() => {
        worker.busy = false
        reject(new Error('Worker task timeout'))
      }, 30000) // 30 second timeout
      
      const messageHandler = (event) => {
        if (event.data.taskId === taskId) {
          clearTimeout(timeout)
          worker.busy = false
          worker.worker.removeEventListener('message', messageHandler)
          
          if (event.data.error) {
            reject(new Error(event.data.error))
          } else {
            resolve(event.data.result)
          }
        }
      }
      
      worker.worker.addEventListener('message', messageHandler)
      
      worker.worker.postMessage({
        taskId,
        task,
        data
      })
    })
  }

  /**
   * Execute task in main thread (fallback)
   */
  executeTaskMainThread(task, data) {
    switch (task) {
      case 'buildIndex':
        return this.buildSearchIndexMainThread(data)
      case 'processLargeDataset':
        return this.processLargeDatasetMainThread(data)
      default:
        throw new Error(`Unknown task: ${task}`)
    }
  }

  /**
   * Initialize background sync
   */
  initializeBackgroundSync() {
    // Register service worker for background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('📱 Service Worker registered for background sync')
      }).catch(error => {
        console.warn('Service Worker registration failed:', error)
      })
    }
    
    // Fallback: Use interval-based sync
    setInterval(() => {
      this.performBackgroundSync()
    }, this.config.syncInterval)
    
    // Setup online/offline listeners
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored, performing sync...')
      this.performBackgroundSync()
    })
    
    window.addEventListener('offline', () => {
      console.log('📴 Connection lost, queuing sync tasks...')
    })
  }

  /**
   * Perform background sync
   */
  async performBackgroundSync() {
    if (!navigator.onLine) {
      console.log('📴 Offline, skipping sync')
      return
    }
    
    this.performanceMetrics.backgroundSyncs++
    
    try {
      // Sync queued tasks
      const syncTasks = await this.indexDB.getAll('sync-queue')
      
      for (const task of syncTasks) {
        try {
          await this.executeSyncTask(task)
          await this.indexDB.delete('sync-queue', task.id)
        } catch (error) {
          console.error(`Sync task failed: ${task.id}`, error)
          
          // Update retry count
          task.retryCount = (task.retryCount || 0) + 1
          if (task.retryCount < 3) {
            await this.indexDB.put('sync-queue', task)
          } else {
            console.error(`Sync task failed after 3 retries: ${task.id}`)
            await this.indexDB.delete('sync-queue', task.id)
          }
        }
      }
      
      // Update search indexes in background
      await this.updateSearchIndexes()
      
    } catch (error) {
      console.error('Background sync failed:', error)
    }
  }

  /**
   * Execute sync task
   */
  async executeSyncTask(task) {
    switch (task.type) {
      case 'backup':
        // Sync with backup service
        break
      case 'analytics':
        // Sync analytics data
        break
      case 'export':
        // Process export request
        break
      default:
        console.warn(`Unknown sync task type: ${task.type}`)
    }
  }

  /**
   * Queue background sync task
   */
  async queueSyncTask(type, data, priority = 'normal') {
    const task = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority,
      createdAt: Date.now(),
      retryCount: 0
    }
    
    await this.indexDB.add('sync-queue', task)
    
    // Trigger immediate sync for high priority tasks
    if (priority === 'high' && navigator.onLine) {
      setTimeout(() => this.performBackgroundSync(), 100)
    }
  }

  /**
   * Setup data change listeners
   */
  setupDataChangeListeners() {
    // Listen for data changes to update indexes
    if (typeof window !== 'undefined') {
      window.addEventListener('meal-logged', () => {
        this.scheduleIndexUpdate('nutrition')
      })
      
      window.addEventListener('workout-completed', () => {
        this.scheduleIndexUpdate('activity')
      })
      
      // Listen for large data operations
      window.addEventListener('data-import', (event) => {
        this.handleLargeDataOperation(event.detail)
      })
    }
  }

  /**
   * Schedule index update
   */
  scheduleIndexUpdate(type) {
    // Debounce index updates
    if (this.indexUpdateTimeouts) {
      clearTimeout(this.indexUpdateTimeouts[type])
    } else {
      this.indexUpdateTimeouts = {}
    }
    
    this.indexUpdateTimeouts[type] = setTimeout(() => {
      this.updateSearchIndex(type)
    }, 5000) // 5 second delay
  }

  /**
   * Update search indexes
   */
  async updateSearchIndexes() {
    const fitnessData = useFitnessStore.getState()
    
    // Update nutrition index
    if (fitnessData.nutrition?.meals) {
      await this.buildSearchIndex('nutrition', fitnessData.nutrition.meals, [
        'name', 'brand', 'category', 'ingredients'
      ])
    }
    
    // Update activity index
    if (fitnessData.activity?.workouts) {
      await this.buildSearchIndex('activity', fitnessData.activity.workouts, [
        'name', 'type', 'muscle_groups', 'equipment'
      ])
    }
  }

  /**
   * Update specific search index
   */
  async updateSearchIndex(type) {
    const fitnessData = useFitnessStore.getState()
    
    switch (type) {
      case 'nutrition':
        if (fitnessData.nutrition?.meals) {
          await this.buildSearchIndex('nutrition', fitnessData.nutrition.meals, [
            'name', 'brand', 'category', 'ingredients'
          ])
        }
        break
      case 'activity':
        if (fitnessData.activity?.workouts) {
          await this.buildSearchIndex('activity', fitnessData.activity.workouts, [
            'name', 'type', 'muscle_groups', 'equipment'
          ])
        }
        break
    }
  }

  /**
   * Handle large data operations
   */
  async handleLargeDataOperation(operation) {
    console.log(`📊 Handling large data operation: ${operation.type}`)
    
    try {
      // Use worker for heavy processing
      const result = await this.executeInWorker('processLargeDataset', operation.data)
      
      // Update indexes after large data changes
      await this.updateSearchIndexes()
      
      // Clear cache to free memory
      this.dataCache.clear()
      
      return result
      
    } catch (error) {
      console.error('Large data operation failed:', error)
      throw error
    }
  }

  /**
   * Implement virtual scrolling for large datasets
   */
  createVirtualScroller(containerId, data, itemRenderer, itemHeight = 50) {
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`Container not found: ${containerId}`)
      return null
    }
    
    const totalHeight = data.length * itemHeight
    const visibleHeight = container.clientHeight
    const visibleItems = Math.ceil(visibleHeight / itemHeight) + 2 // Buffer
    
    let scrollTop = 0
    let startIndex = 0
    
    // Create virtual scroll container
    const scrollContainer = document.createElement('div')
    scrollContainer.style.height = `${totalHeight}px`
    scrollContainer.style.position = 'relative'
    scrollContainer.style.overflow = 'auto'
    
    const viewport = document.createElement('div')
    viewport.style.position = 'absolute'
    viewport.style.top = '0'
    viewport.style.left = '0'
    viewport.style.right = '0'
    scrollContainer.appendChild(viewport)
    
    const updateViewport = () => {
      startIndex = Math.floor(scrollTop / itemHeight)
      const endIndex = Math.min(startIndex + visibleItems, data.length)
      
      viewport.style.transform = `translateY(${startIndex * itemHeight}px)`
      viewport.innerHTML = ''
      
      for (let i = startIndex; i < endIndex; i++) {
        const itemElement = itemRenderer(data[i], i)
        itemElement.style.height = `${itemHeight}px`
        viewport.appendChild(itemElement)
      }
    }
    
    scrollContainer.addEventListener('scroll', (e) => {
      scrollTop = e.target.scrollTop
      updateViewport()
    })
    
    container.appendChild(scrollContainer)
    updateViewport()
    
    return {
      scrollTo: (index) => {
        scrollContainer.scrollTop = index * itemHeight
      },
      refresh: () => updateViewport(),
      destroy: () => container.removeChild(scrollContainer)
    }
  }

  /**
   * Optimize data queries with pagination
   */
  async queryDataPaginated(type, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc',
      filters = {}
    } = options
    
    const fitnessData = useFitnessStore.getState()
    let data = []
    
    switch (type) {
      case 'nutrition':
        data = fitnessData.nutrition?.meals || []
        break
      case 'activity':
        data = fitnessData.activity?.workouts || []
        break
      case 'wellness':
        data = fitnessData.wellness?.sleepEntries || []
        break
      default:
        throw new Error(`Unknown data type: ${type}`)
    }
    
    // Apply filters
    let filteredData = data
    Object.keys(filters).forEach(key => {
      const filterValue = filters[key]
      filteredData = filteredData.filter(item => {
        if (typeof filterValue === 'string') {
          return item[key]?.toString().toLowerCase().includes(filterValue.toLowerCase())
        }
        return item[key] === filterValue
      })
    })
    
    // Sort data
    filteredData.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }
      
      if (sortOrder === 'desc') {
        return bVal - aVal
      }
      return aVal - bVal
    })
    
    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filteredData.slice(startIndex, endIndex)
    
    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
        hasNext: endIndex < filteredData.length,
        hasPrev: page > 1
      }
    }
  }

  // Worker message handlers

  handleWorkerMessage(event) {
    // Handle worker responses
    console.log('Worker message received:', event.data)
  }

  handleWorkerError(error) {
    console.error('Worker error:', error)
  }

  // Main thread implementations (fallbacks)

  buildSearchIndexMainThread(data) {
    // Fallback implementation for when workers aren't available
    return this.buildSearchIndex(data.type, data.items, data.fields)
  }

  processLargeDatasetMainThread(data) {
    // Process large dataset in chunks to avoid blocking UI
    return new Promise((resolve) => {
      const processChunk = (index = 0) => {
        const chunkSize = 100
        const chunk = data.slice(index, index + chunkSize)
        
        // Process chunk
        chunk.forEach(item => {
          // Process item
        })
        
        if (index + chunkSize < data.length) {
          // Schedule next chunk
          setTimeout(() => processChunk(index + chunkSize), 10)
        } else {
          resolve('completed')
        }
      }
      
      processChunk()
    })
  }

  // API methods

  getPerformanceMetrics() {
    const avgQueryTime = this.performanceMetrics.queryTimes.length > 0
      ? this.performanceMetrics.queryTimes.reduce((sum, time) => sum + time, 0) / this.performanceMetrics.queryTimes.length
      : 0
    
    return {
      ...this.performanceMetrics,
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
      cacheSize: this.dataCache.size,
      indexCount: this.searchIndexes.size,
      workerCount: this.workerPool.length,
      availableWorkers: this.workerPool.filter(w => !w.busy).length
    }
  }

  clearCache() {
    this.dataCache.clear()
    console.log('🧹 Cache cleared')
  }

  async rebuildIndexes() {
    console.log('🔄 Rebuilding all search indexes...')
    this.searchIndexes.clear()
    await this.initializeSearchIndexes()
  }

  stop() {
    // Clear intervals
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor)
    }
    
    // Terminate workers
    this.workerPool.forEach(worker => {
      worker.worker.terminate()
    })
    
    // Clear cache and indexes
    this.dataCache.clear()
    this.searchIndexes.clear()
    
    this.isInitialized = false
    console.log('🛑 Performance Service stopped')
  }
}

// Export singleton instance
export const performanceService = new PerformanceService()
export default performanceService