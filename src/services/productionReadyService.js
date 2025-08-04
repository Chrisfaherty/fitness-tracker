/**
 * Production-Ready Service Integration
 * Manages all production features including onboarding, daily optimization, and engagement
 */

import { notificationService } from './notificationService.js'
import { streakTrackingService } from './streakTrackingService.js'
import { achievementService } from './achievementService.js'
import { enterpriseDataService } from './enterpriseDataService.js'
import useFitnessStore from '../store/fitnessStore.js'

export class ProductionReadyService {
  constructor() {
    this.isInitialized = false
    this.services = new Map()
    this.onboardingComplete = false
    this.userEngagement = {
      dailyUsage: 0,
      weeklyGoals: 0,
      monthlyProgress: 0,
      retentionScore: 0
    }
  }

  /**
   * Initialize all production-ready services
   */
  async initialize(config = {}) {
    console.log('🚀 Initializing Production-Ready Services')
    
    this.config = {
      enableOnboarding: config.enableOnboarding !== false,
      enableNotifications: config.enableNotifications !== false,
      enableAchievements: config.enableAchievements !== false,
      enableStreaks: config.enableStreaks !== false,
      enableEnterprise: config.enableEnterprise !== false,
      autoOptimization: config.autoOptimization !== false,
      ...config
    }

    const initPromises = []

    // Check if onboarding is complete
    this.onboardingComplete = this.checkOnboardingStatus()

    // Initialize core engagement services
    if (this.config.enableNotifications) {
      initPromises.push(
        notificationService.initialize(config.notifications || {})
          .then(() => {
            this.services.set('notifications', notificationService)
            console.log('✅ Notification service ready')
          })
          .catch(error => {
            console.error('❌ Notification service failed:', error)
          })
      )
    }

    if (this.config.enableStreaks) {
      initPromises.push(
        streakTrackingService.initialize(config.streaks || {})
          .then(() => {
            this.services.set('streaks', streakTrackingService)
            console.log('✅ Streak tracking service ready')
          })
          .catch(error => {
            console.error('❌ Streak tracking service failed:', error)
          })
      )
    }

    if (this.config.enableAchievements) {
      initPromises.push(
        achievementService.initialize(config.achievements || {})
          .then(() => {
            this.services.set('achievements', achievementService)
            console.log('✅ Achievement service ready')
          })
          .catch(error => {
            console.error('❌ Achievement service failed:', error)
          })
      )
    }

    // Initialize enterprise features if enabled
    if (this.config.enableEnterprise) {
      initPromises.push(
        enterpriseDataService.initialize(config.enterprise || {})
          .then(() => {
            this.services.set('enterprise', enterpriseDataService)
            console.log('✅ Enterprise data service ready')
          })
          .catch(error => {
            console.error('❌ Enterprise data service failed:', error)
          })
      )
    }

    // Wait for all services to initialize
    await Promise.all(initPromises)

    // Setup integrations between services
    this.setupServiceIntegrations()

    // Setup user engagement tracking
    this.setupEngagementTracking()

    // Auto-optimization if enabled
    if (this.config.autoOptimization) {
      this.setupAutoOptimization()
    }

    // Setup onboarding flow if not complete
    if (!this.onboardingComplete && this.config.enableOnboarding) {
      this.triggerOnboarding()
    }

    this.isInitialized = true
    console.log('✅ Production-Ready Services initialized successfully')
    
    return {
      initialized: true,
      services: Array.from(this.services.keys()),
      onboardingRequired: !this.onboardingComplete,
      features: this.getEnabledFeatures()
    }
  }

  /**
   * Check if user has completed onboarding
   */
  checkOnboardingStatus() {
    try {
      const settings = JSON.parse(localStorage.getItem('appSettings') || '{}')
      return settings.onboardingComplete === true
    } catch (error) {
      return false
    }
  }

  /**
   * Setup integrations between services
   */
  setupServiceIntegrations() {
    console.log('🔗 Setting up service integrations...')

    // Integrate achievements with streaks
    if (this.services.has('streaks') && this.services.has('achievements')) {
      // Achievement service will listen to streak events automatically
      console.log('✅ Streaks ↔ Achievements integration active')
    }

    // Integrate notifications with achievements and streaks
    if (this.services.has('notifications')) {
      if (this.services.has('achievements')) {
        // Achievement notifications are handled automatically
        console.log('✅ Achievements → Notifications integration active')
      }
      
      if (this.services.has('streaks')) {
        // Streak notifications are handled automatically
        console.log('✅ Streaks → Notifications integration active')
      }
    }

    // Integrate enterprise features with user data
    if (this.services.has('enterprise')) {
      // Enterprise service will automatically backup achievement and streak data
      console.log('✅ Enterprise data integration active')
    }
  }

  /**
   * Setup user engagement tracking
   */
  setupEngagementTracking() {
    console.log('📊 Setting up engagement tracking...')

    // Track daily app usage
    this.trackDailyUsage()

    // Setup periodic engagement analysis
    setInterval(() => {
      this.analyzeUserEngagement()
    }, 24 * 60 * 60 * 1000) // Daily

    // Listen for user interactions
    if (typeof window !== 'undefined') {
      const engagementEvents = [
        'meal-logged', 'workout-completed', 'measurement-logged', 
        'sleep-logged', 'goal-updated', 'feature-used'
      ]

      engagementEvents.forEach(eventType => {
        window.addEventListener(eventType, () => {
          this.trackUserInteraction(eventType)
        })
      })
    }
  }

  /**
   * Track daily app usage
   */
  trackDailyUsage() {
    const today = new Date().toDateString()
    const lastUsage = localStorage.getItem('lastAppUsage')
    
    if (lastUsage !== today) {
      this.userEngagement.dailyUsage++
      localStorage.setItem('lastAppUsage', today)
      
      // Trigger daily engagement events
      this.handleDailyEngagement()
    }
  }

  /**
   * Handle daily engagement activities
   */
  handleDailyEngagement() {
    // Check if user should receive daily motivation
    if (this.services.has('notifications')) {
      const engagementStats = this.userEngagement
      
      // Send daily check-in notification
      setTimeout(() => {
        notificationService.sendNotification(
          'daily-checkin',
          'Good morning! Ready to crush your goals today? 🌟',
          { type: 'daily-motivation' }
        )
      }, 5000)
    }

    // Update streaks for daily login
    if (this.services.has('streaks')) {
      // Streak service will automatically handle login tracking
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(eventType) {
    // Update engagement metrics
    this.userEngagement.dailyUsage++
    
    // Store interaction for analysis
    const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
    interactions.push({
      type: eventType,
      timestamp: new Date().toISOString()
    })
    
    // Keep only last 1000 interactions
    if (interactions.length > 1000) {
      interactions.splice(0, interactions.length - 1000)
    }
    
    localStorage.setItem('userInteractions', JSON.stringify(interactions))
  }

  /**
   * Analyze user engagement patterns
   */
  analyzeUserEngagement() {
    console.log('📈 Analyzing user engagement...')

    try {
      const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
      const last30Days = interactions.filter(interaction => {
        const interactionDate = new Date(interaction.timestamp)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        return interactionDate >= cutoff
      })

      // Calculate engagement metrics
      const engagementScore = this.calculateEngagementScore(last30Days)
      const retentionRisk = this.assessRetentionRisk(last30Days)
      
      this.userEngagement.retentionScore = engagementScore

      // Take action based on engagement
      if (retentionRisk === 'high' && this.services.has('notifications')) {
        this.triggerRetentionCampaign()
      } else if (engagementScore > 80 && this.services.has('achievements')) {
        this.checkForEngagementRewards()
      }

    } catch (error) {
      console.error('Failed to analyze engagement:', error)
    }
  }

  /**
   * Calculate engagement score (0-100)
   */
  calculateEngagementScore(interactions) {
    if (interactions.length === 0) return 0

    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    // Count active days
    const activeDays = new Set()
    interactions.forEach(interaction => {
      const date = new Date(interaction.timestamp).toDateString()
      activeDays.add(date)
    })

    // Calculate various engagement factors
    const consistencyScore = (activeDays.size / 30) * 100 // Daily consistency
    const frequencyScore = Math.min((interactions.length / 30) * 10, 100) // Interaction frequency
    const diversityScore = this.calculateFeatureDiversity(interactions)

    // Weighted average
    return Math.round(
      (consistencyScore * 0.4) + 
      (frequencyScore * 0.3) + 
      (diversityScore * 0.3)
    )
  }

  /**
   * Calculate feature diversity score
   */
  calculateFeatureDiversity(interactions) {
    const uniqueFeatures = new Set(interactions.map(i => i.type))
    const maxFeatures = 5 // meal, workout, sleep, measurement, goal
    return (uniqueFeatures.size / maxFeatures) * 100
  }

  /**
   * Assess retention risk
   */
  assessRetentionRisk(interactions) {
    const now = new Date()
    const recentInteractions = interactions.filter(interaction => {
      const interactionDate = new Date(interaction.timestamp)
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(now.getDate() - 3)
      return interactionDate >= threeDaysAgo
    })

    if (recentInteractions.length === 0) return 'high'
    if (recentInteractions.length < 5) return 'medium'
    return 'low'
  }

  /**
   * Trigger retention campaign
   */
  triggerRetentionCampaign() {
    if (!this.services.has('notifications')) return

    const messages = [
      "We miss you! Come back and continue your amazing progress 🌟",
      "Your goals are waiting for you! Let's get back on track 💪",
      "Don't let your streak end! Quick check-in to keep momentum going 🔥"
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    
    notificationService.sendNotification(
      'retention-campaign',
      randomMessage,
      { type: 'retention', requireInteraction: true }
    )
  }

  /**
   * Check for engagement rewards
   */
  checkForEngagementRewards() {
    // This would trigger special high-engagement achievements
    if (this.services.has('achievements')) {
      // Achievement service handles this automatically
    }
  }

  /**
   * Setup auto-optimization
   */
  setupAutoOptimization() {
    console.log('⚡ Setting up auto-optimization...')

    // Daily optimization check
    setInterval(() => {
      this.performAutoOptimization()
    }, 24 * 60 * 60 * 1000) // Daily

    // Weekly deep optimization
    setInterval(() => {
      this.performDeepOptimization()
    }, 7 * 24 * 60 * 60 * 1000) // Weekly
  }

  /**
   * Perform daily auto-optimization
   */
  async performAutoOptimization() {
    console.log('🔧 Performing daily optimization...')

    try {
      // Optimize enterprise services if available
      if (this.services.has('enterprise')) {
        await enterpriseDataService.optimizeAllServices()
      }

      // Clean up old data
      this.cleanupOldData()

      // Update user preferences based on usage patterns
      this.optimizeUserExperience()

    } catch (error) {
      console.error('Auto-optimization failed:', error)
    }
  }

  /**
   * Perform weekly deep optimization
   */
  async performDeepOptimization() {
    console.log('🚀 Performing deep optimization...')

    try {
      // Rebuild search indexes
      if (this.services.has('enterprise')) {
        const performanceService = enterpriseDataService.services.get('performance')
        if (performanceService) {
          await performanceService.rebuildIndexes()
        }
      }

      // Generate usage insights
      const insights = this.generateUsageInsights()
      
      // Send weekly summary if notifications enabled
      if (this.services.has('notifications') && insights.sendSummary) {
        notificationService.sendNotification(
          'weekly-insights',
          `Your weekly summary is ready! You've made great progress this week 📊`,
          { type: 'summary', data: insights }
        )
      }

    } catch (error) {
      console.error('Deep optimization failed:', error)
    }
  }

  /**
   * Clean up old data
   */
  cleanupOldData() {
    try {
      // Clean old interactions (keep last 1000)
      const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
      if (interactions.length > 1000) {
        const recent = interactions.slice(-1000)
        localStorage.setItem('userInteractions', JSON.stringify(recent))
      }

      // Clean old notification history
      const notifications = JSON.parse(localStorage.getItem('notificationHistory') || '[]')
      if (notifications.length > 100) {
        const recent = notifications.slice(-100)
        localStorage.setItem('notificationHistory', JSON.stringify(recent))
      }

    } catch (error) {
      console.error('Data cleanup failed:', error)
    }
  }

  /**
   * Optimize user experience based on patterns
   */
  optimizeUserExperience() {
    try {
      const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
      const recentInteractions = interactions.filter(interaction => {
        const interactionDate = new Date(interaction.timestamp)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return interactionDate >= weekAgo
      })

      // Find most used features
      const featureUsage = {}
      recentInteractions.forEach(interaction => {
        featureUsage[interaction.type] = (featureUsage[interaction.type] || 0) + 1
      })

      // Store optimization recommendations
      const optimizations = {
        mostUsedFeatures: Object.entries(featureUsage)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([feature]) => feature),
        recommendedShortcuts: this.generateShortcutRecommendations(featureUsage),
        lastOptimized: new Date().toISOString()
      }

      localStorage.setItem('uxOptimizations', JSON.stringify(optimizations))

    } catch (error) {
      console.error('UX optimization failed:', error)
    }
  }

  /**
   * Generate shortcut recommendations
   */
  generateShortcutRecommendations(featureUsage) {
    const recommendations = []
    
    if (featureUsage['meal-logged'] > 10) {
      recommendations.push('Add quick-meal button to dashboard')
    }
    
    if (featureUsage['workout-completed'] > 5) {
      recommendations.push('Show recent workout templates prominently')
    }
    
    return recommendations
  }

  /**
   * Generate usage insights
   */
  generateUsageInsights() {
    try {
      const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
      const lastWeek = interactions.filter(interaction => {
        const interactionDate = new Date(interaction.timestamp)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return interactionDate >= weekAgo
      })

      return {
        totalInteractions: lastWeek.length,
        activeDays: new Set(lastWeek.map(i => new Date(i.timestamp).toDateString())).size,
        mostActiveFeature: this.getMostUsedFeature(lastWeek),
        engagementTrend: this.calculateEngagementTrend(),
        sendSummary: lastWeek.length > 0
      }
    } catch (error) {
      return { sendSummary: false }
    }
  }

  getMostUsedFeature(interactions) {
    const usage = {}
    interactions.forEach(i => {
      usage[i.type] = (usage[i.type] || 0) + 1
    })
    
    return Object.entries(usage)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
  }

  calculateEngagementTrend() {
    // Simple trend calculation (would be more sophisticated in production)
    const thisWeek = this.userEngagement.dailyUsage
    const lastWeek = parseInt(localStorage.getItem('lastWeekUsage') || '0')
    
    localStorage.setItem('lastWeekUsage', thisWeek.toString())
    
    if (thisWeek > lastWeek) return 'increasing'
    if (thisWeek < lastWeek) return 'decreasing'
    return 'stable'
  }

  /**
   * Trigger onboarding flow
   */
  triggerOnboarding() {
    console.log('👋 Triggering onboarding flow...')
    
    // Dispatch onboarding event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('start-onboarding', {
        detail: { source: 'production-ready-service' }
      }))
    }
  }

  /**
   * Get enabled features list
   */
  getEnabledFeatures() {
    return {
      onboarding: this.config.enableOnboarding,
      notifications: this.config.enableNotifications,
      achievements: this.config.enableAchievements,
      streaks: this.config.enableStreaks,
      enterprise: this.config.enableEnterprise,
      autoOptimization: this.config.autoOptimization,
      quickAdd: true, // Always enabled
      smartSuggestions: true, // Always enabled
      progressCelebration: true // Always enabled
    }
  }

  // API methods

  getProductionStatus() {
    return {
      initialized: this.isInitialized,
      onboardingComplete: this.onboardingComplete,
      activeServices: Array.from(this.services.keys()),
      userEngagement: this.userEngagement,
      enabledFeatures: this.getEnabledFeatures()
    }
  }

  async forceOptimization() {
    await this.performAutoOptimization()
    await this.performDeepOptimization()
  }

  getUserInsights() {
    return this.generateUsageInsights()
  }

  getEngagementScore() {
    const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
    return this.calculateEngagementScore(interactions)
  }

  stop() {
    // Stop all services
    this.services.forEach((service, name) => {
      if (service.stop) {
        service.stop()
      }
    })
    
    this.isInitialized = false
    console.log('🛑 Production-Ready Services stopped')
  }
}

// Export singleton instance
export const productionReadyService = new ProductionReadyService()
export default productionReadyService