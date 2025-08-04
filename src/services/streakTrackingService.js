/**
 * Streak Tracking Service
 * Tracks user consistency and engagement streaks
 */

import useFitnessStore from '../store/fitnessStore.js'
import { notificationService } from './notificationService.js'

export class StreakTrackingService {
  constructor() {
    this.isInitialized = false
    this.streaks = new Map()
    this.milestones = new Map()
    this.streakHistory = []
    this.settings = {
      trackNutritionStreak: true,
      trackWorkoutStreak: true,
      trackWeighInStreak: true,
      trackOverallStreak: true,
      minimumRequirement: {
        nutrition: 1, // meals per day
        workout: 3, // workouts per week
        weighIn: 1, // weigh-ins per week
        overall: 2 // different activities per day
      }
    }
  }

  /**
   * Initialize streak tracking service
   */
  async initialize(config = {}) {
    console.log('🔥 Initializing Streak Tracking Service')
    
    this.config = {
      updateInterval: config.updateInterval || 86400000, // 24 hours
      streakGracePeriod: config.streakGracePeriod || 2, // days
      celebrationDelay: config.celebrationDelay || 5000, // 5 seconds
      ...config
    }

    // Load saved data
    await this.loadStreakData()
    
    // Initialize streak types
    this.initializeStreakTypes()
    
    // Setup data listeners
    this.setupDataListeners()
    
    // Setup periodic updates
    this.setupPeriodicUpdates()
    
    // Calculate current streaks
    await this.calculateAllStreaks()

    this.isInitialized = true
    console.log('✅ Streak Tracking Service initialized')
    
    return true
  }

  /**
   * Initialize streak types and milestones
   */
  initializeStreakTypes() {
    // Nutrition streak
    this.streaks.set('nutrition', {
      type: 'nutrition',
      name: 'Nutrition Logging',
      description: 'Daily meal logging streak',
      currentStreak: 0,
      longestStreak: 0,
      lastActivity: null,
      isActive: false,
      requirement: 'Log at least 1 meal per day',
      icon: '🍽️',
      color: '#10b981'
    })

    // Workout streak
    this.streaks.set('workout', {
      type: 'workout',
      name: 'Workout Consistency',
      description: 'Weekly workout streak',
      currentStreak: 0,
      longestStreak: 0,
      lastActivity: null,
      isActive: false,
      requirement: 'Complete at least 3 workouts per week',
      icon: '💪',
      color: '#f59e0b'
    })

    // Weigh-in streak
    this.streaks.set('weighIn', {
      type: 'weighIn',
      name: 'Regular Weigh-ins',
      description: 'Weekly weigh-in streak',
      currentStreak: 0,
      longestStreak: 0,
      lastActivity: null,
      isActive: false,
      requirement: 'Weigh in at least once per week',
      icon: '⚖️',
      color: '#8b5cf6'
    })

    // Overall engagement streak
    this.streaks.set('overall', {
      type: 'overall',
      name: 'Daily Engagement',
      description: 'Overall app usage streak',
      currentStreak: 0,
      longestStreak: 0,
      lastActivity: null,
      isActive: false,
      requirement: 'Log any activity daily',
      icon: '🔥',
      color: '#ef4444'
    })

    // Setup milestones
    this.setupMilestones()
  }

  /**
   * Setup milestone definitions
   */
  setupMilestones() {
    const commonMilestones = [
      { days: 3, title: 'Getting Started', message: 'Great start! Keep the momentum going!', badge: '🌱' },
      { days: 7, title: 'One Week Wonder', message: 'A full week of consistency!', badge: '⭐' },
      { days: 14, title: 'Two Week Champion', message: 'Two weeks strong!', badge: '🏅' },
      { days: 30, title: 'Monthly Master', message: 'A full month of dedication!', badge: '🏆' },
      { days: 50, title: 'Halfway Hero', message: '50 days of consistency!', badge: '🎯' },
      { days: 75, title: 'Dedication Dynamo', message: '75 days strong!', badge: '💎' },
      { days: 100, title: 'Century Club', message: '100 days! You\'re unstoppable!', badge: '👑' },
      { days: 150, title: 'Streak Supreme', message: '150 days of excellence!', badge: '🌟' },
      { days: 200, title: 'Bicentennial Beast', message: '200 days! Incredible!', badge: '🔥' },
      { days: 365, title: 'Year-Long Legend', message: 'A full year! You\'re a legend!', badge: '🏛️' }
    ]

    this.streaks.forEach((streak, type) => {
      this.milestones.set(type, [...commonMilestones])
    })
  }

  /**
   * Setup data change listeners
   */
  setupDataListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('meal-logged', () => {
        this.updateStreak('nutrition')
      })

      window.addEventListener('workout-completed', () => {
        this.updateStreak('workout')
      })

      window.addEventListener('measurement-logged', (event) => {
        if (event.detail?.type === 'weight') {
          this.updateStreak('weighIn')
        }
      })

      // Overall engagement listener
      const activities = ['meal-logged', 'workout-completed', 'measurement-logged', 'sleep-logged']
      activities.forEach(activity => {
        window.addEventListener(activity, () => {
          this.updateStreak('overall')
        })
      })
    }
  }

  /**
   * Setup periodic updates
   */
  setupPeriodicUpdates() {
    // Daily streak calculation at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 1, 0, 0) // 12:01 AM

    const timeUntilMidnight = tomorrow.getTime() - now.getTime()

    setTimeout(() => {
      this.calculateAllStreaks()
      
      // Set up daily interval
      setInterval(() => {
        this.calculateAllStreaks()
      }, this.config.updateInterval)
    }, timeUntilMidnight)
  }

  /**
   * Update specific streak
   */
  async updateStreak(streakType) {
    if (!this.streaks.has(streakType)) return

    const streak = this.streaks.get(streakType)
    const today = new Date().toDateString()
    
    // Update last activity
    streak.lastActivity = new Date().toISOString()
    
    // Calculate new streak value
    await this.calculateStreak(streakType)
    
    // Save updated data
    this.saveStreakData()
    
    // Check for milestones
    this.checkMilestones(streakType)
    
    // Dispatch streak update event
    this.dispatchStreakUpdate(streakType, streak)
  }

  /**
   * Calculate all streaks
   */
  async calculateAllStreaks() {
    console.log('🔥 Calculating all streaks...')
    
    for (const streakType of this.streaks.keys()) {
      await this.calculateStreak(streakType)
    }
    
    this.saveStreakData()
    console.log('✅ All streaks calculated')
  }

  /**
   * Calculate specific streak
   */
  async calculateStreak(streakType) {
    const streak = this.streaks.get(streakType)
    if (!streak) return

    const fitnessData = useFitnessStore.getState()
    let streakCount = 0
    let currentDate = new Date()
    
    switch (streakType) {
      case 'nutrition':
        streakCount = this.calculateNutritionStreak(fitnessData)
        break
      case 'workout':
        streakCount = this.calculateWorkoutStreak(fitnessData)
        break
      case 'weighIn':
        streakCount = this.calculateWeighInStreak(fitnessData)
        break
      case 'overall':
        streakCount = this.calculateOverallStreak(fitnessData)
        break
    }

    // Update streak data
    const previousStreak = streak.currentStreak
    streak.currentStreak = streakCount
    streak.isActive = streakCount > 0
    
    if (streakCount > streak.longestStreak) {
      streak.longestStreak = streakCount
    }

    // Check if streak was broken or improved
    if (streakCount > previousStreak) {
      this.handleStreakImprovement(streakType, streakCount, previousStreak)
    } else if (streakCount < previousStreak && previousStreak > 0) {
      this.handleStreakBroken(streakType, previousStreak)
    }
  }

  /**
   * Calculate nutrition streak
   */
  calculateNutritionStreak(fitnessData) {
    if (!fitnessData.nutrition?.meals) return 0

    const meals = fitnessData.nutrition.meals
    const requirement = this.settings.minimumRequirement.nutrition
    let streak = 0
    let currentDate = new Date()

    // Count backwards from today
    while (true) {
      const dateString = currentDate.toDateString()
      const dayMeals = meals.filter(meal => 
        new Date(meal.timestamp).toDateString() === dateString
      )

      if (dayMeals.length >= requirement) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }

      // Prevent infinite loop
      if (streak > 1000) break
    }

    return streak
  }

  /**
   * Calculate workout streak (weekly basis)
   */
  calculateWorkoutStreak(fitnessData) {
    if (!fitnessData.activity?.workouts) return 0

    const workouts = fitnessData.activity.workouts
    const requirement = this.settings.minimumRequirement.workout
    let streak = 0
    let currentWeek = this.getWeekStart(new Date())

    while (true) {
      const weekEnd = new Date(currentWeek)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const weekWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.timestamp)
        return workoutDate >= currentWeek && workoutDate <= weekEnd
      })

      if (weekWorkouts.length >= requirement) {
        streak++
        // Move to previous week
        currentWeek.setDate(currentWeek.getDate() - 7)
      } else {
        break
      }

      // Prevent infinite loop
      if (streak > 200) break
    }

    return streak
  }

  /**
   * Calculate weigh-in streak (weekly basis)
   */
  calculateWeighInStreak(fitnessData) {
    if (!fitnessData.body?.measurements?.weight) return 0

    const measurements = fitnessData.body.measurements.weight
    const requirement = this.settings.minimumRequirement.weighIn
    let streak = 0
    let currentWeek = this.getWeekStart(new Date())

    while (true) {
      const weekEnd = new Date(currentWeek)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const weekMeasurements = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.timestamp)
        return measurementDate >= currentWeek && measurementDate <= weekEnd
      })

      if (weekMeasurements.length >= requirement) {
        streak++
        currentWeek.setDate(currentWeek.getDate() - 7)
      } else {
        break
      }

      if (streak > 200) break
    }

    return streak
  }

  /**
   * Calculate overall engagement streak
   */
  calculateOverallStreak(fitnessData) {
    const requirement = this.settings.minimumRequirement.overall
    let streak = 0
    let currentDate = new Date()

    while (true) {
      const dateString = currentDate.toDateString()
      let dayActivities = 0

      // Count different types of activities for the day
      if (fitnessData.nutrition?.meals) {
        const dayMeals = fitnessData.nutrition.meals.filter(meal => 
          new Date(meal.timestamp).toDateString() === dateString
        )
        if (dayMeals.length > 0) dayActivities++
      }

      if (fitnessData.activity?.workouts) {
        const dayWorkouts = fitnessData.activity.workouts.filter(workout => 
          new Date(workout.timestamp).toDateString() === dateString
        )
        if (dayWorkouts.length > 0) dayActivities++
      }

      if (fitnessData.wellness?.sleepEntries) {
        const daySleep = fitnessData.wellness.sleepEntries.filter(entry => 
          new Date(entry.timestamp).toDateString() === dateString
        )
        if (daySleep.length > 0) dayActivities++
      }

      if (dayActivities >= requirement) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }

      if (streak > 1000) break
    }

    return streak
  }

  /**
   * Handle streak improvement
   */
  handleStreakImprovement(streakType, newStreak, previousStreak) {
    const streak = this.streaks.get(streakType)
    
    // Record streak improvement
    this.streakHistory.push({
      type: streakType,
      event: 'improvement',
      previousStreak,
      newStreak,
      timestamp: new Date().toISOString()
    })

    console.log(`🔥 ${streak.name} streak improved: ${previousStreak} → ${newStreak}`)
  }

  /**
   * Handle streak broken
   */
  handleStreakBroken(streakType, brokenStreak) {
    const streak = this.streaks.get(streakType)
    
    // Record streak break
    this.streakHistory.push({
      type: streakType,
      event: 'broken',
      brokenStreak,
      timestamp: new Date().toISOString()
    })

    console.log(`💔 ${streak.name} streak broken at ${brokenStreak} days`)

    // Send motivational notification
    if (notificationService && brokenStreak >= 7) {
      notificationService.sendNotification(
        `streak-broken-${streakType}`,
        `Don't worry! Your ${brokenStreak}-day ${streak.name.toLowerCase()} streak was amazing. Start a new one today! ${streak.icon}`,
        { type: 'motivation' }
      )
    }
  }

  /**
   * Check for milestone achievements
   */
  checkMilestones(streakType) {
    const streak = this.streaks.get(streakType)
    const milestones = this.milestones.get(streakType) || []
    
    const currentStreak = streak.currentStreak
    const milestone = milestones.find(m => m.days === currentStreak)
    
    if (milestone) {
      this.celebrateMilestone(streakType, milestone)
    }
  }

  /**
   * Celebrate milestone achievement
   */
  celebrateMilestone(streakType, milestone) {
    const streak = this.streaks.get(streakType)
    
    // Record milestone
    this.streakHistory.push({
      type: streakType,
      event: 'milestone',
      milestone: milestone.days,
      title: milestone.title,
      timestamp: new Date().toISOString()
    })

    console.log(`🏆 Milestone achieved: ${milestone.title} for ${streak.name}`)

    // Send celebration notification
    if (notificationService) {
      setTimeout(() => {
        notificationService.sendNotification(
          `milestone-${streakType}-${milestone.days}`,
          `${milestone.badge} ${milestone.title}! ${milestone.message}`,
          { 
            type: 'milestone', 
            requireInteraction: true,
            data: { streakType, milestone, streak: streak.currentStreak }
          }
        )
      }, this.config.celebrationDelay)
    }

    // Dispatch milestone event
    this.dispatchMilestoneEvent(streakType, milestone)
  }

  /**
   * Get week start date (Monday)
   */
  getWeekStart(date) {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    const monday = new Date(date.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  /**
   * Dispatch streak update event
   */
  dispatchStreakUpdate(streakType, streak) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('streak-updated', {
        detail: { type: streakType, streak }
      }))
    }
  }

  /**
   * Dispatch milestone event
   */
  dispatchMilestoneEvent(streakType, milestone) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('milestone-achieved', {
        detail: { type: streakType, milestone }
      }))
    }
  }

  // Data persistence methods

  async loadStreakData() {
    try {
      const saved = localStorage.getItem('streakData')
      if (saved) {
        const data = JSON.parse(saved)
        
        // Restore streak data
        if (data.streaks) {
          Object.entries(data.streaks).forEach(([type, streakData]) => {
            if (this.streaks.has(type)) {
              const streak = this.streaks.get(type)
              Object.assign(streak, streakData)
            }
          })
        }
        
        // Restore history
        if (data.history) {
          this.streakHistory = data.history
        }
      }
    } catch (error) {
      console.error('Failed to load streak data:', error)
    }
  }

  saveStreakData() {
    try {
      const data = {
        streaks: Object.fromEntries(this.streaks),
        history: this.streakHistory.slice(-100), // Keep last 100 entries
        lastUpdated: new Date().toISOString()
      }
      
      localStorage.setItem('streakData', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save streak data:', error)
    }
  }

  // API methods

  getAllStreaks() {
    return Array.from(this.streaks.values())
  }

  getStreak(type) {
    return this.streaks.get(type)
  }

  getStreakHistory(type = null, limit = 50) {
    let history = [...this.streakHistory]
    
    if (type) {
      history = history.filter(entry => entry.type === type)
    }
    
    return history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  getStreakStats() {
    const stats = {
      totalStreaks: this.streaks.size,
      activeStreaks: 0,
      longestOverallStreak: 0,
      totalMilestones: 0,
      streakBreaks: 0
    }

    this.streaks.forEach(streak => {
      if (streak.isActive) stats.activeStreaks++
      if (streak.longestStreak > stats.longestOverallStreak) {
        stats.longestOverallStreak = streak.longestStreak
      }
    })

    stats.totalMilestones = this.streakHistory.filter(h => h.event === 'milestone').length
    stats.streakBreaks = this.streakHistory.filter(h => h.event === 'broken').length

    return stats
  }

  resetStreak(type) {
    const streak = this.streaks.get(type)
    if (streak) {
      streak.currentStreak = 0
      streak.isActive = false
      streak.lastActivity = null
      
      this.saveStreakData()
      this.dispatchStreakUpdate(type, streak)
    }
  }

  stop() {
    this.isInitialized = false
    console.log('🛑 Streak Tracking Service stopped')
  }
}

export const streakTrackingService = new StreakTrackingService()
export default streakTrackingService