// Icon generator for PWA
// Run this script to generate all required icons from a base icon

const fs = require('fs')
const path = require('path')

// Icon sizes needed for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png', purpose: 'any' },
  { size: 96, name: 'icon-96x96.png', purpose: 'any' },
  { size: 128, name: 'icon-128x128.png', purpose: 'any' },
  { size: 144, name: 'icon-144x144.png', purpose: 'any' },
  { size: 152, name: 'icon-152x152.png', purpose: 'any' },
  { size: 192, name: 'icon-192x192.png', purpose: 'any maskable' },
  { size: 384, name: 'icon-384x384.png', purpose: 'any' },
  { size: 512, name: 'icon-512x512.png', purpose: 'any maskable' }
]

// Shortcut icons
const SHORTCUT_ICONS = [
  { name: 'shortcut-meal.png', content: '🍽️' },
  { name: 'shortcut-scan.png', content: '📱' },
  { name: 'shortcut-workout.png', content: '💪' },
  { name: 'shortcut-sleep.png', content: '😴' }
]

// Badge icon
const BADGE_SIZE = { size: 72, name: 'badge-72x72.png' }

/**
 * Generate SVG icon with fitness theme
 * @param {number} size - Icon size
 * @param {string} content - Icon content (emoji or symbol)
 * @returns {string} SVG content
 */
function generateSVGIcon(size, content = '💪') {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#gradient)" filter="url(#shadow)"/>
  
  <!-- Icon content -->
  <text x="${size/2}" y="${size/2 + size/8}" text-anchor="middle" font-size="${size/3}" fill="white" font-family="system-ui">
    ${content}
  </text>
  
  <!-- Subtle border -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
</svg>`.trim()
}

/**
 * Generate maskable icon (with safe zone padding)
 * @param {number} size - Icon size
 * @returns {string} SVG content
 */
function generateMaskableIcon(size) {
  const padding = size * 0.1 // 10% padding for safe zone
  const innerSize = size - (padding * 2)
  
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Full background (maskable area) -->
  <rect width="${size}" height="${size}" fill="url(#gradient)"/>
  
  <!-- Safe zone content -->
  <circle cx="${size/2}" cy="${size/2}" r="${innerSize/2}" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  
  <!-- Icon content in safe zone -->
  <text x="${size/2}" y="${size/2 + innerSize/8}" text-anchor="middle" font-size="${innerSize/3}" fill="white" font-family="system-ui">
    💪
  </text>
</svg>`.trim()
}

/**
 * Create icons directory structure
 */
function createIconsDirectory() {
  const iconsDir = path.join(__dirname, '../../public/icons')
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
    console.log('✅ Created icons directory')
  }
  
  return iconsDir
}

/**
 * Generate all PWA icons
 */
function generateIcons() {
  console.log('🎨 Generating PWA icons...')
  
  const iconsDir = createIconsDirectory()
  
  // Generate main app icons
  ICON_SIZES.forEach(iconConfig => {
    const { size, name, purpose } = iconConfig
    
    let svgContent
    if (purpose.includes('maskable')) {
      svgContent = generateMaskableIcon(size)
    } else {
      svgContent = generateSVGIcon(size)
    }
    
    const filePath = path.join(iconsDir, name)
    fs.writeFileSync(filePath, svgContent)
    console.log(`✅ Generated ${name} (${size}x${size})`)
  })
  
  // Generate shortcut icons
  SHORTCUT_ICONS.forEach(shortcut => {
    const svgContent = generateSVGIcon(96, shortcut.content)
    const filePath = path.join(iconsDir, shortcut.name)
    fs.writeFileSync(filePath, svgContent)
    console.log(`✅ Generated ${shortcut.name}`)
  })
  
  // Generate badge icon
  const badgeSvg = generateSVGIcon(BADGE_SIZE.size, '🏃')
  const badgePath = path.join(iconsDir, BADGE_SIZE.name)
  fs.writeFileSync(badgePath, badgeSvg)
  console.log(`✅ Generated ${BADGE_SIZE.name}`)
  
  console.log('🎉 All icons generated successfully!')
}

/**
 * Generate Apple Touch icons for iOS
 */
function generateAppleIcons() {
  console.log('🍎 Generating Apple Touch icons...')
  
  const iconsDir = createIconsDirectory()
  
  const appleSizes = [120, 152, 167, 180]
  
  appleSizes.forEach(size => {
    const svgContent = generateSVGIcon(size)
    const fileName = `apple-touch-icon-${size}x${size}.png`
    const filePath = path.join(iconsDir, fileName)
    fs.writeFileSync(filePath, svgContent)
    console.log(`✅ Generated ${fileName}`)
  })
  
  // Default apple-touch-icon
  const defaultApple = generateSVGIcon(180)
  const defaultPath = path.join(iconsDir, 'apple-touch-icon.png')
  fs.writeFileSync(defaultPath, defaultApple)
  console.log('✅ Generated apple-touch-icon.png')
}

/**
 * Generate favicon in multiple formats
 */
function generateFavicons() {
  console.log('🔖 Generating favicons...')
  
  const publicDir = path.join(__dirname, '../../public')
  
  // 32x32 favicon
  const favicon32 = generateSVGIcon(32)
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), favicon32)
  
  // 16x16 favicon
  const favicon16 = generateSVGIcon(16)
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), favicon16)
  
  // SVG favicon
  const faviconSvg = generateSVGIcon(32)
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg)
  
  console.log('✅ Generated favicons')
}

/**
 * Generate all required icons and assets
 */
function generateAllAssets() {
  try {
    generateIcons()
    generateAppleIcons()
    generateFavicons()
    
    console.log('\n🎉 All PWA assets generated successfully!')
    console.log('\nNext steps:')
    console.log('1. Add these meta tags to your HTML head:')
    console.log('   <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">')
    console.log('   <link rel="icon" type="image/svg+xml" href="/favicon.svg">')
    console.log('   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">')
    console.log('   <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">')
    console.log('2. Ensure manifest.json is linked in your HTML')
    console.log('3. Test the icons on various devices and browsers')
    
  } catch (error) {
    console.error('❌ Error generating assets:', error)
  }
}

// Auto-generate if script is run directly
if (require.main === module) {
  generateAllAssets()
}

module.exports = {
  generateIcons,
  generateAppleIcons,
  generateFavicons,
  generateAllAssets
}