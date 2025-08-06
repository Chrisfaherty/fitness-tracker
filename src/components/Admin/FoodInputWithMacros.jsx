import { useState, useEffect, useCallback } from 'react'
import { Search, Loader, Calculator, AlertCircle } from 'lucide-react'
import openFoodFactsService from '../../services/openFoodFacts'

// Simple debounce implementation
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

const FoodInputWithMacros = ({ 
  food, 
  mealIndex, 
  foodIndex, 
  onFoodChange, 
  onRemove, 
  errors = {} 
}) => {
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([])
        setShowSuggestions(false)
        return
      }

      setIsSearching(true)
      try {
        console.log('🔍 Searching for:', searchTerm)
        const results = await openFoodFactsService.searchProducts(searchTerm, 1, 10)
        console.log('🔍 Search results:', results)
        const products = results.products || []
        console.log('🔍 Found products:', products.length)
        setSearchResults(products)
        setShowSuggestions(products.length > 0)
      } catch (error) {
        console.error('❌ Food search error:', error)
        setSearchResults([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  // Handle food name change and trigger search
  const handleNameChange = (name) => {
    onFoodChange(mealIndex, foodIndex, 'name', name)
    debouncedSearch(name)
  }

  // Select food from suggestions
  const selectFood = (product) => {
    console.log('🍎 Selected food product:', product)
    onFoodChange(mealIndex, foodIndex, 'name', product.product_name || product.name)
    onFoodChange(mealIndex, foodIndex, 'selectedProduct', product)
    setShowSuggestions(false)
    
    // Calculate macros based on current amount
    if (food.amount) {
      console.log('⚖️ Current amount exists, calculating macros:', food.amount)
      calculateMacros(product, food.amount)
    } else {
      console.log('⚠️ No amount entered yet, waiting for amount input')
    }
  }

  // Calculate macros when amount changes
  const handleAmountChange = (amount) => {
    console.log('⚖️ Amount changed:', amount, 'Selected product:', !!food.selectedProduct)
    onFoodChange(mealIndex, foodIndex, 'amount', amount)
    
    if (food.selectedProduct && amount) {
      console.log('🔄 Triggering macro calculation...')
      calculateMacros(food.selectedProduct, amount)
    } else if (!food.selectedProduct) {
      console.log('⚠️ No product selected yet')
    } else if (!amount) {
      console.log('⚠️ No amount entered')
    }
  }

  // Calculate macros based on selected product and amount
  const calculateMacros = async (product, amount) => {
    if (!product || !amount) return

    setIsCalculating(true)
    try {
      const macros = calculateNutritionForAmount(product, amount)
      
      onFoodChange(mealIndex, foodIndex, 'calories', Math.round(macros.calories))
      onFoodChange(mealIndex, foodIndex, 'protein', Math.round(macros.protein * 10) / 10)
      onFoodChange(mealIndex, foodIndex, 'carbs', Math.round(macros.carbs * 10) / 10)
      onFoodChange(mealIndex, foodIndex, 'fats', Math.round(macros.fats * 10) / 10)
    } catch (error) {
      console.error('Macro calculation error:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  // Calculate nutrition for given amount
  const calculateNutritionForAmount = (product, amount) => {
    console.log('🧮 Calculating nutrition for:', { product: product.product_name, amount })
    
    const nutriments = product.nutriments || {}
    console.log('📊 Available nutriments:', nutriments)
    
    // Parse amount and extract numeric value
    const numericAmount = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (isNaN(numericAmount)) {
      console.error('❌ Invalid amount format:', amount)
      throw new Error('Invalid amount format')
    }

    console.log('📏 Parsed amount:', numericAmount, 'grams')

    // OpenFoodFacts data is typically per 100g, so calculate multiplier based on 100g
    const multiplier = numericAmount / 100

    // Try different nutriment field names (OpenFoodFacts has inconsistent naming)
    const calories = nutriments['energy-kcal_100g'] || 
                    nutriments['energy_kcal_100g'] || 
                    nutriments['energy-kcal'] || 
                    nutriments['energy_kcal'] ||
                    (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0) ||
                    (nutriments['energy'] ? nutriments['energy'] / 4.184 : 0) || 0

    const protein = nutriments['proteins_100g'] || nutriments['proteins'] || 0
    const carbs = nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0
    const fats = nutriments['fat_100g'] || nutriments['fat'] || 0

    const result = {
      calories: calories * multiplier,
      protein: protein * multiplier,
      carbs: carbs * multiplier,
      fats: fats * multiplier
    }

    console.log('✅ Calculated macros:', result)
    return result
  }

  // Auto-recalculate when selectedProduct and amount are both available
  useEffect(() => {
    if (food.selectedProduct && food.amount && !isCalculating) {
      console.log('🔄 Auto-calculating macros due to food change:', { 
        hasProduct: !!food.selectedProduct, 
        amount: food.amount 
      })
      calculateMacros(food.selectedProduct, food.amount)
    }
  }, [food.selectedProduct, food.amount, isCalculating])

  // Handle direct macro input
  const handleMacroChange = (field, value) => {
    const numericValue = parseFloat(value) || 0
    onFoodChange(mealIndex, foodIndex, field, numericValue)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <div className="space-y-4">
        {/* Food Name with Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Food Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={food.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => food.name && setShowSuggestions(searchResults.length > 0)}
              className={`w-full px-3 py-2 pr-10 border rounded-lg ${
                errors[`meal_${mealIndex}_food_${foodIndex}_name`]
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="Type to search foods..."
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isSearching ? (
                <Loader size={16} className="animate-spin text-gray-400" />
              ) : (
                <Search size={16} className="text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((product, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectFood(product)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {product.product_name || product.name}
                  </div>
                  {product.brands && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {product.brands}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {product.nutriments?.energy_kcal_100g && 
                      `${Math.round(product.nutriments.energy_kcal_100g)} kcal/100g`
                    }
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {errors[`meal_${mealIndex}_food_${foodIndex}_name`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors[`meal_${mealIndex}_food_${foodIndex}_name`]}
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount
          </label>
          <input
            type="text"
            value={food.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors[`meal_${mealIndex}_food_${foodIndex}_amount`]
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="e.g., 100g, 1 cup, 2 pieces"
          />
          {errors[`meal_${mealIndex}_food_${foodIndex}_amount`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors[`meal_${mealIndex}_food_${foodIndex}_amount`]}
            </p>
          )}
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Calories
            </label>
            <div className="relative">
              <input
                type="number"
                value={food.calories || ''}
                onChange={(e) => handleMacroChange('calories', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="1"
              />
              {isCalculating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Calculator size={14} className="text-blue-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Protein (g)
            </label>
            <input
              type="number"
              value={food.protein || ''}
              onChange={(e) => handleMacroChange('protein', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Carbs (g)
            </label>
            <input
              type="number"
              value={food.carbs || ''}
              onChange={(e) => handleMacroChange('carbs', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fats (g)
            </label>
            <input
              type="number"
              value={food.fats || ''}
              onChange={(e) => handleMacroChange('fats', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {/* Auto-calculation notice */}
        {food.selectedProduct && (
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
            <Calculator size={14} />
            <span>Macros auto-calculated from food database</span>
          </div>
        )}

        {/* Remove Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center space-x-1"
          >
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FoodInputWithMacros