/**
 * Achievement System Service
 * Handles badges, milestones, and progress celebrations
 */

import useFitnessStore from '../store/fitnessStore.js'
import { notificationService } from './notificationService.js'
import { streakTrackingService } from './streakTrackingService.js'

export class AchievementService {
  constructor() {
    this.isInitialized = false
    this.achievements = new Map()
    this.userAchievements = new Map()
    this.categories = new Map()
    this.progressTracking = new Map()
    this.celebrationQueue = []
  }

  /**
   * Initialize achievement service
   */
  async initialize(config = {}) {
    console.log('🏆 Initializing Achievement Service')
    
    this.config = {
      enableNotifications: config.enableNotifications !== false,
      celebrationDelay: config.celebrationDelay || 3000,
      maxCelebrationQueue: config.maxCelebrationQueue || 5,
      ...config
    }

    // Load saved data
    await this.loadAchievementData()
    
    // Initialize achievement definitions
    this.initializeAchievements()
    
    // Setup data listeners
    this.setupDataListeners()
    
    // Check for newly unlocked achievements
    await this.checkAllAchievements()

    this.isInitialized = true
    console.log('✅ Achievement Service initialized')
    
    return true
  }

  /**
   * Initialize achievement definitions
   */
  initializeAchievements() {
    // Nutrition achievements
    this.createAchievementCategory('nutrition', {
      name: 'Nutrition Master',
      description: 'Achievements related to meal logging and nutrition tracking',
      icon: '🍽️',
      color: '#10b981'
    })

    this.addAchievement('first-meal', {
      category: 'nutrition',
      title: 'First Bite',
      description: 'Log your first meal',
      badge: '🥄',
      points: 10,
      rarity: 'common',
      condition: (data) => data.nutrition?.meals?.length >= 1
    })

    this.addAchievement('meal-streak-7', {
      category: 'nutrition',
      title: 'Week of Wellness',
      description: 'Log meals for 7 consecutive days',
      badge: '🗓️',
      points: 50,
      rarity: 'uncommon',
      condition: (data) => this.getNutritionStreak() >= 7
    })

    this.addAchievement('meal-streak-30', {
      category: 'nutrition',
      title: 'Monthly Meal Master',
      description: 'Log meals for 30 consecutive days',
      badge: '📅',
      points: 200,
      rarity: 'rare',
      condition: (data) => this.getNutritionStreak() >= 30
    })

    this.addAchievement('macro-perfectionist', {
      category: 'nutrition',
      title: 'Macro Perfectionist',
      description: 'Hit all macro targets for 7 consecutive days',
      badge: '🎯',
      points: 150,
      rarity: 'rare',
      condition: (data) => this.checkMacroPerfection(data, 7)
    })

    this.addAchievement('calorie-counter', {
      category: 'nutrition',
      title: 'Calorie Counter',
      description: 'Log 100 meals',
      badge: '💯',
      points: 100,
      rarity: 'uncommon',
      condition: (data) => data.nutrition?.meals?.length >= 100
    })

    // Workout achievements
    this.createAchievementCategory('fitness', {
      name: 'Fitness Champion',
      description: 'Achievements for workout consistency and performance',
      icon: '💪',
      color: '#f59e0b'
    })

    this.addAchievement('first-workout', {
      category: 'fitness',
      title: 'First Steps',
      description: 'Complete your first workout',
      badge: '👟',
      points: 10,
      rarity: 'common',
      condition: (data) => data.activity?.workouts?.length >= 1
    })

    this.addAchievement('workout-warrior', {
      category: 'fitness',
      title: 'Workout Warrior',
      description: 'Complete 10 workouts',
      badge: '⚔️',
      points: 75,
      rarity: 'uncommon',
      condition: (data) => data.activity?.workouts?.length >= 10
    })

    this.addAchievement('century-club', {
      category: 'fitness',
      title: 'Century Club',
      description: 'Complete 100 workouts',
      badge: '💯',
      points: 500,
      rarity: 'legendary',
      condition: (data) => data.activity?.workouts?.length >= 100
    })

    this.addAchievement('strength-gains', {
      category: 'fitness',
      title: 'Strength Gains',
      description: 'Increase any exercise weight by 50% from your first logged session',
      badge: '📈',
      points: 200,
      rarity: 'rare',
      condition: (data) => this.checkStrengthProgress(data, 1.5)
    })

    // Consistency achievements
    this.createAchievementCategory('consistency', {
      name: 'Consistency Champion',
      description: 'Achievements for maintaining regular habits',
      icon: '🔥',
      color: '#ef4444'
    })

    this.addAchievement('early-bird', {
      category: 'consistency',
      title: 'Early Bird',
      description: 'Log activities before 8 AM for 7 consecutive days',
      badge: '🌅',
      points: 100,
      rarity: 'uncommon',
      condition: (data) => this.checkEarlyBirdPattern(data, 7)
    })

    this.addAchievement('weekend-warrior', {
      category: 'consistency',
      title: 'Weekend Warrior',
      description: 'Stay consistent on weekends for 4 consecutive weeks',
      badge: '🏖️',
      points: 150,
      rarity: 'rare',
      condition: (data) => this.checkWeekendConsistency(data, 4)
    })

    // Progress achievements
    this.createAchievementCategory('progress', {
      name: 'Progress Pioneer',
      description: 'Achievements for reaching personal milestones',
      icon: '📊',
      color: '#8b5cf6'
    })

    this.addAchievement('goal-crusher', {
      category: 'progress',
      title: 'Goal Crusher',
      description: 'Reach your target weight',
      badge: '🎯',
      points: 1000,
      rarity: 'legendary',
      condition: (data) => this.checkWeightGoalAchieved(data)
    })

    this.addAchievement('progress-tracker', {
      category: 'progress',
      title: 'Progress Tracker',
      description: 'Log body measurements for 4 consecutive weeks',
      badge: '📏',
      points: 100,
      rarity: 'uncommon',
      condition: (data) => this.checkMeasurementConsistency(data, 4)
    })

    // Social achievements
    this.createAchievementCategory('engagement', {
      name: 'Engagement Expert',
      description: 'Achievements for app engagement and exploration',
      icon: '🌟',
      color: '#06b6d4'
    })

    this.addAchievement('explorer', {
      category: 'engagement',
      title: 'Explorer',
      description: 'Use all major features at least once',
      badge: '🗺️',
      points: 200,
      rarity: 'rare',
      condition: (data) => this.checkFeatureExploration(data)
    })

    this.addAchievement('data-driven', {
      category: 'engagement',
      title: 'Data Driven',
      description: 'Export your data for the first time',
      badge: '📊',
      points: 50,
      rarity: 'uncommon',
      condition: (data) => data.exports?.length >= 1
    })
  }

