import { useState } from 'react'
import { Plus, X, AlertCircle } from 'lucide-react'
import SmartFoodInput from '../Admin/SmartFoodInput'

const MacroEntry = ({ 
  onAdd, 
  onClose, 
  isOpen, 
  defaultMealType = 'breakfast' 
}) => {
  const [foodItem, setFoodItem] = useState({
    name: '',
    amount: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    selectedFood: null
  })
  const [mealType, setMealType] = useState(defaultMealType)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    if (!foodItem.name.trim()) {
      newErrors.food_name = 'Food name is required'
    }
    
    if (!foodItem.amount.trim()) {
      newErrors.food_amount = 'Amount is required'
    }
    
    if (!foodItem.calories || foodItem.calories <= 0) {
      newErrors.food_calories = 'Calories must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const entry = {
        name: foodItem.name.trim(),
        calories: foodItem.calories,
        protein: foodItem.protein || 0,
        carbs: foodItem.carbs || 0,
        fats: foodItem.fats || 0,
        servingSize: foodItem.amount.trim(),
        mealType: mealType
      }

      console.log('📝 Adding nutrition entry:', entry)
      onAdd(entry)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error adding manual entry:', error)
      setErrors({ submit: 'Failed to add food entry. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFoodItem({
      name: '',
      amount: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      selectedFood: null
    })
    setMealType(defaultMealType)
    setErrors({})
  }

  const handleFoodChange = (mealIndex, foodIndex, field, value) => {
    console.log('🍎 Food change:', { field, value })
    setFoodItem(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear related error
    if (errors[`food_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`food_${field}`]: ''
      }))
    }
  }

  const handleRemove = () => {
    // Not used in single item entry, but required for SmartFoodInput
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Food Manually
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meal Type *
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="breakfast">🌅 Breakfast</option>
              <option value="lunch">☀️ Lunch</option>
              <option value="dinner">🌙 Dinner</option>
              <option value="snacks">🍎 Snacks</option>
            </select>
          </div>

          {/* Smart Food Input */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Food Details
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <SmartFoodInput
                food={foodItem}
                mealIndex={0}
                foodIndex={0}
                onFoodChange={handleFoodChange}
                onRemove={handleRemove}
                errors={errors}
              />
            </div>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              💡 <strong>Tip:</strong> Start typing a food name (like "chicken", "rice", "Fage yogurt") to see suggestions with automatic macro calculation!
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3 font-medium"
              disabled={isSubmitting || !foodItem.name || !foodItem.amount || !foodItem.calories}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MacroEntry