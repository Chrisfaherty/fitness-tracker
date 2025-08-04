/**
 * Camera Permission Handler with Graceful Error Recovery
 * Handles permission requests, denials, and provides user guidance
 */
class CameraPermissionHandler {
  constructor() {
    this.permissionState = 'unknown'
    this.deviceInfo = this.detectDevice()
    this.permissionAttempts = 0
    this.maxAttempts = 3
    this.fallbackOptions = []
  }

  /**
   * Detect device and browser information
   */
  detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform?.toLowerCase() || ''
    
    return {
      isIOS: /iphone|ipad|ipod/.test(userAgent) || platform.includes('iphone') || platform.includes('ipad'),
      isAndroid: /android/.test(userAgent),
      isMobile: /mobile|android|iphone|ipad|ipod/.test(userAgent),
      browser: this.detectBrowser(),
      standalone: window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
      version: this.getBrowserVersion()
    }
  }

  /**
   * Detect specific browser for targeted guidance
   */
  detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return { name: 'safari', isSafari: true }
    } else if (userAgent.includes('chrome')) {
      return { name: 'chrome', isChrome: true }
    } else if (userAgent.includes('firefox')) {
      return { name: 'firefox', isFirefox: true }
    } else if (userAgent.includes('edge')) {
      return { name: 'edge', isEdge: true }
    }
    
    return { name: 'unknown', isUnknown: true }
  }

  /**
   * Get browser version for version-specific handling
   */
  getBrowserVersion() {
    const userAgent = navigator.userAgent
    let version = 'unknown'
    
    try {
      if (this.deviceInfo.browser?.isSafari) {
        const match = userAgent.match(/Version\/([0-9.]+)/)
        version = match ? match[1] : 'unknown'
      } else if (this.deviceInfo.browser?.isChrome) {
        const match = userAgent.match(/Chrome\/([0-9.]+)/)
        version = match ? match[1] : 'unknown'
      } else if (this.deviceInfo.browser?.isFirefox) {
        const match = userAgent.match(/Firefox\/([0-9.]+)/)
        version = match ? match[1] : 'unknown'
      }
    } catch (error) {
      console.warn('Could not detect browser version:', error)
    }
    
    return version
  }

  /**
   * Check if camera permissions are supported
   */
  isPermissionSupported() {
    return !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia &&
      'permissions' in navigator
    )
  }

  /**
   * Check current permission status without requesting
   */
  async checkPermissionStatus() {
    try {
      if (!this.isPermissionSupported()) {
        return { state: 'unsupported', message: 'Camera permissions not supported' }
      }

      // Try to check permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' })
        this.permissionState = permission.state
        
        return {
          state: permission.state,
          message: this.getPermissionMessage(permission.state)
        }
      }

      // Fallback: assume unknown if we can't check
      return { state: 'unknown', message: 'Permission status unknown' }
    } catch (error) {
      console.warn('Could not check permission status:', error)
      return { state: 'unknown', message: 'Permission check failed' }
    }
  }

  /**
   * Request camera permission with graceful handling
   */
  async requestPermission() {
    this.permissionAttempts++
    
    try {
      // Check if we've hit max attempts
      if (this.permissionAttempts > this.maxAttempts) {
        return this.handleMaxAttemptsReached()
      }

      // Show pre-request explanation on first attempt
      if (this.permissionAttempts === 1) {
        const shouldProceed = await this.showPermissionExplanation()
        if (!shouldProceed) {
          return {
            granted: false,
            code: 'USER_CANCELLED',
            message: 'Permission request cancelled by user',
            guidance: null
          }
        }
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      // Success - clean up test stream
      stream.getTracks().forEach(track => track.stop())
      this.permissionState = 'granted'
      
      return {
        granted: true,
        code: 'GRANTED',
        message: 'Camera permission granted successfully',
        guidance: null
      }

    } catch (error) {
      return this.handlePermissionError(error)
    }
  }

  /**
   * Handle permission errors with device-specific guidance
   */
  handlePermissionError(error) {
    console.error('Camera permission error:', error)
    
    const errorCode = error.name || error.message || 'UNKNOWN_ERROR'
    this.permissionState = 'denied'

    switch (errorCode) {
      case 'NotAllowedError':
        return this.handlePermissionDenied()
      
      case 'NotFoundError':
        return this.handleNoCamera()
      
      case 'NotSupportedError':
        return this.handleNotSupported()
      
      case 'NotReadableError':
        return this.handleCameraBusy()
      
      case 'OverconstrainedError':
        return this.handleConstraintError()
      
      default:
        return this.handleUnknownError(error)
    }
  }

  /**
   * Handle permission denied with recovery options
   */
  handlePermissionDenied() {
    const guidance = this.getPermissionDeniedGuidance()
    
    return {
      granted: false,
      code: 'PERMISSION_DENIED',
      message: 'Camera access was blocked',
      guidance,
      recovery: this.getRecoveryOptions('denied'),
      canRetry: this.permissionAttempts < this.maxAttempts
    }
  }

  /**
   * Get device-specific guidance for permission denied
   */
  getPermissionDeniedGuidance() {
    const { isIOS, isAndroid, browser, standalone } = this.deviceInfo

    if (isIOS && browser.isSafari) {
      if (standalone) {
        return {
          title: 'Enable Camera in Settings',
          steps: [
            'Open iPhone Settings app',
            'Scroll down and tap "Safari"',
            'Tap "Camera" and select "Allow"',
            'Return to the app and try again'
          ],
          icon: '⚙️'
        }
      } else {
        return {
          title: 'Allow Camera Access',
          steps: [
            'Look for the camera icon in Safari\'s address bar',
            'Tap the camera icon',
            'Select "Allow" for camera access',
            'Refresh the page if needed'
          ],
          icon: '📷'
        }
      }
    }

    if (isIOS && !browser.isSafari) {
      return {
        title: 'Use Safari for Best Results',
        steps: [
          'Camera scanning works best in Safari on iOS',
          'Copy this page URL',
          'Open Safari and paste the URL',
          'Allow camera access when prompted'
        ],
        icon: '🔄'
      }
    }

    if (isAndroid && browser.isChrome) {
      return {
        title: 'Enable Camera Permission',
        steps: [
          'Tap the camera icon in Chrome\'s address bar',
          'Select "Allow" for camera access',
          'Or tap the three dots menu → Settings → Site Settings → Camera',
          'Make sure this site is allowed'
        ],
        icon: '📷'
      }
    }

    if (isAndroid) {
      return {
        title: 'Allow Camera Access',
        steps: [
          'Tap "Allow" when prompted for camera access',
          'Check your browser\'s site permissions',
          'Make sure camera access is enabled for this site',
          'Try refreshing the page'
        ],
        icon: '📱'
      }
    }

    // Desktop/other devices
    return {
      title: 'Enable Camera Permission',
      steps: [
        'Look for a camera icon in your browser\'s address bar',
        'Click "Allow" for camera access',
        'Check your browser\'s privacy settings',
        'Make sure camera access is enabled'
      ],
      icon: '🖥️'
    }
  }

  /**
   * Handle no camera available
   */
  handleNoCamera() {
    return {
      granted: false,
      code: 'NO_CAMERA',
      message: 'No camera found on this device',
      guidance: {
        title: 'Camera Required',
        steps: [
          'Make sure your device has a working camera',
          'Try connecting an external camera if using a desktop',
          'Check that no other apps are using the camera',
          'Restart your device if camera issues persist'
        ],
        icon: '📷'
      },
      recovery: this.getRecoveryOptions('no_camera'),
      canRetry: false
    }
  }

  /**
   * Handle not supported
   */
  handleNotSupported() {
    const { browser, isIOS } = this.deviceInfo
    
    return {
      granted: false,
      code: 'NOT_SUPPORTED',
      message: 'Camera access not supported by this browser',
      guidance: {
        title: 'Browser Not Supported',
        steps: isIOS ? [
          'Camera scanning works best in Safari on iOS',
          'Try opening this page in Safari',
          'Make sure you\'re using a recent iOS version',
          'Update Safari if needed'
        ] : [
          'Try using Chrome, Firefox, or Safari',
          'Make sure your browser is up to date',
          'Enable JavaScript if it\'s disabled',
          'Try a different device if issues persist'
        ],
        icon: '🌐'
      },
      recovery: this.getRecoveryOptions('not_supported'),
      canRetry: false
    }
  }

  /**
   * Handle camera busy
   */
  handleCameraBusy() {
    return {
      granted: false,
      code: 'CAMERA_BUSY',
      message: 'Camera is being used by another application',
      guidance: {
        title: 'Camera In Use',
        steps: [
          'Close other apps that might be using the camera',
          'Make sure no video calls are active',
          'Restart your browser if needed',
          'Try again after closing other camera apps'
        ],
        icon: '🚫'
      },
      recovery: this.getRecoveryOptions('camera_busy'),
      canRetry: true
    }
  }

  /**
   * Handle constraint error
   */
  handleConstraintError() {
    return {
      granted: false,
      code: 'CONSTRAINT_ERROR',
      message: 'Camera settings not supported',
      guidance: {
        title: 'Camera Compatibility Issue',
        steps: [
          'Your camera may have limited capabilities',
          'Try using the basic camera mode',
          'Some advanced features may not be available',
          'The scanner will work with reduced functionality'
        ],
        icon: '⚙️'
      },
      recovery: this.getRecoveryOptions('constraints'),
      canRetry: true
    }
  }

  /**
   * Handle unknown error
   */
  handleUnknownError(error) {
    return {
      granted: false,
      code: 'UNKNOWN_ERROR',
      message: `Camera error: ${error.message}`,
      guidance: {
        title: 'Unexpected Error',
        steps: [
          'Try refreshing the page',
          'Make sure your browser is up to date',
          'Check your internet connection',
          'Try using a different browser or device'
        ],
        icon: '❓'
      },
      recovery: this.getRecoveryOptions('unknown'),
      canRetry: true
    }
  }

  /**
   * Handle max attempts reached
   */
  handleMaxAttemptsReached() {
    return {
      granted: false,
      code: 'MAX_ATTEMPTS',
      message: 'Maximum permission attempts reached',
      guidance: this.getPermissionDeniedGuidance(),
      recovery: this.getRecoveryOptions('max_attempts'),
      canRetry: false
    }
  }

  /**
   * Get recovery options based on error type
   */
  getRecoveryOptions(errorType) {
    const commonOptions = [
      { type: 'manual_entry', label: 'Enter barcode manually', icon: '⌨️' },
      { type: 'help', label: 'Get help', icon: '❓' }
    ]

    switch (errorType) {
      case 'denied':
        return [
          { type: 'settings', label: 'Open browser settings', icon: '⚙️' },
          { type: 'retry', label: 'Try again', icon: '🔄' },
          ...commonOptions
        ]
      
      case 'no_camera':
        return [
          { type: 'manual_entry', label: 'Enter barcode manually', icon: '⌨️' },
          { type: 'help', label: 'Get help', icon: '❓' }
        ]
      
      case 'not_supported':
        return [
          { type: 'browser_switch', label: 'Try different browser', icon: '🌐' },
          ...commonOptions
        ]
      
      case 'camera_busy':
        return [
          { type: 'retry', label: 'Try again', icon: '🔄' },
          { type: 'close_apps', label: 'Close other camera apps', icon: '📱' },
          ...commonOptions
        ]
      
      default:
        return [
          { type: 'retry', label: 'Try again', icon: '🔄' },
          ...commonOptions
        ]
    }
  }

  /**
   * Show permission explanation dialog
   */
  async showPermissionExplanation() {
    return new Promise((resolve) => {
      const modal = this.createExplanationModal(resolve)
      document.body.appendChild(modal)
    })
  }

  /**
   * Create explanation modal with device-specific content
   */
  createExplanationModal(resolve) {
    const { isIOS, isAndroid, browser } = this.deviceInfo
    
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `

    const deviceSpecificText = isIOS 
      ? 'This works best in Safari on iOS devices.' 
      : isAndroid 
        ? 'Optimized for Android Chrome browser.'
        : 'Make sure you\'re using a supported browser.'

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">📷</div>
        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 20px;">
          Camera Permission Needed
        </h3>
        <p style="margin: 0 0 16px 0; color: #666; font-size: 14px; line-height: 1.4;">
          This app needs camera access to scan product barcodes. 
          ${deviceSpecificText}
        </p>
        
        <div style="margin-bottom: 20px; text-align: left;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="margin-right: 8px;">🔍</span>
            <span style="font-size: 14px;">Scan barcodes quickly</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="margin-right: 8px;">🔒</span>
            <span style="font-size: 14px;">Your privacy is protected</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">📱</span>
            <span style="font-size: 14px;">Works offline once loaded</span>
          </div>
        </div>
        
        ${isIOS && !browser.isSafari ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="color: #856404; font-size: 13px;">
              💡 <strong>Tip:</strong> For the best experience on iOS, please open this page in Safari.
            </div>
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 12px;">
          <button id="permission-deny" style="
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            background: white;
            color: #666;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          ">Not Now</button>
          <button id="permission-allow" style="
            flex: 1;
            padding: 12px;
            border: none;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
          ">Allow Camera</button>
        </div>
      </div>
    `

    modal.querySelector('#permission-allow').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve(true)
    })

    modal.querySelector('#permission-deny').addEventListener('click', () => {
      document.body.removeChild(modal)
      resolve(false)
    })

    return modal
  }

  /**
   * Get user-friendly permission message
   */
  getPermissionMessage(state) {
    switch (state) {
      case 'granted':
        return 'Camera access is allowed'
      case 'denied':
        return 'Camera access was blocked'
      case 'prompt':
        return 'Camera permission will be requested'
      default:
        return 'Camera permission status unknown'
    }
  }

  /**
   * Reset permission attempts
   */
  resetAttempts() {
    this.permissionAttempts = 0
  }

  /**
   * Get current state
   */
  getState() {
    return {
      permissionState: this.permissionState,
      deviceInfo: this.deviceInfo,
      attempts: this.permissionAttempts,
      maxAttempts: this.maxAttempts,
      canRetry: this.permissionAttempts < this.maxAttempts
    }
  }
}

export default new CameraPermissionHandler()