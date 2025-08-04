// BMI and body composition calculations
export const calculateBMI = (weight, height) => {
  // weight in kg, height in cm
  const heightInMeters = height / 100
  return weight / (heightInMeters * heightInMeters)
}

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-500' }
  if (bmi < 25) return { category: 'Normal weight', color: 'text-green-500' }
  if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-500' }
  return { category: 'Obese', color: 'text-red-500' }
}

// Calorie and nutrition calculations
export const calculateBMR = (weight, height, age, gender) => {
  // Mifflin-St Jeor Equation
  // weight in kg, height in cm, age in years
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

export const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  }
  
  return bmr * (multipliers[activityLevel] || 1.55)
}

export const calculateCaloriesForGoal = (tdee, goal, rate = 0.5) => {
  // rate in kg per week (0.5 kg = 1 lb)
  const caloriesPerKg = 7700 // approximately 7700 calories per kg of fat
  const dailyDeficit = (rate * caloriesPerKg) / 7
  
  switch (goal) {
    case 'lose':
      return Math.round(tdee - dailyDeficit)
    case 'gain':
      return Math.round(tdee + dailyDeficit)
    case 'maintain':
    default:
      return Math.round(tdee)
  }
}

// Macro calculations
export const calculateMacros = (calories, macroRatio = { protein: 0.3, carbs: 0.4, fats: 0.3 }) => {
  return {
    protein: Math.round((calories * macroRatio.protein) / 4), // 4 calories per gram
    carbs: Math.round((calories * macroRatio.carbs) / 4), // 4 calories per gram
    fats: Math.round((calories * macroRatio.fats) / 9) // 9 calories per gram
  }
}

// Exercise calculations
export const calculateCaloriesBurned = (met, weightKg, durationMinutes) => {
  // MET (Metabolic Equivalent of Task) calculation
  return Math.round((met * weightKg * durationMinutes) / 60)
}

export const getMETValue = (activity) => {
  // Common MET values for activities
  const metValues = {
    'walking-slow': 2.5,
    'walking-moderate': 3.5,
    'walking-fast': 4.5,
    'running-6mph': 9.8,
    'running-7mph': 11.0,
    'running-8mph': 12.5,
    'cycling-moderate': 6.8,
    'cycling-vigorous': 10.0,
    'swimming-moderate': 5.8,
    'swimming-vigorous': 9.8,
    'weightlifting': 6.0,
    'yoga': 2.5,
    'pilates': 3.0,
    'tennis': 7.3,
    'basketball': 8.0,
    'football': 8.0,
    'dancing': 4.8
  }
  
  return metValues[activity] || 5.0 // default moderate activity
}

// Progress calculations
export const calculateWeightLossRate = (measurements) => {
  if (measurements.length < 2) return null
  
  const latest = measurements[measurements.length - 1]
  const previous = measurements[measurements.length - 2]
  
  const weightDiff = latest.value - previous.value
  const timeDiff = (new Date(latest.date) - new Date(previous.date)) / (1000 * 60 * 60 * 24) // days
  
  if (timeDiff === 0) return null
  
  const ratePerWeek = (weightDiff / timeDiff) * 7
  
  return {
    change: weightDiff,
    timeSpan: timeDiff,
    ratePerWeek: Math.round(ratePerWeek * 100) / 100
  }
}

export const calculateTrend = (data, days = 7) => {
  if (data.length < 2) return null
  
  const recentData = data.slice(-days)
  if (recentData.length < 2) return null
  
  const sum = recentData.reduce((acc, item) => acc + item.value, 0)
  const average = sum / recentData.length
  
  const first = recentData[0].value
  const last = recentData[recentData.length - 1].value
  const change = last - first
  const percentChange = (change / first) * 100
  
  return {
    average: Math.round(average * 100) / 100,
    change: Math.round(change * 100) / 100,
    percentChange: Math.round(percentChange * 100) / 100,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  }
}

// Hydration calculations
export const calculateWaterNeeds = (weightKg, activityMinutes = 0, temperature = 'normal') => {
  // Base water need: 35ml per kg of body weight
  let baseWater = weightKg * 35
  
  // Add for activity: 500-750ml per hour of exercise
  const activityWater = (activityMinutes / 60) * 625
  
  // Add for temperature
  const temperatureMultiplier = temperature === 'hot' ? 1.2 : 1.0
  
  return Math.round((baseWater + activityWater) * temperatureMultiplier)
}

// Sleep calculations
export const calculateSleepQuality = (hoursSlept, targetHours = 8) => {
  const efficiency = Math.min(hoursSlept / targetHours, 1)
  
  if (efficiency >= 0.9) return { quality: 'excellent', score: 100 }
  if (efficiency >= 0.8) return { quality: 'good', score: 80 }
  if (efficiency >= 0.7) return { quality: 'fair', score: 60 }
  return { quality: 'poor', score: 40 }
}

// Unit conversions
export const convertWeight = (weight, fromUnit, toUnit) => {
  const toKg = {
    kg: weight,
    lb: weight * 0.453592,
    stone: weight * 6.35029
  }
  
  const fromKg = {
    kg: toKg[fromUnit],
    lb: toKg[fromUnit] / 0.453592,
    stone: toKg[fromUnit] / 6.35029
  }
  
  return Math.round(fromKg[toUnit] * 100) / 100
}

export const convertHeight = (height, fromUnit, toUnit) => {
  const toCm = {
    cm: height,
    in: height * 2.54,
    ft: height * 30.48
  }
  
  const fromCm = {
    cm: toCm[fromUnit],
    in: toCm[fromUnit] / 2.54,
    ft: toCm[fromUnit] / 30.48
  }
  
  return Math.round(fromCm[toUnit] * 100) / 100
}