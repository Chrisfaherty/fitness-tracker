import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useFitnessStore = create(
  persist(
    (set, get) => ({
      user: {
        name: '',
        age: 0,
        height: 0,
        weight: 0,
        goalWeight: 0,
        activityLevel: 'moderate',
        goals: []
      },
      
      nutrition: {
        dailyCalories: 0,
        dailyProtein: 0,
        dailyCarbs: 0,
        dailyFats: 0,
        water: 0,
        meals: [],
        foods: []
      },
      
      activity: {
        dailySteps: 0,
        activeMinutes: 0,
        caloriesBurned: 0,
        workouts: [],
        exercises: []
      },
      
      wellness: {
        sleepHours: 0,
        sleepQuality: 'good',
        stressLevel: 3,
        mood: 'neutral',
        notes: [],
        sleepEntries: []
      },
      
      body: {
        measurements: {
          weight: [],
          bodyFat: [],
          muscleMass: [],
          waist: [],
          chest: [],
          arms: [],
          thighs: []
        },
        photos: []
      },
      
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      addMeal: (meal) => set((state) => ({
        nutrition: {
          ...state.nutrition,
          meals: [...state.nutrition.meals, { ...meal, id: Date.now() }]
        }
      })),
      
      updateDailyNutrition: (nutrition) => set((state) => ({
        nutrition: {
          ...state.nutrition,
          dailyCalories: state.nutrition.dailyCalories + (nutrition.calories || 0),
          dailyProtein: state.nutrition.dailyProtein + (nutrition.protein || 0),
          dailyCarbs: state.nutrition.dailyCarbs + (nutrition.carbs || 0),
          dailyFats: state.nutrition.dailyFats + (nutrition.fats || 0)
        }
      })),
      
      addWorkout: (workout) => set((state) => ({
        activity: {
          ...state.activity,
          workouts: [...state.activity.workouts, { ...workout, id: Date.now() }]
        }
      })),
      
      updateActivity: (activityData) => set((state) => ({
        activity: { ...state.activity, ...activityData }
      })),
      
      updateWellness: (wellnessData) => set((state) => ({
        wellness: { ...state.wellness, ...wellnessData }
      })),
      
      addMeasurement: (type, measurement) => set((state) => ({
        body: {
          ...state.body,
          measurements: {
            ...state.body.measurements,
            [type]: [...state.body.measurements[type], {
              value: measurement.value,
              date: measurement.date || new Date().toISOString(),
              id: Date.now()
            }]
          }
        }
      })),
      
      addPhoto: (photo) => set((state) => ({
        body: {
          ...state.body,
          photos: [...state.body.photos, { ...photo, id: Date.now() }]
        }
      })),

      addSleepEntry: (sleepEntry) => set((state) => ({
        wellness: {
          ...state.wellness,
          sleepEntries: [...state.wellness.sleepEntries, sleepEntry]
        }
      })),

      updateSleepEntry: (id, updates) => set((state) => ({
        wellness: {
          ...state.wellness,
          sleepEntries: state.wellness.sleepEntries.map(entry =>
            entry.id === id ? { ...entry, ...updates } : entry
          )
        }
      })),

      deleteSleepEntry: (id) => set((state) => ({
        wellness: {
          ...state.wellness,
          sleepEntries: state.wellness.sleepEntries.filter(entry => entry.id !== id)
        }
      })),

      setSleepEntries: (sleepEntries) => set((state) => ({
        wellness: {
          ...state.wellness,
          sleepEntries
        }
      })),
      
      resetDailyData: () => set((state) => ({
        nutrition: {
          ...state.nutrition,
          dailyCalories: 0,
          dailyProtein: 0,
          dailyCarbs: 0,
          dailyFats: 0,
          water: 0
        },
        activity: {
          ...state.activity,
          dailySteps: 0,
          activeMinutes: 0,
          caloriesBurned: 0
        }
      }))
    }),
    {
      name: 'fitness-tracker-storage',
      getStorage: () => localStorage,
    }
  )
)

export default useFitnessStore