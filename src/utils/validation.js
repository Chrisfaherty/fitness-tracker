// Form validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  const errors = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateAge = (age) => {
  const numAge = parseInt(age)
  return numAge >= 13 && numAge <= 120
}

export const validateWeight = (weight, unit = 'kg') => {
  const numWeight = parseFloat(weight)
  
  if (isNaN(numWeight) || numWeight <= 0) {
    return { isValid: false, error: 'Weight must be a positive number' }
  }
  
  const limits = {
    kg: { min: 20, max: 300 },
    lb: { min: 44, max: 660 }
  }
  
  const { min, max } = limits[unit] || limits.kg
  
  if (numWeight < min || numWeight > max) {
    return { 
      isValid: false, 
      error: `Weight must be between ${min} and ${max} ${unit}` 
    }
  }
  
  return { isValid: true }
}

export const validateHeight = (height, unit = 'cm') => {
  const numHeight = parseFloat(height)
  
  if (isNaN(numHeight) || numHeight <= 0) {
    return { isValid: false, error: 'Height must be a positive number' }
  }
  
  const limits = {
    cm: { min: 100, max: 250 },
    in: { min: 39, max: 98 },
    ft: { min: 3.3, max: 8.2 }
  }
  
  const { min, max } = limits[unit] || limits.cm
  
  if (numHeight < min || numHeight > max) {
    return { 
      isValid: false, 
      error: `Height must be between ${min} and ${max} ${unit}` 
    }
  }
  
  return { isValid: true }
}

export const validateCalories = (calories) => {
  const numCalories = parseInt(calories)
  
  if (isNaN(numCalories) || numCalories < 0) {
    return { isValid: false, error: 'Calories must be a non-negative number' }
  }
  
  if (numCalories > 10000) {
    return { isValid: false, error: 'Calories seem too high (max 10,000)' }
  }
  
  return { isValid: true }
}

export const validateMacros = (protein, carbs, fats) => {
  const errors = []
  
  const numProtein = parseFloat(protein)
  const numCarbs = parseFloat(carbs)
  const numFats = parseFloat(fats)
  
  if (isNaN(numProtein) || numProtein < 0) {
    errors.push('Protein must be a non-negative number')
  } else if (numProtein > 500) {
    errors.push('Protein value seems too high (max 500g)')
  }
  
  if (isNaN(numCarbs) || numCarbs < 0) {
    errors.push('Carbs must be a non-negative number')
  } else if (numCarbs > 1000) {
    errors.push('Carbs value seems too high (max 1000g)')
  }
  
  if (isNaN(numFats) || numFats < 0) {
    errors.push('Fats must be a non-negative number')
  } else if (numFats > 300) {
    errors.push('Fats value seems too high (max 300g)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateWorkoutDuration = (duration) => {
  const numDuration = parseInt(duration)
  
  if (isNaN(numDuration) || numDuration <= 0) {
    return { isValid: false, error: 'Duration must be a positive number' }
  }
  
  if (numDuration > 480) { // 8 hours
    return { isValid: false, error: 'Duration seems too long (max 8 hours)' }
  }
  
  return { isValid: true }
}

export const validateSleepHours = (hours) => {
  const numHours = parseFloat(hours)
  
  if (isNaN(numHours) || numHours < 0) {
    return { isValid: false, error: 'Sleep hours must be a non-negative number' }
  }
  
  if (numHours > 24) {
    return { isValid: false, error: 'Sleep hours cannot exceed 24' }
  }
  
  return { isValid: true }
}

export const validateStressLevel = (level) => {
  const numLevel = parseInt(level)
  
  if (isNaN(numLevel) || numLevel < 1 || numLevel > 10) {
    return { isValid: false, error: 'Stress level must be between 1 and 10' }
  }
  
  return { isValid: true }
}

export const validateMeasurement = (value, type) => {
  const numValue = parseFloat(value)
  
  if (isNaN(numValue) || numValue <= 0) {
    return { isValid: false, error: 'Measurement must be a positive number' }
  }
  
  const limits = {
    weight: { min: 20, max: 300, unit: 'kg' },
    bodyFat: { min: 3, max: 50, unit: '%' },
    muscleMass: { min: 10, max: 150, unit: 'kg' },
    waist: { min: 20, max: 150, unit: 'cm' },
    chest: { min: 60, max: 200, unit: 'cm' },
    arms: { min: 15, max: 60, unit: 'cm' },
    thighs: { min: 30, max: 100, unit: 'cm' }
  }
  
  const limit = limits[type]
  if (!limit) {
    return { isValid: true } // Unknown type, allow any positive number
  }
  
  if (numValue < limit.min || numValue > limit.max) {
    return { 
      isValid: false, 
      error: `${type} must be between ${limit.min} and ${limit.max} ${limit.unit}` 
    }
  }
  
  return { isValid: true }
}

export const validateDate = (date) => {
  const dateObj = new Date(date)
  const now = new Date()
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date format' }
  }
  
  if (dateObj > now) {
    return { isValid: false, error: 'Date cannot be in the future' }
  }
  
  // Don't allow dates more than 10 years in the past
  const tenYearsAgo = new Date()
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
  
  if (dateObj < tenYearsAgo) {
    return { isValid: false, error: 'Date cannot be more than 10 years ago' }
  }
  
  return { isValid: true }
}

export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  return { isValid: true }
}

export const validateMealName = (name) => {
  const trimmed = name.trim()
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Meal name is required' }
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Meal name must be less than 100 characters' }
  }
  
  return { isValid: true }
}

export const validateWorkoutName = (name) => {
  const trimmed = name.trim()
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Workout name is required' }
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Workout name must be less than 100 characters' }
  }
  
  return { isValid: true }
}

export const validateNoteContent = (content) => {
  const trimmed = content.trim()
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Note content is required' }
  }
  
  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Note must be less than 1000 characters' }
  }
  
  return { isValid: true }
}