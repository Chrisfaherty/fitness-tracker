import { useState } from 'react'
import useFitnessStore from '../../store/fitnessStore'
import { Plus, Play, Timer, Zap } from 'lucide-react'

const Activity = () => {
  const { activity, addWorkout, updateActivity } = useFitnessStore()
  const [showAddWorkout, setShowAddWorkout] = useState(false)
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    type: 'cardio',
    duration: '',
    caloriesBurned: '',
    notes: ''
  })

  const handleAddWorkout = (e) => {
    e.preventDefault()
    const workout = {
      ...newWorkout,
      duration: parseInt(newWorkout.duration) || 0,
      caloriesBurned: parseInt(newWorkout.caloriesBurned) || 0,
      timestamp: new Date().toISOString()
    }
    
    addWorkout(workout)
    updateActivity({
      activeMinutes: activity.activeMinutes + workout.duration,
      caloriesBurned: activity.caloriesBurned + workout.caloriesBurned
    })
    
    setNewWorkout({
      name: '',
      type: 'cardio',
      duration: '',
      caloriesBurned: '',
      notes: ''
    })
    setShowAddWorkout(false)
  }

  const workoutTypes = [
    { id: 'cardio', name: 'Cardio', icon: '🏃‍♂️', color: 'bg-red-100 text-red-600' },
    { id: 'strength', name: 'Strength', icon: '💪', color: 'bg-blue-100 text-blue-600' },
    { id: 'flexibility', name: 'Flexibility', icon: '🧘‍♀️', color: 'bg-green-100 text-green-600' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: 'bg-yellow-100 text-yellow-600' },
  ]

  const ActivityCard = ({ title, value, unit, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value.toLocaleString()}{unit}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your workouts and daily activity
          </p>
        </div>
        <button
          onClick={() => setShowAddWorkout(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Workout
        </button>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActivityCard
          title="Steps Today"
          value={activity.dailySteps}
          unit=""
          icon={Timer}
          color="bg-blue-500"
        />
        <ActivityCard
          title="Active Minutes"
          value={activity.activeMinutes}
          unit=" min"
          icon={Play}
          color="bg-green-500"
        />
        <ActivityCard
          title="Calories Burned"
          value={activity.caloriesBurned}
          unit=" cal"
          icon={Zap}
          color="bg-red-500"
        />
      </div>

      {/* Quick Start Workouts */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Start
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workoutTypes.map((type) => (
            <button
              key={type.id}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition-colors text-center"
              onClick={() => {
                setNewWorkout({ ...newWorkout, type: type.id })
                setShowAddWorkout(true)
              }}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{type.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Workouts
        </h2>
        {activity.workouts.length > 0 ? (
          <div className="space-y-4">
            {activity.workouts.slice().reverse().map((workout) => (
              <div key={workout.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {workoutTypes.find(t => t.id === workout.type)?.icon || '🏃‍♂️'}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{workout.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {workout.type} • {new Date(workout.timestamp).toLocaleDateString()}
                    </p>
                    {workout.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {workout.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {workout.duration} min
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {workout.caloriesBurned} cal
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No workouts logged yet. Add your first workout to get started!
          </p>
        )}
      </div>

      {/* Add Workout Modal */}
      {showAddWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Workout
            </h3>
            <form onSubmit={handleAddWorkout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Morning Run"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Workout Type
                </label>
                <select
                  value={newWorkout.type}
                  onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {workoutTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    value={newWorkout.caloriesBurned}
                    onChange={(e) => setNewWorkout({ ...newWorkout, caloriesBurned: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="How did it feel? Any achievements?"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddWorkout(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Activity