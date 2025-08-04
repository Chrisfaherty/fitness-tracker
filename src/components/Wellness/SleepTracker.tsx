import React, { useState, useEffect } from 'react'
import { Moon, Plus, Clock, Star, Calendar, TrendingUp, Save, X, AlertCircle } from 'lucide-react'
import { 
  SleepEntry, 
  SleepQuality, 
  SleepQualityOption, 
  SleepFormData, 
  SleepValidationResult 
} from '../../types/sleep'

interface SleepTrackerProps {
  onSleepEntryAdd: (entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  recentEntries?: SleepEntry[]
  isLoading?: boolean
}

const SleepTracker: React.FC<SleepTrackerProps> = ({
  onSleepEntryAdd,
  recentEntries = [],
  isLoading = false
}) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<SleepFormData>({
    bedtime: '',
    wakeTime: '',
    quality: 3,
    notes: ''
  })
  const [validation, setValidation] = useState<SleepValidationResult>({
    isValid: true,
    errors: {}
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sleep quality options with clear descriptions
  const qualityOptions: SleepQualityOption[] = [
    {
      value: 1,
      label: 'Very Poor',
      emoji: '😴',
      description: 'Restless night, barely slept'
    },
    {
      value: 2,
      label: 'Poor',
      emoji: '😪',
      description: 'Struggled to fall asleep or stay asleep'
    },
    {
      value: 3,
      label: 'Fair',
      emoji: '😐',
      description: 'Some interruptions, okay rest'
    },
    {
      value: 4,
      label: 'Good',
      emoji: '😊',
      description: 'Slept well, felt rested'
    },
    {
      value: 5,
      label: 'Excellent',
      emoji: '😇',
      description: 'Perfect sleep, woke up refreshed'
    }
  ]

  // Calculate sleep duration from bedtime and wake time
  const calculateDuration = (bedtime: string, wakeTime: string) => {
    if (!bedtime || !wakeTime) return { hours: 0, minutes: 0, totalMinutes: 0 }

    const [bedHour, bedMin] = bedtime.split(':').map(Number)
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number)

    let bedtimeMinutes = bedHour * 60 + bedMin
    let waketimeMinutes = wakeHour * 60 + wakeMin

    // Handle crossing midnight (bedtime after wakeTime means next day wake)
    if (waketimeMinutes <= bedtimeMinutes) {
      waketimeMinutes += 24 * 60 // Add 24 hours
    }

    const totalMinutes = waketimeMinutes - bedtimeMinutes
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return { hours, minutes, totalMinutes }
  }

  // Validate form data
  const validateForm = (data: SleepFormData): SleepValidationResult => {
    const errors: SleepValidationResult['errors'] = {}

    // Validate bedtime
    if (!data.bedtime) {
      errors.bedtime = 'Bedtime is required'
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.bedtime)) {
      errors.bedtime = 'Invalid time format (use HH:MM)'
    }

    // Validate wake time
    if (!data.wakeTime) {
      errors.wakeTime = 'Wake time is required'
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.wakeTime)) {
      errors.wakeTime = 'Invalid time format (use HH:MM)'
    }

    // Validate duration if both times are provided
    if (data.bedtime && data.wakeTime) {
      const duration = calculateDuration(data.bedtime, data.wakeTime)
      
      if (duration.totalMinutes < 60) {
        errors.duration = 'Sleep duration seems too short (less than 1 hour)'
      } else if (duration.totalMinutes > 16 * 60) {
        errors.duration = 'Sleep duration seems too long (more than 16 hours)'
      }
    }

