import Quagga from 'quagga'
import openFoodFacts from './openFoodFacts'

/**
 * Enhanced Barcode Scanner with comprehensive debugging and iOS Safari fixes
 */
class BarcodeScannerDebug {
  constructor() {
    this.isScanning = false
    this.currentStream = null
    this.onDetectedHandlers = []
    this.scanCount = 0
    this.detectionThreshold = 3
    this.lastDetectedCode = null
    this.sameCodeCount = 0
    this.debugMode = process.env.NODE_ENV === 'development'
    this.performanceMetrics = {
      initTime: 0,
      scanDuration: 0,
      apiCallTime: 0,
      errors: []
    }
    
    // iOS Safari specific settings
    this.isSafariIOS = this.detectSafariIOS()
    this.isIOS = this.detectIOS()
    
    if (this.debugMode) {
      console.log('🔍 Barcode Scanner Debug Mode Enabled')
      console.log('📱 iOS detected:', this.isIOS)
      console.log('🧭 Safari iOS detected:', this.isSafariIOS)
    }
  }

  /**
   * Detect iOS Safari specifically
   */
  detectSafariIOS() {
    const ua = navigator.userAgent
    const iOS = /iPad|iPhone|iPod/.test(ua)
    const webkit = /WebKit/.test(ua)
    const standalone = window.navigator.standalone === true
    const chrome = /CriOS/.test(ua)
    const firefox = /FxiOS/.test(ua)
    
    return iOS && webkit && !chrome && !firefox && !standalone
  }

  /**
   * Detect iOS devices
   */
  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  /**
   * Enhanced browser support check with iOS Safari specific fixes
   */
  isSupported() {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    
    if (!hasGetUserMedia) {
      this.logError('SUPPORT_CHECK', 'getUserMedia not available')
      return false
    }

    // iOS Safari specific checks
    if (this.isSafariIOS) {
      // Check iOS version - camera API issues in older versions
      const iOSVersion = this.getIOSVersion()
      if (iOSVersion && iOSVersion < 14) {
        this.logError('SUPPORT_CHECK', `iOS version ${iOSVersion} may have camera issues`)
        return false
      }
      
      // Check if in standalone mode (PWA) - camera doesn't work in older iOS PWAs
      if (window.navigator.standalone) {
        this.logError('SUPPORT_CHECK', 'Camera not supported in iOS PWA mode')
        return false
      }
    }

    return true
  }

  /**
   * Get iOS version number
   */
  getIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/)
    return match ? parseInt(match[1], 10) : null
  }

  /**
   * Enhanced HTTPS check with localhost exceptions
   */
  isHTTPS() {
    const isSecure = location.protocol === 'https:'
    const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname)
    const isFile = location.protocol === 'file:'
    
    const result = isSecure || isLocalhost || isFile
    
    if (!result) {
      this.logError('HTTPS_CHECK', `Insecure context: ${location.protocol}//${location.hostname}`)
    }
    
    return result
  }

  /**
   * Enhanced camera permission request with iOS Safari specific handling
   */
  async requestCameraPermission() {
    const startTime = Date.now()
    
    try {
      if (!this.isHTTPS()) {
        throw new Error('HTTPS_REQUIRED')
      }

      if (!this.isSupported()) {
        throw new Error('NOT_SUPPORTED')
      }

      // iOS Safari specific constraints
      const constraints = this.getOptimalConstraints()
      
      this.logDebug('PERMISSION_REQUEST', 'Requesting camera permission with constraints:', constraints)

      // For iOS Safari, we need to request permission in a user gesture context
      if (this.isSafariIOS) {
        // First try basic constraint to ensure permission
        const basicStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        
        // Stop immediately after getting permission
        basicStream.getTracks().forEach(track => track.stop())
        
        // Small delay to ensure proper cleanup
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Now request with full constraints
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (!stream.getVideoTracks().length) {
        throw new Error('NO_VIDEO_TRACK')
      }

      // Test video track capabilities
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities ? track.getCapabilities() : {}
      
      this.logDebug('PERMISSION_SUCCESS', 'Camera capabilities:', capabilities)

      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop())
      
      this.performanceMetrics.initTime = Date.now() - startTime
      
      return {
        granted: true,
        message: 'Camera access granted',
        capabilities,
        device: this.getDeviceInfo()
      }
    } catch (error) {
      this.performanceMetrics.initTime = Date.now() - startTime
      this.logError('PERMISSION_ERROR', error)
      return this.handlePermissionError(error)
    }
  }

  /**
   * Get optimal camera constraints based on device and browser
   */
  getOptimalConstraints() {
    const baseConstraints = {
      video: {
        facingMode: { ideal: 'environment' }
      }
    }

    // iOS Safari specific optimizations
    if (this.isSafariIOS) {
      return {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      }
    }

    // Android Chrome optimizations
    if (this.isAndroidChrome()) {
      return {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 30 }
        }
      }
    }

    // Desktop optimizations
    return {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        aspectRatio: { ideal: 16/9 }
      }
    }
  }

  /**
   * Detect Android Chrome
   */
  isAndroidChrome() {
    return /Android.*Chrome/.test(navigator.userAgent)
  }

  /**
   * Enhanced camera enumeration with detailed device info
   */
  async getCameras() {
    try {
      if (!this.isSupported()) {
        return []
      }

      // Request permission first to get device labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
        tempStream.getTracks().forEach(track => track.stop())
      } catch (error) {
        this.logDebug('CAMERA_ENUM', 'Permission not granted, device labels may be unavailable')
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      
      const cameraInfo = cameras.map(camera => {
        const info = {
          id: camera.deviceId,
          label: camera.label || `Camera ${camera.deviceId.substring(0, 8)}`,
          facingMode: this.guessFacingMode(camera.label),
          groupId: camera.groupId
        }
        
        // iOS specific camera detection
        if (this.isIOS) {
          if (info.label.toLowerCase().includes('back')) {
            info.facingMode = 'environment'
            info.isMainCamera = true
          } else if (info.label.toLowerCase().includes('front')) {
            info.facingMode = 'user'
            info.isMainCamera = false
          }
        }
        
        return info
      })
      
      this.logDebug('CAMERA_ENUM', 'Available cameras:', cameraInfo)
      
      return cameraInfo
    } catch (error) {
      this.logError('CAMERA_ENUM_ERROR', error)
      return []
    }
  }

  /**
   * Enhanced QuaggaJS initialization with device-specific optimizations
   */
  async startScanning(elementId, onSuccess, onError, options = {}) {
    if (this.isScanning) {
      this.logError('SCANNER_STATE', 'Scanner already running')
      onError('Scanner is already active')
      return
    }

    const startTime = Date.now()
    this.performanceMetrics.scanDuration = startTime

    try {
      // Check permission first
      const permission = await this.requestCameraPermission()
      if (!permission.granted) {
        onError(permission.message, permission)
        return
      }

      // Get enhanced Quagga config
      const config = this.getQuaggaConfig(elementId, options)
      
      this.logDebug('QUAGGA_INIT', 'Initializing with config:', config)

      // Initialize with retry logic for iOS Safari
      let initAttempts = 0
      const maxAttempts = this.isSafariIOS ? 3 : 1
      
      while (initAttempts < maxAttempts) {
        try {
          await this.initQuagga(config)
          break
        } catch (error) {
          initAttempts++
          this.logError('QUAGGA_INIT_ATTEMPT', `Attempt ${initAttempts} failed:`, error)
          
          if (initAttempts >= maxAttempts) {
            throw error
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Set up detection handler with device optimizations
      this.setupEnhancedDetectionHandler(onSuccess, onError)
      
      // Start scanning
      Quagga.start()
      this.isScanning = true
      
      this.logDebug('SCANNER_STARTED', 'Scanner started successfully')
      
      // Reset scan state
      this.resetScanState()

    } catch (error) {
      this.logError('SCANNER_START_ERROR', error)
      this.isScanning = false
      onError('Failed to initialize barcode scanner: ' + error.message)
    }
  }

  /**
   * Get device-optimized Quagga configuration
   */
  getQuaggaConfig(elementId, options) {
    const baseConfig = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: `#${elementId}`,
        constraints: this.getOptimalConstraints().video,
        area: {
          top: "20%",
          right: "20%",
          left: "20%",
          bottom: "20%"
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: Math.min(navigator.hardwareConcurrency || 2, 4),
      frequency: 10,
      decoder: {
        readers: this.getOptimalReaders(),
        debug: this.debugMode ? this.getDebugConfig() : { showCanvas: false }
      },
      locate: true
    }

    // iOS Safari specific optimizations
    if (this.isSafariIOS) {
      baseConfig.inputStream.constraints = {
        ...baseConfig.inputStream.constraints,
        frameRate: { ideal: 15, max: 30 } // Reduce frame rate for better performance
      }
      baseConfig.frequency = 5 // Reduce scan frequency
      baseConfig.numOfWorkers = 1 // Single worker for iOS
    }

    // Android Chrome optimizations
    if (this.isAndroidChrome()) {
      baseConfig.frequency = 15 // Higher frequency for better responsiveness
      baseConfig.locator.patchSize = "large"
    }

    return baseConfig
  }

  /**
   * Get optimal barcode readers based on region/device
   */
  getOptimalReaders() {
    const baseReaders = [
      "ean_reader",
      "ean_8_reader", 
      "code_128_reader",
      "upc_reader",
      "upc_e_reader"
    ]

    // Add additional readers for desktop/high-performance devices
    if (!this.isSafariIOS) {
      baseReaders.push(
        "code_39_reader",
        "code_39_vin_reader",
        "codabar_reader",
        "i2of5_reader"
      )
    }

    return baseReaders
  }

  /**
   * Get debug configuration for development
   */
  getDebugConfig() {
    return {
      showCanvas: true,
      showPatches: false,
      showFoundPatches: false,
      showSkeleton: false,
      showLabels: false,
      showPatchLabels: false,
      showRemainingPatchLabels: false,
      boxFromPatches: {
        showTransformed: false,
        showTransformedBox: false,
        showBB: false
      }
    }
  }

  /**
   * Initialize Quagga with proper error handling
   */
  async initQuagga(config) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Quagga initialization timeout'))
      }, 10000) // 10 second timeout

      Quagga.init(config, (err) => {
        clearTimeout(timeout)
        
        if (err) {
          this.logError('QUAGGA_INIT_ERROR', err)
          
          // Enhanced error handling for specific cases
          if (err.message && err.message.includes('getUserMedia')) {
            reject(new Error('CAMERA_ACCESS_FAILED'))
          } else if (err.message && err.message.includes('constraints')) {
            reject(new Error('CAMERA_CONSTRAINTS_FAILED'))
          } else {
            reject(err)
          }
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Enhanced detection handler with confidence scoring
   */
  setupEnhancedDetectionHandler(onSuccess, onError) {
    const onDetected = async (result) => {
      const code = result.codeResult.code
      const confidence = this.calculateConfidence(result)
      
      this.logDebug('DETECTION', `Code: ${code}, Confidence: ${confidence}`)
      
      // Enhanced validation with confidence scoring
      if (!this.isValidBarcode(code) || confidence < 0.7) {
        this.logDebug('DETECTION_REJECTED', `Invalid or low confidence: ${code} (${confidence})`)
        return
      }

      // Implement detection threshold with confidence weighting
      if (code === this.lastDetectedCode) {
        this.sameCodeCount++
      } else {
        this.lastDetectedCode = code
        this.sameCodeCount = 1
      }

      // Adjust threshold based on confidence
      const requiredCount = confidence > 0.9 ? 2 : this.detectionThreshold
      
      if (this.sameCodeCount >= requiredCount) {
        this.logDebug('DETECTION_SUCCESS', `Code confirmed: ${code}`)
        
        try {
          this.stopScanning()
          
          const barcodeData = this.parseBarcode(code)
          barcodeData.confidence = confidence
          
          // Enhanced product lookup with retry logic
          await this.lookupProductWithRetry(barcodeData, onSuccess, onError)
          
        } catch (error) {
          this.logError('DETECTION_PROCESSING_ERROR', error)
          onError('Error processing barcode: ' + error.message)
        }
      }
    }

    // Clean up existing handlers
    Quagga.offDetected(this.onDetectedHandlers)
    this.onDetectedHandlers = [onDetected]
    
    Quagga.onDetected(onDetected)
  }

  /**
   * Calculate detection confidence score
   */
  calculateConfidence(result) {
    const codeResult = result.codeResult
    let confidence = 0

    // Base confidence from Quagga
    if (codeResult && codeResult.decodedCodes) {
      const avgError = codeResult.decodedCodes.reduce((sum, code) => {
        return sum + (code.error || 0)
      }, 0) / codeResult.decodedCodes.length

      confidence = Math.max(0, 1 - avgError)
    }

    // Adjust based on code length and format
    const code = codeResult.code
    if (code) {
      if (/^\d{13}$/.test(code)) confidence += 0.1 // EAN-13
      if (/^\d{12}$/.test(code)) confidence += 0.1 // UPC-A
      if (code.length >= 8) confidence += 0.05
    }

    return Math.min(1, confidence)
  }

  /**
   * Enhanced product lookup with retry and caching
   */
  async lookupProductWithRetry(barcodeData, onSuccess, onError, retryCount = 0) {
    const maxRetries = 3
    const apiStartTime = Date.now()

    try {
      // Try to get product info with exponential backoff
      const productInfo = await openFoodFacts.getProductByBarcode(barcodeData.code)
      
      this.performanceMetrics.apiCallTime = Date.now() - apiStartTime
      
      barcodeData.product = productInfo
      barcodeData.hasProductInfo = true
      
      onSuccess(barcodeData)
      
    } catch (productError) {
      this.logError('PRODUCT_LOOKUP_ERROR', productError)
      
      if (retryCount < maxRetries && this.shouldRetry(productError)) {
        const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
        
        this.logDebug('PRODUCT_LOOKUP_RETRY', `Retrying in ${delay}ms (attempt ${retryCount + 1})`)
        
        setTimeout(() => {
          this.lookupProductWithRetry(barcodeData, onSuccess, onError, retryCount + 1)
        }, delay)
        
      } else {
        barcodeData.hasProductInfo = false
        barcodeData.productError = productError.message
        
        // Still call success with barcode info, let UI handle missing product
        onSuccess(barcodeData)
      }
    }
  }

  /**
   * Determine if error is retryable
   */
  shouldRetry(error) {
    const retryableErrors = [
      'ENOTFOUND',
      'ECONNABORTED', 
      'NETWORK_ERROR',
      'Request timeout'
    ]
    
    return retryableErrors.some(retryable => 
      error.message.includes(retryable) || error.code === retryable
    )
  }

  /**
   * Enhanced barcode validation
   */
  isValidBarcode(code) {
    if (!code || typeof code !== 'string' || code.length < 6) {
      return false
    }

    const cleanCode = code.replace(/[\s-]/g, '')
    
    // Enhanced format validation
    const formats = [
      /^\d{8}$/,    // EAN-8
      /^\d{12}$/,   // UPC-A
      /^\d{13}$/,   // EAN-13
      /^\d{14}$/,   // ITF-14
      /^[0-9A-Z\-\.\ \$\/\+\%]{6,}$/ // Code 39 and others
    ]
    
    // Additional checksum validation for EAN/UPC codes
    if (/^\d{13}$/.test(cleanCode)) {
      return this.validateEAN13(cleanCode)
    }
    
    if (/^\d{12}$/.test(cleanCode)) {
      return this.validateUPCA(cleanCode)
    }
    
    return formats.some(format => format.test(cleanCode))
  }

  /**
   * Validate EAN-13 checksum
   */
  validateEAN13(code) {
    const digits = code.split('').map(Number)
    const checksum = digits.pop()
    
    let sum = 0
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3)
    }
    
    const calculatedChecksum = (10 - (sum % 10)) % 10
    return calculatedChecksum === checksum
  }

  /**
   * Validate UPC-A checksum
   */
  validateUPCA(code) {
    const digits = code.split('').map(Number)
    const checksum = digits.pop()
    
    let sum = 0
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1)
    }
    
    const calculatedChecksum = (10 - (sum % 10)) % 10
    return calculatedChecksum === checksum
  }

  /**
   * Enhanced error handling for permission errors
   */
  handlePermissionError(error) {
    const deviceInfo = this.getDeviceInfo()
    
    const errorMap = {
      'NotAllowedError': {
        granted: false,
        code: 'PERMISSION_DENIED',
        message: `Camera access denied. ${this.getPermissionHelpText()}`,
        userAction: 'Enable camera permissions',
        device: deviceInfo
      },
      'NotFoundError': {
        granted: false,
        code: 'NO_CAMERA',
        message: 'No camera found on this device.',
        userAction: 'Connect a camera or try a different device',
        device: deviceInfo
      },
      'NotSupportedError': {
        granted: false,
        code: 'NOT_SUPPORTED',
        message: `Camera not supported. ${this.getBrowserHelpText()}`,
        userAction: 'Try a supported browser',
        device: deviceInfo
      },
      'HTTPS_REQUIRED': {
        granted: false,
        code: 'HTTPS_REQUIRED',
        message: 'Camera requires secure connection (HTTPS).',
        userAction: 'Access site using HTTPS',
        device: deviceInfo
      },
      'NotReadableError': {
        granted: false,
        code: 'CAMERA_BUSY',
        message: 'Camera is busy or being used by another app.',
        userAction: 'Close other camera apps and try again',
        device: deviceInfo
      }
    }

    const errorKey = error.name || error.message || 'UnknownError'
    const errorInfo = errorMap[errorKey] || {
      granted: false,
      code: 'UNKNOWN_ERROR',
      message: `Camera error: ${error.message}`,
      userAction: 'Try refreshing or using different browser',
      device: deviceInfo
    }

    this.performanceMetrics.errors.push({
      type: errorInfo.code,
      message: error.message,
      timestamp: Date.now(),
      device: deviceInfo
    })

    return errorInfo
  }

  /**
   * Get device-specific permission help text
   */
  getPermissionHelpText() {
    if (this.isSafariIOS) {
      return 'In Safari, look for camera icon in address bar and tap "Allow".'
    }
    if (this.isAndroidChrome()) {
      return 'In Chrome, look for camera icon in address bar and tap "Allow".'
    }
    return 'Look for camera icon in browser address bar and click "Allow".'
  }

  /**
   * Get browser-specific help text
   */
  getBrowserHelpText() {
    return 'Try Chrome, Firefox, or Safari (latest versions).'
  }

  /**
   * Get comprehensive device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isIOS: this.isIOS,
      isSafariIOS: this.isSafariIOS,
      isAndroidChrome: this.isAndroidChrome(),
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      isHTTPS: this.isHTTPS(),
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio
      }
    }
  }

  /**
   * Reset scan state
   */
  resetScanState() {
    this.scanCount = 0
    this.lastDetectedCode = null
    this.sameCodeCount = 0
  }

  /**
   * Enhanced stop scanning with cleanup
   */
  stopScanning() {
    if (this.isScanning) {
      try {
        Quagga.stop()
        Quagga.offDetected(this.onDetectedHandlers)
        this.isScanning = false
        this.resetScanState()
        
        this.logDebug('SCANNER_STOPPED', 'Scanner stopped successfully')
      } catch (error) {
        this.logError('SCANNER_STOP_ERROR', error)
      }
    }
  }

  /**
   * Get comprehensive diagnostic information
   */
  async getDiagnostics() {
    const deviceInfo = this.getDeviceInfo()
    const cameras = await this.getCameras()
    
    return {
      device: deviceInfo,
      cameras,
      permissions: await this.checkPermissions(),
      performance: this.performanceMetrics,
      support: {
        getUserMedia: this.isSupported(),
        https: this.isHTTPS(),
        quagga: typeof Quagga !== 'undefined'
      },
      recommendations: this.getRecommendations()
    }
  }

  /**
   * Check various permissions
   */
  async checkPermissions() {
    const results = {}
    
    try {
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' })
        results.camera = cameraPermission.state
      }
    } catch (error) {
      results.camera = 'unknown'
    }
    
    return results
  }

  /**
   * Get device-specific recommendations
   */
  getRecommendations() {
    const recommendations = []
    
    if (this.isSafariIOS) {
      recommendations.push('For best results on iOS Safari, use good lighting and hold device steady')
      recommendations.push('If camera fails, try refreshing the page')
    }
    
    if (!this.isHTTPS()) {
      recommendations.push('Use HTTPS for better camera support')
    }
    
    if (this.performanceMetrics.errors.length > 0) {
      recommendations.push('Multiple errors detected - try different browser or device')
    }
    
    return recommendations
  }

  /**
   * Enhanced logging with device context
   */
  logDebug(category, message, data) {
    if (this.debugMode) {
      console.log(`🔍 [${category}] ${message}`, data || '')
    }
  }

  logError(category, error, data) {
    console.error(`❌ [${category}] ${error.message || error}`, data || '')
    
    this.performanceMetrics.errors.push({
      category,
      error: error.message || error,
      timestamp: Date.now(),
      data
    })
  }

  /**
   * Parse barcode with enhanced metadata
   */
  parseBarcode(code) {
    const cleanCode = code.replace(/[\s-]/g, '')
    
    const result = {
      code: cleanCode,
      originalCode: code,
      type: 'unknown',
      isValid: this.isValidBarcode(code),
      timestamp: new Date().toISOString(),
      device: this.getDeviceInfo().platform
    }

    // Enhanced type detection
    if (/^\d{8}$/.test(cleanCode)) {
      result.type = 'EAN-8'
    } else if (/^\d{12}$/.test(cleanCode)) {
      result.type = 'UPC-A'
      result.checksumValid = this.validateUPCA(cleanCode)
    } else if (/^\d{13}$/.test(cleanCode)) {
      result.type = 'EAN-13'
      result.checksumValid = this.validateEAN13(cleanCode)
    } else if (/^\d{14}$/.test(cleanCode)) {
      result.type = 'ITF-14'
    } else if (/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(cleanCode)) {
      result.type = 'Code 39'
    }

    result.isFoodBarcode = ['EAN-13', 'UPC-A', 'EAN-8'].includes(result.type)
    
    return result
  }
}

export default new BarcodeScannerDebug()