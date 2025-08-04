import React, { useState, useEffect } from 'react'
import {
  Bell, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  Mail, Phone, Calendar, Award, Target, Activity, Heart, Utensils,
  User, Settings, Filter, RefreshCw, X, Eye, EyeOff, MessageSquare,
  Zap, Star, Flag, AlertCircle, Info
} from 'lucide-react'
import { trainerWorkflowService } from '../../services/trainerWorkflowService'

interface NotificationDashboardProps {
  clientId?: string
}

interface Alert {
  id: string
  type: string
  level: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  data?: any
  actions?: string[]
}

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

interface Milestone {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  celebrationLevel: 'minor' | 'significant' | 'major'
  celebrated: boolean
  data?: any
}

const NotificationDashboard: React.FC<NotificationDashboardProps> = ({ clientId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications' | 'milestones' | 'analytics'>('alerts')
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadDashboardData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [clientId])

  const loadDashboardData = async () => {
    try {
      const [alertsData, notificationsData, milestonesData] = await Promise.all([
        trainerWorkflowService.getAlerts(),
        trainerWorkflowService.getNotifications(),
        trainerWorkflowService.getMilestones()
      ])
      
      setAlerts(alertsData)
      setNotifications(notificationsData)
      setMilestones(milestonesData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      await trainerWorkflowService.acknowledgeAlert(alertId)
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ))
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const handleNotificationRead = async (notificationId: string) => {
    try {
      await trainerWorkflowService.markNotificationRead(notificationId)
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId ? { ...notification, read: true } : notification
      ))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const getFilteredAlerts = () => {
    let filtered = alerts
    
    switch (filter) {
      case 'unread':
        filtered = alerts.filter(alert => !alert.acknowledged)
        break
      case 'critical':
        filtered = alerts.filter(alert => alert.level === 'critical')
        break
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const getFilteredNotifications = () => {
    let filtered = notifications
    
    if (filter === 'unread') {
      filtered = notifications.filter(notification => !notification.read)
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const getAlertIcon = (type: string) => {
    const icons = {
      missed_days: Clock,
      macro_adherence: Utensils,
      sleep_quality: Heart,
      workout_frequency: Activity,
      weight_change: Target,
      engagement: User,
      system: Settings
    }
    return icons[type as keyof typeof icons] || AlertTriangle
  }

  const getAlertColor = (level: string) => {
    const colors = {
      critical: 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700',
      warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700',
      info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
    }
    return colors[level as keyof typeof colors] || colors.info
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      success: CheckCircle,
      warning: AlertTriangle,
      info: Info,
      error: AlertCircle
    }
    return icons[type as keyof typeof icons] || Info
  }

  const getNotificationColor = (type: string) => {
    const colors = {
      success: 'text-green-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
      error: 'text-red-600'
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  const getMilestoneIcon = (type: string) => {
    const icons = {
      weight_loss: Target,
      streak: Calendar,
      goal_completion: Award,
      perfect_nutrition: Utensils,
      workout_milestone: Activity
    }
    return icons[type as keyof typeof icons] || Award
  }

  const getMilestoneColor = (level: string) => {
    const colors = {
      minor: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      significant: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      major: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
    }
    return colors[level as keyof typeof colors] || colors.minor
  }

  const criticalAlerts = alerts.filter(alert => alert.level === 'critical' && !alert.acknowledged)
  const unreadNotifications = notifications.filter(notification => !notification.read)
  const recentMilestones = milestones.filter(milestone => 
    new Date(milestone.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )

  const tabs = [
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: AlertTriangle, 
      count: criticalAlerts.length,
      color: criticalAlerts.length > 0 ? 'text-red-600' : 'text-gray-600'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell, 
      count: unreadNotifications.length,
      color: unreadNotifications.length > 0 ? 'text-blue-600' : 'text-gray-600'
    },
    { 
      id: 'milestones', 
      label: 'Milestones', 
      icon: Award, 
      count: recentMilestones.length,
      color: recentMilestones.length > 0 ? 'text-green-600' : 'text-gray-600'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: TrendingUp, 
      count: 0,
      color: 'text-gray-600'
    }
  ]

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trainer Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor client progress and receive automated alerts
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Items</option>
            <option value="unread">Unread Only</option>
            <option value="critical">Critical Only</option>
          </select>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Refresh */}
          <button
            onClick={loadDashboardData}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Immediate Attention
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                These issues need urgent trainer intervention to prevent client disengagement
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {criticalAlerts.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Critical Alerts</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadNotifications.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">New Notifications</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {recentMilestones.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Recent Milestones</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                85%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Engagement Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${tab.color}`} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    tab.id === 'alerts' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                    tab.id === 'notifications' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {getFilteredAlerts().length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Clear!</h3>
                <p className="text-gray-500 dark:text-gray-400">No active alerts at this time.</p>
              </div>
            ) : (
              getFilteredAlerts().map((alert) => {
                const AlertIcon = getAlertIcon(alert.type)
                const alertColor = getAlertColor(alert.level)
                
                return (
                  <div key={alert.id} className={`border rounded-lg p-4 ${alertColor}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <AlertIcon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {alert.title}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.level === 'critical' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                            alert.level === 'warning' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                            'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          }`}>
                            {alert.level.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {alert.message}
                        </p>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        
                        {alert.actions && alert.actions.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Recommended Actions:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {alert.actions.map((action, index) => (
                                <button
                                  key={index}
                                  className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                  {action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAlertAcknowledge(alert.id)}
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                          >
                            Acknowledge Alert
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {getFilteredNotifications().length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Notifications</h3>
                <p className="text-gray-500 dark:text-gray-400">All caught up! No new notifications.</p>
              </div>
            ) : (
              getFilteredNotifications().map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.type)
                const iconColor = getNotificationColor(notification.type)
                
                return (
                  <div 
                    key={notification.id} 
                    className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
                      notification.read ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <NotificationIcon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-medium ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => handleNotificationRead(notification.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {notification.read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        <p className={`text-sm ${notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            {milestones.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Milestones Yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Client milestones will appear here when achieved.</p>
              </div>
            ) : (
              milestones.map((milestone) => {
                const MilestoneIcon = getMilestoneIcon(milestone.type)
                const milestoneColor = getMilestoneColor(milestone.celebrationLevel)
                
                return (
                  <div key={milestone.id} className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${milestoneColor}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`p-3 rounded-full ${milestoneColor}`}>
                          <MilestoneIcon className="h-6 w-6" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {milestone.title}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            milestone.celebrationLevel === 'major' ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200' :
                            milestone.celebrationLevel === 'significant' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
                            'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          }`}>
                            {milestone.celebrationLevel.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {milestone.message}
                        </p>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Achieved on {new Date(milestone.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Star className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alert Trends</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">This Week</span>
                    <span className="font-medium text-gray-900 dark:text-white">{alerts.filter(a => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Critical</span>
                    <span className="font-medium text-red-600">{alerts.filter(a => a.level === 'critical').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Resolved</span>
                    <span className="font-medium text-green-600">{alerts.filter(a => a.acknowledged).length}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Milestone Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">This Month</span>
                    <span className="font-medium text-gray-900 dark:text-white">{milestones.filter(m => new Date(m.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Major Achievements</span>
                    <span className="font-medium text-purple-600">{milestones.filter(m => m.celebrationLevel === 'major').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Celebration Rate</span>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Email Alerts</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Push Notifications</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Milestone Celebrations</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Weekly Reports</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationDashboard