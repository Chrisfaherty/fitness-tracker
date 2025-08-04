import React from 'react'
import { PieChart, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MacroAdherenceChartProps {
  data: {
    available: boolean
    adherence?: {
      calories: number
      protein: number
      carbs: number
      fats: number
    }
    totals?: {
      calories: number
      protein: number
      carbs: number
      fats: number
    }
    targets?: {
      calories: number
      protein: number
      carbs: number
      fats: number
    }
    averageDaily?: {
      calories: number
      protein: number
      carbs: number
      fats: number
    }
    compliance?: {
      excellent: number
      total: number
    }
    message?: string
  }
  detailed?: boolean
}

const MacroAdherenceChart: React.FC<MacroAdherenceChartProps> = ({ data, detailed = false }) => {
  if (!data.available) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <PieChart className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Macro Adherence</h3>
        </div>
        <div className="text-center py-8">
          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{data.message || 'No nutrition data available'}</p>
        </div>
      </div>
    )
  }

  const { adherence, totals, targets, averageDaily, compliance } = data

  const macros = [
    { 
      name: 'Calories', 
      value: adherence!.calories, 
      color: 'bg-blue-500', 
      lightColor: 'bg-blue-100 dark:bg-blue-900/30',
      total: totals!.calories,
      target: targets!.calories,
      daily: averageDaily!.calories,
      unit: 'cal'
    },
    { 
      name: 'Protein', 
      value: adherence!.protein, 
      color: 'bg-green-500', 
      lightColor: 'bg-green-100 dark:bg-green-900/30',
      total: totals!.protein,
      target: targets!.protein,
      daily: averageDaily!.protein,
      unit: 'g'
    },
    { 
      name: 'Carbs', 
      value: adherence!.carbs, 
      color: 'bg-yellow-500', 
      lightColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      total: totals!.carbs,
      target: targets!.carbs,
      daily: averageDaily!.carbs,
      unit: 'g'
    },
    { 
      name: 'Fats', 
      value: adherence!.fats, 
      color: 'bg-purple-500', 
      lightColor: 'bg-purple-100 dark:bg-purple-900/30',
      total: totals!.fats,
      target: targets!.fats,
      daily: averageDaily!.fats,
      unit: 'g'
    }
  ]

  const getAdherenceStatus = (value: number) => {
    if (value >= 90) return { status: 'excellent', icon: TrendingUp, color: 'text-green-600' }
    if (value >= 70) return { status: 'good', icon: Minus, color: 'text-yellow-600' }
    return { status: 'needs improvement', icon: TrendingDown, color: 'text-red-600' }
  }

  const overallAdherence = Object.values(adherence!).reduce((sum, val) => sum + val, 0) / 4

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <PieChart className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Macro Adherence</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {overallAdherence.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overall</div>
        </div>
      </div>

      {/* Main Chart Visualization */}
      <div className="space-y-4 mb-6">
        {macros.map((macro) => {
          const { status, icon: StatusIcon, color } = getAdherenceStatus(macro.value)
          
          return (
            <div key={macro.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${macro.color}`}></div>
                  <span className="font-medium text-gray-900 dark:text-white">{macro.name}</span>
                  <StatusIcon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {macro.daily.toFixed(0)}{macro.unit}/day
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {macro.value.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${macro.color}`}
                    style={{ width: `${Math.min(100, macro.value)}%` }}
                  />
                </div>
                {macro.value > 100 && (
                  <div className="absolute right-0 top-0 h-3 w-1 bg-red-500 rounded-r-full" />
                )}
              </div>
              
              {detailed && (
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                  Target: {(macro.target / 7).toFixed(0)}{macro.unit}/day • 
                  Actual: {macro.daily.toFixed(0)}{macro.unit}/day • 
                  Weekly Total: {macro.total.toFixed(0)}{macro.unit}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Compliance Summary */}
      {compliance && (
        <div className={`p-4 rounded-lg ${compliance.excellent === compliance.total ? 'bg-green-50 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Compliance Score</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {compliance.excellent} of {compliance.total} macros in target range (90-110%)
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {((compliance.excellent / compliance.total) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {compliance.excellent === compliance.total ? 'Excellent' : 
                 compliance.excellent >= compliance.total * 0.75 ? 'Good' : 'Needs Work'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {detailed && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Weekly Breakdown</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Total Intake</div>
                <div className="space-y-1">
                  {macros.map(macro => (
                    <div key={macro.name} className="flex justify-between">
                      <span>{macro.name}:</span>
                      <span className="font-medium">{macro.total.toFixed(0)}{macro.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">Weekly Targets</div>
                <div className="space-y-1">
                  {macros.map(macro => (
                    <div key={macro.name} className="flex justify-between">
                      <span>{macro.name}:</span>
                      <span className="font-medium">{macro.target.toFixed(0)}{macro.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
            <div className="space-y-2 text-sm">
              {macros.filter(macro => macro.value < 80).map(macro => (
                <div key={macro.name} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Increase {macro.name.toLowerCase()} intake
                    </span>
                    <p className="text-gray-600 dark:text-gray-400">
                      Currently at {macro.value.toFixed(1)}% of target. 
                      Need {((macro.target - macro.total) / 7).toFixed(0)}{macro.unit} more per day.
                    </p>
                  </div>
                </div>
              ))}
              
              {macros.filter(macro => macro.value > 110).map(macro => (
                <div key={macro.name} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Consider reducing {macro.name.toLowerCase()}
                    </span>
                    <p className="text-gray-600 dark:text-gray-400">
                      Currently at {macro.value.toFixed(1)}% of target. 
                      Reduce by {((macro.total - macro.target) / 7).toFixed(0)}{macro.unit} per day.
                    </p>
                  </div>
                </div>
              ))}
              
              {macros.every(macro => macro.value >= 80 && macro.value <= 110) && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Excellent macro balance!
                    </span>
                    <p className="text-gray-600 dark:text-gray-400">
                      All macronutrients are within target ranges. Continue current approach.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MacroAdherenceChart