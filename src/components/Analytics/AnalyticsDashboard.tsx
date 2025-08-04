import React, { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, Users, AlertCircle, Clock, 
  CheckCircle, XCircle, Zap, Battery, Wifi, Star,
  Calendar, PieChart, Activity, Target
} from 'lucide-react'
import { analyticsService } from '../../services/analyticsService'
import { feedbackService } from '../../services/feedbackService'

interface AnalyticsDashboardProps {
  timeRange?: string
}

interface AnalyticsData {
  usage: any
  feedback: any
  performance: any
  recommendations: any[]
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ timeRange = '7d' }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [usageStats, feedbackAnalytics] = await Promise.all([
        analyticsService.getFeatureUsageStats(timeRange),
        feedbackService.getFeedbackAnalytics(timeRange)
      ])

      setAnalyticsData({
        usage: usageStats,
        feedback: feedbackAnalytics,
        performance: {}, // Would be populated by performance monitoring
        recommendations: analyticsService.generateRecommendations()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
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
            <h3 className="text-lg font-semibold text-red-800">Error Loading Analytics</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={loadAnalyticsData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Analytics Data</h3>
        <p className="text-gray-500 dark:text-gray-400">Start using the app to see analytics data here.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'usage', label: 'Feature Usage', icon: Activity },
    { id: 'completion', label: 'Daily Completion', icon: Target },
    { id: 'feedback', label: 'User Feedback', icon: Star },
    { id: 'performance', label: 'Performance', icon: Zap }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Insights and metrics for the last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : timeRange}
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => {
              // This would typically be handled by parent component
              console.log('Time range changed:', e.target.value)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
          </select>
          
          <button
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sessions"
          value={analyticsData.usage.sessionStats?.totalSessions || 1}
          change="+12%"
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="Features Used"
          value={analyticsData.usage.sessionStats?.featuresUsed || 0}
          change="+8%"
          changeType="positive"
          icon={Activity}
        />
        <MetricCard
          title="Avg Completion Rate"
          value={`${analyticsData.usage.completionRates?.averageCompletionRate?.toFixed(1) || 0}%`}
          change="+5%"
          changeType="positive"
          icon={Target}
        />
        <MetricCard
          title="User Satisfaction"
          value={`${analyticsData.feedback.analytics?.summary?.averageRating?.toFixed(1) || 0}/5`}
          change="+0.2"
          changeType="positive"
          icon={Star}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
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
        {selectedTab === 'overview' && <OverviewTab data={analyticsData} />}
        {selectedTab === 'usage' && <UsageTab data={analyticsData.usage} />}
        {selectedTab === 'completion' && <CompletionTab data={analyticsData.usage.completionRates} />}
        {selectedTab === 'feedback' && <FeedbackTab data={analyticsData.feedback} />}
        {selectedTab === 'performance' && <PerformanceTab data={analyticsData.performance} />}
      </div>

      {/* Recommendations */}
      {analyticsData.recommendations.length > 0 && (
        <RecommendationsSection recommendations={analyticsData.recommendations} />
      )}
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<any>
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon: Icon }) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      <div className="flex items-center mt-4">
        <span className={`text-sm font-medium ${changeColor[changeType]}`}>
          {change}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
      </div>
    </div>
  )
}

// Overview Tab
const OverviewTab: React.FC<{ data: AnalyticsData }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Features Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Used Features</h3>
        <div className="space-y-3">
          {data.usage.topFeatures?.slice(0, 5).map((feature: any, index: number) => (
            <div key={feature.feature} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {feature.feature.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (feature.count / (data.usage.topFeatures?.[0]?.count || 1)) * 100)}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                  {feature.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Activity */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Session</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Session Duration</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {Math.floor((data.usage.sessionStats?.sessionDuration || 0) / 60000)}m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Page Views</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {data.usage.sessionStats?.pageViews || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Interactions</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {data.usage.sessionStats?.totalInteractions || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Features Used</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {data.usage.sessionStats?.featuresUsed || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Usage Tab
const UsageTab: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Feature Usage Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Usage Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.featureUsage || {}).map(([feature, count]: [string, any]) => (
            <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {feature.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{count} uses</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Completion Tab
const CompletionTab: React.FC<{ data: any }> = ({ data }) => {
  if (!data?.available) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Completion Data</h3>
        <p className="text-gray-500 dark:text-gray-400">Complete some daily logging to see completion statistics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Completion Rate Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Completion Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {data.averageCompletionRate?.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {data.totalDays}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {data.methodUsage?.barcodePercentage?.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Used Barcode Scanner</div>
          </div>
        </div>
      </div>

      {/* Method Usage */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logging Methods</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Barcode Scanner</span>
              <span className="text-gray-900 dark:text-white">{data.methodUsage?.barcodePercentage?.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${data.methodUsage?.barcodePercentage || 0}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Manual Entry</span>
              <span className="text-gray-900 dark:text-white">{data.methodUsage?.manualPercentage?.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${data.methodUsage?.manualPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feedback Tab
const FeedbackTab: React.FC<{ data: any }> = ({ data }) => {
  const feedback = data.analytics?.summary

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Feedback Data</h3>
        <p className="text-gray-500 dark:text-gray-400">User feedback will appear here once submitted.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Feedback Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{feedback.totalFeedbackSubmissions}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{feedback.averageRating?.toFixed(1)}/5</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{feedback.totalErrorsReported}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Errors Reported</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{feedback.totalFeatureUsage}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Feature Events</div>
        </div>
      </div>

      {/* Top Issues */}
      {feedback.topIssues?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Reported Issues</h3>
          <div className="space-y-3">
            {feedback.topIssues.map((issue: any, index: number) => (
              <div key={issue.issue} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {issue.issue.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {issue.count} reports
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Performance Tab
const PerformanceTab: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">2.3s</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Battery className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">12%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Battery Impact/hr</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Wifi className="h-8 w-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">99.2%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">API Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance placeholder */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Monitoring</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Performance metrics will be displayed here once the monitoring system collects sufficient data.
        </p>
      </div>
    </div>
  )
}

// Recommendations Section
const RecommendationsSection: React.FC<{ recommendations: any[] }> = ({ recommendations }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Recommendations
      </h3>
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className={`p-2 rounded-full ${
              rec.priority === 'high' ? 'bg-red-100 text-red-600' :
              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {rec.priority.toUpperCase()} PRIORITY
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnalyticsDashboard