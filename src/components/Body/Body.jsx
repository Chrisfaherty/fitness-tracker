import { useState } from 'react'
import useFitnessStore from '../../store/fitnessStore'
import { Plus, Camera, TrendingUp, Scale } from 'lucide-react'

const Body = () => {
  const { body, addMeasurement, addPhoto } = useFitnessStore()
  const [showAddMeasurement, setShowAddMeasurement] = useState(false)
  const [activeTab, setActiveTab] = useState('measurements')
  const [newMeasurement, setNewMeasurement] = useState({
    type: 'weight',
    value: '',
    date: new Date().toISOString().split('T')[0]
  })

  const measurementTypes = [
    { id: 'weight', name: 'Weight', unit: 'lbs', icon: Scale },
    { id: 'bodyFat', name: 'Body Fat', unit: '%', icon: TrendingUp },
    { id: 'muscleMass', name: 'Muscle Mass', unit: 'lbs', icon: TrendingUp },
    { id: 'waist', name: 'Waist', unit: 'in', icon: TrendingUp },
    { id: 'chest', name: 'Chest', unit: 'in', icon: TrendingUp },
    { id: 'arms', name: 'Arms', unit: 'in', icon: TrendingUp },
    { id: 'thighs', name: 'Thighs', unit: 'in', icon: TrendingUp },
  ]

  const handleAddMeasurement = (e) => {
    e.preventDefault()
    const measurement = {
      value: parseFloat(newMeasurement.value),
      date: newMeasurement.date
    }
    
    addMeasurement(newMeasurement.type, measurement)
    setNewMeasurement({
      type: 'weight',
      value: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowAddMeasurement(false)
  }

  const getLatestMeasurement = (type) => {
    const measurements = body.measurements[type]
    return measurements.length > 0 ? measurements[measurements.length - 1] : null
  }

  const getTrend = (type) => {
    const measurements = body.measurements[type]
    if (measurements.length < 2) return null
    
    const latest = measurements[measurements.length - 1]
    const previous = measurements[measurements.length - 2]
    const change = latest.value - previous.value
    
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    }
  }

  const MeasurementCard = ({ type, name, unit, icon: Icon }) => {
    const latest = getLatestMeasurement(type)
    const trend = getTrend(type)
    
    return (
      <div className="stat-card group animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Icon size={20} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">{name}</h3>
          </div>
        </div>
        
        {latest ? (
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {latest.value}{unit}
            </p>
            {trend && (
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  trend.direction === 'up' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                  trend.direction === 'down' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  <span>
                    {trend.direction === 'up' && '↗'}
                    {trend.direction === 'down' && '↘'}
                    {trend.direction === 'same' && '→'}
                  </span>
                  {trend.change}{unit}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  vs last measurement
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              📅 {new Date(latest.date).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">No data yet</p>
            <p className="text-slate-400 text-xs">Add your first measurement</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-3">Body Composition</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Track your body measurements, weight, and physical progress over time
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddMeasurement(true)}
            className="btn-primary flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            <span>Add Measurement</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card-elevated">
        <div className="border-b border-slate-200/50 dark:border-slate-700/50">
          <nav className="flex space-x-2 p-2">
            <button
              onClick={() => setActiveTab('measurements')}
              className={`${
                activeTab === 'measurements'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
              } flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105`}
            >
              <Scale size={18} />
              <span>Measurements</span>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`${
                activeTab === 'photos'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
              } flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105`}
            >
              <Camera size={18} />
              <span>Progress Photos</span>
            </button>
          </nav>
        </div>

        {/* Measurements Tab */}
        {activeTab === 'measurements' && (
          <div className="p-8 space-y-8">
            {/* Measurements Grid */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Scale size={18} className="text-white" />
                </div>
                Body Measurements Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {measurementTypes.map((type, index) => (
                  <div key={type.id} style={{ animationDelay: `${index * 0.1}s` }}>
                    <MeasurementCard
                      type={type.id}
                      name={type.name}
                      unit={type.unit}
                      icon={type.icon}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Measurements */}
            <div className="card-elevated animate-slide-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Measurements
                </h2>
              </div>
              <div className="space-y-4">
                {measurementTypes.map((type) => {
                  const latest = getLatestMeasurement(type.id)
                  if (!latest) return null
                  
                  return (
                    <div key={type.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <type.icon size={18} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {type.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                          {latest.value}{type.unit}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          📅 {new Date(latest.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {measurementTypes.filter(type => getLatestMeasurement(type.id)).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Scale className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                    No measurements recorded yet
                  </p>
                  <p className="text-slate-400 text-sm mb-4">
                    Start tracking your body composition journey!
                  </p>
                  <button
                    onClick={() => setShowAddMeasurement(true)}
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add your first measurement
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Photos Tab */}
        {activeTab === 'photos' && (
          <div className="p-8 space-y-8">
            {/* Photo Upload */}
            <div className="card-gradient text-center py-16 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Camera size={40} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gradient mb-3">
                Capture Your Progress
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-6 max-w-md mx-auto">
                Take photos to visually track your transformation journey over time
              </p>
              <button
                className="btn-primary shadow-lg"
                onClick={() => {
                  // This would trigger camera access in a real implementation
                  alert('📸 Camera access would be implemented here for PWA functionality! This would allow users to take progress photos directly from the app.')
                }}
              >
                <Camera size={20} className="mr-2" />
                Take Progress Photo
              </button>
            </div>

            {/* Photo Grid */}
            {body.photos.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Camera size={18} className="text-white" />
                  </div>
                  Progress Gallery
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {body.photos.map((photo, index) => (
                    <div key={photo.id} className="card-elevated animate-scale-in group" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Camera size={32} className="text-slate-400" />
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                        📅 {new Date(photo.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card-elevated text-center py-16 animate-slide-up">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                  No progress photos yet
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  Document your fitness journey with before and after photos!
                </p>
                <button
                  className="btn-secondary inline-flex items-center gap-2"
                  onClick={() => {
                    alert('📸 Camera access would be implemented here for PWA functionality!')
                  }}
                >
                  <Camera size={16} />
                  Take your first photo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Measurement Modal */}
      {showAddMeasurement && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content w-full max-w-md animate-scale-in">
            <div className="flex items-center space-x-4 p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Plus size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gradient">
                  Add Measurement
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Track your body composition progress
                </p>
              </div>
            </div>
            <form onSubmit={handleAddMeasurement} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Measurement Type
                </label>
                <select
                  value={newMeasurement.type}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, type: e.target.value })}
                  className="input-modern"
                >
                  {measurementTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      📏 {type.name} ({type.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Value ({measurementTypes.find(t => t.id === newMeasurement.type)?.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.value}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, value: e.target.value })}
                  className="input-modern"
                  placeholder={`Enter ${measurementTypes.find(t => t.id === newMeasurement.type)?.name.toLowerCase()} value`}
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Measurement Date
                </label>
                <input
                  type="date"
                  value={newMeasurement.date}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, date: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMeasurement(false)}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <Scale size={18} />
                  <span>Add Measurement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Body