/**
 * Data Anonymization Service
 * Handles data anonymization, pseudonymization, and privacy-preserving analytics
 */

export class DataAnonymizationService {
  constructor() {
    this.isInitialized = false
    this.anonymizationStrategies = new Map()
    this.pseudonymizationKeys = new Map()
    this.anonymizationRules = new Map()
    this.config = {
      defaultAnonymizationLevel: 'high',
      retentionAfterAnonymization: 365, // days
      enableDifferentialPrivacy: true,
      privacyBudget: 1.0,
      kAnonymity: 5,
      lDiversity: 3
    }
    this.sensitiveFields = new Set([
      'email', 'phone', 'address', 'name', 'ssn', 'ip_address',
      'device_id', 'user_id', 'location', 'biometric_data',
      'medical_data', 'financial_data', 'personal_identifier'
    ])
    this.quasiIdentifiers = new Set([
      'age', 'gender', 'zip_code', 'birth_date', 'weight',
      'height', 'occupation', 'education_level'
    ])
  }

  /**
   * Initialize data anonymization service
   */
  async initialize(options = {}) {
    console.log('🎭 Initializing Data Anonymization Service')
    
    this.config = {
      ...this.config,
      ...options,
      customSensitiveFields: options.customSensitiveFields || [],
      customQuasiIdentifiers: options.customQuasiIdentifiers || []
    }
    
    // Add custom sensitive fields
    this.config.customSensitiveFields.forEach(field => {
      this.sensitiveFields.add(field.toLowerCase())
    })
    
    this.config.customQuasiIdentifiers.forEach(field => {
      this.quasiIdentifiers.add(field.toLowerCase())
    })
    
    // Initialize anonymization strategies
    this.initializeAnonymizationStrategies()
    
    // Initialize pseudonymization keys
    await this.initializePseudonymizationKeys()
    
    // Setup anonymization rules
    this.initializeAnonymizationRules()
    
    this.isInitialized = true
    console.log('✅ Data Anonymization Service initialized')
    
    return true
  }

  /**
   * Initialize anonymization strategies
   */
  initializeAnonymizationStrategies() {
    // Direct identifier removal
    this.anonymizationStrategies.set('removal', {
      name: 'Complete Removal',
      description: 'Remove field entirely',
      apply: (value, field, config) => undefined
    })
    
    // Generalization
    this.anonymizationStrategies.set('generalization', {
      name: 'Generalization',
      description: 'Replace with generalized value',
      apply: (value, field, config) => this.generalizeValue(value, field, config)
    })
    
    // Suppression
    this.anonymizationStrategies.set('suppression', {
      name: 'Suppression',
      description: 'Replace with placeholder',
      apply: (value, field, config) => this.suppressValue(value, field, config)
    })
    
    // Perturbation (for numeric values)
    this.anonymizationStrategies.set('perturbation', {
      name: 'Perturbation',
      description: 'Add statistical noise',
      apply: (value, field, config) => this.perturbValue(value, field, config)
    })
    
    // Hash-based pseudonymization
    this.anonymizationStrategies.set('pseudonymization', {
      name: 'Pseudonymization',
      description: 'Replace with pseudonym',
      apply: (value, field, config) => this.pseudonymizeValue(value, field, config)
    })
    
    // Anonymization for dates
    this.anonymizationStrategies.set('date_generalization', {
      name: 'Date Generalization',
      description: 'Generalize date precision',
      apply: (value, field, config) => this.generalizeDateValue(value, field, config)
    })
    
    // Location anonymization
    this.anonymizationStrategies.set('location_generalization', {
      name: 'Location Generalization',
      description: 'Reduce location precision',
      apply: (value, field, config) => this.generalizeLocationValue(value, field, config)
    })
    
    console.log(`🎭 Initialized ${this.anonymizationStrategies.size} anonymization strategies`)
  }

  /**
   * Initialize pseudonymization keys
   */
  async initializePseudonymizationKeys() {
    const keyTypes = ['user', 'session', 'device', 'location']
    
    for (const keyType of keyTypes) {
      const key = await this.generatePseudonymizationKey(keyType)
      this.pseudonymizationKeys.set(keyType, key)
    }
  }

  /**
   * Generate pseudonymization key
   */
  async generatePseudonymizationKey(keyType) {
    // Check if key already exists
    const existingKey = sessionStorage.getItem(`_pk_anon_${keyType}`)
    if (existingKey) {
      return existingKey
    }
    
    // Generate new key
    const keyData = new Uint8Array(32)
    crypto.getRandomValues(keyData)
    const key = btoa(String.fromCharCode(...keyData))
    
    // Store temporarily
    sessionStorage.setItem(`_pk_anon_${keyType}`, key)
    
    return key
  }

  /**
   * Initialize anonymization rules
   */
  initializeAnonymizationRules() {
    // Rules for direct identifiers
    this.sensitiveFields.forEach(field => {
      this.anonymizationRules.set(field, {
        strategy: 'removal',
        level: 'high',
        required: true
      })
    })
    
    // Rules for quasi-identifiers
    this.quasiIdentifiers.forEach(field => {
      this.anonymizationRules.set(field, {
        strategy: 'generalization',
        level: 'medium',
        required: false
      })
    })
    
    // Specific field rules
    this.anonymizationRules.set('age', {
      strategy: 'generalization',
      level: 'low',
      config: { ranges: [18, 25, 35, 45, 55, 65, 100] }
    })
    
    this.anonymizationRules.set('weight', {
      strategy: 'perturbation',
      level: 'low',
      config: { noise: 0.05 } // 5% noise
    })
    
    this.anonymizationRules.set('height', {
      strategy: 'perturbation',
      level: 'low',
      config: { noise: 0.02 } // 2% noise
    })
    
    this.anonymizationRules.set('zip_code', {
      strategy: 'generalization',
      level: 'medium',
      config: { precision: 3 } // Keep first 3 digits
    })
    
    this.anonymizationRules.set('birth_date', {
      strategy: 'date_generalization',
      level: 'medium',
      config: { precision: 'year' }
    })
    
    this.anonymizationRules.set('location', {
      strategy: 'location_generalization',
      level: 'high',
      config: { precision: 1000 } // 1km precision
    })
  }

  /**
   * Anonymize dataset
   */
  async anonymizeData(data, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Data anonymization service not initialized')
    }
    
    const config = {
      level: options.level || this.config.defaultAnonymizationLevel,
      preserveStructure: options.preserveStructure !== false,
      enableKAnonymity: options.enableKAnonymity !== false,
      enableLDiversity: options.enableLDiversity !== false,
      differentialPrivacy: options.differentialPrivacy !== false,
      ...options
    }
    
    console.log(`🎭 Anonymizing data with level: ${config.level}`)
    
    let anonymizedData
    
    if (Array.isArray(data)) {
      // Dataset anonymization
      anonymizedData = await this.anonymizeDataset(data, config)
    } else if (typeof data === 'object' && data !== null) {
      // Single record anonymization
      anonymizedData = await this.anonymizeRecord(data, config)
    } else {
      // Primitive value
      anonymizedData = await this.anonymizeValue(data, 'unknown', config)
    }
    
    // Apply privacy-preserving techniques
    if (config.enableKAnonymity) {
      anonymizedData = await this.applyKAnonymity(anonymizedData, config)
    }
    
    if (config.enableLDiversity) {
      anonymizedData = await this.applyLDiversity(anonymizedData, config)
    }
    
    if (config.differentialPrivacy) {
      anonymizedData = await this.applyDifferentialPrivacy(anonymizedData, config)
    }
    
    return {
      data: anonymizedData,
      anonymizationMetadata: {
        originalSize: this.calculateDataSize(data),
        anonymizedSize: this.calculateDataSize(anonymizedData),
        level: config.level,
        techniques: this.getAppliedTechniques(config),
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Anonymize dataset (array of records)
   */
  async anonymizeDataset(dataset, config) {
    const anonymizedDataset = []
    
    for (const record of dataset) {
      const anonymizedRecord = await this.anonymizeRecord(record, config)
      if (anonymizedRecord !== null) {
        anonymizedDataset.push(anonymizedRecord)
      }
    }
    
    return anonymizedDataset
  }

  /**
   * Anonymize single record
   */
  async anonymizeRecord(record, config) {
    const anonymizedRecord = {}
    
    for (const [field, value] of Object.entries(record)) {
      if (value === null || value === undefined) {
        anonymizedRecord[field] = value
        continue
      }
      
      const anonymizedValue = await this.anonymizeField(field, value, config)
      
      // Only include field if not completely removed
      if (anonymizedValue !== undefined) {
        anonymizedRecord[field] = anonymizedValue
      }
    }
    
    return anonymizedRecord
  }

  /**
   * Anonymize specific field
   */
  async anonymizeField(fieldName, value, config) {
    const lowerFieldName = fieldName.toLowerCase()
    const rule = this.anonymizationRules.get(lowerFieldName)
    
    if (!rule) {
      // No specific rule, check if it's a sensitive field
      if (this.isSensitiveField(fieldName)) {
        return this.anonymizeValue(value, fieldName, { 
          strategy: 'removal', 
          level: config.level 
        })
      }
      
      // Return as-is if not sensitive
      return value
    }
    
    // Apply anonymization rule
    return this.anonymizeValue(value, fieldName, {
      strategy: rule.strategy,
      level: config.level,
      config: rule.config
    })
  }

  /**
   * Anonymize single value
   */
  async anonymizeValue(value, fieldName, config) {
    const strategy = this.anonymizationStrategies.get(config.strategy)
    if (!strategy) {
      console.warn(`Unknown anonymization strategy: ${config.strategy}`)
      return value
    }
    
    try {
      return strategy.apply(value, fieldName, config)
    } catch (error) {
      console.error(`Anonymization failed for field ${fieldName}:`, error)
      return undefined
    }
  }

  /**
   * Generalize value based on field type
   */
  generalizeValue(value, field, config) {
    const fieldType = this.detectFieldType(value, field)
    
    switch (fieldType) {
      case 'age':
        return this.generalizeAge(value, config.config?.ranges)
      case 'numeric':
        return this.generalizeNumeric(value, config.config?.precision)
      case 'categorical':
        return this.generalizeCategorical(value, config.config?.hierarchy)
      case 'text':
        return this.generalizeText(value, config.config?.length)
      default:
        return '*'
    }
  }

  /**
   * Generalize age into ranges
   */
  generalizeAge(age, ranges = [18, 25, 35, 45, 55, 65, 100]) {
    const numAge = parseInt(age)
    if (isNaN(numAge)) return 'unknown'
    
    for (let i = 0; i < ranges.length - 1; i++) {
      if (numAge >= ranges[i] && numAge < ranges[i + 1]) {
        return `${ranges[i]}-${ranges[i + 1] - 1}`
      }
    }
    
    return `${ranges[ranges.length - 1]}+`
  }

  /**
   * Generalize numeric value
   */
  generalizeNumeric(value, precision = 1) {
    const num = parseFloat(value)
    if (isNaN(num)) return 'unknown'
    
    return Math.round(num / precision) * precision
  }

  /**
   * Generalize categorical value
   */
  generalizeCategorical(value, hierarchy = null) {
    if (hierarchy && hierarchy[value]) {
      return hierarchy[value]
    }
    
    // Default generalization
    return 'other'
  }

  /**
   * Generalize text value
   */
  generalizeText(value, maxLength = 10) {
    if (typeof value !== 'string') return 'text'
    
    if (value.length <= maxLength) {
      return value.charAt(0) + '*'.repeat(value.length - 1)
    }
    
    return value.substring(0, maxLength) + '...'
  }

  /**
   * Suppress value with placeholder
   */
  suppressValue(value, field, config) {
    const suppressionLevel = config.level || 'medium'
    
    switch (suppressionLevel) {
      case 'low':
        return this.partialSuppression(value)
      case 'medium':
        return '***'
      case 'high':
        return undefined
      default:
        return '***'
    }
  }

  /**
   * Partial suppression (show first/last characters)
   */
  partialSuppression(value) {
    if (typeof value !== 'string' || value.length < 4) {
      return '***'
    }
    
    const firstChar = value.charAt(0)
    const lastChar = value.charAt(value.length - 1)
    const middleLength = value.length - 2
    
    return firstChar + '*'.repeat(middleLength) + lastChar
  }

  /**
   * Add statistical noise to numeric values
   */
  perturbValue(value, field, config) {
    const num = parseFloat(value)
    if (isNaN(num)) return value
    
    const noiseLevel = config.config?.noise || 0.05
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * Math.abs(num)
    
    const perturbedValue = num + noise
    
    // Ensure positive values remain positive
    if (num > 0 && perturbedValue < 0) {
      return Math.abs(perturbedValue)
    }
    
    return Math.round(perturbedValue * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Pseudonymize value using hash
   */
  async pseudonymizeValue(value, field, config) {
    const keyType = this.determineKeyType(field)
    const key = this.pseudonymizationKeys.get(keyType) || this.pseudonymizationKeys.get('user')
    
    const encoder = new TextEncoder()
    const data = encoder.encode(value + key)
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)
    const hashHex = Array.from(hashArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
    
    // Return truncated hash for readability
    return hashHex.substring(0, 16)
  }

  /**
   * Generalize date value
   */
  generalizeDateValue(value, field, config) {
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'unknown'
    
    const precision = config.config?.precision || 'month'
    
    switch (precision) {
      case 'year':
        return date.getFullYear().toString()
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        return `${date.getFullYear()}-Q${quarter}`
      default:
        return date.toISOString().split('T')[0] // YYYY-MM-DD
    }
  }

  /**
   * Generalize location value
   */
  generalizeLocationValue(value, field, config) {
    if (typeof value === 'object' && value.lat && value.lng) {
      // Coordinate-based location
      const precision = config.config?.precision || 1000 // meters
      const factor = precision / 111000 // Rough conversion to degrees
      
      return {
        lat: Math.round(value.lat / factor) * factor,
        lng: Math.round(value.lng / factor) * factor
      }
    }
    
    if (typeof value === 'string') {
      // Address-based location
      const parts = value.split(',')
      if (parts.length > 2) {
        // Keep only city and state/country
        return parts.slice(-2).join(',').trim()
      }
    }
    
    return 'location_generalized'
  }

  /**
   * Apply k-anonymity
   */
  async applyKAnonymity(dataset, config) {
    if (!Array.isArray(dataset)) return dataset
    
    const k = config.kAnonymity || this.config.kAnonymity
    const quasiIdentifierFields = this.getQuasiIdentifierFields(dataset)
    
    // Group records by quasi-identifier combinations
    const groups = this.groupByQuasiIdentifiers(dataset, quasiIdentifierFields)
    
    // Filter out groups with less than k records
    const anonymizedDataset = []
    
    for (const group of groups) {
      if (group.length >= k) {
        anonymizedDataset.push(...group)
      } else {
        // Further generalize or suppress small groups
        const generalizedGroup = await this.generalizeSmallGroup(group, quasiIdentifierFields)
        anonymizedDataset.push(...generalizedGroup)
      }
    }
    
    return anonymizedDataset
  }

  /**
   * Apply l-diversity
   */
  async applyLDiversity(dataset, config) {
    if (!Array.isArray(dataset)) return dataset
    
    const l = config.lDiversity || this.config.lDiversity
    const sensitiveAttributes = this.getSensitiveAttributes(dataset)
    
    // Check l-diversity for each sensitive attribute
    const groups = this.groupByQuasiIdentifiers(dataset, this.getQuasiIdentifierFields(dataset))
    const diverseDataset = []
    
    for (const group of groups) {
      let isDiverse = true
      
      for (const sensitiveAttr of sensitiveAttributes) {
        const distinctValues = new Set(group.map(record => record[sensitiveAttr]))
        if (distinctValues.size < l) {
          isDiverse = false
          break
        }
      }
      
      if (isDiverse) {
        diverseDataset.push(...group)
      }
      // Small groups that don't meet l-diversity are filtered out
    }
    
    return diverseDataset
  }

  /**
   * Apply differential privacy
   */
  async applyDifferentialPrivacy(data, config) {
    if (!config.differentialPrivacy || !this.config.enableDifferentialPrivacy) {
      return data
    }
    
    const epsilon = config.privacyBudget || this.config.privacyBudget
    
    if (Array.isArray(data)) {
      // Apply noise to aggregate statistics
      return this.addDifferentialPrivacyNoise(data, epsilon)
    }
    
    return data
  }

  /**
   * Add differential privacy noise
   */
  addDifferentialPrivacyNoise(dataset, epsilon) {
    // This is a simplified implementation
    // In production, you'd use proper differential privacy mechanisms
    
    const noisyDataset = dataset.map(record => {
      const noisyRecord = { ...record }
      
      // Add Laplace noise to numeric fields
      for (const [field, value] of Object.entries(noisyRecord)) {
        if (typeof value === 'number' && this.quasiIdentifiers.has(field.toLowerCase())) {
          const scale = 1 / epsilon
          const noise = this.sampleLaplaceNoise(0, scale)
          noisyRecord[field] = Math.max(0, value + noise) // Ensure non-negative
        }
      }
      
      return noisyRecord
    })
    
    return noisyDataset
  }

  /**
   * Sample from Laplace distribution
   */
  sampleLaplaceNoise(mu, scale) {
    const u = Math.random() - 0.5
    return mu - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  }

  /**
   * Check if field is sensitive
   */
  isSensitiveField(fieldName) {
    const lowerField = fieldName.toLowerCase()
    return this.sensitiveFields.has(lowerField) || 
           this.isFieldNameSensitive(lowerField)
  }

  /**
   * Check if field name indicates sensitivity
   */
  isFieldNameSensitive(fieldName) {
    const sensitivePatterns = [
      /personal/i, /private/i, /sensitive/i, /confidential/i,
      /id$/i, /identifier/i, /ssn/i, /social/i,
      /phone/i, /email/i, /address/i, /location/i,
      /medical/i, /health/i, /biometric/i, /financial/i
    ]
    
    return sensitivePatterns.some(pattern => pattern.test(fieldName))
  }

  /**
   * Detect field type
   */
  detectFieldType(value, fieldName) {
    const lowerField = fieldName.toLowerCase()
    
    if (lowerField.includes('age')) return 'age'
    if (typeof value === 'number') return 'numeric'
    if (typeof value === 'string') {
      if (value.length < 50) return 'categorical'
      return 'text'
    }
    
    return 'unknown'
  }

  /**
   * Determine key type for pseudonymization
   */
  determineKeyType(fieldName) {
    const lowerField = fieldName.toLowerCase()
    
    if (lowerField.includes('user') || lowerField.includes('person')) return 'user'
    if (lowerField.includes('session')) return 'session'
    if (lowerField.includes('device')) return 'device'
    if (lowerField.includes('location')) return 'location'
    
    return 'user'
  }

  /**
   * Get quasi-identifier fields from dataset
   */
  getQuasiIdentifierFields(dataset) {
    if (!Array.isArray(dataset) || dataset.length === 0) return []
    
    const sampleRecord = dataset[0]
    return Object.keys(sampleRecord).filter(field => 
      this.quasiIdentifiers.has(field.toLowerCase())
    )
  }

  /**
   * Get sensitive attributes from dataset
   */
  getSensitiveAttributes(dataset) {
    if (!Array.isArray(dataset) || dataset.length === 0) return []
    
    const sampleRecord = dataset[0]
    return Object.keys(sampleRecord).filter(field => 
      this.isSensitiveField(field)
    )
  }

  /**
   * Group records by quasi-identifiers
   */
  groupByQuasiIdentifiers(dataset, quasiIdentifierFields) {
    const groups = new Map()
    
    for (const record of dataset) {
      const key = quasiIdentifierFields
        .map(field => record[field])
        .join('|')
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      
      groups.get(key).push(record)
    }
    
    return Array.from(groups.values())
  }

  /**
   * Generalize small groups that don't meet k-anonymity
   */
  async generalizeSmallGroup(group, quasiIdentifierFields) {
    // Apply additional generalization to merge with other groups
    const generalizedGroup = []
    
    for (const record of group) {
      const generalizedRecord = { ...record }
      
      // Further generalize quasi-identifiers
      for (const field of quasiIdentifierFields) {
        if (generalizedRecord[field] !== undefined) {
          generalizedRecord[field] = await this.anonymizeValue(
            generalizedRecord[field], 
            field, 
            { strategy: 'generalization', level: 'high' }
          )
        }
      }
      
      generalizedGroup.push(generalizedRecord)
    }
    
    return generalizedGroup
  }

  /**
   * Calculate data size (number of records or characters)
   */
  calculateDataSize(data) {
    if (Array.isArray(data)) return data.length
    if (typeof data === 'string') return data.length
    if (typeof data === 'object' && data !== null) return Object.keys(data).length
    return 1
  }

  /**
   * Get applied anonymization techniques
   */
  getAppliedTechniques(config) {
    const techniques = []
    
    if (config.enableKAnonymity) techniques.push('k-anonymity')
    if (config.enableLDiversity) techniques.push('l-diversity')
    if (config.differentialPrivacy) techniques.push('differential-privacy')
    
    return techniques
  }

  /**
   * Create anonymized export
   */
  async createAnonymizedExport(data, exportConfig = {}) {
    const config = {
      level: 'high',
      format: 'json',
      includeMetadata: true,
      enableKAnonymity: true,
      enableLDiversity: false,
      differentialPrivacy: true,
      ...exportConfig
    }
    
    const result = await this.anonymizeData(data, config)
    
    const exportData = {
      anonymizedData: result.data,
      metadata: {
        ...result.anonymizationMetadata,
        exportedAt: new Date().toISOString(),
        exportConfig: config
      }
    }
    
    if (!config.includeMetadata) {
      return result.data
    }
    
    return exportData
  }

  /**
   * Validate anonymization quality
   */
  validateAnonymization(originalData, anonymizedData) {
    const validation = {
      identifierRemoval: this.checkIdentifierRemoval(anonymizedData),
      dataUtility: this.assessDataUtility(originalData, anonymizedData),
      privacyRisk: this.assessPrivacyRisk(anonymizedData),
      complianceScore: 0
    }
    
    // Calculate overall compliance score
    validation.complianceScore = Math.round(
      (validation.identifierRemoval.score * 0.5) +
      (validation.dataUtility.score * 0.3) +
      ((100 - validation.privacyRisk.score) * 0.2)
    )
    
    return validation
  }

  /**
   * Check if direct identifiers are properly removed
   */
  checkIdentifierRemoval(data) {
    const issues = []
    let totalFields = 0
    let removedFields = 0
    
    const checkRecord = (record) => {
      for (const [field, value] of Object.entries(record)) {
        totalFields++
        
        if (this.isSensitiveField(field)) {
          if (value === undefined || value === null || value === '***') {
            removedFields++
          } else {
            issues.push(`Sensitive field '${field}' not properly anonymized`)
          }
        }
      }
    }
    
    if (Array.isArray(data)) {
      data.forEach(checkRecord)
    } else if (typeof data === 'object' && data !== null) {
      checkRecord(data)
    }
    
    const score = totalFields > 0 ? Math.round((removedFields / totalFields) * 100) : 100
    
    return {
      score,
      issues,
      totalFields,
      removedFields
    }
  }

  /**
   * Assess data utility after anonymization
   */
  assessDataUtility(originalData, anonymizedData) {
    const originalSize = this.calculateDataSize(originalData)
    const anonymizedSize = this.calculateDataSize(anonymizedData)
    
    const retentionRate = originalSize > 0 ? (anonymizedSize / originalSize) * 100 : 0
    
    return {
      score: Math.round(retentionRate),
      originalSize,
      anonymizedSize,
      retentionRate
    }
  }

  /**
   * Assess privacy risk
   */
  assessPrivacyRisk(data) {
    let riskScore = 0
    const risks = []
    
    if (Array.isArray(data)) {
      // Check for small group sizes
      const quasiFields = this.getQuasiIdentifierFields(data)
      const groups = this.groupByQuasiIdentifiers(data, quasiFields)
      
      const smallGroups = groups.filter(group => group.length < this.config.kAnonymity)
      if (smallGroups.length > 0) {
        riskScore += 30
        risks.push(`${smallGroups.length} groups smaller than k=${this.config.kAnonymity}`)
      }
      
      // Check for remaining identifiers
      const sampleRecord = data[0] || {}
      for (const field of Object.keys(sampleRecord)) {
        if (this.isSensitiveField(field)) {
          riskScore += 20
          risks.push(`Potential identifier field: ${field}`)
        }
      }
    }
    
    return {
      score: Math.min(riskScore, 100),
      risks
    }
  }

  /**
   * Get anonymization statistics
   */
  getAnonymizationStats() {
    return {
      initialized: this.isInitialized,
      strategies: this.anonymizationStrategories.size,
      rules: this.anonymizationRules.size,
      sensitiveFields: this.sensitiveFields.size,
      quasiIdentifiers: this.quasiIdentifiers.size,
      config: this.config
    }
  }

  stop() {
    // Clear pseudonymization keys
    this.pseudonymizationKeys.clear()
    
    // Clear session storage keys
    const keysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('_pk_anon_')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    this.isInitialized = false
    console.log('🛑 Data Anonymization Service stopped')
  }
}

export const dataAnonymizationService = new DataAnonymizationService()
export default dataAnonymizationService