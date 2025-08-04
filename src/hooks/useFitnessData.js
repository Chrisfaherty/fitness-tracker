import { useState, useEffect } from 'react'
import useFitnessStore from '../store/fitnessStore'
import storageService from '../services/storage'

export const useFitnessData = () => {
  const store = useFitnessStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Sync data with IndexedDB
  useEffect(() => {
    const syncData = async () => {
      setIsLoading(true)
      try {
        // Load saved data from IndexedDB
        const savedMeals = await storageService.getAll('meals')
        const savedWorkouts = await storageService.getAll('workouts')
        const savedNotes = await storageService.getAll('wellnessNotes')
        
        // Update store with saved data
        savedMeals.forEach(meal => store.addMeal(meal))
        savedWorkouts.forEach(workout => store.addWorkout(workout))
        savedNotes.forEach(note => {
          store.updateWellness({ 
            notes: [...store.wellness.notes, note] 
          })
        })
      } catch (err) {
        setError('Failed to load saved data')
        console.error('Data sync error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    syncData()
  }, [])

  return {
    ...store,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}