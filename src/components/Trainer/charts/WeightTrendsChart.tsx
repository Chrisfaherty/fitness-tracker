import React from 'react'
import { Scale, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'

interface WeightTrendsChartProps {
  data: {
    available: boolean
    startWeight?: number
    endWeight?: number
    weightChange?: number
    weightChangePercent?: number
    trend?: 'increasing' | 'decreasing' | 'stable'
    measurements?: Array<{
      value: number
      date: string
      id: number
    }>
    otherMeasurements?: {
      bodyFat: Array<{ value: number; date: string }>
      muscleMass: Array<{ value: number; date: string }>
      waist: Array<{ value: number; date: string }>
      chest: Array<{ value: number; date: string }>
      arms: Array<{ value: number; date: string }>
      thighs: Array<{ value: number; date: string }>
    }
    message?: string
  }
  detailed?: boolean
}

const WeightTrendsChart: React.FC<WeightTrendsChartProps> = ({ data, detailed = false }) => {
  if (!data.available) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Scale className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weight Trends</h3>
        </div>
        <div className="text-center py-8">
          <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{data.message || 'No weight data available'}</p>
        </div>
      </div>
    )
  }

  const { startWeight, endWeight, weightChange, weightChangePercent, trend, measurements, otherMeasurements } = data

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return { icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
      case 'decreasing':
        return { icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' }
      default:
        return { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' }
    }
  }

  const { icon: TrendIcon, color: trendColor, bg: trendBg } = getTrendIcon(trend!)

  // Generate simple line chart visualization
  const generateChartPoints = (measurements: Array<{ value: number; date: string }>) => {
    if (!measurements || measurements.length < 2) return []
    
    const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const minWeight = Math.min(...sortedMeasurements.map(m => m.value))
    const maxWeight = Math.max(...sortedMeasurements.map(m => m.value))
    const range = maxWeight - minWeight || 1

    return sortedMeasurements.map((measurement, index) => ({
      x: (index / (sortedMeasurements.length - 1)) * 100,
      y: 100 - ((measurement.value - minWeight) / range) * 100,
      value: measurement.value,
      date: measurement.date
    }))
  }

  const chartPoints = generateChartPoints(measurements!)
  const pathData = chartPoints.length > 1 
    ? `M ${chartPoints[0].x} ${chartPoints[0].y} ` + 
      chartPoints.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')
    : ''

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weight Trends</h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${trendBg}`}>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          <span className={`text-sm font-medium ${trendColor}`}>
            {trend === 'increasing' ? 'Gaining' : trend === 'decreasing' ? 'Losing' : 'Stable'}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {startWeight!.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Start Weight</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {endWeight!.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Current Weight</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${trendColor}`}>
            {weightChange! > 0 ? '+' : ''}{weightChange!.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Change ({weightChangePercent!.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      {chartPoints.length > 1 && (
        <div className="mb-6">
          <div className="relative h-32 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="20" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" className="text-gray-300 dark:text-gray-600" />
              
              {/* Weight line */}
              <path
                d={pathData}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary-600"
              />
              
              {/* Data points */}
              {chartPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill="currentColor"
                  className="text-primary-600"
                />
              ))}
            </svg>
            
            {/* Hover tooltips would go here in a real implementation */}
          </div>
          
          {/* Chart labels */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>{new Date(chartPoints[0].date).toLocaleDateString()}</span>
            <span>Weight (lbs)</span>
            <span>{new Date(chartPoints[chartPoints.length - 1].date).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Detailed Information */}
      {detailed && otherMeasurements && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Body Measurements</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(otherMeasurements).map(([type, measurements]) => {
              if (!measurements || measurements.length === 0) return null
              
              const latest = measurements[measurements.length - 1]
              const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null
              const change = previous ? latest.value - previous.value : 0
              
              return (
                <div key={type} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-1">
                    {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {latest.value.toFixed(1)}
                      {type === 'bodyFat' ? '%' : type === 'muscleMass' ? 'lbs' : '"'}
                    </span>
                    {change !== 0 && (
                      <span className={`text-xs ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Progress Analysis */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Progress Analysis</h4>
        <div className="space-y-3">
          {/* Weekly rate of change */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Weekly Rate: {(weightChange! / (measurements!.length / 7 || 1)).toFixed(1)} lbs/week
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Math.abs(weightChange! / (measurements!.length / 7 || 1)) > 2 
                  ? 'Rate of change is aggressive - monitor closely'
                  : Math.abs(weightChange! / (measurements!.length / 7 || 1)) > 1
                  ? 'Good rate of progress'
                  : 'Slow but steady progress'
                }
              </p>
            </div>
          </div>

          {/* Consistency analysis */}
          {measurements!.length >= 4 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Scale className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-900 dark:text-white block">
                  Tracking Consistency
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {measurements!.length} measurements recorded - 
                  {measurements!.length >= 7 ? ' Excellent consistency!' : ' Good tracking frequency'}
                </p>
              </div>
            </div>
          )}

          {/* Goal alignment */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <Target className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Goal Alignment
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {trend === 'decreasing' && weightChange! < 0
                  ? 'On track with weight loss goals'
                  : trend === 'increasing' && weightChange! > 0
                  ? 'Weight gain trend detected - review if intentional'
                  : 'Weight stable - may need to adjust approach for goals'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeightTrendsChart