const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.fitness-tracker.com'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Food and nutrition APIs
  async searchFood(query) {
    try {
      // Use OpenFoodFacts API for real food search
      const openFoodFacts = await import('./openFoodFacts.js')
      const results = await openFoodFacts.default.searchProducts(query, 1, 20)
      
      // Convert OpenFoodFacts format to our expected format
      return {
        foods: results.products.map(product => ({
          id: product.id,
          name: product.name,
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fats: product.fats,
          fiber: product.fiber,
          sugar: product.sugar,
          serving_size: product.serving_size,
          brand: product.brand,
          source: 'openfoodfacts'
        }))
      }
    } catch (error) {
      console.warn('OpenFoodFacts search failed, using mock data:', error)
      // Fallback to enhanced mock data
      return this.getEnhancedMockFoodData(query)
    }
  }

  async getFoodByBarcode(barcode) {
    try {
      return await this.request(`/food/barcode/${barcode}`)
    } catch (error) {
      // Fallback for development
      return this.getMockBarcodeData(barcode)
    }
  }

  // Exercise and activity APIs
  async searchExercises(query) {
    try {
      return await this.request(`/exercises/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      return this.getMockExerciseData(query)
    }
  }

  async getExerciseById(id) {
    try {
      return await this.request(`/exercises/${id}`)
    } catch (error) {
      return this.getMockExerciseById(id)
    }
  }

  // User data sync (for future cloud sync)
  async syncUserData(userData) {
    try {
      return await this.request('/user/sync', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    } catch (error) {
      console.log('Sync failed, data stored locally')
      return { success: false, message: 'Offline mode' }
    }
  }

  // Enhanced mock data methods for development
  getEnhancedMockFoodData(query) {
    const mockFoods = [
      // Fruits
      { id: '1', name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fats: 0.4, fiber: 3.1, sugar: 14.4, serving_size: '1 medium (118g)', brand: '' },
      { id: '2', name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fats: 0.3, fiber: 4.4, sugar: 19, serving_size: '1 medium (182g)', brand: '' },
      { id: '3', name: 'Orange', calories: 62, protein: 1.2, carbs: 15, fats: 0.2, fiber: 3.1, sugar: 12, serving_size: '1 medium (154g)', brand: '' },
      { id: '4', name: 'Strawberries', calories: 49, protein: 1, carbs: 12, fats: 0.5, fiber: 3, sugar: 7, serving_size: '1 cup (152g)', brand: '' },
      
      // Proteins
      { id: '5', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, sugar: 0, serving_size: '100g', brand: '' },
      { id: '6', name: 'Salmon', calories: 208, protein: 22, carbs: 0, fats: 12, fiber: 0, sugar: 0, serving_size: '100g', brand: '' },
      { id: '7', name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fats: 0.7, fiber: 0, sugar: 6, serving_size: '170g container', brand: 'Generic' },
      { id: '8', name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0, sugar: 1.1, serving_size: '2 large eggs', brand: '' },
      
      // Grains & Carbs
      { id: '9', name: 'Brown Rice', calories: 112, protein: 2.6, carbs: 23, fats: 0.9, fiber: 1.8, sugar: 0.4, serving_size: '100g cooked', brand: '' },
      { id: '10', name: 'Quinoa', calories: 120, protein: 4.4, carbs: 22, fats: 1.9, fiber: 2.8, sugar: 0.9, serving_size: '100g cooked', brand: '' },
      { id: '11', name: 'Oatmeal', calories: 68, protein: 2.4, carbs: 12, fats: 1.4, fiber: 1.7, sugar: 0.3, serving_size: '100g cooked', brand: '' },
      { id: '12', name: 'Whole Wheat Bread', calories: 80, protein: 4, carbs: 14, fats: 1.1, fiber: 2, sugar: 1.4, serving_size: '1 slice (28g)', brand: 'Generic' },
      
      // Vegetables
      { id: '13', name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fats: 0.4, fiber: 2.6, sugar: 1.5, serving_size: '1 cup (91g)', brand: '' },
      { id: '14', name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, sugar: 0.4, serving_size: '100g', brand: '' },
      { id: '15', name: 'Sweet Potato', calories: 112, protein: 2, carbs: 26, fats: 0.1, fiber: 3.9, sugar: 5.4, serving_size: '1 medium (128g)', brand: '' },
      
      // Nuts & Seeds
      { id: '16', name: 'Almonds', calories: 161, protein: 6, carbs: 6, fats: 14, fiber: 3.5, sugar: 1.2, serving_size: '28g (23 almonds)', brand: '' },
      { id: '17', name: 'Peanut Butter', calories: 190, protein: 8, carbs: 8, fats: 16, fiber: 2, sugar: 3, serving_size: '2 tbsp (32g)', brand: 'Generic' },
      
      // Dairy
      { id: '18', name: 'Milk (2%)', calories: 120, protein: 8, carbs: 12, fats: 5, fiber: 0, sugar: 12, serving_size: '1 cup (240ml)', brand: 'Generic' },
      { id: '19', name: 'Cheddar Cheese', calories: 110, protein: 7, carbs: 1, fats: 9, fiber: 0, sugar: 0, serving_size: '28g', brand: 'Generic' },
      
      // Popular Packaged Foods
      { id: '20', name: 'Pasta', calories: 131, protein: 5, carbs: 25, fats: 1.1, fiber: 1.8, sugar: 0.8, serving_size: '100g cooked', brand: 'Generic' },
      { id: '21', name: 'White Rice', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, sugar: 0.1, serving_size: '100g cooked', brand: '' },
      { id: '22', name: 'Avocado', calories: 234, protein: 2.9, carbs: 12, fats: 21, fiber: 10, sugar: 1, serving_size: '1 medium (150g)', brand: '' }
    ]

    return {
      foods: mockFoods.filter(food => 
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        food.brand.toLowerCase().includes(query.toLowerCase())
      )
    }
  }

  // Keep original mock data method for backward compatibility
  getMockFoodData(query) {
    return this.getEnhancedMockFoodData(query)
  }

  getMockBarcodeData(barcode) {
    // Mock barcode response
    return {
      food: {
        id: barcode,
        name: 'Scanned Product',
        calories: 150,
        protein: 5,
        carbs: 20,
        fats: 6,
        serving_size: '1 package'
      }
    }
  }

  getMockExerciseData(query) {
    const mockExercises = [
      {
        id: '1',
        name: 'Running',
        category: 'cardio',
        calories_per_minute: 10,
        description: 'Running at moderate pace',
        muscle_groups: ['legs', 'core']
      },
      {
        id: '2',
        name: 'Push-ups',
        category: 'strength',
        calories_per_minute: 7,
        description: 'Standard push-up exercise',
        muscle_groups: ['chest', 'arms', 'core']
      },
      {
        id: '3',
        name: 'Yoga',
        category: 'flexibility',
        calories_per_minute: 3,
        description: 'Hatha yoga practice',
        muscle_groups: ['full_body']
      }
    ]

    return {
      exercises: mockExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(query.toLowerCase()) ||
        exercise.category.toLowerCase().includes(query.toLowerCase())
      )
    }
  }

  getMockExerciseById(id) {
    const exercise = this.getMockExerciseData('').exercises.find(e => e.id === id)
    return { exercise }
  }
}

export default new ApiService()