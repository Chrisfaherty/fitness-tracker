/**
 * Enterprise Services Initialization
 * Sets up all enterprise-grade data handling services on app startup
 */

import { enterpriseDataService } from '../services/enterpriseDataService.js'

/**
 * Initialize all enterprise services with recommended configuration
 */
export async function initializeEnterpriseServices(customConfig = {}) {
  console.log('🚀 Starting Enterprise Services Initialization...')
  
  const defaultConfig = {
    // Enable all services by default
    enableBackup: true,
    enableValidation: true,
    enablePerformance: true,
    
    // Health monitoring
    healthCheckInterval: 300000, // 5 minutes
    
    // Backup service configuration
    backup: {
      backupInterval: 300000, // 5 minutes
      cloudProvider: 'indexeddb', // Start with local storage
      encryptionEnabled: true,
      compressionEnabled: true,
      autoBackup: true,
      crossDeviceSync: true,
      retentionPeriod: 30, // 30 days
      maxBackupSize: 50 * 1024 * 1024, // 50MB
    },
    
    // Validation service configuration
    validation: {
      strictValidation: true,
      autoFix: true,
      duplicateThreshold: 0.95, // 95% similarity threshold
      validationInterval: 60000, // 1 minute
      realTimeValidation: true,
      maxValidationHistory: 1000
    },
    
    // Performance service configuration
    performance: {
      enableIndexing: true,
      enableCaching: true,
      enableBackgroundSync: true,
      maxWorkers: 4,
      cacheSize: 100 * 1024 * 1024, // 100MB
      indexUpdateInterval: 30000, // 30 seconds
      memoryCheckInterval: 60000, // 1 minute
      syncInterval: 300000, // 5 minutes
      virtualScrollThreshold: 100
    }
  }
  
  // Merge with custom configuration
  const finalConfig = mergeConfig(defaultConfig, customConfig)
  
  try {
    // Initialize the enterprise data service
    const initResult = await enterpriseDataService.initialize(finalConfig)
    
    if (initResult.initialized) {
      console.log('✅ Enterprise Services Initialized Successfully')
      console.log(`Active Services: ${initResult.services.join(', ')}`)
      console.log(`Health Status: ${initResult.healthStatus.overall}`)
      
      // Log service-specific initialization results
      if (initResult.services.includes('backup')) {
        console.log('📦 Backup Service: Ready for automatic data protection')
      }
      
      if (initResult.services.includes('validation')) {
        console.log('🔍 Validation Service: Real-time data quality monitoring active')
      }
      
      if (initResult.services.includes('performance')) {
        console.log('⚡ Performance Service: Search indexing and caching enabled')
      }
      
      // Run initial data integrity check
      setTimeout(async () => {
        console.log('🔍 Running initial data integrity check...')
        try {
          const integrityResult = await enterpriseDataService.performDataIntegrityCheck()
          console.log('✅ Initial integrity check completed')
          
          if (integrityResult.recommendations.length > 0) {
            console.log('📋 Recommendations:')
            integrityResult.recommendations.forEach(rec => console.log(`  - ${rec}`))
          }
        } catch (error) {
          console.error('❌ Initial integrity check failed:', error)
        }
      }, 10000) // Run after 10 seconds to allow app to fully load
      
      return {
        success: true,
        services: initResult.services,
        healthStatus: initResult.healthStatus,
        config: finalConfig
      }
      
    } else {
      throw new Error('Enterprise services failed to initialize')
    }
    
  } catch (error) {
    console.error('❌ Enterprise Services Initialization Failed:', error)
    
    // Provide fallback recommendations
    console.log('💡 Fallback Recommendations:')
    console.log('  - Check browser compatibility (requires IndexedDB, Web Workers)')
    console.log('  - Verify sufficient storage space available')
    console.log('  - Check console for detailed error messages')
    console.log('  - Consider disabling specific services if needed')
    
    return {
      success: false,
      error: error.message,
      fallback: 'Basic data storage available without enterprise features'
    }
  }
}

/**
 * Deep merge configuration objects
 */
function mergeConfig(defaultConfig, customConfig) {
  const result = { ...defaultConfig }
  
  for (const key in customConfig) {
    if (customConfig.hasOwnProperty(key)) {
      if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key]) && customConfig[key] !== null) {
        result[key] = mergeConfig(defaultConfig[key] || {}, customConfig[key])
      } else {
        result[key] = customConfig[key]
      }
    }
  }
  
  return result
}

/**
 * Initialize with production-ready configuration
 */
export async function initializeProductionServices() {
  return await initializeEnterpriseServices({
    // Production optimizations
    backup: {
      backupInterval: 600000, // 10 minutes (less frequent)
      retentionPeriod: 90, // 90 days retention
      cloudProvider: 'aws', // Use cloud storage in production
      compressionLevel: 9 // Maximum compression
    },
    
    validation: {
      validationInterval: 300000, // 5 minutes (less frequent)
      strictValidation: true,
      maxValidationHistory: 500 // Reduce memory usage
    },
    
    performance: {
      maxWorkers: 6, // More workers for production
      cacheSize: 200 * 1024 * 1024, // 200MB cache
      memoryCheckInterval: 300000 // 5 minutes
    },
    
    healthCheckInterval: 600000 // 10 minutes
  })
}

/**
 * Initialize with development-friendly configuration
 */
export async function initializeDevelopmentServices() {
  return await initializeEnterpriseServices({
    // Development optimizations
    backup: {
      backupInterval: 120000, // 2 minutes (more frequent for testing)
      retentionPeriod: 7, // 7 days retention
      autoBackup: true
    },
    
    validation: {
      validationInterval: 30000, // 30 seconds (more frequent)
      strictValidation: false, // Less strict for development
      autoFix: true
    },
    
    performance: {
      maxWorkers: 2, // Fewer workers for development
      cacheSize: 50 * 1024 * 1024, // 50MB cache
      indexUpdateInterval: 15000 // 15 seconds
    },
    
    healthCheckInterval: 120000 // 2 minutes
  })
}

/**
 * Initialize minimal services for testing
 */
export async function initializeTestServices() {
  return await initializeEnterpriseServices({
    enableBackup: false, // Disable backup in tests
    enableValidation: true, // Keep validation for data integrity
    enablePerformance: false, // Disable performance features
    
    validation: {
      realTimeValidation: false,
      validationInterval: 5000, // 5 seconds
      maxValidationHistory: 10
    },
    
    healthCheckInterval: 30000 // 30 seconds
  })
}

/**
 * Get recommended configuration based on environment
 */
export function getRecommendedConfig() {
  const env = process.env.NODE_ENV || 'development'
  const isProduction = env === 'production'
  const isTesting = env === 'test'
  
  if (isTesting) {
    return {
      function: initializeTestServices,
      description: 'Minimal services for testing environment'
    }
  } else if (isProduction) {
    return {
      function: initializeProductionServices,
      description: 'Production-optimized enterprise services'
    }
  } else {
    return {
      function: initializeDevelopmentServices,
      description: 'Development-friendly enterprise services'
    }
  }
}

/**
 * Cleanup enterprise services (for app shutdown)
 */
export function cleanupEnterpriseServices() {
  console.log('🛑 Shutting down Enterprise Services...')
  
  try {
    enterpriseDataService.stop()
    console.log('✅ Enterprise Services shutdown completed')
  } catch (error) {
    console.error('❌ Error during enterprise services shutdown:', error)
  }
}

/**
 * Check if enterprise services are supported in current environment
 */
export function checkEnterpriseSupport() {
  const support = {
    indexedDB: 'indexedDB' in window,
    webWorkers: 'Worker' in window,
    crypto: 'crypto' in window && 'subtle' in crypto,
    compression: 'CompressionStream' in window,
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: 'localStorage' in window
  }
  
  const isSupported = support.indexedDB && support.webWorkers && support.crypto
  
  return {
    supported: isSupported,
    features: support,
    recommendations: isSupported ? [] : [
      !support.indexedDB && 'IndexedDB required for data storage',
      !support.webWorkers && 'Web Workers required for performance features',
      !support.crypto && 'Web Crypto API required for data encryption'
    ].filter(Boolean)
  }
}

// Export default initialization function
export default initializeEnterpriseServices