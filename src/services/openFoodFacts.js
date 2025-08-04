import axios from 'axios'
import storageService from './storage'

class OpenFoodFactsService {
  constructor() {
    this.baseURL = 'https://world.openfoodfacts.org'
    this.cache = new Map()
    this.maxCacheSize = 1000
    this.cacheExpiry = 24 * 60 * 60 * 1000 // 24 hours
  }

  /**
   * Get product information by barcode
   * @param {string} barcode - The product barcode
   * @returns {Promise<Object>} Product information
   */
  async getProductByBarcode(barcode) {
    try {
      // Check cache first
      const cached = this.getCachedProduct(barcode)
      if (cached) {
        console.log('Returning cached product for barcode:', barcode)
        return cached
      }

      // Check offline database
      const offlineProduct = await this.getOfflineProduct(barcode)
      if (offlineProduct) {
        console.log('Returning offline product for barcode:', barcode)
        return offlineProduct
      }

      // Fetch from Open Food Facts API
      console.log('Fetching product from API for barcode:', barcode)
      const response = await axios.get(`${this.baseURL}/api/v0/product/${barcode}.json`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'FitnessTracker/1.0.0 (Mobile App)'
        }
      })

      if (response.data.status === 1 && response.data.product) {
        const product = this.normalizeProduct(response.data.product, barcode)
        
        // Cache the result
        this.cacheProduct(barcode, product)
        
        // Save to offline database
        await this.saveOfflineProduct(barcode, product)
        
        return product
      } else {
        throw new Error('Product not found in Open Food Facts database')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      
      // Check if we have any cached/offline version as fallback
      const fallback = await this.getFallbackProduct(barcode)
      if (fallback) {
        return fallback
      }
      
      throw this.createDetailedError(error, barcode)
    }
  }

  /**
   * Search products by name
   * @param {string} searchTerm - Search term
   * @param {number} page - Page number (default: 1)
   * @param {number} pageSize - Results per page (default: 20)
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(searchTerm, page = 1, pageSize = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/cgi/search.pl`, {
        params: {
          search_terms: searchTerm,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: pageSize,
          page: page,
          fields: 'code,product_name,brands,image_url,nutriments,serving_size,quantity'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'FitnessTracker/1.0.0 (Mobile App)'
        }
      })

      if (response.data.products) {
        const products = response.data.products.map(product => 
          this.normalizeProduct(product, product.code)
        ).filter(product => product.name && product.calories !== undefined)

        return {
          products,
          count: response.data.count || products.length,
          page,
          pageSize,
          hasMore: products.length === pageSize
        }
      }

      return {
        products: [],
        count: 0,
        page,
        pageSize,
        hasMore: false
      }
    } catch (error) {
      console.error('Error searching products:', error)
      throw this.createDetailedError(error, searchTerm)
    }
  }

  /**
   * Normalize product data from Open Food Facts format
   * @param {Object} rawProduct - Raw product data from API
   * @param {string} barcode - Product barcode
   * @returns {Object} Normalized product data
   */
  normalizeProduct(rawProduct, barcode) {
    const nutriments = rawProduct.nutriments || {}
    
    // Get nutrition per 100g (default unit in Open Food Facts)
    const per100g = {
      energy: nutriments['energy-kcal_100g'] || nutriments['energy_100g'] || 0,
      protein: nutriments['proteins_100g'] || 0,
      carbs: nutriments['carbohydrates_100g'] || 0,
      fats: nutriments['fat_100g'] || 0,
      fiber: nutriments['fiber_100g'] || 0,
      sugar: nutriments['sugars_100g'] || 0,
      sodium: nutriments['sodium_100g'] || 0,
      salt: nutriments['salt_100g'] || 0
    }

    // Determine serving size
    let servingSize = '100g'
    let servingMultiplier = 1

    if (rawProduct.serving_size) {
      servingSize = rawProduct.serving_size
      // Try to extract number from serving size (e.g., "250ml" -> 250)
      const match = servingSize.match(/(\d+(?:\.\d+)?)/)
      if (match) {
        servingMultiplier = parseFloat(match[1]) / 100
      }
    } else if (rawProduct.quantity) {
      servingSize = rawProduct.quantity
    }

    return {
      id: barcode,
      barcode,
      name: rawProduct.product_name || rawProduct.product_name_en || 'Unknown Product',
      brand: rawProduct.brands || '',
      serving_size: servingSize,
      image_url: rawProduct.image_url || rawProduct.image_front_url || '',
      
      // Nutrition per serving
      calories: Math.round(per100g.energy * servingMultiplier),
      protein: Math.round((per100g.protein * servingMultiplier) * 10) / 10,
      carbs: Math.round((per100g.carbs * servingMultiplier) * 10) / 10,
      fats: Math.round((per100g.fats * servingMultiplier) * 10) / 10,
      fiber: Math.round((per100g.fiber * servingMultiplier) * 10) / 10,
      sugar: Math.round((per100g.sugar * servingMultiplier) * 10) / 10,
      sodium: Math.round((per100g.sodium * servingMultiplier) * 10) / 10,
      
      // Additional metadata
      source: 'openfoodfacts',
      lastUpdated: new Date().toISOString(),
      raw: rawProduct // Keep raw data for debugging
    }
  }

  /**
   * Cache product in memory
   * @param {string} barcode - Product barcode
   * @param {Object} product - Product data
   */
  cacheProduct(barcode, product) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(barcode, {
      product,
      timestamp: Date.now()
    })
  }

  /**
   * Get cached product
   * @param {string} barcode - Product barcode
   * @returns {Object|null} Cached product or null
   */
  getCachedProduct(barcode) {
    const cached = this.cache.get(barcode)
    if (!cached) return null

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(barcode)
      return null
    }

    return cached.product
  }

  /**
   * Save product to offline database
   * @param {string} barcode - Product barcode
   * @param {Object} product - Product data
   */
  async saveOfflineProduct(barcode, product) {
    try {
      await storageService.save('foodProducts', {
        id: barcode,
        barcode,
        ...product,
        savedAt: new Date().toISOString()
      })
    } catch (error) {
      console.warn('Failed to save product offline:', error)
    }
  }

  /**
   * Get product from offline database
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object|null>} Product or null
   */
  async getOfflineProduct(barcode) {
    try {
      const product = await storageService.get('foodProducts', barcode)
      if (!product) return null

      // Check if offline data is not too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000
      const age = Date.now() - new Date(product.savedAt).getTime()
      
      if (age > maxAge) {
        await storageService.delete('foodProducts', barcode)
        return null
      }

      return product
    } catch (error) {
      console.warn('Failed to get offline product:', error)
      return null
    }
  }

  /**
   * Get fallback product data (very old cache or offline data)
   * @param {string} barcode - Product barcode
   * @returns {Promise<Object|null>} Fallback product or null
   */
  async getFallbackProduct(barcode) {
    // Try very old offline data as last resort
    try {
      const product = await storageService.get('foodProducts', barcode)
      if (product) {
        console.log('Using stale offline data as fallback for:', barcode)
        return { ...product, isStale: true }
      }
    } catch (error) {
      console.warn('No fallback data available:', error)
    }
    return null
  }

  /**
   * Create detailed error with context
   * @param {Error} error - Original error
   * @param {string} context - Context (barcode or search term)
   * @returns {Error} Enhanced error
   */
  createDetailedError(error, context) {
    if (error.code === 'ENOTFOUND' || error.code === 'NETWORK_ERROR') {
      return new Error(`No internet connection. Unable to look up product: ${context}`)
    }
    
    if (error.response?.status === 404) {
      return new Error(`Product not found in database: ${context}`)
    }
    
    if (error.response?.status >= 500) {
      return new Error(`Food database temporarily unavailable. Please try again later.`)
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error(`Request timeout. Please check your internet connection.`)
    }

    return new Error(`Failed to look up product: ${context}. ${error.message}`)
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.keys())
    }
  }

  /**
   * Validate barcode format
   * @param {string} barcode - Barcode to validate
   * @returns {boolean} Is valid barcode
   */
  isValidBarcode(barcode) {
    if (!barcode || typeof barcode !== 'string') return false
    
    // Remove any spaces or dashes
    const cleanBarcode = barcode.replace(/[\s-]/g, '')
    
    // Check common barcode formats
    const formats = [
      /^\d{8}$/,    // EAN-8
      /^\d{12}$/,   // UPC-A
      /^\d{13}$/,   // EAN-13
      /^\d{14}$/    // ITF-14
    ]
    
    return formats.some(format => format.test(cleanBarcode))
  }

  /**
   * Check if service is available (network connectivity)
   * @returns {Promise<boolean>} Service availability
   */
  async checkAvailability() {
    try {
      const response = await axios.get(`${this.baseURL}/api/v0/product/3017620422003.json`, {
        timeout: 5000
      })
      return response.status === 200
    } catch (error) {
      return false
    }
  }
}

export default new OpenFoodFactsService()