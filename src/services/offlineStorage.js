import { openDB } from 'idb'

/**
 * Enhanced Offline Storage Service for PWA
 * Provides comprehensive offline data storage with sync capabilities
 */
class OfflineStorage {
  constructor() {
    this.dbName = 'FitnessTrackerPWA'
    this.dbVersion = 4
    this.db = null
    this.syncQueue = []
    this.isOnline = navigator.onLine
    
    this.initializeDatabase()
    this.setupOnlineDetection()
  }

  /**
   * Initialize IndexedDB with enhanced schema
   */
  async initializeDatabase() {
    try {
      this.db = await openDB(this.dbName, this.dbVersion, {
        upgrade: (db, oldVersion, newVersion, transaction) => {
          console.log(`📚 Upgrading database from v${oldVersion} to v${newVersion}`)
          
          // User data and settings
          if (!db.objectStoreNames.contains('userProfile')) {
            const userStore = db.createObjectStore('userProfile', { keyPath: 'id' })
            userStore.createIndex('lastUpdated', 'lastUpdated')
          }

          // Nutrition data with enhanced offline support
          if (!db.objectStoreNames.contains('meals')) {
            const mealStore = db.createObjectStore('meals', { keyPath: 'id' })
            mealStore.createIndex('date', 'date')
            mealStore.createIndex('mealType', 'mealType')
            mealStore.createIndex('synced', 'synced')
            mealStore.createIndex('offline', 'offline')
          }

          // Food database for offline barcode scanning
          if (!db.objectStoreNames.contains('foodDatabase')) {
            const foodStore = db.createObjectStore('foodDatabase', { keyPath: 'barcode' })
            foodStore.createIndex('name', 'name')
            foodStore.createIndex('brand', 'brand')
            foodStore.createIndex('category', 'category')
            foodStore.createIndex('lastAccessed', 'lastAccessed')
            foodStore.createIndex('source', 'source')
          }

          // Workout and activity data
          if (!db.objectStoreNames.contains('workouts')) {
            const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' })
            workoutStore.createIndex('date', 'date')
            workoutStore.createIndex('type', 'type')
            workoutStore.createIndex('synced', 'synced')
          }

          // Exercise database
          if (!db.objectStoreNames.contains('exercises')) {
            const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' })
            exerciseStore.createIndex('name', 'name')
            exerciseStore.createIndex('category', 'category')
            exerciseStore.createIndex('muscleGroup', 'muscleGroup')
          }

          // Sleep tracking data
          if (!db.objectStoreNames.contains('sleepEntries')) {
            const sleepStore = db.createObjectStore('sleepEntries', { keyPath: 'id' })
            sleepStore.createIndex('date', 'date', { unique: true })
            sleepStore.createIndex('sleepScore', 'sleepScore')
            sleepStore.createIndex('synced', 'synced')
          }

          // Body measurements and photos
          if (!db.objectStoreNames.contains('measurements')) {
            const measurementStore = db.createObjectStore('measurements', { keyPath: 'id' })
            measurementStore.createIndex('type', 'type')
            measurementStore.createIndex('date', 'date')
            measurementStore.createIndex('synced', 'synced')
          }

          if (!db.objectStoreNames.contains('photos')) {
            const photoStore = db.createObjectStore('photos', { keyPath: 'id' })
            photoStore.createIndex('date', 'date')
            photoStore.createIndex('type', 'type')
            photoStore.createIndex('synced', 'synced')
          }

          // Wellness data
          if (!db.objectStoreNames.contains('wellnessEntries')) {
            const wellnessStore = db.createObjectStore('wellnessEntries', { keyPath: 'id' })
            wellnessStore.createIndex('date', 'date')
            wellnessStore.createIndex('type', 'type')
            wellnessStore.createIndex('synced', 'synced')
          }

          // Sync queue for offline operations
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
            syncStore.createIndex('type', 'type')
            syncStore.createIndex('priority', 'priority')
            syncStore.createIndex('timestamp', 'timestamp')
            syncStore.createIndex('retryCount', 'retryCount')
          }

          // App settings and cache
          if (!db.objectStoreNames.contains('appSettings')) {
            const settingsStore = db.createObjectStore('appSettings', { keyPath: 'key' })
          }

          // Notification schedules
          if (!db.objectStoreNames.contains('notifications')) {
            const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' })
            notificationStore.createIndex('scheduledTime', 'scheduledTime')
            notificationStore.createIndex('type', 'type')
            notificationStore.createIndex('active', 'active')
          }

          // Image cache for offline access
          if (!db.objectStoreNames.contains('imageCache')) {
            const imageStore = db.createObjectStore('imageCache', { keyPath: 'url' })
            imageStore.createIndex('lastAccessed', 'lastAccessed')
            imageStore.createIndex('size', 'size')
          }
        }
      })

      console.log('📚 Offline database initialized successfully')
      await this.preloadEssentialData()
    } catch (error) {
      console.error('📚 Database initialization failed:', error)
      throw error
    }
  }

  /**
   * Preload essential data for offline use
   */
  async preloadEssentialData() {
    try {
      // Preload common foods database
      await this.preloadCommonFoods()
      
      // Preload exercise database
      await this.preloadExerciseDatabase()
      
      console.log('📚 Essential data preloaded')
    } catch (error) {
      console.warn('📚 Failed to preload some essential data:', error)
    }
  }

  /**
   * Preload common foods for offline barcode scanning
   */
  async preloadCommonFoods() {
    const commonFoods = [
      {
        barcode: '3017620422003',
        name: 'Nutella',
        brand: 'Ferrero',
        category: 'Spreads',
        calories: 546,
        protein: 6.3,
        carbs: 57.5,
        fats: 30.9,
        serving_size: '100g',
        source: 'preloaded'
      },
      {
        barcode: '5000112637304',
        name: 'Coca-Cola',
        brand: 'The Coca-Cola Company',
        category: 'Beverages',
        calories: 42,
        protein: 0,
        carbs: 10.6,
        fats: 0,
        serving_size: '100ml',
        source: 'preloaded'
      }
      // Add more common foods...
    ]

    const transaction = this.db.transaction('foodDatabase', 'readwrite')
    const store = transaction.objectStore('foodDatabase')

    for (const food of commonFoods) {
      const existing = await store.get(food.barcode)
      if (!existing) {
        await store.add({
          ...food,
          lastAccessed: new Date().toISOString(),
          preloaded: true
        })
      }
    }
  }

  /**
   * Preload exercise database
   */
  async preloadExerciseDatabase() {
    const commonExercises = [
      {
        id: 'push-ups',
        name: 'Push-ups',
        category: 'Strength',
        muscleGroup: 'Chest',
        description: 'Classic bodyweight exercise',
        instructions: 'Lower body to ground, push back up',
        difficulty: 'Beginner'
      },
      {
        id: 'squats',
        name: 'Squats',
        category: 'Strength',
        muscleGroup: 'Legs',
        description: 'Fundamental leg exercise',
        instructions: 'Lower hips back and down, stand back up',
        difficulty: 'Beginner'
      }
      // Add more exercises...
    ]

    const transaction = this.db.transaction('exercises', 'readwrite')
    const store = transaction.objectStore('exercises')

    for (const exercise of commonExercises) {
      const existing = await store.get(exercise.id)
      if (!existing) {
        await store.add(exercise)
      }
    }
  }

  /**
   * Setup online/offline detection
   */
  setupOnlineDetection() {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored')
      this.isOnline = true
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      console.log('📡 Connection lost - switching to offline mode')
      this.isOnline = false
    })
  }

  /**
   * Save data with offline sync support
   */
  async saveWithSync(storeName, data, syncConfig = {}) {
    try {
      // Add metadata for sync
      const enhancedData = {
        ...data,
        offline: !this.isOnline,
        synced: this.isOnline,
        lastModified: new Date().toISOString(),
        syncPriority: syncConfig.priority || 'normal'
      }

      // Save to local database
      const transaction = this.db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      await store.put(enhancedData)

      // Add to sync queue if offline
      if (!this.isOnline) {
        await this.addToSyncQueue({
          operation: 'create',
          storeName,
          data: enhancedData,
          priority: syncConfig.priority || 'normal',
          endpoint: syncConfig.endpoint
        })
      }

      return enhancedData
    } catch (error) {
      console.error(`Failed to save ${storeName} data:`, error)
      throw error
    }
  }

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue(operation) {
    try {
      const syncItem = {
        ...operation,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3
      }

      const transaction = this.db.transaction('syncQueue', 'readwrite')
      const store = transaction.objectStore('syncQueue')
      await store.add(syncItem)

      console.log('📝 Added to sync queue:', operation.operation, operation.storeName)
    } catch (error) {
      console.error('Failed to add to sync queue:', error)
    }
  }

  /**
   * Process sync queue when online
   */
  async processSyncQueue() {
    if (!this.isOnline) return

    try {
      const transaction = this.db.transaction('syncQueue', 'readwrite')
      const store = transaction.objectStore('syncQueue')
      const queueItems = await store.getAll()

      console.log(`🔄 Processing ${queueItems.length} sync queue items`)

      for (const item of queueItems) {
        try {
          await this.syncItem(item)
          await store.delete(item.id)
        } catch (error) {
          console.error('Sync item failed:', error)
          
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1
          
          if (item.retryCount >= item.maxRetries) {
            console.error('Max retries reached, removing from queue:', item)
            await store.delete(item.id)
          } else {
            await store.put(item)
          }
        }
      }
    } catch (error) {
      console.error('Failed to process sync queue:', error)
    }
  }

  /**
   * Sync individual item
   */
  async syncItem(item) {
    const { operation, storeName, data, endpoint } = item

    if (!endpoint) {
      console.warn('No endpoint specified for sync item:', item)
      return
    }

    const response = await fetch(endpoint, {
      method: operation === 'delete' ? 'DELETE' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
    }

    // Mark as synced in local database
    if (operation !== 'delete') {
      const transaction = this.db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const localData = await store.get(data.id)
      
      if (localData) {
        localData.synced = true
        localData.offline = false
        await store.put(localData)
      }
    }

    console.log('✅ Synced:', operation, storeName, data.id)
  }

  /**
   * Enhanced food search with offline support
   */
  async searchFoods(query, limit = 20) {
    try {
      // First try online search if available
      if (this.isOnline) {
        try {
          const response = await fetch(`/api/food/search?q=${encodeURIComponent(query)}&limit=${limit}`)
          if (response.ok) {
            const results = await response.json()
            
            // Cache results for offline use
            await this.cacheFoodResults(results.foods)
            
            return results
          }
        } catch (error) {
          console.warn('Online food search failed, falling back to offline:', error)
        }
      }

      // Fallback to offline search
      return await this.searchFoodsOffline(query, limit)
    } catch (error) {
      console.error('Food search failed:', error)
      return { foods: [], total: 0 }
    }
  }

  /**
   * Offline food search
   */
  async searchFoodsOffline(query, limit = 20) {
    const transaction = this.db.transaction('foodDatabase', 'readonly')
    const store = transaction.objectStore('foodDatabase')
    const nameIndex = store.index('name')
    
    const results = []
    const searchTerm = query.toLowerCase()

    // Search by name
    let cursor = await nameIndex.openCursor()
    while (cursor && results.length < limit) {
      const food = cursor.value
      if (food.name.toLowerCase().includes(searchTerm) ||
          (food.brand && food.brand.toLowerCase().includes(searchTerm))) {
        results.push(food)
      }
      cursor = await cursor.continue()
    }

    return {
      foods: results,
      total: results.length,
      offline: true
    }
  }

  /**
   * Cache food search results
   */
  async cacheFoodResults(foods) {
    const transaction = this.db.transaction('foodDatabase', 'readwrite')
    const store = transaction.objectStore('foodDatabase')

    for (const food of foods) {
      const existing = await store.get(food.barcode)
      const cacheData = {
        ...food,
        lastAccessed: new Date().toISOString(),
        source: existing?.source || 'api'
      }

      await store.put(cacheData)
    }
  }

  /**
   * Get barcode product with offline fallback
   */
  async getBarcodeProduct(barcode) {
    try {
      // Check local cache first
      const transaction = this.db.transaction('foodDatabase', 'readonly')
      const store = transaction.objectStore('foodDatabase')
      const cached = await store.get(barcode)

      // If found in cache and recent, return it
      if (cached) {
        const age = Date.now() - new Date(cached.lastAccessed).getTime()
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days

        if (age < maxAge || !this.isOnline) {
          // Update last accessed time
          cached.lastAccessed = new Date().toISOString()
          await store.put(cached)
          
          return { ...cached, fromCache: true }
        }
      }

      // Try online lookup if available
      if (this.isOnline) {
        try {
          const response = await fetch(`/api/food/barcode/${barcode}`)
          if (response.ok) {
            const product = await response.json()
            
            // Cache the result
            await this.cacheFoodResults([product])
            
            return product
          }
        } catch (error) {
          console.warn('Online barcode lookup failed:', error)
        }
      }

      // Return cached version if available
      if (cached) {
        return { ...cached, fromCache: true, stale: true }
      }

      throw new Error('Product not found')
    } catch (error) {
      console.error('Barcode lookup failed:', error)
      throw error
    }
  }

  /**
   * Export all user data
   */
  async exportAllData() {
    try {
      const stores = ['meals', 'workouts', 'sleepEntries', 'measurements', 'photos', 'wellnessEntries']
      const exportData = {
        version: this.dbVersion,
        exportDate: new Date().toISOString(),
        data: {}
      }

      for (const storeName of stores) {
        const transaction = this.db.transaction(storeName, 'readonly')
        const store = transaction.objectStore(storeName)
        exportData.data[storeName] = await store.getAll()
      }

      return exportData
    } catch (error) {
      console.error('Data export failed:', error)
      throw error
    }
  }

  /**
   * Import user data
   */
  async importData(importData) {
    try {
      const { data } = importData

      for (const [storeName, items] of Object.entries(data)) {
        if (this.db.objectStoreNames.contains(storeName)) {
          const transaction = this.db.transaction(storeName, 'readwrite')
          const store = transaction.objectStore(storeName)

          for (const item of items) {
            await store.put({
              ...item,
              imported: true,
              importDate: new Date().toISOString()
            })
          }
        }
      }

      console.log('✅ Data import completed')
    } catch (error) {
      console.error('Data import failed:', error)
      throw error
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAllData() {
    try {
      const stores = Array.from(this.db.objectStoreNames)
      const transaction = this.db.transaction(stores, 'readwrite')

      for (const storeName of stores) {
        const store = transaction.objectStore(storeName)
        await store.clear()
      }

      console.log('🗑️ All data cleared')
    } catch (error) {
      console.error('Failed to clear data:', error)
      throw error
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const stats = {}
      const stores = Array.from(this.db.objectStoreNames)

      for (const storeName of stores) {
        const transaction = this.db.transaction(storeName, 'readonly')
        const store = transaction.objectStore(storeName)
        const count = await store.count()
        stats[storeName] = count
      }

      // Get browser storage estimate if available
      let storageEstimate = null
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        storageEstimate = await navigator.storage.estimate()
      }

      return {
        itemCounts: stats,
        browserStorage: storageEstimate
      }
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return { itemCounts: {}, browserStorage: null }
    }
  }

  /**
   * Cleanup old data to manage storage
   */
  async cleanupOldData(maxAge = 90 * 24 * 60 * 60 * 1000) { // 90 days
    try {
      const cutoffDate = new Date(Date.now() - maxAge).toISOString()
      let totalCleaned = 0

      // Clean old food cache entries
      const foodTransaction = this.db.transaction('foodDatabase', 'readwrite')
      const foodStore = foodTransaction.objectStore('foodDatabase')
      const foodIndex = foodStore.index('lastAccessed')
      
      let foodCursor = await foodIndex.openCursor(IDBKeyRange.upperBound(cutoffDate))
      while (foodCursor) {
        if (!foodCursor.value.preloaded) {
          await foodCursor.delete()
          totalCleaned++
        }
        foodCursor = await foodCursor.continue()
      }

      // Clean old image cache
      const imageTransaction = this.db.transaction('imageCache', 'readwrite')
      const imageStore = imageTransaction.objectStore('imageCache')
      const imageIndex = imageStore.index('lastAccessed')
      
      let imageCursor = await imageIndex.openCursor(IDBKeyRange.upperBound(cutoffDate))
      while (imageCursor) {
        await imageCursor.delete()
        totalCleaned++
        imageCursor = await imageCursor.continue()
      }

      console.log(`🧹 Cleaned up ${totalCleaned} old entries`)
      return totalCleaned
    } catch (error) {
      console.error('Cleanup failed:', error)
      return 0
    }
  }
}

export default new OfflineStorage()