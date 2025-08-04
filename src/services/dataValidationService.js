/**
 * Enterprise Data Validation Service
 * Handles data sanity checks, duplicate prevention, and integrity verification
 */

import useFitnessStore from '../store/fitnessStore.js'
import { dataBackupService } from './dataBackupService.js'

export class DataValidationService {
  constructor() {
    this.validationRules = new Map()
    this.duplicateCache = new Map()
    this.validationHistory = []
    this.isInitialized = false
    this.validationStats = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      duplicatesBlocked: 0,
      dataCorruptions: 0,
      autoFixes: 0
    }
  }

  /**
   * Initialize validation service
   */
  async initialize(config = {}) {
    console.log('🔍 Initializing Data Validation Service')
    
    this.config = {
      strictValidation: config.strictValidation !== false,
      autoFix: config.autoFix !== false,
      duplicateThreshold: config.duplicateThreshold || 0.95, // 95% similarity
      validationInterval: config.validationInterval || 60000, // 1 minute
      maxValidationHistory: config.maxValidationHistory || 1000,
      realTimeValidation: config.realTimeValidation !== false,
      ...config
    }

    // Setup validation rules
    this.setupValidationRules()
    
    // Setup duplicate detection
    this.setupDuplicateDetection()
    
    // Setup real-time validation listeners
    if (this.config.realTimeValidation) {
      this.setupRealTimeValidation()
    }

    // Start periodic validation
    this.startPeriodicValidation()

    this.isInitialized = true
    console.log('✅ Data Validation Service initialized')
    
    return true
  }

  /**
   * Setup validation rules
   */
  setupValidationRules() {
    // Nutrition validation rules
    this.validationRules.set('nutrition', {
      meals: {
        required: ['date', 'calories'],
        rules: {
          calories: { min: 0, max: 10000, type: 'number' },
          protein: { min: 0, max: 1000, type: 'number' },
          carbs: { min: 0, max: 2000, type: 'number' },
          fats: { min: 0, max: 500, type: 'number' },
          date: { type: 'date', maxAge: 365 }, // Max 1 year old
          name: { type: 'string', maxLength: 200 }
        },
        custom: [
          this.validateMacroBalance,
          this.validateMealTiming,
          this.validateCalorieDensity
        ]
      },
      dailyTotals: {
        rules: {
          dailyCalories: { min: 0, max: 15000 },
          dailyProtein: { min: 0, max: 1500 },
          dailyCarbs: { min: 0, max: 3000 },
          dailyFats: { min: 0, max: 750 }
        }
      }
    })

    // Activity validation rules
    this.validationRules.set('activity', {
      workouts: {
        required: ['date', 'duration'],
        rules: {
          duration: { min: 1, max: 480, type: 'number' }, // 1 min to 8 hours
          caloriesBurned: { min: 0, max: 2000, type: 'number' },
          heartRate: { min: 40, max: 220, type: 'number' },
          date: { type: 'date', maxAge: 365 },
          type: { type: 'string', enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'] }
        },
        custom: [
          this.validateWorkoutIntensity,
          this.validateHeartRateZones
        ]
      },
      dailyActivity: {
        rules: {
          dailySteps: { min: 0, max: 100000 },
          activeMinutes: { min: 0, max: 1440 }, // Max 24 hours
          caloriesBurned: { min: 0, max: 5000 }
        }
      }
    })

    // Wellness validation rules
    this.validationRules.set('wellness', {
      sleepEntries: {
        required: ['date', 'duration'],
        rules: {
          duration: { min: 60, max: 960, type: 'number' }, // 1-16 hours in minutes
          quality: { type: 'string', enum: ['very_poor', 'poor', 'fair', 'good', 'excellent'] },
          bedtime: { type: 'time' },
          wakeTime: { type: 'time' },
          date: { type: 'date', maxAge: 365 },
          stressLevel: { min: 1, max: 10, type: 'number' },
          energyLevel: { min: 1, max: 10, type: 'number' }
        },
        custom: [
          this.validateSleepConsistency,
          this.validateSleepDuration
        ]
      }
    })

    // Body measurements validation rules
    this.validationRules.set('body', {
      measurements: {
        weight: {
          rules: { value: { min: 50, max: 1000, type: 'number' } }, // lbs
          custom: [this.validateWeightChange]
        },
        bodyFat: {
          rules: { value: { min: 3, max: 60, type: 'number' } }, // percentage
          custom: [this.validateBodyFatChange]
        },
        muscleMass: {
          rules: { value: { min: 20, max: 500, type: 'number' } }, // lbs
        },
        waist: {
          rules: { value: { min: 15, max: 80, type: 'number' } }, // inches
        },
        chest: {
          rules: { value: { min: 20, max: 80, type: 'number' } }, // inches
        },
        arms: {
          rules: { value: { min: 5, max: 30, type: 'number' } }, // inches
        },
        thighs: {
          rules: { value: { min: 10, max: 50, type: 'number' } } // inches
        }
      }
    })

    // User profile validation rules
    this.validationRules.set('user', {
      profile: {
        required: ['age', 'height', 'weight'],
        rules: {
          age: { min: 13, max: 120, type: 'number' },
          height: { min: 36, max: 96, type: 'number' }, // inches
          weight: { min: 50, max: 1000, type: 'number' }, // lbs
          activityLevel: { type: 'string', enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] }
        }
      }
    })
  }

  /**
   * Setup duplicate detection
   */
  setupDuplicateDetection() {
    // Initialize duplicate cache with recent data
    this.rebuildDuplicateCache()
    
    // Set up cache cleanup interval
    setInterval(() => {
      this.cleanupDuplicateCache()
    }, 300000) // Every 5 minutes
  }

  /**
   * Setup real-time validation
   */
  setupRealTimeValidation() {
    if (typeof window !== 'undefined') {
      // Listen for data changes
      window.addEventListener('meal-logged', (event) => {
        this.validateData('nutrition', 'meals', [event.detail])
      })

      window.addEventListener('workout-completed', (event) => {
        this.validateData('activity', 'workouts', [event.detail])
      })

      window.addEventListener('sleep-logged', (event) => {
        this.validateData('wellness', 'sleepEntries', [event.detail])
      })

      window.addEventListener('measurement-logged', (event) => {
        this.validateData('body', 'measurements', event.detail)
      })
    }
  }

  /**
   * Start periodic validation
   */
  startPeriodicValidation() {
    setInterval(async () => {
      await this.validateAllData()
    }, this.config.validationInterval)

    // Initial validation
    setTimeout(() => {
      this.validateAllData()
    }, 5000)
  }

  /**
   * Validate all data
   */
  async validateAllData() {
    console.log('🔍 Starting comprehensive data validation...')
    
    const startTime = Date.now()
    const fitnessData = useFitnessStore.getState()
    const validationResults = {
      timestamp: new Date().toISOString(),
      categories: {},
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        duplicatesFound: 0,
        corruptionsFound: 0,
        autoFixed: 0
      }
    }

    // Validate each category
    for (const [category, rules] of this.validationRules) {
      if (!fitnessData[category]) continue

      console.log(`🔍 Validating ${category}...`)
      const categoryResult = await this.validateCategory(category, rules, fitnessData[category])
      validationResults.categories[category] = categoryResult

      // Update summary
      validationResults.summary.totalChecks += categoryResult.totalChecks
      validationResults.summary.passedChecks += categoryResult.passedChecks
      validationResults.summary.failedChecks += categoryResult.failedChecks
      validationResults.summary.duplicatesFound += categoryResult.duplicatesFound
      validationResults.summary.corruptionsFound += categoryResult.corruptionsFound
      validationResults.summary.autoFixed += categoryResult.autoFixed
    }

    const validationTime = Date.now() - startTime
    validationResults.validationTime = validationTime

    // Update stats
    this.updateValidationStats(validationResults.summary)

    // Store validation history
    this.validationHistory.push(validationResults)
    if (this.validationHistory.length > this.config.maxValidationHistory) {
      this.validationHistory.shift()
    }

    console.log(`✅ Data validation completed in ${validationTime}ms - ${validationResults.summary.passedChecks}/${validationResults.summary.totalChecks} checks passed`)

    return validationResults
  }

  /**
   * Validate specific data
   */
  async validateData(category, subcategory, data) {
    if (!this.validationRules.has(category)) {
      console.warn(`No validation rules for category: ${category}`)
      return { valid: true, warnings: [`No validation rules for ${category}`] }
    }

    const rules = this.validationRules.get(category)[subcategory]
    if (!rules) {
      console.warn(`No validation rules for ${category}.${subcategory}`)
      return { valid: true, warnings: [`No validation rules for ${category}.${subcategory}`] }
    }

    return await this.validateAgainstRules(data, rules, `${category}.${subcategory}`)
  }

  /**
   * Validate category
   */
  async validateCategory(category, categoryRules, data) {
    const result = {
      category,
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      duplicatesFound: 0,
      corruptionsFound: 0,
      autoFixed: 0,
      subcategories: {}
    }

    for (const [subcategory, rules] of Object.entries(categoryRules)) {
      const subcategoryData = data[subcategory]
      if (!subcategoryData) continue

      console.log(`  🔍 Validating ${category}.${subcategory}...`)
      const subcategoryResult = await this.validateAgainstRules(
        subcategoryData, 
        rules, 
        `${category}.${subcategory}`
      )

      result.subcategories[subcategory] = subcategoryResult
      result.totalChecks += subcategoryResult.totalChecks
      result.passedChecks += subcategoryResult.passedChecks
      result.failedChecks += subcategoryResult.failedChecks
      result.duplicatesFound += subcategoryResult.duplicatesFound
      result.corruptionsFound += subcategoryResult.corruptionsFound
      result.autoFixed += subcategoryResult.autoFixed
    }

    return result
  }

  /**
   * Validate against rules
   */
  async validateAgainstRules(data, rules, context) {
    const result = {
      context,
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      duplicatesFound: 0,
      corruptionsFound: 0,
      autoFixed: 0,
      errors: [],
      warnings: [],
      fixes: []
    }

    const dataArray = Array.isArray(data) ? data : [data]

    for (const item of dataArray) {
      // Check required fields
      if (rules.required) {
        for (const field of rules.required) {
          result.totalChecks++
          if (!item.hasOwnProperty(field) || item[field] === null || item[field] === undefined) {
            result.failedChecks++
            result.errors.push(`Missing required field: ${field}`)
            
            // Auto-fix if possible
            if (this.config.autoFix && this.canAutoFix(field, item)) {
              const fixedValue = this.autoFixField(field, item)
              item[field] = fixedValue
              result.autoFixed++
              result.fixes.push(`Auto-fixed missing ${field}: ${fixedValue}`)
            }
          } else {
            result.passedChecks++
          }
        }
      }

      // Check field rules
      if (rules.rules) {
        for (const [field, fieldRules] of Object.entries(rules.rules)) {
          if (!item.hasOwnProperty(field)) continue

          const value = item[field]
          const fieldResult = this.validateField(field, value, fieldRules, context)
          
          result.totalChecks += fieldResult.totalChecks
          result.passedChecks += fieldResult.passedChecks
          result.failedChecks += fieldResult.failedChecks
          result.errors.push(...fieldResult.errors)
          result.warnings.push(...fieldResult.warnings)

          // Auto-fix field if needed
          if (fieldResult.needsFix && this.config.autoFix) {
            const fixedValue = this.autoFixFieldValue(field, value, fieldRules)
            if (fixedValue !== value) {
              item[field] = fixedValue
              result.autoFixed++
              result.fixes.push(`Auto-fixed ${field}: ${value} → ${fixedValue}`)
            }
          }
        }
      }

      // Check for duplicates (only for array data)
      if (Array.isArray(data) && data.length > 1) {
        const duplicateCheck = this.checkForDuplicates(item, data, context)
        if (duplicateCheck.isDuplicate) {
          result.duplicatesFound++
          result.warnings.push(`Potential duplicate detected: ${duplicateCheck.reason}`)
        }
      }

      // Run custom validation rules
      if (rules.custom) {
        for (const customRule of rules.custom) {
          try {
            const customResult = await customRule.call(this, item, dataArray, context)
            if (customResult) {
              result.totalChecks++
              if (customResult.valid) {
                result.passedChecks++
              } else {
                result.failedChecks++
                result.errors.push(...(customResult.errors || []))
                result.warnings.push(...(customResult.warnings || []))
              }
            }
          } catch (error) {
            console.error(`Custom validation failed for ${context}:`, error)
            result.corruptionsFound++
          }
        }
      }
    }

    return result
  }

  /**
   * Validate individual field
   */
  validateField(fieldName, value, rules, context) {
    const result = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      errors: [],
      warnings: [],
      needsFix: false
    }

    // Type validation
    if (rules.type) {
      result.totalChecks++
      const typeValid = this.validateType(value, rules.type)
      if (typeValid) {
        result.passedChecks++
      } else {
        result.failedChecks++
        result.errors.push(`${fieldName}: Invalid type. Expected ${rules.type}, got ${typeof value}`)
        result.needsFix = true
      }
    }

    // Range validation
    if (typeof value === 'number') {
      if (rules.min !== undefined) {
        result.totalChecks++
        if (value >= rules.min) {
          result.passedChecks++
        } else {
          result.failedChecks++
          result.errors.push(`${fieldName}: Value ${value} below minimum ${rules.min}`)
          result.needsFix = true
        }
      }

      if (rules.max !== undefined) {
        result.totalChecks++
        if (value <= rules.max) {
          result.passedChecks++
        } else {
          result.failedChecks++
          result.errors.push(`${fieldName}: Value ${value} above maximum ${rules.max}`)
          result.needsFix = true
        }
      }
    }

    // String validation
    if (typeof value === 'string') {
      if (rules.maxLength) {
        result.totalChecks++
        if (value.length <= rules.maxLength) {
          result.passedChecks++
        } else {
          result.failedChecks++
          result.warnings.push(`${fieldName}: String length ${value.length} exceeds maximum ${rules.maxLength}`)
        }
      }

      if (rules.enum) {
        result.totalChecks++
        if (rules.enum.includes(value)) {
          result.passedChecks++
        } else {
          result.failedChecks++
          result.errors.push(`${fieldName}: Invalid value "${value}". Must be one of: ${rules.enum.join(', ')}`)
          result.needsFix = true
        }
      }
    }

    // Date validation
    if (rules.type === 'date') {
      result.totalChecks++
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        result.failedChecks++
        result.errors.push(`${fieldName}: Invalid date format`)
        result.needsFix = true
      } else {
        result.passedChecks++
        
        // Check age
        if (rules.maxAge) {
          const ageInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
          if (ageInDays > rules.maxAge) {
            result.warnings.push(`${fieldName}: Date is ${Math.round(ageInDays)} days old (max: ${rules.maxAge})`)
          }
        }
      }
    }

    return result
  }

  /**
   * Check for duplicates
   */
  checkForDuplicates(item, dataArray, context) {
    const itemKey = this.generateItemKey(item, context)
    
    // Check cache first
    if (this.duplicateCache.has(itemKey)) {
      const cached = this.duplicateCache.get(itemKey)
      const similarity = this.calculateSimilarity(item, cached.item)
      
      if (similarity >= this.config.duplicateThreshold) {
        return {
          isDuplicate: true,
          reason: `Similar to existing entry (${Math.round(similarity * 100)}% match)`,
          originalItem: cached.item,
          similarity
        }
      }
    }

    // Check against other items in current data
    for (const otherItem of dataArray) {
      if (otherItem === item) continue
      
      const similarity = this.calculateSimilarity(item, otherItem)
      if (similarity >= this.config.duplicateThreshold) {
        // Add to cache
        this.duplicateCache.set(itemKey, {
          item,
          timestamp: Date.now(),
          context
        })
        
        return {
          isDuplicate: true,
          reason: `Similar to another entry in dataset (${Math.round(similarity * 100)}% match)`,
          originalItem: otherItem,
          similarity
        }
      }
    }

    // Add to cache as unique
    this.duplicateCache.set(itemKey, {
      item,
      timestamp: Date.now(),
      context
    })

    return { isDuplicate: false }
  }

  /**
   * Calculate similarity between two items
   */
  calculateSimilarity(item1, item2) {
    const keys1 = Object.keys(item1)
    const keys2 = Object.keys(item2)
    const allKeys = new Set([...keys1, ...keys2])
    
    let matchingFields = 0
    let totalFields = allKeys.size

    for (const key of allKeys) {
      const val1 = item1[key]
      const val2 = item2[key]
      
      if (val1 === val2) {
        matchingFields++
      } else if (key === 'date' && val1 && val2) {
        // Special handling for dates - consider same day as match
        const date1 = new Date(val1).toDateString()
        const date2 = new Date(val2).toDateString()
        if (date1 === date2) {
          matchingFields += 0.8 // Partial match for same day, different time
        }
      } else if (typeof val1 === 'number' && typeof val2 === 'number') {
        // Numerical similarity
        const diff = Math.abs(val1 - val2)
        const avg = (val1 + val2) / 2
        const similarity = Math.max(0, 1 - (diff / avg))
        if (similarity > 0.95) {
          matchingFields += similarity
        }
      } else if (typeof val1 === 'string' && typeof val2 === 'string') {
        // String similarity (simple)
        const similarity = this.calculateStringSimilarity(val1, val2)
        if (similarity > 0.9) {
          matchingFields += similarity
        }
      }
    }

    return matchingFields / totalFields
  }

  /**
   * Calculate string similarity
   */
  calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1
    if (!str1 || !str2) return 0
    
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Custom validation methods

  async validateMacroBalance(meal, meals, context) {
    const totalCalories = meal.calories || 0
    const proteinCals = (meal.protein || 0) * 4
    const carbsCals = (meal.carbs || 0) * 4
    const fatCals = (meal.fats || 0) * 9
    const macroTotal = proteinCals + carbsCals + fatCals
    
    if (totalCalories > 0 && macroTotal > 0) {
      const difference = Math.abs(totalCalories - macroTotal)
      const tolerance = totalCalories * 0.1 // 10% tolerance
      
      if (difference > tolerance) {
        return {
          valid: false,
          errors: [`Macro breakdown doesn't match total calories. Difference: ${difference.toFixed(0)} calories`],
          warnings: []
        }
      }
    }
    
    return { valid: true }
  }

  async validateMealTiming(meal, meals, context) {
    if (!meal.date) return { valid: true }
    
    const mealTime = new Date(meal.date)
    const now = new Date()
    
    // Check if meal is in the future
    if (mealTime > now) {
      return {
        valid: false,
        warnings: ['Meal logged for future date/time']
      }
    }
    
    // Check if meal is too old
    const ageInDays = (now - mealTime) / (1000 * 60 * 60 * 24)
    if (ageInDays > 7) {
      return {
        valid: true,
        warnings: [`Meal is ${Math.round(ageInDays)} days old`]
      }
    }
    
    return { valid: true }
  }

  async validateCalorieDensity(meal, meals, context) {
    if (!meal.calories || !meal.name) return { valid: true }
    
    // Check for unrealistic calorie density
    if (meal.calories > 5000) {
      return {
        valid: false,
        warnings: ['Extremely high calorie count for single meal']
      }
    }
    
    if (meal.calories < 10 && meal.name.toLowerCase() !== 'water') {
      return {
        valid: false,
        warnings: ['Very low calorie count - may be incomplete entry']
      }
    }
    
    return { valid: true }
  }

  async validateWorkoutIntensity(workout, workouts, context) {
    if (!workout.duration || !workout.caloriesBurned) return { valid: true }
    
    const caloriesPerMinute = workout.caloriesBurned / workout.duration
    
    // Check for unrealistic calorie burn rates
    if (caloriesPerMinute > 20) {
      return {
        valid: false,
        warnings: ['Extremely high calorie burn rate - may be inaccurate']
      }
    }
    
    if (caloriesPerMinute < 2 && workout.duration > 10) {
      return {
        valid: false,
        warnings: ['Very low calorie burn rate for workout duration']
      }
    }
    
    return { valid: true }
  }

  async validateHeartRateZones(workout, workouts, context) {
    if (!workout.heartRate) return { valid: true }
    
    const hr = workout.heartRate
    
    // Basic heart rate validation
    if (hr < 50 || hr > 200) {
      return {
        valid: false,
        warnings: [`Heart rate ${hr} BPM seems unrealistic`]
      }
    }
    
    return { valid: true }
  }

  async validateSleepConsistency(sleepEntry, sleepEntries, context) {
    if (!sleepEntry.bedtime || !sleepEntry.wakeTime) return { valid: true }
    
    const bedtime = new Date(`1970-01-01T${sleepEntry.bedtime}:00`)
    const wakeTime = new Date(`1970-01-01T${sleepEntry.wakeTime}:00`)
    
    // Handle overnight sleep
    if (wakeTime < bedtime) {
      wakeTime.setDate(wakeTime.getDate() + 1)
    }
    
    const sleepDuration = (wakeTime - bedtime) / (1000 * 60) // minutes
    
    if (sleepEntry.duration && Math.abs(sleepDuration - sleepEntry.duration) > 30) {
      return {
        valid: false,
        warnings: ['Sleep duration doesn\'t match bedtime/wake time calculation']
      }
    }
    
    return { valid: true }
  }

  async validateSleepDuration(sleepEntry, sleepEntries, context) {
    if (!sleepEntry.duration) return { valid: true }
    
    const hours = sleepEntry.duration / 60
    
    if (hours < 2) {
      return {
        valid: false,
        warnings: ['Extremely short sleep duration recorded']
      }
    }
    
    if (hours > 14) {
      return {
        valid: false,
        warnings: ['Extremely long sleep duration recorded']
      }
    }
    
    return { valid: true }
  }

  async validateWeightChange(measurement, measurements, context) {
    if (measurements.length < 2) return { valid: true }
    
    const sortedMeasurements = measurements.sort((a, b) => new Date(a.date) - new Date(b.date))
    const currentIndex = sortedMeasurements.findIndex(m => m === measurement)
    
    if (currentIndex > 0) {
      const previousMeasurement = sortedMeasurements[currentIndex - 1]
      const weightChange = Math.abs(measurement.value - previousMeasurement.value)
      const daysBetween = (new Date(measurement.date) - new Date(previousMeasurement.date)) / (1000 * 60 * 60 * 24)
      
      // Check for unrealistic weight changes
      if (daysBetween <= 7 && weightChange > 10) {
        return {
          valid: false,
          warnings: [`Large weight change (${weightChange.toFixed(1)} lbs) in ${Math.round(daysBetween)} days`]
        }
      }
    }
    
    return { valid: true }
  }

  async validateBodyFatChange(measurement, measurements, context) {
    if (measurements.length < 2) return { valid: true }
    
    const sortedMeasurements = measurements.sort((a, b) => new Date(a.date) - new Date(b.date))
    const currentIndex = sortedMeasurements.findIndex(m => m === measurement)
    
    if (currentIndex > 0) {
      const previousMeasurement = sortedMeasurements[currentIndex - 1]
      const bfChange = Math.abs(measurement.value - previousMeasurement.value)
      const daysBetween = (new Date(measurement.date) - new Date(previousMeasurement.date)) / (1000 * 60 * 60 * 24)
      
      // Check for unrealistic body fat changes
      if (daysBetween <= 7 && bfChange > 5) {
        return {
          valid: false,
          warnings: [`Large body fat change (${bfChange.toFixed(1)}%) in ${Math.round(daysBetween)} days`]
        }
      }
    }
    
    return { valid: true }
  }

  // Auto-fix methods

  canAutoFix(field, item) {
    const autoFixableFields = {
      'date': () => new Date().toISOString(),
      'id': () => Date.now(),
      'calories': () => 0,
      'duration': () => 60,
      'quality': () => 'fair'
    }
    
    return autoFixableFields.hasOwnProperty(field)
  }

  autoFixField(field, item) {
    const fixes = {
      'date': () => new Date().toISOString(),
      'id': () => Date.now(),
      'calories': () => 0,
      'duration': () => 60,
      'quality': () => 'fair'
    }
    
    return fixes[field] ? fixes[field]() : null
  }

  autoFixFieldValue(field, value, rules) {
    // Fix numeric ranges
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return rules.min
      }
      if (rules.max !== undefined && value > rules.max) {
        return rules.max
      }
    }
    
    // Fix enum values
    if (rules.enum && !rules.enum.includes(value)) {
      return rules.enum[0] // Return first valid option
    }
    
    // Fix string length
    if (typeof value === 'string' && rules.maxLength && value.length > rules.maxLength) {
      return value.substring(0, rules.maxLength)
    }
    
    return value
  }

  // Utility methods

  validateType(value, expectedType) {
    switch (expectedType) {
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'string':
        return typeof value === 'string'
      case 'boolean':
        return typeof value === 'boolean'
      case 'date':
        return !isNaN(new Date(value).getTime())
      case 'time':
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
      default:
        return true
    }
  }

  generateItemKey(item, context) {
    const keyFields = ['date', 'name', 'type', 'calories', 'duration']
    const keyParts = keyFields
      .filter(field => item.hasOwnProperty(field))
      .map(field => `${field}:${item[field]}`)
    
    return `${context}:${keyParts.join('|')}`
  }

  rebuildDuplicateCache() {
    this.duplicateCache.clear()
    
    const fitnessData = useFitnessStore.getState()
    
    // Cache recent meals
    if (fitnessData.nutrition?.meals) {
      fitnessData.nutrition.meals.slice(-100).forEach(meal => {
        const key = this.generateItemKey(meal, 'nutrition.meals')
        this.duplicateCache.set(key, {
          item: meal,
          timestamp: Date.now(),
          context: 'nutrition.meals'
        })
      })
    }
    
    // Cache recent workouts
    if (fitnessData.activity?.workouts) {
      fitnessData.activity.workouts.slice(-50).forEach(workout => {
        const key = this.generateItemKey(workout, 'activity.workouts')
        this.duplicateCache.set(key, {
          item: workout,
          timestamp: Date.now(),
          context: 'activity.workouts'
        })
      })
    }
  }

  cleanupDuplicateCache() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    
    for (const [key, cached] of this.duplicateCache.entries()) {
      if (cached.timestamp < cutoffTime) {
        this.duplicateCache.delete(key)
      }
    }
  }

  updateValidationStats(summary) {
    this.validationStats.totalValidations++
    
    if (summary.failedChecks === 0) {
      this.validationStats.passedValidations++
    } else {
      this.validationStats.failedValidations++
    }
    
    this.validationStats.duplicatesBlocked += summary.duplicatesFound
    this.validationStats.dataCorruptions += summary.corruptionsFound
    this.validationStats.autoFixes += summary.autoFixed
  }

  // API methods

  getValidationStats() {
    return {
      ...this.validationStats,
      cacheSize: this.duplicateCache.size,
      historySize: this.validationHistory.length,
      lastValidation: this.validationHistory.length > 0 
        ? this.validationHistory[this.validationHistory.length - 1].timestamp 
        : null
    }
  }

  getValidationHistory(limit = 10) {
    return this.validationHistory.slice(-limit)
  }

  async preventDuplicate(data, context) {
    const duplicateCheck = this.checkForDuplicates(data, [], context)
    
    if (duplicateCheck.isDuplicate) {
      console.log(`🚫 Duplicate prevented: ${duplicateCheck.reason}`)
      return {
        prevented: true,
        reason: duplicateCheck.reason,
        similarity: duplicateCheck.similarity,
        originalItem: duplicateCheck.originalItem
      }
    }
    
    return { prevented: false }
  }

  async repairCorruptedData() {
    console.log('🔧 Starting corrupted data repair...')
    
    try {
      // Create emergency backup before repair
      await dataBackupService.createBackup('pre-repair')
      
      // Run comprehensive validation
      const validationResult = await this.validateAllData()
      
      if (validationResult.summary.corruptionsFound > 0) {
        console.log(`🔧 Found ${validationResult.summary.corruptionsFound} corruptions, attempting repair...`)
        
        // Implement specific repair strategies based on corruption type
        // This would be expanded based on specific corruption patterns found
        
        return {
          success: true,
          corruptionsFound: validationResult.summary.corruptionsFound,
          repaired: validationResult.summary.autoFixed
        }
      }
      
      return {
        success: true,
        corruptionsFound: 0,
        message: 'No corrupted data found'
      }
      
    } catch (error) {
      console.error('Data repair failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  stop() {
    this.isInitialized = false
    console.log('🛑 Data Validation Service stopped')
  }
}

// Export singleton instance
export const dataValidationService = new DataValidationService()
export default dataValidationService