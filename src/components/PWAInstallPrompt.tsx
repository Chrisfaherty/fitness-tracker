import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone, Monitor, Wifi, WifiOff } from 'lucide-react'
import pwaService from '../services/pwaService'

interface PWAInstallPromptProps {
  isVisible?: boolean
  onInstall?: () => void
  onDismiss?: () => void
  variant?: 'banner' | 'modal' | 'inline'
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  isVisible = false,
  onInstall,
  onDismiss,
  variant = 'banner'
}) => {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [deviceInstructions, setDeviceInstructions] = useState<any>(null)

  useEffect(() => {
    // Listen for PWA install availability
    const handleInstallAvailable = (event: CustomEvent) => {
      setCanInstall(event.detail.canInstall)
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable as EventListener)

    // Check current PWA status
    const status = pwaService.getStatus()
    setIsInstalled(status.isInstalled)
    setCanInstall(status.installationAvailable && !status.isInstalled)

    // Get device-specific instructions
    setDeviceInstructions(pwaService.getInstallInstructions())

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable as EventListener)
    }
  }, [])

  const handleInstall = async () => {
    try {
      const success = await pwaService.promptInstall()
      if (success) {
        setIsInstalled(true)
        setCanInstall(false)
        onInstall?.()
      }
    } catch (error) {
      console.error('Installation failed:', error)
      // Show manual instructions as fallback
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    pwaService.dismissInstallPrompt()
    setCanInstall(false)
    onDismiss?.()
  }

  const handleShowInstructions = () => {
    setShowInstructions(true)
  }

  if (isInstalled || (!canInstall && !isVisible)) {
    return null
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg shadow-lg p-4 backdrop-blur-sm border border-primary-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Smartphone className="h-6 w-6 text-primary-200" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Install Fitness Tracker</h3>
                <p className="text-primary-100 text-xs mt-1">
                  Get quick access and work offline
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-primary-500/20 rounded transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white text-primary-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
            <button
              onClick={handleShowInstructions}
              className="px-3 py-2 border border-primary-400 text-primary-100 rounded-md text-sm hover:bg-primary-500/20 transition-colors"
            >
              Help
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Modal variant
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={handleDismiss} />
          
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Download className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Install App
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Install Fitness Tracker for the best experience with offline access and quick launch.
              </p>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <WifiOff className="h-4 w-4 mr-3 text-green-500" />
                  Work offline without internet
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Smartphone className="h-4 w-4 mr-3 text-blue-500" />
                  Quick access from home screen
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Monitor className="h-4 w-4 mr-3 text-purple-500" />
                  Native app-like experience
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install Now
              </button>
            </div>

            {deviceInstructions && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={handleShowInstructions}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Show manual installation steps
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Inline variant
  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
            <Download className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Install Fitness Tracker
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            Get the full experience with offline access and home screen installation.
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </button>
            <button
              onClick={handleShowInstructions}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              Instructions
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Manual Installation Instructions Component
export const InstallInstructions: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [instructions, setInstructions] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      setInstructions(pwaService.getInstallInstructions())
    }
  }, [isOpen])

  if (!isOpen || !instructions) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Install on {instructions.platform}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {instructions.instructions.map((step: string, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Having trouble?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Make sure you're using a supported browser and have enabled JavaScript.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// PWA Status Indicator Component
export const PWAStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    setStatus(pwaService.getStatus())

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!status) return null

  return (
    <div className="flex items-center space-x-2 text-xs">
      {status.isInstalled && (
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
          <Download className="h-3 w-3" />
          <span>Installed</span>
        </div>
      )}
      
      <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
        {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  )
}

export default PWAInstallPrompt