  /**
   * Create achievement category
   */
  createAchievementCategory(id, categoryData) {
    this.categories.set(id, {
      id,
      ...categoryData,
      achievements: [],
      totalPoints: 0,
      unlockedCount: 0
    })
  }

  /**
   * Add achievement definition
   */
  addAchievement(id, achievementData) {
    const achievement = {
      id,
      ...achievementData,
      unlocked: false,
      unlockedAt: null,
      progress: 0,
      maxProgress: 1
    }

    this.achievements.set(id, achievement)

    // Add to category
    const category = this.categories.get(achievement.category)
    if (category) {
      category.achievements.push(id)
      category.totalPoints += achievement.points
    }
  }

  /**
   * Setup data change listeners
   */
  setupDataListeners() {
    if (typeof window !== 'undefined') {
      const events = [
        'meal-logged', 'workout-completed', 'measurement-logged', 
        'sleep-logged', 'goal-updated', 'data-exported'
      ]

      events.forEach(eventType => {
        window.addEventListener(eventType, () => {
          setTimeout(() => this.checkAllAchievements(), 1000)
        })
      })

      // Listen for streak updates
      window.addEventListener('streak-updated', () => {
        setTimeout(() => this.checkAllAchievements(), 1000)
      })
    }
  }

  /**
   * Check all achievements for unlocking
   */
  async checkAllAchievements() {
    const fitnessData = useFitnessStore.getState()
    const newlyUnlocked = []

    for (const [id, achievement] of this.achievements) {
      if (!achievement.unlocked) {
        try {
          const isUnlocked = await achievement.condition(fitnessData)
          
          if (isUnlocked) {
            await this.unlockAchievement(id)
            newlyUnlocked.push(achievement)
          } else {
            // Update progress if applicable
            this.updateAchievementProgress(id, fitnessData)
          }
        } catch (error) {
          console.error(`Error checking achievement ${id}:`, error)
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      this.queueCelebrations(newlyUnlocked)
    }
  }

  /**
   * Unlock achievement
   */
  async unlockAchievement(achievementId) {
    const achievement = this.achievements.get(achievementId)
    if (!achievement || achievement.unlocked) return

    // Mark as unlocked
    achievement.unlocked = true
    achievement.unlockedAt = new Date().toISOString()
    achievement.progress = achievement.maxProgress

    // Update user achievements
    this.userAchievements.set(achievementId, {
      id: achievementId,
      unlockedAt: achievement.unlockedAt,
      points: achievement.points
    })

    // Update category stats
    const category = this.categories.get(achievement.category)
    if (category) {
      category.unlockedCount++
    }

    // Save data
    this.saveAchievementData()

    console.log(`🏆 Achievement unlocked: ${achievement.title}`)

    // Dispatch event
    this.dispatchAchievementUnlocked(achievement)

    return achievement
  }

  /**
   * Update achievement progress
   */
  updateAchievementProgress(achievementId, fitnessData) {
    const achievement = this.achievements.get(achievementId)
    if (!achievement || achievement.unlocked) return

    // Calculate progress based on achievement type
    let progress = 0

    switch (achievementId) {
      case 'calorie-counter':
        progress = Math.min((fitnessData.nutrition?.meals?.length || 0) / 100, 1)
        break
      case 'workout-warrior':
        progress = Math.min((fitnessData.activity?.workouts?.length || 0) / 10, 1)
        break
      case 'century-club':
        progress = Math.min((fitnessData.activity?.workouts?.length || 0) / 100, 1)
        break
      case 'meal-streak-7':
        progress = Math.min(this.getNutritionStreak() / 7, 1)
        break
      case 'meal-streak-30':
        progress = Math.min(this.getNutritionStreak() / 30, 1)
        break
    }

    if (progress !== achievement.progress) {
      achievement.progress = Math.max(achievement.progress, progress)
      this.dispatchProgressUpdate(achievement)
    }
  }

  /**
   * Queue celebrations for newly unlocked achievements
   */
  queueCelebrations(achievements) {
    achievements.forEach(achievement => {
      this.celebrationQueue.push(achievement)
    })

    this.processCelebrationQueue()
  }

  /**
   * Process celebration queue
   */
  processCelebrationQueue() {
    if (this.celebrationQueue.length === 0) return

    const achievement = this.celebrationQueue.shift()
    
    // Show celebration
    this.celebrateAchievement(achievement)

    // Process next after delay
    if (this.celebrationQueue.length > 0) {
      setTimeout(() => {
        this.processCelebrationQueue()
      }, this.config.celebrationDelay)
    }
  }

  /**
   * Celebrate achievement unlock
   */
  celebrateAchievement(achievement) {
    console.log(`🎉 Celebrating achievement: ${achievement.title}`)

    // Send notification
    if (this.config.enableNotifications && notificationService) {
      notificationService.sendAchievementNotification(achievement)
    }

    // Dispatch celebration event
    this.dispatchCelebrationEvent(achievement)

    // Show in-app celebration
    this.showInAppCelebration(achievement)
  }

  /**
   * Show in-app celebration
   */
  showInAppCelebration(achievement) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievement-celebration', {
        detail: { achievement }
      }))
    }
  }

  /**
   * Helper methods for achievement conditions
   */
  getNutritionStreak() {
    const nutritionStreak = streakTrackingService?.getStreak('nutrition')
    return nutritionStreak?.currentStreak || 0
  }

  checkMacroPerfection(data, days) {
    if (!data.nutrition?.meals) return false

    const recentDays = this.getRecentDays(days)
    
    return recentDays.every(day => {
      const dayMeals = data.nutrition.meals.filter(meal => 
        new Date(meal.timestamp).toDateString() === day.toDateString()
      )

      if (dayMeals.length === 0) return false

      const dayTotals = dayMeals.reduce((totals, meal) => ({
        calories: totals.calories + (meal.calories || 0),
        protein: totals.protein + (meal.protein || 0),
        carbs: totals.carbs + (meal.carbs || 0),
        fats: totals.fats + (meal.fats || 0)
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 })

      // Check if within 10% of targets (assuming we have targets)
      const targets = data.user?.targets || { calories: 2000, protein: 150, carbs: 250, fats: 65 }
      
      return Object.keys(targets).every(macro => {
        const actual = dayTotals[macro]
        const target = targets[macro]
        const tolerance = target * 0.1
        return Math.abs(actual - target) <= tolerance
      })
    })
  }

  checkStrengthProgress(data, multiplier) {
    if (!data.activity?.workouts) return false

    const workouts = data.activity.workouts
    const exerciseProgress = new Map()

    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const key = exercise.name.toLowerCase()
        if (!exerciseProgress.has(key)) {
          exerciseProgress.set(key, [])
        }
        exerciseProgress.get(key).push({
          weight: exercise.weight || 0,
          timestamp: workout.timestamp
        })
      })
    })

    // Check if any exercise has improved by the required multiplier
    for (const [exercise, sessions] of exerciseProgress) {
      if (sessions.length < 2) continue

      sessions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      const first = sessions[0]
      const best = sessions.reduce((max, session) => 
        session.weight > max.weight ? session : max, first)

      if (first.weight > 0 && best.weight / first.weight >= multiplier) {
        return true
      }
    }

    return false
  }

  checkEarlyBirdPattern(data, days) {
    const recentDays = this.getRecentDays(days)
    
    return recentDays.every(day => {
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const eightAM = new Date(day)
      eightAM.setHours(8, 0, 0, 0)

      // Check if any activity was logged before 8 AM
      const earlyActivities = [
        ...(data.nutrition?.meals || []),
        ...(data.activity?.workouts || []),
        ...(data.wellness?.sleepEntries || [])
      ].filter(activity => {
        const activityTime = new Date(activity.timestamp)
        return activityTime >= dayStart && activityTime < eightAM
      })

      return earlyActivities.length > 0
    })
  }

  checkWeekendConsistency(data, weeks) {
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      
      // Get Saturday and Sunday of this week
      const saturday = new Date(weekStart)
      saturday.setDate(saturday.getDate() - weekStart.getDay() + 6)
      const sunday = new Date(saturday)
      sunday.setDate(saturday.getDate() + 1)

      const weekendDays = [saturday, sunday]
      
      const hasWeekendActivity = weekendDays.every(day => {
        const dayActivities = [
          ...(data.nutrition?.meals || []),
          ...(data.activity?.workouts || [])
        ].filter(activity => 
          new Date(activity.timestamp).toDateString() === day.toDateString()
        )

        return dayActivities.length > 0
      })

      if (!hasWeekendActivity) return false
    }

    return true
  }

  checkWeightGoalAchieved(data) {
    const currentWeight = this.getCurrentWeight(data)
    const targetWeight = data.user?.goals?.targetWeight
    const initialWeight = data.user?.goals?.initialWeight || data.user?.profile?.weight

    if (!currentWeight || !targetWeight || !initialWeight) return false

    const goalDirection = targetWeight < initialWeight ? 'loss' : 'gain'
    
    if (goalDirection === 'loss') {
      return currentWeight <= targetWeight
    } else {
      return currentWeight >= targetWeight
    }
  }

  getCurrentWeight(data) {
    const weights = data.body?.measurements?.weight || []
    if (weights.length === 0) return null

    const sorted = weights.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    return sorted[0].value
  }

  checkMeasurementConsistency(data, weeks) {
    if (!data.body?.measurements) return false

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6)
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - (i * 7))

      const weekMeasurements = Object.values(data.body.measurements)
        .flat()
        .filter(measurement => {
          const measurementDate = new Date(measurement.timestamp)
          return measurementDate >= weekStart && measurementDate <= weekEnd
        })

      if (weekMeasurements.length === 0) return false
    }

    return true
  }

  checkFeatureExploration(data) {
    const features = {
      nutrition: data.nutrition?.meals?.length > 0,
      activity: data.activity?.workouts?.length > 0,
      wellness: data.wellness?.sleepEntries?.length > 0,
      body: data.body?.measurements && Object.keys(data.body.measurements).length > 0,
      goals: data.user?.goals && Object.keys(data.user.goals).length > 0
    }

    return Object.values(features).every(used => used)
  }

  getRecentDays(count) {
    const days = []
    for (let i = 0; i < count; i++) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      days.push(day)
    }
    return days.reverse()
  }

  // Event dispatchers
  dispatchAchievementUnlocked(achievement) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievement-unlocked', {
        detail: { achievement }
      }))
    }
  }

  dispatchProgressUpdate(achievement) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievement-progress', {
        detail: { achievement }
      }))
    }
  }

  dispatchCelebrationEvent(achievement) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievement-celebration', {
        detail: { achievement }
      }))
    }
  }

  // Data persistence
  async loadAchievementData() {
    try {
      const saved = localStorage.getItem('achievementData')
      if (saved) {
        const data = JSON.parse(saved)
        
        if (data.userAchievements) {
          Object.entries(data.userAchievements).forEach(([id, achievementData]) => {
            this.userAchievements.set(id, achievementData)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error)
    }
  }

  saveAchievementData() {
    try {
      const data = {
        userAchievements: Object.fromEntries(this.userAchievements),
        lastUpdated: new Date().toISOString()
      }
      
      localStorage.setItem('achievementData', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save achievement data:', error)
    }
  }

  // API methods
  getAllAchievements() {
    return Array.from(this.achievements.values())
  }

  getUnlockedAchievements() {
    return Array.from(this.achievements.values()).filter(a => a.unlocked)
  }

  getAchievementsByCategory(categoryId) {
    return Array.from(this.achievements.values()).filter(a => a.category === categoryId)
  }

  getCategories() {
    return Array.from(this.categories.values())
  }

  getTotalPoints() {
    return Array.from(this.userAchievements.values())
      .reduce((total, achievement) => total + achievement.points, 0)
  }

  getAchievementStats() {
    const total = this.achievements.size
    const unlocked = this.getUnlockedAchievements().length
    const points = this.getTotalPoints()
    
    return {
      total,
      unlocked,
      locked: total - unlocked,
      completionRate: total > 0 ? (unlocked / total) * 100 : 0,
      totalPoints: points,
      categoriesCompleted: this.getCategoriesCompleted()
    }
  }

  getCategoriesCompleted() {
    let completed = 0
    this.categories.forEach(category => {
      const categoryAchievements = category.achievements.length
      const unlockedInCategory = category.achievements.filter(id => 
        this.achievements.get(id)?.unlocked
      ).length
      
      if (unlockedInCategory === categoryAchievements) {
        completed++
      }
    })
    return completed
  }

  stop() {
    this.isInitialized = false
    console.log('🛑 Achievement Service stopped')
  }
}

export const achievementService = new AchievementService()
export default achievementService