    // Validate quality
    if (!data.quality || data.quality < 1 || data.quality > 5) {
      errors.quality = 'Please select a sleep quality rating'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationResult = validateForm(formData)
    setValidation(validationResult)

    if (!validationResult.isValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const duration = calculateDuration(formData.bedtime, formData.wakeTime)
      const today = new Date().toISOString().split('T')[0]

      // Basic sleep score calculation (will be enhanced later)
      const sleepScore = calculateBasicSleepScore(duration.totalMinutes, formData.quality)

      const sleepEntry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        date: today,
        bedtime: formData.bedtime,
        wakeTime: formData.wakeTime,
        duration,
        quality: formData.quality,
        sleepScore,
        notes: formData.notes.trim() || undefined
      }

      await onSleepEntryAdd(sleepEntry)
      
      // Reset form
      setFormData({
        bedtime: '',
        wakeTime: '',
        quality: 3,
        notes: ''
      })
      setShowForm(false)
      setValidation({ isValid: true, errors: {} })

    } catch (error) {
      console.error('Error saving sleep entry:', error)
      setValidation({
        isValid: false,
        errors: { duration: 'Failed to save sleep entry. Please try again.' }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Basic sleep score calculation (0-100)
  const calculateBasicSleepScore = (durationMinutes: number, quality: SleepQuality): number => {
    // Optimal sleep duration: 7-9 hours (420-540 minutes)
    const optimalMin = 420 // 7 hours
    const optimalMax = 540 // 9 hours
    
    // Duration score (0-40 points)
    let durationScore = 0
    if (durationMinutes >= optimalMin && durationMinutes <= optimalMax) {
      durationScore = 40
    } else if (durationMinutes < optimalMin) {
      // Penalty for too little sleep
      durationScore = Math.max(0, 40 - (optimalMin - durationMinutes) / 10)
    } else {
      // Penalty for too much sleep
      durationScore = Math.max(0, 40 - (durationMinutes - optimalMax) / 20)
    }

    // Quality score (0-60 points)
    const qualityScore = (quality - 1) * 15 // 1=0pts, 2=15pts, 3=30pts, 4=45pts, 5=60pts

    return Math.round(durationScore + qualityScore)
  }

  // Format duration for display
  const formatDuration = (hours: number, minutes: number): string => {
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  // Get today's entry if it exists
  const todaysEntry = recentEntries.find(entry => 
    entry.date === new Date().toISOString().split('T')[0]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="text-primary-500" size={24} />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sleep Tracker
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor your sleep quality and duration
            </p>
          </div>
        </div>
        
        {!showForm && !todaysEntry && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
            disabled={isLoading}
          >
            <Plus size={16} />
            Log Sleep
          </button>
        )}
      </div>

      {/* Today's Sleep Status */}
      {todaysEntry && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Last Night's Sleep
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Duration:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                    {formatDuration(todaysEntry.duration.hours, todaysEntry.duration.minutes)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Quality:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                    {qualityOptions.find(q => q.value === todaysEntry.quality)?.emoji} {' '}
                    {qualityOptions.find(q => q.value === todaysEntry.quality)?.label}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Bedtime:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                    {todaysEntry.bedtime}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-400">Wake Time:</span>
                  <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                    {todaysEntry.wakeTime}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {todaysEntry.sleepScore}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-400">
                Sleep Score
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Entry Form */}
      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Log Last Night's Sleep
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setValidation({ isValid: true, errors: {} })
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Bedtime
                </label>
                <input
                  type="time"
                  value={formData.bedtime}
                  onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
                  className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    validation.errors.bedtime
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } focus:ring-2 focus:border-transparent`}
                  required
                />
                {validation.errors.bedtime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validation.errors.bedtime}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Wake Time
                </label>
                <input
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                  className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    validation.errors.wakeTime
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                  } focus:ring-2 focus:border-transparent`}
                  required
                />
                {validation.errors.wakeTime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validation.errors.wakeTime}
                  </p>
                )}
              </div>
            </div>

            {/* Duration Display */}
            {formData.bedtime && formData.wakeTime && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Moon size={20} className="text-primary-500" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Sleep Duration: {formatDuration(
                      calculateDuration(formData.bedtime, formData.wakeTime).hours,
                      calculateDuration(formData.bedtime, formData.wakeTime).minutes
                    )}
                  </span>
                </div>
                {validation.errors.duration && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center flex items-center justify-center gap-1">
                    <AlertCircle size={14} />
                    {validation.errors.duration}
                  </p>
                )}
              </div>
            )}

            {/* Sleep Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Star size={16} className="inline mr-2" />
                Sleep Quality
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {qualityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, quality: option.value })}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.quality === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
              {validation.errors.quality && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validation.errors.quality}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any dreams, sleep disturbances, or other observations..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.notes.length}/500 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSubmitting || !validation.isValid}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Sleep Log
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Sleep Entries */}
      {recentEntries.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Recent Sleep Log
          </h3>
          <div className="space-y-3">
            {recentEntries.slice(0, 7).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString('en', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatDuration(entry.duration.hours, entry.duration.minutes)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.bedtime} → {entry.wakeTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xl">
                      {qualityOptions.find(q => q.value === entry.quality)?.emoji}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Quality
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {entry.sleepScore}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Score
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SleepTracker