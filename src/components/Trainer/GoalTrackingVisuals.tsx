import React from 'react'
import { Target, TrendingUp, TrendingDown, Clock, Award, CheckCircle, AlertTriangle } from 'lucide-react'

interface GoalTrackingVisualsProps {
  data: {
    available: boolean
    goals?: Array<{
      id: string
      title: string
      description: string
      category: 'weight' | 'nutrition' | 'activity' | 'wellness' | 'body_composition'
      targetValue: number
      currentValue: number
      targetDate: string
      unit: string
      progress: number
      onTrack: boolean
      daysRemaining: number
      requiredDailyProgress?: number
    }>
    overallProgress?: number
    message?: string
  }
}

const GoalTrackingVisuals: React.FC<GoalTrackingVisualsProps> = ({ data }) => {
  if (!data.available || !data.goals || data.goals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Goal Tracking</h3>
        </div>
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{data.message || 'No goals set'}</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Set Your First Goal
          </button>
        </div>
      </div>
    )
  }

  const { goals, overallProgress } = data

  const getCategoryIcon = (category: string) => {
    const icons = {
      weight: Target,
      nutrition: Target,
      activity: TrendingUp,
      wellness: Clock,
      body_composition: Award
    }
    return icons[category as keyof typeof icons] || Target
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      weight: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      nutrition: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      activity: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
      wellness: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      body_composition: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30'
    }
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
  }

  const getProgressStatus = (progress: number, onTrack: boolean, daysRemaining: number) => {
    if (progress >= 100) {
      return { status: 'completed', color: 'text-green-600', icon: CheckCircle }
    } else if (onTrack) {
      return { status: 'on-track', color: 'text-blue-600', icon: TrendingUp }
    } else if (daysRemaining <= 7) {
      return { status: 'urgent', color: 'text-red-600', icon: AlertTriangle }
    } else {
      return { status: 'behind', color: 'text-yellow-600', icon: TrendingDown }
    }
  }

  const completedGoals = goals.filter(goal => goal.progress >= 100)
  const activeGoals = goals.filter(goal => goal.progress < 100)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Goal Tracking</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {overallProgress?.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Overall Progress</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{activeGoals.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Goals</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{completedGoals.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {activeGoals.filter(goal => !goal.onTrack && goal.daysRemaining > 0).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Need Attention</div>
        </div>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Active Goals</h4>
        {activeGoals.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            All goals completed! Set new ones to continue your progress.
          </p>
        ) : (
          activeGoals.map((goal) => {
            const CategoryIcon = getCategoryIcon(goal.category)
            const categoryColor = getCategoryColor(goal.category)
            const { status, color, icon: StatusIcon } = getProgressStatus(
              goal.progress,
              goal.onTrack,
              goal.daysRemaining
            )

            const isOverdue = goal.daysRemaining < 0
            const progressPercentage = Math.min(100, goal.progress)

            return (
              <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${categoryColor}`}>
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">{goal.title}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${color}`} />
                    <span className={`text-sm font-medium ${color}`}>
                      {status === 'completed' ? 'Completed' :
                       status === 'on-track' ? 'On Track' :
                       status === 'urgent' ? 'Urgent' : 'Behind'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {goal.currentValue.toFixed(1)} / {goal.targetValue.toFixed(1)} {goal.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          progressPercentage >= 100 ? 'bg-green-500' :
                          goal.onTrack ? 'bg-blue-500' :
                          goal.daysRemaining <= 7 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow">
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Goal Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Target Date:</span>
                    <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {isOverdue ? 'Overdue by:' : 'Days Remaining:'}
                    </span>
                    <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                      {Math.abs(goal.daysRemaining)} days
                    </div>
                  </div>
                </div>

                {/* Required Progress */}
                {goal.requiredDailyProgress && goal.progress < 100 && !isOverdue && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Required daily progress: {goal.requiredDailyProgress.toFixed(2)} {goal.unit}/day
                      </span>
                    </div>
                  </div>
                )}

                {/* Overdue Warning */}
                {isOverdue && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        This goal is overdue. Consider adjusting the target date or value.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-green-600" />
            Completed Goals ({completedGoals.length})
          </h4>
          <div className="space-y-3">
            {completedGoals.slice(0, 3).map((goal) => {
              const CategoryIcon = getCategoryIcon(goal.category)
              const categoryColor = getCategoryColor(goal.category)
              
              return (
                <div key={goal.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className={`p-2 rounded-lg ${categoryColor}`}>
                    <CategoryIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white">{goal.title}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Completed on {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              )
            })}
            
            {completedGoals.length > 3 && (
              <div className="text-center">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all {completedGoals.length} completed goals
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goal Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Goal Insights</h4>
        <div className="space-y-3">
          {/* Success rate */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Award className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white block">
                Success Rate: {((completedGoals.length / goals.length) * 100).toFixed(0)}%
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completedGoals.length} of {goals.length} goals completed
              </p>
            </div>
          </div>

          {/* Most successful category */}
          {(() => {
            const categoryStats = goals.reduce((acc, goal) => {
              if (!acc[goal.category]) {
                acc[goal.category] = { total: 0, completed: 0 }
              }
              acc[goal.category].total++
              if (goal.progress >= 100) {
                acc[goal.category].completed++
              }
              return acc
            }, {} as Record<string, { total: number; completed: number }>)

            const bestCategory = Object.entries(categoryStats).reduce((best, [category, stats]) => {
              const successRate = stats.completed / stats.total
              return successRate > (best.rate || 0) ? { category, rate: successRate, stats } : best
            }, {} as any)

            if (bestCategory.category) {
              return (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white block">
                      Strongest Area: {bestCategory.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(bestCategory.rate * 100).toFixed(0)}% success rate in this category
                    </p>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Urgency alert */}
          {(() => {
            const urgentGoals = activeGoals.filter(goal => goal.daysRemaining <= 7 && goal.daysRemaining >= 0)
            if (urgentGoals.length > 0) {
              return (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white block">
                      {urgentGoals.length} goal{urgentGoals.length > 1 ? 's' : ''} due this week
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Focus your efforts on time-sensitive goals to stay on track
                    </p>
                  </div>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>
    </div>
  )
}

export default GoalTrackingVisuals