import { useState, useEffect } from 'react'
import { Users, Activity, Calendar, Settings, Plus, Search, Filter, LogOut } from 'lucide-react'
import authService from '../../services/auth/authService'
import storageService from '../../services/storage'
import ClientManagement from './ClientManagement'
import WorkoutPlanManager from './WorkoutPlanManager'
import FoodPlanManager from './FoodPlanManager'
import AdminSettings from './AdminSettings'

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('clients')
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    workoutPlans: 0,
    foodPlans: 0
  })
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only allow admin access
    if (!authService.isAdmin()) {
      console.error('Access denied: Admin privileges required')
      return
    }

    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load clients and calculate stats
      const allClients = await getAllClients()
      const activeClients = allClients.filter(client => client.isActive)
      
      setClients(allClients)
      setStats({
        totalClients: allClients.length,
        activeClients: activeClients.length,
        workoutPlans: await getWorkoutPlansCount(),
        foodPlans: await getFoodPlansCount()
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAllClients = async () => {
    try {
      const users = await authService.getAllUsers()
      return users.filter(user => user.role === 'client')
    } catch (error) {
      console.error('Error getting clients:', error)
      return []
    }
  }

  const getWorkoutPlansCount = async () => {
    try {
      const workoutPlans = await storageService.getAll('workoutPlans') || []
      return workoutPlans.length
    } catch (error) {
      console.error('Error getting workout plans count:', error)
      return 0
    }
  }

  const getFoodPlansCount = async () => {
    try {
      const foodPlans = await storageService.getAll('foodPlans') || []
      return foodPlans.length
    } catch (error) {
      console.error('Error getting food plans count:', error)
      return 0
    }
  }

  if (!authService.isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'clients', name: 'Client Management', icon: Users },
    { id: 'workouts', name: 'Workout Plans', icon: Activity },
    { id: 'nutrition', name: 'Food Plans', icon: Calendar },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="header-glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  Administrator Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage clients, workout plans, and food plans
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {authService.getCurrentUser()?.firstName[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Welcome, {authService.getCurrentUser()?.firstName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Administrator
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary flex items-center space-x-2"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Total Clients
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : stats.totalClients}
                </p>
                <p className="text-xs text-slate-400 mt-1">All registered users</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Active Clients
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : stats.activeClients}
                </p>
                <p className="text-xs text-slate-400 mt-1">Currently engaged</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Workout Plans
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : stats.workoutPlans}
                </p>
                <p className="text-xs text-slate-400 mt-1">Created programs</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Food Plans
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? '...' : stats.foodPlans}
                </p>
                <p className="text-xs text-slate-400 mt-1">Nutrition programs</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card-elevated animate-slide-up">
          <div className="border-b border-slate-200/50 dark:border-slate-700/50">
            <nav className="flex space-x-2 p-2" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    } flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 transform hover:scale-105`}
                  >
                    <Icon size={18} />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'clients' && (
              <ClientManagement 
                clients={clients} 
                onClientsUpdate={loadDashboardData}
              />
            )}
            {activeTab === 'workouts' && (
              <WorkoutPlanManager clients={clients} />
            )}
            {activeTab === 'nutrition' && (
              <FoodPlanManager clients={clients} />
            )}
            {activeTab === 'settings' && (
              <AdminSettings />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard