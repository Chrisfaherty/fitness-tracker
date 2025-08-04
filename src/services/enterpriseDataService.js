/**
 * Enterprise Data Service
 * Unified interface for all enterprise-grade data handling features
 */

import { dataBackupService } from './dataBackupService.js'
import { dataValidationService } from './dataValidationService.js'
import { performanceService } from './performanceService.js'
import useFitnessStore from '../store/fitnessStore.js'

export class EnterpriseDataService {
  constructor() {
    this.isInitialized = false
    this.services = new Map()
    this.healthStatus = {
      backup: 'unknown',
      validation: 'unknown',
      performance: 'unknown',
      overall: 'unknown'
    }
    this.healthCheckInterval = null
    this.alertSubscribers = new Set()
  }

  /**
   * Initialize all enterprise services
   */
  async initialize(config = {}) {
    console.log('🚀 Initializing Enterprise Data Service')
    
    this.config = {
      enableBackup: config.enableBackup !== false,
      enableValidation: config.enableValidation !== false,
      enablePerformance: config.enablePerformance !== false,
      healthCheckInterval: config.healthCheckInterval || 300000, // 5 minutes
      ...config
    }

    const initPromises = []

    // Initialize backup service
    if (this.config.enableBackup) {
      initPromises.push(
        dataBackupService.initialize(config.backup || {})
          .then(() => {
            this.services.set('backup', dataBackupService)
            this.healthStatus.backup = 'healthy'
          })
          .catch(error => {
            console.error('Failed to initialize backup service:', error)
            this.healthStatus.backup = 'error'
          })
      )
    }

    // Initialize validation service
    if (this.config.enableValidation) {
      initPromises.push(
        dataValidationService.initialize(config.validation || {})
          .then(() => {
            this.services.set('validation', dataValidationService)
            this.healthStatus.validation = 'healthy'
          })
          .catch(error => {
            console.error('Failed to initialize validation service:', error)
            this.healthStatus.validation = 'error'
          })
      )
    }

    // Initialize performance service
    if (this.config.enablePerformance) {
      initPromises.push(
        performanceService.initialize(config.performance || {})
          .then(() => {
            this.services.set('performance', performanceService)
            this.healthStatus.performance = 'healthy'
          })
          .catch(error => {
            console.error('Failed to initialize performance service:', error)
            this.healthStatus.performance = 'error'
          })
      )
    }

    // Wait for all services to initialize
    await Promise.all(initPromises)

    // Start health monitoring
    this.startHealthMonitoring()

    // Setup data flow integration
    this.setupDataFlowIntegration()

    this.isInitialized = true
    this.updateOverallHealth()
    
    console.log('✅ Enterprise Data Service initialized')
    console.log(`Services: ${Array.from(this.services.keys()).join(', ')}`)
    
    return {
      initialized: true,
      services: Array.from(this.services.keys()),
      healthStatus: this.healthStatus
    }
  }

  /**
   * Setup integrated data flow between services
   */
  setupDataFlowIntegration() {
    // Integrate validation with backup
    if (this.services.has('validation') && this.services.has('backup')) {
      // Backup before validation repairs
      const originalRepairMethod = dataValidationService.repairCorruptedData
      dataValidationService.repairCorruptedData = async function() {
        await dataBackupService.createBackup('pre-validation-repair')
        return originalRepairMethod.call(this)
      }
    }

    // Integrate performance with validation
    if (this.services.has('performance') && this.services.has('validation')) {
      // Clear performance cache when validation fixes data
      const originalValidateAllData = dataValidationService.validateAllData
      dataValidationService.validateAllData = async function() {
        const result = await originalValidateAllData.call(this)
        if (result.summary.autoFixed > 0) {
          performanceService.clearCache()
        }
        return result
      }
    }

    // Setup cross-service event handling
    if (typeof window !== 'undefined') {
      // When data is modified, trigger validation and backup
      const dataEvents = ['meal-logged', 'workout-completed', 'sleep-logged', 'measurement-logged']
      
      dataEvents.forEach(eventType => {
        window.addEventListener(eventType, async (event) => {
          // Validate new data
          if (this.services.has('validation')) {
            const category = this.getDataCategory(eventType)
            const subcategory = this.getDataSubcategory(eventType)
            await dataValidationService.validateData(category, subcategory, event.detail)
          }

          // Schedule backup
          if (this.services.has('backup')) {
            dataBackupService.scheduleBackup(`${eventType}-change`, { priority: 'medium' })
          }

          // Update performance indexes
          if (this.services.has('performance')) {
            performanceService.scheduleIndexUpdate(this.getDataCategory(eventType))
          }
        })
      })
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)

    // Initial health check
    setTimeout(() => this.performHealthCheck(), 10000)
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    console.log('🏥 Performing enterprise services health check...')

    try {
      // Check backup service health
      if (this.services.has('backup')) {
        const backupStats = dataBackupService.getBackupStats()
        const recentBackups = backupStats.totalBackups > 0
        const lowFailureRate = backupStats.failedBackups / Math.max(1, backupStats.totalBackups) < 0.1
        
        this.healthStatus.backup = recentBackups && lowFailureRate ? 'healthy' : 'degraded'
      }

      // Check validation service health
      if (this.services.has('validation')) {
        const validationStats = dataValidationService.getValidationStats()
        const recentValidations = validationStats.totalValidations > 0
        const lowCorruption = validationStats.dataCorruptions < 10
        
        this.healthStatus.validation = recentValidations && lowCorruption ? 'healthy' : 'degraded'
      }

      // Check performance service health
      if (this.services.has('performance')) {
        const perfMetrics = performanceService.getPerformanceMetrics()
        const avgQueryTime = perfMetrics.avgQueryTime
        const availableWorkers = perfMetrics.availableWorkers
        
        this.healthStatus.performance = avgQueryTime < 1000 && availableWorkers > 0 ? 'healthy' : 'degraded'
      }

      this.updateOverallHealth()

      // Alert on health issues
      if (this.healthStatus.overall === 'error' || this.healthStatus.overall === 'degraded') {
        this.notifyHealthIssue()
      }

    } catch (error) {
      console.error('Health check failed:', error)
      this.healthStatus.overall = 'error'
    }
  }

  /**
   * Update overall health status
   */
  updateOverallHealth() {
    const statuses = Object.values(this.healthStatus).filter(status => status !== 'unknown')
    
    if (statuses.includes('error')) {
      this.healthStatus.overall = 'error'
    } else if (statuses.includes('degraded')) {
      this.healthStatus.overall = 'degraded'
    } else if (statuses.every(status => status === 'healthy')) {
      this.healthStatus.overall = 'healthy'
    } else {
      this.healthStatus.overall = 'unknown'
    }
  }

  /**
   * Notify subscribers of health issues
   */
  notifyHealthIssue() {
    const healthReport = {
      timestamp: new Date().toISOString(),
      overall: this.healthStatus.overall,
      services: this.healthStatus,
      recommendation: this.getHealthRecommendation()
    }

    this.alertSubscribers.forEach(callback => {
      try {
        callback(healthReport)
      } catch (error) {
        console.error('Health alert callback failed:', error)
      }
    })
  }

  /**
   * Get health recommendation
   */
  getHealthRecommendation() {
    const issues = []
    
    if (this.healthStatus.backup === 'error' || this.healthStatus.backup === 'degraded') {
      issues.push('Backup service needs attention - data loss risk')
    }
    
    if (this.healthStatus.validation === 'error' || this.healthStatus.validation === 'degraded') {
      issues.push('Validation service issues - data quality at risk')
    }
    
    if (this.healthStatus.performance === 'error' || this.healthStatus.performance === 'degraded') {
      issues.push('Performance service degraded - user experience impact')
    }

    return issues.length > 0 ? issues.join('; ') : 'All services operating normally'
  }

  /**
   * Comprehensive data integrity check
   */
  async performDataIntegrityCheck() {
    console.log('🔍 Starting comprehensive data integrity check...')
    
    const results = {
      timestamp: new Date().toISOString(),
      backup: null,
      validation: null,
      performance: null,
      crossValidation: null,
      recommendations: []
    }

    try {
      // Backup integrity
      if (this.services.has('backup')) {
        const backups = await dataBackupService.listBackups({ limit: 5 })
        results.backup = {
          availableBackups: backups.length,
          latestBackup: backups[0]?.timestamp || null,
          backupSizes: backups.map(b => b.size),
          status: backups.length > 0 ? 'healthy' : 'warning'
        }
        
        if (backups.length === 0) {
          results.recommendations.push('No backups available - create backup immediately')
        }
      }

      // Validation integrity
      if (this.services.has('validation')) {
        const validationResult = await dataValidationService.validateAllData()
        results.validation = {
          totalChecks: validationResult.summary.totalChecks,
          failedChecks: validationResult.summary.failedChecks,
          duplicatesFound: validationResult.summary.duplicatesFound,
          corruptionsFound: validationResult.summary.corruptionsFound,
          status: validationResult.summary.failedChecks === 0 ? 'healthy' : 'warning'
        }
        
        if (validationResult.summary.failedChecks > 0) {
          results.recommendations.push(`${validationResult.summary.failedChecks} validation issues found - review data quality`)
        }
      }

      // Performance integrity
      if (this.services.has('performance')) {
        const perfMetrics = performanceService.getPerformanceMetrics()
        results.performance = {
          avgQueryTime: perfMetrics.avgQueryTime,
          cacheHitRate: perfMetrics.cacheHits / Math.max(1, perfMetrics.cacheHits + perfMetrics.cacheMisses),
          memoryUsage: perfMetrics.memoryUsage,
          indexCount: perfMetrics.indexCount,
          status: perfMetrics.avgQueryTime < 1000 ? 'healthy' : 'warning'
        }
        
        if (perfMetrics.avgQueryTime > 1000) {
          results.recommendations.push('Query performance degraded - consider index rebuilding')
        }
      }

      // Cross-service validation
      results.crossValidation = await this.performCrossServiceValidation()

      console.log('✅ Data integrity check completed')
      return results

    } catch (error) {
      console.error('Data integrity check failed:', error)
      results.error = error.message
      return results
    }
  }

  /**
   * Cross-service validation
   */
  async performCrossServiceValidation() {
    const results = {
      dataConsistency: 'unknown',
      serviceSync: 'unknown',
      issues: []
    }

    try {
      const fitnessData = useFitnessStore.getState()
      
      // Check if backup data matches current data
      if (this.services.has('backup')) {
        const latestBackup = await dataBackupService.getLastBackup()
        if (latestBackup) {
          const currentChecksum = await this.calculateDataChecksum(fitnessData)
          if (latestBackup.metadata?.checksum !== currentChecksum) {
            results.issues.push('Current data differs from latest backup - consider new backup')
          }
        }
      }

      // Check if performance indexes are up to date
      if (this.services.has('performance')) {
        const indexMetrics = performanceService.getPerformanceMetrics()
        if (indexMetrics.indexCount === 0) {
          results.issues.push('Performance indexes missing - rebuild recommended')
        }
      }

      results.dataConsistency = results.issues.length === 0 ? 'consistent' : 'inconsistent'
      results.serviceSync = 'synchronized' // Assuming sync for now

    } catch (error) {
      results.issues.push(`Cross-validation error: ${error.message}`)
    }

    return results
  }

  /**
   * Emergency data recovery
   */
  async emergencyDataRecovery(options = {}) {
    console.log('🚨 Starting emergency data recovery...')
    
    const recovery = {
      timestamp: new Date().toISOString(),
      steps: [],
      success: false,
      errors: []
    }

    try {
      // Step 1: Create current state backup
      if (this.services.has('backup')) {
        recovery.steps.push('Creating emergency backup of current state')
        await dataBackupService.createBackup('emergency-recovery', null, {
          priority: 'critical',
          description: 'Pre-recovery state backup'
        })
      }

      // Step 2: Run data validation and repair
      if (this.services.has('validation')) {
        recovery.steps.push('Running data validation and repair')
        const repairResult = await dataValidationService.repairCorruptedData()
        if (!repairResult.success) {
          recovery.errors.push('Data repair failed')
        }
      }

      // Step 3: Restore from backup if requested
      if (options.restoreFromBackup && this.services.has('backup')) {
        recovery.steps.push('Restoring from backup')
        const backups = await dataBackupService.listBackups({ limit: 5 })
        if (backups.length > 0) {
          const backupToRestore = options.backupId 
            ? backups.find(b => b.id === options.backupId)
            : backups[0]
          
          if (backupToRestore) {
            await dataBackupService.restoreFromBackup(backupToRestore.id)
          } else {
            recovery.errors.push('Specified backup not found')
          }
        } else {
          recovery.errors.push('No backups available for restore')
        }
      }

      // Step 4: Rebuild performance indexes
      if (this.services.has('performance')) {
        recovery.steps.push('Rebuilding performance indexes')
        await performanceService.rebuildIndexes()
      }

      // Step 5: Final validation
      if (this.services.has('validation')) {
        recovery.steps.push('Final data validation')
        const finalValidation = await dataValidationService.validateAllData()
        if (finalValidation.summary.failedChecks > 0) {
          recovery.errors.push(`${finalValidation.summary.failedChecks} validation issues remain`)
        }
      }

      recovery.success = recovery.errors.length === 0
      console.log(recovery.success ? '✅ Emergency recovery completed' : '❌ Emergency recovery completed with errors')
      
      return recovery

    } catch (error) {
      recovery.errors.push(error.message)
      recovery.success = false
      console.error('Emergency recovery failed:', error)
      return recovery
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      initialized: this.isInitialized,
      services: {
        backup: this.services.has('backup') ? dataBackupService.getBackupStats() : null,
        validation: this.services.has('validation') ? dataValidationService.getValidationStats() : null,
        performance: this.services.has('performance') ? performanceService.getPerformanceMetrics() : null
      },
      health: this.healthStatus,
      config: this.config
    }
  }

  /**
   * Optimize all services
   */
  async optimizeAllServices() {
    console.log('⚡ Optimizing all enterprise services...')
    
    const optimizationResults = []

    try {
      // Optimize backup service
      if (this.services.has('backup')) {
        await dataBackupService.cleanupOldBackups()
        optimizationResults.push('Backup: Cleaned up old backups')
      }

      // Optimize validation service
      if (this.services.has('validation')) {
        dataValidationService.cleanupDuplicateCache()
        optimizationResults.push('Validation: Cleaned up duplicate cache')
      }

      // Optimize performance service
      if (this.services.has('performance')) {
        performanceService.performMemoryCleanup()
        optimizationResults.push('Performance: Memory cleanup performed')
      }

      console.log('✅ Service optimization completed')
      return optimizationResults

    } catch (error) {
      console.error('Service optimization failed:', error)
      throw error
    }
  }

  // Utility methods

  getDataCategory(eventType) {
    const mapping = {
      'meal-logged': 'nutrition',
      'workout-completed': 'activity',
      'sleep-logged': 'wellness',
      'measurement-logged': 'body'
    }
    return mapping[eventType] || 'unknown'
  }

  getDataSubcategory(eventType) {
    const mapping = {
      'meal-logged': 'meals',
      'workout-completed': 'workouts',
      'sleep-logged': 'sleepEntries',
      'measurement-logged': 'measurements'
    }
    return mapping[eventType] || 'unknown'
  }

  async calculateDataChecksum(data) {
    const jsonString = JSON.stringify(data, Object.keys(data).sort())
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(jsonString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Public API methods

  subscribeToHealthAlerts(callback) {
    this.alertSubscribers.add(callback)
    return () => this.alertSubscribers.delete(callback)
  }

  async createBackup(type = 'manual', options = {}) {
    if (!this.services.has('backup')) {
      throw new Error('Backup service not available')
    }
    return dataBackupService.createBackup(type, null, options)
  }

  async validateData(category, subcategory, data) {
    if (!this.services.has('validation')) {
      throw new Error('Validation service not available')
    }
    return dataValidationService.validateData(category, subcategory, data)
  }

  async searchData(query, type, options = {}) {
    if (!this.services.has('performance')) {
      throw new Error('Performance service not available')
    }
    return performanceService.performSearch(query, type, options)
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    // Stop all services
    this.services.forEach((service, name) => {
      if (service.stop) {
        service.stop()
      }
    })

    this.isInitialized = false
    console.log('🛑 Enterprise Data Service stopped')
  }
}

// Export singleton instance
export const enterpriseDataService = new EnterpriseDataService()
export default enterpriseDataService