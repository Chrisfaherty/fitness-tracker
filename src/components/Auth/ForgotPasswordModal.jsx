import { useState } from 'react'
import { X, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import authService from '../../services/auth/authService'

const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authService.requestPasswordReset(email)
      
      if (result.success) {
        setSuccess(true)
        setMessage(result.message)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setError('')
    setSuccess(false)
    setMessage('')
    onClose()
  }

  const handleBackToLogin = () => {
    handleClose()
    onBackToLogin()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              {success ? (
                <CheckCircle size={22} className="text-white" />
              ) : (
                <Mail size={22} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient">
                {success ? 'Check Your Email' : 'Reset Password'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {success ? 'Instructions have been sent' : 'Enter your email address'}
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
          {success ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle size={32} className="text-white" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Reset Link Sent!
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Check your spam folder if you don't see the email in your inbox.
                </p>
              </div>

              {/* Demo token display for development */}
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail size={16} className="text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Development Mode
                  </p>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  In production, you would receive an email. For now, check the browser console for the reset token to complete the password reset process.
                </p>
              </div>

              <button
                onClick={handleBackToLogin}
                className="w-full btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <ArrowLeft size={18} />
                <span>Back to Login</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-3 mb-8">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    className="input-modern pl-12"
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                  <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                </div>
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
                disabled={loading || !email}
                className="w-full btn-primary flex items-center justify-center space-x-3 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Mail size={20} />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>

              {/* Back to Login */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <ArrowLeft size={18} />
                <span>Back to Login</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordModal