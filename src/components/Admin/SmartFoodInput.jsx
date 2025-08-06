import { useState, useEffect, useRef } from 'react'
import { Trash2, Calculator, ChevronDown, Search } from 'lucide-react'

const SmartFoodInput = ({ 
  food, 
  mealIndex, 
  foodIndex, 
  onFoodChange, 
  onRemove, 
  errors = {} 
}) => {
  const [showAutoCalc, setShowAutoCalc] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredFoods, setFilteredFoods] = useState([])
  const inputRef = useRef(null)

  // Comprehensive food database with brands (per 100g)
  const foodDatabase = {
    // === PROTEINS ===
    'Chicken Breast': { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    'Chicken Thigh': { calories: 209, protein: 26, carbs: 0, fats: 11 },
    'Chicken Wing': { calories: 203, protein: 30, carbs: 0, fats: 8 },
    'Ground Chicken': { calories: 143, protein: 17, carbs: 0, fats: 8 },
    'Rotisserie Chicken': { calories: 178, protein: 24, carbs: 0, fats: 8 },
    'Tyson Grilled Chicken Strips': { calories: 110, protein: 23, carbs: 0, fats: 1.5 },
    'Perdue Simply Smart Chicken Breast': { calories: 110, protein: 23, carbs: 0, fats: 1.5 },
    
    'Salmon Fillet': { calories: 208, protein: 25, carbs: 0, fats: 12 },
    'Tuna (Canned in Water)': { calories: 116, protein: 26, carbs: 0, fats: 1 },
    'StarKist Albacore Tuna': { calories: 110, protein: 25, carbs: 0, fats: 1 },
    'Bumble Bee Salmon': { calories: 160, protein: 22, carbs: 0, fats: 7 },
    'Wild Planet Sardines': { calories: 191, protein: 25, carbs: 0, fats: 10 },
    'Cod': { calories: 82, protein: 18, carbs: 0, fats: 0.7 },
    'Tilapia': { calories: 96, protein: 20, carbs: 0, fats: 2 },
    
    'Ground Beef (80/20)': { calories: 254, protein: 26, carbs: 0, fats: 16 },
    'Ground Beef (90/10)': { calories: 176, protein: 26, carbs: 0, fats: 8 },
    'Ground Beef (93/7)': { calories: 152, protein: 25, carbs: 0, fats: 5 },
    'Sirloin Steak': { calories: 183, protein: 31, carbs: 0, fats: 6 },
    'Ribeye Steak': { calories: 291, protein: 25, carbs: 0, fats: 21 },
    'Filet Mignon': { calories: 227, protein: 30, carbs: 0, fats: 11 },
    
    'Ground Turkey (85/15)': { calories: 189, protein: 27, carbs: 0, fats: 8 },
    'Ground Turkey (99/1)': { calories: 120, protein: 28, carbs: 0, fats: 1 },
    'Turkey Breast': { calories: 135, protein: 30, carbs: 0, fats: 1 },
    'Butterball Turkey Deli Meat': { calories: 102, protein: 18, carbs: 2, fats: 2 },
    
    'Pork Chop': { calories: 231, protein: 39, carbs: 0, fats: 7 },
    'Pork Tenderloin': { calories: 143, protein: 26, carbs: 0, fats: 4 },
    'Bacon': { calories: 541, protein: 37, carbs: 1.4, fats: 42 },
    'Oscar Mayer Turkey Bacon': { calories: 215, protein: 17, carbs: 1, fats: 15 },
    'Applegate Organic Bacon': { calories: 467, protein: 33, carbs: 0, fats: 36 },
    'Ham': { calories: 145, protein: 21, carbs: 1.5, fats: 5.5 },
    'Boar\'s Head Ham': { calories: 120, protein: 20, carbs: 2, fats: 3 },
    
    // === EGGS & DAIRY ===
    'Whole Eggs': { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
    'Egg Whites': { calories: 52, protein: 11, carbs: 0.7, fats: 0.2 },
    'Eggland\'s Best Eggs': { calories: 70, protein: 6, carbs: 0, fats: 4.5 },
    
    'Greek Yogurt (Plain)': { calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
    'Fage 0% Greek Yogurt': { calories: 57, protein: 10, carbs: 4, fats: 0 },
    'Fage 2% Greek Yogurt': { calories: 81, protein: 8.5, carbs: 6, fats: 2.3 },
    'Chobani 0% Greek Yogurt': { calories: 56, protein: 10, carbs: 4, fats: 0 },
    'Oikos Pro Greek Yogurt': { calories: 82, protein: 15, carbs: 6, fats: 0 },
    'Two Good Greek Yogurt': { calories: 53, protein: 12, carbs: 3, fats: 0 },
    
    'Cottage Cheese (2%)': { calories: 84, protein: 11, carbs: 5.1, fats: 2.3 },
    'Good Culture Cottage Cheese': { calories: 90, protein: 14, carbs: 3, fats: 2.5 },
    'Breakstone\'s Cottage Cheese': { calories: 90, protein: 13, carbs: 4, fats: 2.5 },
    
    'Cheddar Cheese': { calories: 402, protein: 25, carbs: 1.3, fats: 33 },
    'Kraft Cheddar Cheese': { calories: 393, protein: 23, carbs: 3.6, fats: 32 },
    'Mozzarella Cheese': { calories: 300, protein: 22, carbs: 2.2, fats: 22 },
    'String Cheese': { calories: 318, protein: 25, carbs: 2.2, fats: 24 },
    'Babybel Cheese': { calories: 322, protein: 23, carbs: 0, fats: 25 },
    
    'Milk (2%)': { calories: 50, protein: 3.3, carbs: 4.8, fats: 2 },
    'Milk (Whole)': { calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3 },
    'Milk (Skim)': { calories: 34, protein: 3.4, carbs: 5, fats: 0.2 },
    'Fairlife Protein Milk': { calories: 80, protein: 13, carbs: 6, fats: 2.5 },
    'Oat Milk (Oatly)': { calories: 60, protein: 3, carbs: 9, fats: 1.5 },
    'Almond Milk (Unsweetened)': { calories: 17, protein: 0.6, carbs: 0.7, fats: 1.5 },
    
    // === CARBOHYDRATES ===
    'White Rice (Cooked)': { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    'Brown Rice (Cooked)': { calories: 123, protein: 2.6, carbs: 25, fats: 0.9 },
    'Jasmine Rice (Cooked)': { calories: 129, protein: 2.7, carbs: 28, fats: 0.2 },
    'Uncle Ben\'s Rice': { calories: 130, protein: 3, carbs: 28, fats: 0 },
    'Minute Rice': { calories: 127, protein: 2.4, carbs: 28, fats: 0.2 },
    
    'Quinoa (Cooked)': { calories: 120, protein: 4.4, carbs: 22, fats: 1.9 },
    'Ancient Harvest Quinoa': { calories: 120, protein: 4, carbs: 22, fats: 2 },
    
    'Oats (Dry)': { calories: 389, protein: 17, carbs: 66, fats: 7 },
    'Quaker Oats': { calories: 380, protein: 13, carbs: 68, fats: 6 },
    'Steel Cut Oats': { calories: 379, protein: 15, carbs: 68, fats: 6 },
    'Oatmeal (Cooked)': { calories: 68, protein: 2.4, carbs: 12, fats: 1.4 },
    
    'Whole Wheat Bread': { calories: 247, protein: 13, carbs: 41, fats: 4.2 },
    'Dave\'s Killer Bread': { calories: 260, protein: 5, carbs: 22, fats: 1.5 },
    'Ezekiel Bread': { calories: 265, protein: 5, carbs: 15, fats: 1 },
    'Wonder Bread': { calories: 266, protein: 7.6, carbs: 49, fats: 3.3 },
    'Sourdough Bread': { calories: 289, protein: 12, carbs: 56, fats: 2.1 },
    
    'Whole Wheat Pasta (Cooked)': { calories: 124, protein: 5.3, carbs: 25, fats: 1.1 },
    'Barilla Whole Wheat Pasta': { calories: 180, protein: 8, carbs: 37, fats: 1.5 },
    'Barilla Regular Pasta': { calories: 220, protein: 8, carbs: 44, fats: 1 },
    'Chickpea Pasta (Banza)': { calories: 190, protein: 14, carbs: 32, fats: 3.5 },
    'Shirataki Noodles': { calories: 10, protein: 0, carbs: 3, fats: 0 },
    
    'Sweet Potato': { calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
    'White Potato': { calories: 77, protein: 2, carbs: 17, fats: 0.1 },
    'Red Potato': { calories: 70, protein: 1.9, carbs: 16, fats: 0.1 },
    
    // === VEGETABLES ===
    'Broccoli': { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
    'Spinach': { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
    'Asparagus': { calories: 20, protein: 2.2, carbs: 3.9, fats: 0.1 },
    'Green Beans': { calories: 31, protein: 1.8, carbs: 7, fats: 0.2 },
    'Carrots': { calories: 41, protein: 0.9, carbs: 10, fats: 0.2 },
    'Bell Pepper': { calories: 31, protein: 1, carbs: 7, fats: 0.3 },
    'Cucumber': { calories: 16, protein: 0.7, carbs: 4, fats: 0.1 },
    'Tomato': { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
    'Zucchini': { calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3 },
    'Cauliflower': { calories: 25, protein: 1.9, carbs: 5, fats: 0.3 },
    'Kale': { calories: 49, protein: 4.3, carbs: 9, fats: 0.9 },
    'Brussels Sprouts': { calories: 43, protein: 3.4, carbs: 9, fats: 0.3 },
    
    // === FRUITS ===
    'Avocado': { calories: 160, protein: 2, carbs: 9, fats: 15 },
    'Banana': { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
    'Apple': { calories: 52, protein: 0.3, carbs: 14, fats: 0.2 },
    'Orange': { calories: 47, protein: 0.9, carbs: 12, fats: 0.1 },
    'Strawberries': { calories: 32, protein: 0.7, carbs: 8, fats: 0.3 },
    'Blueberries': { calories: 57, protein: 0.7, carbs: 14, fats: 0.3 },
    'Grapes': { calories: 62, protein: 0.6, carbs: 16, fats: 0.2 },
    'Pineapple': { calories: 50, protein: 0.5, carbs: 13, fats: 0.1 },
    'Mango': { calories: 60, protein: 0.8, carbs: 15, fats: 0.4 },
    'Watermelon': { calories: 30, protein: 0.6, carbs: 8, fats: 0.2 },
    
    // === NUTS & SEEDS ===
    'Almonds': { calories: 579, protein: 21, carbs: 22, fats: 50 },
    'Blue Diamond Almonds': { calories: 600, protein: 22, carbs: 21, fats: 53 },
    'Walnuts': { calories: 654, protein: 15, carbs: 14, fats: 65 },
    'Peanuts': { calories: 567, protein: 26, carbs: 16, fats: 49 },
    'Planters Peanuts': { calories: 570, protein: 26, carbs: 15, fats: 50 },
    'Cashews': { calories: 553, protein: 18, carbs: 30, fats: 44 },
    'Pistachios': { calories: 560, protein: 20, carbs: 28, fats: 45 },
    'Sunflower Seeds': { calories: 584, protein: 21, carbs: 20, fats: 51 },
    'Pumpkin Seeds': { calories: 559, protein: 30, carbs: 11, fats: 49 },
    
    'Peanut Butter': { calories: 588, protein: 25, carbs: 20, fats: 50 },
    'Jif Peanut Butter': { calories: 590, protein: 25, carbs: 20, fats: 50 },
    'Skippy Peanut Butter': { calories: 540, protein: 25, carbs: 20, fats: 46 },
    'Adams Natural Peanut Butter': { calories: 600, protein: 25, carbs: 16, fats: 54 },
    'Almond Butter': { calories: 614, protein: 21, carbs: 19, fats: 56 },
    'Justin\'s Almond Butter': { calories: 610, protein: 21, carbs: 18, fats: 56 },
    
    // === OILS & FATS ===
    'Olive Oil': { calories: 884, protein: 0, carbs: 0, fats: 100 },
    'Extra Virgin Olive Oil': { calories: 884, protein: 0, carbs: 0, fats: 100 },
    'Coconut Oil': { calories: 862, protein: 0, carbs: 0, fats: 100 },
    'Avocado Oil': { calories: 884, protein: 0, carbs: 0, fats: 100 },
    'Butter': { calories: 717, protein: 0.9, carbs: 0.1, fats: 81 },
    'Kerrygold Butter': { calories: 717, protein: 0.9, carbs: 0.1, fats: 81 },
    
    // === SNACKS & PROCESSED FOODS ===
    'Protein Bar (Quest)': { calories: 180, protein: 21, carbs: 22, fats: 7 },
    'Kind Bars': { calories: 200, protein: 6, carbs: 17, fats: 12 },
    'RX Bar': { calories: 210, protein: 12, carbs: 24, fats: 9 },
    'Clif Bar': { calories: 250, protein: 9, carbs: 45, fats: 5 },
    'Nature Valley Granola Bar': { calories: 190, protein: 4, carbs: 29, fats: 7 },
    
    'Whey Protein Powder': { calories: 400, protein: 80, carbs: 8, fats: 4 },
    'Optimum Nutrition Whey': { calories: 400, protein: 74, carbs: 11, fats: 4 },
    'Isopure Protein Powder': { calories: 420, protein: 88, carbs: 0, fats: 4 },
    'Casein Protein Powder': { calories: 360, protein: 72, carbs: 12, fats: 4 },
    
    'Cheerios': { calories: 367, protein: 11, carbs: 74, fats: 6 },
    'Oatmeal (Quaker Instant)': { calories: 368, protein: 13, carbs: 68, fats: 6 },
    'Granola': { calories: 471, protein: 11, carbs: 61, fats: 22 },
    'Nature Valley Granola': { calories: 450, protein: 11, carbs: 65, fats: 18 },
    
    // === CONDIMENTS & SAUCES ===
    'Ketchup (Heinz)': { calories: 112, protein: 1.2, carbs: 27, fats: 0.1 },
    'Mustard': { calories: 66, protein: 4, carbs: 8, fats: 4 },
    'Mayo (Hellmann\'s)': { calories: 680, protein: 1, carbs: 1, fats: 75 },
    'Ranch Dressing': { calories: 320, protein: 1, carbs: 6, fats: 33 },
    'Balsamic Vinegar': { calories: 88, protein: 0.5, carbs: 17, fats: 0 },
    'Hot Sauce (Tabasco)': { calories: 12, protein: 1.3, carbs: 0.8, fats: 0.8 },
    'Sriracha': { calories: 93, protein: 2, carbs: 18, fats: 1 },
    'Soy Sauce': { calories: 60, protein: 9, carbs: 6, fats: 0 }
  }

  // Filter foods based on search term
  useEffect(() => {
    if (!food.name || food.name.length < 1) {
      setFilteredFoods([])
      setShowSuggestions(false)
      return
    }

    const searchTerm = food.name.toLowerCase()
    const matches = Object.keys(foodDatabase).filter(foodName =>
      foodName.toLowerCase().includes(searchTerm)
    ).slice(0, 8) // Limit to 8 suggestions

    setFilteredFoods(matches)
    setShowSuggestions(matches.length > 0 && food.name !== '')
  }, [food.name])

  // Handle food selection from dropdown
  const selectFood = (selectedFoodName) => {
    onFoodChange(mealIndex, foodIndex, 'name', selectedFoodName)
    onFoodChange(mealIndex, foodIndex, 'selectedFood', foodDatabase[selectedFoodName])
    setShowSuggestions(false)
    
    // Auto-calculate if amount is already entered
    if (food.amount) {
      calculateMacros(foodDatabase[selectedFoodName], food.amount)
    }
  }

  // Calculate macros based on selected food and amount
  const calculateMacros = (selectedFood, amount) => {
    const amountText = amount.toString().replace(/[^\d.,]/g, '').replace(',', '.')
    const numericAmount = parseFloat(amountText)
    
    console.log('🧮 Calculating for:', { selectedFood, amount, numericAmount })
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.log('❌ Invalid amount')
      return
    }

    const multiplier = numericAmount / 100 // per 100g
    const calculatedMacros = {
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fats: Math.round(selectedFood.fats * multiplier * 10) / 10
    }

    console.log('✅ Calculated:', calculatedMacros)

    onFoodChange(mealIndex, foodIndex, 'calories', calculatedMacros.calories)
    onFoodChange(mealIndex, foodIndex, 'protein', calculatedMacros.protein)
    onFoodChange(mealIndex, foodIndex, 'carbs', calculatedMacros.carbs)
    onFoodChange(mealIndex, foodIndex, 'fats', calculatedMacros.fats)
    
    setShowAutoCalc(true)
    setTimeout(() => setShowAutoCalc(false), 3000)
  }

  // Handle amount change and auto-calculate if food is selected
  const handleAmountChange = (amount) => {
    onFoodChange(mealIndex, foodIndex, 'amount', amount)
    
    if (food.selectedFood && amount) {
      calculateMacros(food.selectedFood, amount)
    }
  }

  // Manual calculation button
  const manualCalculate = () => {
    if (food.selectedFood && food.amount) {
      calculateMacros(food.selectedFood, food.amount)
    }
  }

  // Handle macro change
  const handleMacroChange = (field, value) => {
    const numericValue = parseFloat(value) || 0
    onFoodChange(mealIndex, foodIndex, field, numericValue)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        {/* Food Name with Dropdown */}
        <div className="relative" ref={inputRef}>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Food Name *
          </label>
          <div className="relative">
            <input
              type="text"
              value={food.name}
              onChange={(e) => onFoodChange(mealIndex, foodIndex, 'name', e.target.value)}
              onFocus={() => food.name && setShowSuggestions(filteredFoods.length > 0)}
              className={`w-full px-2 py-1 pr-8 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                errors[`meal_${mealIndex}_food_${foodIndex}_name`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Start typing food name..."
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {showSuggestions ? (
                <ChevronDown size={12} className="text-gray-400" />
              ) : (
                <Search size={12} className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Dropdown Suggestions */}
          {showSuggestions && filteredFoods.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredFoods.map((foodName, index) => {
                const nutrition = foodDatabase[foodName]
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectFood(foodName)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {foodName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {nutrition.calories} cal, {nutrition.protein}g protein per 100g
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {errors[`meal_${mealIndex}_food_${foodIndex}_name`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Required</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount (g) *
          </label>
          <div className="relative">
            <input
              type="text"
              value={food.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
                errors[`meal_${mealIndex}_food_${foodIndex}_amount`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="150"
            />
            {food.selectedFood && food.amount && (
              <button
                type="button"
                onClick={manualCalculate}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-600"
                title="Recalculate macros"
              >
                <Calculator size={12} />
              </button>
            )}
          </div>
          {errors[`meal_${mealIndex}_food_${foodIndex}_amount`] && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">Required</p>
          )}
        </div>

        {/* Macros */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Calories *
          </label>
          <input
            type="number"
            min="0"
            value={food.calories || ''}
            onChange={(e) => handleMacroChange('calories', e.target.value)}
            className={`w-full px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent ${
              errors[`meal_${mealIndex}_food_${foodIndex}_calories`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Protein (g)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={food.protein || ''}
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
            value={food.carbs || ''}
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
            value={food.fats || ''}
            onChange={(e) => handleMacroChange('fats', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Auto-calculation notification */}
      {showAutoCalc && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg animate-fade-in">
          <Calculator size={14} />
          <span>Macros auto-calculated from food database! 🎉</span>
        </div>
      )}

      {/* Selected food indicator */}
      {food.selectedFood && (
        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
          📊 Using database values for: <strong>{food.name}</strong>
        </div>
      )}
    </div>
  )
}

export default SmartFoodInput