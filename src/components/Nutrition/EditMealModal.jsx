import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import SmartFoodInput from '../Admin/SmartFoodInput'

const EditMealModal = ({ 
  meal,
  isOpen, 
  onClose, 
  onUpdate 
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
  const [mealType, setMealType] = useState('breakfast')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with meal data when modal opens
  useEffect(() => {
    if (isOpen && meal) {
      console.log('📝 Initializing edit form with meal:', meal)
      setFoodItem({
        name: meal.name || '',
        amount: meal.servingSize || meal.amount || '',
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fats: meal.fats || 0,
        selectedFood: null
      })
      setMealType(meal.mealType || 'breakfast')
      setErrors({})
    }
  }, [isOpen, meal])

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
      const updatedMealData = {
        name: foodItem.name.trim(),
        calories: foodItem.calories,
        protein: foodItem.protein || 0,
        carbs: foodItem.carbs || 0,
        fats: foodItem.fats || 0,
        servingSize: foodItem.amount.trim(),
        mealType: mealType,
        amount: foodItem.amount.trim()
      }

      console.log('📝 Updating meal with data:', updatedMealData)
      onUpdate(meal.id, updatedMealData)
      onClose()
    } catch (error) {
      console.error('❌ Error updating meal:', error)
      setErrors({ submit: 'Failed to update meal. Please try again.' })
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
    setMealType('breakfast')
    setErrors({})
  }

  const handleFoodChange = (mealIndex, foodIndex, field, value) => {
    console.log('🍎 Food change during edit:', { field, value })
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
    // Not used in single item editing, but required for SmartFoodInput
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen || !meal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Food Item
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Modify the quantity and details of your food entry
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Meal Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Currently Editing
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-200">
              <span className="font-medium">{meal.name}</span>
              <span className="mx-2">•</span>
              <span>{meal.servingSize || meal.amount}</span>
              <span className="mx-2">•</span>
              <span>{meal.calories} calories</span>
            </div>
          </div>

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
              💡 <strong>Tip:</strong> You can change the food type by typing a new name, or just adjust the quantity to recalculate macros automatically!
            </div>
          </div>

          {/* Nutrition Changes Preview */}
          {(foodItem.calories !== meal.calories || 
            foodItem.protein !== meal.protein || 
            foodItem.carbs !== meal.carbs || 
            foodItem.fats !== meal.fats) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-3">
                📊 Nutrition Changes Preview
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-yellow-700 dark:text-yellow-200">Calories</div>
                  <div className="font-medium">
                    {meal.calories} → {foodItem.calories}
                    <span className={`ml-1 ${(foodItem.calories - meal.calories) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ({(foodItem.calories - meal.calories) > 0 ? '+' : ''}{foodItem.calories - meal.calories})
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-yellow-700 dark:text-yellow-200">Protein</div>
                  <div className="font-medium">
                    {meal.protein}g → {foodItem.protein}g
                    <span className={`ml-1 ${(foodItem.protein - meal.protein) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({(foodItem.protein - meal.protein) > 0 ? '+' : ''}{foodItem.protein - meal.protein}g)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-yellow-700 dark:text-yellow-200">Carbs</div>
                  <div className="font-medium">
                    {meal.carbs}g → {foodItem.carbs}g
                    <span className={`ml-1 ${(foodItem.carbs - meal.carbs) > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      ({(foodItem.carbs - meal.carbs) > 0 ? '+' : ''}{foodItem.carbs - meal.carbs}g)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-yellow-700 dark:text-yellow-200">Fats</div>
                  <div className="font-medium">
                    {meal.fats}g → {foodItem.fats}g
                    <span className={`ml-1 ${(foodItem.fats - meal.fats) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      ({(foodItem.fats - meal.fats) > 0 ? '+' : ''}{foodItem.fats - meal.fats}g)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              onClick={handleClose}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Food Item
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditMealModal