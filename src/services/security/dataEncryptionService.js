/**
 * User Data Encryption Service
 * Handles client-side encryption of sensitive user data
 */

export class DataEncryptionService {
  constructor() {
    this.isInitialized = false
    this.encryptionKeys = new Map()
    this.encryptionConfig = {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 12,
      saltLength: 16,
      iterations: 100000
    }
    this.sensitiveFields = new Set([
      'weight', 'measurements', 'medicalInfo', 'personalDetails',
      'email', 'phone', 'address', 'emergencyContact',
      'medicationList', 'allergies', 'healthConditions',
      'biometricData', 'heartRate', 'bloodPressure'
    ])
  }

  /**
   * Initialize encryption service
   */
  async initialize(options = {}) {
    console.log('🔐 Initializing Data Encryption Service')
    
    this.config = {
      encryptByDefault: options.encryptByDefault !== false,
      compressionEnabled: options.compressionEnabled !== false,
      keyDerivationIterations: options.keyDerivationIterations || 100000,
      ...options
    }
    
    // Initialize encryption keys
    await this.initializeEncryptionKeys()
    
    // Setup data transformation interceptors
    this.setupDataInterceptors()
    
    this.isInitialized = true
    console.log('✅ Data Encryption Service initialized')
    
    return true
  }

  /**
   * Initialize encryption keys for different data types
   */
  async initializeEncryptionKeys() {
    const keyTypes = ['user', 'health', 'activity', 'nutrition']
    
    for (const keyType of keyTypes) {
      await this.generateEncryptionKey(keyType)
    }
  }

  /**
   * Generate encryption key for specific data type
   */
  async generateEncryptionKey(keyType) {
    try {
      // Check if key already exists
      const storedKey = await this.loadStoredKey(keyType)
      if (storedKey) {
        this.encryptionKeys.set(keyType, storedKey)
        return storedKey
      }
      
      // Generate new key
      const key = await crypto.subtle.generateKey(
        {
          name: this.encryptionConfig.algorithm,
          length: this.encryptionConfig.keyLength
        },
        true,
        ['encrypt', 'decrypt']
      )
      
      this.encryptionKeys.set(keyType, key)
      await this.storeKey(keyType, key)
      
      console.log(`🔑 Generated encryption key for: ${keyType}`)
      return key
    } catch (error) {
      console.error(`Failed to generate encryption key for ${keyType}:`, error)
      throw error
    }
  }

  /**
   * Store encryption key securely
   */
  async storeKey(keyType, key) {
    try {
      // Export key for storage
      const exported = await crypto.subtle.exportKey('raw', key)
      const keyString = btoa(String.fromCharCode(...new Uint8Array(exported)))
      
      // Store in session storage (memory only)
      sessionStorage.setItem(`_ek_${keyType}`, keyString)
    } catch (error) {
      console.error(`Failed to store key ${keyType}:`, error)
    }
  }

  /**
   * Load stored encryption key
   */
  async loadStoredKey(keyType) {
    try {
      const keyString = sessionStorage.getItem(`_ek_${keyType}`)
      if (!keyString) return null
      
      const keyData = new Uint8Array(
        atob(keyString).split('').map(char => char.charCodeAt(0))
      )
      
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        {
          name: this.encryptionConfig.algorithm,
          length: this.encryptionConfig.keyLength
        },
        true,
        ['encrypt', 'decrypt']
      )
    } catch (error) {
      console.error(`Failed to load key ${keyType}:`, error)
      return null
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data, keyType = 'user') {
    if (!this.isInitialized) {
      throw new Error('Data encryption service not initialized')
    }
    
    if (!data || typeof data !== 'object') {
      return data
    }
    
    try {
      const key = this.encryptionKeys.get(keyType)
      if (!key) {
        throw new Error(`Encryption key not found for type: ${keyType}`)
      }
      
      // Compress data if enabled
      let processedData = data
      if (this.config.compressionEnabled) {
        processedData = await this.compressData(data)
      }
      
      // Convert to JSON string
      const jsonString = JSON.stringify(processedData)
      const encoder = new TextEncoder()
      const dataBytes = encoder.encode(jsonString)
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(this.encryptionConfig.ivLength))
      
      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.encryptionConfig.algorithm,
          iv: iv
        },
        key,
        dataBytes
      )
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)
      
      // Return base64 encoded result with metadata
      return {
        _encrypted: true,
        _keyType: keyType,
        _algorithm: this.encryptionConfig.algorithm,
        _compressed: this.config.compressionEnabled,
        _timestamp: new Date().toISOString(),
        data: btoa(String.fromCharCode(...combined))
      }
    } catch (error) {
      console.error('Data encryption failed:', error)
      throw error
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedObj) {
    if (!encryptedObj || !encryptedObj._encrypted) {
      return encryptedObj
    }
    
    try {
      const key = this.encryptionKeys.get(encryptedObj._keyType || 'user')
      if (!key) {
        throw new Error(`Decryption key not found for type: ${encryptedObj._keyType}`)
      }
      
      // Decode base64 data
      const combined = new Uint8Array(
        atob(encryptedObj.data).split('').map(char => char.charCodeAt(0))
      )
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.encryptionConfig.ivLength)
      const encrypted = combined.slice(this.encryptionConfig.ivLength)
      
      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: encryptedObj._algorithm || this.encryptionConfig.algorithm,
          iv: iv
        },
        key,
        encrypted
      )
      
      // Convert back to string and parse JSON
      const decoder = new TextDecoder()
      const jsonString = decoder.decode(decrypted)
      let data = JSON.parse(jsonString)
      
      // Decompress if needed
      if (encryptedObj._compressed) {
        data = await this.decompressData(data)
      }
      
      return data
    } catch (error) {
      console.error('Data decryption failed:', error)
      throw error
    }
  }

  /**
   * Encrypt specific fields in an object
   */
  async encryptSensitiveFields(obj, keyType = 'user') {
    if (!obj || typeof obj !== 'object') {
      return obj
    }
    
    const result = { ...obj }
    
    for (const [key, value] of Object.entries(result)) {
      if (this.isSensitiveField(key) && value !== null && value !== undefined) {
        result[key] = await this.encryptData(value, keyType)
      } else if (typeof value === 'object' && value !== null) {
        // Recursively encrypt nested objects
        result[key] = await this.encryptSensitiveFields(value, keyType)
      }
    }
    
    return result
  }

  /**
   * Decrypt specific fields in an object
   */
  async decryptSensitiveFields(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj
    }
    
    const result = { ...obj }
    
    for (const [key, value] of Object.entries(result)) {
      if (value && typeof value === 'object' && value._encrypted) {
        result[key] = await this.decryptData(value)
      } else if (typeof value === 'object' && value !== null) {
        // Recursively decrypt nested objects
        result[key] = await this.decryptSensitiveFields(value)
      }
    }
    
    return result
  }

  /**
   * Check if field is sensitive
   */
  isSensitiveField(fieldName) {
    const lowerField = fieldName.toLowerCase()
    
    // Check direct matches
    if (this.sensitiveFields.has(lowerField)) {
      return true
    }
    
    // Check partial matches
    const sensitivePatterns = [
      /personal/i, /private/i, /sensitive/i, /medical/i,
      /health/i, /biometric/i, /contact/i, /address/i,
      /phone/i, /email/i, /weight/i, /height/i,
      /measurement/i, /vital/i, /prescription/i
    ]
    
    return sensitivePatterns.some(pattern => pattern.test(fieldName))
  }

  /**
   * Compress data before encryption
   */
  async compressData(data) {
    try {
      // Simple compression using gzip if available
      if (typeof CompressionStream !== 'undefined') {
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
        
        const compressed = new Uint8Array(
          chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        )
        let offset = 0
        for (const chunk of chunks) {
          compressed.set(chunk, offset)
          offset += chunk.length
        }
        
        return {
          _compressed: true,
          data: btoa(String.fromCharCode(...compressed))
        }
      }
      
      // Fallback: return original data
      return data
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error)
      return data
    }
  }

  /**
   * Decompress data after decryption
   */
  async decompressData(compressedData) {
    if (!compressedData || !compressedData._compressed) {
      return compressedData
    }
    
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new DecompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()
        
        const compressed = new Uint8Array(
          atob(compressedData.data).split('').map(char => char.charCodeAt(0))
        )
        
        writer.write(compressed)
        writer.close()
        
        const chunks = []
        let done = false
        
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) chunks.push(value)
        }
        
        const decompressed = new Uint8Array(
          chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        )
        let offset = 0
        for (const chunk of chunks) {
          decompressed.set(chunk, offset)
          offset += chunk.length
        }
        
        const decoder = new TextDecoder()
        const jsonString = decoder.decode(decompressed)
        return JSON.parse(jsonString)
      }
      
      // Fallback: return compressed data as-is
      return compressedData
    } catch (error) {
      console.warn('Decompression failed:', error)
      return compressedData
    }
  }

  /**
   * Setup data interceptors for automatic encryption
   */
  setupDataInterceptors() {
    if (typeof window === 'undefined') return
    
    // Intercept localStorage operations
    const originalSetItem = localStorage.setItem.bind(localStorage)
    const originalGetItem = localStorage.getItem.bind(localStorage)
    
    localStorage.setItem = async (key, value) => {
      if (this.shouldEncryptKey(key)) {
        try {
          const parsed = JSON.parse(value)
          const encrypted = await this.encryptSensitiveFields(parsed)
          return originalSetItem(key, JSON.stringify(encrypted))
        } catch (error) {
          console.warn('Failed to encrypt localStorage data:', error)
        }
      }
      return originalSetItem(key, value)
    }
    
    localStorage.getItem = async (key) => {
      const value = originalGetItem(key)
      if (value && this.shouldEncryptKey(key)) {
        try {
          const parsed = JSON.parse(value)
          const decrypted = await this.decryptSensitiveFields(parsed)
          return JSON.stringify(decrypted)
        } catch (error) {
          console.warn('Failed to decrypt localStorage data:', error)
        }
      }
      return value
    }
  }

  /**
   * Check if storage key should be encrypted
   */
  shouldEncryptKey(key) {
    const encryptedKeys = [
      'fitnessData', 'userData', 'healthData', 'personalInfo',
      'measurements', 'medicalInfo', 'biometricData'
    ]
    
    return encryptedKeys.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Generate encryption hash for data integrity
   */
  async generateDataHash(data) {
    const encoder = new TextEncoder()
    const jsonString = JSON.stringify(data)
    const dataBytes = encoder.encode(jsonString)
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes)
    const hashArray = new Uint8Array(hashBuffer)
    
    return btoa(String.fromCharCode(...hashArray))
  }

  /**
   * Verify data integrity
   */
  async verifyDataHash(data, expectedHash) {
    const actualHash = await this.generateDataHash(data)
    return actualHash === expectedHash
  }

  /**
   * Secure data wipe
   */
  async secureWipeData(keyType = null) {
    if (keyType) {
      // Wipe specific key type
      this.encryptionKeys.delete(keyType)
      sessionStorage.removeItem(`_ek_${keyType}`)
    } else {
      // Wipe all encryption data
      this.encryptionKeys.clear()
      
      // Clear all encryption keys from session storage
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('_ek_')) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
    }
    
    console.log('🧹 Secure data wipe completed')
  }

  /**
   * Get encryption statistics
   */
  getEncryptionStats() {
    return {
      initialized: this.isInitialized,
      activeKeys: this.encryptionKeys.size,
      keyTypes: Array.from(this.encryptionKeys.keys()),
      sensitiveFieldCount: this.sensitiveFields.size,
      compressionEnabled: this.config.compressionEnabled,
      algorithm: this.encryptionConfig.algorithm,
      keyLength: this.encryptionConfig.keyLength
    }
  }

  /**
   * Add custom sensitive field
   */
  addSensitiveField(fieldName) {
    this.sensitiveFields.add(fieldName.toLowerCase())
    console.log(`🔐 Added sensitive field: ${fieldName}`)
  }

  /**
   * Remove sensitive field
   */
  removeSensitiveField(fieldName) {
    this.sensitiveFields.delete(fieldName.toLowerCase())
    console.log(`🔓 Removed sensitive field: ${fieldName}`)
  }

  stop() {
    this.secureWipeData()
    this.isInitialized = false
    console.log('🛑 Data Encryption Service stopped')
  }
}

export const dataEncryptionService = new DataEncryptionService()
export default dataEncryptionService