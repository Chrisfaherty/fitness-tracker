import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Eye, Package, Zap, Clock, CheckCircle } from 'lucide-react'

// Lazy loaded components with custom loading fallbacks
const LazyDashboard = lazy(() => import('../Dashboard/Dashboard'))
const LazySecurityPanel = lazy(() => import('../Security/SecurityPanel'))
const LazyNutritionTracker = lazy(() => import('../Nutrition/NutritionTracker'))
const LazyFitnessGoals = lazy(() => import('../Fitness/FitnessGoals'))
const LazyDataVisualization = lazy(() => import('../Analytics/DataVisualization'))

// Enhanced loading fallback component
interface LoadingFallbackProps {
  componentName?: string
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
  estimatedTime?: number
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  componentName = 'Component',
  size = 'md',
  showProgress = false,
  estimatedTime = 2000
}) => {
  const [progress, setProgress] = useState(0)
  const [loadingTime, setLoadingTime] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / estimatedTime) * 100, 95)
      setProgress(newProgress)
      setLoadingTime(elapsed)
    }, 100)

    return () => clearInterval(progressInterval)
  }, [estimatedTime])

  const sizeClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} bg-gray-50 rounded-lg border-2 border-dashed border-gray-300`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Loading {componentName}</h3>
        <p className="text-sm text-gray-500 mb-3">
          {loadingTime > 0 && `${(loadingTime / 1000).toFixed(1)}s elapsed`}
        </p>
        
        {showProgress && (
          <div className="w-48 mx-auto">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Intersection Observer based lazy loading hook
interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting
        setIsIntersecting(isVisible)
        
        if (isVisible && triggerOnce && !hasTriggered) {
          setHasTriggered(true)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  return {
    elementRef,
    isIntersecting: triggerOnce ? (hasTriggered || isIntersecting) : isIntersecting
  }
}

// Lazy component wrapper with intersection observer
interface LazyComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
  componentName?: string
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  componentName = 'Component'
}) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  })

  return (
    <div ref={elementRef} className={className}>
      {isIntersecting ? (
        <Suspense fallback={fallback || <LoadingFallback componentName={componentName} />}>
          {children}
        </Suspense>
      ) : (
        <div className="h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Eye className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Scroll to load {componentName}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Progressive image loading with lazy loading
interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  blurDataUrl?: string
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  blurDataUrl
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(placeholder || blurDataUrl || '')
  
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  useEffect(() => {
    if (isIntersecting && !isLoaded && !isError) {
      const img = new Image()
      
      img.onload = () => {
        setCurrentSrc(src)
        setIsLoaded(true)
      }
      
      img.onerror = () => {
        setIsError(true)
      }
      
      img.src = src
    }
  }, [isIntersecting, src, isLoaded, isError])

  return (
    <div ref={elementRef} className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-70'
        } ${!isLoaded && blurDataUrl ? 'filter blur-sm' : ''}`}
        loading="lazy"
      />
      
      {!isIntersecting && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <Package className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs">Loading...</span>
          </div>
        </div>
      )}
      
      {isError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Route-based code splitting component
interface LazyRouteProps {
  component: React.ComponentType<any>
  fallback?: React.ReactNode
  preload?: boolean
  componentName?: string
}

const LazyRoute: React.FC<LazyRouteProps> = ({
  component: Component,
  fallback,
  preload = false,
  componentName = 'Page',
  ...props
}) => {
  const [shouldPreload, setShouldPreload] = useState(preload)

  useEffect(() => {
    if (shouldPreload) {
      // Preload the component on mouse enter or focus
      const preloadComponent = () => {
        import(/* webpackChunkName: "preloaded" */ '../Dashboard/Dashboard')
      }
      
      if (preload) {
        const timer = setTimeout(preloadComponent, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [shouldPreload, preload])

  return (
    <Suspense
      fallback={
        fallback || (
          <LoadingFallback
            componentName={componentName}
            size="lg"
            showProgress={true}
            estimatedTime={3000}
          />
        )
      }
    >
      <Component {...props} />
    </Suspense>
  )
}

// Lazy loading patterns demo component
export const LazyLoadingPatterns: React.FC = () => {
  const [activePattern, setActivePattern] = useState<'components' | 'images' | 'routes' | 'infinite'>('components')
  const [loadingStats, setLoadingStats] = useState({
    componentsLoaded: 0,
    imagesLoaded: 0,
    totalLoadTime: 0
  })

  const trackLoadTime = useCallback((componentName: string, startTime: number) => {
    const loadTime = Date.now() - startTime
    setLoadingStats(prev => ({
      ...prev,
      componentsLoaded: prev.componentsLoaded + 1,
      totalLoadTime: prev.totalLoadTime + loadTime
    }))
    console.log(`📦 ${componentName} loaded in ${loadTime}ms`)
  }, [])

  const patterns = [
    {
      id: 'components',
      name: 'Component Lazy Loading',
      description: 'Load components only when they become visible',
      icon: Package
    },
    {
      id: 'images',
      name: 'Image Lazy Loading',
      description: 'Progressive image loading with placeholders',
      icon: Eye
    },
    {
      id: 'routes',
      name: 'Route-based Splitting',
      description: 'Code splitting at the route level',
      icon: Zap
    },
    {
      id: 'infinite',
      name: 'Infinite Scrolling',
      description: 'Load content as user scrolls',
      icon: Clock
    }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary-600" />
          Lazy Loading Patterns
        </h1>
        <p className="text-gray-600 mt-2">
          Optimize performance with intelligent lazy loading strategies
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Components Loaded</p>
              <p className="text-xl font-bold text-gray-900">{loadingStats.componentsLoaded}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Eye className="h-6 w-6 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Images Loaded</p>
              <p className="text-xl font-bold text-gray-900">{loadingStats.imagesLoaded}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Avg Load Time</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingStats.componentsLoaded > 0 
                  ? `${Math.round(loadingStats.totalLoadTime / loadingStats.componentsLoaded)}ms`
                  : '0ms'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Selection */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => setActivePattern(pattern.id as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activePattern === pattern.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <pattern.icon className={`h-6 w-6 mx-auto mb-2 ${
                activePattern === pattern.id ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <h3 className="font-semibold text-sm text-gray-900 mb-1">{pattern.name}</h3>
              <p className="text-xs text-gray-500">{pattern.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Demonstrations */}
      <div className="space-y-8">
        {/* Component Lazy Loading */}
        {activePattern === 'components' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Component Lazy Loading</h2>
            <div className="space-y-6">
              <LazyComponent
                componentName="Dashboard"
                className="mb-6"
                fallback={<LoadingFallback componentName="Dashboard" showProgress={true} />}
              >
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Dashboard Component</h3>
                  <p className="text-gray-600">This component was loaded lazily when it became visible.</p>
                </div>
              </LazyComponent>
              
              <LazyComponent
                componentName="Security Panel"
                fallback={<LoadingFallback componentName="Security Panel" showProgress={true} />}
              >
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Security Panel</h3>
                  <p className="text-gray-600">Another lazy-loaded component with intersection observer.</p>
                </div>
              </LazyComponent>
              
              <LazyComponent
                componentName="Analytics"
                threshold={0.3}
                rootMargin="200px"
                fallback={<LoadingFallback componentName="Analytics" size="lg" showProgress={true} />}
              >
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-2">Analytics Component</h3>
                  <p className="text-gray-600">Loaded with custom threshold and root margin settings.</p>
                </div>
              </LazyComponent>
            </div>
          </div>
        )}

        {/* Image Lazy Loading */}
        {activePattern === 'images' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Image Lazy Loading</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <LazyImage
                  key={index}
                  src={`https://picsum.photos/400/300?random=${index}`}
                  alt={`Sample image ${index}`}
                  className="aspect-video rounded-lg"
                  placeholder="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23f3f4f6' viewBox='0 0 400 300'%3E%3Crect width='400' height='300'/%3E%3C/svg%3E"
                />
              ))}
            </div>
          </div>
        )}

        {/* Route-based Code Splitting */}
        {activePattern === 'routes' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Route-based Code Splitting</h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">
                Route-based code splitting allows you to split your application at natural boundaries - your routes.
              </p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Example Route Configuration:</h4>
                  <pre className="text-sm text-gray-700 overflow-x-auto">
{`// Router setup with lazy routes
const Dashboard = lazy(() => import('./Dashboard'))
const Profile = lazy(() => import('./Profile'))
const Settings = lazy(() => import('./Settings'))

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={
          <LazyRoute 
            component={Dashboard} 
            componentName="Dashboard"
            preload={true}
          />
        } />
        <Route path="/profile" element={
          <LazyRoute 
            component={Profile} 
            componentName="Profile"
          />
        } />
      </Routes>
    </Router>
  )
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Infinite Scrolling */}
        {activePattern === 'infinite' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Infinite Scrolling</h2>
            <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
              {Array.from({ length: 20 }, (_, index) => (
                <LazyComponent
                  key={index}
                  componentName={`Item ${index + 1}`}
                  threshold={0.5}
                  rootMargin="100px"
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">Item {index + 1}</h4>
                    <p className="text-gray-600 text-sm">
                      This item was loaded when it came into view during scrolling.
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                  </div>
                </LazyComponent>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LazyLoadingPatterns

// Export utility components for use elsewhere
export {
  LazyComponent,
  LazyImage,
  LazyRoute,
  LoadingFallback,
  useIntersectionObserver
}