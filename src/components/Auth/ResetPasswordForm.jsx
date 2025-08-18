import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import authService from '../../services/auth/authService'

const ResetPasswordForm = ({ isOpen, onClose, onSuccess, resetToken, email }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    if (isOpen && resetToken && email) {
      validateToken()
    }
  }, [isOpen, resetToken, email])

  const validateToken = async () => {
    try {
      setValidatingToken(true)
      await authService.verifyResetToken(email, resetToken)
      setTokenValid(true)
    } catch (err) {
      setError(err.message)
      setTokenValid(false)
    } finally {
      setValidatingToken(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const validatePassword = () => {
    if (formData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      validatePassword()
      
      const result = await authService.resetPassword(email, resetToken, formData.password)
      
      if (result.success) {
        onSuccess(result.message)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ password: '', confirmPassword: '' })
    setError('')
    setTokenValid(false)
    setValidatingToken(true)
    onClose()
  }

  const getPasswordStrength = (password) => {
    let strength = 0
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^a-zA-Z\d]/.test(password)
    ]
    
    checks.forEach(check => check && strength++)
    
    if (strength <= 2) return { level: 'weak', color: 'red', text: 'Weak' }
    if (strength <= 3) return { level: 'medium', color: 'yellow', text: 'Medium' }
    return { level: 'strong', color: 'green', text: 'Strong' }
  }

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null

  if (!isOpen) return null

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient">
                Reset Password
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your new password
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200"
          >
            <X size={22} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {validatingToken ? (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400">
                Validating reset token...
              </p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <AlertCircle size={32} className="text-white" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Invalid Reset Link
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {error || 'This reset link is invalid or has expired.'}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full btn-secondary py-3"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <p className="text-slate-600 dark:text-slate-400">
                  Choose a strong password for your account.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Resetting password for: <span className="font-medium">{email}</span>
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="input-modern pr-12"
                    placeholder="Enter new password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Password Strength
                      </span>
                      <span className={`text-xs font-semibold text-${passwordStrength.color}-600 dark:text-${passwordStrength.color}-400`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.level === 'weak' ? 'bg-red-500 w-1/3' :
                          passwordStrength.level === 'medium' ? 'bg-yellow-500 w-2/3' :
                          'bg-green-500 w-full'
                        }`}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="input-modern pr-12"
                    placeholder="Confirm new password"
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

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-2">
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-sm">Passwords match</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <AlertCircle size={16} />
                        <span className="text-sm">Passwords do not match</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                disabled={loading || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
                className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordForm