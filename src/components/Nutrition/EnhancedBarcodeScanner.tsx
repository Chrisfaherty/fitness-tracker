import React, { useState, useEffect } from 'react'
import { AlertCircle, Info, Smartphone } from 'lucide-react'
import MobileBarcodeScanner from './MobileBarcodeScanner'
import BarcodeScanner from './BarcodeScanner'
import { initializeBrowserCompatibility } from '../../utils/browserCompatibility'
import cameraPermissionHandler from '../../services/cameraPermissionHandler'
import { Food } from '../../types/nutrition'

interface EnhancedBarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onFoodScanned: (food: Food) => void
  onManualEntry?: () => void
}

interface DeviceCapabilities {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  browser: any
  optimizations: any
  supportsAdvancedFeatures: boolean
}

const EnhancedBarcodeScanner: React.FC<EnhancedBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onFoodScanned,
  onManualEntry
}) => {
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<any>(null)
  const [showCompatibilityInfo, setShowCompatibilityInfo] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  // Initialize device detection and compatibility when component mounts
  useEffect(() => {
    if (isOpen) {
      initializeDeviceCapabilities()
      checkPermissionStatus()
    }
  }, [isOpen])

  const initializeDeviceCapabilities = async () => {
    try {
      console.log('🔍 Initializing device capabilities...')
      
      // Initialize browser compatibility
      const compatibility = initializeBrowserCompatibility()
      
      const capabilities: DeviceCapabilities = {
        isMobile: compatibility.browser.isMobile,
        isTablet: compatibility.browser.isTablet || 
                 (compatibility.browser.isMobile && window.innerWidth > 768),
        isDesktop: compatibility.browser.isDesktop,
        browser: compatibility.browser,
        optimizations: compatibility.optimizations,
        supportsAdvancedFeatures: 
          compatibility.browser.supportsTorch || 
          compatibility.browser.supportsZoom || 
          compatibility.browser.supportsFocus
      }

      setDeviceCapabilities(capabilities)
      
      console.log('📱 Device capabilities detected:', capabilities)
      
      // Show compatibility info for certain scenarios
      if (capabilities.browser.isIOS && !capabilities.browser.isSafari) {
        setShowCompatibilityInfo(true)
      }

    } catch (error) {
      console.error('Failed to initialize device capabilities:', error)
      setInitializationError('Failed to detect device capabilities')
    }
  }

  const checkPermissionStatus = async () => {
    try {
      const status = await cameraPermissionHandler.checkPermissionStatus()
      setPermissionStatus(status)
      console.log('🔐 Permission status:', status)
    } catch (error) {
      console.warn('Could not check permission status:', error)
    }
  }

  const handlePermissionRequest = async () => {
    try {
      const result = await cameraPermissionHandler.requestPermission()
      setPermissionStatus(result)
      return result
    } catch (error) {
      console.error('Permission request failed:', error)
      return { granted: false, message: 'Permission request failed' }
    }
  }

  const renderCompatibilityInfo = () => {
    if (!deviceCapabilities || !showCompatibilityInfo) return null

    const { browser } = deviceCapabilities

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
          <div className="flex items-start gap-3 mb-4">
            <Info className="text-blue-500 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Browser Optimization
              </h3>
              
              {browser.isIOS && !browser.isSafari && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    For the best barcode scanning experience on iOS, we recommend using Safari.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 text-sm mb-2">
                      Why Safari?
                    </h4>
                    <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• Better camera API support</li>
                      <li>• Advanced features (torch, zoom, focus)</li>
                      <li>• Improved performance and stability</li>
                      <li>• Native iOS integration</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCompatibilityInfo(false)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Continue Anyway
                    </button>
                    <button
                      onClick={() => {
                        // Copy current URL to clipboard for easy pasting in Safari
                        navigator.clipboard?.writeText(window.location.href)
                        alert('URL copied! Open Safari and paste the link.')
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDeviceInfo = () => {
    if (!deviceCapabilities) return null

    const { browser, supportsAdvancedFeatures } = deviceCapabilities

    return (
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Device Information
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Platform:</span> {
              browser.isIOS ? 'iOS' : 
              browser.isAndroid ? 'Android' : 
              'Desktop'
            }
          </div>
          <div>
            <span className="font-medium">Browser:</span> {
              browser.isSafari ? 'Safari' :
              browser.isChrome ? 'Chrome' :
              browser.isFirefox ? 'Firefox' :
              'Other'
            }
          </div>
          <div>
            <span className="font-medium">Features:</span> {
              supportsAdvancedFeatures ? 'Enhanced' : 'Basic'
            }
          </div>
          <div>
            <span className="font-medium">Mode:</span> {
              browser.isPWA ? 'PWA' : 'Web'
            }
          </div>
        </div>

        {browser.isIOS && browser.version && (
          <div className="mt-2 text-xs text-gray-500">
            iOS {browser.version} • {
              parseFloat(browser.version) >= 15 ? 'Optimized' : 'Compatible'
            }
          </div>
        )}
      </div>
    )
  }

  const renderInitializationError = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-md">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Initialization Failed
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {initializationError}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setInitializationError(null)
                initializeDeviceCapabilities()
              }}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Don't render anything if not open
  if (!isOpen) return null

  // Show initialization error
  if (initializationError) {
    return renderInitializationError()
  }

  // Show loading state while detecting capabilities
  if (!deviceCapabilities) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p>Initializing scanner...</p>
        </div>
      </div>
    )
  }

  // Render compatibility info overlay if needed
  if (showCompatibilityInfo) {
    return renderCompatibilityInfo()
  }

  // Determine which scanner component to use
  const shouldUseMobileScanner = deviceCapabilities.isMobile || deviceCapabilities.isTablet
  
  if (shouldUseMobileScanner) {
    // Use mobile-optimized scanner
    return (
      <div>
        <MobileBarcodeScanner
          isOpen={isOpen}
          onClose={onClose}
          onFoodScanned={onFoodScanned}
          onManualEntry={onManualEntry}
        />
        
        {/* Optional: Show device info in mobile scanner */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 right-4 z-40">
            {renderDeviceInfo()}
          </div>
        )}
      </div>
    )
  } else {
    // Use desktop/fallback scanner with enhancements
    return (
      <div>
        <BarcodeScanner
          isOpen={isOpen}
          onClose={onClose}
          onFoodScanned={onFoodScanned}
          onManualEntry={onManualEntry}
        />
        
        {/* Show device info for desktop */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 max-w-sm z-40">
            {renderDeviceInfo()}
          </div>
        )}
      </div>
    )
  }
}

export default EnhancedBarcodeScanner