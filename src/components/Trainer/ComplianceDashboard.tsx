import React from 'react'
import { Target, CheckCircle, AlertCircle, Clock, TrendingUp, Calendar, Award } from 'lucide-react'

interface ComplianceDashboardProps {
  reportData: {
    summary: {
      macroAdherence: any
      weightTrends: any
      sleepQuality: any
      trainingPerformance: any
      goalProgress: any
    }
    detailed: {
      dailyBreakdown: Array<{
        date: string
        nutrition: any
        activity: any
        wellness: any
        compliance: {
          overall: number
          nutrition: number
          activity: number
          wellness: number
        }
      }>
      complianceMetrics: {
        overallScore: number
        categoryScores: {
          nutrition: number
          activity: number
          wellness: number
          bodyComposition: number
        }
        streaks: {
          current: number
          longest: number
        }
        weeklyTrend: number
      }
    }
  }
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ reportData }) => {
  const { summary, detailed } = reportData
  
  // Calculate compliance metrics
  const complianceMetrics = detailed.complianceMetrics || {
    overallScore: calculateOverallCompliance(),
    categoryScores: calculateCategoryScores(),
    streaks: { current: 0, longest: 0 },
    weeklyTrend: 0
  }

  function calculateOverallCompliance() {
    const scores = []
    
    if (summary.macroAdherence.available) {
      const adherence = summary.macroAdherence.adherence
      const avgAdherence = Object.values(adherence).reduce((sum: number, val: number) => sum + val, 0) / 4
      scores.push(Math.min(100, avgAdherence))
    }
    
    if (summary.sleepQuality.available) {
      const sleepScore = Math.min(100, (summary.sleepQuality.averageHours / 8) * 100)
      scores.push(sleepScore)
    }
    
    if (summary.trainingPerformance.available) {
      const workoutScore = Math.min(100, (summary.trainingPerformance.totalWorkouts / 5) * 100)
      scores.push(workoutScore)
    }
    
    return scores.length > 0 ? scores.reduce((sum, val) => sum + val, 0) / scores.length : 0
  }

  function calculateCategoryScores() {
    return {
      nutrition: summary.macroAdherence.available 
        ? Object.values(summary.macroAdherence.adherence).reduce((sum: number, val: number) => sum + val, 0) / 4
        : 0,
      activity: summary.trainingPerformance.available 
        ? Math.min(100, (summary.trainingPerformance.totalWorkouts / 5) * 100)
        : 0,
      wellness: summary.sleepQuality.available 
        ? Math.min(100, (summary.sleepQuality.averageHours / 8) * 100)
        : 0,
      bodyComposition: summary.weightTrends.available ? 85 : 0 // Placeholder calculation
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', level: 'Excellent' }
    if (score >= 80) return { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', level: 'Good' }
    if (score >= 70) return { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', level: 'Fair' }
    return { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', level: 'Needs Work' }
  }

  const overallCompliance = getComplianceColor(complianceMetrics.overallScore)

  const categories = [
    {
      name: 'Nutrition',
      score: complianceMetrics.categoryScores.nutrition,
      icon: Target,
      description: 'Macro adherence and meal consistency'
    },
    {
      name: 'Activity',
      score: complianceMetrics.categoryScores.activity,
      icon: TrendingUp,
      description: 'Workout frequency and intensity'
    },
    {
      name: 'Wellness',
      score: complianceMetrics.categoryScores.wellness,
      icon: Clock,
      description: 'Sleep quality and stress management'
    },
    {
      name: 'Body Composition',
      score: complianceMetrics.categoryScores.bodyComposition,
      icon: Award,
      description: 'Measurement tracking and progress'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${overallCompliance.bg}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className={`h-6 w-6 ${overallCompliance.color}`} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall Compliance</h3>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${overallCompliance.color}`}>
              {complianceMetrics.overallScore.toFixed(0)}%
            </div>
            <div className={`text-sm font-medium ${overallCompliance.color}`}>
              {overallCompliance.level}
            </div>
          </div>
        </div>
        
        {/* Progress Ring */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - complianceMetrics.overallScore / 100)}`}
              className={overallCompliance.color}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle className={`h-8 w-8 ${overallCompliance.color}`} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Weekly compliance score based on nutrition, activity, and wellness metrics
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const categoryCompliance = getComplianceColor(category.score)
          const Icon = category.icon
          
          return (
            <div key={category.name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${categoryCompliance.bg}`}>
                  <Icon className={`h-5 w-5 ${categoryCompliance.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                </div>
                <div className={`text-2xl font-bold ${categoryCompliance.color}`}>
                  {category.score.toFixed(0)}%
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${categoryCompliance.color.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(100, category.score)}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm font-medium ${categoryCompliance.color}`}>
                  {categoryCompliance.level}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Target: 90%+
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Streaks and Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-primary-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Current Streak</h4>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">
              {complianceMetrics.streaks.current}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">days</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="h-5 w-5 text-yellow-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Best Streak</h4>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {complianceMetrics.streaks.longest}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">days</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Weekly Trend</h4>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${complianceMetrics.weeklyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {complianceMetrics.weeklyTrend >= 0 ? '+' : ''}{complianceMetrics.weeklyTrend.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">vs last week</div>
          </div>
        </div>
      </div>

      {/* Daily Compliance Breakdown */}
      {detailed.dailyBreakdown && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Compliance Breakdown</h4>
          <div className="space-y-3">
            {detailed.dailyBreakdown.slice(-7).map((day, index) => {
              const dayCompliance = getComplianceColor(day.compliance?.overall || 0)
              
              return (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex-shrink-0 w-20">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${dayCompliance.color.replace('text-', 'bg-')}`}
                          style={{ width: `${day.compliance?.overall || 0}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${dayCompliance.color}`}>
                        {(day.compliance?.overall || 0).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Nutrition: {(day.compliance?.nutrition || 0).toFixed(0)}%</span>
                      <span>Activity: {(day.compliance?.activity || 0).toFixed(0)}%</span>
                      <span>Wellness: {(day.compliance?.wellness || 0).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {day.compliance?.overall >= 90 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : day.compliance?.overall >= 70 ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Compliance Insights */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Compliance Insights</h4>
        <div className="space-y-3">
          {/* Best performing area */}
          {(() => {
            const bestCategory = categories.reduce((prev, current) => 
              prev.score > current.score ? prev : current
            )
            return (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white block">
                    Strongest Area: {bestCategory.name}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {bestCategory.score.toFixed(0)}% compliance - Keep up the excellent work in this area!
                  </p>
                </div>
              </div>
            )
          })()}

          {/* Area needing improvement */}
          {(() => {
            const worstCategory = categories.reduce((prev, current) => 
              prev.score < current.score ? prev : current
            )
            if (worstCategory.score < 80) {
              return (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white block">
                      Focus Area: {worstCategory.name}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {worstCategory.score.toFixed(0)}% compliance - This area needs attention to improve overall progress.
                    </p>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Streak motivation */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Consistency Goal
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {complianceMetrics.streaks.current >= 7 
                  ? 'Amazing! You\'ve maintained consistency for over a week. Keep it going!'
                  : complianceMetrics.streaks.current >= 3
                  ? 'Good momentum! Try to maintain this consistency for a full week.'
                  : 'Focus on building a consistent daily routine to establish good habits.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplianceDashboard