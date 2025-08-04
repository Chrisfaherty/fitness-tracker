export interface SleepEntry {
  id: string
  date: string // YYYY-MM-DD format
  bedtime: string // HH:MM format
  wakeTime: string // HH:MM format
  duration: {
    hours: number
    minutes: number
    totalMinutes: number
  }
  quality: SleepQuality
  sleepScore: number // Calculated score 0-100
  notes?: string
  createdAt: string
  updatedAt: string
}

export type SleepQuality = 1 | 2 | 3 | 4 | 5

export interface SleepQualityOption {
  value: SleepQuality
  label: string
  emoji: string
  description: string
}

export interface SleepStatistics {
  averageDuration: number // in minutes
  averageQuality: number
  averageScore: number
  totalEntries: number
  consistency: number // How consistent sleep schedule is (0-100)
  trend: 'improving' | 'declining' | 'stable'
}

export interface WeeklySleepSummary {
  weekStart: string // Monday of the week
  weekEnd: string
  entries: SleepEntry[]
  statistics: SleepStatistics
  dailyAverages: {
    [day: string]: {
      averageBedtime: string
      averageWakeTime: string
      averageDuration: number
      averageQuality: number
    }
  }
}

export interface SleepGoals {
  targetDuration: number // in minutes (default: 8 hours = 480 minutes)
  targetBedtime: string // HH:MM format
  targetWakeTime: string // HH:MM format
  targetQuality: SleepQuality // minimum desired quality
}

export interface SleepFormData {
  bedtime: string
  wakeTime: string
  quality: SleepQuality
  notes: string
}

export interface SleepValidationResult {
  isValid: boolean
  errors: {
    bedtime?: string
    wakeTime?: string
    quality?: string
    duration?: string
  }
}

// Sleep score calculation factors
export interface SleepScoreFactors {
  duration: number // Weight: 40%
  quality: number // Weight: 30%
  consistency: number // Weight: 20%
  timing: number // Weight: 10%
}

export interface SleepTrend {
  period: 'week' | 'month' | 'quarter'
  data: {
    date: string
    duration: number
    quality: number
    score: number
  }[]
  trend: {
    duration: 'up' | 'down' | 'stable'
    quality: 'up' | 'down' | 'stable'
    score: 'up' | 'down' | 'stable'
  }
}