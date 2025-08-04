import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, X, AlertCircle, CheckCircle, RotateCcw, Loader2, Info } from 'lucide-react'
import barcodeScanner from '../../services/barcodeScanner'
import openFoodFacts from '../../services/openFoodFacts'
import storageService from '../../services/storage'
import { Food } from '../../types/nutrition'

interface BarcodeScannerProps {
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
}

interface PermissionError {
  granted: boolean
  code: string
  message: string
  userAction: string
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
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
    selectedCamera: null
  })

  const scannerRef = useRef<HTMLDivElement>(null)
  const [showPermissionHelp, setShowPermissionHelp] = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])

  // Check initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeScanner()
      loadScanHistory()
    } else {
      cleanup()
    }

    return cleanup
  }, [isOpen])

  const initializeScanner = async () => {
    try {
      // Check browser support
      if (!barcodeScanner.isSupported()) {
        setScanState(prev => ({
          ...prev,
          error: 'Camera access is not supported by this browser. Please use Chrome, Firefox, or Safari.',
          hasPermission: false
        }))
        return
      }

      // Check HTTPS requirement
      if (!barcodeScanner.isHTTPS()) {
        setScanState(prev => ({
          ...prev,
          error: 'Camera access requires a secure connection (HTTPS). Please access the site using HTTPS.',
          hasPermission: false
        }))
        return
      }

      // Get available cameras
      const cameras = await barcodeScanner.getCameras()
      setScanState(prev => ({
        ...prev,
        cameras,
        selectedCamera: cameras.find(cam => cam.facingMode === 'environment')?.id || cameras[0]?.id || null
      }))

    } catch (error) {
      console.error('Error initializing scanner:', error)
      setScanState(prev => ({
        ...prev,
        error: 'Failed to initialize camera. Please check your browser settings.',
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

  const startScanning = async () => {
    if (!scannerRef.current) return

    setScanState(prev => ({ ...prev, isScanning: true, error: null }))

    try {
      const elementId = 'barcode-scanner-container'
      scannerRef.current.id = elementId

      await barcodeScanner.startScanning(
        elementId,
        handleScanSuccess,
        handleScanError,
        { preferredCamera: scanState.selectedCamera || 'environment' }
      )

      setScanState(prev => ({ ...prev, hasPermission: true }))
    } catch (error) {
      console.error('Failed to start scanning:', error)
      handleScanError('Failed to start camera')
    }
  }

  const handleScanSuccess = async (barcodeData: any) => {
    console.log('Barcode scan successful:', barcodeData)
    
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
        hasProductInfo: barcodeData.hasProductInfo
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
          error: `Barcode detected (${barcodeData.code}) but product not found in database. You can add it manually.`,
          isProcessing: false
        }))
      }
    } catch (error) {
      console.error('Error processing scan result:', error)
      setScanState(prev => ({
        ...prev,
        error: 'Error processing scan result. Please try again.',
        isProcessing: false
      }))
    }
  }

  const handleScanError = async (error: string, details?: PermissionError) => {
    console.error('Barcode scan error:', error, details)

    // Save failed scan to history
    if (details?.code !== 'PERMISSION_DENIED') {
      await storageService.saveScanHistory({
        error: error,
        success: false,
        errorCode: details?.code || 'UNKNOWN'
      })
    }

    setScanState(prev => ({
      ...prev,
      isScanning: false,
      isProcessing: false,
      error,
      hasPermission: details?.granted !== false ? prev.hasPermission : false
    }))

    // Show permission help for permission-related errors
    if (details?.code === 'PERMISSION_DENIED' || details?.code === 'HTTPS_REQUIRED') {
      setShowPermissionHelp(true)
    }
  }

  const stopScanning = () => {
    barcodeScanner.stopScanning()
    setScanState(prev => ({ 
      ...prev, 
      isScanning: false, 
      isProcessing: false 
    }))
  }

  const cleanup = useCallback(() => {
    if (scanState.isScanning) {
      barcodeScanner.stopScanning()
    }
    setScanState({
      isScanning: false,
      isProcessing: false,
      hasPermission: null,
      error: null,
      lastScan: null,
      cameras: [],
      selectedCamera: null
    })
    setShowPermissionHelp(false)
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
    
    // Wait a moment for cleanup, then restart with new camera
    setTimeout(() => {
      if (isOpen) {
        startScanning()
      }
    }, 500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full h-full sm:w-11/12 sm:h-5/6 sm:max-w-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Camera size={24} className="text-primary-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Scan Barcode
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Point camera at product barcode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close scanner"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Camera Controls */}
        {scanState.cameras.length > 1 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Camera
            </label>
            <select
              value={scanState.selectedCamera || ''}
              onChange={(e) => switchCamera(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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

        {/* Scanner Area */}
        <div className="flex-1 relative bg-black">
          {scanState.isScanning && (
            <div className="absolute inset-0 z-10">
              {/* Scanning overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-64 h-64 border-2 border-primary-500 border-dashed rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500"></div>
                  </div>
                  <p className="text-white text-center mt-4 text-sm">
                    Position barcode within the frame
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Camera view */}
          <div
            ref={scannerRef}
            className="w-full h-full"
            style={{ minHeight: '300px' }}
          />

          {/* Status overlays */}
          {!scanState.isScanning && !scanState.isProcessing && !scanState.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium mb-2">Ready to Scan</h4>
                <p className="text-gray-300 text-sm mb-6">
                  Tap the button below to start scanning
                </p>
                <button
                  onClick={startScanning}
                  className="btn-primary"
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
                <Loader2 size={48} className="mx-auto mb-4 animate-spin text-primary-500" />
                <h4 className="text-lg font-medium mb-2">Processing...</h4>
                <p className="text-gray-300 text-sm">
                  Looking up product information
                </p>
              </div>
            </div>
          )}

          {scanState.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white px-6">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <h4 className="text-lg font-medium mb-2">Scan Failed</h4>
                <p className="text-gray-300 text-sm mb-6 max-w-md">
                  {scanState.error}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={retryScanning}
                    className="btn-primary flex items-center gap-2"
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
                      className="btn-secondary"
                    >
                      Manual Entry
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {scanState.isScanning ? (
                <button
                  onClick={stopScanning}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X size={16} />
                  Stop
                </button>
              ) : !scanState.error && (
                <button
                  onClick={startScanning}
                  className="btn-primary flex items-center gap-2"
                  disabled={!scanState.selectedCamera}
                >
                  <Camera size={16} />
                  Start Scanning
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              {onManualEntry && (
                <button
                  onClick={() => {
                    onClose()
                    onManualEntry()
                  }}
                  className="btn-secondary text-sm"
                >
                  Manual Entry
                </button>
              )}
              
              <button
                onClick={() => setShowPermissionHelp(!showPermissionHelp)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="Help"
              >
                <Info size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Permission Help */}
        {showPermissionHelp && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              Camera Permission Required
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
              <p>To scan barcodes, this app needs access to your camera. Here's how to enable it:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Look for a camera icon in your browser's address bar</li>
                <li>Click "Allow" when prompted for camera access</li>
                <li>Make sure you're using HTTPS (secure connection)</li>
                <li>Try refreshing the page if permissions were previously denied</li>
              </ul>
              <p className="mt-3">
                <strong>Supported browsers:</strong> Chrome, Firefox, Safari (latest versions)
              </p>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recent Scans
            </h4>
            <div className="space-y-1">
              {scanHistory.slice(0, 3).map((scan, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {scan.success ? (
                    <CheckCircle size={12} className="text-green-500" />
                  ) : (
                    <AlertCircle size={12} className="text-red-500" />
                  )}
                  <span className="text-gray-600 dark:text-gray-400">
                    {scan.barcode || 'Failed scan'} - {new Date(scan.timestamp).toLocaleTimeString()}
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

export default BarcodeScanner