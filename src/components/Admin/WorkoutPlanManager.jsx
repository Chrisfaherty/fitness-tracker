import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Copy, Trash2, Users, Activity, Clock, Target } from 'lucide-react'
import WorkoutPlanModal from './WorkoutPlanModal'
import storageService from '../../services/storage'

const WorkoutPlanManager = ({ clients }) => {
  const [workoutPlans, setWorkoutPlans] = useState([])
  const [filteredPlans, setFilteredPlans] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkoutPlans()
  }, [])

  useEffect(() => {
    filterPlans()
  }, [workoutPlans, searchTerm, filterLevel])

  const loadWorkoutPlans = async () => {
    try {
      setLoading(true)
      const plans = await storageService.getAll('workoutPlans') || []
      
      // If no plans exist, create some default ones
      if (plans.length === 0) {
        const defaultPlans = createDefaultWorkoutPlans()
        for (const plan of defaultPlans) {
          await storageService.save('workoutPlans', plan, plan.id)
        }
        setWorkoutPlans(defaultPlans)
      } else {
        setWorkoutPlans(plans)
      }
    } catch (error) {
      console.error('Error loading workout plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultWorkoutPlans = () => {
    return [
      {
        id: 'plan_1',
        name: 'Beginner Full Body',
        description: 'A comprehensive full-body workout plan for beginners',
        level: 'beginner',
        duration: 45,
        daysPerWeek: 3,
        category: 'strength',
        assignedClients: [],
        exercises: [
          { name: 'Bodyweight Squats', sets: 3, reps: '10-15', rest: 60 },
          { name: 'Push-ups (Modified if needed)', sets: 3, reps: '5-10', rest: 60 },
          { name: 'Plank', sets: 3, reps: '20-30 seconds', rest: 60 },
          { name: 'Lunges', sets: 2, reps: '8-12 each leg', rest: 60 },
          { name: 'Glute Bridges', sets: 3, reps: '12-15', rest: 60 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'plan_2',
        name: 'Intermediate Strength Training',
        description: 'Progressive strength training for intermediate fitness levels',
        level: 'intermediate',
        duration: 60,
        daysPerWeek: 4,
        category: 'strength',
        assignedClients: [],
        exercises: [
          { name: 'Squats', sets: 4, reps: '8-12', rest: 90 },
          { name: 'Bench Press', sets: 4, reps: '8-10', rest: 90 },
          { name: 'Bent-over Rows', sets: 4, reps: '8-12', rest: 90 },
          { name: 'Overhead Press', sets: 3, reps: '8-10', rest: 90 },
          { name: 'Deadlifts', sets: 3, reps: '6-8', rest: 120 },
          { name: 'Pull-ups/Lat Pulldowns', sets: 3, reps: '6-10', rest: 90 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'plan_3',
        name: 'HIIT Cardio Blast',
        description: 'High-intensity interval training for cardiovascular fitness',
        level: 'intermediate',
        duration: 30,
        daysPerWeek: 3,
        category: 'cardio',
        assignedClients: [],
        exercises: [
          { name: 'Burpees', sets: 4, reps: '30 seconds', rest: 30 },
          { name: 'Mountain Climbers', sets: 4, reps: '30 seconds', rest: 30 },
          { name: 'Jump Squats', sets: 4, reps: '30 seconds', rest: 30 },
          { name: 'High Knees', sets: 4, reps: '30 seconds', rest: 30 },
          { name: 'Plank Jacks', sets: 4, reps: '30 seconds', rest: 30 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'plan_4',
        name: 'Flexibility & Mobility',
        description: 'Gentle stretching and mobility work for all fitness levels',
        level: 'beginner',
        duration: 30,
        daysPerWeek: 5,
        category: 'flexibility',
        assignedClients: [],
        exercises: [
          { name: 'Cat-Cow Stretch', sets: 1, reps: '10-15', rest: 0 },
          { name: 'Child\'s Pose', sets: 1, reps: '30-60 seconds', rest: 0 },
          { name: 'Downward Dog', sets: 1, reps: '30-60 seconds', rest: 0 },
          { name: 'Hip Flexor Stretch', sets: 1, reps: '30 seconds each side', rest: 0 },
          { name: 'Hamstring Stretch', sets: 1, reps: '30 seconds each leg', rest: 0 },
          { name: 'Shoulder Rolls', sets: 1, reps: '10 forward, 10 backward', rest: 0 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  const filterPlans = () => {
    let filtered = workoutPlans

    if (searchTerm) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(plan => plan.level === filterLevel)
    }

    setFilteredPlans(filtered)
  }

  const handleCreatePlan = () => {
    setSelectedPlan(null)
    setIsEditing(false)
    setShowPlanModal(true)
  }

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan)
    setIsEditing(true)
    setShowPlanModal(true)
  }

  const handleCopyPlan = async (plan) => {
    const copiedPlan = {
      ...plan,
      id: `plan_${Date.now()}`,
      name: `${plan.name} (Copy)`,
      assignedClients: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      await storageService.save('workoutPlans', copiedPlan, copiedPlan.id)
      await loadWorkoutPlans()
      console.log('Workout plan copied successfully')
    } catch (error) {
      console.error('Error copying workout plan:', error)
    }
  }

  const handleDeletePlan = async (plan) => {
    if (plan.assignedClients.length > 0) {
      alert('Cannot delete a plan that is assigned to clients. Please unassign it first.')
      return
    }

    if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      try {
        await storageService.delete('workoutPlans', plan.id)
        await loadWorkoutPlans()
        console.log('Workout plan deleted successfully')
      } catch (error) {
        console.error('Error deleting workout plan:', error)
      }
    }
  }

  const handleAssignToClient = async (plan, clientId) => {
    const updatedPlan = {
      ...plan,
      assignedClients: [...plan.assignedClients, clientId],
      updatedAt: new Date().toISOString()
    }

    try {
      await storageService.save('workoutPlans', updatedPlan, plan.id)
      await loadWorkoutPlans()
      console.log('Plan assigned to client successfully')
    } catch (error) {
      console.error('Error assigning plan to client:', error)
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'strength': return Activity
      case 'cardio': return Target
      case 'flexibility': return Clock
      default: return Activity
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'strength': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cardio': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'flexibility': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Workout Plan Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage workout plans for your clients
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
            placeholder="Search workout plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Workout Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading workout plans...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Activity size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                No workout plans found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {searchTerm || filterLevel !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first workout plan to get started'
                }
              </p>
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const CategoryIcon = getCategoryIcon(plan.category)
              
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
                          <CategoryIcon size={20} className="text-primary-600 dark:text-primary-400" />
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

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getLevelColor(plan.level)}`}>
                        {plan.level}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getCategoryColor(plan.category)}`}>
                        {plan.category}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {plan.duration}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Minutes</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {plan.daysPerWeek}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Days/Week</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {plan.exercises.length}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Exercises</p>
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
        <WorkoutPlanModal
          plan={selectedPlan}
          isEditing={isEditing}
          clients={clients}
          onClose={() => setShowPlanModal(false)}
          onSave={loadWorkoutPlans}
        />
      )}
    </div>
  )
}

export default WorkoutPlanManager