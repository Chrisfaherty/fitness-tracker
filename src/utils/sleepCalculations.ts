import { 
  SleepEntry, 
  SleepStatistics, 
  WeeklySleepSummary, 
  SleepScoreFactors,
  SleepGoals,
  SleepTrend
} from '../types/sleep'

/**
 * Advanced sleep score calculation based on multiple factors
 * @param entry - Sleep entry to calculate score for
 * @param recentEntries - Recent entries for consistency calculation
 * @param goals - User's sleep goals
 * @returns Sleep score (0-100)
 */
export const calculateSleepScore = (
  entry: SleepEntry,
  recentEntries: SleepEntry[] = [],
  goals?: SleepGoals
): number => {
  const factors = calculateSleepScoreFactors(entry, recentEntries, goals)
  
  // Weighted score calculation
  const weights = {
    duration: 0.4,   // 40% - Most important
    quality: 0.3,    // 30% - User's subjective rating
    consistency: 0.2, // 20% - How consistent sleep schedule is
    timing: 0.1      // 10% - How close to optimal bedtime
  }

  const totalScore = 
    factors.duration * weights.duration +
    factors.quality * weights.quality +
    factors.consistency * weights.consistency +
    factors.timing * weights.timing

  return Math.round(Math.max(0, Math.min(100, totalScore)))
}

/**
 * Calculate individual factors for sleep score
 */
export const calculateSleepScoreFactors = (
  entry: SleepEntry,
  recentEntries: SleepEntry[] = [],
  goals?: SleepGoals
): SleepScoreFactors => {
  const targetDuration = goals?.targetDuration || 480 // 8 hours default
  const targetBedtime = goals?.targetBedtime || '23:00'

  return {
    duration: calculateDurationScore(entry.duration.totalMinutes, targetDuration),
    quality: calculateQualityScore(entry.quality),
    consistency: calculateConsistencyScore(entry, recentEntries),
    timing: calculateTimingScore(entry.bedtime, targetBedtime)
  }
}

/**
 * Calculate duration score (0-100)
 * Optimal sleep: 7-9 hours, with peak at 8 hours
 */
export const calculateDurationScore = (
  actualMinutes: number,
  targetMinutes: number = 480
): number => {
  const actualHours = actualMinutes / 60
  
  // Optimal range: 7-9 hours
  const optimalMin = 7
  const optimalMax = 9
  const targetHours = targetMinutes / 60

  // Perfect score for hitting target within optimal range
  if (actualHours >= optimalMin && actualHours <= optimalMax) {
    // Score based on how close to target
    const deviationFromTarget = Math.abs(actualHours - targetHours)
    if (deviationFromTarget <= 0.5) return 100
    if (deviationFromTarget <= 1) return 90
    return 80
  }

  // Penalties for being outside optimal range
  if (actualHours < optimalMin) {
    // Sleep deprivation penalty
    const deficit = optimalMin - actualHours
    if (deficit <= 1) return 60
    if (deficit <= 2) return 40
    if (deficit <= 3) return 20
    return 10
  } else {
    // Oversleep penalty (less severe)
    const excess = actualHours - optimalMax
    if (excess <= 1) return 70
    if (excess <= 2) return 50
    if (excess <= 3) return 30
    return 15
  }
}

/**
 * Calculate quality score based on user rating (1-5)
 */
export const calculateQualityScore = (quality: number): number => {
  // Convert 1-5 scale to 0-100 scale
  const scoreMap = {
    1: 10,  // Very poor
    2: 30,  // Poor
    3: 60,  // Fair
    4: 80,  // Good
    5: 100  // Excellent
  }
  
  return scoreMap[quality as keyof typeof scoreMap] || 60
}

/**
 * Calculate consistency score based on recent sleep patterns
 */
