import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, Camera, Search, Edit3, Trash2, Utensils, X, AlertCircle } from 'lucide-react'
import useFitnessStore from '../../store/fitnessStore'
import FoodSearch from './FoodSearch'
import MacroEntry from './MacroEntry'
import ProgressBar from './ProgressBar'
import BarcodeScanner from './BarcodeScanner'
import ErrorBoundary from '../ErrorBoundary'
import useDebounce from '../../hooks/useDebounce'
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation'
import { Food, MealType, LoadingState, NutritionError } from '../../types/nutrition'

// Performance: Memoized meal section component
const MealSection = React.memo<{
  type: MealType
  name: string
  icon: string
  meals: any[]
  totals: { calories: number; protein: number; carbs: number; fats: number }
  onAddClick: (type: MealType) => void
  onDeleteMeal: (mealId: string) => void
  isLoading: boolean
}>(({ type, name, icon, meals, totals, onAddClick, onDeleteMeal, isLoading }) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  
  // Accessibility: Keyboard navigation for meal items
  useKeyboardNavigation({
    containerRef: sectionRef,
    onEnter: (index) => {
      // Handle enter key on meal items
      console.log('Selected meal at index:', index)
    },
    itemSelector: '[data-meal-item]'
  })

  return (
    <section 
      ref={sectionRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      aria-labelledby={`${type}-heading`}
    >
      {/* Meal Header */}
      <header className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span 
              className="text-xl" 
              role="img" 
              aria-label={`${name} icon`}
            >
              {icon}
            </span>
            <div>
              <h3 
                id={`${type}-heading`}
                className="font-semibold text-gray-900 dark:text-white"
              >
                {name}
              </h3>
              {totals.calories > 0 && (
                <p 
                  className="text-sm text-gray-500 dark:text-gray-400"
                  aria-label={`Total nutrition: ${totals.calories} calories, ${totals.protein} grams protein, ${totals.carbs} grams carbs, ${totals.fats} grams fats`}
                >
                  {totals.calories} cal | P: {totals.protein}g | C: {totals.carbs}g | F: {totals.fats}g
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onAddClick(type)}
            className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1 min-h-[44px] min-w-[44px]"
            disabled={isLoading}
            aria-label={`Add food to ${name}`}
          >
            <Plus size={14} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Add</span>
          </button>
        </div>
      </header>

      {/* Meal Items */}
      <div className="p-4">
        {meals.length > 0 ? (
          <div className="space-y-3" role="list" aria-label={`${name} items`}>
            {meals.map((meal, index) => (
              <div 
                key={meal.id} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 transition-all"
                role="listitem"
                data-meal-item
                tabIndex={index === 0 ? 0 : -1}
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {meal.name}
                  </h4>
                  <div 
                    className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400"
                    aria-label={`${meal.calories} calories, ${meal.protein} grams protein, ${meal.carbs} grams carbs, ${meal.fats} grams fats`}
                  >
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
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Edit ${meal.name}`}
                  >
                    <Edit3 size={14} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onDeleteMeal(meal.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    disabled={isLoading}
                    aria-label={`Delete ${meal.name}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6" role="region" aria-label={`No ${name.toLowerCase()} logged`}>
            <Utensils size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" aria-hidden="true" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No {name.toLowerCase()} logged yet
            </p>
            <button
              onClick={() => onAddClick(type)}
              className="text-primary-600 dark:text-primary-400 text-sm hover:underline mt-1 p-2 min-h-[44px]"
              aria-label={`Add your first ${name.toLowerCase()} item`}
            >
              Add your first item
            </button>
          </div>
        )}
      </div>
    </section>
  )
})

MealSection.displayName = 'MealSection'

const NutritionOptimized: React.FC = () => {
  const { nutrition, addMeal, updateDailyNutrition } = useFitnessStore()
  const [activeModal, setActiveModal] = useState<'search' | 'manual' | 'barcode' | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast')
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    isSearching: false,
    isAdding: false,
    isDeleting: false
  })
  const [error, setError] = useState<NutritionError | null>(null)

  // Performance: Memoized macro targets (could come from user settings)
  const macroTargets = useMemo(() => ({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 67
  }), [])

  // Performance: Memoized meal types
  const mealTypes = useMemo(() => [
    { id: 'breakfast' as MealType, name: 'Breakfast', icon: '🌅' },
    { id: 'lunch' as MealType, name: 'Lunch', icon: '☀️' },
    { id: 'dinner' as MealType, name: 'Dinner', icon: '🌙' },
    { id: 'snacks' as MealType, name: 'Snacks', icon: '🍎' }
  ], [])

  // Performance: Memoized meal filtering and totals calculation
  const mealData = useMemo(() => {
    return mealTypes.reduce((acc, mealType) => {
      const meals = nutrition.meals.filter(meal => meal.mealType === mealType.id)
      const totals = meals.reduce(
        (sum, meal) => ({
          calories: sum.calories + meal.calories,
          protein: sum.protein + meal.protein,
          carbs: sum.carbs + meal.carbs,
          fats: sum.fats + meal.fats
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      )
      
      acc[mealType.id] = { meals, totals }
      return acc
    }, {} as Record<MealType, { meals: any[]; totals: any }>)
  }, [nutrition.meals, mealTypes])

  // Performance: Debounced error clearing
  const debouncedClearError = useDebounce(() => setError(null), 5000)

  // Memory management: Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
      setLoadingState({
        isLoading: false,
        isSearching: false,
        isAdding: false,
        isDeleting: false
      })
      setError(null)
    }
  }, [])

  // Auto-clear errors after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Performance: Memoized handlers
  const handleFoodSelect = useCallback(async (food: Food) => {
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
      
      // Accessibility: Announce success
      const announcement = `Added ${food.name} to ${selectedMealType}`
      announceToScreenReader(announcement)
    } catch (err) {
      console.error('Error adding food:', err)
      setError({
        message: 'Failed to add food to meal. Please try again.',
        code: 'ADD_FOOD_ERROR'
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isAdding: false }))
    }
  }, [selectedMealType, addMeal, updateDailyNutrition])

  const handleManualEntry = useCallback(async (entry: any) => {
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
      
      // Accessibility: Announce success
      announceToScreenReader(`Added ${entry.name} to ${entry.mealType}`)
    } catch (err) {
      console.error('Error adding manual entry:', err)
      setError({
        message: 'Failed to add manual entry. Please try again.',
        code: 'ADD_MANUAL_ERROR'
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isAdding: false }))
    }
  }, [addMeal, updateDailyNutrition])

  const handleDeleteMeal = useCallback(async (mealId: string) => {
    setLoadingState(prev => ({ ...prev, isDeleting: true }))
    setError(null)
    
    try {
      // TODO: Implement delete functionality in store
      console.log('Delete meal:', mealId)
      
      // Accessibility: Announce success
      announceToScreenReader('Meal deleted successfully')
    } catch (err) {
      console.error('Error deleting meal:', err)
      setError({
        message: 'Failed to delete meal. Please try again.',
        code: 'DELETE_MEAL_ERROR'
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isDeleting: false }))
    }
  }, [])

  const handleModalOpen = useCallback((modal: 'search' | 'manual' | 'barcode', mealType?: MealType) => {
    if (mealType) {
      setSelectedMealType(mealType)
    }
    setActiveModal(modal)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // Accessibility: Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-6" role="main" aria-labelledby="nutrition-heading">
        {/* Accessibility: Skip link for keyboard users */}
        <a 
          href="#nutrition-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded z-50"
        >
          Skip to nutrition content
        </a>

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 
              id="nutrition-heading"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Nutrition
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your daily nutrition goals
            </p>
          </div>
          
          {/* Quick Actions - Mobile Optimized */}
          <nav aria-label="Nutrition actions" className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => handleModalOpen('search')}
              className="btn-primary text-sm px-3 py-2 flex items-center gap-2 min-h-[44px]"
              disabled={loadingState.isAdding}
              aria-label="Search for food"
            >
              <Search size={16} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Search</span>
            </button>
            <button
              onClick={() => handleModalOpen('manual')}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-2 min-h-[44px]"
              disabled={loadingState.isAdding}
              aria-label="Add food manually"
            >
              <Edit3 size={16} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Manual</span>
            </button>
            <button
              onClick={() => handleModalOpen('barcode')}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-2 min-h-[44px]"
              disabled={loadingState.isAdding}
              aria-label="Scan barcode"
            >
              <Camera size={16} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Scan</span>
            </button>
          </nav>
        </header>

        {/* Error Display */}
        {error && (
          <div 
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error.message}
                </p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Dismiss error"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <section 
          id="nutrition-content"
          aria-labelledby="progress-heading"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <h2 id="progress-heading" className="sr-only">Daily nutrition progress</h2>
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
        </section>

        {/* Meals by Type */}
        <section aria-labelledby="meals-heading" className="space-y-6">
          <h2 id="meals-heading" className="sr-only">Meals by type</h2>
          {mealTypes.map((mealType) => (
            <MealSection
              key={mealType.id}
              type={mealType.id}
              name={mealType.name}
              icon={mealType.icon}
              meals={mealData[mealType.id].meals}
              totals={mealData[mealType.id].totals}
              onAddClick={handleModalOpen.bind(null, 'search')}
              onDeleteMeal={handleDeleteMeal}
              isLoading={loadingState.isAdding || loadingState.isDeleting}
            />
          ))}
        </section>

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

        {/* Live region for screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" />
      </div>
    </ErrorBoundary>
  )
}

export default NutritionOptimized