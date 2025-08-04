/**
 * Enterprise Data Backup Service
 * Handles automatic cloud backup, version history, and data recovery
 */

import { openDB } from 'idb'
import useFitnessStore from '../store/fitnessStore.js'

export class DataBackupService {
  constructor() {
    this.backupQueue = []
    this.isBackingUp = false
    this.backupInterval = null
    this.versionHistory = new Map()
    this.maxVersions = 50
    this.backupProviders = new Map()
    this.isInitialized = false
    this.lastBackupTime = null
    this.backupStats = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      averageBackupTime: 0,
      lastBackupSize: 0
    }
    this.compressionEnabled = true
    this.encryptionEnabled = true
  }

  /**
   * Initialize backup service
   */
  async initialize(config = {}) {
    console.log('💾 Initializing Data Backup Service')
    
    this.config = {
      backupInterval: config.backupInterval || 300000, // 5 minutes
      cloudProvider: config.cloudProvider || 'indexeddb', // 'aws', 'firebase', 'azure'
      encryptionKey: config.encryptionKey || this.generateEncryptionKey(),
      maxBackupSize: config.maxBackupSize || 50 * 1024 * 1024, // 50MB
      retentionPeriod: config.retentionPeriod || 30, // days
      compressionLevel: config.compressionLevel || 6,
      autoBackup: config.autoBackup !== false,
      crossDeviceSync: config.crossDeviceSync !== false,
      ...config
    }

    // Initialize database
    await this.initializeBackupDB()
    
    // Setup backup providers
    await this.setupBackupProviders()
    
    // Start automatic backup if enabled
    if (this.config.autoBackup) {
      this.startAutomaticBackup()
    }

    // Setup data change listeners
    this.setupDataChangeListeners()

    // Recover from any interrupted backups
    await this.recoverInterruptedBackups()

    this.isInitialized = true
    console.log('✅ Data Backup Service initialized')
    
    return true
  }

  /**
   * Initialize backup database
   */
  async initializeBackupDB() {
    this.backupDB = await openDB('fitness-backup-db', 3, {
      upgrade(db, oldVersion, newVersion) {
        // Backup snapshots store
        if (!db.objectStoreNames.contains('backups')) {
          const backupStore = db.createObjectStore('backups', { keyPath: 'id' })
          backupStore.createIndex('timestamp', 'timestamp')
          backupStore.createIndex('version', 'version')
          backupStore.createIndex('type', 'type')
        }

        // Version history store
        if (!db.objectStoreNames.contains('versions')) {
          const versionStore = db.createObjectStore('versions', { keyPath: 'id' })
          versionStore.createIndex('timestamp', 'timestamp')
          versionStore.createIndex('dataType', 'dataType')
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('sync-metadata')) {
          const syncStore = db.createObjectStore('sync-metadata', { keyPath: 'key' })
          syncStore.createIndex('lastSync', 'lastSync')
        }

        // Backup queue store
        if (!db.objectStoreNames.contains('backup-queue')) {
          const queueStore = db.createObjectStore('backup-queue', { keyPath: 'id' })
          queueStore.createIndex('priority', 'priority')
          queueStore.createIndex('createdAt', 'createdAt')
        }
      }
    })
  }

  /**
   * Setup backup providers
   */
  async setupBackupProviders() {
    // Local IndexedDB provider (always available)
    this.backupProviders.set('indexeddb', {
      name: 'IndexedDB',
      upload: this.uploadToIndexedDB.bind(this),
      download: this.downloadFromIndexedDB.bind(this),
      list: this.listIndexedDBBackups.bind(this),
      delete: this.deleteIndexedDBBackup.bind(this),
      available: true
    })

    // Cloud providers (would be configured based on environment)
    if (this.config.cloudProvider === 'aws' && this.config.awsConfig) {
      this.backupProviders.set('aws', {
        name: 'AWS S3',
        upload: this.uploadToAWS.bind(this),
        download: this.downloadFromAWS.bind(this),
        list: this.listAWSBackups.bind(this),
        delete: this.deleteAWSBackup.bind(this),
        available: true
      })
    }

    if (this.config.cloudProvider === 'firebase' && this.config.firebaseConfig) {
      this.backupProviders.set('firebase', {
        name: 'Firebase Storage',
        upload: this.uploadToFirebase.bind(this),
        download: this.downloadFromFirebase.bind(this),
        list: this.listFirebaseBackups.bind(this),
        delete: this.deleteFirebaseBackup.bind(this),
        available: true
      })
    }
  }

  /**
   * Start automatic backup
   */
  startAutomaticBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
    }

    this.backupInterval = setInterval(async () => {
      await this.performAutomaticBackup()
    }, this.config.backupInterval)

    // Immediate backup on start
    setTimeout(() => {
      this.performAutomaticBackup()
    }, 5000)

    console.log(`🔄 Automatic backup started (interval: ${this.config.backupInterval / 1000}s)`)
  }

  /**
   * Perform automatic backup
   */
  async performAutomaticBackup() {
    if (this.isBackingUp) {
      console.log('⏳ Backup already in progress, skipping...')
      return
    }

    try {
      const currentData = useFitnessStore.getState()
      const hasChanges = await this.detectDataChanges(currentData)
      
      if (!hasChanges) {
        console.log('📊 No data changes detected, skipping backup')
        return
      }

      await this.createBackup('automatic', currentData)
      
    } catch (error) {
      console.error('Failed automatic backup:', error)
      this.backupStats.failedBackups++
    }
  }

  /**
   * Create backup
   */
  async createBackup(type = 'manual', data = null, options = {}) {
    if (this.isBackingUp && type !== 'emergency') {
      console.log('⏳ Backup in progress, queueing request...')
      return this.queueBackup(type, data, options)
    }

    const startTime = Date.now()
    this.isBackingUp = true

    try {
      // Get data if not provided
      if (!data) {
        data = useFitnessStore.getState()
      }

      // Create backup snapshot
      const backup = await this.createBackupSnapshot(data, type, options)
      
      // Compress if enabled
      if (this.compressionEnabled) {
        backup.compressed = await this.compressData(backup.data)
        backup.originalSize = JSON.stringify(backup.data).length
        backup.compressedSize = backup.compressed.length
        backup.compressionRatio = backup.originalSize / backup.compressedSize
      }

      // Encrypt if enabled
      if (this.encryptionEnabled) {
        backup.encrypted = await this.encryptData(backup.compressed || JSON.stringify(backup.data))
        backup.encryptionInfo = {
          algorithm: 'AES-GCM',
          keyDerivation: 'PBKDF2'
        }
      }

      // Upload to providers
      const uploadResults = await this.uploadToProviders(backup)
      backup.uploadResults = uploadResults

      // Store version history
      await this.storeVersionHistory(backup)

      // Update stats
      const backupTime = Date.now() - startTime
      this.updateBackupStats(true, backupTime, backup.compressedSize || backup.originalSize)

      this.lastBackupTime = new Date().toISOString()
      
      console.log(`✅ Backup completed successfully (${backupTime}ms, ${this.formatBytes(backup.compressedSize || backup.originalSize)})`)
      
      // Clean up old backups
      await this.cleanupOldBackups()

      return backup

    } catch (error) {
      console.error('Backup failed:', error)
      this.updateBackupStats(false, Date.now() - startTime, 0)
      throw error
    } finally {
      this.isBackingUp = false
      await this.processBackupQueue()
    }
  }

  /**
   * Create backup snapshot
   */
  async createBackupSnapshot(data, type, options) {
    const backup = {
      id: this.generateBackupId(),
      version: this.generateVersionNumber(),
      timestamp: new Date().toISOString(),
      type, // 'automatic', 'manual', 'emergency', 'scheduled'
      data: this.sanitizeData(data),
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        deviceId: await this.getDeviceId(),
        appVersion: this.getAppVersion(),
        dataVersion: this.getDataVersion(data),
        checksum: await this.calculateChecksum(data)
      },
      options,
      size: JSON.stringify(data).length
    }

    return backup
  }

  /**
   * Upload to all configured providers
   */
  async uploadToProviders(backup) {
    const results = {}
    
    for (const [providerId, provider] of this.backupProviders) {
      if (!provider.available) continue
      
      try {
        console.log(`📤 Uploading to ${provider.name}...`)
        const result = await provider.upload(backup)
        results[providerId] = { success: true, result }
        console.log(`✅ Successfully uploaded to ${provider.name}`)
      } catch (error) {
        console.error(`❌ Failed to upload to ${provider.name}:`, error)
        results[providerId] = { success: false, error: error.message }
      }
    }

    return results
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId, options = {}) {
    console.log(`🔄 Restoring from backup: ${backupId}`)
    
    try {
      // Export current data before restore (safety backup)
      if (!options.skipSafetyBackup) {
        await this.createBackup('pre-restore', null, { description: 'Safety backup before restore' })
      }

      // Find and download backup
      const backup = await this.downloadBackup(backupId)
      
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`)
      }

      // Decrypt if needed
      let data = backup.data
      if (backup.encrypted) {
        data = await this.decryptData(backup.encrypted, backup.encryptionInfo)
      }

      // Decompress if needed
      if (backup.compressed) {
        data = await this.decompressData(data)
      }

      // Validate data integrity
      const isValid = await this.validateBackupIntegrity(data, backup.metadata)
      if (!isValid && !options.forceRestore) {
        throw new Error('Backup integrity validation failed')
      }

      // Restore data to store
      await this.restoreDataToStore(data, options)

      console.log(`✅ Successfully restored from backup: ${backupId}`)
      
      return {
        success: true,
        backupId,
        restoredAt: new Date().toISOString(),
        dataVersion: backup.metadata.dataVersion
      }

    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }

  /**
   * List available backups
   */
  async listBackups(options = {}) {
    const backups = []
    
    for (const [providerId, provider] of this.backupProviders) {
      if (!provider.available) continue
      
      try {
        const providerBackups = await provider.list(options)
        backups.push(...providerBackups.map(backup => ({
          ...backup,
          provider: providerId,
          providerName: provider.name
        })))
      } catch (error) {
        console.error(`Failed to list backups from ${provider.name}:`, error)
      }
    }

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Setup data change listeners
   */
  setupDataChangeListeners() {
    // Listen for fitness store changes
    if (typeof window !== 'undefined') {
      // Nutrition changes
      window.addEventListener('meal-logged', () => {
        this.scheduleBackup('nutrition-change', { priority: 'medium' })
      })

      // Workout changes
      window.addEventListener('workout-completed', () => {
        this.scheduleBackup('workout-change', { priority: 'medium' })
      })

      // Body measurement changes
      window.addEventListener('measurement-logged', () => {
        this.scheduleBackup('measurement-change', { priority: 'high' })
      })

      // Goal changes
      window.addEventListener('goal-updated', () => {
        this.scheduleBackup('goal-change', { priority: 'high' })
      })

      // Before page unload (emergency backup)
      window.addEventListener('beforeunload', async (event) => {
        await this.createEmergencyBackup()
      })

      // Page visibility change (backup on app switch)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.scheduleBackup('visibility-change', { priority: 'low' })
        }
      })
    }
  }

  /**
   * Create emergency backup
   */
  async createEmergencyBackup() {
    try {
      // Quick backup without compression/encryption for speed
      await this.createBackup('emergency', null, {
        skipCompression: true,
        skipEncryption: true,
        priority: 'critical'
      })
    } catch (error) {
      console.error('Emergency backup failed:', error)
    }
  }

  /**
   * Schedule backup
   */
  scheduleBackup(reason, options = {}) {
    const backupTask = {
      id: this.generateTaskId(),
      reason,
      priority: options.priority || 'medium',
      createdAt: new Date().toISOString(),
      options
    }

    this.backupQueue.push(backupTask)
    
    // Process high priority immediately
    if (options.priority === 'critical' || options.priority === 'high') {
      setTimeout(() => this.processBackupQueue(), 100)
    }
  }

  /**
   * Process backup queue
   */
  async processBackupQueue() {
    if (this.isBackingUp || this.backupQueue.length === 0) return

    // Sort by priority
    this.backupQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const task = this.backupQueue.shift()
    
    try {
      await this.createBackup(task.reason, null, task.options)
    } catch (error) {
      console.error('Queued backup failed:', error)
    }
  }

  /**
   * Queue backup when service is busy
   */
  async queueBackup(type, data, options) {
    const queueItem = {
      id: this.generateTaskId(),
      type,
      data,
      options,
      priority: options.priority || 'medium',
      createdAt: new Date().toISOString()
    }

    // Store in persistent queue
    await this.backupDB.add('backup-queue', queueItem)
    this.backupQueue.push(queueItem)

    return queueItem.id
  }

  /**
   * Detect data changes
   */
  async detectDataChanges(currentData) {
    try {
      const lastBackup = await this.getLastBackup()
      if (!lastBackup) return true // First backup

      const currentChecksum = await this.calculateChecksum(currentData)
      const lastChecksum = lastBackup.metadata?.checksum

      return currentChecksum !== lastChecksum
    } catch (error) {
      console.error('Error detecting data changes:', error)
      return true // Assume changes if error
    }
  }

  /**
   * Store version history
   */
  async storeVersionHistory(backup) {
    const versionEntry = {
      id: `version_${backup.version}`,
      version: backup.version,
      backupId: backup.id,
      timestamp: backup.timestamp,
      type: backup.type,
      size: backup.size,
      checksum: backup.metadata.checksum,
      dataType: 'fitness-data'
    }

    await this.backupDB.add('versions', versionEntry)
    
    // Clean up old versions
    await this.cleanupOldVersions()
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod)

    try {
      // Clean up from each provider
      for (const [providerId, provider] of this.backupProviders) {
        if (!provider.available) continue

        const backups = await provider.list({ before: cutoffDate.toISOString() })
        for (const backup of backups) {
          await provider.delete(backup.id)
        }
      }

      console.log(`🧹 Cleaned up backups older than ${this.config.retentionPeriod} days`)
    } catch (error) {
      console.error('Backup cleanup failed:', error)
    }
  }

  /**
   * Clean up old versions
   */
  async cleanupOldVersions() {
    const tx = this.backupDB.transaction('versions', 'readwrite')
    const store = tx.objectStore('versions')
    const index = store.index('timestamp')
    
    const allVersions = await index.getAll()
    if (allVersions.length <= this.maxVersions) return

    // Keep only the most recent versions
    const versionsToDelete = allVersions
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, allVersions.length - this.maxVersions)

    for (const version of versionsToDelete) {
      await store.delete(version.id)
    }

    await tx.complete
  }

  /**
   * Recover interrupted backups
   */
  async recoverInterruptedBackups() {
    try {
      const queuedBackups = await this.backupDB.getAll('backup-queue')
      
      for (const backup of queuedBackups) {
        this.backupQueue.push(backup)
      }

      if (queuedBackups.length > 0) {
        console.log(`🔄 Recovered ${queuedBackups.length} interrupted backup(s)`)
        setTimeout(() => this.processBackupQueue(), 1000)
      }
    } catch (error) {
      console.error('Failed to recover interrupted backups:', error)
    }
  }

  // Provider implementations

  /**
   * Upload to IndexedDB
   */
  async uploadToIndexedDB(backup) {
    const backupData = {
      ...backup,
      uploadedAt: new Date().toISOString()
    }

    await this.backupDB.add('backups', backupData)
    return { id: backup.id, provider: 'indexeddb' }
  }

  /**
   * Download from IndexedDB
   */
  async downloadFromIndexedDB(backupId) {
    return await this.backupDB.get('backups', backupId)
  }

  /**
   * List IndexedDB backups
   */
  async listIndexedDBBackups(options = {}) {
    const tx = this.backupDB.transaction('backups', 'readonly')
    const store = tx.objectStore('backups')
    const index = store.index('timestamp')

    let backups = await index.getAll()
    
    if (options.before) {
      backups = backups.filter(b => b.timestamp < options.before)
    }
    
    if (options.after) {
      backups = backups.filter(b => b.timestamp > options.after)
    }

    return backups.map(backup => ({
      id: backup.id,
      timestamp: backup.timestamp,
      type: backup.type,
      size: backup.size,
      version: backup.version
    }))
  }

  /**
   * Delete IndexedDB backup
   */
  async deleteIndexedDBBackup(backupId) {
    await this.backupDB.delete('backups', backupId)
    return true
  }

  // Cloud provider stubs (would be implemented with actual SDK)
  async uploadToAWS(backup) {
    // AWS S3 implementation would go here
    throw new Error('AWS S3 provider not implemented')
  }

  async downloadFromAWS(backupId) {
    throw new Error('AWS S3 provider not implemented')
  }

  async listAWSBackups(options) {
    throw new Error('AWS S3 provider not implemented')
  }

  async deleteAWSBackup(backupId) {
    throw new Error('AWS S3 provider not implemented')
  }

  async uploadToFirebase(backup) {
    // Firebase Storage implementation would go here
    throw new Error('Firebase provider not implemented')
  }

  async downloadFromFirebase(backupId) {
    throw new Error('Firebase provider not implemented')
  }

  async listFirebaseBackups(options) {
    throw new Error('Firebase provider not implemented')
  }

  async deleteFirebaseBackup(backupId) {
    throw new Error('Firebase provider not implemented')
  }

  // Utility methods

  generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateVersionNumber() {
    return `v${Date.now()}`
  }

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateEncryptionKey() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  async getDeviceId() {
    // Generate or retrieve persistent device ID
    let deviceId = localStorage.getItem('fitness-device-id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('fitness-device-id', deviceId)
    }
    return deviceId
  }

  getAppVersion() {
    return '1.0.0' // Would come from package.json or build info
  }

  getDataVersion(data) {
    // Simple data versioning based on structure
    const structure = {
      hasNutrition: !!data.nutrition,
      hasActivity: !!data.activity,
      hasWellness: !!data.wellness,
      hasBody: !!data.body,
      hasUser: !!data.user
    }
    return btoa(JSON.stringify(structure))
  }

  async calculateChecksum(data) {
    const jsonString = JSON.stringify(data, Object.keys(data).sort())
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(jsonString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  sanitizeData(data) {
    // Remove any sensitive or non-serializable data
    const sanitized = JSON.parse(JSON.stringify(data))
    
    // Remove any functions or undefined values
    const cleanObj = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj
      
      if (Array.isArray(obj)) {
        return obj.map(cleanObj).filter(item => item !== undefined)
      }
      
      const cleaned = {}
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'function') continue
        if (value === undefined) continue
        cleaned[key] = cleanObj(value)
      }
      return cleaned
    }
    
    return cleanObj(sanitized)
  }

  async compressData(data) {
    // Simple compression using native compression API if available
    if ('CompressionStream' in window) {
      const stream = new CompressionStream('gzip')
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()
      
      const jsonString = JSON.stringify(data)
      const encoder = new TextEncoder()
      
      writer.write(encoder.encode(jsonString))
      writer.close()
      
      const chunks = []
      let done = false
      
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }
      
      return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
    }
    
    // Fallback: Just return stringified data
    return JSON.stringify(data)
  }

  async decompressData(compressedData) {
    // Simple decompression
    if ('DecompressionStream' in window && compressedData instanceof Uint8Array) {
      const stream = new DecompressionStream('gzip')
      const writer = stream.writable.getWriter()
      const reader = stream.readable.getReader()
      
      writer.write(compressedData)
      writer.close()
      
      const chunks = []
      let done = false
      
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) chunks.push(value)
      }
      
      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
      const decoder = new TextDecoder()
      return JSON.parse(decoder.decode(decompressed))
    }
    
    // Fallback: Assume it's already JSON
    return typeof compressedData === 'string' ? JSON.parse(compressedData) : compressedData
  }

  async encryptData(data) {
    // Simple encryption implementation
    // In production, use proper encryption library
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
    
    // For demo purposes, just encode as base64
    // In production, use proper AES encryption
    return btoa(String.fromCharCode(...dataBuffer))
  }

  async decryptData(encryptedData, encryptionInfo) {
    // Simple decryption implementation
    // In production, use proper decryption
    const decodedData = atob(encryptedData)
    const dataArray = new Uint8Array(decodedData.split('').map(char => char.charCodeAt(0)))
    const decoder = new TextDecoder()
    return decoder.decode(dataArray)
  }

  async validateBackupIntegrity(data, metadata) {
    try {
      const currentChecksum = await this.calculateChecksum(data)
      return currentChecksum === metadata.checksum
    } catch (error) {
      console.error('Integrity validation failed:', error)
      return false
    }
  }

  async restoreDataToStore(data, options) {
    // Restore data to Zustand store
    const store = useFitnessStore.getState()
    
    // Merge or replace based on options
    if (options.mergeData) {
      // Merge with existing data
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key] === 'object') {
          store[key] = { ...store[key], ...data[key] }
        } else {
          store[key] = data[key]
        }
      })
    } else {
      // Full replace
      Object.keys(data).forEach(key => {
        store[key] = data[key]
      })
    }
    
    // Trigger store update
    useFitnessStore.setState(store)
  }

  async getLastBackup() {
    const backups = await this.listBackups({ limit: 1 })
    return backups.length > 0 ? backups[0] : null
  }

  async downloadBackup(backupId) {
    // Try each provider until we find the backup
    for (const [providerId, provider] of this.backupProviders) {
      if (!provider.available) continue
      
      try {
        const backup = await provider.download(backupId)
        if (backup) return backup
      } catch (error) {
        console.error(`Failed to download from ${provider.name}:`, error)
      }
    }
    
    return null
  }

  updateBackupStats(success, duration, size) {
    this.backupStats.totalBackups++
    
    if (success) {
      this.backupStats.successfulBackups++
      this.backupStats.lastBackupSize = size
      
      // Update average backup time
      const currentAvg = this.backupStats.averageBackupTime
      const totalSuccessful = this.backupStats.successfulBackups
      this.backupStats.averageBackupTime = 
        (currentAvg * (totalSuccessful - 1) + duration) / totalSuccessful
    } else {
      this.backupStats.failedBackups++
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // API methods

  getBackupStats() {
    return {
      ...this.backupStats,
      lastBackupTime: this.lastBackupTime,
      isBackingUp: this.isBackingUp,
      queueLength: this.backupQueue.length,
      availableProviders: Array.from(this.backupProviders.entries())
        .filter(([_, provider]) => provider.available)
        .map(([id, provider]) => ({ id, name: provider.name }))
    }
  }

  async exportData(format = 'json') {
    const data = useFitnessStore.getState()
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'csv':
        // Would implement CSV conversion
        return this.convertToCSV(data)
      default:
        return data
    }
  }

  convertToCSV(data) {
    // Basic CSV conversion - would be more comprehensive in production
    const csvLines = []
    
    // Export nutrition data
    if (data.nutrition?.meals) {
      csvLines.push('Nutrition Data')
      csvLines.push('Date,Meal Type,Food,Calories,Protein,Carbs,Fats')
      
      data.nutrition.meals.forEach(meal => {
        csvLines.push(`${meal.date},${meal.type || 'Unknown'},${meal.name || 'Meal'},${meal.calories || 0},${meal.protein || 0},${meal.carbs || 0},${meal.fats || 0}`)
      })
      
      csvLines.push('')
    }
    
    return csvLines.join('\n')
  }

  stop() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
    }
    
    this.isInitialized = false
    console.log('🛑 Data Backup Service stopped')
  }
}

// Export singleton instance
export const dataBackupService = new DataBackupService()
export default dataBackupService