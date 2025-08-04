import Quagga from 'quagga'
import openFoodFacts from './openFoodFacts'

/**
 * Mobile-Optimized Barcode Scanner with Advanced Features
 * Handles orientation, focus, zoom, flashlight, and feedback
 */
class MobileBarcodeScanner {
  constructor() {
    this.isScanning = false
    this.currentStream = null
    this.videoElement = null
    this.onDetectedHandlers = []
    this.scanCount = 0
    this.detectionThreshold = 2 // Reduced for mobile responsiveness
    this.lastDetectedCode = null
    this.sameCodeCount = 0
    
    // Mobile-specific properties
    this.currentTrack = null
    this.capabilities = null
    this.settings = {
      zoom: 1,
      focusMode: 'continuous',
      torch: false,
      orientation: 'portrait'
    }
    
    // Feedback settings
    this.feedbackEnabled = {
      vibration: true,
      sound: true,
      visual: true
    }
    
    // Device detection
    this.deviceInfo = this.detectDevice()
    
    // Initialize audio context for beep sounds
    this.initializeAudio()
    
    // Bind methods to preserve context
    this.handleOrientationChange = this.handleOrientationChange.bind(this)
  }

  /**
   * Detect device type and capabilities
   */
  detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform?.toLowerCase() || ''
    
    return {
      isIOS: /iphone|ipad|ipod/.test(userAgent) || platform.includes('iphone') || platform.includes('ipad'),
      isAndroid: /android/.test(userAgent),
      isMobile: /mobile|android|iphone|ipad|ipod/.test(userAgent),
      browser: this.detectBrowser(),
      supportsTorch: 'ImageCapture' in window,
      supportsZoom: 'ImageCapture' in window,
      supportsFocus: 'ImageCapture' in window,
      supportsVibration: 'vibrate' in navigator,
      supportsOrientation: 'orientation' in screen || 'onorientationchange' in window
    }
  }

  /**
   * Detect browser type for compatibility
   */
  detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return 'safari'
    } else if (userAgent.includes('chrome')) {
      return 'chrome'
    } else if (userAgent.includes('firefox')) {
      return 'firefox'
    } else if (userAgent.includes('edge')) {
      return 'edge'
    }
    
    return 'unknown'
  }

  /**
   * Initialize audio context for scan feedback
   */
  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.audioInitialized = true
    } catch (error) {
      console.warn('Audio context not available:', error)
      this.audioInitialized = false
    }
  }

  /**
   * Check if browser supports camera access with enhanced mobile detection
   */
  isSupported() {
    return !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia &&
      this.deviceInfo.isMobile
    )
  }

  /**
   * Check HTTPS requirement with local development support
   */
  isHTTPS() {
    return (
      location.protocol === 'https:' || 
      location.hostname === 'localhost' || 
      location.hostname === '127.0.0.1' ||
      location.hostname.includes('ngrok') ||
      location.hostname.includes('vercel.app') ||
      location.hostname.includes('netlify.app')
    )
  }

  /**
   * Request camera permission with mobile-optimized constraints
   */
  async requestCameraPermission(preferredCamera = 'environment') {
    try {
      if (!this.isHTTPS()) {
        throw new Error('HTTPS_REQUIRED')
      }

      if (!this.isSupported()) {
        throw new Error('NOT_SUPPORTED')
      }

      // Mobile-optimized constraints
      const baseConstraints = {
        video: {
          facingMode: { ideal: preferredCamera },
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 }
        }
      }

      // Add iOS Safari specific constraints
      if (this.deviceInfo.isIOS && this.deviceInfo.browser === 'safari') {
        baseConstraints.video = {
          ...baseConstraints.video,
          // iOS Safari specific optimizations
          frameRate: { ideal: 30, max: 30 },
          resizeMode: 'crop-and-scale'
        }
      }

      // Add Android Chrome optimizations
      if (this.deviceInfo.isAndroid && this.deviceInfo.browser === 'chrome') {
        baseConstraints.video = {
          ...baseConstraints.video,
          focusMode: { ideal: 'continuous' },
          exposureMode: { ideal: 'continuous' },
          whiteBalanceMode: { ideal: 'continuous' }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(baseConstraints)
      
      if (!stream.getVideoTracks().length) {
        throw new Error('NO_VIDEO_TRACK')
      }

      // Get track capabilities for advanced features
      this.currentTrack = stream.getVideoTracks()[0]
      this.capabilities = this.currentTrack.getCapabilities()
      
      console.log('📱 Camera capabilities:', this.capabilities)
      console.log('📱 Device info:', this.deviceInfo)

      // Stop the stream as we just wanted to check permission
      stream.getTracks().forEach(track => track.stop())
      
      return {
        granted: true,
        message: 'Camera access granted',
        capabilities: this.capabilities
      }
    } catch (error) {
      console.error('Camera permission error:', error)
      return this.handlePermissionError(error)
    }
  }

  /**
   * Enhanced permission error handling for mobile devices
   */
  handlePermissionError(error) {
    const errorMap = {
      'NotAllowedError': {
        granted: false,
        code: 'PERMISSION_DENIED',
        message: this.deviceInfo.isIOS 
          ? 'Camera blocked. Tap the camera icon in Safari\'s address bar and select "Allow".'
          : 'Camera access denied. Please allow camera access in your browser settings.',
        userAction: this.deviceInfo.isIOS 
          ? 'Tap camera icon in address bar → Allow'
          : 'Settings → Site permissions → Camera → Allow'
      },
      'NotFoundError': {
        granted: false,
        code: 'NO_CAMERA',
        message: 'No camera found. Make sure your device has a working camera.',
        userAction: 'Check camera hardware or try another device'
      },
      'NotSupportedError': {
        granted: false,
        code: 'NOT_SUPPORTED',
        message: this.deviceInfo.isIOS && this.deviceInfo.browser !== 'safari'
          ? 'Camera scanning works best in Safari on iOS devices.'
          : 'Camera access not supported in this browser.',
        userAction: this.deviceInfo.isIOS 
          ? 'Open in Safari for best results'
          : 'Try Chrome, Firefox, or Safari'
      },
      'HTTPS_REQUIRED': {
        granted: false,
        code: 'HTTPS_REQUIRED',
        message: 'Camera requires secure connection (HTTPS).',
        userAction: 'Access site using HTTPS'
      },
      'NotReadableError': {
        granted: false,
        code: 'CAMERA_BUSY',
        message: 'Camera is being used by another app. Close other camera apps and try again.',
        userAction: 'Close other camera apps'
      },
      'OverconstrainedError': {
        granted: false,
        code: 'CAMERA_CONSTRAINTS',
        message: 'Camera settings not supported. Trying fallback mode.',
        userAction: 'Device may have limited camera capabilities'
      }
    }

    const errorKey = error.name || error.message || 'UnknownError'
    return errorMap[errorKey] || {
      granted: false,
      code: 'UNKNOWN_ERROR',
      message: `Camera error: ${error.message}`,
      userAction: 'Try refreshing or using different browser'
    }
  }

  /**
   * Get available cameras with enhanced mobile detection
   */
  async getCameras() {
    try {
      if (!this.isSupported()) {
        return []
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      
      return cameras.map(camera => ({
        id: camera.deviceId,
        label: camera.label || this.generateCameraLabel(camera.deviceId),
        facingMode: this.guessFacingMode(camera.label),
        isPreferred: this.isPreferredCamera(camera)
      }))
    } catch (error) {
      console.error('Error enumerating cameras:', error)
      return []
    }
  }

  /**
   * Generate user-friendly camera labels
   */
  generateCameraLabel(deviceId) {
    const shortId = deviceId.substring(0, 8)
    return `Camera ${shortId}`
  }

  /**
   * Enhanced facing mode detection
   */
  guessFacingMode(label) {
    const lowerLabel = label.toLowerCase()
    
    // Check for common patterns
    if (lowerLabel.includes('back') || 
        lowerLabel.includes('rear') || 
        lowerLabel.includes('environment') ||
        lowerLabel.includes('0') && !lowerLabel.includes('front')) {
      return 'environment'
    }
    
    if (lowerLabel.includes('front') || 
        lowerLabel.includes('user') || 
        lowerLabel.includes('face') ||
        lowerLabel.includes('selfie')) {
      return 'user'
    }
    
    return 'unknown'
  }

  /**
   * Determine if camera is preferred for barcode scanning
   */
  isPreferredCamera(camera) {
    const facingMode = this.guessFacingMode(camera.label)
    return facingMode === 'environment' // Back camera is preferred
  }

  /**
   * Setup orientation change handling
   */
  setupOrientationHandling() {
    if (this.deviceInfo.supportsOrientation) {
      // Listen for orientation changes
      window.addEventListener('orientationchange', this.handleOrientationChange)
      screen.addEventListener?.('orientationchange', this.handleOrientationChange)
      
      // Initial orientation
      this.handleOrientationChange()
    }
  }

  /**
   * Handle device orientation changes
   */
  handleOrientationChange() {
    const orientation = screen.orientation?.angle || window.orientation || 0
    const orientationMap = {
      0: 'portrait',
      90: 'landscape-left', 
      180: 'portrait-inverted',
      270: 'landscape-right',
      '-90': 'landscape-right'
    }
    
    this.settings.orientation = orientationMap[orientation] || 'portrait'
    
    console.log('📱 Orientation changed to:', this.settings.orientation)
    
    // Trigger UI update if scanning
    if (this.isScanning && this.onOrientationChange) {
      this.onOrientationChange(this.settings.orientation)
    }
  }

  /**
   * Start enhanced mobile barcode scanning
   */
  async startScanning(elementId, onSuccess, onError, options = {}) {
    if (this.isScanning) {
      console.warn('Scanner already running')
      onError('Scanner is already active')
      return
    }

    // Setup orientation handling
    this.setupOrientationHandling()

    // Check permission with preferred camera
    const permission = await this.requestCameraPermission(options.preferredCamera)
    if (!permission.granted) {
      onError(permission.message, permission)
      return
    }

    // Enhanced mobile configuration
    const config = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: `#${elementId}`,
        constraints: this.buildCameraConstraints(options),
        area: { // Optimized scan area for mobile
          top: "15%",
          right: "15%", 
          left: "15%",
          bottom: "15%"
        }
      },
      locator: {
        patchSize: this.deviceInfo.isIOS ? "small" : "medium", // iOS optimization
        halfSample: !this.deviceInfo.isAndroid // Android prefers full sample
      },
      numOfWorkers: Math.min(navigator.hardwareConcurrency || 2, 4),
      frequency: this.deviceInfo.isIOS ? 5 : 10, // iOS Safari optimization
      decoder: {
        readers: this.selectOptimalReaders(),
        debug: { showCanvas: false, showPatches: false }
      },
      locate: true
    }

    try {
      // Initialize Quagga with mobile config
      await new Promise((resolve, reject) => {
        Quagga.init(config, (err) => {
          if (err) {
            console.error('Quagga initialization error:', err)
            reject(err)
          } else {
            resolve()
          }
        })
      })

      // Get video element for advanced controls
      this.videoElement = document.querySelector(`#${elementId} video`)
      if (this.videoElement) {
        this.currentTrack = this.videoElement.srcObject?.getVideoTracks()[0]
        if (this.currentTrack) {
          this.capabilities = this.currentTrack.getCapabilities()
        }
      }

      // Setup enhanced detection handler
      this.setupMobileDetectionHandler(onSuccess, onError)
      
      // Start scanning
      Quagga.start()
      this.isScanning = true
      
      console.log('📱 Mobile barcode scanner started')
      
      // Reset scan state
      this.resetScanState()

      // Provide haptic feedback
      this.triggerFeedback('start')

    } catch (error) {
      console.error('Failed to start mobile scanner:', error)
      this.isScanning = false
      
      // Try fallback configuration
      if (!options.fallbackAttempt) {
        console.log('📱 Trying fallback camera configuration...')
        options.fallbackAttempt = true
        options.useFallback = true
        setTimeout(() => this.startScanning(elementId, onSuccess, onError, options), 1000)
      } else {
        onError('Failed to initialize camera: ' + error.message)
      }
    }
  }

  /**
   * Build camera constraints for mobile optimization
   */
  buildCameraConstraints(options) {
    const baseConstraints = {
      width: { ideal: 1280, max: 1920, min: 640 },
      height: { ideal: 720, max: 1080, min: 480 },
      facingMode: { ideal: options.preferredCamera || "environment" }
    }

    // Add device-specific optimizations
    if (this.deviceInfo.isIOS) {
      return {
        ...baseConstraints,
        frameRate: { ideal: 30, max: 30 },
        aspectRatio: { ideal: 16/9 }
      }
    }

    if (this.deviceInfo.isAndroid) {
      return {
        ...baseConstraints,
        frameRate: { ideal: 30 },
        focusMode: { ideal: 'continuous' },
        exposureMode: { ideal: 'continuous' }
      }
    }

    // Fallback constraints
    if (options.useFallback) {
      return {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: "environment"
      }
    }

    return baseConstraints
  }

  /**
   * Select optimal barcode readers for mobile performance
   */
  selectOptimalReaders() {
    // Prioritize common food product barcodes for mobile performance
    const mobileOptimizedReaders = [
      "ean_reader",        // EAN-13 (most food products)
      "ean_8_reader",      // EAN-8
      "upc_reader",        // UPC-A
      "upc_e_reader",      // UPC-E
      "code_128_reader"    // Code 128
    ]

    // Add additional readers for non-mobile or high-performance devices
    if (!this.deviceInfo.isMobile || navigator.hardwareConcurrency > 4) {
      mobileOptimizedReaders.push(
        "code_39_reader",
        "codabar_reader",
        "i2of5_reader"
      )
    }

    return mobileOptimizedReaders
  }

  /**
   * Enhanced detection handler with mobile feedback
   */
  setupMobileDetectionHandler(onSuccess, onError) {
    const onDetected = async (result) => {
      const code = result.codeResult.code
      
      // Enhanced validation for mobile
      if (!this.isValidBarcode(code)) {
        console.log('📱 Invalid barcode format:', code)
        return
      }

      // Implement smart detection threshold
      if (code === this.lastDetectedCode) {
        this.sameCodeCount++
      } else {
        this.lastDetectedCode = code
        this.sameCodeCount = 1
        // Provide immediate visual feedback on new code detection
        this.triggerFeedback('detected')
      }

      // Trigger success with reduced threshold for mobile responsiveness
      if (this.sameCodeCount >= this.detectionThreshold) {
        console.log('📱 Barcode confirmed:', code)
        
        try {
          // Stop scanning immediately
          this.stopScanning()
          
          // Strong success feedback
          this.triggerFeedback('success')
          
          // Parse barcode with mobile enhancements
          const barcodeData = this.parseBarcode(code)
          
          // Get product info with offline fallback
          try {
            const productInfo = await openFoodFacts.getProductByBarcode(code)
            barcodeData.product = productInfo
            barcodeData.hasProductInfo = true
          } catch (productError) {
            console.warn('Product lookup failed:', productError.message)
            barcodeData.hasProductInfo = false
            barcodeData.productError = productError.message
          }
          
          onSuccess(barcodeData)
        } catch (error) {
          console.error('Error processing mobile scan:', error)
          this.triggerFeedback('error')
          onError('Error processing scan: ' + error.message)
        }
      }
    }

    // Setup error handler for mobile-specific issues
    const onProcessed = (result) => {
      if (result && !result.codeResult) {
        // No barcode found in this frame - normal operation
        return
      }
    }

    // Remove existing handlers
    Quagga.offDetected(this.onDetectedHandlers)
    Quagga.offProcessed()
    
    this.onDetectedHandlers = [onDetected]
    
    // Add handlers
    Quagga.onDetected(onDetected)
    Quagga.onProcessed(onProcessed)
  }

  /**
   * Trigger feedback (vibration, sound, visual)
   */
  triggerFeedback(type) {
    const feedbackMap = {
      start: { vibration: [100], sound: 'start', visual: 'pulse' },
      detected: { vibration: [25], sound: 'beep', visual: 'flash' },
      success: { vibration: [200, 100, 200], sound: 'success', visual: 'success' },
      error: { vibration: [300], sound: 'error', visual: 'error' },
      focus: { vibration: [50], sound: null, visual: 'focus' },
      zoom: { vibration: [25], sound: null, visual: null }
    }

    const feedback = feedbackMap[type]
    if (!feedback) return

    // Haptic feedback
    if (this.feedbackEnabled.vibration && 
        this.deviceInfo.supportsVibration && 
        feedback.vibration) {
      navigator.vibrate(feedback.vibration)
    }

    // Audio feedback
    if (this.feedbackEnabled.sound && 
        this.audioInitialized && 
        feedback.sound) {
      this.playFeedbackSound(feedback.sound)
    }

    // Visual feedback
    if (this.feedbackEnabled.visual && feedback.visual) {
      this.triggerVisualFeedback(feedback.visual)
    }
  }

  /**
   * Play feedback sound
   */
  playFeedbackSound(type) {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      const soundMap = {
        start: { frequency: 800, duration: 100 },
        beep: { frequency: 1000, duration: 50 },
        success: { frequency: 1200, duration: 150 },
        error: { frequency: 300, duration: 300 }
      }

      const sound = soundMap[type] || soundMap.beep

      oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration / 1000)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + sound.duration / 1000)
    } catch (error) {
      console.warn('Audio feedback failed:', error)
    }
  }

  /**
   * Trigger visual feedback
   */
  triggerVisualFeedback(type) {
    // Dispatch custom event for UI components to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barcode-feedback', {
        detail: { type, timestamp: Date.now() }
      }))
    }
  }

  /**
   * Toggle flashlight/torch
   */
  async toggleTorch() {
    if (!this.currentTrack || !this.capabilities?.torch) {
      console.warn('📱 Torch not supported on this device')
      return false
    }

    try {
      const newTorchState = !this.settings.torch
      
      await this.currentTrack.applyConstraints({
        advanced: [{ torch: newTorchState }]
      })
      
      this.settings.torch = newTorchState
      this.triggerFeedback('focus')
      
      console.log('📱 Torch toggled:', newTorchState)
      return newTorchState
    } catch (error) {
      console.error('Failed to toggle torch:', error)
      return false
    }
  }

  /**
   * Set zoom level
   */
  async setZoom(zoomLevel) {
    if (!this.currentTrack || !this.capabilities?.zoom) {
      console.warn('📱 Zoom not supported on this device')
      return false
    }

    try {
      const clampedZoom = Math.max(
        this.capabilities.zoom.min,
        Math.min(zoomLevel, this.capabilities.zoom.max)
      )
      
      await this.currentTrack.applyConstraints({
        advanced: [{ zoom: clampedZoom }]
      })
      
      this.settings.zoom = clampedZoom
      this.triggerFeedback('zoom')
      
      console.log('📱 Zoom set to:', clampedZoom)
      return clampedZoom
    } catch (error) {
      console.error('Failed to set zoom:', error)
      return false
    }
  }

  /**
   * Set focus mode
   */
  async setFocusMode(mode = 'continuous') {
    if (!this.currentTrack || !this.capabilities?.focusMode) {
      console.warn('📱 Focus control not supported')
      return false
    }

    try {
      await this.currentTrack.applyConstraints({
        advanced: [{ focusMode: mode }]
      })
      
      this.settings.focusMode = mode
      this.triggerFeedback('focus')
      
      console.log('📱 Focus mode set to:', mode)
      return true
    } catch (error) {
      console.error('Failed to set focus mode:', error)
      return false
    }
  }

  /**
   * Manual focus at point
   */
  async focusAtPoint(x, y) {
    if (!this.currentTrack || !this.capabilities?.focusMode) {
      return false
    }

    try {
      // Set to manual focus first
      await this.currentTrack.applyConstraints({
        advanced: [{ 
          focusMode: 'manual',
          pointsOfInterest: [{ x, y }]
        }]
      })
      
      this.triggerFeedback('focus')
      
      // Return to continuous after a moment
      setTimeout(() => {
        this.setFocusMode('continuous')
      }, 2000)
      
      return true
    } catch (error) {
      console.error('Manual focus failed:', error)
      return false
    }
  }

  /**
   * Get current camera capabilities and settings
   */
  getCameraCapabilities() {
    return {
      capabilities: this.capabilities,
      settings: this.settings,
      deviceInfo: this.deviceInfo,
      supportedFeatures: {
        torch: !!this.capabilities?.torch,
        zoom: !!this.capabilities?.zoom,
        focus: !!this.capabilities?.focusMode,
        vibration: this.deviceInfo.supportsVibration
      }
    }
  }

  /**
   * Enhanced barcode validation for mobile
   */
  isValidBarcode(code) {
    if (!code || typeof code !== 'string' || code.length < 6) {
      return false
    }

    // Clean the code
    const cleanCode = code.replace(/[\s-]/g, '')
    
    // Mobile-optimized validation
    const formats = [
      /^\d{8}$/,    // EAN-8
      /^\d{12}$/,   // UPC-A  
      /^\d{13}$/,   // EAN-13
      /^\d{14}$/,   // ITF-14
      /^[0-9]{6,}$/ // Simplified numeric validation for mobile
    ]
    
    return formats.some(format => format.test(cleanCode))
  }

  /**
   * Enhanced barcode parsing with mobile context
   */
  parseBarcode(code) {
    const cleanCode = code.replace(/[\s-]/g, '')
    
    const result = {
      code: cleanCode,
      originalCode: code,
      type: 'unknown',
      isValid: this.isValidBarcode(code),
      timestamp: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      scanSettings: { ...this.settings }
    }

    // Determine barcode type
    if (/^\d{8}$/.test(cleanCode)) {
      result.type = 'EAN-8'
    } else if (/^\d{12}$/.test(cleanCode)) {
      result.type = 'UPC-A'
    } else if (/^\d{13}$/.test(cleanCode)) {
      result.type = 'EAN-13'
    } else if (/^\d{14}$/.test(cleanCode)) {
      result.type = 'ITF-14'
    }

    result.isFoodBarcode = ['EAN-13', 'UPC-A', 'EAN-8'].includes(result.type)
    result.confidence = this.sameCodeCount / this.detectionThreshold
    
    return result
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
   * Stop scanning with mobile cleanup
   */
  stopScanning() {
    if (this.isScanning) {
      try {
        Quagga.stop()
        Quagga.offDetected(this.onDetectedHandlers)
        Quagga.offProcessed()
        
        // Reset torch if it was on
        if (this.settings.torch && this.currentTrack) {
          this.toggleTorch().catch(console.warn)
        }
        
        // Clean up references
        this.currentTrack = null
        this.videoElement = null
        this.capabilities = null
        
        this.isScanning = false
        this.resetScanState()
        
        console.log('📱 Mobile scanner stopped')
      } catch (error) {
        console.error('Error stopping mobile scanner:', error)
      }
    }

    // Clean up orientation listener
    window.removeEventListener('orientationchange', this.handleOrientationChange)
    screen.removeEventListener?.('orientationchange', this.handleOrientationChange)
  }

  /**
   * Get enhanced scanner status
   */
  getStatus() {
    return {
      isScanning: this.isScanning,
      isSupported: this.isSupported(),
      isHTTPS: this.isHTTPS(),
      scanCount: this.scanCount,
      lastDetected: this.lastDetectedCode,
      capabilities: this.capabilities,
      settings: this.settings,
      deviceInfo: this.deviceInfo,
      feedbackEnabled: this.feedbackEnabled
    }
  }

  /**
   * Update feedback settings
   */
  setFeedbackEnabled(vibration = true, sound = true, visual = true) {
    this.feedbackEnabled = { vibration, sound, visual }
  }
}

export default new MobileBarcodeScanner()