import React, { useState, useEffect, useContext, createContext } from 'react'
import {
  Loader2, AlertCircle, CheckCircle, Clock, Zap,
  RefreshCw, Wifi, WifiOff, Activity, TrendingUp
} from 'lucide-react'

interface LoadingState {
  id: string
  type: 'initial' | 'lazy' | 'refresh' | 'background' | 'infinite'
  status: 'idle' | 'loading' | 'success' | 'error' | 'timeout'
  progress?: number
  message?: string
  startTime: number
  duration?: number
  retryCount?: number
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface LoadingContextType {
  loadingStates: Map<string, LoadingState>
  setLoadingState: (id: string, state: Partial<LoadingState>) => void
  removeLoadingState: (id: string) => void
  getLoadingState: (id: string) => LoadingState | undefined
  isLoading: (id?: string) => boolean
  globalLoadingState: 'idle' | 'loading' | 'error'
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: React.ReactNode
  options?: {
    enableGlobalState?: boolean
    enablePerformanceTracking?: boolean
    enableRetry?: boolean
    defaultTimeout?: number
  }
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ 
  children, 
  options = {} 
}) => {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map())
  const [globalLoadingState, setGlobalLoadingState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [performanceMetrics, setPerformanceMetrics] = useState<Map<string, any>>(new Map())
  
  const config = {
    enableGlobalState: options.enableGlobalState !== false,
    enablePerformanceTracking: options.enablePerformanceTracking !== false,
    enableRetry: options.enableRetry !== false,
    defaultTimeout: options.defaultTimeout || 10000
  }

  // Update global loading state based on individual states
  useEffect(() => {
    if (!config.enableGlobalState) return
    
    const states = Array.from(loadingStates.values())
    const criticalLoading = states.some(state => 
      state.priority === 'critical' && state.status === 'loading'
    )
    const hasError = states.some(state => state.status === 'error')
    const isLoading = states.some(state => state.status === 'loading')
    
    if (criticalLoading) {
      setGlobalLoadingState('loading')
    } else if (hasError) {
      setGlobalLoadingState('error')
    } else if (isLoading) {
      setGlobalLoadingState('loading')
    } else {
      setGlobalLoadingState('idle')
    }
  }, [loadingStates, config.enableGlobalState])

  const setLoadingState = (id: string, stateUpdate: Partial<LoadingState>) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev)
      const existingState = newStates.get(id)
      
      const newState: LoadingState = {
        id,
        type: 'initial',
        status: 'idle',
        startTime: Date.now(),
        priority: 'medium',
        retryCount: 0,
        ...existingState,
        ...stateUpdate
      }
      
      // Handle state transitions
      if (newState.status === 'loading' && !existingState) {
        newState.startTime = Date.now()
      }
      
      if (newState.status !== 'loading' && existingState?.status === 'loading') {
        newState.duration = Date.now() - existingState.startTime
        
        // Track performance metrics
        if (config.enablePerformanceTracking) {
          trackPerformanceMetric(id, newState)
        }
      }
      
      // Auto-timeout handling
      if (newState.status === 'loading') {
        setTimeout(() => {
          const currentState = newStates.get(id)
          if (currentState?.status === 'loading') {
            setLoadingState(id, { status: 'timeout' })
          }
        }, config.defaultTimeout)
      }
      
      newStates.set(id, newState)
      return newStates
    })
  }

  const removeLoadingState = (id: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev)
      newStates.delete(id)
      return newStates
    })
  }

  const getLoadingState = (id: string): LoadingState | undefined => {
    return loadingStates.get(id)
  }

  const isLoading = (id?: string): boolean => {
    if (id) {
      const state = loadingStates.get(id)
      return state?.status === 'loading'
    }
    
    return Array.from(loadingStates.values()).some(state => state.status === 'loading')
  }

  const trackPerformanceMetric = (id: string, state: LoadingState) => {
    setPerformanceMetrics(prev => {
      const newMetrics = new Map(prev)
      const existing = newMetrics.get(id) || { samples: [], average: 0 }
      
      if (state.duration) {
        existing.samples.push({
          duration: state.duration,
          timestamp: Date.now(),
          status: state.status,
          type: state.type
        })
        
        // Keep only last 50 samples
        if (existing.samples.length > 50) {
          existing.samples = existing.samples.slice(-50)
        }
        
        // Calculate average
        existing.average = existing.samples.reduce((sum, sample) => sum + sample.duration, 0) / existing.samples.length
      }
      
      newMetrics.set(id, existing)
      return newMetrics
    })
  }

  const contextValue: LoadingContextType = {
    loadingStates,
    setLoadingState,
    removeLoadingState,
    getLoadingState,
    isLoading,
    globalLoadingState
  }

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <GlobalLoadingIndicator />
      <LoadingPerformanceMonitor metrics={performanceMetrics} />
    </LoadingContext.Provider>
  )
}

// Global loading indicator component
const GlobalLoadingIndicator: React.FC = () => {
  const { globalLoadingState, loadingStates } = useLoading()
  
  if (globalLoadingState === 'idle') return null
  
  const criticalLoadingStates = Array.from(loadingStates.values())
    .filter(state => state.priority === 'critical' && state.status === 'loading')
  
  const primaryState = criticalLoadingStates[0] || 
    Array.from(loadingStates.values()).find(state => state.status === 'loading')
  
  if (!primaryState) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-primary-600 text-white px-4 py-2 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{primaryState.message || 'Loading...'}</span>
          {primaryState.progress !== undefined && (
            <span className="ml-2">({Math.round(primaryState.progress)}%)</span>
          )}
        </div>
      </div>
      {primaryState.progress !== undefined && (
        <div className="h-1 bg-primary-200">
          <div 
            className="h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${primaryState.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Performance monitoring component
const LoadingPerformanceMonitor: React.FC<{ metrics: Map<string, any> }> = ({ metrics }) => {
  const [showMetrics, setShowMetrics] = useState(false)
  
  if (!showMetrics || metrics.size === 0) {
    return (
      <button
        onClick={() => setShowMetrics(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg z-50 opacity-50 hover:opacity-100 transition-opacity"
        title="Show loading performance metrics"
      >
        <Activity className="h-4 w-4" />
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Loading Performance
        </h3>
        <button
          onClick={() => setShowMetrics(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        {Array.from(metrics.entries()).map(([id, metric]) => (
          <div key={id} className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 truncate">{id}</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {metric.average?.toFixed(0)}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton loader component
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  }
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  )
}

// Enhanced loading button
interface LoadingButtonProps {
  children: React.ReactNode
  onClick?: () => Promise<void> | void
  loading?: boolean
  disabled?: boolean
  loadingText?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  retryable?: boolean
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  onClick,
  loading: externalLoading,
  disabled,
  loadingText = 'Loading...',
  className = '',
  variant = 'primary',
  size = 'md',
  showProgress = false,
  retryable = false
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  
  const loading = externalLoading ?? internalLoading
  
  const handleClick = async () => {
    if (!onClick || loading || disabled) return
    
    setInternalLoading(true)
    setError(null)
    setProgress(0)
    
    try {
      if (showProgress) {
        // Simulate progress for demo purposes
        const interval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90))
        }, 100)
        
        await onClick()
        clearInterval(interval)
        setProgress(100)
      } else {
        await onClick()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setInternalLoading(false)
      if (showProgress) {
        setTimeout(() => setProgress(0), 1000)
      }
    }
  }
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        className={`
          relative inline-flex items-center justify-center font-medium rounded-md
          transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        )}
        {loading ? loadingText : children}
        
        {showProgress && progress > 0 && (
          <div className="absolute inset-0 rounded-md overflow-hidden">
            <div 
              className="h-full bg-white/20 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>
      
      {error && retryable && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={handleClick}
              className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Smart loading state hook
export const useSmartLoading = (id: string, options: {
  type?: LoadingState['type']
  priority?: LoadingState['priority']
  timeout?: number
  retryCount?: number
  onTimeout?: () => void
  onError?: (error: any) => void
  onSuccess?: () => void
} = {}) => {
  const { setLoadingState, removeLoadingState, getLoadingState } = useLoading()
  
  const start = (message?: string, progress?: number) => {
    setLoadingState(id, {
      status: 'loading',
      message,
      progress,
      type: options.type || 'initial',
      priority: options.priority || 'medium'
    })
  }
  
  const update = (progress: number, message?: string) => {
    setLoadingState(id, { progress, message })
  }
  
  const succeed = (message?: string) => {
    setLoadingState(id, { status: 'success', message, progress: 100 })
    options.onSuccess?.()
    
    // Auto-remove success state after delay
    setTimeout(() => removeLoadingState(id), 2000)
  }
  
  const fail = (error: any, message?: string) => {
    setLoadingState(id, { 
      status: 'error', 
      message: message || (error instanceof Error ? error.message : 'An error occurred')
    })
    options.onError?.(error)
  }
  
  const timeout = () => {
    setLoadingState(id, { status: 'timeout', message: 'Request timed out' })
    options.onTimeout?.()
  }
  
  const reset = () => {
    removeLoadingState(id)
  }
  
  const state = getLoadingState(id)
  
  return {
    start,
    update,
    succeed,
    fail,
    timeout,
    reset,
    state,
    isLoading: state?.status === 'loading',
    isError: state?.status === 'error',
    isSuccess: state?.status === 'success',
    isTimeout: state?.status === 'timeout'
  }
}

// Connection status indicator
export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Get connection information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection.effectiveType || 'unknown')
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown')
      }
      
      connection.addEventListener('change', handleConnectionChange)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  if (isOnline) return null
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm z-50">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may not be available.</span>
      </div>
    </div>
  )
}

// Progressive loading container
interface ProgressiveLoadingProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  timeout?: number
  retryCount?: number
  className?: string
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  children,
  fallback,
  timeout = 5000,
  retryCount = 3,
  className = ''
}) => {
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error' | 'timeout'>('loading')
  const [attempts, setAttempts] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loadingState === 'loading') {
        setLoadingState('timeout')
      }
    }, timeout)
    
    return () => clearTimeout(timer)
  }, [timeout, loadingState])
  
  const handleRetry = () => {
    if (attempts < retryCount) {
      setAttempts(prev => prev + 1)
      setLoadingState('loading')
    }
  }
  
  const handleLoad = () => {
    setLoadingState('loaded')
  }
  
  const handleError = () => {
    setLoadingState('error')
  }
  
  if (loadingState === 'loaded') {
    return <div className={className}>{children}</div>
  }
  
  if (loadingState === 'error' || loadingState === 'timeout') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {loadingState === 'timeout' ? 'Loading Timeout' : 'Loading Error'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {loadingState === 'timeout' 
            ? 'Content is taking longer than expected to load'
            : 'Something went wrong while loading this content'
          }
        </p>
        {attempts < retryCount && (
          <LoadingButton onClick={handleRetry} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry ({retryCount - attempts} attempts left)
          </LoadingButton>
        )}
      </div>
    )
  }
  
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      {fallback || (
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
        </div>
      )}
    </div>
  )
}

export default LoadingProvider