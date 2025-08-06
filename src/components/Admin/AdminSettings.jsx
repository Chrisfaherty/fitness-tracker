import { useState, useEffect } from 'react'
import { Save, Shield, Bell, Database, Download, Trash2, RefreshCw } from 'lucide-react'
import authService from '../../services/auth/authService'
import storageService from '../../services/storage'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // Security settings
    sessionTimeout: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    requirePasswordChange: 90,
    
    // Notification settings
    emailNotifications: true,
    clientRegistrationNotify: true,
    inactiveClientAlert: true,
    systemMaintenanceNotify: true,
    
    // Data settings
    dataRetentionDays: 365,
    autoBackup: true,
    backupFrequency: 'weekly',
    
    // System settings
    allowClientSelfRegistration: false,
    defaultClientRole: 'client',
    requireEmailVerification: true
  })
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkoutPlans: 0,
    totalFoodPlans: 0,
    totalAuthLogs: 0,
    storageUsed: '0 MB'
  })
  
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await storageService.get('adminSettings')
      if (savedSettings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...savedSettings
        }))
      }
    } catch (error) {
      console.error('Error loading admin settings:', error)
    }
  }

  const loadStats = async () => {
    try {
      const users = await storageService.getAll('users') || []
      const workoutPlans = await storageService.getAll('workoutPlans') || []
      const foodPlans = await storageService.getAll('foodPlans') || []
      const authLogs = await storageService.getAll('authLogs') || []
      
      // Calculate approximate storage usage
      const totalData = JSON.stringify({ users, workoutPlans, foodPlans, authLogs })
      const sizeInBytes = new Blob([totalData]).size
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
      
      setStats({
        totalUsers: users.length,
        totalWorkoutPlans: workoutPlans.length,
        totalFoodPlans: foodPlans.length,
        totalAuthLogs: authLogs.length,
        storageUsed: `${sizeInMB} MB`
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      await storageService.save('adminSettings', settings)
      setMessage('Settings saved successfully!')
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      const users = await storageService.getAll('users') || []
      const workoutPlans = await storageService.getAll('workoutPlans') || []
      const foodPlans = await storageService.getAll('foodPlans') || []
      const authLogs = await storageService.getAll('authLogs') || []
      
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          users: users.map(user => {
            const { password, ...safeUser } = user
            return safeUser
          }),
          workoutPlans,
          foodPlans,
          authLogs
        }
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      
      setMessage('Data exported successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error exporting data:', error)
      setMessage('Error exporting data. Please try again.')
    }
  }

  const handleClearAuthLogs = async () => {
    if (confirm('Are you sure you want to clear all authentication logs? This action cannot be undone.')) {
      try {
        await storageService.clear('authLogs')
        await loadStats()
        setMessage('Authentication logs cleared successfully!')
        setTimeout(() => setMessage(''), 3000)
      } catch (error) {
        console.error('Error clearing auth logs:', error)
        setMessage('Error clearing logs. Please try again.')
      }
    }
  }

  const handleClearOldData = async () => {
    if (confirm('Are you sure you want to clear data older than the retention period? This action cannot be undone.')) {
      try {
        const retentionDate = new Date()
        retentionDate.setDate(retentionDate.getDate() - settings.dataRetentionDays)
        
        // Clear old auth logs
        const authLogs = await storageService.getAll('authLogs') || []
        const recentLogs = authLogs.filter(log => 
          new Date(log.timestamp) > retentionDate
        )
        
        await storageService.clear('authLogs')
        for (const log of recentLogs) {
          await storageService.save('authLogs', log, log.id || `${log.event}_${log.timestamp}`)
        }
        
        await loadStats()
        setMessage('Old data cleared successfully!')
        setTimeout(() => setMessage(''), 3000)
      } catch (error) {
        console.error('Error clearing old data:', error)
        setMessage('Error clearing old data. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Administrator Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure system settings and manage application data
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
        }`}>
          {message}
        </div>
      )}

      {/* System Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Database size={20} className="mr-2" />
          System Statistics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {stats.totalUsers}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats.totalWorkoutPlans}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Workout Plans</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
              {stats.totalFoodPlans}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Food Plans</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
              {stats.totalAuthLogs}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Auth Logs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {stats.storageUsed}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield size={20} className="mr-2" />
            Security Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Timeout (hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 8)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.lockoutDuration}
                onChange={(e) => handleSettingChange('lockoutDuration', parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password Change Required (days)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={settings.requirePasswordChange}
                onChange={(e) => handleSettingChange('requirePasswordChange', parseInt(e.target.value) || 90)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell size={20} className="mr-2" />
            Notification Settings
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable email notifications
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.clientRegistrationNotify}
                onChange={(e) => handleSettingChange('clientRegistrationNotify', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Notify on new client registration
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.inactiveClientAlert}
                onChange={(e) => handleSettingChange('inactiveClientAlert', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Alert for inactive clients (30+ days)
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemMaintenanceNotify}
                onChange={(e) => handleSettingChange('systemMaintenanceNotify', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                System maintenance notifications
              </span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Database size={20} className="mr-2" />
            Data Management
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="30"
                max="1095"
                value={settings.dataRetentionDays}
                onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value) || 365)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable automatic backups
              </span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="pt-4 space-y-3">
              <button
                onClick={handleExportData}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Export All Data</span>
              </button>
              
              <button
                onClick={handleClearAuthLogs}
                className="w-full btn-outline-red flex items-center justify-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Clear Auth Logs</span>
              </button>
              
              <button
                onClick={handleClearOldData}
                className="w-full btn-outline-red flex items-center justify-center space-x-2"
              >
                <RefreshCw size={16} />
                <span>Clear Old Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            System Settings
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowClientSelfRegistration}
                onChange={(e) => handleSettingChange('allowClientSelfRegistration', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Allow client self-registration
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Require email verification
              </span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Client Role
              </label>
              <select
                value={settings.defaultClientRole}
                onChange={(e) => handleSettingChange('defaultClientRole', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="client">Client</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  )
}

export default AdminSettings