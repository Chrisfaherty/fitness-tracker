/**
 * Comprehensive Meal Logging Test Scenarios
 * Real-world workflows for testing the complete meal logging experience
 */

export const mealLoggingScenarios = {
  // Full Day Meal Logging Workflows
  fullDayScenarios: [
    {
      id: "typical_workday",
      name: "Typical Workday Meal Logging",
      duration: "Full day simulation (16 hours)",
      description: "Simulate a typical workday with breakfast, snacks, lunch, and dinner",
      user_profile: {
        type: "office_worker",
        goals: "maintain_weight",
        activity_level: "sedentary",
        dietary_restrictions: "none"
      },
      timeline: [
        {
          time: "07:00",
          meal_type: "breakfast",
          location: "home",
          network: "wifi",
          lighting: "indoor_morning",
          scenario: {
            description: "Quick breakfast before work",
            products: [
              { barcode: "038000000805", name: "Corn Flakes", method: "scan" },
              { barcode: "075720001026", name: "Milk 2%", method: "manual_entry" },
              { name: "Banana", method: "search" }
            ],
            challenges: ["time_pressure", "limited_lighting"],
            expected_duration: "2-3 minutes",
            success_criteria: ["all_items_logged", "under_3_minutes", "accurate_portions"]
          }
        },
        {
          time: "10:30", 
          meal_type: "snack",
          location: "office",
          network: "wifi",
          lighting: "office_fluorescent",
          scenario: {
            description: "Mid-morning snack at desk",
            products: [
              { barcode: "602652171000", name: "KIND Bar", method: "scan" }
            ],
            challenges: ["office_lighting", "small_barcode", "discrete_logging"],
            expected_duration: "1 minute",
            success_criteria: ["quick_scan", "no_disruption"]
          }
        },
        {
          time: "12:30",
          meal_type: "lunch", 
          location: "restaurant",
          network: "mobile_data",
          lighting: "indoor_restaurant",
          scenario: {
            description: "Restaurant lunch with packaged items",
            products: [
              { barcode: "049000042566", name: "Coca-Cola", method: "scan" },
              { name: "Chicken Caesar Salad", method: "search" },
              { barcode: "044000032456", name: "Cookies (dessert)", method: "scan" }
            ],
            challenges: ["poor_mobile_signal", "restaurant_lighting", "social_setting"],
            expected_duration: "3-4 minutes",
            success_criteria: ["mobile_data_sync", "social_acceptability"]
          }
        },
        {
          time: "15:00",
          meal_type: "snack",
          location: "office",
          network: "wifi", 
          lighting: "office_afternoon",
          scenario: {
            description: "Afternoon energy boost",
            products: [
              { barcode: "028400647465", name: "Chips", method: "scan" }
            ],
            challenges: ["reflective_packaging", "office_environment"],
            expected_duration: "1 minute",
            success_criteria: ["successful_scan_despite_glare"]
          }
        },
        {
          time: "19:00",
          meal_type: "dinner",
          location: "home",
          network: "wifi",
          lighting: "indoor_evening",
          scenario: {
            description: "Home dinner preparation",
            products: [
              { name: "Grilled Chicken Breast", method: "search" },
              { name: "Brown Rice", method: "search" },
              { name: "Mixed Vegetables", method: "search" },
              { barcode: "041520893413", name: "Sauce", method: "scan" }
            ],
            challenges: ["evening_lighting", "multiple_items", "cooking_workflow"],
            expected_duration: "5-6 minutes",
            success_criteria: ["complete_meal_logging", "accurate_portions"]
          }
        }
      ],
      offline_periods: [
        { start: "11:00", end: "11:15", reason: "subway_commute" },
        { start: "17:30", end: "17:45", reason: "subway_commute" }
      ],
      validation_points: [
        "total_calories_reasonable",
        "macros_balanced", 
        "all_meals_synced",
        "offline_data_preserved",
        "daily_goals_tracked"
      ]
    },
    
    {
      id: "weekend_family_day",
      name: "Weekend Family Day",
      duration: "Weekend day (12 hours)",
      description: "Family-oriented weekend with varied meal situations",
      user_profile: {
        type: "parent",
        goals: "lose_weight",
        activity_level: "active",
        dietary_restrictions: "gluten_free"
      },
      timeline: [
        {
          time: "08:30",
          meal_type: "breakfast",
          location: "home",
          network: "wifi",
          lighting: "natural_morning",
          scenario: {
            description: "Family breakfast preparation",
            products: [
              { name: "Gluten-free pancakes", method: "search" },
              { name: "Maple syrup", method: "search" },
              { barcode: "075720001026", name: "Orange juice", method: "scan" }
            ],
            challenges: ["family_distractions", "dietary_restrictions"],
            expected_duration: "4-5 minutes",
            success_criteria: ["gluten_free_options_found", "family_meal_logged"]
          }
        },
        {
          time: "12:00",
          meal_type: "lunch",
          location: "park",
          network: "mobile_data_weak",
          lighting: "outdoor_bright",
          scenario: {
            description: "Picnic lunch in park", 
            products: [
              { barcode: "012345678905", name: "Gluten-free bread", method: "scan" },
              { name: "Turkey sandwich filling", method: "search" },
              { barcode: "016000275867", name: "Trail mix", method: "scan" }
            ],
            challenges: ["bright_sunlight", "weak_signal", "outdoor_conditions"],
            expected_duration: "3-4 minutes",
            success_criteria: ["outdoor_scanning_success", "offline_mode_fallback"]
          }
        },
        {
          time: "18:30",
          meal_type: "dinner",
          location: "restaurant",
          network: "wifi_public",
          lighting: "dim_restaurant",
          scenario: {
            description: "Family dinner at restaurant",
            products: [
              { name: "Gluten-free pasta", method: "search" },
              { name: "Grilled salmon", method: "search" },
              { barcode: "049000042566", name: "Diet soda", method: "scan" }
            ],
            challenges: ["dim_lighting", "public_wifi", "restaurant_menu"],
            expected_duration: "5-6 minutes",
            success_criteria: ["dim_light_scanning", "menu_item_search"]
          }
        }
      ],
      offline_periods: [
        { start: "11:30", end: "12:30", reason: "park_no_signal" }
      ],
      validation_points: [
        "dietary_restrictions_respected",
        "outdoor_scanning_successful",
        "offline_sync_working",
        "family_meal_portions_appropriate"
      ]
    },

    {
      id: "travel_day",
      name: "Travel Day Challenges",
      duration: "Travel day (14 hours)",
      description: "International travel with varied network and lighting conditions",
      user_profile: {
        type: "business_traveler",
        goals: "maintain_weight",
        activity_level: "moderate",
        dietary_restrictions: "vegetarian"
      },
      timeline: [
        {
          time: "05:00",
          meal_type: "breakfast", 
          location: "home",
          network: "wifi",
          lighting: "dim_early_morning",
          scenario: {
            description: "Early morning pre-travel meal",
            products: [
              { barcode: "030000010501", name: "Oatmeal", method: "scan" },
              { name: "Berries", method: "search" }
            ],
            challenges: ["very_early_hour", "dim_lighting", "time_pressure"],
            expected_duration: "2 minutes",
            success_criteria: ["quick_logging", "low_light_scan"]
          }
        },
        {
          time: "07:30",
          meal_type: "snack",
          location: "airport",
          network: "airport_wifi",
          lighting: "airport_fluorescent", 
          scenario: {
            description: "Airport snack before flight",
            products: [
              { barcode: "4901005103252", name: "International snack", method: "scan" },
              { name: "Coffee", method: "search" }
            ],
            challenges: ["crowded_environment", "international_barcode", "airport_wifi"],
            expected_duration: "2-3 minutes",
            success_criteria: ["international_barcode_recognition", "crowded_space_usability"]
          }
        },
        {
          time: "13:00",
          meal_type: "lunch",
          location: "airplane",
          network: "offline",
          lighting: "airplane_cabin",
          scenario: {
            description: "Airline meal logging",
            products: [
              { name: "Vegetarian airline meal", method: "manual_entry" },
              { name: "Airline snacks", method: "manual_entry" }
            ],
            challenges: ["complete_offline", "cramped_space", "unusual_foods"],
            expected_duration: "3-4 minutes",
            success_criteria: ["offline_functionality", "cramped_space_usability"]
          }
        },
        {
          time: "19:00",
          meal_type: "dinner",
          location: "hotel_international",
          network: "hotel_wifi_slow",
          lighting: "hotel_room",
          scenario: {
            description: "International hotel room dinner",
            products: [
              { barcode: "7622210001061", name: "European chocolate", method: "scan" },
              { name: "Local restaurant delivery", method: "search" }
            ],
            challenges: ["slow_international_wifi", "foreign_products", "jet_lag"],
            expected_duration: "4-5 minutes",
            success_criteria: ["international_product_recognition", "slow_network_handling"]
          }
        }
      ],
      offline_periods: [
        { start: "09:00", end: "15:00", reason: "flight_no_internet" }
      ],
      validation_points: [
        "offline_mode_robust",
        "international_barcodes_supported",
        "slow_network_graceful",
        "travel_stress_usable"
      ]
    }
  ],

  // Specific Challenge Scenarios
  challengeScenarios: [
    {
      id: "poor_lighting_marathon",
      name: "Poor Lighting Conditions Test",
      duration: "30 minutes",
      description: "Test scanning in various poor lighting conditions",
      test_conditions: [
        {
          condition: "very_dim_indoor",
          setup: "Room with minimal lighting (bedroom at night)",
          products: ["038000000805", "044000032456", "028400647465"],
          expected_performance: "slower_scans_acceptable"
        },
        {
          condition: "bright_sunlight_glare",
          setup: "Direct sunlight causing screen glare",
          products: ["075720001026", "049000042566", "602652171000"],
          expected_performance: "angle_adjustments_needed"
        },
        {
          condition: "fluorescent_flicker",
          setup: "Flickering fluorescent lights",
          products: ["3017620422003", "016000275867", "030000010501"],
          expected_performance: "consistent_despite_flicker"
        },
        {
          condition: "colored_lighting",
          setup: "Red/blue/yellow ambient lighting",
          products: ["4901005103252", "7622210001061", "041520893413"],
          expected_performance: "color_compensation_working"
        }
      ]
    },

    {
      id: "network_resilience_test",
      name: "Network Connectivity Challenges",
      duration: "45 minutes", 
      description: "Test app behavior under various network conditions",
      test_scenarios: [
        {
          scenario: "complete_offline",
          setup: "Airplane mode enabled",
          actions: ["scan_barcodes", "search_foods", "log_meals"],
          expected_behavior: "full_offline_functionality"
        },
        {
          scenario: "intermittent_connection",
          setup: "WiFi disconnecting every 2-3 minutes",
          actions: ["scan_during_disconnect", "sync_when_reconnected"],
          expected_behavior: "seamless_sync_recovery"
        },
        {
          scenario: "very_slow_connection",
          setup: "Throttled to 2G speeds",
          actions: ["product_lookup", "image_loading", "sync_operations"],
          expected_behavior: "graceful_slow_loading"
        },
        {
          scenario: "high_latency",
          setup: "Satellite internet simulation (800ms+ latency)",
          actions: ["real_time_scanning", "immediate_feedback"],
          expected_behavior: "responsive_ui_despite_latency"
        }
      ]
    },

    {
      id: "barcode_difficulty_progression",
      name: "Barcode Scanning Difficulty Progression",
      duration: "60 minutes",
      description: "Progressive difficulty test from easy to extreme",
      difficulty_levels: [
        {
          level: "easy",
          products: ["038000000805", "075720001026", "044000032456"],
          conditions: "ideal_lighting_close_distance",
          target_success_rate: "95%",
          target_scan_time: "<2_seconds"
        },
        {
          level: "medium", 
          products: ["028400647465", "049000042566", "016000275867"],
          conditions: "normal_lighting_normal_distance",
          target_success_rate: "85%",
          target_scan_time: "<3_seconds"
        },
        {
          level: "hard",
          products: ["602652171000", "4901005103252", "7622210001061"],
          conditions: "challenging_lighting_varied_distance",
          target_success_rate: "70%",
          target_scan_time: "<5_seconds"
        },
        {
          level: "extreme",
          products: ["041520893413", "damaged_barcodes", "partially_obscured"],
          conditions: "poor_lighting_difficult_angles",
          target_success_rate: "50%",
          target_scan_time: "<10_seconds"
        }
      ]
    }
  ],

  // Multi-Device Testing Scenarios
  multiDeviceScenarios: [
    {
      id: "cross_device_sync",
      name: "Cross-Device Synchronization",
      duration: "30 minutes",
      description: "Test data sync across multiple devices",
      devices: ["ios_phone", "android_tablet", "desktop_browser"],
      test_flow: [
        {
          step: 1,
          device: "ios_phone",
          action: "log_breakfast_offline",
          expected: "data_stored_locally"
        },
        {
          step: 2, 
          device: "android_tablet",
          action: "log_lunch_online",
          expected: "immediate_cloud_sync"
        },
        {
          step: 3,
          device: "ios_phone",
          action: "go_online",
          expected: "breakfast_syncs_lunch_appears"
        },
        {
          step: 4,
          device: "desktop_browser",
          action: "view_daily_log",
          expected: "all_meals_visible"
        }
      ]
    },

    {
      id: "device_capability_matrix",
      name: "Device Capability Testing Matrix",
      duration: "2 hours",
      description: "Comprehensive testing across device capabilities",
      test_matrix: [
        {
          device_type: "ios_safari_latest",
          features_to_test: ["camera_access", "torch", "zoom", "focus", "vibration", "pwa_install"],
          barcode_types: ["UPC-A", "EAN-13", "EAN-8"],
          expected_performance: "full_features"
        },
        {
          device_type: "android_chrome_latest", 
          features_to_test: ["camera_access", "torch", "zoom", "focus", "vibration", "pwa_install"],
          barcode_types: ["UPC-A", "EAN-13", "EAN-8", "Code-128"],
          expected_performance: "full_features"
        },
        {
          device_type: "ios_chrome",
          features_to_test: ["camera_access", "basic_scanning"],
          barcode_types: ["UPC-A", "EAN-13"],
          expected_performance: "basic_features"
        },
        {
          device_type: "android_firefox",
          features_to_test: ["camera_access", "basic_scanning", "offline_mode"],
          barcode_types: ["UPC-A", "EAN-13"],
          expected_performance: "basic_features"
        }
      ]
    }
  ],

  // Performance Stress Tests
  performanceTests: [
    {
      id: "extended_use_session",
      name: "Extended Use Session",
      duration: "2 hours continuous",
      description: "Test memory leaks and performance degradation",
      test_protocol: {
        scan_frequency: "every_2_minutes",
        total_scans: 60,
        memory_monitoring: "continuous",
        battery_monitoring: "enabled",
        performance_metrics: ["scan_time", "memory_usage", "cpu_usage", "battery_drain"]
      },
      products_rotation: [
        "038000000805", "028400647465", "044000032456", 
        "075720001026", "602652171000", "3017620422003"
      ],
      acceptance_criteria: {
        memory_growth: "<20MB over 2 hours",
        scan_time_degradation: "<10% increase",
        battery_drain: "<15% per hour",
        no_crashes: "zero_tolerance"
      }
    },

    {
      id: "rapid_succession_scanning",
      name: "Rapid Succession Scanning Test",
      duration: "15 minutes",
      description: "Test system under rapid scanning load",
      test_protocol: {
        scan_interval: "5_seconds",
        total_scans: 180,
        concurrent_operations: ["search", "sync", "cache_updates"],
        stress_factors: ["quick_camera_starts", "frequent_permission_checks"]
      },
      expected_behavior: {
        scan_accuracy: ">90%",
        response_time: "consistent",
        ui_responsiveness: "smooth",
        error_recovery: "automatic"
      }
    }
  ]
}

// Test execution helpers
export const testExecutionHelpers = {
  /**
   * Generate test schedule for a scenario
   */
  generateTestSchedule: (scenario) => {
    const schedule = []
    
    scenario.timeline.forEach(timePoint => {
      schedule.push({
        scheduledTime: timePoint.time,
        mealType: timePoint.meal_type,
        location: timePoint.location,
        testItems: timePoint.scenario.products,
        challenges: timePoint.scenario.challenges,
        duration: timePoint.scenario.expected_duration,
        successCriteria: timePoint.scenario.success_criteria
      })
    })
    
    return schedule
  },

  /**
   * Create test result template
   */
  createTestResult: (scenario, timePoint) => {
    return {
      scenarioId: scenario.id,
      timePoint: timePoint.time,
      mealType: timePoint.meal_type,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      products: [],
      scanResults: [],
      challenges: timePoint.scenario.challenges,
      successCriteria: timePoint.scenario.success_criteria,
      passed: null,
      notes: "",
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        connectionType: navigator.connection?.effectiveType,
        battery: null // Will be filled if available
      }
    }
  },

  /**
   * Validate scenario completion
   */
  validateScenarioCompletion: (scenario, results) => {
    const validation = {
      completed: true,
      totalTimePoints: scenario.timeline.length,
      completedTimePoints: results.length,
      validationPoints: {},
      overallScore: 0
    }

    // Check each validation point
    scenario.validation_points.forEach(point => {
      validation.validationPoints[point] = false // Will be updated based on actual testing
    })

    // Calculate completion rate
    validation.completionRate = (results.length / scenario.timeline.length) * 100

    // Check if all critical tests passed
    validation.criticalTestsPassed = results.every(result => 
      result.passed || !result.successCriteria.includes('critical')
    )

    return validation
  },

  /**
   * Generate comprehensive test report
   */
  generateComprehensiveReport: (scenarioResults) => {
    const report = {
      testDate: new Date().toISOString(),
      totalScenarios: scenarioResults.length,
      completedScenarios: scenarioResults.filter(s => s.completed).length,
      overallSuccessRate: 0,
      performance: {
        averageScanTime: 0,
        memoryUsage: {},
        batteryImpact: {},
        networkResilience: {}
      },
      deviceCompatibility: {},
      recommendations: [],
      criticalIssues: []
    }

    // Calculate overall metrics
    const allResults = scenarioResults.flatMap(s => s.results || [])
    
    if (allResults.length > 0) {
      report.overallSuccessRate = (allResults.filter(r => r.passed).length / allResults.length) * 100
      report.performance.averageScanTime = allResults.reduce((sum, r) => sum + (r.duration || 0), 0) / allResults.length
    }

    // Identify critical issues
    allResults.forEach(result => {
      if (!result.passed && result.successCriteria.includes('critical')) {
        report.criticalIssues.push({
          scenario: result.scenarioId,
          issue: result.notes,
          impact: 'high'
        })
      }
    })

    return report
  }
}

export default mealLoggingScenarios