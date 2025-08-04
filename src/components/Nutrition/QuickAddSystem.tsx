import React, { useState, useEffect, useMemo } from 'react'
import {
  Star, Clock, Search, Plus, Heart, Zap, Coffee, Apple,
  ChevronRight, MoreVertical, Edit3, Trash2, Copy, Pin,
  TrendingUp, Calendar, Filter, SortAsc, BookOpen
} from 'lucide-react'
import useFitnessStore from '../../store/fitnessStore'

interface FoodItem {
  id: string
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fats: number
  servingSize: string
  category: string
  lastUsed: string
  useCount: number
  isFavorite: boolean
  isPinned: boolean
  tags: string[]
  photo?: string
}

interface MealTemplate {
  id: string
  name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foods: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  useCount: number
  lastUsed: string
  isCustom: boolean
}

const QuickAddSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent' | 'templates' | 'suggestions'>('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'calories' | 'recent' | 'frequent'>('frequent')
  const [favorites, setFavorites] = useState<FoodItem[]>([])
  const [recentItems, setRecentItems] = useState<FoodItem[]>([])
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([])
  const [suggestions, setSuggestions] = useState<FoodItem[]>([])
  const [showActions, setShowActions] = useState<string | null>(null)
  
  const { nutrition, addMeal, updateFavorites, getMealHistory } = useFitnessStore()

  useEffect(() => {
    loadFavorites()
    loadRecentItems()
    loadMealTemplates()
    generateSuggestions()
  }, [nutrition])

  const loadFavorites = () => {
    // Load from store or localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteFoods') || '[]')
    setFavorites(savedFavorites.sort((a: FoodItem, b: FoodItem) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.useCount - a.useCount
    }))
  }

  const loadRecentItems = () => {
    const mealHistory = getMealHistory(7) // Last 7 days
    const recentFoods = mealHistory
      .flatMap(meal => meal.foods || [])
      .reduce((acc: FoodItem[], food: any) => {
        const existing = acc.find(f => f.id === food.id)
        if (existing) {
          existing.useCount++
          if (food.timestamp > existing.lastUsed) {
            existing.lastUsed = food.timestamp
          }
        } else {
          acc.push({
            ...food,
            lastUsed: food.timestamp,
            useCount: 1,
            isFavorite: favorites.some(f => f.id === food.id),
            isPinned: false,
            tags: food.tags || []
          })
        }
        return acc
      }, [])
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, 20)

    setRecentItems(recentFoods)
  }

  const loadMealTemplates = () => {
    const savedTemplates = JSON.parse(localStorage.getItem('mealTemplates') || '[]')
    const defaultTemplates: MealTemplate[] = [
      {
        id: 'quick-breakfast',
        name: 'Quick Breakfast',
        category: 'breakfast',
        foods: [
          {
            id: 'oatmeal',
            name: 'Instant Oatmeal',
            calories: 150,
            protein: 5,
            carbs: 27,
            fats: 3,
            servingSize: '1 packet',
            category: 'grains',
            lastUsed: new Date().toISOString(),
            useCount: 1,
            isFavorite: false,
            isPinned: false,
            tags: ['breakfast', 'quick']
          },
          {
            id: 'banana',
            name: 'Banana',
            calories: 105,
            protein: 1,
            carbs: 27,
            fats: 0,
            servingSize: '1 medium',
            category: 'fruits',
            lastUsed: new Date().toISOString(),
            useCount: 1,
            isFavorite: false,
            isPinned: false,
            tags: ['fruit', 'natural']
          }
        ],
        totalCalories: 255,
        totalProtein: 6,
        totalCarbs: 54,
        totalFats: 3,
        useCount: 0,
        lastUsed: new Date().toISOString(),
        isCustom: false
      },
      {
        id: 'protein-lunch',
        name: 'High-Protein Lunch',
        category: 'lunch',
        foods: [
          {
            id: 'chicken-breast',
            name: 'Grilled Chicken Breast',
            calories: 185,
            protein: 35,
            carbs: 0,
            fats: 4,
            servingSize: '4 oz',
            category: 'protein',
            lastUsed: new Date().toISOString(),
            useCount: 1,
            isFavorite: false,
            isPinned: false,
            tags: ['protein', 'lean']
          },
          {
            id: 'brown-rice',
            name: 'Brown Rice',
            calories: 110,
            protein: 3,
            carbs: 23,
            fats: 1,
            servingSize: '1/2 cup cooked',
            category: 'grains',
            lastUsed: new Date().toISOString(),
            useCount: 1,
            isFavorite: false,
            isPinned: false,
            tags: ['carbs', 'whole-grain']
          }
        ],
        totalCalories: 295,
        totalProtein: 38,
        totalCarbs: 23,
        totalFats: 5,
        useCount: 0,
        lastUsed: new Date().toISOString(),
        isCustom: false
      }
    ]

    setMealTemplates([...defaultTemplates, ...savedTemplates])
  }

  const generateSuggestions = () => {
    const currentHour = new Date().getHours()
    const currentMeal = currentHour < 10 ? 'breakfast' : currentHour < 15 ? 'lunch' : currentHour < 20 ? 'dinner' : 'snack'
    
    // Get foods commonly eaten at this time
    const mealHistory = getMealHistory(30) // Last 30 days
    const timeBasedFoods = mealHistory
      .filter(meal => {
        const mealHour = new Date(meal.timestamp).getHours()
        const mealType = mealHour < 10 ? 'breakfast' : mealHour < 15 ? 'lunch' : mealHour < 20 ? 'dinner' : 'snack'
        return mealType === currentMeal
      })
      .flatMap(meal => meal.foods || [])
      .reduce((acc: any[], food: any) => {
        const existing = acc.find(f => f.id === food.id)
        if (existing) {
          existing.count++
        } else {
          acc.push({ ...food, count: 1 })
        }
        return acc
      }, [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setSuggestions(timeBasedFoods)
  }

  const toggleFavorite = (food: FoodItem) => {
    const updatedFavorites = food.isFavorite
      ? favorites.filter(f => f.id !== food.id)
      : [...favorites, { ...food, isFavorite: true, useCount: food.useCount + 1 }]
    
    setFavorites(updatedFavorites)
    localStorage.setItem('favoriteFoods', JSON.stringify(updatedFavorites))
    updateFavorites(updatedFavorites)
  }

  const togglePin = (food: FoodItem) => {
    const updatedFavorites = favorites.map(f => 
      f.id === food.id ? { ...f, isPinned: !f.isPinned } : f
    )
    setFavorites(updatedFavorites)
    localStorage.setItem('favoriteFoods', JSON.stringify(updatedFavorites))
  }

  const quickAddFood = (food: FoodItem) => {
    const mealEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      name: food.name,
      brand: food.brand,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      servingSize: food.servingSize,
      category: food.category,
      tags: food.tags
    }

    addMeal(mealEntry)
    
    // Update use count
    const updatedFood = { ...food, useCount: food.useCount + 1, lastUsed: new Date().toISOString() }
    if (food.isFavorite) {
      const updatedFavorites = favorites.map(f => f.id === food.id ? updatedFood : f)
      setFavorites(updatedFavorites)
      localStorage.setItem('favoriteFoods', JSON.stringify(updatedFavorites))
    }
  }

  const quickAddTemplate = (template: MealTemplate) => {
    template.foods.forEach(food => {
      quickAddFood(food)
    })

    // Update template use count
    const updatedTemplates = mealTemplates.map(t => 
      t.id === template.id 
        ? { ...t, useCount: t.useCount + 1, lastUsed: new Date().toISOString() }
        : t
    )
    setMealTemplates(updatedTemplates)
    localStorage.setItem('mealTemplates', JSON.stringify(updatedTemplates.filter(t => t.isCustom)))
  }

  const filteredFavorites = useMemo(() => {
    let filtered = favorites.filter(food => 
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'all' || food.category === selectedCategory)
    )

    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'calories':
        filtered.sort((a, b) => a.calories - b.calories)
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        break
      case 'frequent':
        filtered.sort((a, b) => b.useCount - a.useCount)
        break
    }

    return filtered
  }, [favorites, searchQuery, selectedCategory, sortBy])

  const categories = useMemo(() => {
    const allCategories = [...new Set([
      ...favorites.map(f => f.category),
      ...recentItems.map(f => f.category)
    ])]
    return ['all', ...allCategories.sort()]
  }, [favorites, recentItems])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Add</h2>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="frequent">Most Used</option>
            <option value="recent">Recently Used</option>
            <option value="name">Name A-Z</option>
            <option value="calories">Calories</option>
          </select>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'favorites', label: 'Favorites', icon: Star, count: favorites.length },
            { id: 'recent', label: 'Recent', icon: Clock, count: recentItems.length },
            { id: 'templates', label: 'Templates', icon: BookOpen, count: mealTemplates.length },
            { id: 'suggestions', label: 'Smart Suggestions', icon: Zap, count: suggestions.length }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            {filteredFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Favorite Foods Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Star foods you eat frequently to add them to your favorites
                </p>
              </div>
            ) : (
              filteredFavorites.map(food => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onQuickAdd={() => quickAddFood(food)}
                  onToggleFavorite={() => toggleFavorite(food)}
                  onTogglePin={() => togglePin(food)}
                  showActions={showActions === food.id}
                  onToggleActions={() => setShowActions(showActions === food.id ? null : food.id)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="space-y-3">
            {recentItems.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recent Foods</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Foods you've logged recently will appear here for quick access
                </p>
              </div>
            ) : (
              recentItems.map(food => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onQuickAdd={() => quickAddFood(food)}
                  onToggleFavorite={() => toggleFavorite(food)}
                  showRecent
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-3">
            {mealTemplates.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Meal Templates</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create templates for meals you eat regularly
                </p>
              </div>
            ) : (
              mealTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onQuickAdd={() => quickAddTemplate(template)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900 dark:text-blue-200">Smart Suggestions</h3>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Based on your eating patterns and the current time, here are foods you might want to log:
              </p>
            </div>

            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    Not enough data for suggestions yet. Keep logging meals to see personalized recommendations!
                  </p>
                </div>
              ) : (
                suggestions.map(food => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    onQuickAdd={() => quickAddFood(food)}
                    onToggleFavorite={() => toggleFavorite(food)}
                    showSuggestion
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Food Card Component
const FoodCard: React.FC<{
  food: FoodItem
  onQuickAdd: () => void
  onToggleFavorite: () => void
  onTogglePin?: () => void
  showActions?: boolean
  onToggleActions?: () => void
  showRecent?: boolean
  showSuggestion?: boolean
}> = ({ 
  food, 
  onQuickAdd, 
  onToggleFavorite, 
  onTogglePin,
  showActions,
  onToggleActions,
  showRecent,
  showSuggestion
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {food.isPinned && <Pin className="h-4 w-4 text-primary-600" />}
            <h3 className="font-medium text-gray-900 dark:text-white">{food.name}</h3>
            {food.brand && (
              <span className="text-sm text-gray-500 dark:text-gray-400">({food.brand})</span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{food.calories} cal</span>
            <span>P: {food.protein}g</span>
            <span>C: {food.carbs}g</span>
            <span>F: {food.fats}g</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {food.servingSize}
            </span>
          </div>

          {showRecent && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Last used: {new Date(food.lastUsed).toLocaleDateString()}</span>
              <span>• Used {food.useCount} times</span>
            </div>
          )}

          {showSuggestion && (
            <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-3 w-3" />
              <span>You often eat this around this time</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              food.isFavorite
                ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30'
                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
            }`}
          >
            <Star className={`h-4 w-4 ${food.isFavorite ? 'fill-current' : ''}`} />
          </button>

          {onToggleActions && (
            <button
              onClick={onToggleActions}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onQuickAdd}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {showActions && onTogglePin && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <button
            onClick={onTogglePin}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Pin className="h-4 w-4" />
            {food.isPinned ? 'Unpin' : 'Pin to Top'}
          </button>
          
          <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          
          <button className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

// Template Card Component
const TemplateCard: React.FC<{
  template: MealTemplate
  onQuickAdd: () => void
}> = ({ template, onQuickAdd }) => {
  const getMealIcon = (category: string) => {
    switch (category) {
      case 'breakfast': return Coffee
      case 'lunch': return Apple
      case 'dinner': return Utensils
      case 'snack': return Heart
      default: return Utensils
    }
  }

  const Icon = getMealIcon(template.category)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-primary-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full capitalize">
              {template.category}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-medium">{template.totalCalories} cal</span>
            <span>P: {template.totalProtein}g</span>
            <span>C: {template.totalCarbs}g</span>
            <span>F: {template.totalFats}g</span>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {template.foods.length} items • Used {template.useCount} times
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {template.foods.slice(0, 3).map((food, index) => (
              <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                {food.name}
              </span>
            ))}
            {template.foods.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{template.foods.length - 3} more
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onQuickAdd}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add All
        </button>
      </div>
    </div>
  )
}

export default QuickAddSystem