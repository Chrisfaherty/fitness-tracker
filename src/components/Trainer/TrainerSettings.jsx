import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Briefcase, Save, Edit3, Shield } from 'lucide-react'
import authService from '../../services/auth/authService'

const TrainerSettings = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    certifications: '',
    bio: '',
    location: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadTrainerProfile()
  }, [])

  const loadTrainerProfile = () => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setProfile({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.profile?.phone || '',
        specialization: currentUser.profile?.specialization || '',
        experience: currentUser.profile?.experience || '',
        certifications: currentUser.profile?.certifications || '',
        bio: currentUser.profile?.bio || '',
        location: currentUser.profile?.location || ''
      })
    }
  }

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // In a real app, you'd update the user profile in the database
      // For now, we'll just show a success message
      setTimeout(() => {
        setMessage({ 
          type: 'success', 
          text: 'Profile updated successfully!' 
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile. Please try again.' 
      })
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Trainer Settings
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your profile and professional information
          </p>
        </div>
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-2xl animate-slide-up ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Profile Form */}
      <div className="card-elevated">
        <div className="p-8 space-y-8">
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Edit3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Professional Profile
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update your information and credentials
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="input-modern"
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="input-modern"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-modern"
                placeholder="your.email@example.com"
                disabled
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Contact support to change your email address
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="input-modern"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                <Briefcase className="inline h-4 w-4 mr-2" />
                Specialization
              </label>
              <select
                value={profile.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                className="input-modern"
              >
                <option value="">Select your specialization</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_building">Muscle Building</option>
                <option value="athletic_performance">Athletic Performance</option>
                <option value="rehabilitation">Rehabilitation</option>
                <option value="senior_fitness">Senior Fitness</option>
                <option value="youth_fitness">Youth Fitness</option>
                <option value="group_fitness">Group Fitness</option>
                <option value="nutrition">Nutrition Coaching</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Years of Experience
              </label>
              <select
                value={profile.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                className="input-modern"
              >
                <option value="">Select experience level</option>
                <option value="0-1">0-1 years</option>
                <option value="2-5">2-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="11-15">11-15 years</option>
                <option value="16+">16+ years</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              <Shield className="inline h-4 w-4 mr-2" />
              Certifications
            </label>
            <textarea
              value={profile.certifications}
              onChange={(e) => handleInputChange('certifications', e.target.value)}
              className="input-modern min-h-[100px]"
              placeholder="List your certifications (e.g., NASM-CPT, ACSM-CPT, etc.)"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              <MapPin className="inline h-4 w-4 mr-2" />
              Location
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="input-modern"
              placeholder="City, State (e.g., Los Angeles, CA)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Professional Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="input-modern min-h-[120px]"
              placeholder="Tell your clients about your training philosophy, approach, and what makes you unique..."
              rows={5}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="btn-primary flex items-center space-x-3 px-8 py-4"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Save size={20} />
              )}
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainerSettings