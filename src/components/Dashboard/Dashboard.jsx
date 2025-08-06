import { useEffect, useState } from 'react'
import useFitnessStore from '../../store/fitnessStore'
import authService from '../../services/auth/authService'
import { Calendar, Target, TrendingUp, Activity } from 'lucide-react'

const Dashboard = () => {
  const { user, initializeUser, getCurrentUserData } = useFitnessStore()
  const [currentUser, setCurrentUser] = useState(null)
  const [userFitnessData, setUserFitnessData] = useState({
    nutrition: { dailyCalories: 0, meals: [] },
    activity: { dailySteps: 0, activeMinutes: 0, workouts: [] },
    wellness: { sleepHours: 0, mood: 'happy' },
    body: { measurements: {} }
  })

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (user) {
      setCurrentUser(user)
      initializeUser(user.id)
      const data = getCurrentUserData()
      if (data) {
        setUserFitnessData(data)
      }
    }
  }, [initializeUser, getCurrentUserData])

  const { nutrition, activity, wellness } = userFitnessData

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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gradient mb-3">
          Welcome back{currentUser ? `, ${currentUser.firstName}` : ''}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Here's your fitness overview for today
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
          <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const percentage = Math.min((stat.value / stat.target) * 100, 100)
          const gradients = [
            'from-blue-500 to-cyan-500',
            'from-green-500 to-emerald-500', 
            'from-purple-500 to-pink-500',
            'from-indigo-500 to-purple-500'
          ]
          
          return (
            <div key={stat.name} className="stat-card group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {stat.name}
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="ml-2 text-sm text-slate-400">
                      / {stat.target.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-r ${gradients[index]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {percentage.toFixed(0)}% complete
                  </p>
                  <span className={`badge ${percentage >= 100 ? 'badge-success' : percentage >= 75 ? 'badge-warning' : 'badge-info'}`}>
                    {percentage >= 100 ? 'Goal Reached!' : percentage >= 75 ? 'Almost There' : 'Keep Going'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-elevated animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">🍽️</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Recent Meals
            </h3>
          </div>
          {nutrition.meals.length > 0 ? (
            <div className="space-y-3">
              {nutrition.meals.slice(-3).map((meal, index) => (
                <div key={meal.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {meal.name}
                  </span>
                  <span className="badge badge-info">
                    {meal.calories} cal
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl opacity-50">🍽️</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No meals logged today
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Start tracking your nutrition!
              </p>
            </div>
          )}
        </div>

        <div className="card-elevated animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Recent Workouts
            </h3>
          </div>
          {activity.workouts.length > 0 ? (
            <div className="space-y-3">
              {activity.workouts.slice(-3).map((workout, index) => (
                <div key={workout.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {workout.name}
                  </span>
                  <span className="badge badge-success">
                    {workout.duration} min
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No workouts logged today
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Time to get moving!
              </p>
            </div>
          )}
        </div>

        <div className="card-elevated animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">😊</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Today's Mood
            </h3>
          </div>
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <div className="text-4xl">
                {wellness.mood === 'happy' && '😊'}
                {wellness.mood === 'neutral' && '😐'}
                {wellness.mood === 'sad' && '😢'}
                {wellness.mood === 'excited' && '🤗'}
                {wellness.mood === 'stressed' && '😰'}
                {!wellness.mood && '😊'}
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white capitalize mb-2">
              {wellness.mood || 'Happy'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              How are you feeling today?
            </p>
          </div>
        </div>
      </div>

      {/* Motivational Section */}
      <div className="card-gradient p-8 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gradient mb-4">
            Keep Up the Great Work! 💪
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
            Every step counts towards your fitness journey. Stay consistent and celebrate your progress!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                🔥 {Math.floor(Math.random() * 7) + 1} day streak
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                ⭐ Level {Math.floor(Math.random() * 10) + 1} Fitness
              </p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                🏆 {Math.floor(Math.random() * 20) + 5} achievements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard