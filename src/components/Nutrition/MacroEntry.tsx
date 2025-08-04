import { useState } from 'react'
import { Plus, X, AlertCircle } from 'lucide-react'
import { MacroEntry, NutritionError, MealType } from '../../types/nutrition'
import { validateCalories, validateMacros, validateRequired } from '../../utils/validation'

interface MacroEntryProps {
  onAdd: (entry: MacroEntry & { name: string; mealType: MealType }) => void
  onClose: () => void
  isOpen: boolean
  defaultMealType?: MealType
}

const MacroEntryComponent: React.FC<MacroEntryProps> = ({ 
  onAdd, 
  onClose, 
  isOpen, 
  defaultMealType = 'breakfast' 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    servingSize: '',
    mealType: defaultMealType
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate name
    const nameValidation = validateRequired(formData.name, 'Food name')
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || 'Food name is required'
    }

    // Validate calories
    const caloriesValidation = validateCalories(formData.calories)
    if (!caloriesValidation.isValid) {
      newErrors.calories = caloriesValidation.error || 'Invalid calories'
    }

    // Validate macros
    const macrosValidation = validateMacros(formData.protein, formData.carbs, formData.fats)
    if (!macrosValidation.isValid) {
      macrosValidation.errors.forEach((error, index) => {
        if (error.includes('Protein')) newErrors.protein = error
        if (error.includes('Carbs')) newErrors.carbs = error
        if (error.includes('Fats')) newErrors.fats = error
      })
    }

    // Validate serving size
    const servingSizeValidation = validateRequired(formData.servingSize, 'Serving size')
    if (!servingSizeValidation.isValid) {
      newErrors.servingSize = servingSizeValidation.error || 'Serving size is required'
    }

    // Cross-validation: Check if macro calories roughly match total calories
    const calories = parseFloat(formData.calories) || 0
    const protein = parseFloat(formData.protein) || 0
    const carbs = parseFloat(formData.carbs) || 0
    const fats = parseFloat(formData.fats) || 0
    
    const calculatedCalories = (protein * 4) + (carbs * 4) + (fats * 9)
    const difference = Math.abs(calories - calculatedCalories)
    
    if (calories > 0 && difference > calories * 0.2) { // Allow 20% difference
      newErrors.macros = `Macro breakdown doesn't match total calories. Calculated: ${Math.round(calculatedCalories)} cal`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const entry = {
        name: formData.name.trim(),
        calories: parseFloat(formData.calories),
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fats: parseFloat(formData.fats) || 0,
        servingSize: formData.servingSize.trim(),
        mealType: formData.mealType
      }

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
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      servingSize: '',
      mealType: defaultMealType
    })
    setErrors({})
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        if (field === 'protein' || field === 'carbs' || field === 'fats') {
          delete newErrors.macros
        }
        return newErrors
      })
    }
  }

  const calculateCaloriesFromMacros = () => {
    const protein = parseFloat(formData.protein) || 0
    const carbs = parseFloat(formData.carbs) || 0
    const fats = parseFloat(formData.fats) || 0
    
    const calculatedCalories = (protein * 4) + (carbs * 4) + (fats * 9)
    
    if (calculatedCalories > 0) {
      handleInputChange('calories', Math.round(calculatedCalories).toString())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Food Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Food Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
              } focus:ring-2 focus:border-transparent`}
              placeholder="e.g., Homemade sandwich"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meal *
            </label>
            <select
              value={formData.mealType}
              onChange={(e) => handleInputChange('mealType', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>

          {/* Serving Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Serving Size *
            </label>
            <input
              type="text"
              value={formData.servingSize}
              onChange={(e) => handleInputChange('servingSize', e.target.value)}
              className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.servingSize 
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
              } focus:ring-2 focus:border-transparent`}
              placeholder="e.g., 1 cup, 100g, 1 medium"
              disabled={isSubmitting}
            />
            {errors.servingSize && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.servingSize}
              </p>
            )}
          </div>

          {/* Calories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Calories *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={formData.calories}
                onChange={(e) => handleInputChange('calories', e.target.value)}
                className={`flex-1 p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.calories 
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } focus:ring-2 focus:border-transparent`}
                placeholder="250"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={calculateCaloriesFromMacros}
                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={isSubmitting}
                title="Calculate from macros"
              >
                Calc
              </button>
            </div>
            {errors.calories && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.calories}
              </p>
            )}
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.protein}
                onChange={(e) => handleInputChange('protein', e.target.value)}
                className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.protein 
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } focus:ring-2 focus:border-transparent`}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.carbs}
                onChange={(e) => handleInputChange('carbs', e.target.value)}
                className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.carbs 
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } focus:ring-2 focus:border-transparent`}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fats (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.fats}
                onChange={(e) => handleInputChange('fats', e.target.value)}
                className={`w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.fats 
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
                } focus:ring-2 focus:border-transparent`}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Macro validation errors */}
          {(errors.protein || errors.carbs || errors.fats || errors.macros) && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {errors.protein && <p className="text-sm text-red-600 dark:text-red-400">{errors.protein}</p>}
              {errors.carbs && <p className="text-sm text-red-600 dark:text-red-400">{errors.carbs}</p>}
              {errors.fats && <p className="text-sm text-red-600 dark:text-red-400">{errors.fats}</p>}
              {errors.macros && <p className="text-sm text-red-600 dark:text-red-400">{errors.macros}</p>}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Food
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MacroEntryComponent