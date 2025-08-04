import React, { useState, useEffect } from 'react'
import { Camera, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import barcodeScanner from '../../services/barcodeScanner'

const CameraTest: React.FC = () => {
  const [testResults, setTestResults] = useState({
    browserSupport: null as boolean | null,
    httpsCheck: null as boolean | null,
    cameraPermission: null as boolean | null,
    cameraList: [] as any[],
    permissionDetails: null as any,
    scannerStatus: null as any
  })

  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    setIsRunning(true)
    
    // Test 1: Browser Support
    const browserSupport = barcodeScanner.isSupported()
    console.log('Browser support:', browserSupport)
    
    // Test 2: HTTPS Check
    const httpsCheck = barcodeScanner.isHTTPS()
    console.log('HTTPS check:', httpsCheck)
    
    // Test 3: Get Scanner Status
    const scannerStatus = barcodeScanner.getStatus()
    console.log('Scanner status:', scannerStatus)
    
    let cameraPermission = null
    let permissionDetails = null
    let cameraList = []
    
    if (browserSupport && httpsCheck) {
      // Test 4: Camera Permission
      try {
        permissionDetails = await barcodeScanner.requestCameraPermission()
        cameraPermission = permissionDetails.granted
        console.log('Camera permission:', permissionDetails)
        
        if (cameraPermission) {
          // Test 5: Get Available Cameras
          cameraList = await barcodeScanner.getCameras()
          console.log('Available cameras:', cameraList)
        }
      } catch (error) {
        console.error('Permission test failed:', error)
        cameraPermission = false
      }
    }
    
    setTestResults({
      browserSupport,
      httpsCheck,
      cameraPermission,
      cameraList,
      permissionDetails,
      scannerStatus
    })
    
    setIsRunning(false)
  }

  const TestResult: React.FC<{ 
    title: string
    status: boolean | null
    details?: string
    children?: React.ReactNode 
  }> = ({ title, status, details, children }) => {
    const getIcon = () => {
      if (status === null) return <AlertCircle className="text-gray-400" size={20} />
      if (status === true) return <CheckCircle className="text-green-500" size={20} />
      return <XCircle className="text-red-500" size={20} />
    }

    const getStatusText = () => {
      if (status === null) return 'Testing...'
      if (status === true) return 'Passed'
      return 'Failed'
    }

    return (
      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        {getIcon()}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Status: {getStatusText()}
          </p>
          {details && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{details}</p>
          )}
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <Camera size={48} className="mx-auto mb-4 text-primary-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Camera & Barcode Scanner Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This test verifies that barcode scanning will work on your device
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <TestResult
          title="Browser Support"
          status={testResults.browserSupport}
          details={testResults.browserSupport 
            ? "Your browser supports camera access" 
            : "Camera access not supported. Try Chrome, Firefox, or Safari"
          }
        />

        <TestResult
          title="HTTPS Security"
          status={testResults.httpsCheck}
          details={testResults.httpsCheck 
            ? "Secure connection detected" 
            : "Camera access requires HTTPS. Make sure you're using https:// in the URL"
          }
        />

        <TestResult
          title="Camera Permission"
          status={testResults.cameraPermission}
          details={testResults.permissionDetails?.message}
        >
          {testResults.permissionDetails && !testResults.permissionDetails.granted && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                <strong>Action needed:</strong> {testResults.permissionDetails.userAction}
              </p>
            </div>
          )}
        </TestResult>

        <TestResult
          title="Available Cameras"
          status={testResults.cameraList.length > 0 ? true : testResults.cameraPermission === false ? false : null}
          details={`Found ${testResults.cameraList.length} camera(s)`}
        >
          {testResults.cameraList.length > 0 && (
            <div className="mt-2 space-y-1">
              {testResults.cameraList.map((camera, index) => (
                <div key={camera.id} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Camera {index + 1}:</span> {camera.label}
                  {camera.facingMode !== 'unknown' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                      {camera.facingMode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TestResult>
      </div>

      {/* Scanner Status */}
      {testResults.scannerStatus && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="flex items-center gap-2 font-medium text-blue-900 dark:text-blue-300 mb-2">
            <Info size={16} />
            Scanner Status
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <p>Supported: {testResults.scannerStatus.isSupported ? 'Yes' : 'No'}</p>
            <p>HTTPS: {testResults.scannerStatus.isHTTPS ? 'Yes' : 'No'}</p>
            <p>Currently Scanning: {testResults.scannerStatus.isScanning ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}

      {/* Overall Status */}
      <div className="text-center">
        {testResults.browserSupport && testResults.httpsCheck && testResults.cameraPermission ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
              Ready to Scan! 🎉
            </h3>
            <p className="text-sm text-green-800 dark:text-green-400">
              Your device is properly configured for barcode scanning
            </p>
          </div>
        ) : (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <XCircle className="mx-auto mb-2 text-red-500" size={32} />
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
              Setup Required
            </h3>
            <p className="text-sm text-red-800 dark:text-red-400">
              Please resolve the failed tests above to enable barcode scanning
            </p>
          </div>
        )}
      </div>

      {/* Retry Button */}
      <div className="text-center mt-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="btn-primary"
        >
          {isRunning ? 'Testing...' : 'Run Tests Again'}
        </button>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Troubleshooting Tips
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Make sure you're using a modern browser (Chrome, Firefox, Safari)</li>
          <li>• Ensure the site URL starts with https:// (secure connection)</li>
          <li>• Click "Allow" when prompted for camera access</li>
          <li>• Check browser settings if camera permission was previously denied</li>
          <li>• Try refreshing the page if you encounter issues</li>
          <li>• On mobile, make sure no other apps are using the camera</li>
        </ul>
      </div>
    </div>
  )
}

export default CameraTest