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

  const ActivityCard = ({ title, value, unit, icon: Icon, gradient }) => (
    <div className="stat-card group animate-scale-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {value.toLocaleString()}{unit}
          </p>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-3">Activity Tracker</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Monitor your workouts, steps, and daily movement goals
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddWorkout(true)}
          className="btn-primary flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          <span>Add Workout</span>
        </button>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActivityCard
          title="Steps Today"
          value={activity.dailySteps}
          unit=""
          icon={Timer}
          gradient="from-blue-500 to-cyan-500"
        />
        <ActivityCard
          title="Active Minutes"
          value={activity.activeMinutes}
          unit=" min"
          icon={Play}
          gradient="from-green-500 to-emerald-500"
        />
        <ActivityCard
          title="Calories Burned"
          value={activity.caloriesBurned}
          unit=" cal"
          icon={Zap}
          gradient="from-red-500 to-pink-500"
        />
      </div>

      {/* Quick Start Workouts */}
      <div className="card-elevated animate-slide-up">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Quick Start Workouts
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workoutTypes.map((type) => (
            <button
              key={type.id}
              className="group p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-indigo-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-300 text-center transform hover:scale-105"
              onClick={() => {
                setNewWorkout({ ...newWorkout, type: type.id })
                setShowAddWorkout(true)
              }}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{type.icon}</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{type.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="card-elevated animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Recent Workouts
          </h2>
        </div>
        {activity.workouts.length > 0 ? (
          <div className="space-y-4">
            {activity.workouts.slice().reverse().map((workout, index) => (
              <div key={workout.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">
                      {workoutTypes.find(t => t.id === workout.type)?.icon || '🏃‍♂️'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{workout.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-1">
                      {workout.type} • {new Date(workout.timestamp).toLocaleDateString()}
                    </p>
                    {workout.notes && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 rounded-lg px-3 py-1 mt-2">
                        📝 {workout.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col gap-1">
                    <span className="badge badge-info text-sm">
                      {workout.duration} min
                    </span>
                    <span className="badge badge-success text-sm">
                      {workout.caloriesBurned} cal
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
              No workouts logged yet
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Add your first workout to start tracking your fitness journey!
            </p>
            <button
              onClick={() => setShowAddWorkout(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add your first workout
            </button>
          </div>
        )}
      </div>

      {/* Add Workout Modal */}
      {showAddWorkout && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content w-full max-w-md animate-scale-in">
            <div className="flex items-center space-x-4 p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Plus size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gradient">
                  Add Workout
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Log your exercise session
                </p>
              </div>
            </div>
            <form onSubmit={handleAddWorkout} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                  className="input-modern"
                  placeholder="e.g., Morning Run, Push Day, Yoga Flow"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Workout Type
                </label>
                <select
                  value={newWorkout.type}
                  onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                  className="input-modern"
                >
                  {workoutTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.duration}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                    className="input-modern"
                    placeholder="30"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Calories Burned
                  </label>
                  <input
                    type="number"
                    value={newWorkout.caloriesBurned}
                    onChange={(e) => setNewWorkout({ ...newWorkout, caloriesBurned: e.target.value })}
                    className="input-modern"
                    placeholder="250"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Notes (optional)
                </label>
                <textarea
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                  className="input-modern"
                  rows="3"
                  placeholder="How did it feel? Any personal records or achievements?"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddWorkout(false)}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  <span>Add Workout</span>
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