import React, { useState, useEffect } from 'react'
import {
  Trophy, Flame, Star, Target, TrendingUp, Calendar, Award,
  Bell, Clock, Zap, Heart, Medal, Crown, Sparkles, CheckCircle,
  BarChart3, Users, Gift, PartyPopper, Settings, RefreshCw
} from 'lucide-react'
import { notificationService } from '../../services/notificationService'
import { streakTrackingService } from '../../services/streakTrackingService'
import { achievementService } from '../../services/achievementService'

interface EngagementStats {
  currentStreak: number
  longestStreak: number
  totalAchievements: number
  unlockedAchievements: number
  totalPoints: number
  notificationsSent: number
}

const EngagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'streaks' | 'achievements' | 'notifications'>('overview')
  const [engagementStats, setEngagementStats] = useState<EngagementStats | null>(null)
  const [streaks, setStreaks] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEngagementData()
    
    // Listen for updates
    window.addEventListener('streak-updated', loadEngagementData)
    window.addEventListener('achievement-unlocked', loadEngagementData)
    
    return () => {
      window.removeEventListener('streak-updated', loadEngagementData)
      window.removeEventListener('achievement-unlocked', loadEngagementData)
    }
  }, [])

  const loadEngagementData = async () => {
    setLoading(true)
    try {
      // Load engagement stats
      const notificationStats = notificationService.getEngagementStats()
      const streakStats = streakTrackingService.getStreakStats()
      const achievementStats = achievementService.getAchievementStats()

      setEngagementStats({
        currentStreak: notificationStats.currentStreak,
        longestStreak: notificationStats.longestStreak,
        totalAchievements: achievementStats.total,
        unlockedAchievements: achievementStats.unlocked,
        totalPoints: achievementStats.totalPoints,
        notificationsSent: notificationStats.notificationsSent
      })

      // Load streaks
      setStreaks(streakTrackingService.getAllStreaks())

      // Load achievements
      setAchievements(achievementService.getAllAchievements())
      setCategories(achievementService.getCategories())

      // Load recent activity
      const recentStreaks = streakTrackingService.getStreakHistory(null, 10)
      const recentAchievements = achievementService.getUnlockedAchievements()
        .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
        .slice(0, 10)

      const combined = [
        ...recentStreaks.map(s => ({ ...s, type: 'streak' })),
        ...recentAchievements.map(a => ({ ...a, type: 'achievement' }))
      ].sort((a, b) => new Date(b.timestamp || b.unlockedAt).getTime() - new Date(a.timestamp || a.unlockedAt).getTime())

      setRecentActivity(combined.slice(0, 10))

    } catch (error) {
      console.error('Failed to load engagement data:', error)
    } finally {
      setLoading(false)
    }
  }

  const testNotification = () => {
    notificationService.testNotification()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Engagement Center</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your streaks, achievements, and progress milestones
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadEngagementData}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={testNotification}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Test Notification
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {engagementStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Current Streak</h3>
                <p className="text-2xl font-bold text-red-600">{engagementStats.currentStreak}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Longest: {engagementStats.longestStreak} days
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Achievements</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {engagementStats.unlockedAchievements}/{engagementStats.totalAchievements}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(engagementStats.unlockedAchievements / engagementStats.totalAchievements) * 100}%` 
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Total Points</h3>
                <p className="text-2xl font-bold text-purple-600">{engagementStats.totalPoints}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Points earned from achievements
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                <p className="text-2xl font-bold text-blue-600">{engagementStats.notificationsSent}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Motivational reminders sent
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'streaks', label: 'Streaks', icon: Flame },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'notifications', label: 'Notifications', icon: Bell }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Recent Activity
              </h3>
              
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent activity. Start logging to see your progress!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {activity.type === 'achievement' ? (
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <Flame className="h-5 w-5 text-red-600" />
                      )}
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {activity.type === 'achievement' ? activity.title : `${activity.type} milestone`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.type === 'achievement' 
                            ? activity.description 
                            : `${activity.event} - ${activity.milestone || activity.newStreak} days`
                          }
                        </p>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.unlockedAt || activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Active Streaks</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {streaks.filter(s => s.isActive).length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Achievement Categories</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {categories.length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {engagementStats ? Math.round((engagementStats.unlockedAchievements / engagementStats.totalAchievements) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'streaks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {streaks.map(streak => (
              <div 
                key={streak.type} 
                className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-6 transition-all ${
                  streak.isActive 
                    ? 'border-red-500 shadow-lg shadow-red-500/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: streak.color + '20' }}
                  >
                    {streak.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{streak.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{streak.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Current</span>
                    <span className="font-bold text-2xl" style={{ color: streak.color }}>
                      {streak.currentStreak}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Best</span>
                    <span className="font-medium">{streak.longestStreak}</span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {streak.requirement}
                  </p>
                </div>

                {streak.isActive && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 font-medium">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm">Active!</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {/* Achievement Categories */}
            {categories.map(category => (
              <div key={category.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {category.unlockedCount}/{category.achievements.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {category.totalPoints} total points
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements
                    .filter(a => a.category === category.id)
                    .map(achievement => (
                      <div 
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          achievement.unlocked
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl">
                            {achievement.unlocked ? achievement.badge : '🔒'}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${
                              achievement.unlocked 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {achievement.title}
                            </h4>
                            <p className={`text-sm ${
                              achievement.unlocked 
                                ? 'text-gray-600 dark:text-gray-300' 
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {achievement.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            achievement.rarity === 'uncommon' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {achievement.rarity}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-sm font-medium">{achievement.points}</span>
                          </div>
                        </div>

                        {!achievement.unlocked && achievement.progress > 0 && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${achievement.progress * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {Math.round(achievement.progress * 100)}% complete
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notification Settings
            </h3>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Manage your notification preferences and engagement features.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-200">Notification Status</h4>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Permission: {engagementStats?.notificationsSent ? 'Granted' : 'Not granted'}
                  <br />
                  Total sent: {engagementStats?.notificationsSent || 0} notifications
                </p>
              </div>

              <button
                onClick={testNotification}
                className="w-full bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Send Test Notification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EngagementDashboard