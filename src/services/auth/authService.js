/**
 * Authentication Service
 * Handles user authentication, session management, and role-based access control
 */

import { dataEncryptionService } from '../security/dataEncryptionService.js'
import storageService from '../storage.js'

export class AuthService {
  constructor() {
    this.currentUser = null
    this.sessionToken = null
    this.sessionExpiry = null
    this.loginAttempts = new Map()
    this.maxLoginAttempts = 5
    this.lockoutDuration = 15 * 60 * 1000 // 15 minutes
    this.sessionDuration = 8 * 60 * 60 * 1000 // 8 hours
    this.storageService = storageService // Expose for testing
    
    // Initialize authentication state
    this.initializeAuth()
  }

  /**
   * Initialize authentication state from storage
   */
  async initializeAuth() {
    try {
      // Initialize encryption service if not already initialized
      if (!dataEncryptionService.isInitialized) {
        await dataEncryptionService.initialize()
      }
      
      const storedSession = await storageService.get('userSession')
      if (storedSession && this.isValidSession(storedSession)) {
        let userData
        if (storedSession.userData && typeof storedSession.userData === 'object' && storedSession.userData._encrypted) {
          // Decrypt if encrypted
          userData = await dataEncryptionService.decryptData(storedSession.userData)
        } else {
          // Handle plain text data (backwards compatibility)
          userData = typeof storedSession.userData === 'string' ? JSON.parse(storedSession.userData) : storedSession.userData
        }
        
        this.currentUser = userData
        this.sessionToken = storedSession.token
        this.sessionExpiry = new Date(storedSession.expiry)
        
        console.log('✅ Authentication restored from storage')
      }
    } catch (error) {
      console.warn('Failed to restore authentication:', error)
      await this.logout()
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(email, password, rememberMe = false) {
    try {
      // Check for account lockout
      if (this.isAccountLocked(email)) {
        throw new Error('Account temporarily locked due to too many failed attempts. Please try again later.')
      }

      // Validate input
      if (!this.validateEmail(email)) {
        throw new Error('Please enter a valid email address')
      }
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long')
      }

      // Simulate API call for authentication
      const userData = await this.authenticateUser(email, password)
      
      // Generate session token
      const sessionToken = this.generateSessionToken()
      const sessionExpiry = new Date(Date.now() + this.sessionDuration)
      
      // Store user data securely
      this.currentUser = userData
      this.sessionToken = sessionToken
      this.sessionExpiry = sessionExpiry
      
      // Encrypt and store session
      let userDataToStore
      try {
        if (dataEncryptionService.isInitialized) {
          userDataToStore = await dataEncryptionService.encryptData(userData)
        } else {
          // Fallback to plain storage if encryption not available
          userDataToStore = userData
        }
      } catch (error) {
        console.warn('Encryption failed, storing data unencrypted:', error)
        userDataToStore = userData
      }
      
      await storageService.save('userSession', {
        userData: userDataToStore,
        token: sessionToken,
        expiry: sessionExpiry.toISOString(),
        rememberMe
      })
      
      // Clear login attempts
      this.loginAttempts.delete(email)
      
      // Log successful login
      await this.logAuthEvent('login_success', { email, role: userData.role })
      
      return {
        success: true,
        user: this.sanitizeUser(userData),
        token: sessionToken,
        expiresAt: sessionExpiry
      }
      
    } catch (error) {
      // Track failed login attempts
      this.recordFailedLogin(email)
      
      // Log failed login
      await this.logAuthEvent('login_failed', { email, error: error.message })
      
      throw error
    }
  }

  /**
   * Register new user account
   */
  async register(userData) {
    try {
      const { email, password, confirmPassword, firstName, lastName, role = 'client' } = userData
      
      // Validate input
      this.validateRegistrationData(userData)
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }
      
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email)
      if (existingUser) {
        throw new Error('An account with this email already exists')
      }
      
      // Hash password
      const hashedPassword = await this.hashPassword(password)
      
      // Create user account
      const newUser = {
        id: this.generateUserId(),
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        profile: {
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || '',
          fitnessLevel: userData.fitnessLevel || 'beginner',
          goals: userData.goals || [],
          medicalConditions: userData.medicalConditions || [],
          emergencyContact: userData.emergencyContact || {}
        }
      }
      
      // Save user to database
      await this.saveUser(newUser)
      
      // Log registration
      await this.logAuthEvent('user_registered', { email, role })
      
      return {
        success: true,
        message: 'Account created successfully',
        userId: newUser.id
      }
      
    } catch (error) {
      await this.logAuthEvent('registration_failed', { email: userData.email, error: error.message })
      throw error
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      // Log logout event
      if (this.currentUser) {
        await this.logAuthEvent('logout', { email: this.currentUser.email })
      }
      
      // Clear session data
      this.currentUser = null
      this.sessionToken = null
      this.sessionExpiry = null
      
      // Remove from storage
      await storageService.delete('userSession')
      
      console.log('✅ User logged out successfully')
      return { success: true }
      
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Check if current session is valid
   */
  isAuthenticated() {
    return this.currentUser && 
           this.sessionToken && 
           this.sessionExpiry && 
           new Date() < this.sessionExpiry
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null
    }
    return this.sanitizeUser(this.currentUser)
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role
  }

