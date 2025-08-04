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
      // Placeholder for food database API
      return await this.request(`/food/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      // Fallback to mock data for development
      return this.getMockFoodData(query)
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

  // Mock data methods for development
  getMockFoodData(query) {
    const mockFoods = [
      {
        id: '1',
        name: 'Banana',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fats: 0.4,
        fiber: 3.1,
        sugar: 14.4,
        serving_size: '1 medium (118g)'
      },
      {
        id: '2',
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        fiber: 0,
        sugar: 0,
        serving_size: '100g'
      },
      {
        id: '3',
        name: 'Brown Rice',
        calories: 112,
        protein: 2.6,
        carbs: 23,
        fats: 0.9,
        fiber: 1.8,
        sugar: 0.4,
        serving_size: '100g cooked'
      }
    ]

    return {
      foods: mockFoods.filter(food => 
        food.name.toLowerCase().includes(query.toLowerCase())
      )
    }
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