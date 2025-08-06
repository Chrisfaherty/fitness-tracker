import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Copy, Trash2, Users, Utensils, Clock, Target } from 'lucide-react'
import FoodPlanModal from './FoodPlanModal'
import storageService from '../../services/storage'

const FoodPlanManager = ({ clients }) => {
  const [foodPlans, setFoodPlans] = useState([])
  const [filteredPlans, setFilteredPlans] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGoal, setFilterGoal] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFoodPlans()
  }, [])

  useEffect(() => {
    filterPlans()
  }, [foodPlans, searchTerm, filterGoal])

  const loadFoodPlans = async () => {
    try {
      setLoading(true)
      const plans = await storageService.getAll('foodPlans') || []
      
      // If no plans exist, create some default ones
      if (plans.length === 0) {
        const defaultPlans = createDefaultFoodPlans()
        for (const plan of defaultPlans) {
          await storageService.save('foodPlans', plan, plan.id)
        }
        setFoodPlans(defaultPlans)
      } else {
        setFoodPlans(plans)
      }
    } catch (error) {
      console.error('Error loading food plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultFoodPlans = () => {
    return [
      {
        id: 'food_plan_1',
        name: 'Weight Loss Nutrition Plan',
        description: 'Balanced nutrition plan focused on sustainable weight loss',
        goal: 'weight_loss',
        dailyCalories: 1800,
        macros: {
          protein: 30,
          carbs: 40,
          fats: 30
        },
        assignedClients: [],
        meals: [
          {
            name: 'Breakfast',
            targetCalories: 400,
            foods: [
              { name: 'Greek Yogurt', amount: '1 cup', calories: 150, protein: 20, carbs: 9, fats: 4 },
              { name: 'Berries', amount: '1/2 cup', calories: 40, protein: 0.5, carbs: 10, fats: 0 },
              { name: 'Almonds', amount: '1 oz', calories: 160, protein: 6, carbs: 6, fats: 14 }
            ]
          },
          {
            name: 'Lunch',
            targetCalories: 500,
            foods: [
              { name: 'Grilled Chicken Breast', amount: '4 oz', calories: 185, protein: 35, carbs: 0, fats: 4 },
              { name: 'Quinoa', amount: '1/2 cup cooked', calories: 110, protein: 4, carbs: 20, fats: 2 },
              { name: 'Mixed Vegetables', amount: '1 cup', calories: 30, protein: 2, carbs: 7, fats: 0 },
              { name: 'Olive Oil', amount: '1 tbsp', calories: 120, protein: 0, carbs: 0, fats: 14 }
            ]
          },
          {
            name: 'Dinner',
            targetCalories: 450,
            foods: [
              { name: 'Salmon', amount: '4 oz', calories: 230, protein: 25, carbs: 0, fats: 14 },
              { name: 'Sweet Potato', amount: '1 medium', calories: 110, protein: 2, carbs: 26, fats: 0 },
              { name: 'Broccoli', amount: '1 cup', calories: 25, protein: 3, carbs: 5, fats: 0 }
            ]
          },
          {
            name: 'Snacks',
            targetCalories: 200,
            foods: [
              { name: 'Apple', amount: '1 medium', calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
              { name: 'Peanut Butter', amount: '1 tbsp', calories: 95, protein: 4, carbs: 4, fats: 8 }
            ]
          }
        ],
        guidelines: [
          'Drink at least 8 glasses of water daily',
          'Eat every 3-4 hours to maintain metabolism',
          'Focus on whole, unprocessed foods',
          'Control portion sizes using your hand as a guide'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'food_plan_2',
        name: 'Muscle Building Nutrition Plan',
        description: 'High-protein nutrition plan designed to support muscle growth',
        goal: 'muscle_gain',
        dailyCalories: 2400,
        macros: {
          protein: 35,
          carbs: 40,
          fats: 25
        },
        assignedClients: [],
        meals: [
          {
            name: 'Breakfast',
            targetCalories: 550,
            foods: [
              { name: 'Oatmeal', amount: '1 cup cooked', calories: 150, protein: 5, carbs: 27, fats: 3 },
              { name: 'Whey Protein Powder', amount: '1 scoop', calories: 120, protein: 25, carbs: 3, fats: 1 },
              { name: 'Banana', amount: '1 medium', calories: 105, protein: 1, carbs: 27, fats: 0 },
              { name: 'Walnuts', amount: '1 oz', calories: 185, protein: 4, carbs: 4, fats: 18 }
            ]
          },
          {
            name: 'Lunch',
            targetCalories: 650,
            foods: [
              { name: 'Lean Ground Beef', amount: '5 oz', calories: 350, protein: 50, carbs: 0, fats: 15 },
              { name: 'Brown Rice', amount: '1 cup cooked', calories: 220, protein: 5, carbs: 45, fats: 2 },
              { name: 'Black Beans', amount: '1/2 cup', calories: 110, protein: 8, carbs: 20, fats: 0.5 }
            ]
          },
          {
            name: 'Dinner',
            targetCalories: 600,
            foods: [
              { name: 'Chicken Thigh', amount: '6 oz', calories: 250, protein: 40, carbs: 0, fats: 8 },
              { name: 'Pasta', amount: '1.5 cups cooked', calories: 200, protein: 7, carbs: 40, fats: 1 },
              { name: 'Marinara Sauce', amount: '1/2 cup', calories: 35, protein: 2, carbs: 8, fats: 0 },
              { name: 'Parmesan Cheese', amount: '2 tbsp', calories: 40, protein: 4, carbs: 1, fats: 3 }
            ]
          },
          {
            name: 'Snacks',
            targetCalories: 350,
            foods: [
              { name: 'Greek Yogurt', amount: '1 cup', calories: 150, protein: 20, carbs: 9, fats: 4 },
              { name: 'Granola', amount: '1/4 cup', calories: 120, protein: 3, carbs: 18, fats: 5 },
              { name: 'Chocolate Milk', amount: '1 cup', calories: 160, protein: 8, carbs: 26, fats: 2.5 }
            ]
          }
        ],
        guidelines: [
          'Consume protein within 30 minutes post-workout',
          'Eat 1g protein per pound of body weight',
          'Stay hydrated with 10-12 glasses of water daily',
          'Time carbohydrates around workouts for energy'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'food_plan_3',
        name: 'Balanced Maintenance Plan',
        description: 'Well-rounded nutrition plan for general health and weight maintenance',
        goal: 'maintenance',
        dailyCalories: 2000,
        macros: {
          protein: 25,
          carbs: 45,
          fats: 30
        },
        assignedClients: [],
        meals: [
          {
            name: 'Breakfast',
            targetCalories: 450,
            foods: [
              { name: 'Whole Grain Toast', amount: '2 slices', calories: 160, protein: 8, carbs: 28, fats: 2 },
              { name: 'Avocado', amount: '1/2 medium', calories: 120, protein: 2, carbs: 6, fats: 11 },
              { name: 'Eggs', amount: '2 large', calories: 140, protein: 12, carbs: 1, fats: 10 }
            ]
          },
          {
            name: 'Lunch',
            targetCalories: 550,
            foods: [
              { name: 'Turkey Sandwich', amount: '1 sandwich', calories: 320, protein: 25, carbs: 35, fats: 8 },
              { name: 'Side Salad', amount: '2 cups', calories: 50, protein: 3, carbs: 10, fats: 0 },
              { name: 'Olive Oil Dressing', amount: '1 tbsp', calories: 90, protein: 0, carbs: 0, fats: 10 }
            ]
          },
          {
            name: 'Dinner',
            targetCalories: 500,
            foods: [
              { name: 'Baked Cod', amount: '5 oz', calories: 150, protein: 30, carbs: 0, fats: 2 },
              { name: 'Roasted Vegetables', amount: '1.5 cups', calories: 100, protein: 4, carbs: 20, fats: 2 },
              { name: 'Wild Rice', amount: '3/4 cup cooked', calories: 170, protein: 7, carbs: 35, fats: 1 }
            ]
          },
          {
            name: 'Snacks',
            targetCalories: 250,
            foods: [
              { name: 'Mixed Nuts', amount: '1 oz', calories: 170, protein: 5, carbs: 6, fats: 15 },
              { name: 'Orange', amount: '1 medium', calories: 65, protein: 1, carbs: 16, fats: 0 }
            ]
          }
        ],
        guidelines: [
          'Eat a variety of colorful fruits and vegetables',
          'Choose whole grains over refined grains',
          'Include healthy fats from nuts, seeds, and fish',
          'Practice mindful eating and portion control'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  const filterPlans = () => {
    let filtered = foodPlans

    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.goal.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterGoal !== 'all') {
      filtered = filtered.filter(plan => plan.goal === filterGoal)
    }

    setFilteredPlans(filtered)
  }

  const handleCreatePlan = () => {
    console.log('🍽️ Create Plan button clicked')
    setSelectedPlan(null)
    setIsEditing(false)
    setShowPlanModal(true)
    console.log('🍽️ Modal should now be visible:', true)
  }

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan)
    setIsEditing(true)
    setShowPlanModal(true)
  }

  const handleCopyPlan = async (plan) => {
    const copiedPlan = {
      ...plan,
      id: `food_plan_${Date.now()}`,
      name: `${plan.name} (Copy)`,
      assignedClients: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      await storageService.save('foodPlans', copiedPlan, copiedPlan.id)
      await loadFoodPlans()
      console.log('Food plan copied successfully')
    } catch (error) {
      console.error('Error copying food plan:', error)
    }
  }

  const handleDeletePlan = async (plan) => {
    if (plan.assignedClients.length > 0) {
      alert('Cannot delete a plan that is assigned to clients. Please unassign it first.')
      return
    }

    if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      try {
        await storageService.delete('foodPlans', plan.id)
        await loadFoodPlans()
        console.log('Food plan deleted successfully')
      } catch (error) {
        console.error('Error deleting food plan:', error)
      }
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'
  }

  const getGoalIcon = (goal) => {
    switch (goal) {
      case 'weight_loss': return Target
      case 'muscle_gain': return Utensils
      case 'maintenance': return Clock
      default: return Utensils
    }
  }

  const getGoalColor = (goal) => {
    switch (goal) {
      case 'weight_loss': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'muscle_gain': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'maintenance': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatGoalName = (goal) => {
    return goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Food Plan Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage nutrition plans for your clients
          </p>
        </div>
        <button
          onClick={handleCreatePlan}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search food plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterGoal}
          onChange={(e) => setFilterGoal(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Goals</option>
          <option value="weight_loss">Weight Loss</option>
          <option value="muscle_gain">Muscle Gain</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Food Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading food plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Utensils size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                No food plans found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {searchTerm || filterGoal !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first food plan to get started'
                }
              </p>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const GoalIcon = getGoalIcon(plan.goal)
              
              return (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                          <GoalIcon size={20} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Goal Tag */}
                    <div className="mb-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGoalColor(plan.goal)}`}>
                        {formatGoalName(plan.goal)}
                      </span>
                    </div>

                    {/* Nutrition Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {plan.dailyCalories}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Daily Calories</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {plan.meals.length}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Meals</p>
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Macros Distribution
                      </p>
                      <div className="flex space-x-4 text-xs">
                        <div className="text-center">
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            {plan.macros.protein}%
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">Protein</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {plan.macros.carbs}%
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">Carbs</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                            {plan.macros.fats}%
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">Fats</p>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Clients */}
                    {plan.assignedClients.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Assigned to {plan.assignedClients.length} client(s)
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {plan.assignedClients.slice(0, 2).map(clientId => getClientName(clientId)).join(', ')}
                          {plan.assignedClients.length > 2 && ` +${plan.assignedClients.length - 2} more`}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit Plan"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleCopyPlan(plan)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Copy Plan"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete Plan"
                          disabled={plan.assignedClients.length > 0}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Updated {new Date(plan.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <FoodPlanModal
          plan={selectedPlan}
          isEditing={isEditing}
          clients={clients}
          onClose={() => setShowPlanModal(false)}
          onSave={loadFoodPlans}
        />
      )}
    </div>
  )
}

export default FoodPlanManager