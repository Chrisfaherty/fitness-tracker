/**
 * Image Optimization Service
 * Handles image compression, format conversion, and loading optimization
 */

export class ImageOptimizationService {
  constructor() {
    this.isInitialized = false
    this.optimizedImages = new Map()
    this.imageCache = new Map()
    this.loadingQueue = []
    this.config = {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.8,
      format: 'webp',
      fallbackFormat: 'jpeg',
      enableLazyLoading: true,
      enableProgressiveLoading: true,
      compressionLevel: 6,
      thumbnailSize: 150,
      enableCaching: true,
      cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours
    }
    this.supportedFormats = new Set(['webp', 'avif', 'jpeg', 'png', 'svg'])
    this.loadingStates = new Map()
  }

  /**
   * Initialize image optimization service
   */
  async initialize(options = {}) {
    console.log('🖼️ Initializing Image Optimization Service')
    
    this.config = { ...this.config, ...options }
    
    // Check browser support for modern formats
    await this.checkFormatSupport()
    
    // Setup image loading intersection observer
    this.setupLazyLoading()
    
    // Setup image caching
    this.setupImageCaching()
    
    // Preload critical images
    await this.preloadCriticalImages()
    
    this.isInitialized = true
    console.log('✅ Image Optimization Service initialized')
    
    return true
  }

  /**
   * Check browser support for modern image formats
   */
  async checkFormatSupport() {
    const formats = ['webp', 'avif']
    this.formatSupport = new Map()
    
    for (const format of formats) {
      try {
        const support = await this.testFormatSupport(format)
        this.formatSupport.set(format, support)
        console.log(`🖼️ ${format.toUpperCase()} support: ${support ? '✅' : '❌'}`)
      } catch (error) {
        this.formatSupport.set(format, false)
      }
    }
    
    // Select best supported format
    if (this.formatSupport.get('avif')) {
      this.config.preferredFormat = 'avif'
    } else if (this.formatSupport.get('webp')) {
      this.config.preferredFormat = 'webp'
    } else {
      this.config.preferredFormat = this.config.fallbackFormat
    }
    
    console.log(`🎯 Using format: ${this.config.preferredFormat}`)
  }

  /**
   * Test format support
   */
  testFormatSupport(format) {
    return new Promise((resolve) => {
      const testImages = {
        webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgS0AAAAAABNjb2xybmNseAABAA0AAQANAAAAAXBhc3AAAAABAAAAAAAAAA=='
      }
      
      const img = new Image()
      img.onload = () => resolve(img.width > 0 && img.height > 0)
      img.onerror = () => resolve(false)
      img.src = testImages[format]
    })
  }

  /**
   * Optimize image from file or blob
   */
  async optimizeImage(file, options = {}) {
    const config = { ...this.config, ...options }
    
    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Load image
      const img = await this.loadImageFromFile(file)
      
      // Calculate optimal dimensions
      const dimensions = this.calculateOptimalDimensions(
        img.width, 
        img.height, 
        config.maxWidth, 
        config.maxHeight
      )
      
      // Set canvas size
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      
      // Draw and optimize
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
      
      // Convert to optimized format
      const optimizedBlob = await this.canvasToOptimizedBlob(canvas, config)
      
      // Generate metadata
      const metadata = {
        originalSize: file.size,
        optimizedSize: optimizedBlob.size,
        compressionRatio: (1 - optimizedBlob.size / file.size) * 100,
        dimensions,
        format: config.preferredFormat,
        quality: config.quality
      }
      
      return {
        blob: optimizedBlob,
        metadata,
        url: URL.createObjectURL(optimizedBlob)
      }
      
    } catch (error) {
      console.error('Image optimization failed:', error)
      throw error
    }
  }

  /**
   * Create responsive image srcset
   */
  async createResponsiveImages(file, breakpoints = [320, 640, 768, 1024, 1200]) {
    const responsiveImages = new Map()
    
    try {
      const img = await this.loadImageFromFile(file)
      
      for (const width of breakpoints) {
        if (width <= img.width) {
          const height = Math.round((img.height / img.width) * width)
          
          const optimized = await this.optimizeImage(file, {
            maxWidth: width,
            maxHeight: height,
            quality: this.getQualityForSize(width)
          })
          
          responsiveImages.set(width, optimized)
        }
      }
      
      return responsiveImages
      
    } catch (error) {
      console.error('Responsive image creation failed:', error)
      return responsiveImages
    }
  }

  /**
   * Generate image thumbnail
   */
  async generateThumbnail(file, size = this.config.thumbnailSize) {
    try {
      const optimized = await this.optimizeImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
        format: 'webp'
      })
      
      return optimized
      
    } catch (error) {
      console.error('Thumbnail generation failed:', error)
      return null
    }
  }

  /**
   * Setup lazy loading with Intersection Observer
   */
  setupLazyLoading() {
    if (!this.config.enableLazyLoading || typeof window === 'undefined') return
    
    this.lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            this.loadLazyImage(img)
            this.lazyLoadObserver.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    )
    
    console.log('👁️ Lazy loading observer initialized')
  }

  /**
   * Load lazy image
   */
  async loadLazyImage(img) {
    const src = img.dataset.src
    const srcset = img.dataset.srcset
    
    if (!src) return
    
    try {
      this.setLoadingState(img, 'loading')
      
      // Preload image
      await this.preloadImage(src)
      
      // Set source
      if (srcset) img.srcset = srcset
      img.src = src
      
      // Add fade-in effect
      img.style.opacity = '0'
      img.style.transition = 'opacity 0.3s ease-in-out'
      
      img.onload = () => {
        img.style.opacity = '1'
        this.setLoadingState(img, 'loaded')
        img.classList.add('loaded')
      }
      
      img.onerror = () => {
        this.setLoadingState(img, 'error')
        this.handleImageLoadError(img)
      }
      
    } catch (error) {
      console.error('Lazy image loading failed:', error)
      this.setLoadingState(img, 'error')
    }
  }

  /**
   * Register image for lazy loading
   */
  registerLazyImage(img, src, srcset = null) {
    if (!this.config.enableLazyLoading) {
      img.src = src
      if (srcset) img.srcset = srcset
      return
    }
    
    img.dataset.src = src
    if (srcset) img.dataset.srcset = srcset
    
    // Add placeholder
    img.src = this.generatePlaceholder(img.width || 300, img.height || 200)
    img.classList.add('lazy-image')
    
    // Observe for lazy loading
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.observe(img)
    }
  }

  /**
   * Generate placeholder image
   */
  generatePlaceholder(width, height, color = '#f3f4f6') {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = width
    canvas.height = height
    
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    
    // Add loading indicator
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Loading...', width / 2, height / 2)
    
    return canvas.toDataURL('image/png')
  }

  /**
   * Setup image caching
   */
  setupImageCaching() {
    if (!this.config.enableCaching) return
    
    // Load cached images from storage
    this.loadImageCache()
    
    // Periodic cache cleanup
    setInterval(() => {
      this.cleanupImageCache()
    }, 60 * 60 * 1000) // Every hour
    
    console.log('💾 Image caching initialized')
  }

  /**
   * Cache optimized image
   */
  cacheImage(url, blob, metadata) {
    if (!this.config.enableCaching) return
    
    const cacheEntry = {
      blob,
      metadata,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    }
    
    this.imageCache.set(url, cacheEntry)
    
    // Persist to IndexedDB for larger images
    if (blob.size > 100000) { // 100KB
      this.persistImageToIndexedDB(url, cacheEntry)
    }
  }

  /**
   * Get cached image
   */
  getCachedImage(url) {
    const cached = this.imageCache.get(url)
    
    if (!cached) return null
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.config.cacheExpiry) {
      this.imageCache.delete(url)
      return null
    }
    
    // Update access stats
    cached.accessCount++
    cached.lastAccessed = Date.now()
    
    return cached
  }

  /**
   * Preload critical images
   */
  async preloadCriticalImages() {
    const criticalImages = [
      '/icons/logo.svg',
      '/images/hero-bg.webp',
      '/images/app-icon-192.png'
    ]
    
    const preloadPromises = criticalImages.map(url => this.preloadImage(url))
    
    try {
      await Promise.all(preloadPromises)
      console.log('🚀 Critical images preloaded')
    } catch (error) {
      console.warn('Some critical images failed to preload:', error)
    }
  }

  /**
   * Preload single image
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * Progressive loading implementation
   */
  async loadProgressiveImage(container, src, options = {}) {
    if (!this.config.enableProgressiveLoading) {
      const img = document.createElement('img')
      img.src = src
      container.appendChild(img)
      return img
    }
    
    const config = { ...this.config, ...options }
    
    // Create low-quality placeholder
    const placeholder = document.createElement('img')
    placeholder.src = this.generateBlurredPlaceholder(src)
    placeholder.style.filter = 'blur(10px)'
    placeholder.style.transition = 'filter 0.3s ease-out'
    container.appendChild(placeholder)
    
    try {
      // Load full-quality image
      const fullImg = await this.preloadImage(src)
      
      // Create final image element
      const img = document.createElement('img')
      img.src = src
      img.style.opacity = '0'
      img.style.transition = 'opacity 0.3s ease-in-out'
      
      container.appendChild(img)
      
      // Fade in full image and remove placeholder
      img.onload = () => {
        img.style.opacity = '1'
        setTimeout(() => {
          placeholder.style.filter = 'blur(0px)'
          setTimeout(() => {
            if (placeholder.parentNode) {
              placeholder.parentNode.removeChild(placeholder)
            }
          }, 300)
        }, 100)
      }
      
      return img
      
    } catch (error) {
      console.error('Progressive image loading failed:', error)
      return placeholder
    }
  }

  /**
   * Handle image load errors
   */
  handleImageLoadError(img) {
    console.warn('Image failed to load:', img.src)
    
    // Try fallback format
    if (img.src.includes('.webp')) {
      const fallbackSrc = img.src.replace('.webp', '.jpg')
      img.src = fallbackSrc
      return
    }
    
    // Use error placeholder
    img.src = this.generateErrorPlaceholder(img.width || 300, img.height || 200)
    img.alt = 'Image failed to load'
  }

  /**
   * Generate error placeholder
   */
  generateErrorPlaceholder(width, height) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = width
    canvas.height = height
    
    // Error background
    ctx.fillStyle = '#fee2e2'
    ctx.fillRect(0, 0, width, height)
    
    // Error icon
    ctx.fillStyle = '#dc2626'
    ctx.font = '24px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚠️', width / 2, height / 2 - 10)
    
    // Error text
    ctx.font = '12px system-ui'
    ctx.fillText('Failed to load', width / 2, height / 2 + 15)
    
    return canvas.toDataURL('image/png')
  }

  /**
   * Utility methods
   */
  loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight }
    
    // Scale down if too large
    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height)
    }
  }

  async canvasToOptimizedBlob(canvas, config) {
    const format = `image/${config.preferredFormat}`
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, format, config.quality)
    })
  }

  getQualityForSize(width) {
    if (width <= 320) return 0.6      // Mobile - lower quality
    if (width <= 768) return 0.7      // Tablet - medium quality
    return 0.8                        // Desktop - high quality
  }

  generateBlurredPlaceholder(src) {
    // In a real implementation, this would generate a low-res version
    return this.generatePlaceholder(50, 50, '#e5e7eb')
  }

  setLoadingState(img, state) {
    const id = img.dataset.imageId || img.src
    this.loadingStates.set(id, {
      state,
      timestamp: Date.now(),
      element: img
    })
  }

  loadImageCache() {
    try {
      const cached = localStorage.getItem('imageCache')
      if (cached) {
        const data = JSON.parse(cached)
        // Only load metadata, not actual blobs
        Object.entries(data).forEach(([url, entry]) => {
          if (entry.metadata) {
            this.imageCache.set(url, {
              ...entry,
              blob: null // Don't load blobs from localStorage
            })
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load image cache:', error)
    }
  }

  cleanupImageCache() {
    const now = Date.now()
    const toDelete = []
    
    this.imageCache.forEach((entry, url) => {
      if (now - entry.timestamp > this.config.cacheExpiry) {
        toDelete.push(url)
      }
    })
    
    toDelete.forEach(url => {
      this.imageCache.delete(url)
      if (this.imageCache.get(url)?.blob) {
        URL.revokeObjectURL(url)
      }
    })
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} expired cached images`)
    }
  }

  async persistImageToIndexedDB(url, cacheEntry) {
    // IndexedDB implementation for large image caching
    try {
      const db = await this.openImageDB()
      const transaction = db.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')
      
      await store.put({
        url,
        blob: cacheEntry.blob,
        metadata: cacheEntry.metadata,
        timestamp: cacheEntry.timestamp
      })
      
    } catch (error) {
      console.warn('Failed to persist image to IndexedDB:', error)
    }
  }

  openImageDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ImageCache', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'url' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // API methods
  getOptimizationStats() {
    return {
      optimizedImages: this.optimizedImages.size,
      cachedImages: this.imageCache.size,
      formatSupport: Object.fromEntries(this.formatSupport),
      config: this.config
    }
  }

  getLoadingStates() {
    return Object.fromEntries(this.loadingStates)
  }

  async optimizeImageFromUrl(url, options = {}) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], 'image', { type: blob.type })
      
      return await this.optimizeImage(file, options)
      
    } catch (error) {
      console.error('Failed to optimize image from URL:', error)
      return null
    }
  }

  createOptimizedPicture(src, alt = '', className = '') {
    const picture = document.createElement('picture')
    
    // Add WebP source if supported
    if (this.formatSupport.get('webp')) {
      const webpSource = document.createElement('source')
      webpSource.srcset = src.replace(/\.(jpg|jpeg|png)$/, '.webp')
      webpSource.type = 'image/webp'
      picture.appendChild(webpSource)
    }
    
    // Add AVIF source if supported
    if (this.formatSupport.get('avif')) {
      const avifSource = document.createElement('source')
      avifSource.srcset = src.replace(/\.(jpg|jpeg|png)$/, '.avif')
      avifSource.type = 'image/avif'
      picture.appendChild(avifSource)
    }
    
    // Fallback image
    const img = document.createElement('img')
    img.src = src
    img.alt = alt
    img.className = className
    picture.appendChild(img)
    
    return picture
  }

  stop() {
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect()
    }
    
    // Clean up object URLs
    this.imageCache.forEach((entry, url) => {
      if (entry.blob && url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    
    this.imageCache.clear()
    this.optimizedImages.clear()
    this.loadingStates.clear()
    
    this.isInitialized = false
    console.log('🛑 Image Optimization Service stopped')
  }
}

export const imageOptimizationService = new ImageOptimizationService()
export default imageOptimizationService