import React, { useState, useEffect } from 'react'
import {
  FileText, Download, Mail, Calendar, TrendingUp, Target,
  User, Activity, Heart, Zap, Scale, Moon, Utensils, Camera,
  BarChart3, PieChart, LineChart, AlertCircle, CheckCircle,
  Clock, Award, Filter, RefreshCw
} from 'lucide-react'
import { trainerReportService } from '../../services/trainerReportService'
import { exportService } from '../../services/exportService'
import MacroAdherenceChart from './charts/MacroAdherenceChart'
import WeightTrendsChart from './charts/WeightTrendsChart'
import SleepPatternsChart from './charts/SleepPatternsChart'
import ComplianceDashboard from './ComplianceDashboard'
import ProgressPhotosGallery from './ProgressPhotosGallery'
import GoalTrackingVisuals from './GoalTrackingVisuals'

interface TrainerDashboardProps {
  clientId?: string
}

interface ReportData {
  reportId: string
  generatedAt: string
  period: {
    startDate: string
    endDate: string
    weekNumber: number
    year: number
  }
  client: {
    id: string
    name: string
    age: number
    currentWeight: number
    goalWeight: number
    activityLevel: string
  }
  summary: any
  detailed: any
  recommendations: any[]
  charts: any
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ clientId }) => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('current_week')
  const [activeTab, setActiveTab] = useState('overview')
  const [exportLoading, setExportLoading] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    loadReportData()
  }, [selectedPeriod, clientId])

  const loadReportData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { startDate, endDate } = getPeriodDates(selectedPeriod)
      const report = await trainerReportService.generateWeeklySummary(
        startDate,
        endDate,
        clientId
      )
      setReportData(report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data')
      console.error('Failed to load trainer dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodDates = (period: string) => {
    const today = new Date()
    let startDate: string
    let endDate: string

    switch (period) {
      case 'current_week':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
        startDate = startOfWeek.toISOString().split('T')[0]
        endDate = endOfWeek.toISOString().split('T')[0]
        break
      case 'last_week':
        const lastWeekStart = new Date(today.setDate(today.getDate() - today.getDay() - 7))
        const lastWeekEnd = new Date(today.setDate(today.getDate() - today.getDay() - 1))
        startDate = lastWeekStart.toISOString().split('T')[0]
        endDate = lastWeekEnd.toISOString().split('T')[0]
        break
      case 'last_30_days':
        const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30))
        startDate = thirtyDaysAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
        break
      default:
        startDate = new Date().toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
    }

    return { startDate, endDate }
  }

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!reportData) return

    setExportLoading(prev => ({ ...prev, [format]: true }))

    try {
      let result
      switch (format) {
        case 'pdf':
          result = await exportService.exportToPDF(reportData)
          break
        case 'csv':
          result = await exportService.exportToCSV(reportData)
          break
        case 'json':
          result = await exportService.exportToJSON(reportData)
          break
      }

      if (result.success) {
        exportService.downloadFile(
          result.data,
          result.fileName,
          exportService.getContentType(format)
        )
      } else {
        console.error(`Failed to export ${format}:`, result.error)
      }
    } catch (error) {
      console.error(`Export ${format} failed:`, error)
    } finally {
      setExportLoading(prev => ({ ...prev, [format]: false }))
    }
  }

  const handleEmailReport = async () => {
    if (!reportData) return

    setExportLoading(prev => ({ ...prev, email: true }))

    try {
      // In a real implementation, you'd get the trainer email from user settings
      const trainerEmail = 'trainer@example.com'
      const result = await exportService.emailToTrainer(reportData, trainerEmail)

      if (result.success) {
        console.log('Report emailed successfully')
      } else {
        console.error('Failed to email report:', result.error)
      }
    } catch (error) {
      console.error('Email failed:', error)
    } finally {
      setExportLoading(prev => ({ ...prev, email: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={loadReportData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Report Data</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available for the selected period.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'wellness', label: 'Wellness', icon: Heart },
    { id: 'body', label: 'Body Comp', icon: Scale },
    { id: 'compliance', label: 'Compliance', icon: Target },
    { id: 'photos', label: 'Progress', icon: Camera }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trainer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {reportData.client.name} • Week {reportData.period.weekNumber}, {reportData.period.year}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="current_week">Current Week</option>
            <option value="last_week">Last Week</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exportLoading.pdf}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {exportLoading.pdf ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              PDF
            </button>

            <button
              onClick={() => handleExport('csv')}
              disabled={exportLoading.csv}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {exportLoading.csv ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              CSV
            </button>

            <button
              onClick={() => handleExport('json')}
              disabled={exportLoading.json}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {exportLoading.json ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              JSON
            </button>

            <button
              onClick={handleEmailReport}
              disabled={exportLoading.email}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {exportLoading.email ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Email
            </button>
          </div>

          <button
            onClick={loadReportData}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Macro Adherence"
          value={reportData.summary.macroAdherence.available
            ? `${Object.values(reportData.summary.macroAdherence.adherence).reduce((sum: number, val: number) => sum + val, 0) / 4}%`
            : 'N/A'
          }
          change={reportData.summary.macroAdherence.available ? '+5%' : ''}
          changeType="positive"
          icon={Utensils}
          status={reportData.summary.macroAdherence.available ? 'good' : 'warning'}
        />

        <MetricCard
          title="Weight Change"
          value={reportData.summary.weightTrends.available
            ? `${reportData.summary.weightTrends.weightChange > 0 ? '+' : ''}${reportData.summary.weightTrends.weightChange.toFixed(1)} lbs`
            : 'N/A'
          }
          change={reportData.summary.weightTrends.available ? `${reportData.summary.weightTrends.weightChangePercent.toFixed(1)}%` : ''}
          changeType={reportData.summary.weightTrends.available && reportData.summary.weightTrends.weightChange < 0 ? 'positive' : 'neutral'}
          icon={Scale}
          status={reportData.summary.weightTrends.available ? 'good' : 'warning'}
        />

        <MetricCard
          title="Sleep Average"
          value={reportData.summary.sleepQuality.available
            ? `${reportData.summary.sleepQuality.averageHours.toFixed(1)}h`
            : 'N/A'
          }
          change={reportData.summary.sleepQuality.available ? 'Stable' : ''}
          changeType="neutral"
          icon={Moon}
          status={reportData.summary.sleepQuality.available && reportData.summary.sleepQuality.averageHours >= 7 ? 'good' : 'warning'}
        />

        <MetricCard
          title="Workouts"
          value={reportData.summary.trainingPerformance.available
            ? reportData.summary.trainingPerformance.totalWorkouts.toString()
            : '0'
          }
          change={reportData.summary.trainingPerformance.available ? '+2' : ''}
          changeType="positive"
          icon={Activity}
          status={reportData.summary.trainingPerformance.available && reportData.summary.trainingPerformance.totalWorkouts >= 3 ? 'good' : 'warning'}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
      <div className="min-h-96">
        {activeTab === 'overview' && <OverviewTab reportData={reportData} />}
        {activeTab === 'nutrition' && <NutritionTab reportData={reportData} />}
        {activeTab === 'activity' && <ActivityTab reportData={reportData} />}
        {activeTab === 'wellness' && <WellnessTab reportData={reportData} />}
        {activeTab === 'body' && <BodyCompositionTab reportData={reportData} />}
        {activeTab === 'compliance' && <ComplianceDashboard reportData={reportData} />}
        {activeTab === 'photos' && <ProgressPhotosGallery clientId={reportData.client.id} />}
      </div>

      {/* Recommendations */}
      {reportData.recommendations.length > 0 && (
        <RecommendationsSection recommendations={reportData.recommendations} />
      )}
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<any>
  status: 'good' | 'warning' | 'danger'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon: Icon, status }) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  const statusColor = {
    good: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${statusColor[status]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {change && (
        <div className="flex items-center mt-4">
          <span className={`text-sm font-medium ${changeColor[changeType]}`}>
            {change}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
        </div>
      )}
    </div>
  )
}

// Tab Components
const OverviewTab: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <MacroAdherenceChart data={reportData.summary.macroAdherence} />
        <WeightTrendsChart data={reportData.summary.weightTrends} />
      </div>
      <div className="space-y-6">
        <SleepPatternsChart data={reportData.summary.sleepQuality} />
        <GoalTrackingVisuals data={reportData.summary.goalProgress} />
      </div>
    </div>
  )
}

const NutritionTab: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <MacroAdherenceChart data={reportData.summary.macroAdherence} detailed />
      {/* Add more nutrition-specific charts */}
    </div>
  )
}

const ActivityTab: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      {/* Activity-specific visualizations */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training Performance</h3>
        {reportData.summary.trainingPerformance.available ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {reportData.summary.trainingPerformance.totalWorkouts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {reportData.summary.trainingPerformance.averageDuration.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {reportData.summary.trainingPerformance.totalCaloriesBurned}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Calories Burned</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No training data available for this period.</p>
        )}
      </div>
    </div>
  )
}

const WellnessTab: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SleepPatternsChart data={reportData.summary.sleepQuality} detailed />
        {/* Energy/Stress correlation chart would go here */}
      </div>
    </div>
  )
}

const BodyCompositionTab: React.FC<{ reportData: ReportData }> = ({ reportData }) => {
  return (
    <div className="space-y-6">
      <WeightTrendsChart data={reportData.summary.weightTrends} detailed />
      {/* Additional body composition charts */}
    </div>
  )
}

// Recommendations Section
const RecommendationsSection: React.FC<{ recommendations: any[] }> = ({ recommendations }) => {
  const priorityColors = {
    high: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
    medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
    low: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
  }

  const priorityIcons = {
    high: AlertCircle,
    medium: Clock,
    low: Award
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Trainer Recommendations
      </h3>
      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const Icon = priorityIcons[rec.priority as keyof typeof priorityIcons] || AlertCircle
          return (
            <div 
              key={index} 
              className={`border rounded-lg p-4 ${priorityColors[rec.priority as keyof typeof priorityColors]}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon className="h-5 w-5 text-current" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-current/10">
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Action: {rec.action}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TrainerDashboard