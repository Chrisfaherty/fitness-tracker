/**
 * Comprehensive Product Barcode Test Database
 * Real-world products for barcode scanning testing
 */

export const testProductDatabase = {
  // Common Grocery Items - High Success Rate Expected
  commonGrocery: [
    {
      category: "Breakfast Cereals",
      products: [
        {
          name: "Kellogg's Corn Flakes",
          barcode: "038000000805",
          type: "UPC-A",
          difficulty: "easy",
          expectedNutrition: {
            calories: 100,
            protein: 2,
            carbs: 24,
            fats: 0,
            serving_size: "1 cup (30g)"
          },
          testNotes: "Large, clear barcode on box side",
          commonIssues: []
        },
        {
          name: "General Mills Cheerios",
          barcode: "016000275867",
          type: "UPC-A", 
          difficulty: "easy",
          expectedNutrition: {
            calories: 110,
            protein: 3,
            carbs: 20,
            fats: 2,
            serving_size: "1 cup (28g)"
          },
          testNotes: "Clear barcode, good contrast",
          commonIssues: []
        },
        {
          name: "Quaker Oats Original",
          barcode: "030000010501",
          type: "UPC-A",
          difficulty: "medium",
          expectedNutrition: {
            calories: 150,
            protein: 5,
            carbs: 27,
            fats: 3,
            serving_size: "1/2 cup dry (40g)"
          },
          testNotes: "Sometimes printed on curved surface",
          commonIssues: ["curved_surface", "small_print"]
        }
      ]
    },
    {
      category: "Snacks & Packaged Foods",
      products: [
        {
          name: "Lay's Classic Potato Chips",
          barcode: "028400647465",
          type: "UPC-A",
          difficulty: "medium",
          expectedNutrition: {
            calories: 160,
            protein: 2,
            carbs: 15,
            fats: 10,
            serving_size: "1 oz (28g)"
          },
          testNotes: "Reflective foil packaging",
          commonIssues: ["reflective_surface", "crinkled_packaging"]
        },
        {
          name: "Oreo Original Cookies",
          barcode: "044000032456",
          type: "UPC-A",
          difficulty: "easy",
          expectedNutrition: {
            calories: 160,
            protein: 2,
            carbs: 25,
            fats: 7,
            serving_size: "3 cookies (34g)"
          },
          testNotes: "Good contrast on dark packaging",
          commonIssues: []
        },
        {
          name: "KIND Dark Chocolate Nuts & Sea Salt Bar",
          barcode: "602652171000",
          type: "UPC-A",
          difficulty: "hard",
          expectedNutrition: {
            calories: 200,
            protein: 6,
            carbs: 16,
            fats: 16,
            serving_size: "1 bar (40g)"
          },
          testNotes: "Very small barcode on narrow package",
          commonIssues: ["small_barcode", "narrow_package", "low_contrast"]
        }
      ]
    },
    {
      category: "Beverages",
      products: [
        {
          name: "Coca-Cola Classic 12oz Can",
          barcode: "049000042566",
          type: "UPC-A",
          difficulty: "medium",
          expectedNutrition: {
            calories: 140,
            protein: 0,
            carbs: 39,
            fats: 0,
            serving_size: "1 can (355ml)"
          },
          testNotes: "Curved surface, red background",
          commonIssues: ["curved_surface", "color_contrast"]
        },
        {
          name: "Poland Spring Water 16.9oz",
          barcode: "075720001026",
          type: "UPC-A",
          difficulty: "easy",
          expectedNutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            serving_size: "1 bottle (500ml)"
          },
          testNotes: "Clear label, good contrast",
          commonIssues: []
        }
      ]
    }
  ],

  // International Products - EAN-13 Format
  international: [
    {
      category: "European Products",
      products: [
        {
          name: "Nutella Hazelnut Spread",
          barcode: "3017620422003",
          type: "EAN-13",
          difficulty: "easy",
          expectedNutrition: {
            calories: 546,
            protein: 6.3,
            carbs: 57.5,
            fats: 30.9,
            serving_size: "100g"
          },
          testNotes: "International EAN-13 format",
          commonIssues: []
        },
        {
          name: "Toblerone Milk Chocolate",
          barcode: "7622210001061",
          type: "EAN-13",
          difficulty: "medium",
          expectedNutrition: {
            calories: 534,
            protein: 8.8,
            carbs: 59.8,
            fats: 29.5,
            serving_size: "100g"
          },
          testNotes: "Triangular packaging, unique shape",
          commonIssues: ["irregular_shape", "small_barcode"]
        }
      ]
    },
    {
      category: "Asian Products",
      products: [
        {
          name: "Pocky Strawberry Sticks",
          barcode: "4901005103252",
          type: "EAN-13",
          difficulty: "hard",
          expectedNutrition: {
            calories: 161,
            protein: 2.2,
            carbs: 23.1,
            fats: 6.6,
            serving_size: "1 pack (47g)"
          },
          testNotes: "Small package, colorful design",
          commonIssues: ["small_package", "busy_design", "low_contrast"]
        },
        {
          name: "Kikkoman Soy Sauce",
          barcode: "0041390001734",
          type: "UPC-A",
          difficulty: "medium",
          expectedNutrition: {
            calories: 10,
            protein: 1.5,
            carbs: 1,
            fats: 0,
            serving_size: "1 tbsp (15ml)"
          },
          testNotes: "Dark bottle, may have glare",
          commonIssues: ["dark_surface", "glare", "liquid_container"]
        }
      ]
    }
  ],

  // Damaged/Unclear Barcodes - Stress Testing
  damagedBarcodes: [
    {
      category: "Physical Damage",
      products: [
        {
          name: "Crumpled Package Test",
          barcode: "012345678905", // Generic test barcode
          type: "UPC-A",
          difficulty: "extreme",
          simulatedDamage: [
            "crumpled_packaging",
            "torn_corners",
            "partial_obstruction"
          ],
          testInstructions: "Test with deliberately crumpled packages",
          expectedBehavior: "Should handle minor damage, fail gracefully on major damage"
        },
        {
          name: "Faded Print Test",
          barcode: "012345678912",
          type: "UPC-A", 
          difficulty: "extreme",
          simulatedDamage: [
            "faded_print",
            "low_contrast",
            "sun_damage"
          ],
          testInstructions: "Test with sun-faded or old packages",
          expectedBehavior: "May require multiple scan attempts"
        },
        {
          name: "Partially Obscured Test",
          barcode: "012345678929",
          type: "UPC-A",
          difficulty: "extreme",
          simulatedDamage: [
            "partial_tape_coverage",
            "price_sticker_overlap",
            "label_damage"
          ],
          testInstructions: "Cover portions of barcode with tape/stickers",
          expectedBehavior: "Should detect when recoverable data available"
        }
      ]
    }
  ],

  // Edge Cases - Extreme Testing Scenarios
  edgeCases: [
    {
      category: "Size Extremes",
      products: [
        {
          name: "Tiny Barcode Test (Gum/Mints)",
          barcode: "022000120090", // Wrigley's 5 Gum
          type: "UPC-A",
          difficulty: "extreme",
          challengeType: "very_small_barcode",
          testNotes: "Barcode less than 1 inch wide",
          requiredDistance: "Very close (2-4 inches)",
          commonIssues: ["small_barcode", "close_focus_required"]
        },
        {
          name: "Large Package Test",
          barcode: "088169013130", // Example bulk item
          type: "UPC-A",
          difficulty: "medium",
          challengeType: "large_package",
          testNotes: "Large box, barcode placement varies",
          commonIssues: ["barcode_location", "package_size"]
        }
      ]
    },
    {
      category: "Reflective Packaging",
      products: [
        {
          name: "Chip Bag Reflection Test",
          barcode: "028400047685", // Doritos
          type: "UPC-A",
          difficulty: "hard",
          challengeType: "highly_reflective",
          testNotes: "Metallic foil creates glare",
          testConditions: ["various_lighting", "different_angles"],
          commonIssues: ["glare", "reflection", "angle_dependent"]
        },
        {
          name: "Plastic Bottle Test",
          barcode: "012000638228", // Gatorade
          type: "UPC-A",
          difficulty: "medium",
          challengeType: "curved_reflective",
          testNotes: "Curved plastic surface with potential glare",
          commonIssues: ["curved_surface", "plastic_glare"]
        }
      ]
    },
    {
      category: "Poor Contrast",
      products: [
        {
          name: "White on White Test",
          barcode: "041520893413", // Generic white packaging
          type: "UPC-A",
          difficulty: "extreme",
          challengeType: "low_contrast",
          testNotes: "Light barcode on light background",
          commonIssues: ["low_contrast", "poor_visibility"]
        },
        {
          name: "Dark on Dark Test", 
          barcode: "070847811008", // Dark chocolate packaging
          type: "UPC-A",
          difficulty: "hard",
          challengeType: "low_contrast",
          testNotes: "Dark barcode on dark packaging",
          commonIssues: ["low_contrast", "dark_background"]
        }
      ]
    }
  ],

  // Non-Food Products for General Testing
  nonFood: [
    {
      category: "Personal Care",
      products: [
        {
          name: "Colgate Toothpaste",
          barcode: "035000763006",
          type: "UPC-A",
          difficulty: "easy",
          testNotes: "Standard packaging, good contrast",
          purpose: "Control test - should scan easily"
        },
        {
          name: "Tide Laundry Detergent",
          barcode: "037000275862",
          type: "UPC-A",
          difficulty: "medium",
          testNotes: "Large container, barcode placement varies",
          purpose: "Test barcode positioning"
        }
      ]
    }
  ],

  // Test Barcode Generators for Development
  testBarcodes: [
    {
      category: "Generated Test Codes",
      products: [
        {
          name: "EAN-13 Test Pattern",
          barcode: "1234567890128",
          type: "EAN-13",
          difficulty: "easy",
          purpose: "Format validation test",
          isGenerated: true
        },
        {
          name: "UPC-A Test Pattern",
          barcode: "123456789012",
          type: "UPC-A", 
          difficulty: "easy",
          purpose: "Format validation test",
          isGenerated: true
        },
        {
          name: "EAN-8 Test Pattern",
          barcode: "12345670",
          type: "EAN-8",
          difficulty: "easy",
          purpose: "Format validation test",
          isGenerated: true
        }
      ]
    }
  ]
}

// Test configuration presets
export const testConfigurations = {
  quickTest: {
    name: "Quick Functionality Test",
    duration: "10 minutes",
    products: [
      "038000000805", // Corn Flakes
      "3017620422003", // Nutella
      "028400647465"  // Lay's Chips
    ],
    purpose: "Basic functionality verification"
  },

  comprehensiveTest: {
    name: "Comprehensive Product Test",
    duration: "45 minutes", 
    products: "all_common_grocery",
    purpose: "Full product compatibility testing"
  },

  stressTest: {
    name: "Stress Test - Difficult Conditions",
    duration: "30 minutes",
    products: "damaged_and_edge_cases",
    purpose: "Test scanner robustness"
  },

  internationalTest: {
    name: "International Product Test",
    duration: "20 minutes",
    products: "international",
    purpose: "EAN-13 and international barcode testing"
  }
}

// Helper functions for test execution
export const testHelpers = {
  /**
   * Get products by difficulty level
   */
  getProductsByDifficulty: (difficulty) => {
    const allProducts = []
    
    Object.values(testProductDatabase).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(subcat => {
          allProducts.push(...subcat.products.filter(p => p.difficulty === difficulty))
        })
      } else {
        Object.values(category).forEach(subcat => {
          allProducts.push(...subcat.products.filter(p => p.difficulty === difficulty))
        })
      }
    })
    
    return allProducts
  },

  /**
   * Get products by barcode type
   */
  getProductsByType: (type) => {
    const allProducts = []
    
    Object.values(testProductDatabase).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(subcat => {
          allProducts.push(...subcat.products.filter(p => p.type === type))
        })
      } else {
        Object.values(category).forEach(subcat => {
          allProducts.push(...subcat.products.filter(p => p.type === type))
        })
      }
    })
    
    return allProducts
  },

  /**
   * Get random test products
   */
  getRandomProducts: (count = 5) => {
    const allProducts = []
    
    Object.values(testProductDatabase).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(subcat => {
          allProducts.push(...subcat.products)
        })
      } else {
        Object.values(category).forEach(subcat => {
          allProducts.push(...subcat.products)
        })
      }
    })
    
    // Shuffle and return requested count
    const shuffled = allProducts.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  },

  /**
   * Generate test report template
   */
  generateTestReport: (testType, results) => {
    return {
      testType,
      timestamp: new Date().toISOString(),
      totalProducts: results.length,
      successRate: (results.filter(r => r.success).length / results.length * 100).toFixed(1),
      averageScanTime: (results.reduce((sum, r) => sum + r.scanTime, 0) / results.length).toFixed(2),
      results,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    }
  }
}

export default testProductDatabase