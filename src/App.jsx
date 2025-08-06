import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Nutrition from './components/Nutrition/Nutrition'
import Activity from './components/Activity/Activity'
import Wellness from './components/Wellness/Wellness'
import Body from './components/Body/Body'
import CameraTest from './components/common/CameraTest'
import AdminDashboard from './components/Admin/AdminDashboard'
import TrainerDashboard from './components/Trainer/TrainerDashboard'
import LandingPage from './components/Landing/LandingPage'
import LoginModal from './components/Auth/LoginModal'
import authService from './services/auth/authService'
import dataEncryptionService from './services/security/dataEncryptionService'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Initialize encryption service first
      if (!dataEncryptionService.isInitialized) {
        await dataEncryptionService.initialize()
      }
      
      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser()
        setCurrentUser(user)
        console.log('🔐 User authenticated:', user?.email, 'Role:', user?.role)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setCurrentUser(null)
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // Show admin dashboard if admin is logged in
  if (currentUser && currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminDashboard onLogout={handleLogout} />
      </div>
    )
  }

  // Show trainer dashboard if trainer is logged in
  if (currentUser && currentUser.role === 'trainer') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TrainerDashboard onLogout={handleLogout} />
      </div>
    )
  }

  // Show landing page if no user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen">
        <LandingPage onGetStarted={() => setShowLoginModal(true)} />
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Layout 
          currentUser={currentUser} 
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/wellness" element={<Wellness />} />
            <Route path="/body" element={<Body />} />
            <Route path="/camera-test" element={<CameraTest />} />
          </Routes>
        </Layout>
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    </Router>
  )
}

export default App