import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import authService from '../services/auth/authService'

const useFitnessStore = create(
  persist(
    (set, get) => ({
      // Multi-user data structure: data[userId] = { nutrition, activity, wellness, body }
      data: {},
      currentUserId: null,
      
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
      
      // Initialize user data
      initializeUser: (userId) => {
        const state = get()
        if (!state.data[userId]) {
          set((state) => ({
            data: {
              ...state.data,
              [userId]: {
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
                }
              }
            },
            currentUserId: userId
          }))
        } else {
          set({ currentUserId: userId })
        }
      },

      // Get current user's data
      getCurrentUserData: () => {
        const state = get()
        const currentUser = authService.getCurrentUser()
        if (!currentUser) return null
        
        if (!state.data[currentUser.id]) {
          get().initializeUser(currentUser.id)
        }
        
        return {
          nutrition: state.data[currentUser.id]?.nutrition || state.nutrition,
          activity: state.data[currentUser.id]?.activity || state.activity,
          wellness: state.data[currentUser.id]?.wellness || state.wellness,
          body: state.data[currentUser.id]?.body || state.body
        }
      },

      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      addMeal: (meal) => {
        const currentUser = authService.getCurrentUser()
        if (!currentUser) {
          console.warn('⚠️ Cannot add meal: No user logged in')
          return
        }
        
        console.log('🍽️ Adding meal for user:', currentUser.email, 'Meal:', meal)
        
        set((state) => {
          const userData = state.data[currentUser.id] || {}
          const currentNutrition = userData.nutrition || state.nutrition
          const newMeal = { ...meal, id: Date.now(), userId: currentUser.id, timestamp: new Date().toISOString() }
          
          const newState = {
            data: {
              ...state.data,
              [currentUser.id]: {
                ...userData,
                nutrition: {
                  ...currentNutrition,
                  meals: [...currentNutrition.meals, newMeal]
                }
              }
            }
          }
          
          console.log('✅ Meal added to store. New meals count:', newState.data[currentUser.id].nutrition.meals.length)
          return newState
        })
      },
      
      updateDailyNutrition: (nutrition) => {
        const currentUser = authService.getCurrentUser()
        if (!currentUser) return
        
        set((state) => {
          const userData = state.data[currentUser.id] || {}
          const currentNutrition = userData.nutrition || state.nutrition
          
          return {
            data: {
              ...state.data,
              [currentUser.id]: {
                ...userData,
                nutrition: {
                  ...currentNutrition,
                  dailyCalories: currentNutrition.dailyCalories + (nutrition.calories || 0),
                  dailyProtein: currentNutrition.dailyProtein + (nutrition.protein || 0),
                  dailyCarbs: currentNutrition.dailyCarbs + (nutrition.carbs || 0),
                  dailyFats: currentNutrition.dailyFats + (nutrition.fats || 0)
                }
              }
            }
          }
        })
      },
      
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
      partialize: (state) => ({
        // Only persist the data that matters
        user: state.user,
        data: state.data,
        currentUserId: state.currentUserId,
        nutrition: state.nutrition,
        activity: state.activity,
        wellness: state.wellness,
        body: state.body
      })
    }
  )
)

export default useFitnessStore