/**
 * Performance Optimizer for Mobile PWA
 * Handles lazy loading, code splitting, and mobile-specific optimizations
 */

// Lazy loading components
export const LazyComponents = {
  // Main pages
  Dashboard: React.lazy(() => import('../components/Dashboard/Dashboard')),
  Nutrition: React.lazy(() => import('../components/Nutrition/NutritionOptimized')),
  Activity: React.lazy(() => import('../components/Activity/Activity')),
  Wellness: React.lazy(() => import('../components/Wellness/Wellness')),
  Body: React.lazy(() => import('../components/Body/Body')),
  
  // Heavy components
  BarcodeScanner: React.lazy(() => import('../components/Nutrition/BarcodeScanner')),
  FoodSearch: React.lazy(() => import('../components/Nutrition/FoodSearchOptimized')),
  CameraTest: React.lazy(() => import('../components/CameraTest')),
  
  // Charts and visualizations
  ProgressCharts: React.lazy(() => import('../components/Charts/ProgressCharts')),
  NutritionCharts: React.lazy(() => import('../components/Charts/NutritionCharts')),
  
  // Settings and admin
  Settings: React.lazy(() => import('../components/Settings/Settings')),
  DataExport: React.lazy(() => import('../components/Settings/DataExport'))
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigationStart: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    }
    
    this.initialize()
  }

  initialize() {
    // Monitor navigation timing
    this.monitorNavigationTiming()
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals()
    
    // Monitor resource loading
    this.monitorResourceTiming()
    
    // Monitor memory usage
    this.monitorMemoryUsage()
  }

  monitorNavigationTiming() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0]
        
        this.metrics.navigationStart = navigation.navigationStart || 0
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart
        this.metrics.loadComplete = navigation.loadEventEnd - navigation.navigationStart
        
        console.log('📊 Navigation Timing:', {
          domContentLoaded: `${this.metrics.domContentLoaded}ms`,
          loadComplete: `${this.metrics.loadComplete}ms`
        })
      })
    }
  }

  monitorCoreWebVitals() {
    // First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      const fcp = entries.find(entry => entry.name === 'first-contentful-paint')
      if (fcp) {
        this.metrics.firstContentfulPaint = fcp.startTime
        console.log('📊 First Contentful Paint:', `${fcp.startTime.toFixed(2)}ms`)
      }
    })

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1]
      if (lcp) {
        this.metrics.largestContentfulPaint = lcp.startTime
        console.log('📊 Largest Contentful Paint:', `${lcp.startTime.toFixed(2)}ms`)
      }
    })

    // First Input Delay
    this.observePerformanceEntry('first-input', (entries) => {
      const fid = entries[0]
      if (fid) {
        this.metrics.firstInputDelay = fid.processingStart - fid.startTime
        console.log('📊 First Input Delay:', `${this.metrics.firstInputDelay.toFixed(2)}ms`)
      }
    })

    // Cumulative Layout Shift
    this.observePerformanceEntry('layout-shift', (entries) => {
      let cls = 0
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          cls += entry.value
        }
      }
      this.metrics.cumulativeLayoutShift = cls
      console.log('📊 Cumulative Layout Shift:', cls.toFixed(4))
    })
  }

  observePerformanceEntry(type, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ entryTypes: [type] })
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported:`, error)
    }
  }

  monitorResourceTiming() {
    if ('performance' in window) {
      // Monitor slow resources
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach(entry => {
          if (entry.duration > 1000) { // Slow resources (>1s)
            console.warn('🐌 Slow resource detected:', {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`,
              size: entry.transferSize || 'unknown'
            })
          }
        })
      })
      
      observer.observe({ entryTypes: ['resource'] })
    }
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        const usage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        }
        
        // Warn if memory usage is high
        if (usage.used / usage.limit > 0.8) {
          console.warn('🧠 High memory usage detected:', usage)
        }
      }, 30000) // Check every 30 seconds
    }
  }

  getMetrics() {
    return { ...this.metrics }
  }

  reportMetrics() {
    // Send metrics to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metrics', {
        custom_parameter_fcp: this.metrics.firstContentfulPaint,
        custom_parameter_lcp: this.metrics.largestContentfulPaint,
        custom_parameter_fid: this.metrics.firstInputDelay,
        custom_parameter_cls: this.metrics.cumulativeLayoutShift
      })
    }
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  static createWebPImage(src, fallback, className = '', alt = '') {
    return `
      <picture class="${className}">
        <source srcset="${src.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
        <img src="${fallback}" alt="${alt}" loading="lazy" decoding="async">
      </picture>
    `
  }

  static lazyLoadImage(img) {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const image = entry.target
            image.src = image.dataset.src
            image.classList.remove('lazy')
            observer.unobserve(image)
          }
        })
      })

      imageObserver.observe(img)
    } else {
      // Fallback for older browsers
      img.src = img.dataset.src
    }
  }

  static compressImage(file, quality = 0.8, maxWidth = 1920) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const { width, height } = img
        const ratio = Math.min(maxWidth / width, maxWidth / height)
        
        canvas.width = width * ratio
        canvas.height = height * ratio

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }
}

/**
 * Bundle optimization utilities
 */
export class BundleOptimizer {
  static preloadCriticalResources() {
    const criticalResources = [
      '/icons/icon-192x192.png',
      '/manifest.json'
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      link.as = resource.endsWith('.png') ? 'image' : 'fetch'
      document.head.appendChild(link)
    })
  }

  static loadPolyfills() {
    const polyfills = []

    // Check for IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      polyfills.push('intersection-observer')
    }

    // Check for ResizeObserver
    if (!('ResizeObserver' in window)) {
      polyfills.push('resize-observer-polyfill')
    }

    // Check for requestIdleCallback
    if (!('requestIdleCallback' in window)) {
      polyfills.push('requestidlecallback')
    }

    return Promise.all(
      polyfills.map(polyfill => import(`../polyfills/${polyfill}`))
    )
  }

  static prefetchNextRoute(route) {
    // Prefetch route component
    if (LazyComponents[route]) {
      const modulePromise = LazyComponents[route]()
      modulePromise.catch(() => {
        // Silently fail - prefetch is not critical
      })
    }
  }
}

/**
 * Mobile-specific optimizations
 */
export class MobileOptimizer {
  static setupViewportOptimization() {
    // Prevent zoom on input focus (iOS)
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    }

    // Add touch-action for better scrolling
    document.body.style.touchAction = 'manipulation'
  }

  static optimizeScrolling() {
    // Enable momentum scrolling on iOS
    document.body.style.webkitOverflowScrolling = 'touch'
    
    // Optimize scroll events
    let scrollTimer = null
    
    window.addEventListener('scroll', () => {
      if (scrollTimer) return
      
      scrollTimer = setTimeout(() => {
        // Scroll optimization logic here
        scrollTimer = null
      }, 16) // ~60fps
    }, { passive: true })
  }

  static setupHapticFeedback() {
    // Provide haptic feedback for touch interactions
    return {
      light: () => {
        if ('vibrate' in navigator) {
          navigator.vibrate(25)
        }
      },
      medium: () => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      },
      heavy: () => {
        if ('vibrate' in navigator) {
          navigator.vibrate(100)
        }
      }
    }
  }

  static optimizeTouchEvents() {
    // Add touch event optimizations
    document.addEventListener('touchstart', (e) => {
      // Pre-warm touch interactions
    }, { passive: true })

    document.addEventListener('touchmove', (e) => {
      // Optimize touch move events
    }, { passive: true })
  }

  static setupPullToRefresh() {
    let startY = 0
    let currentY = 0
    let pulling = false

    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY
    }, { passive: true })

    document.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].clientY
      
      if (window.scrollY === 0 && currentY > startY + 50) {
        pulling = true
        // Show pull to refresh indicator
      }
    }, { passive: true })

    document.addEventListener('touchend', () => {
      if (pulling) {
        // Trigger refresh
        window.location.reload()
      }
      pulling = false
    })
  }
}

/**
 * Network optimization
 */
export class NetworkOptimizer {
  static setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('💾 SW registered:', registration.scope)
          })
          .catch(error => {
            console.log('💾 SW registration failed:', error)
          })
      })
    }
  }

  static preconnectToServices() {
    const services = [
      'https://world.openfoodfacts.org',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ]

    services.forEach(service => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = service
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }

  static optimizeAPIRequests() {
    // Implement request deduplication
    const requestCache = new Map()

    return {
      get: async (url, options = {}) => {
        const cacheKey = `${url}:${JSON.stringify(options)}`
        
        if (requestCache.has(cacheKey)) {
          return requestCache.get(cacheKey)
        }

        const promise = fetch(url, {
          ...options,
          headers: {
            'Cache-Control': 'max-age=300',
            ...options.headers
          }
        })

        requestCache.set(cacheKey, promise)
        
        // Clear cache after 5 minutes
        setTimeout(() => {
          requestCache.delete(cacheKey)
        }, 300000)

        return promise
      }
    }
  }

  static detectConnectionSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    
    return null
  }
}

/**
 * Battery optimization
 */
export class BatteryOptimizer {
  static async getBatteryInfo() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery()
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        }
      } catch (error) {
        console.warn('Battery API not available:', error)
      }
    }
    return null
  }

  static async optimizeForBatteryLevel() {
    const battery = await this.getBatteryInfo()
    
    if (battery && battery.level < 0.2 && !battery.charging) {
      // Low battery mode
      return {
        reduceAnimations: true,
        reducePollFrequency: true,
        disableAutoRefresh: true,
        optimizeForPower: true
      }
    }
    
    return {
      reduceAnimations: false,
      reducePollFrequency: false,
      disableAutoRefresh: false,
      optimizeForPower: false
    }
  }
}

// Initialize performance monitoring
export const performanceMonitor = new PerformanceMonitor()

// Export optimization utilities
export {
  ImageOptimizer,
  BundleOptimizer,
  MobileOptimizer,
  NetworkOptimizer,
  BatteryOptimizer
}