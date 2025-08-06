import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, GripVertical } from 'lucide-react'
import storageService from '../../services/storage'

const WorkoutPlanModal = ({ plan, isEditing, clients, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'beginner',
    duration: 30,
    daysPerWeek: 3,
    category: 'strength',
    exercises: [],
    assignedClients: []
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing && plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        level: plan.level || 'beginner',
        duration: plan.duration || 30,
        daysPerWeek: plan.daysPerWeek || 3,
        category: plan.category || 'strength',
        exercises: plan.exercises || [],
        assignedClients: plan.assignedClients || []
      })
    }
  }, [plan, isEditing])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    
    if (formData.duration < 10 || formData.duration > 180) {
      newErrors.duration = 'Duration must be between 10 and 180 minutes'
    }
    
    if (formData.daysPerWeek < 1 || formData.daysPerWeek > 7) {
      newErrors.daysPerWeek = 'Days per week must be between 1 and 7'
    }
    
    if (formData.exercises.length === 0) {
      newErrors.exercises = 'At least one exercise is required'
    }

    // Validate each exercise
    formData.exercises.forEach((exercise, index) => {
      if (!exercise.name.trim()) {
        newErrors[`exercise_${index}_name`] = 'Exercise name is required'
      }
      if (!exercise.sets || exercise.sets < 1) {
        newErrors[`exercise_${index}_sets`] = 'Sets must be at least 1'
      }
      if (!exercise.reps.trim()) {
        newErrors[`exercise_${index}_reps`] = 'Reps/Duration is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    
    try {
      const planData = {
        ...formData,
        id: isEditing ? plan.id : `plan_${Date.now()}`,
        createdAt: isEditing ? plan.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await storageService.save('workoutPlans', planData, planData.id)
      
      onSave()
      onClose()
      console.log(`Workout plan ${isEditing ? 'updated' : 'created'} successfully`)
    } catch (error) {
      console.error('Error saving workout plan:', error)
      setErrors({ submit: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const addExercise = () => {
    const newExercise = {
      name: '',
      sets: 3,
      reps: '',
      rest: 60,
      notes: ''
    }
    
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
  }

  const removeExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
    
    // Clear related errors
    const newErrors = { ...errors }
    delete newErrors[`exercise_${index}_name`]
    delete newErrors[`exercise_${index}_sets`]
    delete newErrors[`exercise_${index}_reps`]
    setErrors(newErrors)
  }

  const updateExercise = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }))
    
    // Clear related error
    const errorKey = `exercise_${index}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }))
    }
  }

  const moveExercise = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= formData.exercises.length) return

    const newExercises = [...formData.exercises]
    const temp = newExercises[index]
    newExercises[index] = newExercises[newIndex]
    newExercises[newIndex] = temp

    setFormData(prev => ({
      ...prev,
      exercises: newExercises
    }))
  }

  const handleClientAssignment = (clientId) => {
    setFormData(prev => ({
      ...prev,
      assignedClients: prev.assignedClients.includes(clientId)
        ? prev.assignedClients.filter(id => id !== clientId)
        : [...prev.assignedClients, clientId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Workout Plan' : 'Create New Workout Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Beginner Full Body Workout"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="strength">Strength Training</option>
                <option value="cardio">Cardio</option>
                <option value="flexibility">Flexibility</option>
                <option value="sports">Sports Specific</option>
                <option value="rehabilitation">Rehabilitation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Describe the workout plan, its goals, and who it's designed for..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fitness Level
              </label>
              <select
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="10"
                max="180"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Days per Week *
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.daysPerWeek}
                onChange={(e) => handleInputChange('daysPerWeek', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.daysPerWeek ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.daysPerWeek && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.daysPerWeek}</p>
              )}
            </div>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Exercises *
              </h3>
              <button
                type="button"
                onClick={addExercise}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Exercise</span>
              </button>
            </div>

            {errors.exercises && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errors.exercises}</p>
            )}

            <div className="space-y-4">
              {formData.exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <GripVertical size={16} className="text-gray-400 cursor-move" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Exercise {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === formData.exercises.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Remove Exercise"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Exercise Name *
                      </label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => updateExercise(index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                          errors[`exercise_${index}_name`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="e.g., Push-ups"
                      />
                      {errors[`exercise_${index}_name`] && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors[`exercise_${index}_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sets *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                          errors[`exercise_${index}_sets`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors[`exercise_${index}_sets`] && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors[`exercise_${index}_sets`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reps/Duration *
                      </label>
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${
                          errors[`exercise_${index}_reps`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="e.g., 10-12 or 30 sec"
                      />
                      {errors[`exercise_${index}_reps`] && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors[`exercise_${index}_reps`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rest (seconds)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={exercise.rest}
                        onChange={(e) => updateExercise(index, 'rest', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={exercise.notes}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Form cues, modifications, or additional instructions..."
                    />
                  </div>
                </div>
              ))}

              {formData.exercises.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No exercises added yet. Click "Add Exercise" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Client Assignment */}
          {clients && clients.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Assign to Clients (optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clients.map(client => (
                  <label
                    key={client.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedClients.includes(client.id)}
                      onChange={() => handleClientAssignment(client.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {client.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : (isEditing ? 'Update Plan' : 'Create Plan')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkoutPlanModal