import React, { useState, useEffect } from 'react'
import {
  BarChart3, Package, Zap, AlertTriangle, CheckCircle,
  TrendingDown, FileText, Code, Layers, Download
} from 'lucide-react'
import { bundleOptimizationService } from '../../services/performance/bundleOptimizationService.js'

interface BundleModule {
  name: string
  size: number
  type: string
  importedBy: string[]
  treeShakeable: boolean
  critical: boolean
}

interface BundleChunk {
  name: string
  size: number
  modules: string[]
  loadPriority: string
  canLazyLoad: boolean
}

interface OptimizationRecommendation {
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  savings?: number
  actions: string[]
}

interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  modules: Map<string, BundleModule>
  chunks: Map<string, BundleChunk>
  duplicates: any[]
  unusedCode: any[]
  recommendations: OptimizationRecommendation[]
}

export const BundleAnalyzer: React.FC = () => {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'chunks' | 'recommendations'>('overview')
  const [optimizationInProgress, setOptimizationInProgress] = useState(false)

  useEffect(() => {
    loadBundleAnalysis()
  }, [])

  const loadBundleAnalysis = async () => {
    setLoading(true)
    try {
      await bundleOptimizationService.initialize()
      const bundleAnalysis = bundleOptimizationService.getBundleAnalysis()
      setAnalysis(bundleAnalysis)
    } catch (error) {
      console.error('Failed to load bundle analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyOptimization = async (type: string) => {
    setOptimizationInProgress(true)
    try {
      await bundleOptimizationService.implementOptimization(type)
      await loadBundleAnalysis() // Refresh analysis
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setOptimizationInProgress(false)
    }
  }

  const downloadOptimizationReport = () => {
    if (!analysis) return

    const report = {
      timestamp: new Date().toISOString(),
      analysis,
      recommendations: analysis.recommendations,
      potentialSavings: bundleOptimizationService.calculatePotentialSavings()
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bundle-analysis-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Analyzing bundle...</span>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
          <p className="text-gray-600 mb-4">Unable to load bundle analysis data.</p>
          <button
            onClick={loadBundleAnalysis}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-primary-600" />
              Bundle Analyzer
            </h1>
            <p className="text-gray-600 mt-2">
              Analyze and optimize your application bundle size and performance
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={downloadOptimizationReport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <button
              onClick={loadBundleAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <Zap className="h-4 w-4" />
              Refresh Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'modules', name: 'Modules', icon: Code },
            { id: 'chunks', name: 'Chunks', icon: Layers },
            { id: 'recommendations', name: 'Recommendations', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900">{formatSize(analysis.totalSize * 1024)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Gzipped</p>
                  <p className="text-2xl font-bold text-gray-900">{formatSize(analysis.gzippedSize * 1024)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Code className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Modules</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.modules.size}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Chunks</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.chunks.size}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Composition Chart */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bundle Composition</h3>
            <div className="space-y-4">
              {Array.from(analysis.modules.entries()).map(([name, module]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      module.critical ? 'bg-red-500' : 
                      module.type === 'framework' ? 'bg-blue-500' :
                      module.type === 'custom' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="font-medium text-gray-900">{name}</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      module.critical ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {module.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">{formatSize(module.size * 1024)}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(module.size / analysis.totalSize) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Module Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tree Shakeable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imported By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(analysis.modules.entries()).map(([name, module]) => (
                  <tr key={name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{name}</span>
                        {module.critical && (
                          <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Critical
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatSize(module.size * 1024)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {module.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {module.treeShakeable ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {module.importedBy.length > 0 ? module.importedBy.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chunks Tab */}
      {activeTab === 'chunks' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chunk Analysis</h3>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {Array.from(analysis.chunks.entries()).map(([name, chunk]) => (
                <div key={name} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">{name}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        chunk.loadPriority === 'high' ? 'bg-red-100 text-red-800' :
                        chunk.loadPriority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {chunk.loadPriority} priority
                      </span>
                      {chunk.canLazyLoad && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Lazy loadable
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">{formatSize(chunk.size * 1024)}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Modules:</p>
                    <div className="flex flex-wrap gap-1">
                      {chunk.modules.map((module) => (
                        <span key={module} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {analysis.recommendations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Great Job!</h3>
              <p className="text-gray-600">No optimization recommendations at this time.</p>
            </div>
          ) : (
            analysis.recommendations.map((recommendation, index) => (
              <div key={index} className={`p-6 rounded-lg border-2 ${getPriorityColor(recommendation.priority)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5" />
                      <h4 className="font-semibold">{recommendation.title}</h4>
                      {recommendation.savings && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Save {formatSize(recommendation.savings * 1024)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-3">{recommendation.description}</p>
                    <div>
                      <p className="text-sm font-medium mb-2">Recommended actions:</p>
                      <ul className="text-sm space-y-1">
                        {recommendation.actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => applyOptimization(recommendation.type)}
                    disabled={optimizationInProgress}
                    className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {optimizationInProgress ? 'Optimizing...' : 'Apply Fix'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default BundleAnalyzer