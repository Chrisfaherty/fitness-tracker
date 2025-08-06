import { useState } from 'react'
import { 
  Activity, 
  Apple, 
  Heart, 
  TrendingUp, 
  Users, 
  Shield, 
  Smartphone,
  CheckCircle,
  Star,
  ArrowRight,
  BarChart3,
  Target,
  Calendar,
  Utensils
} from 'lucide-react'

const LandingPage = ({ onGetStarted }) => {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: Activity,
      title: "Track Your Workouts",
      description: "Log exercises, sets, reps, and monitor your progress with detailed analytics.",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Apple,
      title: "Nutrition Management",
      description: "Plan meals, track macros, and maintain a balanced diet with our extensive food database.",
      color: "text-green-600 dark:text-green-400"
    },
    {
      icon: Heart,
      title: "Wellness Monitoring",
      description: "Track sleep, mood, energy levels, and overall wellness metrics.",
      color: "text-red-600 dark:text-red-400"
    },
    {
      icon: TrendingUp,
      title: "Body Composition",
      description: "Monitor weight, body fat, muscle mass, and track your transformation journey.",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: Users,
      title: "Professional Support",
      description: "Connect with trainers and nutritionists for personalized guidance and meal plans.",
      color: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Visualize your progress with charts, trends, and comprehensive reporting.",
      color: "text-indigo-600 dark:text-indigo-400"
    }
  ]

  const benefits = [
    "Comprehensive fitness tracking in one app",
    "Professional trainer and nutritionist support",
    "Personalized meal and workout plans",
    "Advanced progress analytics",
    "Secure data encryption",
    "Multi-device synchronization"
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Fitness Enthusiast",
      content: "This app has transformed how I track my fitness journey. The nutrition planning feature is amazing!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Personal Trainer",
      content: "As a trainer, I love how I can create custom plans for my clients and track their progress in real-time.",
      rating: 5
    },
    {
      name: "Emily Davis",
      role: "Nutritionist",
      content: "The meal planning tools are comprehensive and make it easy to create balanced nutrition plans for clients.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8">
              Transform Your
              <span className="block bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                Fitness Journey
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              The complete fitness ecosystem for tracking workouts, nutrition, wellness, and connecting with professional trainers. 
              Everything you need to achieve your health goals in one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={onGetStarted}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span>Get Started Free</span>
                <ArrowRight size={20} />
              </button>
              
              <button className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-8 py-4 rounded-xl text-lg font-semibold transition-colors duration-200 flex items-center space-x-2">
                <span>Learn More</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">10K+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">50K+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Workouts Logged</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">200+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Food Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">24/7</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 dark:bg-primary-800 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-green-200 dark:bg-green-800 rounded-full opacity-20 animate-pulse delay-300"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse delay-700"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive tools and features designed to support every aspect of your fitness journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                    activeFeature === index ? 'ring-2 ring-primary-500 shadow-lg' : ''
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`w-12 h-12 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center mb-6 ${feature.color}`}>
                    <Icon size={24} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                Why Choose Our Platform?
              </h2>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <CheckCircle size={20} className="text-primary-200 flex-shrink-0" />
                    <span className="text-white text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <Smartphone size={48} className="mx-auto text-primary-600 dark:text-primary-400 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Available Everywhere
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Access your fitness data from any device, anywhere, anytime.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Web</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Mobile</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Tablet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of satisfied users who've transformed their fitness journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex justify-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Target size={48} className="mx-auto text-primary-400 mb-8" />
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Transformation?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join thousands of users who are already achieving their fitness goals. 
            Get started today with your free account.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={onGetStarted}
              className="bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-xl text-xl font-semibold transition-all duration-200 flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>Start Your Journey</span>
              <ArrowRight size={24} />
            </button>
            
            <p className="text-sm text-gray-400">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Activity size={32} className="text-primary-400" />
                <span className="text-2xl font-bold text-white">FitTracker Pro</span>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                The complete fitness platform for tracking workouts, nutrition, and connecting with professionals.
              </p>
              <div className="flex space-x-4">
                <Shield size={20} className="text-gray-400" />
                <span className="text-gray-300 text-sm">Your data is secure and encrypted</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Workout Tracking</li>
                <li>Nutrition Planning</li>
                <li>Wellness Monitoring</li>
                <li>Progress Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 FitTracker Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage