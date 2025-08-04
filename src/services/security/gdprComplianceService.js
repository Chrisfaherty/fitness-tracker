/**
 * GDPR Compliance Service
 * Handles European General Data Protection Regulation compliance
 */

export class GDPRComplianceService {
  constructor() {
    this.isInitialized = false
    this.dataSubjects = new Map()
    this.dataProcessingActivities = new Map()
    this.dataBreaches = []
    this.rightsRequests = new Map()
    this.config = {
      dataProtectionOfficer: null,
      supervisoryAuthority: 'National DPA',
      lawfulBasisMapping: new Map(),
      dataRetentionPolicies: new Map(),
      consentWithdrawalPeriod: 72, // hours
      breachNotificationPeriod: 72, // hours
      dataPortabilityFormats: ['JSON', 'CSV', 'XML']
    }
  }

  /**
   * Initialize GDPR compliance service
   */
  async initialize(options = {}) {
    console.log('🇪🇺 Initializing GDPR Compliance Service')
    
    this.config = {
      ...this.config,
      ...options,
      applicableRegions: options.applicableRegions || ['EU', 'EEA', 'UK'],
      organizationName: options.organizationName || 'Fitness Tracker App',
      dataControllerDetails: options.dataControllerDetails || {}
    }
    
    // Setup data processing activities
    this.initializeDataProcessingActivities()
    
    // Setup lawful basis mapping
    this.initializeLawfulBasisMapping()
    
    // Setup retention policies
    this.initializeRetentionPolicies()
    
    // Load existing records
    await this.loadGDPRRecords()
    
    // Setup periodic compliance checks
    this.setupComplianceMonitoring()
    
    this.isInitialized = true
    console.log('✅ GDPR Compliance Service initialized')
    
    return true
  }

  /**
   * Initialize data processing activities register
   */
  initializeDataProcessingActivities() {
    // Fitness Data Processing
    this.dataProcessingActivities.set('fitness-tracking', {
      id: 'fitness-tracking',
      name: 'Fitness and Health Data Processing',
      purpose: 'Health and fitness monitoring, progress tracking, personalized recommendations',
      lawfulBasis: 'consent',
      dataCategories: [
        'Physical measurements (weight, height, BMI)',
        'Activity data (steps, calories, workouts)',
        'Nutritional information',
        'Health metrics (heart rate, sleep patterns)',
        'Progress photos and measurements'
      ],
      dataSubjects: ['App users', 'Health-conscious individuals'],
      recipients: ['Internal analytics team', 'Authorized third-party services'],
      retentionPeriod: '2 years after account closure',
      securityMeasures: ['Encryption at rest', 'Encryption in transit', 'Access controls'],
      internationalTransfers: 'None',
      automatedDecisionMaking: 'Recommendation algorithms for fitness goals'
    })

    // User Account Management
    this.dataProcessingActivities.set('account-management', {
      id: 'account-management',
      name: 'User Account Management',
      purpose: 'User authentication, account administration, customer support',
      lawfulBasis: 'contract',
      dataCategories: [
        'Contact information (email, name)',
        'Authentication credentials',
        'Account preferences and settings',
        'Support communications'
      ],
      dataSubjects: ['Registered users'],
      recipients: ['Customer support team', 'Technical administrators'],
      retentionPeriod: '1 year after account closure',
      securityMeasures: ['Password hashing', 'Two-factor authentication', 'Session management'],
      internationalTransfers: 'Cloud service providers (adequacy decision)',
      automatedDecisionMaking: 'None'
    })

    // Marketing and Communications
    this.dataProcessingActivities.set('marketing', {
      id: 'marketing',
      name: 'Marketing and Communications',
      purpose: 'Product updates, promotional content, user engagement',
      lawfulBasis: 'consent',
      dataCategories: [
        'Email addresses',
        'Communication preferences',
        'Engagement history',
        'Usage patterns for personalization'
      ],
      dataSubjects: ['Consenting users'],
      recipients: ['Marketing team', 'Email service providers'],
      retentionPeriod: 'Until consent withdrawal',
      securityMeasures: ['Encrypted communications', 'Access logging'],
      internationalTransfers: 'Email service providers (standard contractual clauses)',
      automatedDecisionMaking: 'Personalized content algorithms'
    })

    // Analytics and Performance
    this.dataProcessingActivities.set('analytics', {
      id: 'analytics',
      name: 'Analytics and Performance Monitoring',
      purpose: 'App improvement, performance optimization, user experience enhancement',
      lawfulBasis: 'legitimate_interest',
      dataCategories: [
        'Usage statistics',
        'Performance metrics',
        'Error logs',
        'Feature interaction data'
      ],
      dataSubjects: ['All app users'],
      recipients: ['Development team', 'Analytics service providers'],
      retentionPeriod: '6 months',
      securityMeasures: ['Data pseudonymization', 'Aggregation', 'Access controls'],
      internationalTransfers: 'Analytics providers (adequacy decision)',
      automatedDecisionMaking: 'Performance optimization algorithms'
    })

    console.log(`📊 Registered ${this.dataProcessingActivities.size} data processing activities`)
  }

  /**
   * Initialize lawful basis mapping
   */
  initializeLawfulBasisMapping() {
    this.config.lawfulBasisMapping.set('consent', {
      article: 'Article 6(1)(a)',
      description: 'The data subject has given consent to the processing',
      requirements: ['Clear and specific consent', 'Freely given', 'Informed', 'Unambiguous', 'Withdrawable'],
      specialCategory: 'Article 9(2)(a) - Explicit consent for health data'
    })

    this.config.lawfulBasisMapping.set('contract', {
      article: 'Article 6(1)(b)',
      description: 'Processing is necessary for the performance of a contract',
      requirements: ['Contract existence', 'Necessity for performance', 'Pre-contractual measures'],
      specialCategory: null
    })

    this.config.lawfulBasisMapping.set('legitimate_interest', {
      article: 'Article 6(1)(f)',
      description: 'Processing is necessary for legitimate interests',
      requirements: ['Legitimate interest identification', 'Necessity assessment', 'Balancing test'],
      specialCategory: 'Not applicable to special categories'
    })

    this.config.lawfulBasisMapping.set('vital_interests', {
      article: 'Article 6(1)(d)',
      description: 'Processing is necessary to protect vital interests',
      requirements: ['Life-threatening situation', 'No other means available'],
      specialCategory: 'Article 9(2)(c) - Vital interests'
    })
  }

  /**
   * Initialize data retention policies
   */
  initializeRetentionPolicies() {
    this.config.dataRetentionPolicies.set('fitness-data', {
      category: 'fitness-data',
      retentionPeriod: 730, // 2 years
      activeRetentionPeriod: null, // While account is active
      basis: 'User consent and legitimate interest',
      deletionTriggers: ['Account closure', 'Consent withdrawal', 'Inactivity > 3 years'],
      archivalRules: 'Anonymize after 1 year of inactivity'
    })

    this.config.dataRetentionPolicies.set('account-data', {
      category: 'account-data',
      retentionPeriod: 365, // 1 year after closure
      activeRetentionPeriod: null,
      basis: 'Contract performance and legal obligations',
      deletionTriggers: ['Account closure + 1 year', 'User request'],
      archivalRules: 'Minimal data retention for legal compliance'
    })

    this.config.dataRetentionPolicies.set('marketing-data', {
      category: 'marketing-data',
      retentionPeriod: null, // Until withdrawal
      activeRetentionPeriod: null,
      basis: 'Consent',
      deletionTriggers: ['Consent withdrawal', 'Account closure'],
      archivalRules: 'Immediate deletion upon withdrawal'
    })

    this.config.dataRetentionPolicies.set('analytics-data', {
      category: 'analytics-data',
      retentionPeriod: 180, // 6 months
      activeRetentionPeriod: null,
      basis: 'Legitimate interest',
      deletionTriggers: ['6 months elapsed', 'User objection'],
      archivalRules: 'Anonymize and aggregate'
    })
  }

  /**
   * Register data subject
   */
  async registerDataSubject(userId, subjectData) {
    const dataSubject = {
      id: userId,
      registeredAt: new Date().toISOString(),
      contactDetails: subjectData.contactDetails || {},
      jurisdiction: this.detectJurisdiction(subjectData),
      consentStatus: new Map(),
      processingActivities: new Set(),
      rightsExercised: [],
      dataExports: [],
      lastActivity: new Date().toISOString()
    }

    this.dataSubjects.set(userId, dataSubject)
    await this.saveGDPRRecords()

    console.log(`👤 Registered data subject: ${userId}`)
    return dataSubject
  }

  /**
   * Handle data subject rights request
   */
  async handleRightsRequest(userId, requestType, details = {}) {
    const validRights = [
      'access', 'rectification', 'erasure', 'restriction', 
      'portability', 'objection', 'withdraw_consent'
    ]

    if (!validRights.includes(requestType)) {
      throw new Error(`Invalid rights request type: ${requestType}`)
    }

    const request = {
      id: `req-${userId}-${Date.now()}`,
      userId,
      requestType,
      submittedAt: new Date().toISOString(),
      status: 'received',
      details,
      responseDeadline: this.calculateResponseDeadline(),
      processingLog: []
    }

    this.rightsRequests.set(request.id, request)
    await this.saveGDPRRecords()

    console.log(`📨 Received ${requestType} request from ${userId}`)

    // Process the request
    await this.processRightsRequest(request)

    return request
  }

  /**
   * Process data subject rights request
   */
  async processRightsRequest(request) {
    switch (request.requestType) {
      case 'access':
        await this.processAccessRequest(request)
        break
      case 'rectification':
        await this.processRectificationRequest(request)
        break
      case 'erasure':
        await this.processErasureRequest(request)
        break
      case 'restriction':
        await this.processRestrictionRequest(request)
        break
      case 'portability':
        await this.processPortabilityRequest(request)
        break
      case 'objection':
        await this.processObjectionRequest(request)
        break
      case 'withdraw_consent':
        await this.processConsentWithdrawal(request)
        break
    }
  }

  /**
   * Process right of access request (Article 15)
   */
  async processAccessRequest(request) {
    this.addToProcessingLog(request, 'Processing access request')

    const dataSubject = this.dataSubjects.get(request.userId)
    if (!dataSubject) {
      throw new Error(`Data subject not found: ${request.userId}`)
    }

    // Collect all personal data
    const personalData = await this.collectPersonalData(request.userId)
    
    // Create comprehensive data access report
    const accessReport = {
      dataSubject: {
        id: dataSubject.id,
        registeredAt: dataSubject.registeredAt,
        jurisdiction: dataSubject.jurisdiction
      },
      processingActivities: Array.from(dataSubject.processingActivities).map(activityId => {
        const activity = this.dataProcessingActivities.get(activityId)
        return {
          activity: activity.name,
          purpose: activity.purpose,
          lawfulBasis: activity.lawfulBasis,
          dataCategories: activity.dataCategories,
          retentionPeriod: activity.retentionPeriod
        }
      }),
      personalData,
      consentStatus: Object.fromEntries(dataSubject.consentStatus),
      rightsExercised: dataSubject.rightsExercised,
      dataExports: dataSubject.dataExports,
      thirdPartyRecipients: this.getThirdPartyRecipients(request.userId),
      retentionSchedule: this.getRetentionSchedule(request.userId)
    }

    request.response = accessReport
    request.status = 'completed'
    request.completedAt = new Date().toISOString()

    this.addToProcessingLog(request, 'Access request completed')
    await this.saveGDPRRecords()
  }

  /**
   * Process right to rectification request (Article 16)
   */
  async processRectificationRequest(request) {
    this.addToProcessingLog(request, 'Processing rectification request')

    const { corrections } = request.details
    if (!corrections) {
      throw new Error('No corrections specified in rectification request')
    }

    // Apply corrections
    for (const [field, correctedValue] of Object.entries(corrections)) {
      await this.correctPersonalData(request.userId, field, correctedValue)
    }

    request.status = 'completed'
    request.completedAt = new Date().toISOString()
    request.response = {
      correctedFields: Object.keys(corrections),
      correctionDate: new Date().toISOString()
    }

    this.addToProcessingLog(request, 'Rectification completed')
    await this.saveGDPRRecords()
  }

  /**
   * Process right to erasure request (Article 17)
   */
  async processErasureRequest(request) {
    this.addToProcessingLog(request, 'Processing erasure request')

    const { reason, specificData } = request.details
    
    // Check if erasure is applicable
    const erasureApplicable = this.checkErasureApplicability(request.userId, reason)
    
    if (!erasureApplicable.allowed) {
      request.status = 'rejected'
      request.rejectionReason = erasureApplicable.reason
      this.addToProcessingLog(request, `Erasure rejected: ${erasureApplicable.reason}`)
      await this.saveGDPRRecords()
      return
    }

    // Perform erasure
    if (specificData) {
      await this.eraseSpecificData(request.userId, specificData)
    } else {
      await this.eraseAllPersonalData(request.userId)
    }

    request.status = 'completed'
    request.completedAt = new Date().toISOString()
    request.response = {
      erasureDate: new Date().toISOString(),
      dataErased: specificData || 'all_personal_data'
    }

    this.addToProcessingLog(request, 'Erasure completed')
    await this.saveGDPRRecords()
  }

  /**
   * Process right to data portability request (Article 20)
   */
  async processPortabilityRequest(request) {
    this.addToProcessingLog(request, 'Processing portability request')

    const { format = 'JSON', includeMetadata = true } = request.details
    
    if (!this.config.dataPortabilityFormats.includes(format)) {
      throw new Error(`Unsupported export format: ${format}`)
    }

    // Collect portable data (consent and contract based)
    const portableData = await this.collectPortableData(request.userId)
    
    // Format data according to request
    const formattedData = this.formatDataForPortability(portableData, format, includeMetadata)
    
    // Create export record
    const exportRecord = {
      id: `exp-${request.userId}-${Date.now()}`,
      userId: request.userId,
      format,
      exportedAt: new Date().toISOString(),
      dataSize: JSON.stringify(formattedData).length,
      requestId: request.id
    }

    // Update data subject record
    const dataSubject = this.dataSubjects.get(request.userId)
    if (dataSubject) {
      dataSubject.dataExports.push(exportRecord)
    }

    request.status = 'completed'
    request.completedAt = new Date().toISOString()
    request.response = {
      exportRecord,
      downloadUrl: `data:application/json;base64,${btoa(JSON.stringify(formattedData))}`
    }

    this.addToProcessingLog(request, 'Portability request completed')
    await this.saveGDPRRecords()
  }

  /**
   * Check if erasure is applicable
   */
  checkErasureApplicability(userId, reason) {
    const validReasons = [
      'no_longer_necessary',
      'consent_withdrawn',
      'unlawful_processing',
      'legal_obligation',
      'child_consent'
    ]

    if (!validReasons.includes(reason)) {
      return { allowed: false, reason: 'Invalid erasure reason' }
    }

    // Check for legal obligations to retain data
    const legalObligations = this.checkLegalObligations(userId)
    if (legalObligations.length > 0) {
      return { 
        allowed: false, 
        reason: `Legal obligations require data retention: ${legalObligations.join(', ')}` 
      }
    }

    // Check for legitimate interests
    const legitimateInterests = this.checkLegitimateInterests(userId)
    if (legitimateInterests.length > 0) {
      return { 
        allowed: false, 
        reason: `Legitimate interests override erasure: ${legitimateInterests.join(', ')}` 
      }
    }

    return { allowed: true }
  }

  /**
   * Report data breach
   */
  async reportDataBreach(breachDetails) {
    const breach = {
      id: `breach-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      type: breachDetails.type, // 'confidentiality', 'availability', 'integrity'
      severity: breachDetails.severity, // 'low', 'medium', 'high', 'critical'
      description: breachDetails.description,
      affectedDataSubjects: breachDetails.affectedDataSubjects || [],
      dataTypesInvolved: breachDetails.dataTypesInvolved || [],
      containmentMeasures: breachDetails.containmentMeasures || [],
      notificationStatus: {
        supervisoryAuthority: false,
        dataSubjects: false,
        supervisoryDeadline: this.calculateBreachNotificationDeadline(),
        subjectNotificationRequired: this.assessSubjectNotificationRequirement(breachDetails)
      },
      investigation: {
        cause: breachDetails.cause || 'Under investigation',
        timeline: breachDetails.timeline || [],
        remediationActions: breachDetails.remediationActions || []
      }
    }

    this.dataBreaches.push(breach)
    await this.saveGDPRRecords()

    console.log(`🚨 Data breach reported: ${breach.id}`)

    // Auto-notify if required
    if (breach.notificationStatus.subjectNotificationRequired) {
      await this.notifyAffectedDataSubjects(breach)
    }

    return breach
  }

  /**
   * Generate GDPR compliance report
   */
  generateComplianceReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      organization: this.config.organizationName,
      reportingPeriod: this.getReportingPeriod(),
      
      dataProcessingActivities: {
        total: this.dataProcessingActivities.size,
        byLawfulBasis: this.getActivitiesByLawfulBasis(),
        byCategory: this.getActivitiesByCategory()
      },
      
      dataSubjects: {
        total: this.dataSubjects.size,
        byJurisdiction: this.getSubjectsByJurisdiction(),
        activeConsents: this.getActiveConsents()
      },
      
      rightsRequests: {
        total: this.rightsRequests.size,
        byType: this.getRightsRequestsByType(),
        responseTimeCompliance: this.calculateResponseTimeCompliance(),
        pending: Array.from(this.rightsRequests.values()).filter(r => r.status === 'received').length
      },
      
      dataBreaches: {
        total: this.dataBreaches.length,
        bySeverity: this.getBreachesBySeverity(),
        notificationCompliance: this.calculateBreachNotificationCompliance()
      },
      
      retentionCompliance: this.assessRetentionCompliance(),
      
      recommendations: this.generateComplianceRecommendations()
    }

    return report
  }

  /**
   * Conduct privacy impact assessment
   */
  async conductPrivacyImpactAssessment(activityId, assessmentDetails) {
    const activity = this.dataProcessingActivities.get(activityId)
    if (!activity) {
      throw new Error(`Processing activity not found: ${activityId}`)
    }

    const pia = {
      id: `pia-${activityId}-${Date.now()}`,
      activityId,
      conductedAt: new Date().toISOString(),
      assessor: assessmentDetails.assessor,
      
      // Risk assessment
      riskAssessment: {
        dataMinimization: assessmentDetails.riskAssessment?.dataMinimization || 'medium',
        consent: assessmentDetails.riskAssessment?.consent || 'medium',
        securityMeasures: assessmentDetails.riskAssessment?.securityMeasures || 'medium',
        internationalTransfers: assessmentDetails.riskAssessment?.internationalTransfers || 'low',
        automatedDecisionMaking: assessmentDetails.riskAssessment?.automatedDecisionMaking || 'low'
      },
      
      // Mitigation measures
      mitigationMeasures: assessmentDetails.mitigationMeasures || [],
      
      // Overall assessment
      overallRisk: this.calculateOverallRisk(assessmentDetails.riskAssessment),
      dpoConsultation: assessmentDetails.dpoConsultation || false,
      supervisoryConsultation: assessmentDetails.supervisoryConsultation || false,
      
      // Recommendations
      recommendations: assessmentDetails.recommendations || []
    }

    // Store PIA
    activity.privacyImpactAssessment = pia
    await this.saveGDPRRecords()

    console.log(`📋 Privacy Impact Assessment completed for: ${activityId}`)
    return pia
  }

  // Helper methods

  detectJurisdiction(subjectData) {
    // Simple jurisdiction detection based on provided data
    const countryCode = subjectData.countryCode || subjectData.country
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
    
    if (euCountries.includes(countryCode)) {
      return 'EU'
    } else if (countryCode === 'UK') {
      return 'UK'
    } else {
      return 'NON_EU'
    }
  }

  calculateResponseDeadline() {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30) // 1 month from request
    return deadline.toISOString()
  }

  calculateBreachNotificationDeadline() {
    const deadline = new Date()
    deadline.setHours(deadline.getHours() + 72) // 72 hours from detection
    return deadline.toISOString()
  }

  addToProcessingLog(request, message) {
    request.processingLog.push({
      timestamp: new Date().toISOString(),
      message
    })
  }

  async collectPersonalData(userId) {
    // Collect all personal data for the user across different storage locations
    const data = {}
    
    // Fitness data
    const fitnessData = localStorage.getItem('fitnessData')
    if (fitnessData) {
      const parsed = JSON.parse(fitnessData)
      data.fitness = this.filterUserData(parsed, userId)
    }
    
    // User profile data
    const userData = localStorage.getItem('userData')
    if (userData) {
      const parsed = JSON.parse(userData)
      data.profile = this.filterUserData(parsed, userId)
    }
    
    return data
  }

  filterUserData(data, userId) {
    // Filter data to only include data belonging to the specific user
    // This is a simplified implementation
    return data
  }

  async collectPortableData(userId) {
    // Collect only data that is portable under GDPR (consent and contract basis)
    const allData = await this.collectPersonalData(userId)
    
    // Filter based on lawful basis
    const portableData = {}
    for (const [category, data] of Object.entries(allData)) {
      const activity = this.findActivityForDataCategory(category)
      if (activity && ['consent', 'contract'].includes(activity.lawfulBasis)) {
        portableData[category] = data
      }
    }
    
    return portableData
  }

  formatDataForPortability(data, format, includeMetadata) {
    switch (format) {
      case 'JSON':
        return includeMetadata ? {
          metadata: {
            exportedAt: new Date().toISOString(),
            format: 'JSON',
            version: '1.0'
          },
          data
        } : data
      
      case 'CSV':
        // Convert to CSV format (simplified)
        return this.convertToCSV(data)
      
      case 'XML':
        // Convert to XML format (simplified)
        return this.convertToXML(data)
      
      default:
        return data
    }
  }

  // Data persistence
  async loadGDPRRecords() {
    try {
      const saved = localStorage.getItem('gdprRecords')
      if (saved) {
        const data = JSON.parse(saved)
        
        if (data.dataSubjects) {
          data.dataSubjects.forEach(subject => {
            this.dataSubjects.set(subject.id, subject)
          })
        }
        
        if (data.rightsRequests) {
          data.rightsRequests.forEach(request => {
            this.rightsRequests.set(request.id, request)
          })
        }
        
        if (data.dataBreaches) {
          this.dataBreaches = data.dataBreaches
        }
      }
    } catch (error) {
      console.error('Failed to load GDPR records:', error)
    }
  }

  async saveGDPRRecords() {
    try {
      const data = {
        dataSubjects: Array.from(this.dataSubjects.values()),
        rightsRequests: Array.from(this.rightsRequests.values()),
        dataBreaches: this.dataBreaches,
        lastUpdated: new Date().toISOString()
      }
      
      localStorage.setItem('gdprRecords', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save GDPR records:', error)
    }
  }

  stop() {
    this.isInitialized = false
    console.log('🛑 GDPR Compliance Service stopped')
  }
}

export const gdprComplianceService = new GDPRComplianceService()
export default gdprComplianceService