import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Search, X, Plus, Loader2, Zap } from 'lucide-react'
import { Food, FoodSearchResult, NutritionError } from '../../types/nutrition'
import apiService from '../../services/api'
import { validateRequired } from '../../utils/validation'
import useDebounce from '../../hooks/useDebounce'
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation'

interface FoodSearchProps {
  onFoodSelect: (food: Food) => void
  onClose: () => void
  isOpen: boolean
}

// Performance: Memoized food item component
const FoodItem = React.memo<{
  food: Food
  onSelect: () => void
  isActive: boolean
}>(({ food, onSelect, isActive }) => (
  <div
    className={`p-4 border border-gray-200 dark:border-gray-600 rounded-lg transition-all cursor-pointer ${
      isActive 
        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600' 
        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}
    onClick={onSelect}
    role="option"
    aria-selected={isActive}
    data-food-item
    tabIndex={isActive ? 0 : -1}
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
        <div 
          className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400"
          aria-label={`Nutrition: ${food.calories} calories, ${food.protein} grams protein, ${food.carbs} grams carbs, ${food.fats} grams fat`}
        >
          <span>{food.calories} cal</span>
          <span>{food.protein}g protein</span>
          <span>{food.carbs}g carbs</span>
          <span>{food.fats}g fat</span>
        </div>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        className="btn-primary flex items-center gap-2 whitespace-nowrap min-h-[44px] shrink-0"
        aria-label={`Add ${food.name} to meal`}
      >
        <Plus size={16} aria-hidden="true" />
        Add
      </button>
    </div>
  </div>
))

FoodItem.displayName = 'FoodItem'

const FoodSearchOptimized: React.FC<FoodSearchProps> = ({ onFoodSelect, onClose, isOpen }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<NutritionError | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Performance: Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Performance: Memoized recent searches from localStorage
  const storedRecentSearches = useMemo(() => {
    try {
      const stored = localStorage.getItem('nutrition-recent-searches')
      return stored ? JSON.parse(stored).slice(0, 5) : []
    } catch {
      return []
    }
  }, [])

  // Accessibility: Keyboard navigation for search results
  const { activeIndex, setActiveItem } = useKeyboardNavigation({
    containerRef: resultsContainerRef,
    onEnter: (index) => {
      if (searchResults[index]) {
        handleFoodSelect(searchResults[index])
      }
    },
    onEscape: onClose,
    isEnabled: isOpen && searchResults.length > 0,
    itemSelector: '[data-food-item]'
  })

  // Performance: Memoized search function
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
      
      // Store successful search in recent searches
      saveRecentSearch(query)
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

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery && isOpen) {
      searchFoods(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, searchFoods, isOpen])

  const saveRecentSearch = useCallback((query: string) => {
    try {
      const current = [...recentSearches]
      const filtered = current.filter(search => search.toLowerCase() !== query.toLowerCase())
      const updated = [query, ...filtered].slice(0, 5)
      
      setRecentSearches(updated)
      localStorage.setItem('nutrition-recent-searches', JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save recent search:', error)
    }
  }, [recentSearches])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchFoods(searchQuery)
    }
  }, [searchQuery, searchFoods])

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setError(null)
    
    // Reset active item when search changes
    if (value !== searchQuery) {
      setActiveItem(0)
    }
  }, [searchQuery, setActiveItem])

  const handleFoodSelect = useCallback((food: Food) => {
    onFoodSelect(food)
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [onFoodSelect])

  const handleRecentSearchClick = useCallback((query: string) => {
    setSearchQuery(query)
    searchFoods(query)
    searchInputRef.current?.focus()
  }, [searchFoods])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setError(null)
    searchInputRef.current?.focus()
  }, [])

  // Initialize recent searches and focus management
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(storedRecentSearches)
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      // Reset state when modal closes
      setSearchQuery('')
      setSearchResults([])
      setHasSearched(false)
      setError(null)
    }
  }, [isOpen, storedRecentSearches])

  // Accessibility: Focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Accessibility: Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 
            id="search-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Search Foods
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close search dialog"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </button>
        </header>

        {/* Search Form */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleQueryChange}
                placeholder="Search for foods (e.g., apple, chicken breast)"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSearching}
                aria-label="Search for foods"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} className="text-gray-400" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Recent Searches */}
            {!searchQuery && recentSearches.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recent searches:</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleRecentSearchClick(search)}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                      aria-label={`Search for ${search}`}
                    >
                      <Zap size={12} aria-hidden="true" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual search button for better mobile UX */}
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="w-full sm:w-auto btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSearching ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} aria-hidden="true" />
                  Search
                </>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div 
              role="alert"
              className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-700 dark:text-red-400">
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div 
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-4"
          role="listbox"
          aria-label="Search results"
        >
          {isSearching ? (
            <div 
              className="flex items-center justify-center py-8"
              role="status"
              aria-live="polite"
            >
              <Loader2 size={24} className="animate-spin text-primary-500" aria-hidden="true" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Searching foods...
              </span>
            </div>
          ) : hasSearched ? (
            searchResults.length > 0 ? (
              <div className="space-y-3">
                <p 
                  className="text-sm text-gray-600 dark:text-gray-400 mb-4"
                  role="status"
                  aria-live="polite"
                >
                  Found {searchResults.length} results for "{searchQuery}"
                </p>
                {searchResults.map((food, index) => (
                  <FoodItem
                    key={food.id}
                    food={food}
                    onSelect={() => handleFoodSelect(food)}
                    isActive={index === activeIndex}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8" role="status">
                <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
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
              <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
              <p className="text-gray-500 dark:text-gray-400">
                Search for foods to add to your meal
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {recentSearches.length > 0 
                  ? 'Enter a food name above or select from recent searches'
                  : 'Enter a food name above to get started'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FoodSearchOptimized