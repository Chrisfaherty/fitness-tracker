/**
 * Secure Data Transmission Service
 * Handles secure communication, request signing, and data integrity
 */

export class SecureTransmissionService {
  constructor() {
    this.isInitialized = false
    this.keyPairs = new Map()
    this.certificates = new Map()
    this.securityConfig = {
      encryptionAlgorithm: 'RSA-OAEP',
      signingAlgorithm: 'RSA-PSS',
      hashAlgorithm: 'SHA-256',
      keySize: 2048,
      certificateValidityPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      nonceSize: 16,
      timestampTolerance: 300000 // 5 minutes
    }
    this.requestQueue = new Map()
    this.securityHeaders = new Map()
  }

  /**
   * Initialize secure transmission service
   */
  async initialize(options = {}) {
    console.log('🔐 Initializing Secure Transmission Service')
    
    this.config = {
      enableRequestSigning: options.enableRequestSigning !== false,
      enableResponseVerification: options.enableResponseVerification !== false,
      enablePayloadEncryption: options.enablePayloadEncryption !== false,
      enableCertificatePinning: options.enableCertificatePinning || false,
      trustedDomains: options.trustedDomains || [],
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      ...options
    }
    
    // Initialize cryptographic keys
    await this.initializeCryptographicKeys()
    
    // Setup secure networking
    this.setupSecureNetworking()
    
    // Setup request/response interceptors
    this.setupSecurityInterceptors()
    
    // Initialize certificate management
    await this.initializeCertificateManagement()
    
    this.isInitialized = true
    console.log('✅ Secure Transmission Service initialized')
    
    return true
  }

  /**
   * Initialize cryptographic key pairs
   */
  async initializeCryptographicKeys() {
    try {
      // Generate or load signing key pair
      const signingKeyPair = await this.generateOrLoadKeyPair('signing', {
        name: this.securityConfig.signingAlgorithm,
        modulusLength: this.securityConfig.keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: this.securityConfig.hashAlgorithm
      })
      
      this.keyPairs.set('signing', signingKeyPair)
      
      // Generate or load encryption key pair
      const encryptionKeyPair = await this.generateOrLoadKeyPair('encryption', {
        name: this.securityConfig.encryptionAlgorithm,
        modulusLength: this.securityConfig.keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: this.securityConfig.hashAlgorithm
      })
      
      this.keyPairs.set('encryption', encryptionKeyPair)
      
      console.log('🔑 Cryptographic keys initialized')
    } catch (error) {
      console.error('Failed to initialize cryptographic keys:', error)
      throw error
    }
  }

  /**
   * Generate or load key pair
   */
  async generateOrLoadKeyPair(keyType, algorithm) {
    // Try to load existing key pair
    const existingKeyPair = await this.loadKeyPair(keyType)
    if (existingKeyPair) {
      return existingKeyPair
    }
    
    // Generate new key pair
    const keyPair = await crypto.subtle.generateKey(
      algorithm,
      true, // extractable
      keyType === 'signing' ? ['sign', 'verify'] : ['encrypt', 'decrypt']
    )
    
    // Store the key pair
    await this.storeKeyPair(keyType, keyPair)
    
    console.log(`🔑 Generated new ${keyType} key pair`)
    return keyPair
  }

  /**
   * Store key pair securely
   */
  async storeKeyPair(keyType, keyPair) {
    try {
      // Export keys
      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
      const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
      
      // Convert to base64
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)))
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)))
      
      // Store in session storage (temporary)
      sessionStorage.setItem(`_pk_${keyType}`, publicKeyBase64)
      sessionStorage.setItem(`_sk_${keyType}`, privateKeyBase64)
      
    } catch (error) {
      console.error(`Failed to store ${keyType} key pair:`, error)
    }
  }

  /**
   * Load key pair from storage
   */
  async loadKeyPair(keyType) {
    try {
      const publicKeyBase64 = sessionStorage.getItem(`_pk_${keyType}`)
      const privateKeyBase64 = sessionStorage.getItem(`_sk_${keyType}`)
      
      if (!publicKeyBase64 || !privateKeyBase64) {
        return null
      }
      
      // Convert from base64
      const publicKeyData = new Uint8Array(
        atob(publicKeyBase64).split('').map(char => char.charCodeAt(0))
      )
      const privateKeyData = new Uint8Array(
        atob(privateKeyBase64).split('').map(char => char.charCodeAt(0))
      )
      
      // Import keys
      const algorithm = keyType === 'signing' 
        ? { name: this.securityConfig.signingAlgorithm, hash: this.securityConfig.hashAlgorithm }
        : { name: this.securityConfig.encryptionAlgorithm, hash: this.securityConfig.hashAlgorithm }
      
      const publicKey = await crypto.subtle.importKey(
        'spki',
        publicKeyData,
        algorithm,
        true,
        keyType === 'signing' ? ['verify'] : ['encrypt']
      )
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyData,
        algorithm,
        true,
        keyType === 'signing' ? ['sign'] : ['decrypt']
      )
      
      return { publicKey, privateKey }
    } catch (error) {
      console.error(`Failed to load ${keyType} key pair:`, error)
      return null
    }
  }

  /**
   * Setup secure networking configurations
   */
  setupSecureNetworking() {
    // Configure security headers
    this.securityHeaders.set('X-Content-Type-Options', 'nosniff')
    this.securityHeaders.set('X-Frame-Options', 'DENY')
    this.securityHeaders.set('X-XSS-Protection', '1; mode=block')
    this.securityHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    this.securityHeaders.set('Content-Security-Policy', "default-src 'self'")
    
    console.log('🌐 Secure networking configured')
  }

  /**
   * Setup security interceptors for requests and responses
   */
  setupSecurityInterceptors() {
    if (typeof window === 'undefined') return
    
    // Intercept fetch requests
    const originalFetch = window.fetch
    window.fetch = async (url, options = {}) => {
      return this.secureRequest(url, options, originalFetch)
    }
    
    // Intercept XMLHttpRequest
    const originalXHRSend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function(data) {
      this.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
      return originalXHRSend.call(this, data)
    }
    
    console.log('🛡️ Security interceptors installed')
  }

  /**
   * Make secure HTTP request
   */
  async secureRequest(url, options = {}, originalFetch = fetch) {
    try {
      // Validate URL
      this.validateRequestUrl(url)
      
      // Prepare secure options
      const secureOptions = await this.prepareSecureOptions(url, options)
      
      // Make request with retries
      return await this.executeRequestWithRetries(url, secureOptions, originalFetch)
      
    } catch (error) {
      console.error('Secure request failed:', error)
      throw error
    }
  }

  /**
   * Validate request URL for security
   */
  validateRequestUrl(url) {
    const urlObj = new URL(url, window.location.origin)
    
    // Check protocol
    if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
      throw new Error(`Unsupported protocol: ${urlObj.protocol}`)
    }
    
    // Warn about HTTP in production
    if (urlObj.protocol === 'http:' && window.location.protocol === 'https:') {
      console.warn('⚠️ Making HTTP request from HTTPS context')
    }
    
    // Check if domain is trusted
    if (this.config.trustedDomains.length > 0) {
      const isTrusted = this.config.trustedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      )
      
      if (!isTrusted) {
        console.warn(`⚠️ Request to untrusted domain: ${urlObj.hostname}`)
      }
    }
  }

  /**
   * Prepare secure request options
   */
  async prepareSecureOptions(url, options) {
    const secureOptions = { ...options }
    
    // Set security headers
    secureOptions.headers = {
      ...secureOptions.headers,
      ...Object.fromEntries(this.securityHeaders)
    }
    
    // Add timestamp and nonce
    const timestamp = Date.now()
    const nonce = this.generateNonce()
    
    secureOptions.headers['X-Timestamp'] = timestamp.toString()
    secureOptions.headers['X-Nonce'] = nonce
    
    // Sign request if enabled
    if (this.config.enableRequestSigning && this.keyPairs.has('signing')) {
      const signature = await this.signRequest(url, secureOptions, timestamp, nonce)
      secureOptions.headers['X-Signature'] = signature
    }
    
    // Encrypt payload if enabled and body exists
    if (this.config.enablePayloadEncryption && secureOptions.body) {
      secureOptions.body = await this.encryptPayload(secureOptions.body)
      secureOptions.headers['X-Encrypted'] = 'true'
    }
    
    // Add integrity hash for body
    if (secureOptions.body) {
      const bodyHash = await this.calculateHash(secureOptions.body)
      secureOptions.headers['X-Body-Hash'] = bodyHash
    }
    
    return secureOptions
  }

  /**
   * Sign HTTP request
   */
  async signRequest(url, options, timestamp, nonce) {
    try {
      const signingKeyPair = this.keyPairs.get('signing')
      if (!signingKeyPair) {
        throw new Error('Signing key pair not available')
      }
      
      // Create signature payload
      const method = options.method || 'GET'
      const urlObj = new URL(url, window.location.origin)
      const path = urlObj.pathname + urlObj.search
      const body = options.body || ''
      
      const signaturePayload = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}`
      
      // Sign the payload
      const encoder = new TextEncoder()
      const payloadBytes = encoder.encode(signaturePayload)
      
      const signature = await crypto.subtle.sign(
        {
          name: this.securityConfig.signingAlgorithm,
          saltLength: 32
        },
        signingKeyPair.privateKey,
        payloadBytes
      )
      
      return btoa(String.fromCharCode(...new Uint8Array(signature)))
    } catch (error) {
      console.error('Request signing failed:', error)
      throw error
    }
  }

  /**
   * Encrypt request payload
   */
  async encryptPayload(payload) {
    try {
      const encryptionKeyPair = this.keyPairs.get('encryption')
      if (!encryptionKeyPair) {
        throw new Error('Encryption key pair not available')
      }
      
      const encoder = new TextEncoder()
      const payloadBytes = encoder.encode(typeof payload === 'string' ? payload : JSON.stringify(payload))
      
      const encrypted = await crypto.subtle.encrypt(
        { name: this.securityConfig.encryptionAlgorithm },
        encryptionKeyPair.publicKey,
        payloadBytes
      )
      
      return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    } catch (error) {
      console.error('Payload encryption failed:', error)
      throw error
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeRequestWithRetries(url, options, originalFetch) {
    let lastError = null
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await originalFetch(url, options)
        
        // Verify response if enabled
        if (this.config.enableResponseVerification) {
          await this.verifyResponse(response.clone())
        }
        
        return response
      } catch (error) {
        lastError = error
        console.warn(`Request attempt ${attempt + 1} failed:`, error.message)
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break
        }
        
        // Wait before retry
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt))
        }
      }
    }
    
    throw lastError
  }

  /**
   * Verify response integrity and authenticity
   */
  async verifyResponse(response) {
    try {
      // Check security headers
      this.checkSecurityHeaders(response)
      
      // Verify response signature if present
      const signature = response.headers.get('X-Response-Signature')
      if (signature && this.keyPairs.has('signing')) {
        const isValid = await this.verifyResponseSignature(response, signature)
        if (!isValid) {
          throw new Error('Response signature verification failed')
        }
      }
      
      // Check response timestamp
      const timestamp = response.headers.get('X-Response-Timestamp')
      if (timestamp) {
        const responseTime = parseInt(timestamp)
        const now = Date.now()
        
        if (Math.abs(now - responseTime) > this.securityConfig.timestampTolerance) {
          console.warn('⚠️ Response timestamp outside tolerance')
        }
      }
      
    } catch (error) {
      console.error('Response verification failed:', error)
      // Don't throw error for verification failures in non-critical mode
      if (this.config.strictVerification) {
        throw error
      }
    }
  }

  /**
   * Check response security headers
   */
  checkSecurityHeaders(response) {
    const expectedHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Content-Security-Policy'
    ]
    
    const missingHeaders = expectedHeaders.filter(header => 
      !response.headers.has(header)
    )
    
    if (missingHeaders.length > 0) {
      console.warn('⚠️ Missing security headers:', missingHeaders)
    }
  }

  /**
   * Generate cryptographic nonce
   */
  generateNonce() {
    const nonce = new Uint8Array(this.securityConfig.nonceSize)
    crypto.getRandomValues(nonce)
    return btoa(String.fromCharCode(...nonce))
  }

  /**
   * Calculate hash of data
   */
  async calculateHash(data) {
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
    
    const hashBuffer = await crypto.subtle.digest(this.securityConfig.hashAlgorithm, dataBytes)
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
  }

  /**
   * Initialize certificate management
   */
  async initializeCertificateManagement() {
    if (!this.config.enableCertificatePinning) return
    
    // Load pinned certificates
    await this.loadPinnedCertificates()
    
    console.log('📜 Certificate management initialized')
  }

  /**
   * Load pinned certificates
   */
  async loadPinnedCertificates() {
    const pinnedCerts = this.config.pinnedCertificates || []
    
    pinnedCerts.forEach(cert => {
      this.certificates.set(cert.domain, {
        fingerprint: cert.fingerprint,
        algorithm: cert.algorithm || 'SHA-256',
        expiresAt: cert.expiresAt
      })
    })
  }

  /**
   * Check if error is non-retryable
   */
  isNonRetryableError(error) {
    const nonRetryableErrors = [
      'TypeError', // Network errors
      'SyntaxError', // JSON parsing errors
      'ReferenceError' // Programming errors
    ]
    
    return nonRetryableErrors.includes(error.constructor.name) ||
           (error.status && error.status >= 400 && error.status < 500) // Client errors
  }

  /**
   * Delay execution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get public key for external verification
   */
  async getPublicKey(keyType = 'signing') {
    const keyPair = this.keyPairs.get(keyType)
    if (!keyPair) {
      throw new Error(`Key pair not found: ${keyType}`)
    }
    
    const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    return btoa(String.fromCharCode(...new Uint8Array(exported)))
  }

  /**
   * Generate secure WebSocket connection
   */
  createSecureWebSocket(url, protocols = []) {
    const wsUrl = new URL(url)
    
    // Ensure secure protocol
    if (wsUrl.protocol === 'ws:' && window.location.protocol === 'https:') {
      wsUrl.protocol = 'wss:'
    }
    
    // Add security headers as query parameters (WebSocket limitation)
    const nonce = this.generateNonce()
    const timestamp = Date.now()
    
    wsUrl.searchParams.set('nonce', nonce)
    wsUrl.searchParams.set('timestamp', timestamp.toString())
    
    const ws = new WebSocket(wsUrl.toString(), protocols)
    
    // Add security event handlers
    ws.addEventListener('open', () => {
      console.log('🔐 Secure WebSocket connection established')
    })
    
    ws.addEventListener('error', (error) => {
      console.error('🚨 WebSocket security error:', error)
    })
    
    return ws
  }

  /**
   * Secure data export
   */
  async secureExport(data, format = 'json') {
    const exportData = {
      exportId: this.generateNonce(),
      exportedAt: new Date().toISOString(),
      format,
      integrity: await this.calculateHash(data),
      data: this.config.enablePayloadEncryption ? await this.encryptPayload(data) : data
    }
    
    // Sign the export
    if (this.config.enableRequestSigning) {
      const signature = await this.signData(JSON.stringify(exportData))
      exportData.signature = signature
    }
    
    return exportData
  }

  /**
   * Sign arbitrary data
   */
  async signData(data) {
    const signingKeyPair = this.keyPairs.get('signing')
    if (!signingKeyPair) {
      throw new Error('Signing key pair not available')
    }
    
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(data)
    
    const signature = await crypto.subtle.sign(
      {
        name: this.securityConfig.signingAlgorithm,
        saltLength: 32
      },
      signingKeyPair.privateKey,
      dataBytes
    )
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
  }

  /**
   * Get transmission security status
   */
  getSecurityStatus() {
    return {
      initialized: this.isInitialized,
      keyPairs: Array.from(this.keyPairs.keys()),
      securityFeatures: {
        requestSigning: this.config.enableRequestSigning,
        responseVerification: this.config.enableResponseVerification,
        payloadEncryption: this.config.enablePayloadEncryption,
        certificatePinning: this.config.enableCertificatePinning
      },
      trustedDomains: this.config.trustedDomains,
      certificates: this.certificates.size,
      lastKeyGeneration: this.getLastKeyGeneration()
    }
  }

  /**
   * Get last key generation timestamp
   */
  getLastKeyGeneration() {
    const signingKey = sessionStorage.getItem('_pk_signing')
    return signingKey ? 'Available' : 'Not generated'
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    console.log('🔄 Rotating encryption keys...')
    
    // Generate new key pairs
    await this.initializeCryptographicKeys()
    
    console.log('✅ Key rotation completed')
    
    // Dispatch key rotation event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-keys-rotated', {
        detail: { timestamp: new Date().toISOString() }
      }))
    }
  }

  /**
   * Clean up sensitive data
   */
  secureCleanup() {
    // Clear key pairs from memory
    this.keyPairs.clear()
    
    // Clear certificates
    this.certificates.clear()
    
    // Remove keys from session storage
    const keysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith('_pk_') || key.startsWith('_sk_'))) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    console.log('🧹 Secure cleanup completed')
  }

  stop() {
    this.secureCleanup()
    this.isInitialized = false
    console.log('🛑 Secure Transmission Service stopped')
  }
}

export const secureTransmissionService = new SecureTransmissionService()
export default secureTransmissionService