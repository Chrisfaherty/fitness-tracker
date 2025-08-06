import { openDB } from 'idb'

class StorageService {
  constructor() {
    this.dbName = 'FitnessTrackerDB'
    this.dbVersion = 4 // Incremented for multi-user support
    this.db = null
    this.init()
  }

  async init() {
    try {
      this.db = await openDB(this.dbName, this.dbVersion, {
        upgrade(db) {
          // Create object stores for different data types
          if (!db.objectStoreNames.contains('meals')) {
            const mealStore = db.createObjectStore('meals', { keyPath: 'id' })
            mealStore.createIndex('date', 'date')
            mealStore.createIndex('mealType', 'mealType')
          }

          if (!db.objectStoreNames.contains('workouts')) {
            const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' })
            workoutStore.createIndex('date', 'date')
            workoutStore.createIndex('type', 'type')
          }

          if (!db.objectStoreNames.contains('measurements')) {
            const measurementStore = db.createObjectStore('measurements', { keyPath: 'id' })
            measurementStore.createIndex('type', 'type')
            measurementStore.createIndex('date', 'date')
          }

          if (!db.objectStoreNames.contains('photos')) {
            const photoStore = db.createObjectStore('photos', { keyPath: 'id' })
            photoStore.createIndex('date', 'date')
            photoStore.createIndex('type', 'type')
          }

          if (!db.objectStoreNames.contains('wellnessNotes')) {
            const notesStore = db.createObjectStore('wellnessNotes', { keyPath: 'id' })
            notesStore.createIndex('date', 'date')
          }

          if (!db.objectStoreNames.contains('userPreferences')) {
            db.createObjectStore('userPreferences', { keyPath: 'key' })
          }

          if (!db.objectStoreNames.contains('foodProducts')) {
            const foodStore = db.createObjectStore('foodProducts', { keyPath: 'id' })
            foodStore.createIndex('barcode', 'barcode', { unique: true })
            foodStore.createIndex('name', 'name')
            foodStore.createIndex('brand', 'brand')
            foodStore.createIndex('source', 'source')
            foodStore.createIndex('savedAt', 'savedAt')
          }

          if (!db.objectStoreNames.contains('scanHistory')) {
            const scanStore = db.createObjectStore('scanHistory', { keyPath: 'id' })
            scanStore.createIndex('barcode', 'barcode')
            scanStore.createIndex('timestamp', 'timestamp')
            scanStore.createIndex('success', 'success')
          }

          if (!db.objectStoreNames.contains('sleepEntries')) {
            const sleepStore = db.createObjectStore('sleepEntries', { keyPath: 'id' })
            sleepStore.createIndex('date', 'date', { unique: true })
            sleepStore.createIndex('sleepScore', 'sleepScore')
            sleepStore.createIndex('quality', 'quality')
            sleepStore.createIndex('createdAt', 'createdAt')
          }

          // Add stores for multi-user support
          if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id' })
            userStore.createIndex('email', 'email', { unique: true })
            userStore.createIndex('role', 'role')
            userStore.createIndex('createdAt', 'createdAt')
          }

          if (!db.objectStoreNames.contains('userSession')) {
            db.createObjectStore('userSession', { keyPath: 'id' })
          }

          if (!db.objectStoreNames.contains('workoutPlans')) {
            const planStore = db.createObjectStore('workoutPlans', { keyPath: 'id' })
            planStore.createIndex('level', 'level')
            planStore.createIndex('category', 'category')
            planStore.createIndex('createdAt', 'createdAt')
          }

          if (!db.objectStoreNames.contains('foodPlans')) {
            const foodPlanStore = db.createObjectStore('foodPlans', { keyPath: 'id' })
            foodPlanStore.createIndex('goal', 'goal')
            foodPlanStore.createIndex('createdAt', 'createdAt')
          }

          if (!db.objectStoreNames.contains('authLogs')) {
            const logStore = db.createObjectStore('authLogs', { keyPath: 'id' })
            logStore.createIndex('event', 'event')
            logStore.createIndex('timestamp', 'timestamp')
          }
        },
      })
      console.log('IndexedDB initialized successfully')
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
    }
  }

  // Generic CRUD operations
  async save(storeName, data, customId = null) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      
      // Prepare data with proper ID and metadata
      const dataToSave = {
        ...data,
        savedAt: new Date().toISOString()
      }
      
      // Use custom ID if provided (for auth service compatibility)
      if (customId) {
        dataToSave.id = customId
      }
      
      await store.put(dataToSave)
      return { success: true }
    } catch (error) {
      console.error(`Error saving to ${storeName}:`, error)
      return { success: false, error }
    }
  }

  async get(storeName, id) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      return await store.get(id)
    } catch (error) {
      console.error(`Error getting from ${storeName}:`, error)
      return null
    }
  }

  async getAll(storeName) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      return await store.getAll()
    } catch (error) {
      console.error(`Error getting all from ${storeName}:`, error)
      return []
    }
  }

  async delete(storeName, id) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      await store.delete(id)
      return { success: true }
    } catch (error) {
      console.error(`Error deleting from ${storeName}:`, error)
      return { success: false, error }
    }
  }

  async clear(storeName) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      await store.clear()
      return { success: true }
    } catch (error) {
      console.error(`Error clearing ${storeName}:`, error)
      return { success: false, error }
    }
  }

  // Specialized methods for fitness data
  async saveMeal(meal) {
    return await this.save('meals', meal)
  }

  async getMealsByDate(date) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('meals', 'readonly')
      const store = tx.objectStore('meals')
      const index = store.index('date')
      return await index.getAll(date)
    } catch (error) {
      console.error('Error getting meals by date:', error)
      return []
    }
  }

  async saveWorkout(workout) {
    return await this.save('workouts', workout)
  }

  async getWorkoutsByType(type) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('workouts', 'readonly')
      const store = tx.objectStore('workouts')
      const index = store.index('type')
      return await index.getAll(type)
    } catch (error) {
      console.error('Error getting workouts by type:', error)
      return []
    }
  }

  async saveMeasurement(measurement) {
    return await this.save('measurements', measurement)
  }

  async getMeasurementsByType(type) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('measurements', 'readonly')
      const store = tx.objectStore('measurements')
      const index = store.index('type')
      return await index.getAll(type)
    } catch (error) {
      console.error('Error getting measurements by type:', error)
      return []
    }
  }

  async savePhoto(photo) {
    return await this.save('photos', photo)
  }

  async saveWellnessNote(note) {
    return await this.save('wellnessNotes', note)
  }

  // Food products methods
  async saveFoodProduct(product) {
    return await this.save('foodProducts', {
      ...product,
      id: product.barcode || product.id,
      savedAt: new Date().toISOString()
    })
  }

  async getFoodProductByBarcode(barcode) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('foodProducts', 'readonly')
      const store = tx.objectStore('foodProducts')
      const index = store.index('barcode')
      return await index.get(barcode)
    } catch (error) {
      console.error('Error getting food product by barcode:', error)
      return null
    }
  }

  async searchFoodProducts(searchTerm, limit = 20) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('foodProducts', 'readonly')
      const store = tx.objectStore('foodProducts')
      const allProducts = await store.getAll()
      
      const searchLower = searchTerm.toLowerCase()
      const results = allProducts
        .filter(product => 
          product.name?.toLowerCase().includes(searchLower) ||
          product.brand?.toLowerCase().includes(searchLower)
        )
        .slice(0, limit)
      
      return results
    } catch (error) {
      console.error('Error searching food products:', error)
      return []
    }
  }

  async cleanupOldFoodProducts(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('foodProducts', 'readwrite')
      const store = tx.objectStore('foodProducts')
      const index = store.index('savedAt')
      
      const cutoffDate = new Date(Date.now() - maxAge).toISOString()
      const oldProducts = await index.getAll(IDBKeyRange.upperBound(cutoffDate))
      
      for (const product of oldProducts) {
        await store.delete(product.id)
      }
      
      console.log(`Cleaned up ${oldProducts.length} old food products`)
      return { cleaned: oldProducts.length }
    } catch (error) {
      console.error('Error cleaning up old food products:', error)
      return { cleaned: 0, error }
    }
  }

  // Scan history methods
  async saveScanHistory(scanData) {
    return await this.save('scanHistory', {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ...scanData,
      timestamp: new Date().toISOString()
    })
  }

  async getScanHistory(limit = 50) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('scanHistory', 'readonly')
      const store = tx.objectStore('scanHistory')
      const index = store.index('timestamp')
      
      // Get recent scans in descending order
      const scans = await index.getAll()
      return scans
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting scan history:', error)
      return []
    }
  }

  async getScanStatistics() {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('scanHistory', 'readonly')
      const store = tx.objectStore('scanHistory')
      const allScans = await store.getAll()
      
      const successful = allScans.filter(scan => scan.success).length
      const failed = allScans.length - successful
      const last7Days = allScans.filter(scan => 
        new Date(scan.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
      
      return {
        total: allScans.length,
        successful,
        failed,
        successRate: allScans.length > 0 ? (successful / allScans.length * 100).toFixed(1) : 0,
        last7Days
      }
    } catch (error) {
      console.error('Error getting scan statistics:', error)
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        last7Days: 0
      }
    }
  }

  // User preferences
  async saveUserPreference(key, value) {
    return await this.save('userPreferences', { key, value })
  }

  async getUserPreference(key) {
    const result = await this.get('userPreferences', key)
    return result ? result.value : null
  }

  // Sleep entries methods
  async saveSleepEntry(sleepEntry) {
    return await this.save('sleepEntries', sleepEntry)
  }

  async getSleepEntryByDate(date) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('sleepEntries', 'readonly')
      const store = tx.objectStore('sleepEntries')
      const index = store.index('date')
      return await index.get(date)
    } catch (error) {
      console.error('Error getting sleep entry by date:', error)
      return null
    }
  }

  async getRecentSleepEntries(limit = 30) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('sleepEntries', 'readonly')
      const store = tx.objectStore('sleepEntries')
      const index = store.index('createdAt')
      
      const entries = await index.getAll()
      return entries
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting recent sleep entries:', error)
      return []
    }
  }

  async getSleepEntriesInRange(startDate, endDate) {
    if (!this.db) await this.init()
    
    try {
      const tx = this.db.transaction('sleepEntries', 'readonly')
      const store = tx.objectStore('sleepEntries')
      const index = store.index('date')
      
      const range = IDBKeyRange.bound(startDate, endDate)
      return await index.getAll(range)
    } catch (error) {
      console.error('Error getting sleep entries in range:', error)
      return []
    }
  }

  async deleteSleepEntry(id) {
    return await this.delete('sleepEntries', id)
  }

  // Export/Import functionality
  async exportAllData() {
    if (!this.db) await this.init()
    
    const data = {}
    const stores = ['meals', 'workouts', 'measurements', 'photos', 'wellnessNotes', 'userPreferences', 'sleepEntries']
    
    try {
      for (const storeName of stores) {
        data[storeName] = await this.getAll(storeName)
      }
      
      return {
        success: true,
        data,
        exportDate: new Date().toISOString(),
        version: this.dbVersion
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      return { success: false, error }
    }
  }

  async importData(importData) {
    if (!this.db) await this.init()
    
    try {
      const stores = Object.keys(importData.data)
      
      for (const storeName of stores) {
        const items = importData.data[storeName]
        for (const item of items) {
          await this.save(storeName, item)
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error importing data:', error)
      return { success: false, error }
    }
  }

  // Storage quota management
  async getStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
        }
      } catch (error) {
        console.error('Error getting storage usage:', error)
        return null
      }
    }
    return null
  }
}

export default new StorageService()