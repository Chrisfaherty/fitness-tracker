import { useEffect } from 'react'
import useFitnessStore from '../../store/fitnessStore'
import { Calendar, Target, TrendingUp, Activity } from 'lucide-react'

const Dashboard = () => {
  const { user, nutrition, activity, wellness } = useFitnessStore()

  const stats = [
    {
      name: 'Daily Calories',
      value: nutrition.dailyCalories,
      target: 2000,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Steps Today',
      value: activity.dailySteps,
      target: 10000,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Active Minutes',
      value: activity.activeMinutes,
      target: 30,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Sleep Hours',
      value: wellness.sleepHours,
      target: 8,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back{user.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's your fitness overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const percentage = Math.min((stat.value / stat.target) * 100, 100)
          
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      / {stat.target.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${stat.color.replace('text-', 'bg-')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {percentage.toFixed(0)}% of daily goal
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Meals
          </h3>
          {nutrition.meals.length > 0 ? (
            <div className="space-y-2">
              {nutrition.meals.slice(-3).map((meal) => (
                <div key={meal.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {meal.name}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {meal.calories} cal
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No meals logged today
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Workouts
          </h3>
          {activity.workouts.length > 0 ? (
            <div className="space-y-2">
              {activity.workouts.slice(-3).map((workout) => (
                <div key={workout.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {workout.name}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {workout.duration} min
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No workouts logged today
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today's Mood
          </h3>
          <div className="text-center">
            <div className="text-3xl mb-2">
              {wellness.mood === 'happy' && '😊'}
              {wellness.mood === 'neutral' && '😐'}
              {wellness.mood === 'sad' && '😢'}
              {wellness.mood === 'excited' && '🤗'}
              {wellness.mood === 'stressed' && '😰'}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {wellness.mood}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard