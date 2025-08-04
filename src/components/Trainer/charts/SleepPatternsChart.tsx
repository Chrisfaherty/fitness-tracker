import React from 'react'
import { Moon, Clock, Star, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface SleepPatternsChartProps {
  data: {
    available: boolean
    averageHours?: number
    averageQuality?: number
    qualityDistribution?: {
      excellent: number
      good: number
      fair: number
      poor: number
      very_poor: number
    }
    sleepConsistency?: number
    recommendations?: string[]
    entries?: Array<{
      date: string
      duration: number
      quality: string
      bedtime?: string
      wakeTime?: string
      energyLevel?: number
      stressLevel?: number
    }>
    message?: string
  }
  detailed?: boolean
}

const SleepPatternsChart: React.FC<SleepPatternsChartProps> = ({ data, detailed = false }) => {
  if (!data.available) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Moon className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sleep Patterns</h3>
        </div>
        <div className="text-center py-8">
          <Moon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{data.message || 'No sleep data available'}</p>
        </div>
      </div>
    )
  }

  const { averageHours, averageQuality, qualityDistribution, sleepConsistency, entries } = data

  const getSleepStatus = (hours: number) => {
    if (hours >= 7 && hours <= 9) return { status: 'optimal', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' }
    if (hours >= 6 && hours < 7) return { status: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
  }

  const getQualityColor = (quality: string) => {
    const colors = {
      excellent: 'bg-green-500',
      good: 'bg-blue-500',
      fair: 'bg-yellow-500',
      poor: 'bg-orange-500',
      very_poor: 'bg-red-500'
    }
    return colors[quality as keyof typeof colors] || 'bg-gray-500'
  }

  const getQualityScore = (score: number) => {
    if (score >= 4.5) return { rating: 'Excellent', color: 'text-green-600' }
    if (score >= 3.5) return { rating: 'Good', color: 'text-blue-600' }
    if (score >= 2.5) return { rating: 'Fair', color: 'text-yellow-600' }
    return { rating: 'Poor', color: 'text-red-600' }
  }

  const sleepStatus = getSleepStatus(averageHours!)
  const qualityRating = getQualityScore(averageQuality!)

  // Generate sleep duration chart points
  const generateDurationChart = (entries: typeof data.entries) => {
    if (!entries || entries.length < 2) return []
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const maxDuration = Math.max(...sortedEntries.map(e => e.duration / 60))
    const minDuration = Math.min(...sortedEntries.map(e => e.duration / 60))
    const range = maxDuration - minDuration || 1

    return sortedEntries.map((entry, index) => ({
      x: (index / (sortedEntries.length - 1)) * 100,
      y: 100 - ((entry.duration / 60 - minDuration) / range) * 100,
      duration: entry.duration / 60,
      quality: entry.quality,
      date: entry.date
    }))
  }

  const durationChart = generateDurationChart(entries)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sleep Patterns</h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${sleepStatus.bg}`}>
          <Star className={`h-4 w-4 ${sleepStatus.color}`} />
          <span className={`text-sm font-medium ${sleepStatus.color}`}>
            {sleepStatus.status.charAt(0).toUpperCase() + sleepStatus.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {averageHours!.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Duration</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${qualityRating.color}`}>
            {averageQuality!.toFixed(1)}/5
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {qualityRating.rating}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {sleepConsistency!.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Consistency</div>
        </div>
      </div>

      {/* Sleep Duration Chart */}
      {durationChart.length > 1 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sleep Duration Trend</h4>
          <div className="relative h-32 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Target sleep range (7-9 hours) */}
              <rect 
                x="0" 
                y="20" 
                width="100" 
                height="40" 
                fill="currentColor" 
                className="text-green-200 dark:text-green-900/50" 
                opacity="0.3"
              />
              
              {/* Sleep duration line */}
              <path
                d={`M ${durationChart[0].x} ${durationChart[0].y} ` + 
                  durationChart.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-600"
              />
              
              {/* Data points colored by quality */}
              {durationChart.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="currentColor"
                  className={point.quality === 'excellent' ? 'text-green-500' :
                           point.quality === 'good' ? 'text-blue-500' :
                           point.quality === 'fair' ? 'text-yellow-500' :
                           'text-red-500'}
                />
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>{new Date(durationChart[0].date).toLocaleDateString()}</span>
            <span className="text-green-600">Optimal: 7-9 hours</span>
            <span>{new Date(durationChart[durationChart.length - 1].date).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Quality Distribution */}
      {qualityDistribution && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sleep Quality Distribution</h4>
          <div className="space-y-2">
            {Object.entries(qualityDistribution).map(([quality, count]) => {
              const total = Object.values(qualityDistribution).reduce((sum, val) => sum + val, 0)
              const percentage = total > 0 ? (count / total) * 100 : 0
              
              return (
                <div key={quality} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {quality.replace('_', ' ')}
                  </div>
                  <div className="flex-1 relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getQualityColor(quality)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-900 dark:text-white text-right">
                    {count} nights
                  </div>
                  <div className="w-12 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {detailed && entries && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Recent Sleep Entries</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {entries.slice(-7).reverse().map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getQualityColor(entry.quality)}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.bedtime && entry.wakeTime && (
                        `${entry.bedtime} - ${entry.wakeTime}`
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {(entry.duration / 60).toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {entry.quality.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep Insights */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Sleep Insights</h4>
        <div className="space-y-3">
          {/* Duration assessment */}
          <div className={`flex items-start gap-3 p-3 rounded-lg ${sleepStatus.bg}`}>
            <Clock className={`h-4 w-4 mt-0.5 flex-shrink-0 ${sleepStatus.color}`} />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Sleep Duration: {sleepStatus.status.charAt(0).toUpperCase() + sleepStatus.status.slice(1)}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {averageHours! < 7 
                  ? `Getting ${(7 - averageHours!).toFixed(1)} hours less than recommended minimum`
                  : averageHours! > 9
                  ? `Getting ${(averageHours! - 9).toFixed(1)} hours more than typical optimal range`
                  : 'Sleep duration is within the optimal range of 7-9 hours'
                }
              </p>
            </div>
          </div>

          {/* Quality assessment */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Star className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Sleep Quality: {qualityRating.rating}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {averageQuality! >= 4 
                  ? 'Consistently high quality sleep - maintain current habits'
                  : averageQuality! >= 3
                  ? 'Good quality sleep with room for improvement'
                  : 'Sleep quality needs attention - consider sleep hygiene improvements'
                }
              </p>
            </div>
          </div>

          {/* Consistency assessment */}
          <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            {sleepConsistency! >= 80 ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Sleep Consistency: {sleepConsistency! >= 80 ? 'Excellent' : sleepConsistency! >= 60 ? 'Good' : 'Needs Improvement'}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sleepConsistency! >= 80 
                  ? 'Consistent sleep schedule supports healthy circadian rhythm'
                  : 'Irregular sleep times may impact sleep quality and energy levels'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
          <div className="space-y-2">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SleepPatternsChart