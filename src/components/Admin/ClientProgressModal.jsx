import { useState, useEffect } from 'react'
import { X, TrendingUp, Calendar, Activity, Target, Weight, BarChart3 } from 'lucide-react'
import storageService from '../../services/storage'

const ClientProgressModal = ({ client, onClose }) => {
  const [progressData, setProgressData] = useState({
    workouts: [],
    nutrition: [],
    measurements: [],
    goals: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    loadClientProgress()
  }, [client])

  const loadClientProgress = async () => {
    try {
      setLoading(true)
      
      // Load client's progress data from storage
      const workouts = await storageService.getAll(`workouts_${client.id}`) || []
      const nutrition = await storageService.getAll(`nutrition_${client.id}`) || []
      const measurements = await storageService.getAll(`measurements_${client.id}`) || []
      const goals = await storageService.getAll(`goals_${client.id}`) || []

      setProgressData({
        workouts: workouts.slice(-30), // Last 30 workouts
        nutrition: nutrition.slice(-30), // Last 30 days of nutrition
        measurements: measurements.slice(-10), // Last 10 measurements
        goals
      })
    } catch (error) {
      console.error('Error loading client progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateWorkoutStats = () => {
    const lastWeek = progressData.workouts.filter(workout => {
      const workoutDate = new Date(workout.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return workoutDate >= weekAgo
    })

    const totalWorkouts = progressData.workouts.length
    const weeklyWorkouts = lastWeek.length
    const avgDuration = progressData.workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / totalWorkouts || 0

    return {
      total: totalWorkouts,
      thisWeek: weeklyWorkouts,
      avgDuration: Math.round(avgDuration)
    }
  }

  const calculateNutritionStats = () => {
    const lastWeek = progressData.nutrition.filter(entry => {
      const entryDate = new Date(entry.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return entryDate >= weekAgo
    })

    const avgCalories = lastWeek.reduce((sum, entry) => sum + (entry.totalCalories || 0), 0) / lastWeek.length || 0
    const avgProtein = lastWeek.reduce((sum, entry) => sum + (entry.totalProtein || 0), 0) / lastWeek.length || 0

    return {
      daysLogged: lastWeek.length,
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein)
    }
  }

  const getLatestMeasurement = () => {
    if (progressData.measurements.length === 0) return null
    return progressData.measurements[progressData.measurements.length - 1]
  }

  const workoutStats = calculateWorkoutStats()
  const nutritionStats = calculateNutritionStats()
  const latestMeasurement = getLatestMeasurement()

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'workouts', name: 'Workouts', icon: Activity },
    { id: 'nutrition', name: 'Nutrition', icon: Target },
    { id: 'measurements', name: 'Measurements', icon: Weight }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {client.firstName} {client.lastName} - Progress Tracking
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Member since {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`${
                    selectedTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon size={16} />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading progress data...</span>
            </div>
          ) : (
            <>
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Total Workouts
                          </p>
                          <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                            {workoutStats.total}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            This Week
                          </p>
                          <p className="text-2xl font-semibold text-green-900 dark:text-green-100">
                            {workoutStats.thisWeek}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Target className="h-8 w-8 text-purple-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Avg Calories
                          </p>
                          <p className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
                            {nutritionStats.avgCalories}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Weight className="h-8 w-8 text-orange-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            Latest Weight
                          </p>
                          <p className="text-2xl font-semibold text-orange-900 dark:text-orange-100">
                            {latestMeasurement?.weight ? `${latestMeasurement.weight} lbs` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Recent Workouts
                      </h3>
                      {progressData.workouts.slice(-5).length > 0 ? (
                        <div className="space-y-3">
                          {progressData.workouts.slice(-5).reverse().map((workout, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {workout.type || 'Workout'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(workout.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {workout.duration} min
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {workout.calories} cal
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No workouts recorded yet
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Nutrition Summary (Last 7 Days)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Days Logged</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {nutritionStats.daysLogged}/7
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Calories</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {nutritionStats.avgCalories}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Protein</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {nutritionStats.avgProtein}g
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'workouts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Workout History
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing last 30 workouts
                    </p>
                  </div>
                  
                  {progressData.workouts.length > 0 ? (
                    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Calories
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {progressData.workouts.reverse().map((workout, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(workout.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {workout.type || 'General Workout'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {workout.duration} min
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {workout.calories} cal
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No workout data available</p>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'nutrition' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Nutrition History
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing last 30 days
                    </p>
                  </div>
                  
                  {progressData.nutrition.length > 0 ? (
                    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Calories
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Protein
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Carbs
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Fats
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {progressData.nutrition.reverse().map((entry, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(entry.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {entry.totalCalories}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {entry.totalProtein}g
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {entry.totalCarbs}g
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {entry.totalFats}g
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No nutrition data available</p>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'measurements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Body Measurements
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Progress tracking over time
                    </p>
                  </div>
                  
                  {progressData.measurements.length > 0 ? (
                    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Weight
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Body Fat %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Muscle Mass
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {progressData.measurements.reverse().map((measurement, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {new Date(measurement.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {measurement.weight ? `${measurement.weight} lbs` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {measurement.bodyFat ? `${measurement.bodyFat}%` : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {measurement.muscleMass ? `${measurement.muscleMass} lbs` : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Weight size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No measurement data available</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientProgressModal