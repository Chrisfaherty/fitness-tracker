import React, { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Calendar, BarChart3, ArrowRight,
  Target, Utensils, Activity, Heart, Scale, Award, AlertTriangle,
  CheckCircle, Minus, RefreshCw, Download, Filter
} from 'lucide-react'
import { trainerReportService } from '../../services/trainerReportService'
import { trainerWorkflowService } from '../../services/trainerWorkflowService'

interface ComparisonToolsProps {
  clientId?: string
}

interface ComparisonData {
  current: any
  previous: any
  changes: any
  trends: any[]
  improvements: any[]
  concerns: any[]
}

const ComparisonTools: React.FC<ComparisonToolsProps> = ({ clientId }) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'nutrition' | 'activity' | 'wellness' | 'body'>('all')
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week')

  useEffect(() => {
    loadComparisonData()
  }, [clientId, timeframe])

  const loadComparisonData = async () => {
    setLoading(true)
    try {
      // Get current period
      const currentEndDate = new Date().toISOString().split('T')[0]
      const currentStartDate = new Date(Date.now() - getTimeframeDays() * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Get previous period
      const previousEndDate = new Date(Date.now() - getTimeframeDays() * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const previousStartDate = new Date(Date.now() - getTimeframeDays() * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      // Generate reports
      const [currentReport, previousReport] = await Promise.all([
        trainerReportService.generateWeeklySummary(currentStartDate, currentEndDate, clientId),
        trainerReportService.generateWeeklySummary(previousStartDate, previousEndDate, clientId)
      ])
      
      // Generate comparison data
      const comparison = await trainerWorkflowService.generatePreviousWeekComparison(currentReport)
      
      setComparisonData({
        current: currentReport,
        previous: previousReport,
        changes: comparison.changes,
        trends: comparison.trends || [],
        improvements: comparison.improvements || [],
        concerns: comparison.concerns || []
      })
      
    } catch (error) {
      console.error('Failed to load comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeframeDays = () => {
    switch (timeframe) {
      case 'week': return 7
      case 'month': return 30
      case 'quarter': return 90
      default: return 7
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getChangeColor = (change: number, isPositiveGood = true) => {
    if (change === 0) return 'text-gray-600'
    
    const isGood = isPositiveGood ? change > 0 : change < 0
    return isGood ? 'text-green-600' : 'text-red-600'
  }

  const formatChange = (change: number, unit = '', decimals = 1) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(decimals)}${unit}`
  }

  const formatPercentChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Comparison Data</h3>
        <p className="text-gray-500 dark:text-gray-400">Unable to load comparison data for the selected period.</p>
      </div>
    )
  }

  const { current, previous, changes, trends, improvements, concerns } = comparisonData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Progress Comparison</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compare {timeframe}ly progress and identify trends
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="week">Week over Week</option>
            <option value="month">Month over Month</option>
            <option value="quarter">Quarter over Quarter</option>
          </select>

          {/* Metric Filter */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Metrics</option>
            <option value="nutrition">Nutrition</option>
            <option value="activity">Activity</option>
            <option value="wellness">Wellness</option>
            <option value="body">Body Composition</option>
          </select>

          <button
            onClick={loadComparisonData}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weight Change */}
        {changes.weight && (selectedMetric === 'all' || selectedMetric === 'body') && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">Weight</span>
              </div>
              {getChangeIcon(changes.weight.change)}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Previous:</span>
                <span className="font-medium">{changes.weight.previous.toFixed(1)} lbs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Current:</span>
                <span className="font-medium">{changes.weight.current.toFixed(1)} lbs</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-900 dark:text-white">Change:</span>
                <span className={getChangeColor(changes.weight.change, false)}>
                  {formatChange(changes.weight.change, ' lbs')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Macro Adherence */}
        {changes.macroAdherence && (selectedMetric === 'all' || selectedMetric === 'nutrition') && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">Nutrition</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.entries(changes.macroAdherence).map(([macro, data]: [string, any]) => (
                <div key={macro} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{macro}:</span>
                  <span className={getChangeColor(data.change)}>
                    {formatPercentChange(data.change)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sleep Quality */}
        {changes.sleep && (selectedMetric === 'all' || selectedMetric === 'wellness') && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900 dark:text-white">Sleep</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className={getChangeColor(changes.sleep.hours.change)}>
                  {formatChange(changes.sleep.hours.change, 'h')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                <span className={getChangeColor(changes.sleep.quality.change)}>
                  {formatChange(changes.sleep.quality.change, '/5')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Workout Frequency */}
        {changes.workouts && (selectedMetric === 'all' || selectedMetric === 'activity') && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-gray-900 dark:text-white">Workouts</span>
              </div>
              {getChangeIcon(changes.workouts.frequency.change)}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                <span className={getChangeColor(changes.workouts.frequency.change)}>
                  {formatChange(changes.workouts.frequency.change, '', 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className={getChangeColor(changes.workouts.duration.change)}>
                  {formatChange(changes.workouts.duration.change, 'h')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Improvements */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Improvements</h3>
          </div>
          
          {improvements.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No significant improvements detected this period
            </p>
          ) : (
            <div className="space-y-4">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {improvement.metric.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {improvement.message}
                    </p>
                    <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Improvement: +{improvement.improvement.toFixed(1)}
                      {improvement.type === 'nutrition' ? '%' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Concerns */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Areas of Concern</h3>
          </div>
          
          {concerns.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No concerning trends detected this period
            </p>
          ) : (
            <div className="space-y-4">
              {concerns.map((concern, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {concern.metric.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {concern.message}
                    </p>
                    <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Decline: -{concern.decline.toFixed(1)}
                      {concern.type === 'wellness' ? ' points' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trends Analysis */}
      {trends.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Analysis</h3>
          </div>
          
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex-shrink-0">
                  {trend.direction === 'increasing' ? (
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {trend.type} Trend - {trend.strength}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trend.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {trend.direction.toUpperCase()}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      {trend.strength.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period Comparison Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {timeframe === 'week' ? 'Weekly' : timeframe === 'month' ? 'Monthly' : 'Quarterly'} Summary
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            {new Date(previous.period.startDate).toLocaleDateString()} - {new Date(previous.period.endDate).toLocaleDateString()}
            <ArrowRight className="h-4 w-4" />
            {new Date(current.period.startDate).toLocaleDateString()} - {new Date(current.period.endDate).toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Previous Period */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Previous {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </h4>
            <div className="space-y-3">
              {previous.summary.macroAdherence.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Macro Adherence:</span>
                  <span className="font-medium">
                    {(Object.values(previous.summary.macroAdherence.adherence).reduce((sum: number, val: number) => sum + val, 0) / 4).toFixed(1)}%
                  </span>
                </div>
              )}
              {previous.summary.weightTrends.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Weight Change:</span>
                  <span className="font-medium">
                    {formatChange(previous.summary.weightTrends.weightChange, ' lbs')}
                  </span>
                </div>
              )}
              {previous.summary.trainingPerformance.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Workouts:</span>
                  <span className="font-medium">
                    {previous.summary.trainingPerformance.totalWorkouts}
                  </span>
                </div>
              )}
              {previous.summary.sleepQuality.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Sleep:</span>
                  <span className="font-medium">
                    {previous.summary.sleepQuality.averageHours.toFixed(1)}h
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Current Period */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Current {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </h4>
            <div className="space-y-3">
              {current.summary.macroAdherence.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Macro Adherence:</span>
                  <span className="font-medium">
                    {(Object.values(current.summary.macroAdherence.adherence).reduce((sum: number, val: number) => sum + val, 0) / 4).toFixed(1)}%
                  </span>
                </div>
              )}
              {current.summary.weightTrends.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Weight Change:</span>
                  <span className="font-medium">
                    {formatChange(current.summary.weightTrends.weightChange, ' lbs')}
                  </span>
                </div>
              )}
              {current.summary.trainingPerformance.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Workouts:</span>
                  <span className="font-medium">
                    {current.summary.trainingPerformance.totalWorkouts}
                  </span>
                </div>
              )}
              {current.summary.sleepQuality.available && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Sleep:</span>
                  <span className="font-medium">
                    {current.summary.sleepQuality.averageHours.toFixed(1)}h
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recommended Actions</h3>
        </div>
        
        <div className="space-y-3">
          {improvements.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Award className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Celebrate Progress</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Acknowledge improvements in {improvements.map(i => i.type).join(', ')} with client
                </p>
              </div>
            </div>
          )}
          
          {concerns.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Address Concerns</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Focus coaching on {concerns.map(c => c.type).join(', ')} improvements
                </p>
              </div>
            </div>
          )}
          
          {trends.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Monitor Trends</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Continue tracking {trends.map(t => t.type).join(', ')} patterns
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComparisonTools