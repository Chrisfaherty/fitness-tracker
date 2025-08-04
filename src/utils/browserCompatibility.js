/**
 * Cross-Browser Compatibility Layer for Mobile Barcode Scanner
 * Handles browser-specific quirks and provides polyfills
 */

/**
 * Browser Detection and Capabilities
 */
export class BrowserDetector {
  static detect() {
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform?.toLowerCase() || ''
    
    const browser = {
      // Browser detection
      isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
      isChrome: /chrome/.test(userAgent) && !/edge/.test(userAgent),
      isFirefox: /firefox/.test(userAgent),
      isEdge: /edge/.test(userAgent),
      isSamsung: /samsungbrowser/.test(userAgent),
      
      // Platform detection
      isIOS: /iphone|ipad|ipod/.test(userAgent) || platform.includes('iphone') || platform.includes('ipad'),
      isAndroid: /android/.test(userAgent),
      isMobile: /mobile|android|iphone|ipad|ipod/.test(userAgent),
      isDesktop: !(/mobile|android|iphone|ipad|ipod/.test(userAgent)),
      
      // Version detection
      version: this.getVersion(userAgent),
      
      // PWA detection
      isPWA: window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
      
      // Feature support
      supportsGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      supportsImageCapture: 'ImageCapture' in window,
      supportsMediaDevices: 'mediaDevices' in navigator,
      supportsVibration: 'vibrate' in navigator,
      supportsWakeLock: 'wakeLock' in navigator,
      supportsOrientationLock: 'orientation' in screen,
      
      // Camera capabilities
      supportsTorch: this.supportsTorch(),
      supportsZoom: this.supportsZoom(),
      supportsFocus: this.supportsFocus(),
      
      // Performance capabilities
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 'unknown'
    }
    
    return browser
  }
  
  static getVersion(userAgent) {
    try {
      if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
        const match = userAgent.match(/version\/([0-9.]+)/)
        return match ? match[1] : 'unknown'
      } else if (/chrome/.test(userAgent)) {
        const match = userAgent.match(/chrome\/([0-9.]+)/)
        return match ? match[1] : 'unknown'
      } else if (/firefox/.test(userAgent)) {
        const match = userAgent.match(/firefox\/([0-9.]+)/)
        return match ? match[1] : 'unknown'
      }
    } catch (error) {
      console.warn('Version detection failed:', error)
    }
    return 'unknown'
  }
  
  static supportsTorch() {
    return 'ImageCapture' in window && 'getPhotoCapabilities' in window.ImageCapture.prototype
  }
  
  static supportsZoom() {
    return 'ImageCapture' in window
  }
  
  static supportsFocus() {
    return 'ImageCapture' in window
  }
}

/**
 * iOS Safari Compatibility Layer
 */
export class IOSCompatibility {
  static getOptimizations() {
    const version = parseFloat(BrowserDetector.detect().version)
    
    return {
      // Camera constraints for iOS Safari
      cameraConstraints: {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
          frameRate: { ideal: 30, max: 30 },
          aspectRatio: { ideal: 16/9 }
        }
      },
      
      // Performance settings
      performance: {
        scanFrequency: 5, // Reduced for iOS
        detectionThreshold: 2,
        workers: Math.min(navigator.hardwareConcurrency || 2, 2),
        patchSize: 'small'
      },
      
      // Known issues and workarounds
      knownIssues: {
        // iOS 14.3+ camera permission issues
        needsPermissionWorkaround: version >= 14.3,
        
        // iOS 15+ PWA camera issues
        pwaRestrictionsIOSFifteen: version >= 15.0,
        
        // iOS Safari memory limitations
        memoryLimited: true,
        
        // Touch event quirks
        touchEventQuirks: true
      },
      
      // Specific workarounds
      workarounds: {
        // Delay before starting camera to avoid permission race
        startupDelay: 500,
        
        // Use lower resolution for better performance
        useLowerResolution: true,
        
        // Disable some readers for performance
        reducedReaders: true,
        
        // Handle orientation changes
        handleOrientationChanges: true
      }
    }
  }
  
  static applyWorkarounds() {
    // Fix iOS viewport zoom issues
    this.fixViewportZoom()
    
    // Handle iOS PWA status bar
    this.handleStatusBar()
    
    // Fix iOS touch events
    this.fixTouchEvents()
    
    // Handle iOS safe areas
    this.handleSafeAreas()
  }
  
  static fixViewportZoom() {
    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      )
    }
  }
  
  static handleStatusBar() {
    // Add padding for iOS status bar
    if (window.navigator.standalone) {
      document.documentElement.style.setProperty('--ios-status-bar-height', '20px')
    }
  }
  
  static fixTouchEvents() {
    // Improve touch responsiveness
    document.addEventListener('touchstart', function() {}, { passive: true })
    document.addEventListener('touchmove', function() {}, { passive: true })
  }
  
  static handleSafeAreas() {
    // Handle iPhone X+ safe areas
    const style = document.createElement('style')
    style.textContent = `
      .ios-safe-area-top { padding-top: env(safe-area-inset-top); }
      .ios-safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
      .ios-safe-area-left { padding-left: env(safe-area-inset-left); }
      .ios-safe-area-right { padding-right: env(safe-area-inset-right); }
    `
    document.head.appendChild(style)
  }
}

