import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Camera, X, AlertCircle, CheckCircle, RotateCcw, Loader2, Info, 
  Flashlight, ZoomIn, ZoomOut, Focus, Settings, VolumeX, Volume2,
  Smartphone, RotateCw, FlashlightOff
} from 'lucide-react'
import mobileBarcodeScanner from '../../services/mobileBarcodeScanner'
import openFoodFacts from '../../services/openFoodFacts'
import storageService from '../../services/storage'
import { Food } from '../../types/nutrition'

interface MobileBarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onFoodScanned: (food: Food) => void
  onManualEntry?: () => void
}

interface ScanState {
  isScanning: boolean
  isProcessing: boolean
  hasPermission: boolean | null
  error: string | null
  lastScan: any | null
  cameras: any[]
  selectedCamera: string | null
  capabilities: any | null
  settings: any
  deviceInfo: any
  feedback: {
    vibration: boolean
    sound: boolean
    visual: boolean
  }
}

interface CameraControls {
  torch: boolean
  zoom: number
  focusMode: string
  orientation: string
}

const MobileBarcodeScanner: React.FC<MobileBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onFoodScanned,
  onManualEntry
}) => {
  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    isProcessing: false,
    hasPermission: null,
    error: null,
    lastScan: null,
    cameras: [],
    selectedCamera: null,
    capabilities: null,
    settings: {},
    deviceInfo: {},
    feedback: {
      vibration: true,
      sound: true,
      visual: true
    }
  })

  const [cameraControls, setCameraControls] = useState<CameraControls>({
    torch: false,
    zoom: 1,
    focusMode: 'continuous',
    orientation: 'portrait'
  })

  const [showControls, setShowControls] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [feedbackType, setFeedbackType] = useState<string | null>(null)

  const scannerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize scanner when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeScanner()
      loadScanHistory()
      setupFeedbackListener()
    } else {
      cleanup()
    }

    return cleanup
  }, [isOpen])

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls])

  const initializeScanner = async () => {
    try {
      // Check mobile support
      if (!mobileBarcodeScanner.isSupported()) {
        setScanState(prev => ({
          ...prev,
          error: 'Camera scanning requires a mobile device with camera access.',
          hasPermission: false
        }))
        return
      }

      // Check HTTPS
      if (!mobileBarcodeScanner.isHTTPS()) {
        setScanState(prev => ({
          ...prev,
          error: 'Camera access requires a secure connection (HTTPS).',
          hasPermission: false
        }))
        return
      }

      // Get cameras and device info
      const cameras = await mobileBarcodeScanner.getCameras()
      const deviceInfo = mobileBarcodeScanner.deviceInfo
      
      setScanState(prev => ({
        ...prev,
        cameras,
        deviceInfo,
        selectedCamera: cameras.find(cam => cam.facingMode === 'environment')?.id || cameras[0]?.id || null
      }))

      console.log('📱 Mobile scanner initialized:', { cameras: cameras.length, deviceInfo })

    } catch (error) {
      console.error('Error initializing mobile scanner:', error)
      setScanState(prev => ({
        ...prev,
        error: 'Failed to initialize camera. Please check permissions.',
        hasPermission: false
      }))
    }
  }

  const loadScanHistory = async () => {
    try {
      const history = await storageService.getScanHistory(10)
      setScanHistory(history)
    } catch (error) {
      console.warn('Failed to load scan history:', error)
    }
  }

  const setupFeedbackListener = () => {
    const handleFeedback = (event: CustomEvent) => {
      setFeedbackType(event.detail.type)
      setTimeout(() => setFeedbackType(null), 500)
    }

    window.addEventListener('barcode-feedback', handleFeedback as EventListener)
    
    return () => {
      window.removeEventListener('barcode-feedback', handleFeedback as EventListener)
    }
  }

  const startScanning = async () => {
    if (!scannerRef.current) return

    setScanState(prev => ({ ...prev, isScanning: true, error: null }))

    try {
      const elementId = 'mobile-barcode-scanner-container'
      scannerRef.current.id = elementId

      // Set feedback preferences
      mobileBarcodeScanner.setFeedbackEnabled(
        scanState.feedback.vibration,
        scanState.feedback.sound,
        scanState.feedback.visual
      )

      await mobileBarcodeScanner.startScanning(
        elementId,
        handleScanSuccess,
        handleScanError,
        { 
          preferredCamera: scanState.selectedCamera || 'environment'
        }
      )

      // Get updated capabilities
      const capabilities = mobileBarcodeScanner.getCameraCapabilities()
      setScanState(prev => ({ 
        ...prev, 
        hasPermission: true,
        capabilities: capabilities.capabilities,
        settings: capabilities.settings
      }))

      // Update controls with current settings
      setCameraControls(prev => ({
        ...prev,
        ...capabilities.settings
      }))

    } catch (error) {
      console.error('Failed to start mobile scanning:', error)
      handleScanError('Failed to start camera')
    }
  }

  const handleScanSuccess = async (barcodeData: any) => {
    console.log('📱 Mobile scan successful:', barcodeData)
    
    setScanState(prev => ({
      ...prev,
      isScanning: false,
      isProcessing: true,
      lastScan: barcodeData
    }))

    try {
      // Save scan to history
      await storageService.saveScanHistory({
        barcode: barcodeData.code,
        type: barcodeData.type,
        success: true,
        hasProductInfo: barcodeData.hasProductInfo,
        deviceInfo: barcodeData.deviceInfo
      })

      if (barcodeData.hasProductInfo && barcodeData.product) {
        // Successfully found product
        const food: Food = {
          id: barcodeData.product.barcode,
          name: barcodeData.product.name,
          calories: barcodeData.product.calories,
          protein: barcodeData.product.protein,
          carbs: barcodeData.product.carbs,
          fats: barcodeData.product.fats,
          fiber: barcodeData.product.fiber || 0,
          sugar: barcodeData.product.sugar || 0,
          serving_size: barcodeData.product.serving_size,
          brand: barcodeData.product.brand,
          barcode: barcodeData.product.barcode
        }

        onFoodScanned(food)
        onClose()
      } else {
        // Barcode detected but no product info
        setScanState(prev => ({
          ...prev,
          error: `Barcode detected (${barcodeData.code}) but product not found. You can add it manually.`,
          isProcessing: false
        }))
      }
    } catch (error) {
      console.error('Error processing mobile scan result:', error)
      setScanState(prev => ({
        ...prev,
        error: 'Error processing scan result. Please try again.',
        isProcessing: false
      }))
    }
  }

  const handleScanError = async (error: string, details?: any) => {
    console.error('📱 Mobile scan error:', error, details)

    // Save failed scan to history
    if (details?.code !== 'PERMISSION_DENIED') {
      await storageService.saveScanHistory({
        error: error,
        success: false,
        errorCode: details?.code || 'UNKNOWN',
        deviceInfo: mobileBarcodeScanner.deviceInfo
      })
    }

    setScanState(prev => ({
      ...prev,
      isScanning: false,
      isProcessing: false,
      error,
      hasPermission: details?.granted !== false ? prev.hasPermission : false
    }))
  }

  const stopScanning = () => {
    mobileBarcodeScanner.stopScanning()
    setScanState(prev => ({ 
      ...prev, 
      isScanning: false, 
      isProcessing: false 
    }))
  }

  const cleanup = useCallback(() => {
    if (scanState.isScanning) {
      mobileBarcodeScanner.stopScanning()
    }
    setScanState({
      isScanning: false,
      isProcessing: false,
      hasPermission: null,
      error: null,
      lastScan: null,
      cameras: [],
      selectedCamera: null,
      capabilities: null,
      settings: {},
      deviceInfo: {},
      feedback: {
        vibration: true,
        sound: true,
        visual: true
      }
    })
    setShowControls(false)
    setShowSettings(false)
  }, [scanState.isScanning])

  const retryScanning = () => {
    setScanState(prev => ({ ...prev, error: null }))
    startScanning()
  }

  const switchCamera = async (cameraId: string) => {
    if (scanState.isScanning) {
      stopScanning()
    }
    
    setScanState(prev => ({ ...prev, selectedCamera: cameraId }))
    
    setTimeout(() => {
      if (isOpen) {
        startScanning()
      }
    }, 500)
  }

  // Camera control functions
  const toggleTorch = async () => {
    const newState = await mobileBarcodeScanner.toggleTorch()
    if (newState !== false) {
      setCameraControls(prev => ({ ...prev, torch: newState }))
    }
  }

  const handleZoomChange = async (delta: number) => {
    const newZoom = Math.max(1, Math.min(cameraControls.zoom + delta, 5))
    const actualZoom = await mobileBarcodeScanner.setZoom(newZoom)
    if (actualZoom !== false) {
      setCameraControls(prev => ({ ...prev, zoom: actualZoom }))
    }
  }

  const toggleFocusMode = async () => {
    const newMode = cameraControls.focusMode === 'continuous' ? 'manual' : 'continuous'
    const success = await mobileBarcodeScanner.setFocusMode(newMode)
    if (success) {
      setCameraControls(prev => ({ ...prev, focusMode: newMode }))
    }
  }

  const handleTapToFocus = async (event: React.TouchEvent | React.MouseEvent) => {
    if (!scanState.isScanning) return

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = (event.type.includes('touch') ? 
      (event as React.TouchEvent).touches[0].clientX : 
      (event as React.MouseEvent).clientX) - rect.left
    const y = (event.type.includes('touch') ? 
      (event as React.TouchEvent).touches[0].clientY : 
      (event as React.MouseEvent).clientY) - rect.top

    const normalizedX = x / rect.width
    const normalizedY = y / rect.height

    await mobileBarcodeScanner.focusAtPoint(normalizedX, normalizedY)
    setShowControls(true)
  }

  const toggleFeedback = (type: 'vibration' | 'sound' | 'visual') => {
    setScanState(prev => ({
      ...prev,
      feedback: {
        ...prev.feedback,
        [type]: !prev.feedback[type]
      }
    }))
  }

  if (!isOpen) return null

  const isIOS = scanState.deviceInfo?.isIOS
  const isAndroid = scanState.deviceInfo?.isAndroid
  const supportsTorch = scanState.capabilities?.torch
  const supportsZoom = scanState.capabilities?.zoom
  const supportsFocus = scanState.capabilities?.focusMode

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <div className="flex items-center gap-3">
          <Camera size={24} className="text-primary-400" />
          <div>
            <h3 className="text-lg font-semibold">Mobile Scanner</h3>
            <p className="text-xs text-gray-400">
              {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile'} • 
              {scanState.cameras.length} camera{scanState.cameras.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-900 text-white p-4 border-b border-gray-700">
          <div className="space-y-4">
            {/* Camera Selection */}
            {scanState.cameras.length > 1 && (
              <div>
                <label className="block text-sm font-medium mb-2">Camera</label>
                <select
                  value={scanState.selectedCamera || ''}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  disabled={scanState.isScanning}
                >
                  {scanState.cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label} {camera.facingMode !== 'unknown' && `(${camera.facingMode})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Feedback Settings */}
            <div>
              <label className="block text-sm font-medium mb-2">Feedback</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scanState.feedback.vibration}
                    onChange={() => toggleFeedback('vibration')}
                    className="mr-2"
                  />
                  <Smartphone size={16} className="mr-1" />
                  Vibration
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scanState.feedback.sound}
                    onChange={() => toggleFeedback('sound')}
                    className="mr-2"
                  />
                  {scanState.feedback.sound ? <Volume2 size={16} className="mr-1" /> : <VolumeX size={16} className="mr-1" />}
                  Sound
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Area */}
      <div className="flex-1 relative">
        {/* Visual Feedback Overlay */}
        {feedbackType && (
          <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-300 ${
            feedbackType === 'success' ? 'bg-green-500 bg-opacity-20' :
            feedbackType === 'error' ? 'bg-red-500 bg-opacity-20' :
            feedbackType === 'detected' ? 'bg-yellow-500 bg-opacity-20' :
            'bg-blue-500 bg-opacity-10'
          }`} />
        )}

        {/* Scanning Overlay */}
        {scanState.isScanning && (
          <div 
            className="absolute inset-0 z-10"
            onTouchStart={handleTapToFocus}
            onClick={handleTapToFocus}
          >
            <div className="absolute inset-0 bg-black bg-opacity-30">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-64 border-2 border-primary-400 border-dashed rounded-lg relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400"></div>
                  
                  {/* Scanning animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary-400 animate-pulse"></div>
                  </div>
                </div>
                
                <p className="text-white text-center mt-4 text-sm">
                  Position barcode in frame • Tap to focus
                </p>
                
                {/* Zoom indicator */}
                {cameraControls.zoom > 1 && (
                  <div className="text-white text-center mt-2 text-xs">
                    Zoom: {cameraControls.zoom.toFixed(1)}x
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera Controls Overlay */}
        {scanState.isScanning && showControls && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="bg-black bg-opacity-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {/* Torch Control */}
                  {supportsTorch && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-lg transition-colors ${
                        cameraControls.torch 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {cameraControls.torch ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
                    </button>
                  )}
                  
                  {/* Focus Control */}
                  {supportsFocus && (
                    <button
                      onClick={toggleFocusMode}
                      className={`p-2 rounded-lg transition-colors ${
                        cameraControls.focusMode === 'manual'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      <Focus size={20} />
                    </button>
                  )}
                </div>

                {/* Zoom Controls */}
                {supportsZoom && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleZoomChange(-0.5)}
                      disabled={cameraControls.zoom <= 1}
                      className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-white text-sm min-w-[3rem] text-center">
                      {cameraControls.zoom.toFixed(1)}x
                    </span>
                    <button
                      onClick={() => handleZoomChange(0.5)}
                      disabled={cameraControls.zoom >= 5}
                      className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera View */}
        <div
          ref={scannerRef}
          className="w-full h-full bg-black"
          onTouchStart={() => setShowControls(true)}
          onClick={() => setShowControls(true)}
        />

        {/* Status Overlays */}
        {!scanState.isScanning && !scanState.isProcessing && !scanState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white px-6">
              <Camera size={64} className="mx-auto mb-6 text-gray-400" />
              <h4 className="text-xl font-medium mb-2">Ready to Scan</h4>
              <p className="text-gray-300 text-sm mb-2">
                Optimized for {isIOS ? 'iOS' : isAndroid ? 'Android' : 'mobile'} devices
              </p>
              <p className="text-gray-400 text-xs mb-8">
                • Tap to focus • Pinch to zoom • Use controls for flash
              </p>
              <button
                onClick={startScanning}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-medium text-lg"
                disabled={!scanState.selectedCamera}
              >
                Start Camera
              </button>
            </div>
          </div>
        )}

        {scanState.isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary-400" />
              <h4 className="text-lg font-medium mb-2">Processing...</h4>
              <p className="text-gray-300 text-sm">
                Looking up product information
              </p>
            </div>
          </div>
        )}

        {scanState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white px-6">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
              <h4 className="text-lg font-medium mb-2">Scan Failed</h4>
              <p className="text-gray-300 text-sm mb-6 max-w-md">
                {scanState.error}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={retryScanning}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Try Again
                </button>
                {onManualEntry && (
                  <button
                    onClick={() => {
                      onClose()
                      onManualEntry()
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                  >
                    Manual Entry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {scanState.isScanning ? (
              <button
                onClick={stopScanning}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <X size={16} />
                Stop
              </button>
            ) : !scanState.error && (
              <button
                onClick={startScanning}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                disabled={!scanState.selectedCamera}
              >
                <Camera size={16} />
                Start
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {scanState.deviceInfo?.browser && (
              <span>{scanState.deviceInfo.browser}</span>
            )}
            {scanState.feedback.vibration && <Smartphone size={12} />}
            {scanState.feedback.sound && <Volume2 size={12} />}
          </div>
        </div>

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-xs font-medium text-gray-400 mb-2">Recent Scans</h4>
            <div className="flex gap-2 overflow-x-auto">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 flex items-center gap-1 bg-gray-800 px-2 py-1 rounded text-xs"
                >
                  {scan.success ? (
                    <CheckCircle size={10} className="text-green-400" />
                  ) : (
                    <AlertCircle size={10} className="text-red-400" />
                  )}
                  <span className="text-gray-300">
                    {scan.barcode?.substring(0, 8) || 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileBarcodeScanner