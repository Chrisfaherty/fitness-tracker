import { useState } from 'react'
import { Trash2, Calculator } from 'lucide-react'

const SimpleFoodInput = ({ 
  food, 
  mealIndex, 
  foodIndex, 
  onFoodChange, 
  onRemove, 
  errors = {} 
}) => {
  const [showAutoCalc, setShowAutoCalc] = useState(false)

  // Simple auto-calculation for common foods
  const autoCalculateMacros = () => {
    const foodName = food.name.toLowerCase().trim()
    const amountText = food.amount.replace(/[^\d.,]/g, '').replace(',', '.')
    const amount = parseFloat(amountText)
    
    console.log('🧮 Auto-calc triggered:', { foodName, amountText, amount })
    
    if (isNaN(amount) || amount <= 0) {
      console.log('❌ Invalid amount:', food.amount)
      return
    }
    
    // Expanded database of common foods (per 100g)
    const commonFoods = {
      'chicken breast': { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      'chicken': { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      'breast': { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
      'salmon': { calories: 208, protein: 25, carbs: 0, fats: 12 },
      'fish': { calories: 150, protein: 25, carbs: 0, fats: 5 },
      'rice': { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
      'brown rice': { calories: 123, protein: 2.6, carbs: 25, fats: 0.9 },
      'white rice': { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
      'broccoli': { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
      'banana': { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
      'apple': { calories: 52, protein: 0.3, carbs: 14, fats: 0.2 },
      'oats': { calories: 389, protein: 17, carbs: 66, fats: 7 },
      'oatmeal': { calories: 68, protein: 2.4, carbs: 12, fats: 1.4 },
      'egg': { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
      'eggs': { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
      'avocado': { calories: 160, protein: 2, carbs: 9, fats: 15 },
      'beef': { calories: 250, protein: 26, carbs: 0, fats: 15 },
      'ground beef': { calories: 250, protein: 26, carbs: 0, fats: 15 },
      'turkey': { calories: 135, protein: 30, carbs: 0, fats: 1 },
      'pasta': { calories: 131, protein: 5, carbs: 25, fats: 1.1 },
      'bread': { calories: 265, protein: 9, carbs: 49, fats: 3.2 },
      'potato': { calories: 77, protein: 2, carbs: 17, fats: 0.1 },
      'sweet potato': { calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
      'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
      'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
      'cheese': { calories: 402, protein: 25, carbs: 1.3, fats: 33 },
      'milk': { calories: 42, protein: 3.4, carbs: 5, fats: 1 },
      'yogurt': { calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
      'almonds': { calories: 579, protein: 21, carbs: 22, fats: 50 },
      'peanuts': { calories: 567, protein: 26, carbs: 16, fats: 49 }
    }

    console.log('🔍 Available foods:', Object.keys(commonFoods))

    // Improved matching - try exact match first, then partial matches
    let matchedFood = commonFoods[foodName]
    let matchedKey = foodName
    
    if (!matchedFood) {
      // Try partial matching
      matchedKey = Object.keys(commonFoods).find(key => {
        const keyWords = key.split(' ')
        const foodWords = foodName.split(' ')
        
        // Check if any word from food name matches any word from key
        return keyWords.some(keyWord => 
          foodWords.some(foodWord => 
            keyWord.includes(foodWord) || foodWord.includes(keyWord)
          )
        )
      })
      
      if (matchedKey) {
        matchedFood = commonFoods[matchedKey]
      }
    }

    console.log('🎯 Matched food:', matchedKey, matchedFood)

    if (matchedFood) {
      const nutrition = matchedFood
      const multiplier = amount / 100 // assuming input is in grams

      const calculatedMacros = {
        calories: Math.round(nutrition.calories * multiplier),
        protein: Math.round(nutrition.protein * multiplier * 10) / 10,
        carbs: Math.round(nutrition.carbs * multiplier * 10) / 10,
        fats: Math.round(nutrition.fats * multiplier * 10) / 10
      }

      console.log('✅ Calculated macros:', calculatedMacros)

      onFoodChange(mealIndex, foodIndex, 'calories', calculatedMacros.calories)
      onFoodChange(mealIndex, foodIndex, 'protein', calculatedMacros.protein)
      onFoodChange(mealIndex, foodIndex, 'carbs', calculatedMacros.carbs)
      onFoodChange(mealIndex, foodIndex, 'fats', calculatedMacros.fats)
      
      setShowAutoCalc(true)
      setTimeout(() => setShowAutoCalc(false), 3000)
    } else {
      console.log('❌ No match found for:', foodName)
      // Show available options
      const suggestions = Object.keys(commonFoods).filter(key => 
        key.includes(foodName.split(' ')[0]) || foodName.split(' ')[0].includes(key)
      ).slice(0, 3)
      
      if (suggestions.length > 0) {
        console.log('💡 Suggestions:', suggestions.join(', '))
      }
    }
  }

  // Handle macro change
  const handleMacroChange = (field, value) => {
    const numericValue = parseFloat(value) || 0
    onFoodChange(mealIndex, foodIndex, field, numericValue)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Food Item {foodIndex + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-600"
          title="Remove Food"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name * 
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              (try: chicken, rice, eggs, etc.)
            </span>
          </label>
          <input
            type="text"
            value={food.name}
            onChange={(e) => onFoodChange(mealIndex, foodIndex, 'name', e.target.value)}
            className={`w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              errors[`meal_${mealIndex}_food_${foodIndex}_name`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., chicken breast, salmon, rice"
          />
          {errors[`meal_${mealIndex}_food_${foodIndex}_name`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Required</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount *
          </label>
          <div className="relative">
            <input
              type="text"
              value={food.amount}
              onChange={(e) => onFoodChange(mealIndex, foodIndex, 'amount', e.target.value)}
              className={`w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                errors[`meal_${mealIndex}_food_${foodIndex}_amount`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="150g"
            />
            {food.name && food.amount && (
              <button
                type="button"
                onClick={autoCalculateMacros}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-600"
                title="Auto-calculate macros"
              >
                <Calculator size={12} />
              </button>
            )}
          </div>
          {errors[`meal_${mealIndex}_food_${foodIndex}_amount`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Required</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Calories *
          </label>
          <input
            type="number"
            min="0"
            value={food.calories}
            onChange={(e) => handleMacroChange('calories', e.target.value)}
            className={`w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              errors[`meal_${mealIndex}_food_${foodIndex}_calories`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors[`meal_${mealIndex}_food_${foodIndex}_calories`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Required</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Protein (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={food.protein}
            onChange={(e) => handleMacroChange('protein', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Carbs (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={food.carbs}
            onChange={(e) => handleMacroChange('carbs', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fats (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={food.fats}
            onChange={(e) => handleMacroChange('fats', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Auto-calculation notification */}
      {showAutoCalc && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg animate-fade-in">
          <Calculator size={14} />
          <span>Macros auto-calculated! 🎉</span>
        </div>
      )}
    </div>
  )
}

export default SimpleFoodInput