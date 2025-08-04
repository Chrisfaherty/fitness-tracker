/**
 * Secure API Key Management Service
 * Handles secure storage, rotation, and management of API keys
 */

export class KeyManagementService {
  constructor() {
    this.isInitialized = false
    this.keyStore = new Map()
    this.encryptionKey = null
    this.keyRotationInterval = 24 * 60 * 60 * 1000 // 24 hours
    this.config = {
      keyLength: 32,
      rotationEnabled: true,
      environmentKeys: new Set(['OPENAI_API_KEY', 'NUTRITION_API_KEY', 'FITNESS_API_KEY']),
      developmentMode: process.env.NODE_ENV === 'development'
    }
  }

  /**
   * Initialize key management service
   */
  async initialize(options = {}) {
    console.log('🔐 Initializing Key Management Service')
    
    this.config = { ...this.config, ...options }
    
    // Initialize encryption for key storage
    await this.initializeEncryption()
    
    // Load existing keys
    await this.loadStoredKeys()
    
    // Setup key rotation if enabled
    if (this.config.rotationEnabled) {
      this.setupKeyRotation()
    }
    
    // Validate environment keys
    this.validateEnvironmentKeys()
    
    this.isInitialized = true
    console.log('✅ Key Management Service initialized')
    
    return true
  }

  /**
   * Initialize encryption for key storage
   */
  async initializeEncryption() {
    try {
      // Generate or retrieve master encryption key
      this.encryptionKey = await this.getMasterKey()
      
      // Verify encryption is working
      const testData = 'encryption-test'
      const encrypted = await this.encryptData(testData)
      const decrypted = await this.decryptData(encrypted)
      
      if (decrypted !== testData) {
        throw new Error('Encryption verification failed')
      }
      
      console.log('✅ Encryption initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error)
      throw error
    }
  }

  /**
   * Get or generate master encryption key
   */
  async getMasterKey() {
    const stored = sessionStorage.getItem('_mk')
    
    if (stored) {
      return await this.importKey(stored)
    }
    
    // Generate new master key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    // Store in session storage (temporary)
    const exported = await crypto.subtle.exportKey('raw', key)
    const keyString = btoa(String.fromCharCode(...new Uint8Array(exported)))
    sessionStorage.setItem('_mk', keyString)
    
    return key
  }

  /**
   * Import key from string
   */
  async importKey(keyString) {
    const keyData = new Uint8Array(
      atob(keyString).split('').map(char => char.charCodeAt(0))
    )
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt data using master key
   */
  async encryptData(data) {
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(data)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      dataBytes
    )
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return btoa(String.fromCharCode(...combined))
  }

  /**
   * Decrypt data using master key
   */
  async decryptData(encryptedData) {
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    )
    
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encrypted
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  /**
   * Store API key securely
   */
  async storeApiKey(keyId, apiKey, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('Key management service not initialized')
    }

    // Validate key format
    this.validateApiKey(keyId, apiKey)
    
    // Encrypt the API key
    const encryptedKey = await this.encryptData(apiKey)
    
    // Store key data
    const keyData = {
      id: keyId,
      encrypted: encryptedKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      rotationCount: 0,
      metadata: {
        service: metadata.service || 'unknown',
        environment: metadata.environment || 'production',
        ...metadata
      }
    }
    
    this.keyStore.set(keyId, keyData)
    await this.persistKeys()
    
    console.log(`🔑 API key stored securely: ${keyId}`)
    return true
  }

  /**
   * Retrieve API key
   */
  async getApiKey(keyId) {
    if (!this.keyStore.has(keyId)) {
      // Try to load from environment variables as fallback
      const envKey = this.getEnvironmentKey(keyId)
      if (envKey) {
        return envKey
      }
      
      throw new Error(`API key not found: ${keyId}`)
    }
    
    const keyData = this.keyStore.get(keyId)
    
    // Decrypt the key
    const apiKey = await this.decryptData(keyData.encrypted)
    
    // Update last used timestamp
    keyData.lastUsed = new Date().toISOString()
    await this.persistKeys()
    
    return apiKey
  }

  /**
   * Get key from environment variables
   */
  getEnvironmentKey(keyId) {
    const envVarName = keyId.toUpperCase().replace(/[^A-Z0-9]/g, '_')
    return process.env[envVarName] || null
  }

  /**
   * Rotate API key
   */
  async rotateApiKey(keyId, newApiKey) {
    if (!this.keyStore.has(keyId)) {
      throw new Error(`Cannot rotate non-existent key: ${keyId}`)
    }
    
    const keyData = this.keyStore.get(keyId)
    const oldEncrypted = keyData.encrypted
    
    // Encrypt new key
    const newEncrypted = await this.encryptData(newApiKey)
    
    // Update key data
    keyData.encrypted = newEncrypted
    keyData.rotatedAt = new Date().toISOString()
    keyData.rotationCount++
    keyData.previousKey = oldEncrypted // Keep for rollback
    
    await this.persistKeys()
    
    console.log(`🔄 API key rotated: ${keyId}`)
    
    // Dispatch rotation event
    this.dispatchKeyRotationEvent(keyId)
    
    return true
  }

  /**
   * Validate API key format
   */
  validateApiKey(keyId, apiKey) {
    if (!keyId || typeof keyId !== 'string') {
      throw new Error('Invalid key ID')
    }
    
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key')
    }
    
    if (apiKey.length < 8) {
      throw new Error('API key too short')
    }
    
    // Check for common patterns that might indicate insecure keys
    const insecurePatterns = [
      /^(test|demo|example)/i,
      /^(123|abc|password)/i,
      /^[a-z]+$/,
      /^[0-9]+$/
    ]
    
    if (insecurePatterns.some(pattern => pattern.test(apiKey))) {
      console.warn(`⚠️ Potentially insecure API key detected: ${keyId}`)
    }
  }

  /**
   * Validate environment keys
   */
  validateEnvironmentKeys() {
    const missingKeys = []
    
    this.config.environmentKeys.forEach(keyName => {
      if (!process.env[keyName] && !this.config.developmentMode) {
        missingKeys.push(keyName)
      }
    })
    
    if (missingKeys.length > 0) {
      console.warn('⚠️ Missing environment keys:', missingKeys)
    }
  }

  /**
   * Setup automatic key rotation
   */
  setupKeyRotation() {
    setInterval(() => {
      this.checkKeyRotation()
    }, this.keyRotationInterval)
    
    console.log('🔄 Key rotation scheduler started')
  }

  /**
   * Check if any keys need rotation
   */
  async checkKeyRotation() {
    const now = new Date()
    const rotationThreshold = 30 * 24 * 60 * 60 * 1000 // 30 days
    
    for (const [keyId, keyData] of this.keyStore) {
      const keyAge = now.getTime() - new Date(keyData.createdAt).getTime()
      
      if (keyAge > rotationThreshold) {
        console.log(`🔄 Key ${keyId} needs rotation (${Math.floor(keyAge / (24 * 60 * 60 * 1000))} days old)`)
        
        // Dispatch rotation needed event
        this.dispatchKeyRotationNeeded(keyId, keyAge)
      }
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId, reason = 'manual') {
    if (!this.keyStore.has(keyId)) {
      throw new Error(`Cannot revoke non-existent key: ${keyId}`)
    }
    
    const keyData = this.keyStore.get(keyId)
    keyData.revoked = true
    keyData.revokedAt = new Date().toISOString()
    keyData.revocationReason = reason
    
    await this.persistKeys()
    
    console.log(`🚫 API key revoked: ${keyId} (${reason})`)
    
    // Dispatch revocation event
    this.dispatchKeyRevocationEvent(keyId, reason)
    
    return true
  }

  /**
   * List all stored keys (metadata only)
   */
  listKeys() {
    return Array.from(this.keyStore.values()).map(keyData => ({
      id: keyData.id,
      createdAt: keyData.createdAt,
      lastUsed: keyData.lastUsed,
      rotationCount: keyData.rotationCount,
      revoked: keyData.revoked || false,
      metadata: keyData.metadata
    }))
  }

  /**
   * Get key usage statistics
   */
  getKeyStats() {
    const stats = {
      totalKeys: this.keyStore.size,
      activeKeys: 0,
      revokedKeys: 0,
      keysNeedingRotation: 0,
      oldestKey: null,
      newestKey: null
    }
    
    let oldest = null
    let newest = null
    
    this.keyStore.forEach(keyData => {
      if (keyData.revoked) {
        stats.revokedKeys++
      } else {
        stats.activeKeys++
      }
      
      const createdAt = new Date(keyData.createdAt)
      if (!oldest || createdAt < oldest) oldest = createdAt
      if (!newest || createdAt > newest) newest = createdAt
      
      // Check if needs rotation
      const keyAge = Date.now() - createdAt.getTime()
      if (keyAge > 30 * 24 * 60 * 60 * 1000) {
        stats.keysNeedingRotation++
      }
    })
    
    stats.oldestKey = oldest?.toISOString()
    stats.newestKey = newest?.toISOString()
    
    return stats
  }

  /**
   * Load stored keys from secure storage
   */
  async loadStoredKeys() {
    try {
      const encryptedData = localStorage.getItem('_sk')
      if (encryptedData) {
        const decryptedData = await this.decryptData(encryptedData)
        const keyData = JSON.parse(decryptedData)
        
        Object.entries(keyData).forEach(([keyId, data]) => {
          this.keyStore.set(keyId, data)
        })
        
        console.log(`🔑 Loaded ${this.keyStore.size} stored keys`)
      }
    } catch (error) {
      console.error('Failed to load stored keys:', error)
    }
  }

  /**
   * Persist keys to secure storage
   */
  async persistKeys() {
    try {
      const keyData = Object.fromEntries(this.keyStore)
      const jsonData = JSON.stringify(keyData)
      const encryptedData = await this.encryptData(jsonData)
      
      localStorage.setItem('_sk', encryptedData)
    } catch (error) {
      console.error('Failed to persist keys:', error)
    }
  }

  /**
   * Clear all stored keys (emergency use)
   */
  async clearAllKeys() {
    this.keyStore.clear()
    localStorage.removeItem('_sk')
    sessionStorage.removeItem('_mk')
    
    console.log('🧹 All stored keys cleared')
    
    // Reinitialize encryption
    await this.initializeEncryption()
  }

  /**
   * Export key metadata for audit
   */
  exportAuditLog() {
    return {
      exportedAt: new Date().toISOString(),
      totalKeys: this.keyStore.size,
      keys: Array.from(this.keyStore.values()).map(keyData => ({
        id: keyData.id,
        createdAt: keyData.createdAt,
        lastUsed: keyData.lastUsed,
        rotationCount: keyData.rotationCount,
        revoked: keyData.revoked || false,
        revokedAt: keyData.revokedAt,
        metadata: keyData.metadata
      }))
    }
  }

  // Event dispatchers
  dispatchKeyRotationEvent(keyId) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-key-rotated', {
        detail: { keyId, timestamp: new Date().toISOString() }
      }))
    }
  }

  dispatchKeyRotationNeeded(keyId, age) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-key-rotation-needed', {
        detail: { keyId, age, timestamp: new Date().toISOString() }
      }))
    }
  }

  dispatchKeyRevocationEvent(keyId, reason) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-key-revoked', {
        detail: { keyId, reason, timestamp: new Date().toISOString() }
      }))
    }
  }

  stop() {
    this.isInitialized = false
    console.log('🛑 Key Management Service stopped')
  }
}

export const keyManagementService = new KeyManagementService()
export default keyManagementService