import { useState } from 'react'
import authService from '../../services/auth/authService'

const PasswordResetTest = () => {
  const [testResults, setTestResults] = useState([])
  const [testing, setTesting] = useState(false)

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date().toISOString() }])
  }

  const runTests = async () => {
    setTesting(true)
    setTestResults([])
    
    const testEmail = 'admin@fitness-tracker.com'
    const newPassword = 'newpassword123'
    
    try {
      // Test 1: Request password reset
      addResult('Request Password Reset', 'running', 'Requesting password reset...')
      const resetResult = await authService.requestPasswordReset(testEmail)
      
      if (resetResult.success) {
        addResult('Request Password Reset', 'success', resetResult.message)
        
        // Extract token from storage (in production, this would come from email)
        // For testing, we'll get the token directly
        const storageService = authService.storageService
        const resetData = await storageService.get(`passwordReset_${testEmail}`)
        
        if (resetData && resetData.token) {
          const resetToken = resetData.token
          addResult('Extract Reset Token', 'success', `Token: ${resetToken.substring(0, 20)}...`)
          
          // Test 2: Verify reset token
          addResult('Verify Reset Token', 'running', 'Verifying token...')
          try {
            const verifyResult = await authService.verifyResetToken(testEmail, resetToken)
            if (verifyResult.success) {
              addResult('Verify Reset Token', 'success', 'Token is valid')
              
              // Test 3: Reset password
              addResult('Reset Password', 'running', 'Resetting password...')
              const resetPasswordResult = await authService.resetPassword(testEmail, resetToken, newPassword)
              
              if (resetPasswordResult.success) {
                addResult('Reset Password', 'success', resetPasswordResult.message)
                
                // Test 4: Login with new password
                addResult('Login with New Password', 'running', 'Attempting login...')
                try {
                  const loginResult = await authService.login(testEmail, newPassword)
                  if (loginResult.success) {
                    addResult('Login with New Password', 'success', 'Login successful with new password')
                    
                    // Test 5: Verify old token is cleaned up
                    addResult('Token Cleanup', 'running', 'Checking token cleanup...')
                    try {
                      await authService.verifyResetToken(testEmail, resetToken)
                      addResult('Token Cleanup', 'error', 'Token should have been deleted')
                    } catch (error) {
                      addResult('Token Cleanup', 'success', 'Token properly cleaned up')
                    }
                  } else {
                    addResult('Login with New Password', 'error', 'Login failed')
                  }
                } catch (loginError) {
                  addResult('Login with New Password', 'error', loginError.message)
                }
              } else {
                addResult('Reset Password', 'error', 'Password reset failed')
              }
            } else {
              addResult('Verify Reset Token', 'error', 'Token verification failed')
            }
          } catch (verifyError) {
            addResult('Verify Reset Token', 'error', verifyError.message)
          }
        } else {
          addResult('Extract Reset Token', 'error', 'Could not find reset token')
        }
      } else {
        addResult('Request Password Reset', 'error', 'Reset request failed')
      }
    } catch (error) {
      addResult('Request Password Reset', 'error', error.message)
    }
    
    setTesting(false)
  }

  const resetToOriginalPassword = async () => {
    try {
      // Reset admin password back to original
      const user = await authService.getUserByEmail('admin@fitness-tracker.com')
      if (user) {
        user.password = await authService.hashPassword('admin123')
        await authService.saveUser(user)
        addResult('Reset to Original', 'success', 'Admin password reset to admin123')
      }
    } catch (error) {
      addResult('Reset to Original', 'error', error.message)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Password Reset Testing
        </h2>
        <div className="space-x-3">
          <button
            onClick={runTests}
            disabled={testing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? 'Running Tests...' : 'Run Tests'}
          </button>
          <button
            onClick={resetToOriginalPassword}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset to Original
          </button>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Test Results:
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  result.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                    : result.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    result.status === 'success' ? 'text-green-800 dark:text-green-300' :
                    result.status === 'error' ? 'text-red-800 dark:text-red-300' :
                    'text-blue-800 dark:text-blue-300'
                  }`}>
                    {result.test}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.status === 'success' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
                    result.status === 'error' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                    'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  result.status === 'success' ? 'text-green-700 dark:text-green-400' :
                  result.status === 'error' ? 'text-red-700 dark:text-red-400' :
                  'text-blue-700 dark:text-blue-400'
                }`}>
                  {result.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordResetTest