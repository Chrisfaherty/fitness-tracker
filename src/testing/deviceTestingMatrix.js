/**
 * Comprehensive Device Testing Matrix
 * Covers iOS Safari, Android Chrome, and various device configurations
 */

export const deviceTestingMatrix = {
  // Primary Target Devices - Must work perfectly
  primaryDevices: [
    {
      id: "iphone_14_pro_safari",
      category: "ios_flagship",
      priority: "critical",
      device: {
        name: "iPhone 14 Pro",
        os: "iOS 16.6+",
        browser: "Safari",
        screen: {
          size: "6.1 inch",
          resolution: "1179x2556",
          density: "460 ppi",
          type: "OLED"
        },
        hardware: {
          processor: "A16 Bionic",
          memory: "6GB",
          camera: "Triple 48MP system with ultra-wide and telephoto"
        }
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: true,
        zoom: true,
        focus: true,
        vibration: true,
        pwaInstall: true,
        orientationLock: true,
        wakeLock: false // Not supported in Safari
      },
      testConfiguration: {
        targetScanTime: "<2 seconds",
        successRate: ">95%",
        memoryLimit: "50MB",
        batteryImpact: "<10% per hour",
        networkModes: ["wifi", "5G", "LTE", "offline"]
      },
      knownIssues: [
        {
          issue: "PWA camera restrictions in iOS 16+",
          severity: "medium",
          workaround: "Detect PWA mode and show guidance"
        }
      ],
      testScenarios: [
        "barcode_scanning_accuracy",
        "camera_permission_flow", 
        "torch_functionality",
        "zoom_controls",
        "orientation_handling",
        "pwa_installation",
        "offline_functionality"
      ]
    },

    {
      id: "pixel_7_chrome",
      category: "android_flagship",
      priority: "critical",
      device: {
        name: "Google Pixel 7",
        os: "Android 13+",
        browser: "Chrome",
        screen: {
          size: "6.3 inch",
          resolution: "1080x2400",
          density: "416 ppi",
          type: "OLED"
        },
        hardware: {
          processor: "Google Tensor G2",
          memory: "8GB",
          camera: "Dual 50MP main and 12MP ultra-wide"
        }
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: true,
        zoom: true,
        focus: true,
        vibration: true,
        pwaInstall: true,
        orientationLock: true,
        wakeLock: true
      },
      testConfiguration: {
        targetScanTime: "<1.5 seconds",
        successRate: ">98%",
        memoryLimit: "60MB",
        batteryImpact: "<8% per hour",
        networkModes: ["wifi", "5G", "LTE", "3G", "offline"]
      },
      knownIssues: [],
      testScenarios: [
        "advanced_camera_controls",
        "high_performance_scanning",
        "pwa_integration",
        "notification_system",
        "background_sync"
      ]
    }
  ],

  // Secondary Devices - Should work well
  secondaryDevices: [
    {
      id: "iphone_13_safari",
      category: "ios_mainstream",
      priority: "high",
      device: {
        name: "iPhone 13",
        os: "iOS 15.x - 16.x",
        browser: "Safari",
        screen: {
          size: "6.1 inch", 
          resolution: "1170x2532",
          density: "460 ppi",
          type: "OLED"
        }
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: true,
        zoom: "limited", // Hardware dependent
        focus: true,
        vibration: true,
        pwaInstall: true,
        orientationLock: true,
        wakeLock: false
      },
      testConfiguration: {
        targetScanTime: "<3 seconds",
        successRate: ">90%",
        memoryLimit: "45MB",
        batteryImpact: "<12% per hour"
      }
    },

    {
      id: "samsung_s22_chrome",
      category: "android_mainstream",
      priority: "high", 
      device: {
        name: "Samsung Galaxy S22",
        os: "Android 12+",
        browser: "Chrome",
        screen: {
          size: "6.1 inch",
          resolution: "1080x2340", 
          density: "425 ppi",
          type: "Dynamic AMOLED"
        }
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: true,
        zoom: true,
        focus: true,
        vibration: true,
        pwaInstall: true,
        orientationLock: true,
        wakeLock: true
      },
      testConfiguration: {
        targetScanTime: "<2 seconds",
        successRate: ">95%",
        memoryLimit: "55MB",
        batteryImpact: "<10% per hour"
      }
    },

    {
      id: "ipad_air_safari",
      category: "tablet_ios",
      priority: "high",
      device: {
        name: "iPad Air (5th gen)",
        os: "iPadOS 16+",
        browser: "Safari",
        screen: {
          size: "10.9 inch",
          resolution: "1640x2360",
          density: "264 ppi",
          type: "Liquid Retina"
        }
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: false, // No flash on most iPads
        zoom: true,
        focus: true,
        vibration: false, // iPads don't vibrate
        pwaInstall: true,
        orientationLock: true,
        wakeLock: false
      },
      testConfiguration: {
        targetScanTime: "<2.5 seconds",
        successRate: ">92%",
        memoryLimit: "70MB", // More memory available
        batteryImpact: "<15% per hour" // Larger battery
      },
      specialConsiderations: [
        "larger_screen_ui_adaptation",
        "no_vibration_feedback",
        "landscape_orientation_preference"
      ]
    }
  ],

  // Budget/Older Devices - Should work acceptably
  budgetDevices: [
    {
      id: "iphone_se_2020_safari",
      category: "ios_budget", 
      priority: "medium",
      device: {
        name: "iPhone SE (2nd generation)",
        os: "iOS 15.x+",
        browser: "Safari",
        screen: {
          size: "4.7 inch",
          resolution: "750x1334",
          density: "326 ppi",
          type: "LCD"
        },
        hardware: {
          processor: "A13 Bionic",
          memory: "3GB",
          camera: "Single 12MP"
        }
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: true,
        zoom: false, // No optical zoom
        focus: true,
        vibration: true,
        pwaInstall: true,
        orientationLock: true,
        wakeLock: false
      },
      testConfiguration: {
        targetScanTime: "<4 seconds",
        successRate: ">85%",
        memoryLimit: "35MB", // Less memory available
        batteryImpact: "<15% per hour"
      },
      specialConsiderations: [
        "small_screen_ui_adaptation",
        "single_camera_limitations",
        "older_ios_compatibility"
      ]
    },

    {
      id: "moto_g_power_chrome",
      category: "android_budget",
      priority: "medium",
      device: {
        name: "Motorola Moto G Power",
        os: "Android 10+",
        browser: "Chrome",
        screen: {
          size: "6.4 inch",
          resolution: "1080x2300",
          density: "399 ppi",
          type: "IPS LCD"
        },
        hardware: {
          processor: "Snapdragon 662",
          memory: "4GB",
          camera: "Triple 48MP system"
        }
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: true,
        zoom: "limited", // Digital only
        focus: true,
        vibration: true,
        pwaInstall: true,
        orientationLock: true,
        wakeLock: "maybe" // Depends on Android version
      },
      testConfiguration: {
        targetScanTime: "<5 seconds",
        successRate: ">80%",
        memoryLimit: "40MB",
        batteryImpact: "<12% per hour" // Large battery
      },
      specialConsiderations: [
        "slower_processor_optimization",
        "budget_camera_quality",
        "older_android_compatibility"
      ]
    }
  ],

  // Cross-Browser Testing - Secondary browsers
  crossBrowserDevices: [
    {
      id: "iphone_14_chrome",
      category: "ios_chrome",
      priority: "medium",
      device: {
        name: "iPhone 14",
        os: "iOS 16+",
        browser: "Chrome",
        limitations: "WebKit restrictions on iOS"
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: false, // Limited in Chrome iOS
        zoom: false,
        focus: "basic",
        vibration: true,
        pwaInstall: false, // Chrome can't install PWAs on iOS
        orientationLock: true,
        wakeLock: false
      },
      testConfiguration: {
        targetScanTime: "<4 seconds",
        successRate: ">75%",
        memoryLimit: "40MB"
      }
    },

    {
      id: "android_firefox",
      category: "android_firefox",
      priority: "low",
      device: {
        name: "Generic Android Device",
        browser: "Firefox Mobile",
        limitations: "Limited camera API support"
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: false,
        zoom: false,
        focus: "basic",
        vibration: true,
        pwaInstall: false,
        orientationLock: true,
        wakeLock: false
      },
      testConfiguration: {
        targetScanTime: "<6 seconds",
        successRate: ">70%",
        memoryLimit: "35MB"
      }
    },

    {
      id: "samsung_internet",
      category: "samsung_browser",
      priority: "medium",
      device: {
        name: "Samsung Galaxy Device",
        browser: "Samsung Internet",
        specialFeatures: "Samsung-specific optimizations"
      },
      expectedFeatures: {
        cameraAccess: true,
        torch: true,
        zoom: true,
        focus: true,
        vibration: true,
        pwaInstall: true,
        orientationLock: true,
        wakeLock: true
      },
      testConfiguration: {
        targetScanTime: "<3 seconds",
        successRate: ">88%",
        memoryLimit: "50MB"
      }
    }
  ],

  // Screen Size Categories
  screenSizeCategories: [
    {
      category: "small_phones",
      screenSizeRange: "4.0 - 5.4 inch",
      examples: ["iPhone SE", "iPhone 12 mini"],
      testFocus: [
        "ui_element_accessibility",
        "touch_target_sizes", 
        "text_readability",
        "camera_viewfinder_size"
      ],
      adaptations: [
        "larger_touch_targets",
        "simplified_ui",
        "clear_fonts"
      ]
    },
    {
      category: "standard_phones", 
      screenSizeRange: "5.5 - 6.5 inch",
      examples: ["iPhone 14", "Pixel 7", "Galaxy S22"],
      testFocus: [
        "optimal_ui_layout",
        "standard_interactions",
        "normal_scanning_distance"
      ],
      adaptations: [
        "standard_ui_elements",
        "balanced_layout"
      ]
    },
    {
      category: "large_phones",
      screenSizeRange: "6.6 - 7.0 inch", 
      examples: ["iPhone 14 Pro Max", "Galaxy S22 Ultra"],
      testFocus: [
        "one_handed_usage",
        "reachability",
        "landscape_mode"
      ],
      adaptations: [
        "reachable_controls",
        "one_handed_optimization"
      ]
    },
    {
      category: "tablets",
      screenSizeRange: "8.0+ inch",
      examples: ["iPad", "Galaxy Tab", "Surface"],
      testFocus: [
        "landscape_optimization",
        "split_screen_compatibility",
        "keyboard_integration"
      ],
      adaptations: [
        "landscape_ui_layout",
        "tablet_specific_features"
      ]
    }
  ]
}

