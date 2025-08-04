/**
 * Trainer Workflow Service
 * Handles automated workflows, notifications, and alerts for trainer-client interactions
 */

import { trainerReportService } from './trainerReportService.js'
import { exportService } from './exportService.js'
import { analyticsService } from './analyticsService.js'
import useFitnessStore from '../store/fitnessStore.js'

export class TrainerWorkflowService {
  constructor() {
    this.workflows = new Map()
    this.notifications = []
    this.alerts = []
    this.milestones = []
    this.scheduledTasks = new Map()
    this.isInitialized = false
    this.clientEngagementScores = new Map()
    this.weeklyEmailSchedule = new Map()
    this.alertThresholds = this.getDefaultAlertThresholds()
  }

  /**
   * Initialize the trainer workflow service
   */
  async initialize(trainerConfig = {}) {
    console.log('🔄 Initializing Trainer Workflow Service')
    
    this.trainerConfig = {
      email: trainerConfig.email || 'trainer@example.com',
      weeklyEmailDay: trainerConfig.weeklyEmailDay || 'monday',
      weeklyEmailTime: trainerConfig.weeklyEmailTime || '09:00',
      timezone: trainerConfig.timezone || 'America/New_York',
      alertsEnabled: trainerConfig.alertsEnabled !== false,
      milestonesEnabled: trainerConfig.milestonesEnabled !== false,
      escalationEnabled: trainerConfig.escalationEnabled !== false,
      ...trainerConfig
    }

    // Start workflow monitoring
    this.startWorkflowMonitoring()
    
    // Schedule weekly emails
    this.scheduleWeeklyEmails()
    
    // Initialize real-time monitoring
    this.initializeRealTimeMonitoring()
    
    this.isInitialized = true
    console.log('✅ Trainer Workflow Service initialized')
    
    return true
  }

  /**
   * Get default alert thresholds
   */
  getDefaultAlertThresholds() {
    return {
      missedDays: {
        warning: 2, // 2 days without logging
        critical: 4 // 4 days without logging
      },
      macroAdherence: {
        warning: 60, // Below 60% adherence
        critical: 40 // Below 40% adherence
      },
      sleepQuality: {
        warning: 2.5, // Below 2.5/5 average quality
        critical: 2.0 // Below 2.0/5 average quality
      },
      workoutFrequency: {
        warning: 2, // Less than 2 workouts per week
        critical: 0 // No workouts in a week
      },
      weightChange: {
        warning: 0.5, // More than 0.5 lbs change from goal direction per week
        critical: 2.0 // More than 2 lbs change from goal direction per week
      },
      engagementScore: {
        warning: 40, // Below 40% engagement
        critical: 20 // Below 20% engagement
      }
    }
  }

  /**
   * Start workflow monitoring
   */
  startWorkflowMonitoring() {
    // Monitor every hour
    setInterval(() => {
      this.runWorkflowChecks()
    }, 60 * 60 * 1000)

    // Initial check
    setTimeout(() => {
      this.runWorkflowChecks()
    }, 5000)
  }

  /**
   * Schedule weekly emails
   */
  scheduleWeeklyEmails() {
    const scheduleWeeklyEmail = () => {
      const now = new Date()
      const dayOfWeek = this.getDayOfWeekNumber(this.trainerConfig.weeklyEmailDay)
      const currentDay = now.getDay()
      
      let daysUntilEmail = dayOfWeek - currentDay
      if (daysUntilEmail <= 0) {
        daysUntilEmail += 7 // Next week
      }
      
      const emailTime = new Date(now)
      emailTime.setDate(now.getDate() + daysUntilEmail)
      const [hours, minutes] = this.trainerConfig.weeklyEmailTime.split(':')
      emailTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const timeUntilEmail = emailTime.getTime() - now.getTime()
      
      console.log(`📅 Next weekly email scheduled for: ${emailTime.toLocaleString()}`)
      
      setTimeout(async () => {
        await this.sendWeeklyReport()
        scheduleWeeklyEmail() // Schedule next week
      }, timeUntilEmail)
    }

    scheduleWeeklyEmail()
  }

  /**
   * Initialize real-time monitoring
   */
  initializeRealTimeMonitoring() {
    // Listen for fitness store changes
    if (typeof window !== 'undefined') {
      // Monitor nutrition updates
      window.addEventListener('meal-logged', (event) => {
        this.handleNutritionUpdate(event.detail)
      })

      // Monitor workout updates
      window.addEventListener('workout-completed', (event) => {
        this.handleWorkoutUpdate(event.detail)
      })

      // Monitor sleep updates
      window.addEventListener('sleep-logged', (event) => {
        this.handleSleepUpdate(event.detail)
      })

      // Monitor weight updates
      window.addEventListener('weight-logged', (event) => {
        this.handleWeightUpdate(event.detail)
      })
    }
  }

  /**
   * Run all workflow checks
   */
  async runWorkflowChecks() {
    if (!this.isInitialized) return

    console.log('🔍 Running workflow checks...')
    
    try {
      // Check for red flags
      await this.checkRedFlags()
      
      // Update engagement scores
      await this.updateClientEngagementScores()
      
      // Check for milestones
      await this.checkMilestones()
      
      // Process scheduled notifications
      await this.processScheduledNotifications()
      
    } catch (error) {
      console.error('Failed to run workflow checks:', error)
    }
  }

  /**
   * Send automated weekly report
   */
  async sendWeeklyReport(clientId = null) {
    console.log('📧 Sending automated weekly report...')
    
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Generate report
      const report = await trainerReportService.generateWeeklySummary(startDate, endDate, clientId)
      
      // Add week-over-week comparison
      const previousWeekReport = await this.generatePreviousWeekComparison(report)
      report.comparison = previousWeekReport
      
      // Email the report
      const emailResult = await exportService.emailToTrainer(
        report,
        this.trainerConfig.email,
        {
          includeAttachments: true,
          attachmentFormats: ['pdf', 'csv'],
          emailTemplate: 'weekly_automated_report',
          includeComparison: true,
          includeAlerts: this.getActiveAlerts(),
          includeMilestones: this.getRecentMilestones()
        }
      )
      
      if (emailResult.success) {
        console.log('✅ Weekly report sent successfully')
        this.addNotification({
          type: 'info',
          title: 'Weekly Report Sent',
          message: `Automated weekly report sent to ${this.trainerConfig.email}`,
          timestamp: new Date().toISOString(),
          clientId
        })
      } else {
        throw new Error(emailResult.error)
      }
      
    } catch (error) {
      console.error('Failed to send weekly report:', error)
      this.addAlert({
        type: 'system',
        level: 'critical',
        title: 'Weekly Report Failed',
        message: `Failed to send weekly report: ${error.message}`,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Check for red flags and generate alerts
   */
  async checkRedFlags() {
    const fitnessData = useFitnessStore.getState()
    const alerts = []
    
    // Check missed days
    const lastLogDate = this.getLastLogDate(fitnessData)
    const daysSinceLastLog = this.getDaysSince(lastLogDate)
    
    if (daysSinceLastLog >= this.alertThresholds.missedDays.critical) {
      alerts.push({
        type: 'missed_days',
        level: 'critical',
        title: 'Critical: Client Inactive',
        message: `No activity logged for ${daysSinceLastLog} days. Immediate intervention needed.`,
        data: { daysSinceLastLog, lastLogDate },
        actions: ['call_client', 'send_check_in', 'schedule_session']
      })
    } else if (daysSinceLastLog >= this.alertThresholds.missedDays.warning) {
      alerts.push({
        type: 'missed_days',
        level: 'warning',
        title: 'Warning: Reduced Activity',
        message: `Client hasn't logged data for ${daysSinceLastLog} days.`,
        data: { daysSinceLastLog, lastLogDate },
        actions: ['send_reminder', 'check_in_message']
      })
    }
    
    // Check macro adherence
    const weeklyReport = await this.getRecentWeeklyData()
    if (weeklyReport.macroAdherence.available) {
      const avgAdherence = Object.values(weeklyReport.macroAdherence.adherence)
        .reduce((sum, val) => sum + val, 0) / 4
      
      if (avgAdherence < this.alertThresholds.macroAdherence.critical) {
        alerts.push({
          type: 'macro_adherence',
          level: 'critical',
          title: 'Critical: Poor Nutrition Compliance',
          message: `Macro adherence at ${avgAdherence.toFixed(1)}%. Nutrition plan needs immediate review.`,
          data: { adherence: avgAdherence, macros: weeklyReport.macroAdherence.adherence },
          actions: ['review_meal_plan', 'schedule_nutrition_consult', 'adjust_targets']
        })
      } else if (avgAdherence < this.alertThresholds.macroAdherence.warning) {
        alerts.push({
          type: 'macro_adherence',
          level: 'warning',
          title: 'Warning: Low Nutrition Compliance',
          message: `Macro adherence at ${avgAdherence.toFixed(1)}%. Consider nutrition coaching.`,
          data: { adherence: avgAdherence, macros: weeklyReport.macroAdherence.adherence },
          actions: ['nutrition_check_in', 'meal_prep_guidance']
        })
      }
    }
    
    // Check sleep quality
    if (weeklyReport.sleepQuality.available) {
      const avgQuality = weeklyReport.sleepQuality.averageQuality
      
      if (avgQuality < this.alertThresholds.sleepQuality.critical) {
        alerts.push({
          type: 'sleep_quality',
          level: 'critical',
          title: 'Critical: Poor Sleep Quality',
          message: `Sleep quality at ${avgQuality.toFixed(1)}/5. Recovery is compromised.`,
          data: { quality: avgQuality, hours: weeklyReport.sleepQuality.averageHours },
          actions: ['sleep_hygiene_review', 'stress_assessment', 'recovery_focus']
        })
      } else if (avgQuality < this.alertThresholds.sleepQuality.warning) {
        alerts.push({
          type: 'sleep_quality',
          level: 'warning',
          title: 'Warning: Sleep Quality Declining',
          message: `Sleep quality at ${avgQuality.toFixed(1)}/5. Monitor closely.`,
          data: { quality: avgQuality, hours: weeklyReport.sleepQuality.averageHours },
          actions: ['sleep_check_in', 'bedtime_routine_review']
        })
      }
    }
    
    // Check workout frequency
    if (weeklyReport.trainingPerformance.available) {
      const workouts = weeklyReport.trainingPerformance.totalWorkouts
      
      if (workouts === 0) {
        alerts.push({
          type: 'workout_frequency',
          level: 'critical',
          title: 'Critical: No Workouts This Week',
          message: 'Client has not completed any workouts this week.',
          data: { workouts },
          actions: ['schedule_immediate_session', 'motivation_call', 'program_review']
        })
      } else if (workouts < this.alertThresholds.workoutFrequency.warning) {
        alerts.push({
          type: 'workout_frequency',
          level: 'warning',
          title: 'Warning: Low Workout Frequency',
          message: `Only ${workouts} workout${workouts === 1 ? '' : 's'} completed this week.`,
          data: { workouts },
          actions: ['motivation_check_in', 'schedule_flexibility_review']
        })
      }
    }
    
    // Check engagement score
    const engagementScore = this.calculateEngagementScore(fitnessData)
    if (engagementScore < this.alertThresholds.engagementScore.critical) {
      alerts.push({
        type: 'engagement',
        level: 'critical',
        title: 'Critical: Very Low Engagement',
        message: `Client engagement score is ${engagementScore.toFixed(1)}%. Risk of dropout.`,
        data: { score: engagementScore },
        actions: ['urgent_client_call', 'program_restructure', 'motivation_intervention']
      })
    } else if (engagementScore < this.alertThresholds.engagementScore.warning) {
      alerts.push({
        type: 'engagement',
        level: 'warning',
        title: 'Warning: Declining Engagement',
        message: `Client engagement score is ${engagementScore.toFixed(1)}%. Needs attention.`,
        data: { score: engagementScore },
        actions: ['check_in_call', 'program_adjustment', 'goal_review']
      })
    }
    
    // Process alerts
    for (const alert of alerts) {
      await this.processAlert(alert)
    }
  }

  /**
   * Check for milestone achievements
   */
  async checkMilestones() {
    if (!this.trainerConfig.milestonesEnabled) return
    
    const fitnessData = useFitnessStore.getState()
    const milestones = []
    
    // Weight loss milestones
    const weightData = fitnessData.body.measurements.weight
    if (weightData && weightData.length >= 2) {
      const currentWeight = weightData[weightData.length - 1].value
      const startWeight = weightData[0].value
      const weightLoss = startWeight - currentWeight
      
      // Check for weight loss milestones (every 5 lbs)
      const milestoneThresholds = [5, 10, 15, 20, 25, 30, 40, 50]
      for (const threshold of milestoneThresholds) {
        if (weightLoss >= threshold && !this.hasCelebrated(`weight_loss_${threshold}`)) {
          milestones.push({
            type: 'weight_loss',
            title: `${threshold} lbs Lost!`,
            message: `Congratulations! Client has lost ${weightLoss.toFixed(1)} lbs total.`,
            data: { weightLoss, currentWeight, startWeight },
            celebrationLevel: threshold >= 25 ? 'major' : threshold >= 10 ? 'significant' : 'minor',
            actions: ['send_congratulations', 'social_share_prompt', 'progress_photo_request']
          })
          this.markAsCelebrated(`weight_loss_${threshold}`)
        }
      }
    }
    
    // Streak milestones
    const streakData = this.calculateCurrentStreak(fitnessData)
    const streakThresholds = [7, 14, 30, 60, 100]
    for (const threshold of streakThresholds) {
      if (streakData.days >= threshold && !this.hasCelebrated(`streak_${threshold}`)) {
        milestones.push({
          type: 'streak',
          title: `${threshold} Day Streak!`,
          message: `Amazing consistency! Client has maintained a ${streakData.days} day logging streak.`,
          data: streakData,
          celebrationLevel: threshold >= 60 ? 'major' : threshold >= 30 ? 'significant' : 'minor',
          actions: ['send_congratulations', 'streak_badge', 'consistency_recognition']
        })
        this.markAsCelebrated(`streak_${threshold}`)
      }
    }
    
    // Goal completion milestones
    const goals = fitnessData.user.goals || []
    for (const goal of goals) {
      if (goal.progress >= 100 && !this.hasCelebrated(`goal_${goal.id}`)) {
        milestones.push({
          type: 'goal_completion',
          title: 'Goal Achieved!',
          message: `Client has successfully completed: "${goal.title}"`,
          data: goal,
          celebrationLevel: 'significant',
          actions: ['send_congratulations', 'set_new_goal', 'success_story']
        })
        this.markAsCelebrated(`goal_${goal.id}`)
      }
    }
    
    // Macro adherence milestones
    const weeklyReport = await this.getRecentWeeklyData()
    if (weeklyReport.macroAdherence.available) {
      const avgAdherence = Object.values(weeklyReport.macroAdherence.adherence)
        .reduce((sum, val) => sum + val, 0) / 4
      
      if (avgAdherence >= 95 && !this.hasCelebrated('perfect_week_nutrition')) {
        milestones.push({
          type: 'perfect_nutrition',
          title: 'Perfect Nutrition Week!',
          message: `Outstanding! Client achieved ${avgAdherence.toFixed(1)}% macro adherence this week.`,
          data: { adherence: avgAdherence },
          celebrationLevel: 'significant',
          actions: ['send_congratulations', 'nutrition_success_highlight']
        })
        this.markAsCelebrated('perfect_week_nutrition')
      }
    }
    
    // Process milestones
    for (const milestone of milestones) {
      await this.processMilestone(milestone)
    }
  }

  /**
   * Generate week-over-week comparison
   */
  async generatePreviousWeekComparison(currentReport) {
    const previousWeekEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const previousWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    try {
      const previousReport = await trainerReportService.generateWeeklySummary(
        previousWeekStart,
        previousWeekEnd,
        currentReport.client.id
      )
      
      return {
        available: true,
        previous: previousReport,
        changes: this.calculateWeekOverWeekChanges(currentReport, previousReport),
        trends: this.identifyTrends(currentReport, previousReport),
        improvements: this.identifyImprovements(currentReport, previousReport),
        concerns: this.identifyConcerns(currentReport, previousReport)
      }
    } catch (error) {
      console.error('Failed to generate previous week comparison:', error)
      return { available: false, error: error.message }
    }
  }

  /**
   * Calculate week-over-week changes
   */
  calculateWeekOverWeekChanges(current, previous) {
    const changes = {}
    
    // Weight change
    if (current.summary.weightTrends.available && previous.summary.weightTrends.available) {
      changes.weight = {
        current: current.summary.weightTrends.endWeight,
        previous: previous.summary.weightTrends.endWeight,
        change: current.summary.weightTrends.endWeight - previous.summary.weightTrends.endWeight,
        percentChange: ((current.summary.weightTrends.endWeight - previous.summary.weightTrends.endWeight) / previous.summary.weightTrends.endWeight) * 100
      }
    }
    
    // Macro adherence changes
    if (current.summary.macroAdherence.available && previous.summary.macroAdherence.available) {
      changes.macroAdherence = {}
      for (const [macro, currentVal] of Object.entries(current.summary.macroAdherence.adherence)) {
        const previousVal = previous.summary.macroAdherence.adherence[macro]
        changes.macroAdherence[macro] = {
          current: currentVal,
          previous: previousVal,
          change: currentVal - previousVal
        }
      }
    }
    
    // Sleep changes
    if (current.summary.sleepQuality.available && previous.summary.sleepQuality.available) {
      changes.sleep = {
        hours: {
          current: current.summary.sleepQuality.averageHours,
          previous: previous.summary.sleepQuality.averageHours,
          change: current.summary.sleepQuality.averageHours - previous.summary.sleepQuality.averageHours
        },
        quality: {
          current: current.summary.sleepQuality.averageQuality,
          previous: previous.summary.sleepQuality.averageQuality,
          change: current.summary.sleepQuality.averageQuality - previous.summary.sleepQuality.averageQuality
        }
      }
    }
    
    // Workout changes
    if (current.summary.trainingPerformance.available && previous.summary.trainingPerformance.available) {
      changes.workouts = {
        frequency: {
          current: current.summary.trainingPerformance.totalWorkouts,
          previous: previous.summary.trainingPerformance.totalWorkouts,
          change: current.summary.trainingPerformance.totalWorkouts - previous.summary.trainingPerformance.totalWorkouts
        },
        duration: {
          current: current.summary.trainingPerformance.averageDuration,
          previous: previous.summary.trainingPerformance.averageDuration,
          change: current.summary.trainingPerformance.averageDuration - previous.summary.trainingPerformance.averageDuration
        }
      }
    }
    
    return changes
  }

  /**
   * Handle real-time nutrition update
   */
  async handleNutritionUpdate(data) {
    console.log('🍽️ Processing nutrition update...')
    
    // Check for immediate adherence notifications
    const todaysAdherence = this.calculateTodaysMacroAdherence()
    
    if (todaysAdherence.isComplete && todaysAdherence.avgAdherence >= 90) {
      this.addNotification({
        type: 'success',
        title: 'Excellent Nutrition Day!',
        message: `Client achieved ${todaysAdherence.avgAdherence.toFixed(1)}% macro adherence today`,
        timestamp: new Date().toISOString(),
        data: todaysAdherence
      })
    }
    
    // Check for concerning patterns
    if (todaysAdherence.protein < 60) {
      this.addNotification({
        type: 'warning',
        title: 'Low Protein Alert',
        message: `Client only at ${todaysAdherence.protein.toFixed(1)}% protein target today`,
        timestamp: new Date().toISOString(),
        data: { protein: todaysAdherence.protein }
      })
    }
  }

  /**
   * Handle real-time workout update
   */
  async handleWorkoutUpdate(data) {
    console.log('💪 Processing workout update...')
    
    const weeklyWorkouts = this.getThisWeeksWorkouts()
    
    // Milestone check for workout frequency
    if (weeklyWorkouts.length === 3) {
      this.addNotification({
        type: 'success',
        title: 'Weekly Goal Reached!',
        message: 'Client has completed 3 workouts this week - excellent consistency!',
        timestamp: new Date().toISOString(),
        data: { workouts: weeklyWorkouts.length }
      })
    }
    
    // Long workout notification
    if (data.duration && data.duration > 90) {
      this.addNotification({
        type: 'info',
        title: 'Extended Workout',
        message: `Client completed a ${Math.round(data.duration)} minute workout`,
        timestamp: new Date().toISOString(),
        data: { duration: data.duration, type: data.type }
      })
    }
  }

  /**
   * Process alert and determine actions
   */
  async processAlert(alert) {
    // Add to alerts array
    this.alerts.push({
      ...alert,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      acknowledged: false,
      escalated: false
    })
    
    // Send immediate notification if critical
    if (alert.level === 'critical' && this.trainerConfig.alertsEnabled) {
      await this.sendImmediateAlert(alert)
    }
    
    // Log alert
    console.log(`🚨 ${alert.level.toUpperCase()} ALERT: ${alert.title}`)
  }

  /**
   * Process milestone celebration
   */
  async processMilestone(milestone) {
    // Add to milestones array
    this.milestones.push({
      ...milestone,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      celebrated: false
    })
    
    // Send celebration notification
    if (this.trainerConfig.milestonesEnabled) {
      await this.sendMilestoneCelebration(milestone)
    }
    
    // Log milestone
    console.log(`🎉 MILESTONE: ${milestone.title}`)
  }

  /**
   * Send immediate alert to trainer
   */
  async sendImmediateAlert(alert) {
    try {
      // In a real implementation, this would send via email, SMS, push notification, etc.
      const alertMessage = {
        to: this.trainerConfig.email,
        subject: `🚨 ${alert.level.toUpperCase()} ALERT: ${alert.title}`,
        body: `
          Alert Level: ${alert.level.toUpperCase()}
          
          ${alert.message}
          
          Recommended Actions:
          ${alert.actions.map(action => `• ${action.replace('_', ' ')}`).join('\n')}
          
          Alert generated at: ${new Date().toLocaleString()}
          
          View full details in the trainer dashboard.
        `,
        priority: alert.level === 'critical' ? 'high' : 'normal'
      }
      
      console.log('📧 Sending immediate alert:', alertMessage.subject)
      
      // Mark alert as sent
      const alertIndex = this.alerts.findIndex(a => a.title === alert.title && a.type === alert.type)
      if (alertIndex !== -1) {
        this.alerts[alertIndex].notificationSent = true
      }
      
    } catch (error) {
      console.error('Failed to send immediate alert:', error)
    }
  }

  /**
   * Send milestone celebration
   */
  async sendMilestoneCelebration(milestone) {
    try {
      const celebrationMessage = {
        to: this.trainerConfig.email,
        subject: `🎉 Client Milestone: ${milestone.title}`,
        body: `
          Great news! Your client has achieved a milestone:
          
          ${milestone.title}
          ${milestone.message}
          
          Suggested Actions:
          ${milestone.actions.map(action => `• ${action.replace('_', ' ')}`).join('\n')}
          
          Celebrate this achievement with your client!
          
          Achievement unlocked at: ${new Date().toLocaleString()}
        `,
        priority: 'normal'
      }
      
      console.log('🎉 Sending milestone celebration:', celebrationMessage.subject)
      
    } catch (error) {
      console.error('Failed to send milestone celebration:', error)
    }
  }

  // Utility methods
  
  generateId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getDayOfWeekNumber(dayName) {
    const days = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
    return days[dayName.toLowerCase()] || 1
  }

  getLastLogDate(fitnessData) {
    // Check various data sources for the most recent activity
    const dates = []
    
    if (fitnessData.nutrition.meals.length > 0) {
      dates.push(new Date(fitnessData.nutrition.meals[fitnessData.nutrition.meals.length - 1].date))
    }
    
    if (fitnessData.activity.workouts.length > 0) {
      dates.push(new Date(fitnessData.activity.workouts[fitnessData.activity.workouts.length - 1].date))
    }
    
    if (fitnessData.wellness.sleepEntries.length > 0) {
      dates.push(new Date(fitnessData.wellness.sleepEntries[fitnessData.wellness.sleepEntries.length - 1].date))
    }
    
    return dates.length > 0 ? new Date(Math.max(...dates)) : new Date(0)
  }

  getDaysSince(date) {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  async getRecentWeeklyData() {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    try {
      return await trainerReportService.generateWeeklySummary(startDate, endDate)
    } catch (error) {
      console.error('Failed to get recent weekly data:', error)
      return { macroAdherence: { available: false }, sleepQuality: { available: false }, trainingPerformance: { available: false } }
    }
  }

  calculateEngagementScore(fitnessData) {
    let score = 0
    let maxScore = 0
    
    // Days with data logged (30%)
    const recentDays = 7
    const daysWithData = this.getDaysWithData(fitnessData, recentDays)
    score += (daysWithData / recentDays) * 30
    maxScore += 30
    
    // Nutrition logging consistency (25%)
    const recentMeals = fitnessData.nutrition.meals.filter(meal => 
      new Date(meal.date) > new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000)
    ).length
    const expectedMeals = recentDays * 3 // 3 meals per day
    score += Math.min(1, recentMeals / expectedMeals) * 25
    maxScore += 25
    
    // Workout frequency (25%)
    const recentWorkouts = fitnessData.activity.workouts.filter(workout =>
      new Date(workout.date) > new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000)
    ).length
    const expectedWorkouts = Math.ceil(recentDays / 7) * 3 // 3 workouts per week
    score += Math.min(1, recentWorkouts / expectedWorkouts) * 25
    maxScore += 25
    
    // Sleep tracking (20%)
    const recentSleep = fitnessData.wellness.sleepEntries.filter(entry =>
      new Date(entry.date) > new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000)
    ).length
    score += Math.min(1, recentSleep / recentDays) * 20
    maxScore += 20
    
    return maxScore > 0 ? (score / maxScore) * 100 : 0
  }

  getDaysWithData(fitnessData, days) {
    const dates = new Set()
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    fitnessData.nutrition.meals.forEach(meal => {
      if (new Date(meal.date) > cutoff) {
        dates.add(new Date(meal.date).toDateString())
      }
    })
    
    fitnessData.activity.workouts.forEach(workout => {
      if (new Date(workout.date) > cutoff) {
        dates.add(new Date(workout.date).toDateString())
      }
    })
    
    fitnessData.wellness.sleepEntries.forEach(entry => {
      if (new Date(entry.date) > cutoff) {
        dates.add(new Date(entry.date).toDateString())
      }
    })
    
    return dates.size
  }

  calculateCurrentStreak(fitnessData) {
    // Calculate consecutive days with logged data
    let streak = 0
    let currentDate = new Date()
    
    while (true) {
      const dateString = currentDate.toDateString()
      const hasData = this.hasDataForDate(fitnessData, currentDate)
      
      if (hasData) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
      
      // Prevent infinite loop
      if (streak > 365) break
    }
    
    return { days: streak, startDate: currentDate }
  }

  hasDataForDate(fitnessData, date) {
    const dateString = date.toDateString()
    
    const hasMeal = fitnessData.nutrition.meals.some(meal => 
      new Date(meal.date).toDateString() === dateString
    )
    
    const hasWorkout = fitnessData.activity.workouts.some(workout =>
      new Date(workout.date).toDateString() === dateString
    )
    
    const hasSleep = fitnessData.wellness.sleepEntries.some(entry =>
      new Date(entry.date).toDateString() === dateString
    )
    
    return hasMeal || hasWorkout || hasSleep
  }

  calculateTodaysMacroAdherence() {
    const today = new Date().toDateString()
    const fitnessData = useFitnessStore.getState()
    
    const todaysMeals = fitnessData.nutrition.meals.filter(meal =>
      new Date(meal.date).toDateString() === today
    )
    
    if (todaysMeals.length === 0) {
      return { isComplete: false, avgAdherence: 0 }
    }
    
    const totals = todaysMeals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
    
    // Daily targets (should come from user profile)
    const targets = { calories: 2000, protein: 150, carbs: 250, fats: 67 }
    
    const adherence = {
      calories: Math.min(100, (totals.calories / targets.calories) * 100),
      protein: Math.min(100, (totals.protein / targets.protein) * 100),
      carbs: Math.min(100, (totals.carbs / targets.carbs) * 100),
      fats: Math.min(100, (totals.fats / targets.fats) * 100)
    }
    
    const avgAdherence = Object.values(adherence).reduce((sum, val) => sum + val, 0) / 4
    
    return {
      isComplete: todaysMeals.length >= 3, // Assume 3 meals minimum
      avgAdherence,
      ...adherence
    }
  }

  getThisWeeksWorkouts() {
    const fitnessData = useFitnessStore.getState()
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    
    return fitnessData.activity.workouts.filter(workout =>
      new Date(workout.date) >= weekStart
    )
  }

  hasCelebrated(milestoneKey) {
    return this.milestones.some(m => m.data?.milestoneKey === milestoneKey)
  }

  markAsCelebrated(milestoneKey) {
    // In a real implementation, this would persist to storage
    console.log(`✅ Marked milestone as celebrated: ${milestoneKey}`)
  }

  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged)
  }

  getRecentMilestones() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return this.milestones.filter(milestone => 
      new Date(milestone.timestamp) > weekAgo
    )
  }

  addNotification(notification) {
    this.notifications.push({
      ...notification,
      id: this.generateId(),
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    })
    
    console.log(`🔔 ${notification.type.toUpperCase()}: ${notification.title}`)
  }

  addAlert(alert) {
    this.alerts.push({
      ...alert,
      id: this.generateId(),
      timestamp: alert.timestamp || new Date().toISOString(),
      acknowledged: false
    })
    
    console.log(`🚨 ${alert.level.toUpperCase()} ALERT: ${alert.title}`)
  }

  // API methods for external access
  
  getNotifications(limit = 50) {
    return this.notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  getAlerts(level = null) {
    let alerts = this.alerts
    if (level) {
      alerts = alerts.filter(alert => alert.level === level)
    }
    return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  getMilestones(limit = 20) {
    return this.milestones
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedAt = new Date().toISOString()
      console.log(`✅ Alert acknowledged: ${alert.title}`)
    }
  }

  markNotificationRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      notification.readAt = new Date().toISOString()
    }
  }

  updateAlertThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds }
    console.log('🔧 Alert thresholds updated')
  }

  // Trend analysis methods
  identifyTrends(current, previous) {
    const trends = []
    
    // Weight trend
    if (current.summary.weightTrends.available && previous.summary.weightTrends.available) {
      const currentChange = current.summary.weightTrends.weightChange
      const previousChange = previous.summary.weightTrends.weightChange
      
      if (Math.abs(currentChange) > Math.abs(previousChange)) {
        trends.push({
          type: 'weight',
          direction: currentChange > 0 ? 'increasing' : 'decreasing',
          strength: 'accelerating',
          message: `Weight change is accelerating (${Math.abs(currentChange).toFixed(1)} vs ${Math.abs(previousChange).toFixed(1)} lbs)`
        })
      }
    }
    
    return trends
  }

  identifyImprovements(current, previous) {
    const improvements = []
    
    // Check macro adherence improvements
    if (current.summary.macroAdherence.available && previous.summary.macroAdherence.available) {
      const currentAvg = Object.values(current.summary.macroAdherence.adherence).reduce((sum, val) => sum + val, 0) / 4
      const previousAvg = Object.values(previous.summary.macroAdherence.adherence).reduce((sum, val) => sum + val, 0) / 4
      
      if (currentAvg > previousAvg + 5) {
        improvements.push({
          type: 'nutrition',
          metric: 'macro_adherence',
          improvement: currentAvg - previousAvg,
          message: `Nutrition compliance improved by ${(currentAvg - previousAvg).toFixed(1)}%`
        })
      }
    }
    
    return improvements
  }

  identifyConcerns(current, previous) {
    const concerns = []
    
    // Check for declining metrics
    if (current.summary.sleepQuality.available && previous.summary.sleepQuality.available) {
      const currentQuality = current.summary.sleepQuality.averageQuality
      const previousQuality = previous.summary.sleepQuality.averageQuality
      
      if (currentQuality < previousQuality - 0.5) {
        concerns.push({
          type: 'wellness',
          metric: 'sleep_quality',
          decline: previousQuality - currentQuality,
          message: `Sleep quality declined by ${(previousQuality - currentQuality).toFixed(1)} points`
        })
      }
    }
    
    return concerns
  }

  async processScheduledNotifications() {
    // Process any scheduled notifications (reminders, follow-ups, etc.)
    // This would be implemented based on specific scheduling needs
    console.log('📅 Processing scheduled notifications...')
  }

  async updateClientEngagementScores() {
    const fitnessData = useFitnessStore.getState()
    const engagementScore = this.calculateEngagementScore(fitnessData)
    
    this.clientEngagementScores.set('current_client', {
      score: engagementScore,
      lastUpdated: new Date().toISOString(),
      trend: this.calculateEngagementTrend(engagementScore)
    })
  }

  calculateEngagementTrend(currentScore) {
    // In a real implementation, this would compare against historical scores
    return currentScore >= 70 ? 'positive' : currentScore >= 50 ? 'stable' : 'declining'
  }
}

// Export singleton instance
export const trainerWorkflowService = new TrainerWorkflowService()
export default trainerWorkflowService