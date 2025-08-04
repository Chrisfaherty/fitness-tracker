import React, { useState, useEffect } from 'react'
import {
  Target, Camera, Bell, Smartphone, Trophy, ArrowRight, ArrowLeft,
  Scale, TrendingUp, Calendar, Clock, Utensils, Activity, Heart,
  CheckCircle, AlertCircle, Play, Pause, Volume2, VolumeX,
  Image, MessageSquare, Settings, BarChart3, Zap, Star
} from 'lucide-react'

// Goals Setting Step
export const GoalsStep: React.FC<any> = ({ goals, setGoals, nextStep, prevStep }) => {
  const [errors, setErrors] = useState<any>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: any = {}
    if (!goals.primaryGoal) newErrors.primaryGoal = 'Please select your primary goal'
    if (!goals.targetWeight) newErrors.targetWeight = 'Please enter your target weight'
    if (!goals.timeframe) newErrors.timeframe = 'Please select a timeframe'

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      nextStep()
    }
  }

  const calculateWeeklyWeightChange = () => {
    if (!goals.currentWeight || !goals.targetWeight || !goals.timeframe) return 0
    
    const weightDiff = goals.targetWeight - goals.currentWeight
    const weeks = goals.timeframe === 'aggressive' ? 12 : goals.timeframe === 'moderate' ? 24 : 52
    return Math.abs(weightDiff / weeks)
  }

  const getRecommendedCalories = () => {
    if (!goals.primaryGoal || !goals.currentWeight) return null
    
    const baseCalories = goals.currentWeight * 12 // Rough estimate
    
    switch (goals.primaryGoal) {
      case 'weight_loss':
        return baseCalories - 500
      case 'muscle_gain':
        return baseCalories + 300
      case 'maintenance':
        return baseCalories
      default:
        return baseCalories
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Set Your Goals</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Define what you want to achieve so we can help you get there
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What's your primary goal? *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                value: 'weight_loss', 
                label: 'Lose Weight', 
                desc: 'Reduce body weight and body fat',
                icon: TrendingUp,
                color: 'text-red-600'
              },
              { 
                value: 'muscle_gain', 
                label: 'Build Muscle', 
                desc: 'Increase muscle mass and strength',
                icon: Activity,
                color: 'text-blue-600'
              },
              { 
                value: 'maintenance', 
                label: 'Maintain Weight', 
                desc: 'Keep current weight and improve health',
                icon: Scale,
                color: 'text-green-600'
              },
              { 
                value: 'athletic_performance', 
                label: 'Athletic Performance', 
                desc: 'Enhance sports and exercise performance',
                icon: Trophy,
                color: 'text-purple-600'
              }
            ].map(goal => {
              const Icon = goal.icon
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => setGoals({...goals, primaryGoal: goal.value})}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    goals.primaryGoal === goal.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`h-6 w-6 ${goal.color}`} />
                    <span className="font-medium text-gray-900 dark:text-white">{goal.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{goal.desc}</p>
                </button>
              )
            })}
          </div>
          {errors.primaryGoal && <p className="text-red-500 text-sm mt-1">{errors.primaryGoal}</p>}
        </div>

        {(goals.primaryGoal === 'weight_loss' || goals.primaryGoal === 'muscle_gain') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Weight (lbs)
              </label>
              <input
                type="number"
                value={goals.currentWeight || ''}
                onChange={(e) => setGoals({...goals, currentWeight: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                placeholder="Current weight"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Weight (lbs) *
              </label>
              <input
                type="number"
                value={goals.targetWeight || ''}
                onChange={(e) => setGoals({...goals, targetWeight: parseInt(e.target.value)})}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white ${
                  errors.targetWeight ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Target weight"
              />
              {errors.targetWeight && <p className="text-red-500 text-sm mt-1">{errors.targetWeight}</p>}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            What's your timeframe? *
          </label>
          <div className="space-y-2">
            {[
              { 
                value: 'aggressive', 
                label: 'Aggressive (3 months)', 
                desc: 'Fast results, requires strict adherence',
                rate: '2-3 lbs/week'
              },
              { 
                value: 'moderate', 
                label: 'Moderate (6 months)', 
                desc: 'Balanced approach, sustainable',
                rate: '1-2 lbs/week'
              },
              { 
                value: 'gradual', 
                label: 'Gradual (1 year)', 
                desc: 'Slow and steady, lifestyle focused',
                rate: '0.5-1 lb/week'
              }
            ].map(timeframe => (
              <button
                key={timeframe.value}
                type="button"
                onClick={() => setGoals({...goals, timeframe: timeframe.value})}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  goals.timeframe === timeframe.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{timeframe.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{timeframe.desc}</div>
                  </div>
                  {goals.primaryGoal === 'weight_loss' && (
                    <div className="text-sm text-primary-600 font-medium">{timeframe.rate}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
          {errors.timeframe && <p className="text-red-500 text-sm mt-1">{errors.timeframe}</p>}
        </div>

        {/* Goal Summary */}
        {goals.primaryGoal && goals.targetWeight && goals.timeframe && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Your Goal Summary</h3>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <p>Primary Goal: <span className="font-medium capitalize">{goals.primaryGoal.replace('_', ' ')}</span></p>
              {goals.currentWeight && goals.targetWeight && (
                <p>
                  Weight Change: <span className="font-medium">
                    {Math.abs(goals.targetWeight - goals.currentWeight)} lbs ({calculateWeeklyWeightChange().toFixed(1)} lbs/week)
                  </span>
                </p>
              )}
              {getRecommendedCalories() && (
                <p>Recommended Daily Calories: <span className="font-medium">{getRecommendedCalories()}</span></p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={prevStep}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

// Permissions Step
export const PermissionsStep: React.FC<any> = ({ preferences, setPreferences, nextStep, prevStep }) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    notifications: false,
    location: false
  })

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
      setPermissions(prev => ({ ...prev, camera: true }))
      setPreferences({ ...preferences, cameraEnabled: true })
    } catch (error) {
      console.error('Camera permission denied:', error)
      alert('Camera access was denied. You can enable it later in settings.')
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      setPermissions(prev => ({ ...prev, notifications: granted }))
      setPreferences({ ...preferences, notificationsEnabled: granted })
    }
  }

  const requestLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })
        setPermissions(prev => ({ ...prev, location: true }))
        setPreferences({ ...preferences, locationEnabled: true })
      } catch (error) {
        console.error('Location permission denied:', error)
        alert('Location access was denied. You can enable it later in settings.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">App Permissions</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enable these features for the best experience. You can change these later in settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Camera Permission */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Camera Access</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Take photos of your meals for better tracking and visual progress records.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Camera Tutorial</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span>Tap the camera button when logging meals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Photos are stored locally and never shared</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Review your food choices visually over time</span>
                  </div>
                </div>
              </div>

              <button
                onClick={requestCameraPermission}
                disabled={permissions.camera}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  permissions.camera
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {permissions.camera ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Enable Camera
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Permission */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Bell className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get reminders to log meals, workouts, and celebrate your achievements.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">Meal Reminders</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    "Don't forget to log your lunch!"
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-sm">Achievements</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    "Congratulations on your 7-day streak!"
                  </p>
                </div>
              </div>

              <button
                onClick={requestNotificationPermission}
                disabled={permissions.notifications}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  permissions.notifications
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {permissions.notifications ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Enable Notifications
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Location Permission (Optional) */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 opacity-75">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Location <span className="text-sm text-gray-500">(Optional)</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Find nearby restaurants and gyms, track outdoor workouts.
              </p>

              <button
                onClick={requestLocationPermission}
                disabled={permissions.location}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  permissions.location
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {permissions.location ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    Enable Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Privacy Note</p>
            <p>All your data stays on your device. We never share your personal information or photos with third parties.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        <button
          onClick={nextStep}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Feature Tour Step
export const FeatureTourStep: React.FC<any> = ({ nextStep, prevStep }) => {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const features = [
    {
      title: 'Nutrition Tracking',
      icon: Utensils,
      description: 'Log your meals and track macronutrients with ease',
      demo: 'Tap the + button → Select "Log Meal" → Add foods → Track your progress',
      tips: [
        'Use the camera to quickly identify foods',
        'Save frequently eaten meals as favorites',
        'Set macro targets based on your goals'
      ]
    },
    {
      title: 'Workout Logging',
      icon: Activity,
      description: 'Record your exercises and track your fitness progress',
      demo: 'Tap Workouts → Start New → Choose exercises → Log sets and reps',
      tips: [
        'Pre-built workout templates save time',
        'Track weights and see your strength progress',
        'Log cardio with time and distance'
      ]
    },
    {
      title: 'Progress Analytics',
      icon: BarChart3,
      description: 'Visualize your journey with detailed charts and insights',
      demo: 'Go to Analytics → View trends → Analyze patterns → Celebrate progress',
      tips: [
        'Weekly and monthly trend analysis',
        'Compare different time periods',
        'Export data for your trainer'
      ]
    },
    {
      title: 'Smart Reminders',
      icon: Bell,
      description: 'Stay consistent with personalized notifications',
      demo: 'Settings → Notifications → Customize your reminder schedule',
      tips: [
        'Meal reminders at your usual eating times',
        'Workout reminders for rest days',
        'Weekly progress check-ins'
      ]
    }
  ]

  const currentFeatureData = features[currentFeature]
  const FeatureIcon = currentFeatureData.icon

  const nextFeature = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1)
    }
  }

  const prevFeature = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1)
    }
  }

  const toggleDemo = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Feature Tour</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover the key features that will help you succeed
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="flex justify-center space-x-2 mb-8">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentFeature(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentFeature
                ? 'bg-primary-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Current Feature */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FeatureIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {currentFeatureData.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {currentFeatureData.description}
          </p>
        </div>

        {/* Demo Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Quick Demo</h4>
            <button
              onClick={toggleDemo}
              className="flex items-center gap-2 px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Play
                </>
              )}
            </button>
          </div>
          
          <div className={`text-sm text-gray-700 dark:text-gray-300 ${isPlaying ? 'animate-pulse' : ''}`}>
            {currentFeatureData.demo}
          </div>
        </div>

        {/* Tips */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pro Tips</h4>
          <div className="space-y-2">
            {currentFeatureData.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevFeature}
          disabled={currentFeature === 0}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous Feature
        </button>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentFeature + 1} of {features.length}
        </span>

        <button
          onClick={currentFeature === features.length - 1 ? nextStep : nextFeature}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          {currentFeature === features.length - 1 ? 'Finish Tour' : 'Next Feature'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        <button
          onClick={nextStep}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Skip Tour
        </button>
      </div>
    </div>
  )
}

// Completion Step
export const CompletionStep: React.FC<any> = ({ completeOnboarding, isComplete }) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleComplete = async () => {
    setIsLoading(true)
    await completeOnboarding()
    setIsLoading(false)
  }

  if (isComplete) {
    return (
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to FitTracker!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            You're all set up and ready to start your fitness journey. 
            Remember, consistency is key to achieving your goals!
          </p>
        </div>

        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">What's Next?</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary-600" />
              <span>Log your first meal</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-600" />
              <span>Record today's workout</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary-600" />
              <span>Track your wellness metrics</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Start Using FitTracker
        </button>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto">
        <Trophy className="h-12 w-12 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          You're Ready to Start!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Great job completing the setup! We've personalized FitTracker based on your 
          preferences and goals. Let's begin your fitness journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Profile Complete</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your personal information and goals are set up
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <Zap className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Features Enabled</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Permissions configured for the best experience
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <Target className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Goals Set</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personalized recommendations ready
          </p>
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={isLoading}
        className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Setting up...
          </>
        ) : (
          <>
            Complete Setup
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>
    </div>
  )
}