// Test execution framework
export const deviceTestFramework = {
  /**
   * Get test suite for specific device
   */
  getTestSuiteForDevice: (deviceId) => {
    const device = deviceTestingMatrix.primaryDevices.find(d => d.id === deviceId) ||
                  deviceTestingMatrix.secondaryDevices.find(d => d.id === deviceId) ||
                  deviceTestingMatrix.budgetDevices.find(d => d.id === deviceId) ||
                  deviceTestingMatrix.crossBrowserDevices.find(d => d.id === deviceId)
    
    if (!device) return null

    return {
      device,
      testSuite: {
        coreTests: [
          "camera_permission_request",
          "basic_barcode_scanning",
          "error_handling",
          "offline_functionality"
        ],
        featureTests: device.expectedFeatures,
        performanceTests: device.testConfiguration,
        scenarioTests: device.testScenarios || []
      }
    }
  },

  /**
   * Generate device compatibility report
   */
  generateCompatibilityReport: (testResults) => {
    const report = {
      totalDevicesTested: testResults.length,
      compatibilityMatrix: {},
      featureSupport: {},
      performanceMetrics: {},
      recommendations: []
    }

    // Analyze feature support across devices
    testResults.forEach(result => {
      const deviceCategory = result.device.category
      
      if (!report.compatibilityMatrix[deviceCategory]) {
        report.compatibilityMatrix[deviceCategory] = {
          tested: 0,
          passed: 0,
          issues: []
        }
      }
      
      report.compatibilityMatrix[deviceCategory].tested++
      if (result.overallPass) {
        report.compatibilityMatrix[deviceCategory].passed++
      } else {
        report.compatibilityMatrix[deviceCategory].issues.push(result.issues)
      }
    })

    return report
  },

  /**
   * Create device-specific test configuration
   */
  createDeviceTestConfig: (device) => {
    return {
      cameraConstraints: this.getCameraConstraints(device),
      performanceTargets: device.testConfiguration,
      featureFlags: device.expectedFeatures,
      adaptations: device.specialConsiderations || []
    }
  },

  /**
   * Get camera constraints for device
   */
  getCameraConstraints: (device) => {
    const baseConstraints = {
      video: {
        facingMode: { ideal: 'environment' }
      }
    }

    // iOS optimizations
    if (device.category.includes('ios')) {
      baseConstraints.video = {
        ...baseConstraints.video,
        width: { ideal: 1280, max: 1920, min: 640 },
        height: { ideal: 720, max: 1080, min: 480 },
        frameRate: { ideal: 30, max: 30 }
      }
    }

    // Android optimizations
    if (device.category.includes('android')) {
      baseConstraints.video = {
        ...baseConstraints.video,
        width: { ideal: 1280, max: 1920, min: 640 },
        height: { ideal: 720, max: 1080, min: 480 },
        focusMode: { ideal: 'continuous' }
      }
    }

    // Budget device constraints
    if (device.category.includes('budget')) {
      baseConstraints.video.width = { ideal: 800, max: 1280, min: 480 }
      baseConstraints.video.height = { ideal: 600, max: 720, min: 360 }
    }

    return baseConstraints
  },

  /**
   * Test priority matrix
   */
  getTestPriority: () => {
    return {
      critical: {
        devices: ["iphone_14_pro_safari", "pixel_7_chrome"],
        mustPass: 100,
        description: "Primary target devices - must work perfectly"
      },
      high: {
        devices: ["iphone_13_safari", "samsung_s22_chrome", "ipad_air_safari"],
        mustPass: 95,
        description: "Mainstream devices - should work very well"
      },
      medium: {
        devices: ["iphone_se_2020_safari", "moto_g_power_chrome", "samsung_internet"],
        mustPass: 85,
        description: "Budget/alternative devices - should work acceptably"
      },
      low: {
        devices: ["android_firefox", "iphone_14_chrome"],
        mustPass: 70,
        description: "Secondary browsers - basic functionality required"
      }
    }
  }
}

// Screen size testing utilities
export const screenSizeTestUtils = {
  /**
   * Get responsive breakpoints
   */
  getBreakpoints: () => {
    return {
      xs: "320px",  // iPhone SE portrait
      sm: "375px",  // iPhone standard portrait
      md: "414px",  // iPhone Plus portrait
      lg: "768px",  // iPad portrait
      xl: "1024px", // iPad landscape
      xxl: "1200px" // Desktop
    }
  },

  /**
   * Test UI adaptation for screen size
   */
  testUIAdaptation: (screenCategory) => {
    const adaptations = deviceTestingMatrix.screenSizeCategories
      .find(cat => cat.category === screenCategory)?.adaptations || []
    
    return {
      testElements: [
        "barcode_scanner_viewfinder",
        "control_buttons",
        "navigation_elements",
        "text_readability"
      ],
      requiredAdaptations: adaptations,
      testProcedure: [
        "load_scanner_interface",
        "check_element_sizes",
        "test_touch_interactions",
        "verify_readability",
        "test_orientation_changes"
      ]
    }
  }
}

export default deviceTestingMatrix