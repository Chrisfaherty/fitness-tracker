/**
 * Trainer Report Service
 * Generates comprehensive weekly reports for trainers with client data
 */

import useFitnessStore from '../store/fitnessStore.js'
import { analyticsService } from './analyticsService.js'

export class TrainerReportService {
  constructor() {
    this.reportCache = new Map()
  }

  /**
   * Initialize the trainer report service
   */
  async initialize() {
    console.log('📊 Initializing Trainer Report Service')
    return true
  }

  /**
   * Generate comprehensive weekly summary report
   */
  async generateWeeklySummary(startDate, endDate, clientId = null) {
    const cacheKey = `${startDate}-${endDate}-${clientId || 'current'}`
    
    if (this.reportCache.has(cacheKey)) {
      console.log('📄 Returning cached weekly report')
      return this.reportCache.get(cacheKey)
    }

    console.log('📊 Generating weekly summary report...')
    
    const fitnessData = useFitnessStore.getState()
    const weeklyData = this.getWeeklyData(fitnessData, startDate, endDate)
    
    const report = {
      reportId: this.generateReportId(),
      generatedAt: new Date().toISOString(),
      period: {
        startDate,
        endDate,
        weekNumber: this.getWeekNumber(new Date(startDate)),
        year: new Date(startDate).getFullYear()
      },
      client: {
        id: clientId || 'current-user',
        name: fitnessData.user.name || 'Anonymous User',
        age: fitnessData.user.age,
        currentWeight: this.getCurrentWeight(fitnessData.body.measurements.weight),
        goalWeight: fitnessData.user.goalWeight,
        activityLevel: fitnessData.user.activityLevel
      },
      summary: {
        macroAdherence: this.calculateMacroAdherence(weeklyData.nutrition),
        weightTrends: this.analyzeWeightTrends(weeklyData.body),
        sleepQuality: this.analyzeSleepPatterns(weeklyData.wellness),
        energyStressCorrelation: this.calculateEnergyStressCorrelation(weeklyData.wellness),
        trainingPerformance: this.analyzeTrainingPerformance(weeklyData.activity),
        goalProgress: this.calculateGoalProgress(fitnessData, weeklyData)
      },
      detailed: {
        dailyBreakdown: this.generateDailyBreakdown(weeklyData),
        nutritionAnalysis: this.generateNutritionAnalysis(weeklyData.nutrition),
        activityAnalysis: this.generateActivityAnalysis(weeklyData.activity),
        wellnessAnalysis: this.generateWellnessAnalysis(weeklyData.wellness),
        complianceMetrics: this.calculateComplianceMetrics(weeklyData)
      },
      recommendations: this.generateTrainerRecommendations(weeklyData, fitnessData),
      charts: this.generateChartData(weeklyData)
    }

    this.reportCache.set(cacheKey, report)
    console.log('✅ Weekly summary report generated')
    
    return report
  }

  /**
   * Extract weekly data from fitness store
   */
  getWeeklyData(fitnessData, startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return {
      nutrition: this.filterDataByDateRange(fitnessData.nutrition, start, end),
      activity: this.filterDataByDateRange(fitnessData.activity, start, end),
      wellness: this.filterDataByDateRange(fitnessData.wellness, start, end),
      body: this.filterDataByDateRange(fitnessData.body, start, end)
    }
  }

  /**
   * Filter data by date range
   */
  filterDataByDateRange(data, startDate, endDate) {
    const filteredData = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        filteredData[key] = value.filter(item => {
          const itemDate = new Date(item.date || item.timestamp || item.createdAt)
          return itemDate >= startDate && itemDate <= endDate
        })
      } else if (key === 'measurements' && typeof value === 'object') {
        filteredData[key] = {}
        for (const [measurementType, measurements] of Object.entries(value)) {
          filteredData[key][measurementType] = measurements.filter(measurement => {
            const measurementDate = new Date(measurement.date)
            return measurementDate >= startDate && measurementDate <= endDate
          })
        }
      } else {
        filteredData[key] = value
      }
    }
    
    return filteredData
  }

  /**
   * Calculate macro adherence percentages
   */
  calculateMacroAdherence(nutritionData) {
    if (!nutritionData.meals || nutritionData.meals.length === 0) {
      return {
        available: false,
        message: 'No nutrition data available for this period'
      }
    }

    const totalCaloriesTarget = 2000 // Should come from user goals
    const proteinTarget = 150 // Should come from user goals
    const carbsTarget = 250 // Should come from user goals
    const fatTarget = 67 // Should come from user goals

    const weeklyTotals = nutritionData.meals.reduce((totals, meal) => {
      totals.calories += meal.calories || 0
      totals.protein += meal.protein || 0
      totals.carbs += meal.carbs || 0
      totals.fats += meal.fats || 0
      return totals
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 })

    const daysInPeriod = 7
    const weeklyTargets = {
      calories: totalCaloriesTarget * daysInPeriod,
      protein: proteinTarget * daysInPeriod,
      carbs: carbsTarget * daysInPeriod,
      fats: fatTarget * daysInPeriod
    }

    return {
      available: true,
      adherence: {
        calories: Math.min(100, (weeklyTotals.calories / weeklyTargets.calories) * 100),
        protein: Math.min(100, (weeklyTotals.protein / weeklyTargets.protein) * 100),
        carbs: Math.min(100, (weeklyTotals.carbs / weeklyTargets.carbs) * 100),
        fats: Math.min(100, (weeklyTotals.fats / weeklyTargets.fats) * 100)
      },
      totals: weeklyTotals,
      targets: weeklyTargets,
      averageDaily: {
        calories: weeklyTotals.calories / daysInPeriod,
        protein: weeklyTotals.protein / daysInPeriod,
        carbs: weeklyTotals.carbs / daysInPeriod,
        fats: weeklyTotals.fats / daysInPeriod
      },
      compliance: {
        excellent: Object.values({
          calories: weeklyTotals.calories / weeklyTargets.calories,
          protein: weeklyTotals.protein / weeklyTargets.protein,
          carbs: weeklyTotals.carbs / weeklyTargets.carbs,
          fats: weeklyTotals.fats / weeklyTargets.fats
        }).filter(ratio => ratio >= 0.9 && ratio <= 1.1).length,
        total: 4
      }
    }
  }

  /**
   * Analyze weight trends and measurements
   */
  analyzeWeightTrends(bodyData) {
    if (!bodyData.measurements?.weight || bodyData.measurements.weight.length === 0) {
      return {
        available: false,
        message: 'No weight measurements available for this period'
      }
    }

    const weights = bodyData.measurements.weight.sort((a, b) => new Date(a.date) - new Date(b.date))
    const startWeight = weights[0].value
    const endWeight = weights[weights.length - 1].value
    const weightChange = endWeight - startWeight
    const weightChangePercent = (weightChange / startWeight) * 100

    return {
      available: true,
      startWeight,
      endWeight,
      weightChange,
      weightChangePercent,
      trend: weightChange > 0.5 ? 'increasing' : weightChange < -0.5 ? 'decreasing' : 'stable',
      measurements: weights,
      otherMeasurements: {
        bodyFat: bodyData.measurements.bodyFat || [],
        muscleMass: bodyData.measurements.muscleMass || [],
        waist: bodyData.measurements.waist || [],
        chest: bodyData.measurements.chest || [],
        arms: bodyData.measurements.arms || [],
        thighs: bodyData.measurements.thighs || []
      }
    }
  }

  /**
   * Analyze sleep quality patterns
   */
  analyzeSleepPatterns(wellnessData) {
    if (!wellnessData.sleepEntries || wellnessData.sleepEntries.length === 0) {
      return {
        available: false,
        message: 'No sleep data available for this period'
      }
    }

    const sleepEntries = wellnessData.sleepEntries
    const totalSleep = sleepEntries.reduce((total, entry) => total + (entry.duration || 0), 0)
    const averageSleep = totalSleep / sleepEntries.length
    
    const qualityScores = sleepEntries
      .filter(entry => entry.quality !== undefined)
      .map(entry => this.convertQualityToScore(entry.quality))
    
    const averageQuality = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0

    return {
      available: true,
      averageHours: averageSleep / 60, // Convert minutes to hours
      averageQuality,
      qualityDistribution: this.calculateQualityDistribution(sleepEntries),
      sleepConsistency: this.calculateSleepConsistency(sleepEntries),
      recommendations: this.generateSleepRecommendations(averageSleep / 60, averageQuality),
      entries: sleepEntries
    }
  }

  /**
   * Calculate energy/stress correlation
   */
  calculateEnergyStressCorrelation(wellnessData) {
    if (!wellnessData.sleepEntries || wellnessData.sleepEntries.length < 3) {
      return {
        available: false,
        message: 'Insufficient data for correlation analysis'
      }
    }

    const entries = wellnessData.sleepEntries.filter(entry => 
      entry.energyLevel !== undefined && entry.stressLevel !== undefined
    )

    if (entries.length < 3) {
      return {
        available: false,
        message: 'Insufficient energy/stress data for correlation analysis'
      }
    }

    const correlation = this.calculateCorrelation(
      entries.map(e => e.energyLevel),
      entries.map(e => e.stressLevel)
    )

    return {
      available: true,
      correlation,
      strength: Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.3 ? 'moderate' : 'weak',
      direction: correlation > 0 ? 'positive' : 'negative',
      averageEnergy: entries.reduce((sum, e) => sum + e.energyLevel, 0) / entries.length,
      averageStress: entries.reduce((sum, e) => sum + e.stressLevel, 0) / entries.length,
      dataPoints: entries.map(e => ({
        date: e.date,
        energy: e.energyLevel,
        stress: e.stressLevel
      }))
    }
  }

  /**
   * Analyze training performance metrics
   */
  analyzeTrainingPerformance(activityData) {
    if (!activityData.workouts || activityData.workouts.length === 0) {
      return {
        available: false,
        message: 'No workout data available for this period'
      }
    }

    const workouts = activityData.workouts
    const totalWorkouts = workouts.length
    const totalDuration = workouts.reduce((total, workout) => total + (workout.duration || 0), 0)
    const averageDuration = totalDuration / totalWorkouts
    const totalCaloriesBurned = workouts.reduce((total, workout) => total + (workout.caloriesBurned || 0), 0)

    return {
      available: true,
      totalWorkouts,
      averageDuration: averageDuration / 60, // Convert to hours
      totalCaloriesBurned,
      averageCaloriesPerWorkout: totalCaloriesBurned / totalWorkouts,
      workoutTypes: this.analyzeWorkoutTypes(workouts),
      intensityDistribution: this.analyzeWorkoutIntensity(workouts),
      consistencyScore: this.calculateWorkoutConsistency(workouts),
      progressTrend: this.calculateProgressTrend(workouts)
    }
  }

  /**
   * Calculate goal progress
   */
  calculateGoalProgress(fitnessData, weeklyData) {
    const goals = fitnessData.user.goals || []
    
    if (goals.length === 0) {
      return {
        available: false,
        message: 'No goals set'
      }
    }

    return {
      available: true,
      goals: goals.map(goal => ({
        ...goal,
        progress: this.calculateIndividualGoalProgress(goal, weeklyData, fitnessData),
        onTrack: this.isGoalOnTrack(goal, weeklyData, fitnessData)
      })),
      overallProgress: this.calculateOverallGoalProgress(goals, weeklyData, fitnessData)
    }
  }

  /**
   * Generate daily breakdown
   */
  generateDailyBreakdown(weeklyData) {
    const days = this.getDaysInPeriod(weeklyData)
    
    return days.map(day => ({
      date: day,
      nutrition: this.getDayNutrition(weeklyData.nutrition, day),
      activity: this.getDayActivity(weeklyData.activity, day),
      wellness: this.getDayWellness(weeklyData.wellness, day),
      compliance: this.getDayCompliance(weeklyData, day)
    }))
  }

  /**
   * Generate trainer recommendations
   */
  generateTrainerRecommendations(weeklyData, fitnessData) {
    const recommendations = []

    // Nutrition recommendations
    const macroAdherence = this.calculateMacroAdherence(weeklyData.nutrition)
    if (macroAdherence.available) {
      if (macroAdherence.adherence.protein < 80) {
        recommendations.push({
          category: 'nutrition',
          priority: 'high',
          title: 'Increase Protein Intake',
          description: `Client is only achieving ${macroAdherence.adherence.protein.toFixed(1)}% of protein targets. Consider protein supplementation or meal planning.`,
          action: 'Recommend protein-rich foods and timing strategies'
        })
      }
    }

    // Sleep recommendations
    const sleepAnalysis = this.analyzeSleepPatterns(weeklyData.wellness)
    if (sleepAnalysis.available && sleepAnalysis.averageHours < 7) {
      recommendations.push({
        category: 'recovery',
        priority: 'high',
        title: 'Improve Sleep Duration',
        description: `Average sleep is ${sleepAnalysis.averageHours.toFixed(1)} hours. Target 7-9 hours for optimal recovery.`,
        action: 'Discuss sleep hygiene and bedtime routine'
      })
    }

    // Weight trend recommendations
    const weightTrends = this.analyzeWeightTrends(weeklyData.body)
    if (weightTrends.available) {
      const goalWeight = fitnessData.user.goalWeight
      const currentWeight = weightTrends.endWeight
      
      if (goalWeight && Math.abs(currentWeight - goalWeight) > 2) {
        recommendations.push({
          category: 'body_composition',
          priority: 'medium',
          title: 'Adjust Weight Goals',
          description: `Current weight trend ${weightTrends.trend}. ${weightTrends.weightChange > 0 ? 'Gained' : 'Lost'} ${Math.abs(weightTrends.weightChange).toFixed(1)} lbs this week.`,
          action: goalWeight > currentWeight ? 'Consider caloric surplus strategies' : 'Review caloric deficit approach'
        })
      }
    }

    return recommendations
  }

  /**
   * Generate chart data for visualizations
   */
  generateChartData(weeklyData) {
    return {
      macroTrends: this.generateMacroTrendsChart(weeklyData.nutrition),
      weightTrends: this.generateWeightTrendsChart(weeklyData.body),
      sleepPatterns: this.generateSleepPatternsChart(weeklyData.wellness),
      energyStress: this.generateEnergyStressChart(weeklyData.wellness),
      workoutIntensity: this.generateWorkoutIntensityChart(weeklyData.activity),
      complianceRadar: this.generateComplianceRadarChart(weeklyData)
    }
  }

  // Helper methods for calculations and analysis

  getCurrentWeight(weightMeasurements) {
    if (!weightMeasurements || weightMeasurements.length === 0) return null
    return weightMeasurements.sort((a, b) => new Date(b.date) - new Date(a.date))[0].value
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  convertQualityToScore(quality) {
    const qualityMap = {
      'excellent': 5,
      'good': 4,
      'fair': 3,
      'poor': 2,
      'very_poor': 1
    }
    return qualityMap[quality] || 3
  }

  calculateQualityDistribution(sleepEntries) {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0, very_poor: 0 }
    sleepEntries.forEach(entry => {
      if (entry.quality && distribution.hasOwnProperty(entry.quality)) {
        distribution[entry.quality]++
      }
    })
    return distribution
  }

  calculateSleepConsistency(sleepEntries) {
    if (sleepEntries.length < 2) return 0
    
    const bedtimes = sleepEntries.map(e => e.bedtime).filter(Boolean)
    const waketimes = sleepEntries.map(e => e.wakeTime).filter(Boolean)
    
    if (bedtimes.length < 2 || waketimes.length < 2) return 0
    
    const bedtimeVariance = this.calculateTimeVariance(bedtimes)
    const waketimeVariance = this.calculateTimeVariance(waketimes)
    
    return Math.max(0, 100 - ((bedtimeVariance + waketimeVariance) / 2))
  }

  calculateCorrelation(x, y) {
    const n = x.length
    if (n === 0) return 0
    
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  generateReportId() {
    return `trainer_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Chart generation methods
  generateMacroTrendsChart(nutritionData) {
    return {
      type: 'line',
      data: [], // Implementation would generate actual chart data
      options: {
        title: 'Macro Adherence Trends',
        yAxis: 'Percentage (%)',
        xAxis: 'Date'
      }
    }
  }

  generateWeightTrendsChart(bodyData) {
    return {
      type: 'line',
      data: [], // Implementation would generate actual chart data
      options: {
        title: 'Weight Trends',
        yAxis: 'Weight (lbs)',
        xAxis: 'Date'
      }
    }
  }

  generateSleepPatternsChart(wellnessData) {
    return {
      type: 'bar',
      data: [], // Implementation would generate actual chart data
      options: {
        title: 'Sleep Quality Distribution',
        yAxis: 'Hours',
        xAxis: 'Date'
      }
    }
  }

  generateEnergyStressChart(wellnessData) {
    return {
      type: 'scatter',
      data: [], // Implementation would generate actual chart data
      options: {
        title: 'Energy vs Stress Levels',
        yAxis: 'Energy Level',
        xAxis: 'Stress Level'
      }
    }
  }

  generateWorkoutIntensityChart(activityData) {
    return {
      type: 'pie',
      data: [], // Implementation would generate actual chart data
      options: {
        title: 'Workout Intensity Distribution'
      }
    }
  }

  generateComplianceRadarChart(weeklyData) {
    return {
      type: 'radar',
      data: [], // Implementation would generate actual chart data
      options: {
        title: 'Weekly Compliance Overview'
      }
    }
  }
}

// Export singleton instance
export const trainerReportService = new TrainerReportService()
export default trainerReportService