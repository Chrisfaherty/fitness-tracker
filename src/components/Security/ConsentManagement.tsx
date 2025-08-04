import React, { useState, useEffect } from 'react'
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Info,
  Settings, Download, Trash2, Eye, EyeOff, Clock,
  FileText, Lock, Unlock, RotateCcw, ExternalLink
} from 'lucide-react'
import { privacyComplianceService } from '../../services/security/privacyComplianceService'
import { gdprComplianceService } from '../../services/security/gdprComplianceService'

interface ConsentRecord {
  id: string
  purposeId: string
  granted: boolean
  timestamp: string
  expiresAt?: string
  status?: string
}

interface PrivacyPolicy {
  id: string
  title: string
  description: string
  required: boolean
  purposes: string[]
  dataTypes: string[]
  retention: string
  legalBasis: string
}

const ConsentManagement: React.FC = () => {
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([])
  const [privacyPolicies, setPolicies] = useState<PrivacyPolicy[]>([])
  const [privacySettings, setPrivacySettings] = useState<any>({})
  const [pendingRequest, setPendingRequest] = useState<any>(null)
  const [showPolicyDetails, setShowPolicyDetails] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'consents' | 'settings' | 'policies' | 'rights'>('consents')

  useEffect(() => {
    loadConsentData()
    setupEventListeners()
    
    return () => {
      cleanupEventListeners()
    }
  }, [])

  const loadConsentData = async () => {
    setLoading(true)
    try {
      // Load consent records
      const records = privacyComplianceService.consentRecords
      setConsentRecords(Array.from(records.values()))
      
      // Load privacy policies
      const policies = privacyComplianceService.privacyPolicies
      setPolicies(Array.from(policies.values()))
      
      // Load privacy settings
      const settings = privacyComplianceService.getPrivacySettings()
      setPrivacySettings(settings)
      
    } catch (error) {
      console.error('Failed to load consent data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupEventListeners = () => {
    window.addEventListener('privacy-consent-request', handleConsentRequest)
    window.addEventListener('privacy-consent-recorded', handleConsentRecorded)
    window.addEventListener('privacy-consent-withdrawn', handleConsentWithdrawn)
    window.addEventListener('privacy-settings-updated', handleSettingsUpdated)
  }

  const cleanupEventListeners = () => {
    window.removeEventListener('privacy-consent-request', handleConsentRequest)
    window.removeEventListener('privacy-consent-recorded', handleConsentRecorded)
    window.removeEventListener('privacy-consent-withdrawn', handleConsentWithdrawn)
    window.removeEventListener('privacy-settings-updated', handleSettingsUpdated)
  }

  const handleConsentRequest = (event: CustomEvent) => {
    setPendingRequest(event.detail)
  }

  const handleConsentRecorded = (event: CustomEvent) => {
    loadConsentData()
    setPendingRequest(null)
  }

  const handleConsentWithdrawn = (event: CustomEvent) => {
    loadConsentData()
  }

  const handleSettingsUpdated = (event: CustomEvent) => {
    setPrivacySettings(event.detail)
  }

  const handleConsentResponse = async (purposeId: string, granted: boolean) => {
    try {
      await privacyComplianceService.recordConsent(purposeId, granted, {
        source: 'consent-management-ui',
        userAgent: navigator.userAgent
      })
    } catch (error) {
      console.error('Failed to record consent:', error)
    }
  }

  const handleWithdrawConsent = async (purposeId: string) => {
    try {
      await privacyComplianceService.withdrawConsent(purposeId, 'user_withdrawal')
    } catch (error) {
      console.error('Failed to withdraw consent:', error)
    }
  }

  const handleSettingsChange = async (setting: string, value: boolean) => {
    try {
      const updatedSettings = { ...privacySettings, [setting]: value }
      await privacyComplianceService.updatePrivacySettings({ [setting]: value })
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
    }
  }

  const handleDataExport = async () => {
    try {
      const exportData = await privacyComplianceService.exportUserData()
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `privacy-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const handleDataDeletion = async () => {
    if (!confirm('Are you sure you want to request data deletion? This action cannot be undone.')) {
      return
    }
    
    try {
      await gdprComplianceService.handleRightsRequest('current-user', 'erasure', {
        reason: 'no_longer_necessary'
      })
      
      alert('Data deletion request submitted. You will be contacted regarding the status of your request.')
    } catch (error) {
      console.error('Failed to request data deletion:', error)
    }
  }

  const getPolicyIcon = (policyId: string) => {
    const iconMap: { [key: string]: any } = {
      'data-collection': Shield,
      'analytics': Eye,
      'marketing': ExternalLink,
      'third-party': Settings
    }
    
    return iconMap[policyId] || Info
  }

  const getConsentStatus = (purposeId: string) => {
    const consent = consentRecords.find(c => c.purposeId === purposeId)
    if (!consent) return 'not-given'
    
    if (consent.status === 'withdrawn') return 'withdrawn'
    if (consent.granted) return 'granted'
    return 'denied'
  }

  const isConsentExpired = (consent: ConsentRecord) => {
    if (!consent.expiresAt) return false
    return new Date(consent.expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy & Consent</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your privacy settings and data consent preferences
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleDataExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Pending Consent Request */}
      {pendingRequest && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                Consent Required: {pendingRequest.policy?.title}
              </h3>
              <p className="text-yellow-800 dark:text-yellow-300 mb-4">
                {pendingRequest.policy?.description}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleConsentResponse(pendingRequest.purposeId, true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleConsentResponse(pendingRequest.purposeId, false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => setShowPolicyDetails(pendingRequest.purposeId)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'consents', label: 'Consent Status', icon: CheckCircle },
            { id: 'settings', label: 'Privacy Settings', icon: Settings },
            { id: 'policies', label: 'Privacy Policies', icon: FileText },
            { id: 'rights', label: 'Your Rights', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'consents' && (
          <div className="grid grid-cols-1 gap-6">
            {privacyPolicies.map(policy => {
              const Icon = getPolicyIcon(policy.id)
              const status = getConsentStatus(policy.id)
              const consent = consentRecords.find(c => c.purposeId === policy.id)
              const isExpired = consent && isConsentExpired(consent)
              
              return (
                <div
                  key={policy.id}
                  className={`border rounded-lg p-6 ${
                    status === 'granted' 
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      : status === 'denied' || status === 'withdrawn'
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {policy.title}
                          </h3>
                          {policy.required && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                              Required
                            </span>
                          )}
                          {isExpired && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
                              Expired
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {policy.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {consent ? (
                            <>
                              {status === 'granted' ? 'Granted' : status === 'withdrawn' ? 'Withdrawn' : 'Denied'} on{' '}
                              {new Date(consent.timestamp).toLocaleDateString()}
                              {consent.expiresAt && (
                                <span className="ml-2">
                                  • Expires {new Date(consent.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          ) : (
                            'No consent recorded'
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {status === 'granted' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : status === 'denied' || status === 'withdrawn' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      
                      <div className="flex gap-2">
                        {status === 'granted' && !isExpired && (
                          <button
                            onClick={() => handleWithdrawConsent(policy.id)}
                            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                        
                        {(status === 'denied' || status === 'withdrawn' || status === 'not-given' || isExpired) && (
                          <button
                            onClick={() => handleConsentResponse(policy.id, true)}
                            className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                          >
                            Grant
                          </button>
                        )}
                        
                        <button
                          onClick={() => setShowPolicyDetails(showPolicyDetails === policy.id ? null : policy.id)}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {showPolicyDetails === policy.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Policy Details */}
                  {showPolicyDetails === policy.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Purposes</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {policy.purposes.map((purpose, index) => (
                              <li key={index}>{purpose}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data Types</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {policy.dataTypes.map((dataType, index) => (
                              <li key={index}>{dataType}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Retention Period</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{policy.retention}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Legal Basis</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{policy.legalBasis}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Privacy Settings</h3>
            
            <div className="space-y-6">
              {Object.entries(privacySettings).map(([setting, enabled]) => (
                <div key={setting} className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getSettingDescription(setting)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleSettingsChange(setting, !enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-6">
            {privacyPolicies.map(policy => {
              const Icon = getPolicyIcon(policy.id)
              
              return (
                <div key={policy.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {policy.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {policy.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Legal Basis:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{policy.legalBasis}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Retention:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">{policy.retention}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'rights' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">Your Data Rights</h3>
              <p className="text-blue-800 dark:text-blue-300 mb-4">
                You have the following rights regarding your personal data:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Data Portability</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Export your data in a machine-readable format
                  </p>
                  <button
                    onClick={handleDataExport}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Export My Data
                  </button>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-gray-900 dark:text-white">Data Erasure</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Request deletion of your personal data
                  </p>
                  <button
                    onClick={handleDataDeletion}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Request Deletion
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Rights</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Right to Access</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can request information about what personal data we process about you
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Right to Rectification</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can request correction of inaccurate or incomplete personal data
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Right to Object</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can object to certain types of processing of your personal data
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Right to Restrict Processing</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can request limitation of processing under certain circumstances
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const getSettingDescription = (setting: string): string => {
  const descriptions: { [key: string]: string } = {
    dataCollection: 'Allow collection and processing of your fitness and health data',
    analytics: 'Share usage data to help improve the application',
    marketing: 'Receive promotional emails and product updates',
    cookies: 'Allow cookies for enhanced functionality',
    thirdPartySharing: 'Share data with trusted third-party services',
    locationTracking: 'Allow location tracking for enhanced features',
    biometricData: 'Allow processing of biometric and health data'
  }
  
  return descriptions[setting] || 'Manage this privacy setting'
}

export default ConsentManagement