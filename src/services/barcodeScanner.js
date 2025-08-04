import Quagga from 'quagga'
import openFoodFacts from './openFoodFacts'

class BarcodeScanner {
  constructor() {
    this.isScanning = false
    this.currentStream = null
    this.onDetectedHandlers = []
    this.scanCount = 0
    this.detectionThreshold = 3 // Require 3 consecutive detections
    this.lastDetectedCode = null
    this.sameCodeCount = 0
  }

  /**
   * Check if browser supports camera access
   * @returns {boolean} Camera support availability
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  /**
   * Check HTTPS requirement for camera access
   * @returns {boolean} Whether HTTPS requirement is met
   */
  isHTTPS() {
    return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  }

  /**
   * Request camera permission with detailed error handling
   * @returns {Promise<Object>} Permission result with details
   */
  async requestCameraPermission() {
    try {
      // Check HTTPS requirement first
      if (!this.isHTTPS()) {
        throw new Error('HTTPS_REQUIRED')
      }

      // Check if getUserMedia is supported
      if (!this.isSupported()) {
        throw new Error('NOT_SUPPORTED')
      }

      // Request camera access with specific constraints
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Test that we can actually use the stream
      if (!stream.getVideoTracks().length) {
        throw new Error('NO_VIDEO_TRACK')
      }

      // Stop the stream immediately as we just wanted to check permission
      stream.getTracks().forEach(track => track.stop())
      
      console.log('Camera permission granted successfully')
      return {
        granted: true,
        message: 'Camera access granted'
      }
    } catch (error) {
      console.error('Camera permission error:', error)
      return this.handlePermissionError(error)
    }
  }

  /**
   * Handle camera permission errors with detailed messages
   * @param {Error} error - The permission error
   * @returns {Object} Error details
   */
  handlePermissionError(error) {
    const errorMap = {
      'NotAllowedError': {
        granted: false,
        code: 'PERMISSION_DENIED',
        message: 'Camera access denied. Please allow camera access in your browser settings.',
        userAction: 'Enable camera permissions for this site in browser settings'
      },
      'NotFoundError': {
        granted: false,
        code: 'NO_CAMERA',
        message: 'No camera found on this device.',
        userAction: 'Connect a camera or try a different device'
      },
      'NotSupportedError': {
        granted: false,
        code: 'NOT_SUPPORTED',
        message: 'Camera access is not supported by this browser.',
        userAction: 'Try using Chrome, Firefox, or Safari'
      },
      'HTTPS_REQUIRED': {
        granted: false,
        code: 'HTTPS_REQUIRED',
        message: 'Camera access requires a secure connection (HTTPS).',
        userAction: 'Access the site using HTTPS'
      },
      'NotReadableError': {
        granted: false,
        code: 'CAMERA_BUSY',
        message: 'Camera is being used by another application.',
        userAction: 'Close other apps using the camera and try again'
      }
    }

    const errorKey = error.name || error.message || 'UnknownError'
    return errorMap[errorKey] || {
      granted: false,
      code: 'UNKNOWN_ERROR',
      message: `Camera access failed: ${error.message}`,
      userAction: 'Try refreshing the page or using a different browser'
    }
  }

  /**
   * Get available cameras
   * @returns {Promise<Array>} List of available cameras
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
        label: camera.label || `Camera ${camera.deviceId.substring(0, 8)}`,
        facingMode: this.guessFacingMode(camera.label)
      }))
    } catch (error) {
      console.error('Error enumerating cameras:', error)
      return []
    }
  }

  /**
   * Guess camera facing mode from label
   * @param {string} label - Camera label
   * @returns {string} Facing mode guess
   */
  guessFacingMode(label) {
    const lowerLabel = label.toLowerCase()
    if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
      return 'environment'
    }
    if (lowerLabel.includes('front') || lowerLabel.includes('user') || lowerLabel.includes('face')) {
      return 'user'
    }
    return 'unknown'
  }

  /**
   * Start barcode scanning with QuaggaJS
   * @param {string} elementId - Container element ID
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   * @param {Object} options - Scanning options
   */
  async startScanning(elementId, onSuccess, onError, options = {}) {
    if (this.isScanning) {
      console.warn('Scanner is already running')
      onError('Scanner is already active')
      return
    }

    // Check camera permission first
    const permission = await this.requestCameraPermission()
    if (!permission.granted) {
      onError(permission.message, permission)
      return
    }

    const config = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: `#${elementId}`,
        constraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: options.preferredCamera || "environment",
          aspectRatio: { ideal: 16/9 }
        },
        area: { // Only scan central area
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
      numOfWorkers: navigator.hardwareConcurrency || 2,
      frequency: 10, // Scan frequency
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ],
        debug: {
          showCanvas: false,
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
      },
      locate: true
    }

    try {
      // Initialize Quagga
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

      // Set up detection handler
      this.setupDetectionHandler(onSuccess, onError)
      
      // Start scanning
      Quagga.start()
      this.isScanning = true
      
      console.log('Barcode scanner started successfully')
      
      // Reset scan state
      this.scanCount = 0
      this.lastDetectedCode = null
      this.sameCodeCount = 0

    } catch (error) {
      console.error('Failed to start barcode scanner:', error)
      this.isScanning = false
      onError('Failed to initialize barcode scanner: ' + error.message)
    }
  }

  /**
   * Set up barcode detection handler with validation
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  setupDetectionHandler(onSuccess, onError) {
    const onDetected = async (result) => {
      const code = result.codeResult.code
      
      // Validate barcode format
      if (!this.isValidBarcode(code)) {
        console.log('Invalid barcode format detected:', code)
        return
      }

      // Implement detection threshold to reduce false positives
      if (code === this.lastDetectedCode) {
        this.sameCodeCount++
      } else {
        this.lastDetectedCode = code
        this.sameCodeCount = 1
      }

      // Only trigger success after threshold is met
      if (this.sameCodeCount >= this.detectionThreshold) {
        console.log('Barcode detected with confidence:', code)
        
        try {
          // Stop scanning immediately
          this.stopScanning()
          
          // Parse barcode details
          const barcodeData = this.parseBarcode(code)
          
          // Try to get product info from Open Food Facts
          try {
            const productInfo = await openFoodFacts.getProductByBarcode(code)
            barcodeData.product = productInfo
            barcodeData.hasProductInfo = true
          } catch (productError) {
            console.warn('Could not fetch product info:', productError.message)
            barcodeData.hasProductInfo = false
            barcodeData.productError = productError.message
          }
          
          onSuccess(barcodeData)
        } catch (error) {
          console.error('Error processing barcode:', error)
          onError('Error processing barcode: ' + error.message)
        }
      }
    }

    // Remove any existing handlers
    Quagga.offDetected(this.onDetectedHandlers)
    this.onDetectedHandlers = [onDetected]
    
    // Add new handler
    Quagga.onDetected(onDetected)
  }

  /**
   * Stop barcode scanning
   */
  stopScanning() {
    if (this.isScanning) {
      try {
        Quagga.stop()
        Quagga.offDetected(this.onDetectedHandlers)
        this.isScanning = false
        this.scanCount = 0
        this.lastDetectedCode = null
        this.sameCodeCount = 0
        console.log('Barcode scanner stopped')
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
  }

  /**
   * Validate barcode format
   * @param {string} code - Barcode to validate
   * @returns {boolean} Is valid barcode
   */
  isValidBarcode(code) {
    if (!code || typeof code !== 'string' || code.length < 6) {
      return false
    }

    // Clean the code
    const cleanCode = code.replace(/[\s-]/g, '')
    
    // Check common barcode formats
    const formats = [
      /^\d{8}$/,    // EAN-8
      /^\d{12}$/,   // UPC-A
      /^\d{13}$/,   // EAN-13
      /^\d{14}$/,   // ITF-14
      /^[0-9A-Z\-\.\ \$\/\+\%]{6,}$/ // Code 39 and others
    ]
    
    return formats.some(format => format.test(cleanCode))
  }

  /**
   * Parse barcode and determine type
   * @param {string} code - Barcode string
   * @returns {Object} Parsed barcode information
   */
  parseBarcode(code) {
    const cleanCode = code.replace(/[\s-]/g, '')
    
    const result = {
      code: cleanCode,
      originalCode: code,
      type: 'unknown',
      isValid: this.isValidBarcode(code),
      timestamp: new Date().toISOString()
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
    } else if (/^[0-9A-Z\-\.\ \$\/\+\%]+$/.test(cleanCode)) {
      result.type = 'Code 39'
    }

    // Add validation for food products (most common)
    result.isFoodBarcode = result.type === 'EAN-13' || result.type === 'UPC-A' || result.type === 'EAN-8'
    
    return result
  }

  /**
   * Get scanner status
   * @returns {Object} Current scanner status
   */
  getStatus() {
    return {
      isScanning: this.isScanning,
      isSupported: this.isSupported(),
      isHTTPS: this.isHTTPS(),
      scanCount: this.scanCount,
      lastDetected: this.lastDetectedCode
    }
  }
}

export default new BarcodeScanner()