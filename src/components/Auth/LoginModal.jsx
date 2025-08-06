import { useState } from 'react'
import { X, Eye, EyeOff, LogIn, UserPlus, Shield } from 'lucide-react'
import authService from '../../services/auth/authService'

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'client',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authService.login(formData.email, formData.password, formData.rememberMe)
      
      if (result.success) {
        onLoginSuccess(result.user)
        onClose()
        
        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          role: 'client',
          rememberMe: false
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authService.register({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role || 'client'
      })
      
      if (result.success) {
        // Switch to login mode and show success
        setMode('login')
        setError('')
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          role: 'client'
        }))
        
        // Auto-login after successful registration
        setTimeout(async () => {
          try {
            const loginResult = await authService.login(formData.email, formData.password)
            if (loginResult.success) {
              onLoginSuccess(loginResult.user)
              onClose()
            }
          } catch (err) {
            console.error('Auto-login failed:', err)
          }
        }, 500)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: 'client',
      rememberMe: false
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              {mode === 'login' ? (
                <LogIn size={22} className="text-white" />
              ) : (
                <UserPlus size={22} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient">
                {mode === 'login' ? 'Welcome Back' : 'Join FitnessApp'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200"
          >
            <X size={22} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="p-8 space-y-6">
          {/* Registration Fields */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-modern"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-modern"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          )}

          {/* Role Selection (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Account Type
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="input-modern"
                required
              >
                <option value="client">Client</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="input-modern"
              placeholder="john@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="input-modern pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Registration only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="input-modern pr-12"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me (Login only) */}
          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-2 border-slate-300 rounded-lg focus:ring-indigo-500 focus:ring-2 transition-all duration-200"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
                  Remember me for 30 days
                </span>
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl animate-slide-up">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg font-semibold"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : mode === 'login' ? (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Create Account</span>
              </>
            )}
          </button>

          {/* Mode Switch */}
          <div className="text-center pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={switchMode}
                className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors duration-200"
              >
                {mode === 'login' ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Demo Credentials */}
          {mode === 'login' && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Demo Account
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Try the admin dashboard
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl backdrop-blur-sm">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Email:</span>
                  <span className="text-xs font-mono text-slate-900 dark:text-slate-100">admin@fitness-tracker.com</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl backdrop-blur-sm">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Password:</span>
                  <span className="text-xs font-mono text-slate-900 dark:text-slate-100">admin123</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default LoginModal