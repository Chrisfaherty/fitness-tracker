import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, GripVertical } from 'lucide-react'
import storageService from '../../services/storage'
import SmartFoodInput from './SmartFoodInput'

const FoodPlanModal = ({ plan, isEditing, clients, onClose, onSave }) => {
  console.log('🍽️ FoodPlanModal mounted with props:', { plan, isEditing, clients: clients?.length })
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: 'maintenance',
    dailyCalories: 2000,
    macros: {
      protein: 25,
      carbs: 45,
      fats: 30
    },
    meals: [],
    guidelines: [],
    assignedClients: []
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing && plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        goal: plan.goal || 'maintenance',
        dailyCalories: plan.dailyCalories || 2000,
        macros: plan.macros || { protein: 25, carbs: 45, fats: 30 },
        meals: plan.meals || [],
        guidelines: plan.guidelines || [],
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
    
    if (formData.dailyCalories < 1000 || formData.dailyCalories > 5000) {
      newErrors.dailyCalories = 'Daily calories must be between 1000 and 5000'
    }
    
    const macroTotal = formData.macros.protein + formData.macros.carbs + formData.macros.fats
    if (macroTotal !== 100) {
      newErrors.macros = 'Macro percentages must add up to 100%'
    }
    
    if (formData.meals.length === 0) {
      newErrors.meals = 'At least one meal is required'
    }

    // Validate each meal
    formData.meals.forEach((meal, mealIndex) => {
      if (!meal.name.trim()) {
        newErrors[`meal_${mealIndex}_name`] = 'Meal name is required'
      }
      if (!meal.targetCalories || meal.targetCalories < 0) {
        newErrors[`meal_${mealIndex}_calories`] = 'Target calories must be greater than 0'
      }
      if (meal.foods.length === 0) {
        newErrors[`meal_${mealIndex}_foods`] = 'At least one food item is required'
      }

      // Validate each food item
      meal.foods.forEach((food, foodIndex) => {
        if (!food.name.trim()) {
          newErrors[`meal_${mealIndex}_food_${foodIndex}_name`] = 'Food name is required'
        }
        if (!food.amount.trim()) {
          newErrors[`meal_${mealIndex}_food_${foodIndex}_amount`] = 'Amount is required'
        }
        if (!food.calories || food.calories < 0) {
          newErrors[`meal_${mealIndex}_food_${foodIndex}_calories`] = 'Calories must be greater than 0'
        }
      })
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
        id: isEditing ? plan.id : `food_plan_${Date.now()}`,
        createdAt: isEditing ? plan.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await storageService.save('foodPlans', planData, planData.id)
      
      onSave()
      onClose()
      console.log(`Food plan ${isEditing ? 'updated' : 'created'} successfully`)
    } catch (error) {
      console.error('Error saving food plan:', error)
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

  const handleMacroChange = (macroType, value) => {
    const numValue = parseInt(value) || 0
    setFormData(prev => ({
      ...prev,
      macros: {
        ...prev.macros,
        [macroType]: numValue
      }
    }))
    
    if (errors.macros) {
      setErrors(prev => ({
        ...prev,
        macros: ''
      }))
    }
  }

  const addMeal = () => {
    const newMeal = {
      name: '',
      targetCalories: 0,
      foods: []
    }
    
    setFormData(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal]
    }))
  }

  const removeMeal = (index) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index)
    }))
    
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`meal_${index}_`)) {
        delete newErrors[key]
      }
    })
    setErrors(newErrors)
  }

  const updateMeal = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === index ? { ...meal, [field]: value } : meal
      )
    }))
    
    // Clear related error
    const errorKey = `meal_${index}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }))
    }
  }

  const addFood = (mealIndex) => {
    const newFood = {
      name: '',
      amount: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    }
    
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex ? {
          ...meal,
          foods: [...meal.foods, newFood]
        } : meal
      )
    }))
  }

  const removeFood = (mealIndex, foodIndex) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex ? {
          ...meal,
          foods: meal.foods.filter((_, j) => j !== foodIndex)
        } : meal
      )
    }))
    
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`meal_${mealIndex}_food_${foodIndex}_`)) {
        delete newErrors[key]
      }
    })
    setErrors(newErrors)
  }

  const updateFood = (mealIndex, foodIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((meal, i) => 
        i === mealIndex ? {
          ...meal,
          foods: meal.foods.map((food, j) => 
            j === foodIndex ? { ...food, [field]: value } : food
          )
        } : meal
      )
    }))
    
    // Clear related error
    const errorKey = `meal_${mealIndex}_food_${foodIndex}_${field}`
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }))
    }
  }

  const addGuideline = () => {
    setFormData(prev => ({
      ...prev,
      guidelines: [...prev.guidelines, '']
    }))
  }

  const removeGuideline = (index) => {
    setFormData(prev => ({
      ...prev,
      guidelines: prev.guidelines.filter((_, i) => i !== index)
    }))
  }

  const updateGuideline = (index, value) => {
    setFormData(prev => ({
      ...prev,
      guidelines: prev.guidelines.map((guideline, i) => 
        i === index ? value : guideline
      )
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

  const macroTotal = formData.macros.protein + formData.macros.carbs + formData.macros.fats

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Food Plan' : 'Create New Food Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                placeholder="e.g., Weight Loss Nutrition Plan"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal
              </label>
              <select
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="athletic_performance">Athletic Performance</option>
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
              placeholder="Describe the nutrition plan, its goals, and who it's designed for..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Nutrition Targets */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Nutrition Targets
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Daily Calories *
                </label>
                <input
                  type="number"
                  min="1000"
                  max="5000"
                  value={formData.dailyCalories}
                  onChange={(e) => handleInputChange('dailyCalories', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.dailyCalories ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.dailyCalories && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dailyCalories}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protein %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.macros.protein}
                  onChange={(e) => handleMacroChange('protein', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Carbs %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.macros.carbs}
                  onChange={(e) => handleMacroChange('carbs', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fats %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.macros.fats}
                  onChange={(e) => handleMacroChange('fats', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Macro validation */}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: {macroTotal}%
              </p>
              {macroTotal !== 100 && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Macros must add up to 100%
                </p>
              )}
            </div>
            
            {errors.macros && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.macros}</p>
            )}
          </div>

          {/* Meals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Meals *
              </h3>
              <button
                type="button"
                onClick={addMeal}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Meal</span>
              </button>
            </div>

            {errors.meals && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errors.meals}</p>
            )}

            <div className="space-y-6">
              {formData.meals.map((meal, mealIndex) => (
                <div
                  key={mealIndex}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      Meal {mealIndex + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeMeal(mealIndex)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Remove Meal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Meal Name *
                      </label>
                      <input
                        type="text"
                        value={meal.name}
                        onChange={(e) => updateMeal(mealIndex, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors[`meal_${mealIndex}_name`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="e.g., Breakfast, Lunch"
                      />
                      {errors[`meal_${mealIndex}_name`] && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors[`meal_${mealIndex}_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Calories *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={meal.targetCalories}
                        onChange={(e) => updateMeal(mealIndex, 'targetCalories', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors[`meal_${mealIndex}_calories`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors[`meal_${mealIndex}_calories`] && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors[`meal_${mealIndex}_calories`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Foods */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Food Items
                      </h5>
                      <button
                        type="button"
                        onClick={() => addFood(mealIndex)}
                        className="btn-secondary text-sm flex items-center space-x-1"
                      >
                        <Plus size={14} />
                        <span>Add Food</span>
                      </button>
                    </div>

                    {errors[`meal_${mealIndex}_foods`] && (
                      <p className="mb-3 text-xs text-red-600 dark:text-red-400">
                        {errors[`meal_${mealIndex}_foods`]}
                      </p>
                    )}

                    <div className="space-y-3">
                      {meal.foods.map((food, foodIndex) => (
                        <SmartFoodInput
                          key={foodIndex}
                          food={food}
                          mealIndex={mealIndex}
                          foodIndex={foodIndex}
                          onFoodChange={updateFood}
                          onRemove={() => removeFood(mealIndex, foodIndex)}
                          errors={errors}
                        />
                      ))}

                      {meal.foods.length === 0 && (
                        <div className="text-center py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No food items added yet. Click "Add Food" to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {formData.meals.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No meals added yet. Click "Add Meal" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Guidelines (optional)
              </h3>
              <button
                type="button"
                onClick={addGuideline}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Guideline</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.guidelines.map((guideline, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={guideline}
                    onChange={(e) => updateGuideline(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter a nutrition guideline..."
                  />
                  <button
                    type="button"
                    onClick={() => removeGuideline(index)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Remove Guideline"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
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

export default FoodPlanModal