import { useState, useEffect } from 'react'
import { Plus, Camera, Search, Edit3, Trash2, Utensils, X } from 'lucide-react'
import useFitnessStore from '../../store/fitnessStore'
import FoodSearch from './FoodSearch'
import MacroEntry from './MacroEntry'
import ProgressBar from './ProgressBar'
import BarcodeScanner from './BarcodeScanner'
import { Food, MealType, LoadingState, NutritionError } from '../../types/nutrition'

const Nutrition = () => {
  const { nutrition, addMeal, updateDailyNutrition } = useFitnessStore()
  const [activeModal, setActiveModal] = useState(null)
  const [selectedMealType, setSelectedMealType] = useState('breakfast')
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    isSearching: false,
    isAdding: false,
    isDeleting: false
  })
  const [error, setError] = useState(null)

  const macroTargets = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 67
  }

  const mealTypes = [
    { id: 'breakfast', name: 'Breakfast', icon: '🌅' },
    { id: 'lunch', name: 'Lunch', icon: '☀️' },
    { id: 'dinner', name: 'Dinner', icon: '🌙' },
    { id: 'snacks', name: 'Snacks', icon: '🍎' }
  ]

  const getMealsByType = (type) => {
    return nutrition.meals.filter(meal => meal.mealType === type)
  }

  const getMealTotals = (type) => {
    const meals = getMealsByType(type)
    return meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        protein: totals.protein + meal.protein,
        carbs: totals.carbs + meal.carbs,
        fats: totals.fats + meal.fats
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  }

  const handleFoodSelect = async (food) => {
    setLoadingState(prev => ({ ...prev, isAdding: true }))
    setError(null)
    
    try {
      const meal = {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        mealType: selectedMealType,
        servingSize: food.serving_size,
        timestamp: new Date().toISOString()
      }
      
      addMeal(meal)
      updateDailyNutrition(meal)
      setActiveModal(null)
    } catch (err) {
      console.error('Error adding food:', err)
      setError({
        message: 'Failed to add food to meal. Please try again.',
        code: 'ADD_FOOD_ERROR'
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isAdding: false }))
    }
  }

  const handleManualEntry = async (entry) => {
    setLoadingState(prev => ({ ...prev, isAdding: true }))
    setError(null)
    
    try {
      const meal = {
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fats: entry.fats,
        mealType: entry.mealType,
        servingSize: entry.servingSize,
        timestamp: new Date().toISOString()
      }
      
      addMeal(meal)
      updateDailyNutrition(meal)
      setActiveModal(null)
    } catch (err) {
      console.error('Error adding manual entry:', err)
      setError({
        message: 'Failed to add manual entry. Please try again.',
        code: 'ADD_MANUAL_ERROR'
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isAdding: false }))
    }
  }

  const handleBarcodeScanning = () => {
    setActiveModal('barcode')
  }

  const handleDeleteMeal = async (mealId) => {
    setLoadingState(prev => ({ ...prev, isDeleting: true }))
    setError(null)
    
    try {
      // Implementation would depend on your store structure
      // For now, we'll show a message
      console.log('Delete meal:', mealId)
      alert('Delete functionality would be implemented here')
    } catch (err) {
      console.error('Error deleting meal:', err)
      setError({
        message: 'Failed to delete meal. Please try again.',
        code: 'DELETE_MEAL_ERROR'
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const clearError = () => setError(null)

  const MealSection = ({ type, name, icon }) => {
    const meals = getMealsByType(type)
    const totals = getMealTotals(type)

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Meal Header */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
                {totals.calories > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {totals.calories} cal | P: {totals.protein}g | C: {totals.carbs}g | F: {totals.fats}g
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedMealType(type)
                setActiveModal('search')
              }}
              className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
              disabled={loadingState.isAdding}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {/* Meal Items */}
        <div className="p-4">
          {meals.length > 0 ? (
            <div className="space-y-3">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {meal.name}
                    </h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{meal.calories} cal</span>
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fats}g</span>
                    </div>
                    {meal.servingSize && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {meal.servingSize}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-3">
                    <button
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Edit meal"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete meal"
                      disabled={loadingState.isDeleting}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Utensils size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No {name.toLowerCase()} logged yet
              </p>
              <button
                onClick={() => {
                  setSelectedMealType(type)
                  setActiveModal('search')
                }}
                className="text-primary-600 dark:text-primary-400 text-sm hover:underline mt-1"
              >
                Add your first item
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your daily nutrition goals
          </p>
        </div>
        
        {/* Quick Actions - Mobile Optimized */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setActiveModal('search')}
            className="btn-primary text-sm px-3 py-2 flex items-center gap-2"
            disabled={loadingState.isAdding}
          >
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={() => setActiveModal('manual')}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
            disabled={loadingState.isAdding}
          >
            <Edit3 size={16} />
            <span className="hidden sm:inline">Manual</span>
          </button>
          <button
            onClick={handleBarcodeScanning}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-2"
            disabled={loadingState.isAdding}
          >
            <Camera size={16} />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <p className="text-red-700 dark:text-red-400 text-sm">
              {error.message}
            </p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressBar
          title="Calories"
          current={nutrition.dailyCalories}
          target={macroTargets.calories}
          unit=""
          color="blue"
          size="md"
        />
        <ProgressBar
          title="Protein"
          current={nutrition.dailyProtein}
          target={macroTargets.protein}
          unit="g"
          color="red"
          size="md"
        />
        <ProgressBar
          title="Carbs"
          current={nutrition.dailyCarbs}
          target={macroTargets.carbs}
          unit="g"
          color="yellow"
          size="md"
        />
        <ProgressBar
          title="Fats"
          current={nutrition.dailyFats}
          target={macroTargets.fats}
          unit="g"
          color="green"
          size="md"
        />
      </div>

      {/* Meals by Type */}
      <div className="space-y-6">
        {mealTypes.map((mealType) => (
          <MealSection
            key={mealType.id}
            type={mealType.id}
            name={mealType.name}
            icon={mealType.icon}
          />
        ))}
      </div>

      {/* Modals */}
      <FoodSearch
        isOpen={activeModal === 'search'}
        onClose={() => setActiveModal(null)}
        onFoodSelect={handleFoodSelect}
      />
      
      <MacroEntry
        isOpen={activeModal === 'manual'}
        onClose={() => setActiveModal(null)}
        onAdd={handleManualEntry}
        defaultMealType={selectedMealType}
      />
      
      <BarcodeScanner
        isOpen={activeModal === 'barcode'}
        onClose={() => setActiveModal(null)}
        onFoodScanned={handleFoodSelect}
        onManualEntry={() => setActiveModal('manual')}
      />
    </div>
  )
}

export default Nutrition