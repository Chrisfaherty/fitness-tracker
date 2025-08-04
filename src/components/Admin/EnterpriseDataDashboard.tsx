import React, { useState, useEffect } from 'react'
import {
  Shield, Database, Zap, AlertTriangle, CheckCircle, 
  XCircle, Activity, BarChart3, RefreshCw, Download,
  Settings, Server, HardDrive, Clock, Users, TrendingUp,
  Bug, Wrench, AlertCircle, Play, Square, Pause
} from 'lucide-react'
import { enterpriseDataService } from '../../services/enterpriseDataService'

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'error' | 'unknown'
  backup: 'healthy' | 'degraded' | 'error' | 'unknown'  
  validation: 'healthy' | 'degraded' | 'error' | 'unknown'
  performance: 'healthy' | 'degraded' | 'error' | 'unknown'
}

interface SystemStatus {
  timestamp: string
  initialized: boolean
  services: {
    backup: any
    validation: any
    performance: any
  }
  health: HealthStatus
}

const EnterpriseDataDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'backup' | 'validation' | 'performance' | 'monitoring'>('overview')
  const [healthAlerts, setHealthAlerts] = useState<any[]>([])
  const [lastIntegrityCheck, setLastIntegrityCheck] = useState<any>(null)

  useEffect(() => {
    loadSystemStatus()
    
    // Subscribe to health alerts
    const unsubscribe = enterpriseDataService.subscribeToHealthAlerts((alert) => {
      setHealthAlerts(prev => [alert, ...prev.slice(0, 9)]) // Keep last 10 alerts
    })

    // Set up periodic status updates
    const interval = setInterval(loadSystemStatus, 30000) // Every 30 seconds

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadSystemStatus = async () => {
    try {
      const status = enterpriseDataService.getSystemStatus()
      setSystemStatus(status)
    } catch (error) {
      console.error('Failed to load system status:', error)
    } finally {
      setLoading(false)
    }
  }

  const runIntegrityCheck = async () => {
    setLoading(true)
    try {
      const result = await enterpriseDataService.performDataIntegrityCheck()
      setLastIntegrityCheck(result)
    } catch (error) {
      console.error('Integrity check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const optimizeServices = async () => {
    setLoading(true)
    try {
      await enterpriseDataService.optimizeAllServices()
      await loadSystemStatus()
    } catch (error) {
      console.error('Service optimization failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const emergencyRecovery = async () => {
    if (!confirm('This will perform emergency data recovery. Continue?')) return
    
    setLoading(true)
    try {
      const result = await enterpriseDataService.emergencyDataRecovery()
      alert(result.success ? 'Recovery completed successfully' : `Recovery failed: ${result.errors.join(', ')}`)
      await loadSystemStatus()
    } catch (error) {
      console.error('Emergency recovery failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading && !systemStatus) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enterprise Data Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage enterprise-grade data services
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadSystemStatus}
            disabled={loading}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={runIntegrityCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Shield className="h-4 w-4 mr-2 inline" />
            Integrity Check
          </button>
          
          <button
            onClick={optimizeServices}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Zap className="h-4 w-4 mr-2 inline" />
            Optimize
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Health */}
          <div className={`p-6 rounded-lg border-2 ${getHealthColor(systemStatus.health.overall)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getHealthIcon(systemStatus.health.overall)}
                <span className="font-semibold">Overall Health</span>
              </div>
            </div>
            <div className="text-2xl font-bold capitalize">
              {systemStatus.health.overall}
            </div>
            <div className="text-sm opacity-75 mt-1">
              System Status
            </div>
          </div>

          {/* Backup Service */}
          <div className={`p-6 rounded-lg border-2 ${getHealthColor(systemStatus.health.backup)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5" />
                <span className="font-semibold">Backup</span>
              </div>
              {getHealthIcon(systemStatus.health.backup)}
            </div>
            {systemStatus.services.backup && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Total: </span>
                  {systemStatus.services.backup.totalBackups}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Success Rate: </span>
                  {((systemStatus.services.backup.successfulBackups / Math.max(1, systemStatus.services.backup.totalBackups)) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Validation Service */}
          <div className={`p-6 rounded-lg border-2 ${getHealthColor(systemStatus.health.validation)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Validation</span>
              </div>
              {getHealthIcon(systemStatus.health.validation)}
            </div>
            {systemStatus.services.validation && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Total Checks: </span>
                  {systemStatus.services.validation.totalValidations}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Auto Fixes: </span>
                  {systemStatus.services.validation.autoFixes}
                </div>
              </div>
            )}
          </div>

          {/* Performance Service */}
          <div className={`p-6 rounded-lg border-2 ${getHealthColor(systemStatus.health.performance)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">Performance</span>
              </div>
              {getHealthIcon(systemStatus.health.performance)}
            </div>
            {systemStatus.services.performance && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Avg Query: </span>
                  {systemStatus.services.performance.avgQueryTime?.toFixed(1) || 0}ms
                </div>
                <div className="text-sm">
                  <span className="font-medium">Cache Hit: </span>
                  {(((systemStatus.services.performance.cacheHits || 0) / Math.max(1, (systemStatus.services.performance.cacheHits || 0) + (systemStatus.services.performance.cacheMisses || 0))) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Alerts */}
      {healthAlerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Recent Health Alerts</h3>
          </div>
          
          <div className="space-y-2">
            {healthAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                <span className="font-medium">{new Date(alert.timestamp).toLocaleTimeString()}: </span>
                {alert.recommendation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'backup', label: 'Backup', icon: Database },
            { id: 'validation', label: 'Validation', icon: Shield },
            { id: 'performance', label: 'Performance', icon: Zap },
            { id: 'monitoring', label: 'Monitoring', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && lastIntegrityCheck && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Status */}
            {lastIntegrityCheck.backup && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Backup Status
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Available Backups:</span>
                    <span className="font-medium">{lastIntegrityCheck.backup.availableBackups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Latest Backup:</span>
                    <span className="font-medium">
                      {lastIntegrityCheck.backup.latestBackup 
                        ? new Date(lastIntegrityCheck.backup.latestBackup).toLocaleDateString()
                        : 'None'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`font-medium capitalize ${
                      lastIntegrityCheck.backup.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {lastIntegrityCheck.backup.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Status */}
            {lastIntegrityCheck.validation && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Validation Status
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Checks:</span>
                    <span className="font-medium">{lastIntegrityCheck.validation.totalChecks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Failed Checks:</span>
                    <span className="font-medium text-red-600">{lastIntegrityCheck.validation.failedChecks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duplicates Found:</span>
                    <span className="font-medium text-yellow-600">{lastIntegrityCheck.validation.duplicatesFound}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`font-medium capitalize ${
                      lastIntegrityCheck.validation.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {lastIntegrityCheck.validation.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Status */}
            {lastIntegrityCheck.performance && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Performance Status
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Query Time:</span>
                    <span className="font-medium">{lastIntegrityCheck.performance.avgQueryTime?.toFixed(1) || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate:</span>
                    <span className="font-medium">{(lastIntegrityCheck.performance.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Memory Usage:</span>
                    <span className="font-medium">{formatBytes(lastIntegrityCheck.performance.memoryUsage || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`font-medium capitalize ${
                      lastIntegrityCheck.performance.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {lastIntegrityCheck.performance.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {lastIntegrityCheck.recommendations && lastIntegrityCheck.recommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  Recommendations
                </h3>
                
                <div className="space-y-2">
                  {lastIntegrityCheck.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Monitoring</h3>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={emergencyRecovery}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Emergency Recovery
                </button>
              </div>
            </div>

            {/* System Info */}
            {systemStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">System Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Initialized:</span>
                      <span className={systemStatus.initialized ? 'text-green-600' : 'text-red-600'}>
                        {systemStatus.initialized ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
                      <span className="font-medium">
                        {new Date(systemStatus.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Active Services</h4>
                  <div className="space-y-2">
                    {Object.entries(systemStatus.services).map(([name, service]) => (
                      <div key={name} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${service ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="capitalize">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Backup Enabled:</span>
                      <span className={systemStatus.config.enableBackup ? 'text-green-600' : 'text-gray-600'}>
                        {systemStatus.config.enableBackup ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Validation Enabled:</span>
                      <span className={systemStatus.config.enableValidation ? 'text-green-600' : 'text-gray-600'}>
                        {systemStatus.config.enableValidation ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Performance Enabled:</span>
                      <span className={systemStatus.config.enablePerformance ? 'text-green-600' : 'text-gray-600'}>
                        {systemStatus.config.enablePerformance ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EnterpriseDataDashboard