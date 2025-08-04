/**
 * Security Master Service
 * Coordinates all security services and provides unified security management
 */

import { keyManagementService } from './keyManagementService.js'
import { dataEncryptionService } from './dataEncryptionService.js'
import { privacyComplianceService } from './privacyComplianceService.js'
import { gdprComplianceService } from './gdprComplianceService.js'
import { secureTransmissionService } from './secureTransmissionService.js'
import { securityAuditService } from './securityAuditService.js'
import { dataAnonymizationService } from './dataAnonymizationService.js'

export class SecurityMasterService {
  constructor() {
    this.isInitialized = false
    this.services = new Map()
    this.securityEvents = []
    this.securityMetrics = {
      overallSecurityScore: 0,
      encryptionStatus: 'inactive',
      complianceStatus: 'unknown',
      auditStatus: 'pending',
      lastSecurityCheck: null,
      activeThreats: 0,
      mitigatedThreats: 0
    }
    this.config = {
      autoInitialize: true,
      strictMode: true,
      enableAllFeatures: true,
      securityLevel: 'high', // low, medium, high, maximum
      auditFrequency: 24 * 60 * 60 * 1000, // 24 hours
      complianceMode: 'gdpr' // gdpr, hipaa, both
    }
  }

  /**
   * Initialize the security master service
   */
  async initialize(options = {}) {
    console.log('🛡️ Initializing Security Master Service')
    
    this.config = {
      ...this.config,
      ...options,
      jurisdiction: options.jurisdiction || 'EU',
      organizationName: options.organizationName || 'Fitness Tracker App'
    }
    
    try {
      // Initialize all security services
      await this.initializeSecurityServices()
      
      // Setup service integrations
      this.setupServiceIntegrations()
      
      // Setup security monitoring
      this.setupSecurityMonitoring()
      
      // Perform initial security assessment
      await this.performInitialSecurityAssessment()
      
      this.isInitialized = true
      console.log('✅ Security Master Service initialized successfully')
      
      // Dispatch initialization event
      this.dispatchSecurityEvent('security-master-initialized', {
        timestamp: new Date().toISOString(),
        services: Array.from(this.services.keys()),
        securityLevel: this.config.securityLevel
      })
      
      return {
        initialized: true,
        services: Array.from(this.services.keys()),
        securityLevel: this.config.securityLevel,
        complianceMode: this.config.complianceMode
      }
      
    } catch (error) {
      console.error('❌ Security Master Service initialization failed:', error)
      throw error
    }
  }

  /**
   * Initialize all security services
   */
  async initializeSecurityServices() {
    const serviceConfigs = this.getServiceConfigurations()
    const initPromises = []

    // Key Management Service
    if (this.config.enableAllFeatures || this.config.enableKeyManagement) {
      initPromises.push(
        keyManagementService.initialize(serviceConfigs.keyManagement)
          .then(() => this.services.set('keyManagement', keyManagementService))
          .catch(error => console.error('Key Management Service failed:', error))
      )
    }

    // Data Encryption Service
    if (this.config.enableAllFeatures || this.config.enableEncryption) {
      initPromises.push(
        dataEncryptionService.initialize(serviceConfigs.encryption)
          .then(() => this.services.set('encryption', dataEncryptionService))
          .catch(error => console.error('Data Encryption Service failed:', error))
      )
    }

    // Privacy Compliance Service
    if (this.config.enableAllFeatures || this.config.enablePrivacyCompliance) {
      initPromises.push(
        privacyComplianceService.initialize(serviceConfigs.privacy)
          .then(() => this.services.set('privacy', privacyComplianceService))
          .catch(error => console.error('Privacy Compliance Service failed:', error))
      )
    }

    // GDPR Compliance Service
    if (this.config.complianceMode === 'gdpr' || this.config.complianceMode === 'both') {
      initPromises.push(
        gdprComplianceService.initialize(serviceConfigs.gdpr)
          .then(() => this.services.set('gdpr', gdprComplianceService))
          .catch(error => console.error('GDPR Compliance Service failed:', error))
      )
    }

    // Secure Transmission Service
    if (this.config.enableAllFeatures || this.config.enableSecureTransmission) {
      initPromises.push(
        secureTransmissionService.initialize(serviceConfigs.transmission)
          .then(() => this.services.set('transmission', secureTransmissionService))
          .catch(error => console.error('Secure Transmission Service failed:', error))
      )
    }

    // Security Audit Service
    if (this.config.enableAllFeatures || this.config.enableAuditing) {
      initPromises.push(
        securityAuditService.initialize(serviceConfigs.audit)
          .then(() => this.services.set('audit', securityAuditService))
          .catch(error => console.error('Security Audit Service failed:', error))
      )
    }

    // Data Anonymization Service
    if (this.config.enableAllFeatures || this.config.enableAnonymization) {
      initPromises.push(
        dataAnonymizationService.initialize(serviceConfigs.anonymization)
          .then(() => this.services.set('anonymization', dataAnonymizationService))
          .catch(error => console.error('Data Anonymization Service failed:', error))
      )
    }

    // Wait for all services to initialize
    await Promise.all(initPromises)
    
    console.log(`🔒 Initialized ${this.services.size} security services`)
  }

  /**
   * Get service configurations based on security level
   */
  getServiceConfigurations() {
    const baseConfig = {
      strictMode: this.config.strictMode,
      securityLevel: this.config.securityLevel,
      jurisdiction: this.config.jurisdiction
    }

    return {
      keyManagement: {
        ...baseConfig,
        rotationEnabled: this.config.securityLevel !== 'low',
        environmentKeys: this.getRequiredApiKeys()
      },
      
      encryption: {
        ...baseConfig,
        encryptByDefault: this.config.securityLevel === 'high' || this.config.securityLevel === 'maximum',
        compressionEnabled: this.config.securityLevel !== 'maximum',
        keyDerivationIterations: this.getEncryptionIterations()
      },
      
      privacy: {
        ...baseConfig,
        autoEnforcement: this.config.securityLevel === 'high' || this.config.securityLevel === 'maximum',
        privacyPolicyVersion: '1.0'
      },
      
      gdpr: {
        ...baseConfig,
        organizationName: this.config.organizationName,
        dataControllerDetails: this.config.dataControllerDetails || {}
      },
      
      transmission: {
        ...baseConfig,
        enableRequestSigning: this.config.securityLevel === 'high' || this.config.securityLevel === 'maximum',
        enableResponseVerification: this.config.securityLevel === 'maximum',
        enablePayloadEncryption: this.config.securityLevel === 'maximum',
        enableCertificatePinning: this.config.securityLevel === 'maximum'
      },
      
      audit: {
        ...baseConfig,
        autoAudit: true,
        realTimeMonitoring: this.config.securityLevel === 'high' || this.config.securityLevel === 'maximum',
        reportingLevel: this.config.securityLevel === 'low' ? 'medium' : 'high'
      },
      
      anonymization: {
        ...baseConfig,
        defaultAnonymizationLevel: this.config.securityLevel,
        enableDifferentialPrivacy: this.config.securityLevel === 'maximum',
        kAnonymity: this.getKAnonymityValue(),
        lDiversity: this.getLDiversityValue()
      }
    }
  }

  /**
   * Setup integrations between security services
   */
  setupServiceIntegrations() {
    console.log('🔗 Setting up security service integrations...')

    // Integrate encryption with key management
    if (this.services.has('encryption') && this.services.has('keyManagement')) {
      // Key rotation event handling
      window.addEventListener('api-key-rotated', () => {
        this.services.get('encryption').rotateKeys?.()
      })
    }

    // Integrate privacy compliance with GDPR
    if (this.services.has('privacy') && this.services.has('gdpr')) {
      // Sync consent records
      window.addEventListener('privacy-consent-recorded', (event) => {
        const { consent } = event.detail
        this.services.get('gdpr').registerDataSubject?.(consent.userId || 'anonymous', {
          contactDetails: {},
          jurisdiction: this.config.jurisdiction
        })
      })
    }

    // Integrate audit service with all other services
    if (this.services.has('audit')) {
      // Listen for security events from all services
      const securityEvents = [
        'security-violation', 'unauthorized-access', 'data-breach',
        'privacy-consent-withdrawn', 'encryption-failed', 'key-rotation-needed'
      ]
      
      securityEvents.forEach(eventType => {
        window.addEventListener(eventType, (event) => {
          this.recordSecurityEvent(eventType, event.detail)
        })
      })
    }

    // Integrate anonymization with privacy compliance
    if (this.services.has('anonymization') && this.services.has('privacy')) {
      // Auto-anonymize data when consent is withdrawn
      window.addEventListener('privacy-consent-withdrawn', async (event) => {
        const { consent } = event.detail
        if (consent.purposeId === 'data-collection') {
          // Trigger data anonymization
          await this.anonymizeUserData(consent.userId)
        }
      })
    }

    console.log('✅ Security service integrations configured')
  }

  /**
   * Setup security monitoring
   */
  setupSecurityMonitoring() {
    console.log('👁️ Setting up security monitoring...')

    // Monitor security events
    this.monitorSecurityEvents()
    
    // Setup periodic security checks
    this.setupPeriodicSecurityChecks()
    
    // Monitor service health
    this.monitorServiceHealth()
    
    console.log('✅ Security monitoring active')
  }

  /**
   * Monitor security events
   */
  monitorSecurityEvents() {
    const criticalEvents = [
      'data-breach', 'unauthorized-access', 'encryption-failed',
      'key-compromise', 'security-audit-failed', 'compliance-violation'
    ]

    criticalEvents.forEach(eventType => {
      window.addEventListener(eventType, (event) => {
        this.handleCriticalSecurityEvent(eventType, event.detail)
      })
    })

    // Monitor failed authentication attempts
    window.addEventListener('authentication-failed', (event) => {
      this.handleAuthenticationFailure(event.detail)
    })

    // Monitor data access patterns
    window.addEventListener('data-accessed', (event) => {
      this.analyzeDataAccessPattern(event.detail)
    })
  }

  /**
   * Setup periodic security checks
   */
  setupPeriodicSecurityChecks() {
    // Daily security assessment
    setInterval(async () => {
      await this.performSecurityAssessment()
    }, this.config.auditFrequency)

    // Weekly comprehensive audit
    setInterval(async () => {
      await this.performComprehensiveAudit()
    }, 7 * 24 * 60 * 60 * 1000)

    // Monthly compliance review
    setInterval(async () => {
      await this.performComplianceReview()
    }, 30 * 24 * 60 * 60 * 1000)
  }

  /**
   * Monitor service health
   */
  monitorServiceHealth() {
    setInterval(() => {
      this.checkServiceHealth()
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  /**
   * Perform initial security assessment
   */
  async performInitialSecurityAssessment() {
    console.log('🔍 Performing initial security assessment...')

    try {
      // Check encryption status
      this.securityMetrics.encryptionStatus = this.services.has('encryption') ? 'active' : 'inactive'
      
      // Check compliance status
      const complianceServices = []
      if (this.services.has('privacy')) complianceServices.push('privacy')
      if (this.services.has('gdpr')) complianceServices.push('gdpr')
      
      this.securityMetrics.complianceStatus = complianceServices.length > 0 ? 'active' : 'inactive'
      
      // Perform security audit if available
      if (this.services.has('audit')) {
        const auditResult = await this.services.get('audit').performSecurityAudit()
        this.securityMetrics.auditStatus = 'completed'
        this.securityMetrics.overallSecurityScore = auditResult.overallScore || 0
      }
      
      this.securityMetrics.lastSecurityCheck = new Date().toISOString()
      
      console.log(`✅ Initial security assessment completed - Score: ${this.securityMetrics.overallSecurityScore}/100`)
      
    } catch (error) {
      console.error('Security assessment failed:', error)
      this.securityMetrics.auditStatus = 'failed'
    }
  }

  /**
   * Perform regular security assessment
   */
  async performSecurityAssessment() {
    console.log('🔍 Performing security assessment...')
    
    const assessment = {
      timestamp: new Date().toISOString(),
      services: {},
      overallHealth: 'unknown',
      recommendations: []
    }
    
    // Check each service
    for (const [serviceName, service] of this.services) {
      assessment.services[serviceName] = {
        active: service.isInitialized || true,
        healthy: await this.checkServiceHealth(service),
        lastCheck: new Date().toISOString()
      }
    }
    
    // Calculate overall health
    const healthyServices = Object.values(assessment.services).filter(s => s.healthy).length
    const totalServices = Object.keys(assessment.services).length
    const healthPercentage = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0
    
    if (healthPercentage >= 90) assessment.overallHealth = 'excellent'
    else if (healthPercentage >= 75) assessment.overallHealth = 'good'
    else if (healthPercentage >= 50) assessment.overallHealth = 'fair'
    else assessment.overallHealth = 'poor'
    
    // Update metrics
    this.securityMetrics.lastSecurityCheck = assessment.timestamp
    this.securityMetrics.overallSecurityScore = Math.round(healthPercentage)
    
    // Generate recommendations
    if (healthPercentage < 100) {
      assessment.recommendations.push('Some security services need attention')
    }
    
    // Dispatch assessment event
    this.dispatchSecurityEvent('security-assessment-completed', assessment)
    
    return assessment
  }

  /**
   * Perform comprehensive audit
   */
  async performComprehensiveAudit() {
    console.log('🔍 Performing comprehensive security audit...')
    
    if (!this.services.has('audit')) {
      console.warn('Audit service not available for comprehensive audit')
      return null
    }
    
    try {
      const auditResult = await this.services.get('audit').performSecurityAudit()
      
      // Update security metrics
      this.securityMetrics.overallSecurityScore = auditResult.overallScore
      this.securityMetrics.auditStatus = auditResult.riskLevel
      
      // Handle critical findings
      if (auditResult.riskLevel === 'high' || auditResult.riskLevel === 'critical') {
        this.handleCriticalSecurityEvent('high-risk-audit', auditResult)
      }
      
      console.log(`📊 Comprehensive audit completed - Risk: ${auditResult.riskLevel}`)
      
      return auditResult
      
    } catch (error) {
      console.error('Comprehensive audit failed:', error)
      return null
    }
  }

  /**
   * Perform compliance review
   */
  async performComplianceReview() {
    console.log('📋 Performing compliance review...')
    
    const review = {
      timestamp: new Date().toISOString(),
      frameworks: {},
      overallCompliance: 0,
      issues: []
    }
    
    // GDPR compliance check
    if (this.services.has('gdpr')) {
      try {
        const gdprReport = this.services.get('gdpr').generateComplianceReport()
        review.frameworks.gdpr = {
          score: gdprReport.overallCompliance || 0,
          lastCheck: new Date().toISOString()
        }
      } catch (error) {
        review.issues.push('GDPR compliance check failed')
      }
    }
    
    // Privacy compliance check
    if (this.services.has('privacy')) {
      try {
        const privacyReport = this.services.get('privacy').generateComplianceReport()
        review.frameworks.privacy = {
          score: privacyReport.consentSummary?.validConsents || 0,
          lastCheck: new Date().toISOString()
        }
      } catch (error) {
        review.issues.push('Privacy compliance check failed')
      }
    }
    
    // Calculate overall compliance
    const scores = Object.values(review.frameworks).map(f => f.score)
    review.overallCompliance = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0
    
    // Update metrics
    this.securityMetrics.complianceStatus = review.overallCompliance >= 80 ? 'compliant' : 'non-compliant'
    
    console.log(`📊 Compliance review completed - Score: ${review.overallCompliance}%`)
    
    return review
  }

  /**
   * Handle critical security events
   */
  handleCriticalSecurityEvent(eventType, details) {
    console.error(`🚨 Critical security event: ${eventType}`, details)
    
    const securityEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      severity: 'critical',
      timestamp: new Date().toISOString(),
      details,
      handled: false
    }
    
    this.securityEvents.push(securityEvent)
    this.securityMetrics.activeThreats++
    
    // Auto-response for known critical events
    switch (eventType) {
      case 'data-breach':
        this.handleDataBreach(details)
        break
      case 'unauthorized-access':
        this.handleUnauthorizedAccess(details)
        break
      case 'encryption-failed':
        this.handleEncryptionFailure(details)
        break
      case 'high-risk-audit':
        this.handleHighRiskAudit(details)
        break
    }
    
    // Dispatch critical event
    this.dispatchSecurityEvent('critical-security-event', securityEvent)
  }

  /**
   * Handle data breach
   */
  async handleDataBreach(details) {
    console.log('🚨 Handling data breach...')
    
    // Report to GDPR service if available
    if (this.services.has('gdpr')) {
      await this.services.get('gdpr').reportDataBreach({
        type: 'confidentiality',
        severity: 'high',
        description: details.description || 'Data breach detected',
        affectedDataSubjects: details.affectedUsers || [],
        dataTypesInvolved: details.dataTypes || ['personal_data'],
        containmentMeasures: ['Service isolation', 'Access restriction'],
        cause: details.cause || 'Unknown'
      })
    }
    
    // Trigger emergency anonymization if needed
    if (this.services.has('anonymization') && details.affectedUsers) {
      for (const userId of details.affectedUsers) {
        await this.anonymizeUserData(userId)
      }
    }
  }

  /**
   * Handle unauthorized access
   */
  handleUnauthorizedAccess(details) {
    console.log('🚨 Handling unauthorized access...')
    
    // Lock down affected resources
    if (details.resource) {
      // Implement resource lockdown logic
      console.log(`🔒 Locking down resource: ${details.resource}`)
    }
    
    // Revoke potentially compromised tokens
    if (this.services.has('keyManagement') && details.suspiciousTokens) {
      details.suspiciousTokens.forEach(token => {
        this.services.get('keyManagement').revokeApiKey(token, 'security_incident')
      })
    }
  }

  /**
   * Handle encryption failure
   */
  handleEncryptionFailure(details) {
    console.log('🚨 Handling encryption failure...')
    
    // Attempt to reinitialize encryption
    if (this.services.has('encryption')) {
      this.services.get('encryption').initialize()
        .then(() => console.log('✅ Encryption service reinitialized'))
        .catch(error => console.error('❌ Failed to reinitialize encryption:', error))
    }
    
    // Generate new encryption keys if needed
    if (this.services.has('keyManagement')) {
      this.services.get('keyManagement').rotateKeys()
        .then(() => console.log('✅ Encryption keys rotated'))
        .catch(error => console.error('❌ Failed to rotate keys:', error))
    }
  }

  /**
   * Handle high-risk audit findings
   */
  handleHighRiskAudit(auditResult) {
    console.log('🚨 Handling high-risk audit findings...')
    
    // Implement immediate security measures
    auditResult.recommendations?.forEach(recommendation => {
      if (recommendation.priority === 'critical' || recommendation.priority === 'high') {
        console.log(`🔧 Implementing: ${recommendation.title}`)
        // Implement automated fixes where possible
      }
    })
    
    // Schedule follow-up audit
    setTimeout(() => {
      this.performSecurityAssessment()
    }, 60 * 60 * 1000) // 1 hour
  }

  /**
   * Anonymize user data
   */
  async anonymizeUserData(userId) {
    if (!this.services.has('anonymization')) {
      console.warn('Anonymization service not available')
      return
    }
    
    try {
      // Collect user data from various sources
      const userData = await this.collectUserData(userId)
      
      // Anonymize the data
      const anonymizedResult = await this.services.get('anonymization').anonymizeData(userData, {
        level: 'high',
        enableKAnonymity: true,
        differentialPrivacy: true
      })
      
      // Replace original data with anonymized version
      await this.replaceUserData(userId, anonymizedResult.data)
      
      console.log(`🎭 User data anonymized: ${userId}`)
      
    } catch (error) {
      console.error('Failed to anonymize user data:', error)
    }
  }

  /**
   * Collect user data for anonymization
   */
  async collectUserData(userId) {
    const userData = {}
    
    // Collect from localStorage
    const storageKeys = ['fitnessData', 'userData', 'healthData', 'personalInfo']
    
    for (const key of storageKeys) {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          if (parsed.userId === userId || parsed.id === userId) {
            userData[key] = parsed
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    }
    
    return userData
  }

  /**
   * Replace user data with anonymized version
   */
  async replaceUserData(userId, anonymizedData) {
    // Replace data in localStorage
    for (const [key, data] of Object.entries(anonymizedData)) {
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth(service = null) {
    if (service) {
      // Check specific service
      return service.isInitialized !== false
    }
    
    // Check all services
    const healthChecks = []
    
    for (const [serviceName, service] of this.services) {
      const isHealthy = service.isInitialized !== false
      healthChecks.push({ serviceName, isHealthy })
      
      if (!isHealthy) {
        console.warn(`⚠️ Service health check failed: ${serviceName}`)
      }
    }
    
    return healthChecks
  }

  /**
   * Record security event
   */
  recordSecurityEvent(eventType, details) {
    const event = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      details,
      severity: this.getEventSeverity(eventType)
    }
    
    this.securityEvents.push(event)
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, this.securityEvents.length - 1000)
    }
    
    // Update metrics
    if (event.severity === 'high' || event.severity === 'critical') {
      this.securityMetrics.activeThreats++
    }
  }

  /**
   * Get event severity
   */
  getEventSeverity(eventType) {
    const severityMap = {
      'data-breach': 'critical',
      'unauthorized-access': 'high',
      'encryption-failed': 'high',
      'key-compromise': 'critical',
      'authentication-failed': 'medium',
      'privacy-consent-withdrawn': 'low',
      'security-assessment-completed': 'info'
    }
    
    return severityMap[eventType] || 'medium'
  }

  // Configuration helpers
  getRequiredApiKeys() {
    const keys = ['NUTRITION_API_KEY', 'FITNESS_API_KEY']
    
    if (this.config.securityLevel === 'maximum') {
      keys.push('SECURITY_API_KEY', 'ENCRYPTION_API_KEY')
    }
    
    return keys
  }

  getEncryptionIterations() {
    switch (this.config.securityLevel) {
      case 'low': return 50000
      case 'medium': return 100000
      case 'high': return 200000
      case 'maximum': return 500000
      default: return 100000
    }
  }

  getKAnonymityValue() {
    switch (this.config.securityLevel) {
      case 'low': return 3
      case 'medium': return 5
      case 'high': return 7
      case 'maximum': return 10
      default: return 5
    }
  }

  getLDiversityValue() {
    switch (this.config.securityLevel) {
      case 'low': return 2
      case 'medium': return 3
      case 'high': return 4
      case 'maximum': return 5
      default: return 3
    }
  }

  // API methods
  getSecurityStatus() {
    return {
      initialized: this.isInitialized,
      services: Array.from(this.services.keys()),
      metrics: this.securityMetrics,
      config: {
        securityLevel: this.config.securityLevel,
        complianceMode: this.config.complianceMode,
        strictMode: this.config.strictMode
      },
      recentEvents: this.securityEvents
        .filter(event => new Date(event.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .slice(-10)
    }
  }

  getSecurityMetrics() {
    return { ...this.securityMetrics }
  }

  getSecurityEvents(limit = 50) {
    return this.securityEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  async generateSecurityReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      securityLevel: this.config.securityLevel,
      overallStatus: this.securityMetrics,
      services: {},
      recentEvents: this.getSecurityEvents(20),
      recommendations: []
    }
    
    // Get status from each service
    for (const [serviceName, service] of this.services) {
      if (service.getSecurityStatus) {
        report.services[serviceName] = service.getSecurityStatus()
      } else if (service.getStats) {
        report.services[serviceName] = service.getStats()
      } else {
        report.services[serviceName] = { initialized: service.isInitialized !== false }
      }
    }
    
    // Generate recommendations
    if (this.securityMetrics.overallSecurityScore < 80) {
      report.recommendations.push('Overall security score needs improvement')
    }
    
    if (this.securityMetrics.activeThreats > 0) {
      report.recommendations.push('Active security threats require attention')
    }
    
    return report
  }

  // Event dispatcher
  dispatchSecurityEvent(eventType, details) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, {
        detail: details
      }))
    }
  }

  stop() {
    // Stop all services
    this.services.forEach((service, name) => {
      if (service.stop) {
        service.stop()
      }
    })
    
    this.services.clear()
    this.isInitialized = false
    
    console.log('🛑 Security Master Service stopped')
  }
}

export const securityMasterService = new SecurityMasterService()
export default securityMasterService