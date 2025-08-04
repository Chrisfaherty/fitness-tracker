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
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon size={20} className="text-primary-500" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{name}</h3>
          </div>
        </div>
        
        {latest ? (
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {latest.value}{unit}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-sm ${
                  trend.direction === 'up' ? 'text-red-500' : 
                  trend.direction === 'down' ? 'text-green-500' : 
                  'text-gray-500'
                }`}>
                  {trend.direction === 'up' && '↗'}
                  {trend.direction === 'down' && '↘'}
                  {trend.direction === 'same' && '→'}
                  {trend.change}{unit}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  vs last
                </span>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(latest.date).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No data yet</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Body Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your body composition and progress
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMeasurement(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Measurement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('measurements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'measurements'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Measurements
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'photos'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Progress Photos
          </button>
        </nav>
      </div>

      {/* Measurements Tab */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          {/* Measurements Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {measurementTypes.map((type) => (
              <MeasurementCard
                key={type.id}
                type={type.id}
                name={type.name}
                unit={type.unit}
                icon={type.icon}
              />
            ))}
          </div>

          {/* Recent Measurements */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Measurements
            </h2>
            <div className="space-y-3">
              {measurementTypes.map((type) => {
                const latest = getLatestMeasurement(type.id)
                if (!latest) return null
                
                return (
                  <div key={type.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <type.icon size={16} className="text-primary-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {latest.value}{type.unit}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(latest.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress Photos Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="card text-center py-12">
            <Camera size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Add Progress Photo
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Take photos to track your visual progress over time
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                // This would trigger camera access in a real implementation
                alert('Camera access would be implemented here for PWA')
              }}
            >
              Take Photo
            </button>
          </div>

          {/* Photo Grid */}
          {body.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {body.photos.map((photo) => (
                <div key={photo.id} className="card p-2">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                    <Camera size={24} className="text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {new Date(photo.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No progress photos yet. Take your first photo to get started!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Measurement Modal */}
      {showAddMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Measurement
            </h3>
            <form onSubmit={handleAddMeasurement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Measurement Type
                </label>
                <select
                  value={newMeasurement.type}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {measurementTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.value}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, value: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter measurement value"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newMeasurement.date}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMeasurement(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Measurement
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