/**
 * Android Chrome Compatibility Layer
 */
export class AndroidCompatibility {
  static getOptimizations() {
    return {
      // Camera constraints for Android Chrome
      cameraConstraints: {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
          frameRate: { ideal: 30 },
          focusMode: { ideal: 'continuous' },
          exposureMode: { ideal: 'continuous' },
          whiteBalanceMode: { ideal: 'continuous' }
        }
      },
      
      // Performance settings
      performance: {
        scanFrequency: 10,
        detectionThreshold: 2,
        workers: Math.min(navigator.hardwareConcurrency || 4, 4),
        patchSize: 'medium'
      },
      
      // Android-specific features
      features: {
        // Advanced camera controls
        supportsTorch: true,
        supportsZoom: true,
        supportsFocus: true,
        
        // Better performance
        betterPerformance: true,
        
        // More camera options
        moreCameraOptions: true
      },
      
      workarounds: {
        // Handle Samsung Internet quirks
        samsungBrowserFix: BrowserDetector.detect().isSamsung,
        
        // Handle Android PWA install
        handlePWAInstall: true,
        
        // Memory management
        memoryManagement: true
      }
    }
  }
  
  static applyWorkarounds() {
    // Fix Android viewport
    this.fixViewport()
    
    // Handle Android back button
    this.handleBackButton()
    
    // Optimize performance
    this.optimizePerformance()
  }
  
  static fixViewport() {
    // Ensure proper viewport on Android
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, user-scalable=yes, viewport-fit=cover'
      )
    }
  }
  
  static handleBackButton() {
    // Handle Android back button in PWA
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      window.addEventListener('popstate', function(e) {
        // Custom back button handling
        e.preventDefault()
      })
    }
  }
  
  static optimizePerformance() {
    // Enable hardware acceleration
    document.body.style.transform = 'translateZ(0)'
    
    // Optimize scrolling
    document.body.style.webkitOverflowScrolling = 'touch'
  }
}

/**
 * Camera API Polyfills and Compatibility
 */
export class CameraAPICompatibility {
  static polyfillImageCapture() {
    if (!('ImageCapture' in window)) {
      console.warn('ImageCapture API not supported, using polyfill')
      
      // Basic ImageCapture polyfill
      window.ImageCapture = class ImageCapture {
        constructor(videoTrack) {
          this.track = videoTrack
        }
        
        getPhotoCapabilities() {
          return Promise.resolve({
            imageHeight: { min: 240, max: 1080, step: 1 },
            imageWidth: { min: 320, max: 1920, step: 1 }
          })
        }
        
        takePhoto() {
          return Promise.reject(new Error('takePhoto not supported in polyfill'))
        }
      }
    }
  }
  
  static polyfillGetUserMedia() {
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {}
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        // Fallback to older API
        const getUserMedia = navigator.webkitGetUserMedia || 
                           navigator.mozGetUserMedia || 
                           navigator.msGetUserMedia
        
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia not supported'))
        }
        
        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject)
        })
      }
    }
  }
  
  static enhanceTrackCapabilities(track) {
    if (!track || !track.getCapabilities) {
      return {
        zoom: { min: 1, max: 1, step: 0.1 },
        torch: false,
        focusMode: ['manual', 'continuous'],
        exposureMode: ['manual', 'continuous']
      }
    }
    
    const capabilities = track.getCapabilities()
    
    // Add missing capabilities for older browsers
    return {
      zoom: capabilities.zoom || { min: 1, max: 1, step: 0.1 },
      torch: !!capabilities.torch,
      focusMode: capabilities.focusMode || ['continuous'],
      exposureMode: capabilities.exposureMode || ['continuous'],
      whiteBalanceMode: capabilities.whiteBalanceMode || ['continuous']
    }
  }
}

/**
 * Performance Optimizations
 */
export class PerformanceOptimizations {
  static getDeviceOptimizations() {
    const browser = BrowserDetector.detect()
    
    if (browser.isIOS) {
      return IOSCompatibility.getOptimizations()
    } else if (browser.isAndroid) {
      return AndroidCompatibility.getOptimizations()
    } else {
      return this.getDesktopOptimizations()
    }
  }
  
  static getDesktopOptimizations() {
    return {
      cameraConstraints: {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      },
      performance: {
        scanFrequency: 15,
        detectionThreshold: 3,
        workers: Math.min(navigator.hardwareConcurrency || 4, 8),
        patchSize: 'large'
      }
    }
  }
  
  static applyPerformanceOptimizations(browser) {
    // Apply browser-specific optimizations
    if (browser.isIOS) {
      IOSCompatibility.applyWorkarounds()
    } else if (browser.isAndroid) {
      AndroidCompatibility.applyWorkarounds()
    }
    
    // Apply polyfills
    CameraAPICompatibility.polyfillGetUserMedia()
    CameraAPICompatibility.polyfillImageCapture()
    
    // Memory management
    this.setupMemoryManagement()
    
    // Wake lock for scanning
    this.setupWakeLock()
  }
  
  static setupMemoryManagement() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        const usedPercentage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
        
        if (usedPercentage > 0.8) {
          console.warn('High memory usage detected:', usedPercentage)
          // Trigger garbage collection hints
          if ('gc' in window) {
            window.gc()
          }
        }
      }, 10000)
    }
  }
  
  static async setupWakeLock() {
    // Prevent screen from sleeping during scanning
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen')
        console.log('Wake lock acquired')
        
        document.addEventListener('visibilitychange', async () => {
          if (this.wakeLock !== null && document.visibilityState === 'visible') {
            this.wakeLock = await navigator.wakeLock.request('screen')
          }
        })
      } catch (err) {
        console.warn('Wake lock failed:', err)
      }
    }
  }
  
  static releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release()
      this.wakeLock = null
    }
  }
}

/**
 * Error Recovery and Fallbacks
 */
export class ErrorRecovery {
  static createFallbackConfig(originalConfig, error) {
    const browser = BrowserDetector.detect()
    
    console.warn('Creating fallback config due to error:', error)
    
    const fallbackConfig = {
      inputStream: {
        ...originalConfig.inputStream,
        constraints: this.getFallbackConstraints(browser),
        area: {
          top: "25%",
          right: "25%",
          left: "25%",
          bottom: "25%"
        }
      },
      locator: {
        patchSize: "small",
        halfSample: true
      },
      numOfWorkers: 1,
      frequency: 5,
      decoder: {
        readers: this.getFallbackReaders(browser)
      }
    }
    
    return fallbackConfig
  }
  
  static getFallbackConstraints(browser) {
    if (browser.isIOS) {
      return {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: "environment"
      }
    } else {
      return {
        width: { ideal: 800, max: 1280 },
        height: { ideal: 600, max: 720 },
        facingMode: "environment"
      }
    }
  }
  
  static getFallbackReaders(browser) {
    // Minimal set of readers for maximum compatibility
    return [
      "ean_reader",
      "ean_8_reader",
      "upc_reader"
    ]
  }
}

// Export main compatibility function
export function initializeBrowserCompatibility() {
  const browser = BrowserDetector.detect()
  console.log('Browser detected:', browser)
  
  // Apply performance optimizations
  PerformanceOptimizations.applyPerformanceOptimizations(browser)
  
  return {
    browser,
    optimizations: PerformanceOptimizations.getDeviceOptimizations(),
    recovery: ErrorRecovery
  }
}

export {
  BrowserDetector,
  IOSCompatibility,
  AndroidCompatibility,
  CameraAPICompatibility,
  PerformanceOptimizations,
  ErrorRecovery
}