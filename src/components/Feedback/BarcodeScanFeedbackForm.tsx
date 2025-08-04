import React, { useState, useRef } from 'react'
import { 
  Camera, X, AlertCircle, Send, Star, MessageSquare, 
  Image, Smartphone, Wifi, WifiOff, Clock, RotateCcw
} from 'lucide-react'
import { feedbackService } from '../../services/feedbackService'

interface BarcodeScanFeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  scanAttempt: {
    barcode?: string
    errorType: string
    errorMessage: string
    deviceInfo: any
    environment: any
    scanDuration: number
    attempts: number
  }
}

interface FeedbackData {
  rating: number
  issue: string
  description: string
  expectedProduct?: string
  packageCondition: string
  lightingCondition: string
  scanImageData?: string
  userSuggestion?: string
  wouldRetry: boolean
}

const BarcodeScanFeedbackForm: React.FC<BarcodeScanFeedbackFormProps> = ({
  isOpen,
  onClose,
  scanAttempt
}) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    rating: 0,
    issue: '',
    description: '',
    packageCondition: '',
    lightingCondition: '',
    wouldRetry: true
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImageCapture, setShowImageCapture] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const issueTypes = [
    { id: 'barcode_not_detected', label: 'Barcode not detected', icon: '🔍' },
    { id: 'wrong_product', label: 'Wrong product found', icon: '❌' },
    { id: 'camera_issues', label: 'Camera problems', icon: '📷' },
    { id: 'slow_scanning', label: 'Too slow to scan', icon: '⏱️' },
    { id: 'lighting_issues', label: 'Lighting problems', icon: '💡' },
    { id: 'app_crash', label: 'App crashed/froze', icon: '💥' },
    { id: 'other', label: 'Other issue', icon: '🤷' }
  ]

  const lightingConditions = [
    { id: 'bright_indoor', label: 'Bright indoor lighting' },
    { id: 'dim_indoor', label: 'Dim indoor lighting' },
    { id: 'outdoor_sun', label: 'Bright outdoor/sunlight' },
    { id: 'fluorescent', label: 'Fluorescent office lighting' },
    { id: 'very_dark', label: 'Very dark environment' }
  ]

  const packageConditions = [
    { id: 'perfect', label: 'Perfect condition' },
    { id: 'slightly_worn', label: 'Slightly worn/scratched' },
    { id: 'damaged', label: 'Damaged/torn packaging' },
    { id: 'reflective', label: 'Shiny/reflective surface' },
    { id: 'curved', label: 'Curved/cylindrical package' },
    { id: 'small_barcode', label: 'Very small barcode' }
  ]

  const handleRatingChange = (rating: number) => {
    setFeedbackData(prev => ({ ...prev, rating }))
  }

  const handleIssueSelect = (issue: string) => {
    setFeedbackData(prev => ({ ...prev, issue }))
  }

  const handleImageCapture = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setCapturedImage(imageData)
        setFeedbackData(prev => ({ ...prev, scanImageData: imageData }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!feedbackData.rating || !feedbackData.issue) {
      alert('Please provide a rating and select an issue type')
      return
    }

    setIsSubmitting(true)

    try {
      await feedbackService.submitScanFeedback({
        ...feedbackData,
        scanAttempt,
        timestamp: new Date().toISOString(),
        submissionId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })

      // Show success message and close
      alert('Thank you for your feedback! This helps us improve the barcode scanner.')
      onClose()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Scan Feedback
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Help us improve barcode scanning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Scan Attempt Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Scan Attempt Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {(scanAttempt.scanDuration / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {scanAttempt.attempts} attempts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {scanAttempt.deviceInfo?.platform || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {scanAttempt.environment?.online ? 
                  <Wifi className="h-4 w-4 text-green-500" /> : 
                  <WifiOff className="h-4 w-4 text-red-500" />
                }
                <span className="text-gray-600 dark:text-gray-400">
                  {scanAttempt.environment?.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            {scanAttempt.barcode && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs font-mono">
                Barcode: {scanAttempt.barcode}
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How was your scanning experience? *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className={`p-1 transition-colors ${
                    star <= feedbackData.rating
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star 
                    className="h-8 w-8" 
                    fill={star <= feedbackData.rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {feedbackData.rating === 1 && 'Very Poor'}
              {feedbackData.rating === 2 && 'Poor'}
              {feedbackData.rating === 3 && 'Average'}
              {feedbackData.rating === 4 && 'Good'}
              {feedbackData.rating === 5 && 'Excellent'}
            </div>
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What was the main issue? *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {issueTypes.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleIssueSelect(issue.id)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    feedbackData.issue === issue.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{issue.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {issue.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 gap-4">
            {/* Lighting Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lighting condition
              </label>
              <select
                value={feedbackData.lightingCondition}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, lightingCondition: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select lighting condition</option>
                {lightingConditions.map((condition) => (
                  <option key={condition.id} value={condition.id}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Package Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package condition
              </label>
              <select
                value={feedbackData.packageCondition}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, packageCondition: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select package condition</option>
                {packageConditions.map((condition) => (
                  <option key={condition.id} value={condition.id}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expected Product */}
          {feedbackData.issue === 'wrong_product' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What product were you trying to scan?
              </label>
              <input
                type="text"
                value={feedbackData.expectedProduct || ''}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, expectedProduct: e.target.value }))}
                placeholder="e.g., Coca-Cola 12oz can"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={feedbackData.description}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please describe what happened and any suggestions for improvement..."
              rows={3}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Image Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo of the barcode (optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              A photo helps us understand scanning issues better
            </p>
            
            {capturedImage ? (
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured barcode" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  onClick={() => {
                    setCapturedImage(null)
                    setFeedbackData(prev => ({ ...prev, scanImageData: undefined }))
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleImageCapture}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition-colors flex items-center justify-center gap-2"
              >
                <Image className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tap to add photo
                </span>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelected}
              className="hidden"
            />
          </div>

          {/* Would Retry */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={feedbackData.wouldRetry}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, wouldRetry: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I would try scanning this product again
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!feedbackData.rating || !feedbackData.issue || isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanFeedbackForm