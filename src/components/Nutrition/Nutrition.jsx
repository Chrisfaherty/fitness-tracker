import { useState, useEffect } from 'react'
import { Plus, Camera, Search, Edit3, Trash2, Utensils, X } from 'lucide-react'
import useFitnessStore from '../../store/fitnessStore'
import FoodSearch from './FoodSearch'
import MacroEntry from './MacroEntry.jsx'
import EditMealModal from './EditMealModal'
import ProgressBar from './ProgressBar'
import BarcodeScanner from './BarcodeScanner'
import authService from '../../services/auth/authService'
// Types are now handled inline as JavaScript objects

const Nutrition = () => {
  const { getCurrentUserNutrition, addMeal, updateDailyNutrition, updateMeal, deleteMeal, initializeUser } = useFitnessStore()
  const nutrition = getCurrentUserNutrition()
  const [activeModal, setActiveModal] = useState(null)
  const [selectedMealType, setSelectedMealType] = useState('breakfast')
  const [editingMeal, setEditingMeal] = useState(null)
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    isSearching: false,
    isAdding: false,
    isDeleting: false
  })
  const [error, setError] = useState(null)

  // Initialize user data when component mounts
  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      console.log('🔧 Initializing nutrition data for user:', currentUser.id)
      initializeUser(currentUser.id)
    }
  }, [initializeUser])

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
        timestamp: new Date().toISOString(),
        // Enhanced USDA data
        ...(food.source && { source: food.source }),
        ...(food.fdcId && { fdcId: food.fdcId }),
        ...(food.dataType && { dataType: food.dataType }),
        ...(food.isAccurate && { isAccurate: food.isAccurate }),
        ...(food.sourceUrl && { sourceUrl: food.sourceUrl }),
        // Additional nutrition data
        ...(food.fiber && { fiber: food.fiber }),
        ...(food.sugar && { sugar: food.sugar }),
        ...(food.sodium && { sodium: food.sodium })
      }
      
      console.log('🍽️ Adding meal with enhanced data:', meal)
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

  const handleDeleteMeal = async (mealId, mealName) => {
    // Add confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${mealName}"?\n\nThis action cannot be undone and will remove this food item from your daily nutrition totals.`
    )
    
    if (!confirmed) {
      return
    }

    setLoadingState(prev => ({ ...prev, isDeleting: true }))
    setError(null)
    
    try {
      console.log('🗑️ Deleting meal:', mealId, mealName)
      deleteMeal(mealId)
      console.log('✅ Meal deleted successfully')
    } catch (err) {
      console.error('❌ Error deleting meal:', err)
      setError({
        message: 'Failed to delete meal. Please try again.',
        code: 'DELETE_MEAL_ERROR'
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleEditMeal = (meal) => {
    console.log('✏️ Opening edit modal for meal:', meal.name)
    setEditingMeal(meal)
  }

  const handleUpdateMeal = (mealId, updatedMealData) => {
    console.log('💾 Updating meal:', mealId, 'with data:', updatedMealData)
    updateMeal(mealId, updatedMealData)
    setEditingMeal(null)
  }

  const clearError = () => setError(null)

  const MealSection = ({ type, name, icon }) => {
    const meals = getMealsByType(type)
    const totals = getMealTotals(type)

    return (
      <div className="card-elevated animate-scale-in overflow-hidden">
        {/* Meal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">{icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
                {totals.calories > 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
              className="btn-primary flex items-center gap-2 shadow-lg"
              disabled={loadingState.isAdding}
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Meal Items */}
        <div className="p-6">
          {meals.length > 0 ? (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <div key={meal.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
                      {meal.name}
                    </h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span className="badge badge-info">{meal.calories} cal</span>
                      <span className="badge badge-success">P: {meal.protein}g</span>
                      <span className="badge badge-warning">C: {meal.carbs}g</span>
                      <span className="badge badge-danger">F: {meal.fats}g</span>
                    </div>
                    {meal.servingSize && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        🍽️ {meal.servingSize}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditMeal(meal)}
                      className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200"
                      title="Edit meal"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMeal(meal.id, meal.name)}
                      className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={loadingState.isDeleting ? "Deleting..." : "Delete meal"}
                      disabled={loadingState.isDeleting}
                    >
                      {loadingState.isDeleting ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Utensils size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                No {name.toLowerCase()} logged yet
              </p>
              <p className="text-slate-400 text-sm mb-4">
                Start tracking your nutrition goals!
              </p>
              <button
                onClick={() => {
                  setSelectedMealType(type)
                  setActiveModal('search')
                }}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Add your first item
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-3">Nutrition Tracker</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Monitor your daily nutrition goals and build healthy eating habits
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        {/* Quick Actions - Mobile Optimized */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveModal('search')}
            className="btn-primary flex items-center gap-2 shadow-lg"
            disabled={loadingState.isAdding}
          >
            <Search size={18} />
            <span>Search Foods</span>
          </button>
          <button
            onClick={() => setActiveModal('manual')}
            className="btn-secondary flex items-center gap-2"
            disabled={loadingState.isAdding}
          >
            <Edit3 size={18} />
            <span>Manual Entry</span>
          </button>
          <button
            onClick={handleBarcodeScanning}
            className="btn-secondary flex items-center gap-2"
            disabled={loadingState.isAdding}
          >
            <Camera size={18} />
            <span>Scan Barcode</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 animate-slide-up">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">⚠️</span>
              </div>
              <div>
                <p className="text-red-700 dark:text-red-400 font-medium">
                  {error.message}
                </p>
                <p className="text-red-600 dark:text-red-500 text-sm mt-1">
                  Error Code: {error.code}
                </p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Calories', current: nutrition.dailyCalories, target: macroTargets.calories, unit: '', gradient: 'from-blue-500 to-cyan-500', icon: '🔥' },
          { title: 'Protein', current: nutrition.dailyProtein, target: macroTargets.protein, unit: 'g', gradient: 'from-red-500 to-pink-500', icon: '💪' },
          { title: 'Carbs', current: nutrition.dailyCarbs, target: macroTargets.carbs, unit: 'g', gradient: 'from-yellow-500 to-orange-500', icon: '🍞' },
          { title: 'Fats', current: nutrition.dailyFats, target: macroTargets.fats, unit: 'g', gradient: 'from-green-500 to-emerald-500', icon: '🥑' }
        ].map((macro, index) => {
          const percentage = Math.min((macro.current / macro.target) * 100, 100)
          return (
            <div key={macro.title} className="stat-card group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {macro.title}
                  </p>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {macro.current.toLocaleString()}
                    </p>
                    <p className="ml-2 text-sm text-slate-400">
                      / {macro.target.toLocaleString()}{macro.unit}
                    </p>
                  </div>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-r ${macro.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-white text-xl">{macro.icon}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {percentage.toFixed(0)}% complete
                  </p>
                  <span className={`badge ${percentage >= 100 ? 'badge-success' : percentage >= 75 ? 'badge-warning' : 'badge-info'}`}>
                    {percentage >= 100 ? 'Goal Reached!' : percentage >= 75 ? 'Almost There' : 'Keep Going'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
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
      
      <EditMealModal
        meal={editingMeal}
        isOpen={!!editingMeal}
        onClose={() => setEditingMeal(null)}
        onUpdate={handleUpdateMeal}
      />
    </div>
  )
}

export default Nutrition