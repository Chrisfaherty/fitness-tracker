import React, { useState, useEffect } from 'react'
import {
  User, Target, Camera, Smartphone, ArrowRight, ArrowLeft,
  CheckCircle, Calendar, Scale, Activity, Utensils, Heart,
  Trophy, Bell, Star, ChevronRight, Play, Pause
} from 'lucide-react'
import useFitnessStore from '../../store/fitnessStore'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<any>
  icon: React.ComponentType<any>
  isComplete: boolean
}

interface UserProfile {
  name: string
  age: number
  height: number
  weight: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  gender: 'male' | 'female' | 'other'
  primaryGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic_performance'
}

const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({})
  const [goals, setGoals] = useState<any>({})
  const [preferences, setPreferences] = useState<any>({})
  const [isComplete, setIsComplete] = useState(false)
  const { updateUserProfile, setGoals: setStoreGoals, updateSettings } = useFitnessStore()

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to FitTracker',
      description: 'Let\'s get you started on your fitness journey',
      component: WelcomeStep,
      icon: Star,
      isComplete: false
    },
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Tell us about yourself for personalized recommendations',
      component: PersonalInfoStep,
      icon: User,
      isComplete: false
    },
    {
      id: 'goals',
      title: 'Set Your Goals',
      description: 'Define what you want to achieve',
      component: GoalsStep,
      icon: Target,
      isComplete: false
    },
    {
      id: 'permissions',
      title: 'App Permissions',
      description: 'Enable features for the best experience',
      component: PermissionsStep,
      icon: Camera,
      isComplete: false
    },
    {
      id: 'features',
      title: 'Feature Tour',
      description: 'Discover what FitTracker can do for you',
      component: FeatureTourStep,
      icon: Smartphone,
      isComplete: false
    },
    {
      id: 'complete',
      title: 'Ready to Start!',
      description: 'You\'re all set up and ready to begin',
      component: CompletionStep,
      icon: Trophy,
      isComplete: false
    }
  ]

  const [stepStates, setStepStates] = useState(steps)

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as complete
      const newStepStates = [...stepStates]
      newStepStates[currentStep].isComplete = true
      setStepStates(newStepStates)
      
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    try {
      // Save user profile
      if (Object.keys(userProfile).length > 0) {
        await updateUserProfile(userProfile as UserProfile)
      }

      // Save goals
      if (Object.keys(goals).length > 0) {
        await setStoreGoals(goals)
      }

      // Save preferences
      if (Object.keys(preferences).length > 0) {
        await updateSettings(preferences)
      }

      // Mark onboarding as complete
      await updateSettings({ onboardingComplete: true })
      
      setIsComplete(true)
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const CurrentStepComponent = steps[currentStep]?.component || WelcomeStep

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      {/* Progress Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Getting Started</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = step.isComplete || index < currentStep
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isCompleted 
                      ? 'bg-green-100 border-green-500 text-green-600' 
                      : isActive
                        ? 'bg-primary-100 border-primary-500 text-primary-600'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 text-center ${
                    isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          <CurrentStepComponent
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            goals={goals}
            setGoals={setGoals}
            preferences={preferences}
            setPreferences={setPreferences}
            nextStep={nextStep}
            prevStep={prevStep}
            currentStep={currentStep}
            totalSteps={steps.length}
            completeOnboarding={completeOnboarding}
            isComplete={isComplete}
          />
        </div>
      </div>
    </div>
  )
}

// Welcome Step Component
const WelcomeStep: React.FC<any> = ({ nextStep }) => {
  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto">
        <Trophy className="h-12 w-12 text-white" />
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to FitTracker
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your personal fitness companion that helps you track nutrition, workouts, and wellness 
          all in one place. Let's set you up for success!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="text-center p-4">
          <Utensils className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Nutrition Tracking</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Log meals and track macros</p>
        </div>
        <div className="text-center p-4">
          <Activity className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Workout Logging</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Record your exercises</p>
        </div>
        <div className="text-center p-4">
          <Heart className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Wellness Monitoring</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track sleep and stress</p>
        </div>
      </div>

      <button
        onClick={nextStep}
        className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
      >
        Get Started
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  )
}

// Personal Info Step Component
const PersonalInfoStep: React.FC<any> = ({ userProfile, setUserProfile, nextStep, prevStep }) => {
  const [errors, setErrors] = useState<any>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: any = {}
    if (!userProfile.name) newErrors.name = 'Name is required'
    if (!userProfile.age || userProfile.age < 13) newErrors.age = 'Please enter a valid age (13+)'
    if (!userProfile.height || userProfile.height < 36) newErrors.height = 'Please enter a valid height'
    if (!userProfile.weight || userProfile.weight < 50) newErrors.weight = 'Please enter a valid weight'
    if (!userProfile.gender) newErrors.gender = 'Please select your gender'
    if (!userProfile.activityLevel) newErrors.activityLevel = 'Please select your activity level'

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      nextStep()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personal Information</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us provide personalized recommendations and accurate calculations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={userProfile.name || ''}
              onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age *
            </label>
            <input
              type="number"
              value={userProfile.age || ''}
              onChange={(e) => setUserProfile({...userProfile, age: parseInt(e.target.value)})}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.age ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your age"
              min="13"
              max="120"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height (inches) *
            </label>
            <input
              type="number"
              value={userProfile.height || ''}
              onChange={(e) => setUserProfile({...userProfile, height: parseInt(e.target.value)})}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.height ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Height in inches"
              min="36"
              max="96"
            />
            {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (lbs) *
            </label>
            <input
              type="number"
              value={userProfile.weight || ''}
              onChange={(e) => setUserProfile({...userProfile, weight: parseInt(e.target.value)})}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Current weight"
              min="50"
              max="1000"
            />
            {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {['male', 'female', 'other'].map(gender => (
              <button
                key={gender}
                type="button"
                onClick={() => setUserProfile({...userProfile, gender: gender as any})}
                className={`p-3 border rounded-lg text-center capitalize transition-colors ${
                  userProfile.gender === gender
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Activity Level *
          </label>
          <div className="space-y-2">
            {[
              { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
              { value: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
              { value: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
              { value: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
              { value: 'very_active', label: 'Extremely Active', desc: 'Very hard exercise, physical job' }
            ].map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => setUserProfile({...userProfile, activityLevel: level.value as any})}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  userProfile.activityLevel === level.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-300'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{level.desc}</div>
              </button>
            ))}
          </div>
          {errors.activityLevel && <p className="text-red-500 text-sm mt-1">{errors.activityLevel}</p>}
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

export default OnboardingWizard