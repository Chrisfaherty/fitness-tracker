import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginModal from './components/Auth/LoginModal'
import authService from './services/auth/authService'
import dataEncryptionService from './services/security/dataEncryptionService'

// Lazy load heavy components for better code splitting
const Layout = lazy(() => import('./components/common/Layout'))
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'))
const Nutrition = lazy(() => import('./components/Nutrition/NutritionOptimized'))
const ErrorBoundary = lazy(() => import('./components/ErrorBoundary'))
const Activity = lazy(() => import('./components/Activity/Activity'))
const Wellness = lazy(() => import('./components/Wellness/Wellness'))
const Body = lazy(() => import('./components/Body/Body'))
const CameraTest = lazy(() => import('./components/common/CameraTest'))
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'))
const TrainerDashboard = lazy(() => import('./components/Trainer/TrainerDashboard'))
const LandingPage = lazy(() => import('./components/Landing/LandingPage'))

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
)

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
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <AdminDashboard onLogout={handleLogout} />
        </div>
      </Suspense>
    )
  }

  // Show trainer dashboard if trainer is logged in
  if (currentUser && currentUser.role === 'trainer') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <TrainerDashboard onLogout={handleLogout} />
        </div>
      </Suspense>
    )
  }

  // Show landing page if no user is logged in
  if (!currentUser) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen">
          <LandingPage onGetStarted={() => setShowLoginModal(true)} />

          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      </Suspense>
    )
  }

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Layout
            currentUser={currentUser}
            onLoginClick={() => setShowLoginModal(true)}
            onLogout={handleLogout}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/nutrition" element={
                  <ErrorBoundary>
                    <Nutrition />
                  </ErrorBoundary>
                } />
                <Route path="/activity" element={<Activity />} />
                <Route path="/wellness" element={<Wellness />} />
                <Route path="/body" element={<Body />} />
                <Route path="/camera-test" element={<CameraTest />} />
              </Routes>
            </Suspense>
          </Layout>

          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      </Suspense>
    </Router>
  )
}

export default App