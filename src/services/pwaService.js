/**
 * PWA Service - Handles PWA functionality, installation, and permissions
 */
class PWAService {
  constructor() {
    this.deferredPrompt = null
    this.isInstalled = false
    this.isStandalone = false
    this.installationAvailable = false
    
    this.initializePWA()
  }

  /**
   * Initialize PWA functionality
   */
  async initializePWA() {
    try {
      // Check if app is already installed
      this.checkInstallationStatus()
      
      // Register service worker
      await this.registerServiceWorker()
      
      // Set up installation prompt handling
      this.setupInstallationPrompt()
      
      // Set up app update handling
      this.setupAppUpdates()
      
      console.log('📱 PWA Service initialized')
    } catch (error) {
      console.error('PWA initialization failed:', error)
    }
  }

  /**
   * Register service worker with proper error handling
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        console.log('💾 Service Worker registered:', registration.scope)
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  this.showUpdateAvailable()
                } else {
                  console.log('💾 Content cached for offline use')
                }
              }
            })
          }
        })
        
        return registration
      } catch (error) {
        console.error('💾 Service Worker registration failed:', error)
        throw error
      }
    } else {
      throw new Error('Service Worker not supported')
    }
  }

  /**
   * Check if app is installed or running in standalone mode
   */
  checkInstallationStatus() {
    // Check for standalone mode (iOS Safari, installed PWA)
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://')
    
    // Check for various installation indicators
    this.isInstalled = this.isStandalone ||
                      window.matchMedia('(display-mode: minimal-ui)').matches ||
                      window.matchMedia('(display-mode: window-controls-overlay)').matches
    
    console.log('📱 Installation status:', {
      installed: this.isInstalled,
      standalone: this.isStandalone
    })
  }

  /**
   * Set up installation prompt handling
   */
  setupInstallationPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 Installation prompt available')
      
      // Prevent default prompt
      e.preventDefault()
      
      // Store the event for later use
      this.deferredPrompt = e
      this.installationAvailable = true
      
      // Show custom install UI
      this.showInstallPrompt()
    })

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('📱 App installed successfully')
      this.isInstalled = true
      this.installationAvailable = false
      this.deferredPrompt = null
      
      // Hide install prompts
      this.hideInstallPrompt()
      
      // Track installation
      this.trackInstallation()
    })
  }

  /**
   * Set up app update handling
   */
  setupAppUpdates() {
    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        this.showUpdateAvailable()
      }
    })

    // Check for updates periodically
    setInterval(() => {
      this.checkForUpdates()
    }, 30 * 60 * 1000) // Check every 30 minutes
  }

  /**
   * Show custom installation prompt
   */
  showInstallPrompt() {
    // Create install banner if it doesn't exist
    if (!document.getElementById('pwa-install-banner')) {
      const banner = this.createInstallBanner()
      document.body.appendChild(banner)
    }
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('pwa-install-available', {
      detail: { canInstall: true }
    }))
  }

  /**
   * Hide installation prompt
   */
  hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner')
    if (banner) {
      banner.remove()
    }
    
    window.dispatchEvent(new CustomEvent('pwa-install-available', {
      detail: { canInstall: false }
    }))
  }

  /**
   * Create install banner element
   */
  createInstallBanner() {
    const banner = document.createElement('div')
    banner.id = 'pwa-install-banner'
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            📱 Install Fitness Tracker
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            Get quick access and offline functionality
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="pwa-install-dismiss" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Later</button>
          <button id="pwa-install-button" style="
            background: rgba(255,255,255,0.9);
            border: none;
            color: #333;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
          ">Install</button>
        </div>
      </div>
    `
    
    // Add event listeners
    banner.querySelector('#pwa-install-button').addEventListener('click', () => {
      this.promptInstall()
    })
    
    banner.querySelector('#pwa-install-dismiss').addEventListener('click', () => {
      this.dismissInstallPrompt()
    })
    
    return banner
  }

  /**
   * Trigger installation prompt
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.warn('No deferred prompt available')
      return false
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt()
      
      // Wait for the user's response
      const { outcome } = await this.deferredPrompt.userChoice
      
      console.log('📱 Install prompt outcome:', outcome)
      
      if (outcome === 'accepted') {
        console.log('📱 User accepted installation')
      } else {
        console.log('📱 User dismissed installation')
      }
      
      // Clear the deferred prompt
      this.deferredPrompt = null
      this.installationAvailable = false
      
      return outcome === 'accepted'
    } catch (error) {
      console.error('📱 Installation prompt failed:', error)
      return false
    }
  }

  /**
   * Dismiss installation prompt
   */
  dismissInstallPrompt() {
    this.hideInstallPrompt()
    
    // Store dismissal in localStorage to avoid showing again soon
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  /**
   * Check if install prompt was recently dismissed
   */
  wasInstallPromptRecentlyDismissed() {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (!dismissed) return false
    
    const dismissedTime = parseInt(dismissed, 10)
    const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
    
    return daysSinceDismissal < 7 // Don't show for 7 days
  }

  /**
   * Check for app updates
   */
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        registration.update()
      }
    }
  }

  /**
   * Show update available notification
   */
  showUpdateAvailable() {
    // Create update notification
    const notification = document.createElement('div')
    notification.id = 'pwa-update-notification'
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 20px;
        right: 20px;
        background: #4ade80;
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            🆕 Update Available
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            A new version is ready to install
          </div>
        </div>
        <button id="pwa-update-button" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        ">Update</button>
      </div>
    `
    
    // Remove existing notification
    const existing = document.getElementById('pwa-update-notification')
    if (existing) existing.remove()
    
    document.body.appendChild(notification)
    
    // Add click handler
    notification.querySelector('#pwa-update-button').addEventListener('click', () => {
      this.applyUpdate()
    })
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 10000)
  }

  /**
   * Apply available update
   */
  async applyUpdate() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        
        // Reload the page to apply the update
        window.location.reload()
      }
    }
  }

  /**
   * Request camera permission with enhanced error handling
   */
  async requestCameraPermission() {
    try {
      // Check if camera permission API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' })
        
        if (permission.state === 'denied') {
          throw new Error('Camera permission was denied. Please enable camera access in browser settings.')
        }
      }

      // Request camera access
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Stop the stream immediately as we just wanted to check permission
      stream.getTracks().forEach(track => track.stop())
      
      return {
        granted: true,
        message: 'Camera permission granted'
      }
    } catch (error) {
      console.error('Camera permission error:', error)
      
      return {
        granted: false,
        message: this.getCameraErrorMessage(error),
        error: error.name || 'UnknownError'
      }
    }
  }

  /**
   * Get user-friendly camera error message
   */
  getCameraErrorMessage(error) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Camera access was denied. Please allow camera access and try again.'
      case 'NotFoundError':
        return 'No camera found on this device.'
      case 'NotSupportedError':
        return 'Camera is not supported on this device or browser.'
      case 'NotReadableError':
        return 'Camera is being used by another application.'
      case 'OverconstrainedError':
        return 'Camera does not meet the required specifications.'
      default:
        return error.message || 'Unable to access camera. Please check your browser settings.'
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return {
        granted: false,
        message: 'Notifications are not supported by this browser'
      }
    }

    try {
      const permission = await Notification.requestPermission()
      
      return {
        granted: permission === 'granted',
        message: permission === 'granted' 
          ? 'Notification permission granted'
          : 'Notification permission denied'
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      return {
        granted: false,
        message: 'Failed to request notification permission'
      }
    }
  }

  /**
   * Schedule a local notification
   */
  scheduleNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options
      })
      
      return notification
    }
    
    console.warn('Notification permission not granted')
    return null
  }

  /**
   * Track installation for analytics
   */
  trackInstallation() {
    // Track installation event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'app_install'
      })
    }
    
    console.log('📊 PWA installation tracked')
  }

  /**
   * Get PWA status information
   */
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      installationAvailable: this.installationAvailable,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationSupported: 'Notification' in window,
      cameraSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      isOnline: navigator.onLine
    }
  }

  /**
   * Add to home screen instructions based on device
   */
  getInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        platform: 'iOS',
        instructions: [
          'Tap the Share button in Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ]
      }
    } else if (userAgent.includes('android')) {
      return {
        platform: 'Android',
        instructions: [
          'Tap the menu button (⋮) in Chrome',
          'Tap "Add to Home screen"',
          'Tap "Add" to install the app'
        ]
      }
    } else {
      return {
        platform: 'Desktop',
        instructions: [
          'Look for the install icon in the address bar',
          'Click "Install" when prompted',
          'The app will be added to your applications'
        ]
      }
    }
  }
}

export default new PWAService()