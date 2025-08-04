import offlineStorage from './offlineStorage'

/**
 * Notification Service for PWA Meal Reminders and Health Notifications
 */
class NotificationService {
  constructor() {
    this.permission = Notification.permission
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
    this.activeNotifications = new Map()
    this.reminderSchedules = new Map()
    
    this.initialize()
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('🔔 Notifications not supported by this browser')
      return
    }

    try {
      // Load saved notification schedules
      await this.loadNotificationSchedules()
      
      // Setup notification click handling
      this.setupNotificationHandling()
      
      console.log('🔔 Notification service initialized')
    } catch (error) {
      console.error('🔔 Failed to initialize notification service:', error)
    }
  }

  /**
   * Request notification permission with user-friendly UI
   */
  async requestPermission() {
    if (!this.isSupported) {
      return {
        granted: false,
        message: 'Notifications are not supported by this browser'
      }
    }

    if (this.permission === 'granted') {
      return {
        granted: true,
        message: 'Notification permission already granted'
      }
    }

    try {
      // Show explanation before requesting permission
      const userConfirmed = await this.showPermissionExplanation()
      
      if (!userConfirmed) {
        return {
          granted: false,
          message: 'Permission request cancelled by user'
        }
      }

      // Request permission
      this.permission = await Notification.requestPermission()
      
      const result = {
        granted: this.permission === 'granted',
        message: this.getPermissionMessage(this.permission)
      }

      if (result.granted) {
        await this.scheduleDefaultReminders()
      }

      return result
    } catch (error) {
      console.error('🔔 Permission request failed:', error)
      return {
        granted: false,
        message: 'Failed to request notification permission'
      }
    }
  }

  /**
   * Show permission explanation dialog
   */
  async showPermissionExplanation() {
    return new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            background: white;
            border-radius: 16px;
            padding: 24px;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          ">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 20px;">
                Enable Meal Reminders
              </h3>
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">
                Get helpful reminders to log your meals and stay on track with your nutrition goals.
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="margin-right: 8px;">🍽️</span>
                <span style="font-size: 14px;">Meal logging reminders</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="margin-right: 8px;">💧</span>
                <span style="font-size: 14px;">Hydration reminders</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">🎯</span>
                <span style="font-size: 14px;">Goal achievement celebrations</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 12px;">
              <button id="notification-deny" style="
                flex: 1;
                padding: 12px;
                border: 1px solid #ddd;
                background: white;
                color: #666;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
              ">Not Now</button>
              <button id="notification-allow" style="
                flex: 1;
                padding: 12px;
                border: none;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
              ">Enable Notifications</button>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      modal.querySelector('#notification-allow').addEventListener('click', () => {
        document.body.removeChild(modal)
        resolve(true)
      })

      modal.querySelector('#notification-deny').addEventListener('click', () => {
        document.body.removeChild(modal)
        resolve(false)
      })
    })
  }

  /**
   * Get user-friendly permission message
   */
  getPermissionMessage(permission) {
    switch (permission) {
      case 'granted':
        return 'Notifications enabled! You\'ll receive helpful meal reminders.'
      case 'denied':
        return 'Notifications blocked. You can enable them in browser settings.'
      case 'default':
        return 'Notification permission not yet granted.'
      default:
        return 'Unknown notification permission state.'
    }
  }

  /**
   * Schedule default meal reminders
   */
  async scheduleDefaultReminders() {
    const defaultSchedules = [
      {
        id: 'breakfast-reminder',
        type: 'meal',
        meal: 'breakfast',
        time: '08:00',
        enabled: true,
        message: 'Good morning! Don\'t forget to log your breakfast 🥞'
      },
      {
        id: 'lunch-reminder',
        type: 'meal',
        meal: 'lunch',
        time: '12:30',
        enabled: true,
        message: 'Lunch time! Remember to track your meal 🥗'
      },
      {
        id: 'dinner-reminder',
        type: 'meal',
        meal: 'dinner',
        time: '18:30',
        enabled: true,
        message: 'Dinner time! Log your evening meal 🍽️'
      },
      {
        id: 'water-reminder',
        type: 'hydration',
        time: '14:00',
        enabled: true,
        message: 'Stay hydrated! Have you had enough water today? 💧'
      }
    ]

    for (const schedule of defaultSchedules) {
      await this.scheduleNotification(schedule)
    }
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(schedule) {
    try {
      if (this.permission !== 'granted') {
        console.warn('🔔 Cannot schedule notification: permission not granted')
        return false
      }

      // Save schedule to database
      await offlineStorage.db.transaction('notifications', 'readwrite')
        .objectStore('notifications')
        .put({
          ...schedule,
          createdAt: new Date().toISOString(),
          lastScheduled: new Date().toISOString()
        })

      // Calculate next notification time
      const nextTime = this.calculateNextNotificationTime(schedule.time)
      
      // Store in memory for quick access
      this.reminderSchedules.set(schedule.id, {
        ...schedule,
        nextTime
      })

      // Schedule the notification
      this.scheduleNextNotification(schedule.id)

      console.log(`🔔 Scheduled notification: ${schedule.id} at ${schedule.time}`)
      return true
    } catch (error) {
      console.error('🔔 Failed to schedule notification:', error)
      return false
    }
  }

  /**
   * Calculate next notification time
   */
  calculateNextNotificationTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    const now = new Date()
    const notificationTime = new Date()
    
    notificationTime.setHours(hours, minutes, 0, 0)
    
    // If time has passed today, schedule for tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1)
    }
    
    return notificationTime
  }

  /**
   * Schedule next notification using setTimeout
   */
  scheduleNextNotification(scheduleId) {
    const schedule = this.reminderSchedules.get(scheduleId)
    if (!schedule || !schedule.enabled) return

    const now = new Date()
    const delay = schedule.nextTime.getTime() - now.getTime()

    // Maximum setTimeout delay is about 24 days
    if (delay > 0 && delay <= 2147483647) {
      const timeoutId = setTimeout(() => {
        this.triggerNotification(schedule)
        
        // Schedule next occurrence (tomorrow)
        schedule.nextTime = this.calculateNextNotificationTime(schedule.time)
        this.scheduleNextNotification(scheduleId)
      }, delay)

      // Store timeout ID for potential cancellation
      this.activeNotifications.set(scheduleId, timeoutId)
    }
  }

  /**
   * Trigger a notification
   */
  async triggerNotification(schedule) {
    try {
      if (this.permission !== 'granted') return

      const notification = new Notification(this.getNotificationTitle(schedule), {
        body: schedule.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        image: this.getNotificationImage(schedule),
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        tag: schedule.id,
        data: {
          scheduleId: schedule.id,
          type: schedule.type,
          meal: schedule.meal,
          url: this.getNotificationUrl(schedule)
        },
        actions: this.getNotificationActions(schedule)
      })

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close()
      }, 10000)

      // Track notification display
      this.trackNotification(schedule, 'displayed')

      console.log(`🔔 Notification triggered: ${schedule.id}`)
    } catch (error) {
      console.error('🔔 Failed to trigger notification:', error)
    }
  }

  /**
   * Get notification title based on type
   */
  getNotificationTitle(schedule) {
    switch (schedule.type) {
      case 'meal':
        return `${schedule.meal.charAt(0).toUpperCase() + schedule.meal.slice(1)} Reminder`
      case 'hydration':
        return 'Hydration Reminder'
      case 'workout':
        return 'Workout Reminder'
      case 'goal':
        return 'Goal Check-in'
      default:
        return 'Fitness Tracker'
    }
  }

  /**
   * Get notification image
   */
  getNotificationImage(schedule) {
    const images = {
      meal: '/icons/meal-notification.png',
      hydration: '/icons/water-notification.png',
      workout: '/icons/workout-notification.png',
      goal: '/icons/goal-notification.png'
    }
    
    return images[schedule.type] || '/icons/icon-192x192.png'
  }

  /**
   * Get notification URL
   */
  getNotificationUrl(schedule) {
    switch (schedule.type) {
      case 'meal':
        return `/#/nutrition?reminder=${schedule.meal}`
      case 'hydration':
        return '/#/nutrition?tab=water'
      case 'workout':
        return '/#/activity'
      default:
        return '/#/dashboard'
    }
  }

  /**
   * Get notification actions
   */
  getNotificationActions(schedule) {
    const baseActions = [
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]

    switch (schedule.type) {
      case 'meal':
        return [
          {
            action: 'log-meal',
            title: `Log ${schedule.meal}`,
            icon: '/icons/meal-icon.png'
          },
          ...baseActions
        ]
      case 'hydration':
        return [
          {
            action: 'log-water',
            title: 'Log Water',
            icon: '/icons/water-icon.png'
          },
          ...baseActions
        ]
      default:
        return baseActions
    }
  }

  /**
   * Setup notification click handling
   */
  setupNotificationHandling() {
    // Handle notification clicks in main thread
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-click') {
          this.handleNotificationClick(event.data)
        }
      })
    }
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(data) {
    const { action, scheduleId, url } = data

    // Track interaction
    this.trackNotification({ id: scheduleId }, 'clicked', action)

    // Handle different actions
    switch (action) {
      case 'log-meal':
        window.location.hash = url
        // Could also trigger meal logging modal
        break
      case 'log-water':
        window.location.hash = url
        // Could also increment water counter
        break
      case 'dismiss':
        // Just close notification
        break
      default:
        // Default action - open app
        window.location.hash = url || '/#/dashboard'
    }
  }

  /**
   * Create custom notification for goals/achievements
   */
  async showAchievementNotification(achievement) {
    if (this.permission !== 'granted') return

    const notification = new Notification('🎉 Achievement Unlocked!', {
      body: achievement.message,
      icon: '/icons/achievement-icon.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      tag: `achievement-${achievement.id}`,
      data: {
        type: 'achievement',
        achievementId: achievement.id,
        url: '/#/dashboard?tab=achievements'
      }
    })

    this.trackNotification(achievement, 'achievement-shown')
  }

  /**
   * Show water reminder notification
   */
  async showWaterReminder() {
    if (this.permission !== 'granted') return

    const notification = new Notification('💧 Stay Hydrated!', {
      body: 'You haven\'t logged water in a while. Stay hydrated!',
      icon: '/icons/water-icon.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      tag: 'water-reminder',
      data: {
        type: 'water-reminder',
        url: '/#/nutrition?action=water'
      },
      actions: [
        {
          action: 'log-water',
          title: 'Log Water',
          icon: '/icons/water-icon.png'
        }
      ]
    })
  }

  /**
   * Update notification schedule
   */
  async updateNotificationSchedule(scheduleId, updates) {
    try {
      // Clear existing timeout
      const timeoutId = this.activeNotifications.get(scheduleId)
      if (timeoutId) {
        clearTimeout(timeoutId)
        this.activeNotifications.delete(scheduleId)
      }

      // Update in database
      const transaction = offlineStorage.db.transaction('notifications', 'readwrite')
      const store = transaction.objectStore('notifications')
      const existing = await store.get(scheduleId)

      if (existing) {
        const updated = { ...existing, ...updates }
        await store.put(updated)

        // Update in memory
        this.reminderSchedules.set(scheduleId, {
          ...updated,
          nextTime: this.calculateNextNotificationTime(updated.time)
        })

        // Reschedule if enabled
        if (updated.enabled) {
          this.scheduleNextNotification(scheduleId)
        }
      }

      console.log(`🔔 Updated notification schedule: ${scheduleId}`)
    } catch (error) {
      console.error('🔔 Failed to update notification schedule:', error)
    }
  }

  /**
   * Cancel notification schedule
   */
  async cancelNotificationSchedule(scheduleId) {
    try {
      // Clear timeout
      const timeoutId = this.activeNotifications.get(scheduleId)
      if (timeoutId) {
        clearTimeout(timeoutId)
        this.activeNotifications.delete(scheduleId)
      }

      // Remove from memory
      this.reminderSchedules.delete(scheduleId)

      // Remove from database
      await offlineStorage.db.transaction('notifications', 'readwrite')
        .objectStore('notifications')
        .delete(scheduleId)

      console.log(`🔔 Cancelled notification schedule: ${scheduleId}`)
    } catch (error) {
      console.error('🔔 Failed to cancel notification schedule:', error)
    }
  }

  /**
   * Load notification schedules from database
   */
  async loadNotificationSchedules() {
    try {
      const transaction = offlineStorage.db.transaction('notifications', 'readonly')
      const store = transaction.objectStore('notifications')
      const schedules = await store.getAll()

      for (const schedule of schedules) {
        if (schedule.enabled) {
          this.reminderSchedules.set(schedule.id, {
            ...schedule,
            nextTime: this.calculateNextNotificationTime(schedule.time)
          })
          
          this.scheduleNextNotification(schedule.id)
        }
      }

      console.log(`🔔 Loaded ${schedules.length} notification schedules`)
    } catch (error) {
      console.error('🔔 Failed to load notification schedules:', error)
    }
  }

  /**
   * Get all notification schedules
   */
  async getNotificationSchedules() {
    try {
      const transaction = offlineStorage.db.transaction('notifications', 'readonly')
      const store = transaction.objectStore('notifications')
      return await store.getAll()
    } catch (error) {
      console.error('🔔 Failed to get notification schedules:', error)
      return []
    }
  }

  /**
   * Track notification analytics
   */
  trackNotification(schedule, event, action = null) {
    try {
      // Track with analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', 'notification_' + event, {
          event_category: 'engagement',
          event_label: schedule.type || 'unknown',
          custom_parameter_1: action,
          custom_parameter_2: schedule.id
        })
      }

      console.log(`📊 Notification tracked: ${event} - ${schedule.id}`)
    } catch (error) {
      console.error('📊 Failed to track notification:', error)
    }
  }

  /**
   * Check if notifications are supported and enabled
   */
  getStatus() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.permission === 'granted',
      activeSchedules: this.reminderSchedules.size,
      canSchedule: this.isSupported && this.permission === 'granted'
    }
  }
}

export default new NotificationService()