export const calculateConsistencyScore = (
  entry: SleepEntry,
  recentEntries: SleepEntry[]
): number => {
  if (recentEntries.length < 3) return 50 // Not enough data

  const allEntries = [entry, ...recentEntries].slice(0, 7) // Last week
  
  // Calculate bedtime consistency
  const bedtimes = allEntries.map(e => timeToMinutes(e.bedtime))
  const bedtimeVariation = calculateTimeVariation(bedtimes)
  
  // Calculate wake time consistency
  const wakeTimes = allEntries.map(e => timeToMinutes(e.wakeTime))
  const wakeTimeVariation = calculateTimeVariation(wakeTimes)
  
  // Calculate duration consistency
  const durations = allEntries.map(e => e.duration.totalMinutes)
  const durationVariation = calculateVariation(durations)
  
  // Lower variation = higher consistency score
  const bedtimeScore = Math.max(0, 100 - bedtimeVariation * 2) // 30min variation = 40 point penalty
  const wakeTimeScore = Math.max(0, 100 - wakeTimeVariation * 2)
  const durationScore = Math.max(0, 100 - durationVariation / 6) // 60min variation = 10 point penalty
  
  return Math.round((bedtimeScore + wakeTimeScore + durationScore) / 3)
}

/**
 * Calculate timing score based on how close bedtime is to optimal
 */
export const calculateTimingScore = (
  actualBedtime: string,
  targetBedtime: string = '23:00'
): number => {
  const actualMinutes = timeToMinutes(actualBedtime)
  const targetMinutes = timeToMinutes(targetBedtime)
  
  // Calculate difference, handling day crossover
  let difference = Math.abs(actualMinutes - targetMinutes)
  if (difference > 12 * 60) {
    difference = 24 * 60 - difference // Handle crossing midnight
  }
  
  // Score based on how close to target
  if (difference <= 30) return 100      // Within 30 minutes
  if (difference <= 60) return 80       // Within 1 hour
  if (difference <= 120) return 60      // Within 2 hours
  if (difference <= 180) return 40      // Within 3 hours
  return 20                             // More than 3 hours off
}

/**
 * Calculate weekly sleep statistics
 */
export const calculateWeeklyStatistics = (entries: SleepEntry[]): SleepStatistics => {
  if (entries.length === 0) {
    return {
      averageDuration: 0,
      averageQuality: 0,
      averageScore: 0,
      totalEntries: 0,
      consistency: 0,
      trend: 'stable'
    }
  }

  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration.totalMinutes, 0)
  const totalQuality = entries.reduce((sum, entry) => sum + entry.quality, 0)
  const totalScore = entries.reduce((sum, entry) => sum + entry.sleepScore, 0)

  // Calculate consistency as inverse of variation
  const durations = entries.map(e => e.duration.totalMinutes)
  const qualities = entries.map(e => e.quality)
  const scores = entries.map(e => e.sleepScore)
  
  const durationVariation = calculateVariation(durations)
  const qualityVariation = calculateVariation(qualities)
  const scoreVariation = calculateVariation(scores)
  
  const consistency = Math.max(0, 100 - (durationVariation + qualityVariation * 20 + scoreVariation) / 3)

  // Calculate trend (comparing first half vs second half)
  const trend = calculateTrend(scores)

  return {
    averageDuration: Math.round(totalDuration / entries.length),
    averageQuality: Math.round((totalQuality / entries.length) * 10) / 10,
    averageScore: Math.round(totalScore / entries.length),
    totalEntries: entries.length,
    consistency: Math.round(consistency),
    trend
  }
}

/**
 * Generate weekly sleep summary
 */
export const generateWeeklySummary = (
  entries: SleepEntry[],
  weekStart: string
): WeeklySleepSummary => {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  
  const weekEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date)
    return entryDate >= new Date(weekStart) && entryDate <= weekEnd
  })

  const statistics = calculateWeeklyStatistics(weekEntries)
  
  // Calculate daily averages by day of week
  const dailyAverages: { [day: string]: any } = {}
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  dayNames.forEach((day, index) => {
    const dayEntries = weekEntries.filter(entry => 
      new Date(entry.date).getDay() === index
    )
    
    if (dayEntries.length > 0) {
      const avgDuration = dayEntries.reduce((sum, e) => sum + e.duration.totalMinutes, 0) / dayEntries.length
      const avgQuality = dayEntries.reduce((sum, e) => sum + e.quality, 0) / dayEntries.length
      const avgBedtime = calculateAverageTime(dayEntries.map(e => e.bedtime))
      const avgWakeTime = calculateAverageTime(dayEntries.map(e => e.wakeTime))
      
      dailyAverages[day] = {
        averageBedtime: avgBedtime,
        averageWakeTime: avgWakeTime,
        averageDuration: Math.round(avgDuration),
        averageQuality: Math.round(avgQuality * 10) / 10
      }
    }
  })

  return {
    weekStart,
    weekEnd: weekEnd.toISOString().split('T')[0],
    entries: weekEntries,
    statistics,
    dailyAverages
  }
}

/**
 * Calculate sleep trends over time
 */
export const calculateSleepTrends = (
  entries: SleepEntry[],
  period: 'week' | 'month' | 'quarter' = 'week'
): SleepTrend => {
  const sortedEntries = entries.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const data = sortedEntries.map(entry => ({
    date: entry.date,
    duration: entry.duration.totalMinutes,
    quality: entry.quality,
    score: entry.sleepScore
  }))

  // Calculate trends for each metric
  const durationTrend = calculateTrendDirection(data.map(d => d.duration))
  const qualityTrend = calculateTrendDirection(data.map(d => d.quality))
  const scoreTrend = calculateTrendDirection(data.map(d => d.score))

  return {
    period,
    data,
    trend: {
      duration: durationTrend,
      quality: qualityTrend,
      score: scoreTrend
    }
  }
}

// Helper functions

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight back to time string
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Calculate variation (standard deviation) in a set of numbers
 */
export const calculateVariation = (values: number[]): number => {
  if (values.length < 2) return 0
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Calculate time variation accounting for 24-hour wrap-around
 */
export const calculateTimeVariation = (timeMinutes: number[]): number => {
  if (timeMinutes.length < 2) return 0
  
  // Handle day boundary crossings
  const adjustedTimes = timeMinutes.map(time => {
    // If time is very early (like 2 AM), treat as next day for consistency calculation
    return time < 6 * 60 ? time + 24 * 60 : time
  })
  
  return calculateVariation(adjustedTimes)
}

/**
 * Calculate average time from array of time strings
 */
export const calculateAverageTime = (times: string[]): string => {
  if (times.length === 0) return '00:00'
  
  const minutesArray = times.map(timeToMinutes)
  const avgMinutes = minutesArray.reduce((sum, min) => sum + min, 0) / minutesArray.length
  
  return minutesToTime(Math.round(avgMinutes))
}

/**
 * Calculate trend direction from array of values
 */
export const calculateTrend = (values: number[]): 'improving' | 'declining' | 'stable' => {
  if (values.length < 4) return 'stable'
  
  const midpoint = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, midpoint)
  const secondHalf = values.slice(midpoint)
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
  
  const difference = secondAvg - firstAvg
  const threshold = Math.max(5, firstAvg * 0.1) // 10% or minimum 5 points
  
  if (difference > threshold) return 'improving'
  if (difference < -threshold) return 'declining'
  return 'stable'
}

/**
 * Calculate trend direction with different logic for different metrics
 */
export const calculateTrendDirection = (values: number[]): 'up' | 'down' | 'stable' => {
  const trend = calculateTrend(values)
  return trend === 'improving' ? 'up' : trend === 'declining' ? 'down' : 'stable'
}

/**
 * Format duration in minutes to human readable string
 */
export const formatSleepDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Get sleep quality description
 */
export const getSleepQualityDescription = (quality: number): string => {
  const descriptions = {
    1: 'Very Poor - Restless night, barely slept',
    2: 'Poor - Struggled to fall asleep or stay asleep',
    3: 'Fair - Some interruptions, okay rest',
    4: 'Good - Slept well, felt rested',
    5: 'Excellent - Perfect sleep, woke up refreshed'
  }
  
  return descriptions[quality as keyof typeof descriptions] || 'Unknown'
}

/**
 * Get sleep score interpretation
 */
export const getSleepScoreInterpretation = (score: number): {
  category: string
  description: string
  color: string
} => {
  if (score >= 90) {
    return {
      category: 'Excellent',
      description: 'Outstanding sleep quality',
      color: 'text-green-600'
    }
  } else if (score >= 80) {
    return {
      category: 'Good',
      description: 'Good sleep quality',
      color: 'text-blue-600'
    }
  } else if (score >= 70) {
    return {
      category: 'Fair',
      description: 'Room for improvement',
      color: 'text-yellow-600'
    }
  } else if (score >= 60) {
    return {
      category: 'Poor',
      description: 'Needs attention',
      color: 'text-orange-600'
    }
  } else {
    return {
      category: 'Very Poor',
      description: 'Significant improvement needed',
      color: 'text-red-600'
    }
  }
}