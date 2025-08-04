import React, { useState, useEffect } from 'react'
import {
  Trophy, Star, Zap, Target, TrendingUp, Calendar, 
  Award, Medal, Crown, Sparkles, Flame, Heart,
  X, Share2, Download, Camera, PartyPopper
} from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  badge: string
  points: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  category: string
  unlockedAt: string
}

interface Milestone {
  id: string
  type: string
  title: string
  description: string
  value: number
  badge: string
}

interface CelebrationProps {
  achievement?: Achievement
  milestone?: Milestone
  type: 'achievement' | 'milestone' | 'streak' | 'goal'
  onClose: () => void
  onShare?: () => void
}

const ProgressCelebration: React.FC = () => {
  const [activeNotifications, setActiveNotifications] = useState<any[]>([])
  const [currentCelebration, setCurrentCelebration] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Listen for achievement celebrations
    const handleAchievementCelebration = (event: CustomEvent) => {
      const { achievement } = event.detail
      showCelebration({
        type: 'achievement',
        data: achievement,
        duration: getRarityDuration(achievement.rarity)
      })
    }

    // Listen for milestone celebrations
    const handleMilestoneCelebration = (event: CustomEvent) => {
      const { milestone } = event.detail
      showCelebration({
        type: 'milestone',
        data: milestone,
        duration: 5000
      })
    }

    // Listen for streak celebrations
    const handleStreakCelebration = (event: CustomEvent) => {
      const { streak } = event.detail
      showCelebration({
        type: 'streak',
        data: streak,
        duration: 4000
      })
    }

    // Listen for in-app notifications
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail
      addNotification(notification)
    }

    window.addEventListener('achievement-celebration', handleAchievementCelebration)
    window.addEventListener('milestone-achieved', handleMilestoneCelebration)
    window.addEventListener('streak-updated', handleStreakCelebration)
    window.addEventListener('fitness-notification', handleNotification)

    return () => {
      window.removeEventListener('achievement-celebration', handleAchievementCelebration)
      window.removeEventListener('milestone-achieved', handleMilestoneCelebration)
      window.removeEventListener('streak-updated', handleStreakCelebration)
      window.removeEventListener('fitness-notification', handleNotification)
    }
  }, [])

  const getRarityDuration = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 8000
      case 'epic': return 6000
      case 'rare': return 5000
      case 'uncommon': return 4000
      default: return 3000
    }
  }

  const showCelebration = (celebration: any) => {
    setCurrentCelebration(celebration)
    setShowConfetti(true)

    // Auto-hide after duration
    setTimeout(() => {
      setCurrentCelebration(null)
      setShowConfetti(false)
    }, celebration.duration)
  }

  const addNotification = (notification: any) => {
    const id = Date.now() + Math.random()
    const newNotification = { ...notification, id }
    
    setActiveNotifications(prev => [...prev, newNotification])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  const removeNotification = (id: number) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id))
  }

  const closeCelebration = () => {
    setCurrentCelebration(null)
    setShowConfetti(false)
  }

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && <ConfettiEffect />}

      {/* Main Celebration Modal */}
      {currentCelebration && (
        <CelebrationModal
          {...currentCelebration}
          onClose={closeCelebration}
        />
      )}

      {/* In-App Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {activeNotifications.map(notification => (
          <InAppNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </>
  )
}

// Celebration Modal Component
const CelebrationModal: React.FC<{
  type: string
  data: any
  onClose: () => void
}> = ({ type, data, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    setTimeout(() => setIsAnimating(false), 1000)
  }, [])

  const getCelebrationConfig = () => {
    switch (type) {
      case 'achievement':
        return {
          title: `Achievement Unlocked!`,
          subtitle: data.title,
          description: data.description,
          badge: data.badge,
          points: data.points,
          color: getRarityColor(data.rarity),
          bgGradient: getRarityGradient(data.rarity),
          icon: Trophy,
          celebration: '🎉'
        }
      case 'milestone':
        return {
          title: 'Milestone Reached!',
          subtitle: data.title,
          description: data.message,
          badge: data.badge,
          points: null,
          color: '#f59e0b',
          bgGradient: 'from-yellow-400 to-orange-500',
          icon: Target,
          celebration: '🌟'
        }
      case 'streak':
        return {
          title: 'Streak Milestone!',
          subtitle: `${data.currentStreak} Day Streak`,
          description: `Keep up the ${data.name.toLowerCase()}!`,
          badge: data.icon,
          points: null,
          color: '#ef4444',
          bgGradient: 'from-red-400 to-pink-500',
          icon: Flame,
          celebration: '🔥'
        }
      default:
        return {
          title: 'Congratulations!',
          subtitle: 'Great Progress',
          description: 'Keep up the amazing work!',
          badge: '🎉',
          points: null,
          color: '#6366f1',
          bgGradient: 'from-indigo-400 to-purple-500',
          icon: Star,
          celebration: '✨'
        }
    }
  }

  const config = getCelebrationConfig()
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`relative max-w-md w-full mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-1000 ${
          isAnimating ? 'scale-0 rotate-12' : 'scale-100 rotate-0'
        }`}
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-10`} />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Celebration Icon */}
          <div className="mb-6 relative">
            <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${config.bgGradient} rounded-full flex items-center justify-center shadow-lg transform ${
              isAnimating ? 'animate-bounce' : ''
            }`}>
              <Icon className="h-10 w-10 text-white" />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -top-2 -right-2 text-4xl animate-pulse">
              {config.badge}
            </div>

            {/* Celebration Emojis */}
            <div className="absolute -top-4 -left-4 text-2xl animate-bounce">
              {config.celebration}
            </div>
            <div className="absolute -bottom-2 -right-4 text-2xl animate-bounce delay-300">
              {config.celebration}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {config.title}
          </h2>

          {/* Subtitle */}
          <h3 className="text-xl font-semibold mb-4" style={{ color: config.color }}>
            {config.subtitle}
          </h3>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {config.description}
          </p>

          {/* Points */}
          {config.points && (
            <div className="mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${config.bgGradient} rounded-full text-white font-semibold`}>
                <Star className="h-4 w-4" />
                {config.points} Points Earned
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Continue
            </button>
            
            <button className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        {/* Sparkle Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <Sparkles
              key={i}
              className={`absolute w-4 h-4 text-yellow-400 animate-ping opacity-75`}
              style={{
                top: `${20 + (i * 15)}%`,
                left: `${10 + (i * 15)}%`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// In-App Notification Component
const InAppNotification: React.FC<{
  notification: any
  onClose: () => void
}> = ({ notification, onClose }) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'achievement': return Trophy
      case 'milestone': return Target
      case 'streak': return Flame
      case 'reminder': return Calendar
      case 'motivation': return Heart
      default: return Star
    }
  }

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'achievement': return 'from-yellow-400 to-orange-500'
      case 'milestone': return 'from-blue-400 to-purple-500'
      case 'streak': return 'from-red-400 to-pink-500'
      case 'reminder': return 'from-green-400 to-teal-500'
      case 'motivation': return 'from-pink-400 to-rose-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const Icon = getNotificationIcon()

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80 transform transition-all duration-300 hover:shadow-xl">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getNotificationColor()} flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                FitTracker
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {notification.message}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {notification.type === 'achievement' && notification.data?.points && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                <Star className="h-3 w-3" />
                +{notification.data.points} points
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Confetti Effect Component
const ConfettiEffect: React.FC = () => {
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316']
  
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 opacity-80"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animation: `confetti-fall ${2 + Math.random() * 3}s linear forwards`,
            animationDelay: `${Math.random() * 3}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Helper functions
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return '#fbbf24'
    case 'epic': return '#8b5cf6'
    case 'rare': return '#3b82f6'
    case 'uncommon': return '#10b981'
    default: return '#6b7280'
  }
}

const getRarityGradient = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'from-yellow-400 to-orange-500'
    case 'epic': return 'from-purple-400 to-pink-500'
    case 'rare': return 'from-blue-400 to-indigo-500'
    case 'uncommon': return 'from-green-400 to-teal-500'
    default: return 'from-gray-400 to-gray-500'
  }
}

export default ProgressCelebration