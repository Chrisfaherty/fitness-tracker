export interface Food {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber?: number
  sugar?: number
  sodium?: number
  serving_size: string
  brand?: string
  barcode?: string
}

export interface FoodEntry {
  id: string
  food: Food
  quantity: number
  servings: number
  mealType: MealType
  timestamp: string
  notes?: string
}

export interface Meal {
  id: string
  name: string
  type: MealType
  entries: FoodEntry[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  timestamp: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export interface NutritionTargets {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export interface DailyNutrition {
  date: string
  meals: Meal[]
  targets: NutritionTargets
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  totalFiber: number
  totalSugar: number
  totalSodium: number
  water: number
}

export interface FoodSearchResult {
  foods: Food[]
  total: number
  page: number
  hasMore: boolean
}

export interface MacroEntry {
  calories: number
  protein: number
  carbs: number
  fats: number
  servingSize: string
}

export interface NutritionError {
  message: string
  field?: string
  code?: string
}

export interface LoadingState {
  isLoading: boolean
  isSearching: boolean
  isAdding: boolean
  isDeleting: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}