  /**
   * Check if user is administrator
   */
  isAdmin() {
    return this.hasRole('admin')
  }

  /**
   * Check if user is trainer
   */
  isTrainer() {
    return this.hasRole('trainer')
  }

  /**
   * Check if user is client
   */
  isClient() {
    return this.hasRole('client')
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    if (!this.isAuthenticated()) {
      throw new Error('No valid session to refresh')
    }
    
    try {
      const newToken = this.generateSessionToken()
      const newExpiry = new Date(Date.now() + this.sessionDuration)
      
      this.sessionToken = newToken
      this.sessionExpiry = newExpiry
      
      // Update stored session
      const storedSession = await storageService.get('userSession')
      if (storedSession) {
        storedSession.token = newToken
        storedSession.expiry = newExpiry.toISOString()
        await storageService.save('userSession', storedSession)
      }
      
      return { token: newToken, expiresAt: newExpiry }
      
    } catch (error) {
      await this.logout()
      throw error
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated()) {
      throw new Error('Must be logged in to change password')
    }
    
    try {
      // Verify current password
      const isValid = await this.verifyPassword(currentPassword, this.currentUser.password)
      if (!isValid) {
        throw new Error('Current password is incorrect')
      }
      
      // Validate new password
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long')
      }
      
      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword)
      
      // Update user password
      const updatedUser = { ...this.currentUser, password: hashedNewPassword }
      await this.saveUser(updatedUser)
      this.currentUser = updatedUser
      
      // Log password change
      await this.logAuthEvent('password_changed', { email: this.currentUser.email })
      
      return { success: true, message: 'Password changed successfully' }
      
    } catch (error) {
      await this.logAuthEvent('password_change_failed', { 
        email: this.currentUser.email, 
        error: error.message 
      })
      throw error
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const user = await this.getUserByEmail(email)
      if (!user) {
        // Don't reveal if email exists for security
        return { success: true, message: 'If an account exists, a reset link has been sent' }
      }
      
      // Generate reset token
      const resetToken = this.generateResetToken()
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      
      // Store reset token
      await storageService.save(`passwordReset_${email}`, {
        token: resetToken,
        expiry: resetExpiry.toISOString(),
        email
      })
      
      // Log reset request
      await this.logAuthEvent('password_reset_requested', { email })
      
      // In production, send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`)
      
      return { success: true, message: 'Password reset instructions sent to your email' }
      
    } catch (error) {
      await this.logAuthEvent('password_reset_failed', { email, error: error.message })
      throw error
    }
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(email, token) {
    try {
      const resetData = await storageService.get(`passwordReset_${email}`)
      
      if (!resetData || resetData.token !== token) {
        throw new Error('Invalid or expired reset token')
      }
      
      if (new Date() > new Date(resetData.expiry)) {
        // Clean up expired token
        await storageService.delete(`passwordReset_${email}`)
        throw new Error('Reset token has expired')
      }
      
      return { success: true, email: resetData.email }
      
    } catch (error) {
      await this.logAuthEvent('password_reset_token_verification_failed', { email, error: error.message })
      throw error
    }
  }

  /**
   * Complete password reset with new password
   */
  async resetPassword(email, token, newPassword) {
    try {
      // Verify token first
      await this.verifyResetToken(email, token)
      
      // Get user
      const user = await this.getUserByEmail(email)
      if (!user) {
        throw new Error('User not found')
      }
      
      // Validate new password
      if (!newPassword || newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long')
      }
      
      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword)
      
      // Update user password
      const updatedUser = { ...user, password: hashedPassword }
      await this.saveUser(updatedUser)
      
      // Clean up reset token
      await storageService.delete(`passwordReset_${email}`)
      
      // Log successful password reset
      await this.logAuthEvent('password_reset_completed', { email })
      
      return { success: true, message: 'Password has been reset successfully' }
      
    } catch (error) {
      await this.logAuthEvent('password_reset_completion_failed', { email, error: error.message })
      throw error
    }
  }

  // Private helper methods
  async authenticateUser(email, password) {
    // Simulate database lookup
    const users = await this.getAllUsersInternal()
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      throw new Error('Invalid email or password')
    }
    
    if (!user.isActive) {
      throw new Error('Account has been deactivated')
    }
    
    const isValidPassword = await this.verifyPassword(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString()
    await this.saveUser(user)
    
    return user
  }

  async getAllUsersInternal() {
    try {
      const users = await storageService.getAll('users') || []
      
      // If no users exist, create default admin
      if (users.length === 0) {
        const defaultAdmin = await this.createDefaultAdmin()
        users.push(defaultAdmin)
      }
      
      return users
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  async createDefaultAdmin() {
    const defaultAdmin = {
      id: 'admin_001',
      email: 'admin@fitness-tracker.com',
      password: await this.hashPassword('admin123'), // Change in production!
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      profile: {
        phone: '',
        dateOfBirth: '',
        gender: '',
        fitnessLevel: 'expert',
        goals: ['manage_system'],
        medicalConditions: [],
        emergencyContact: {}
      }
    }
    
    await this.saveUser(defaultAdmin)
    console.log('🔧 Default admin account created - Email: admin@fitness-tracker.com, Password: admin123')
    
    return defaultAdmin
  }

  async getUserByEmail(email) {
    try {
      const users = await this.getAllUsersInternal()
      return users.find(u => u.email.toLowerCase() === email.toLowerCase())
    } catch (error) {
      console.error('❌ Error getting user by email:', error)
      return null
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required')
    }

    try {
      const users = await storageService.getAll('users') || []
      console.log('✅ Retrieved all users:', users.length)
      return users
    } catch (error) {
      console.error('❌ Error getting all users:', error)
      throw error
    }
  }

  async saveUser(user) {
    try {
      const result = await storageService.save('users', user, user.id)
      console.log('✅ User saved successfully:', user.email)
      return result
    } catch (error) {
      console.error('❌ Error saving user:', error)
      throw error
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  validateRegistrationData(data) {
    const { email, password, firstName, lastName } = data
    
    if (!this.validateEmail(email)) {
      throw new Error('Please enter a valid email address')
    }
    
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    if (!firstName || firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters long')
    }
    
    if (!lastName || lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters long')
    }
  }

  async hashPassword(password) {
    // Simple hash for demo - use bcrypt in production
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'fitness_salt_2024')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async verifyPassword(password, hashedPassword) {
    const hash = await this.hashPassword(password)
    return hash === hashedPassword
  }

  generateSessionToken() {
    return 'ft_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now()
  }

  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 12) + '_' + Date.now()
  }

  generateResetToken() {
    return 'reset_' + Math.random().toString(36).substr(2, 20) + '_' + Date.now()
  }

  sanitizeUser(user) {
    const { password, ...safeUser } = user
    return safeUser
  }

  isValidSession(session) {
    return session && 
           session.token && 
           session.expiry && 
           new Date() < new Date(session.expiry)
  }

  isAccountLocked(email) {
    const attempts = this.loginAttempts.get(email)
    if (!attempts) return false
    
    return attempts.count >= this.maxLoginAttempts && 
           Date.now() - attempts.lockTime < this.lockoutDuration
  }

  recordFailedLogin(email) {
    const attempts = this.loginAttempts.get(email) || { count: 0, lockTime: null }
    attempts.count++
    
    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockTime = Date.now()
    }
    
    this.loginAttempts.set(email, attempts)
  }

  async logAuthEvent(event, data) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        data,
        userAgent: navigator.userAgent,
        ip: 'client_side' // In production, get from server
      }
      
      await storageService.save('authLogs', logEntry, `${event}_${Date.now()}`)
    } catch (error) {
      console.error('Failed to log auth event:', error)
    }
  }
}

export const authService = new AuthService()
export default authService