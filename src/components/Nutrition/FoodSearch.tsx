import { useState, useEffect, useCallback } from 'react'
import { Search, X, Plus, Loader2 } from 'lucide-react'
import { Food, FoodSearchResult, NutritionError } from '../../types/nutrition'
import apiService from '../../services/api'
import { validateRequired } from '../../utils/validation'

interface FoodSearchProps {
  onFoodSelect: (food: Food) => void
  onClose: () => void
  isOpen: boolean
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onFoodSelect, onClose, isOpen }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<NutritionError | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    const validation = validateRequired(query, 'Search query')
    if (!validation.isValid) {
      setError({ message: validation.error || 'Search query is required' })
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const result: FoodSearchResult = await apiService.searchFood(query)
      setSearchResults(result.foods || [])
      setHasSearched(true)
    } catch (err) {
      console.error('Food search error:', err)
      setError({
        message: 'Failed to search for foods. Please try again.',
        code: 'SEARCH_ERROR'
      })
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    searchFoods(searchQuery)
  }, [searchQuery, searchFoods])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setError(null)
  }

  const handleFoodSelect = (food: Food) => {
    onFoodSelect(food)
    onClose()
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setError(null)
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      clearSearch()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Foods
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close search"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleQueryChange}
                placeholder="Search for foods (e.g., apple, chicken breast)"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSearching}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  aria-label="Clear search"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="w-full sm:w-auto btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search
                </>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Searching foods...
              </span>
            </div>
          ) : hasSearched ? (
            searchResults.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Found {searchResults.length} results for "{searchQuery}"
                </p>
                {searchResults.map((food) => (
                  <div
                    key={food.id}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {food.name}
                        </h4>
                        {food.brand && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {food.brand}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {food.serving_size}
                        </p>
                        
                        {/* Nutrition Info */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{food.calories} cal</span>
                          <span>{food.protein}g protein</span>
                          <span>{food.carbs}g carbs</span>
                          <span>{food.fats}g fat</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleFoodSelect(food)}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No foods found for "{searchQuery}"
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Try a different search term or add the food manually
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Search for foods to add to your meal
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Enter a food name above to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FoodSearch