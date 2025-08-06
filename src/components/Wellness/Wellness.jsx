import { useState, useEffect } from 'react'
import useFitnessStore from '../../store/fitnessStore'
import SleepTracker from './SleepTracker'
import storageService from '../../services/storage'
import { Moon, Brain, Heart, Plus, TrendingUp } from 'lucide-react'
// Types are now handled inline as JavaScript objects
import { calculateSleepScore, calculateWeeklyStatistics, formatSleepDuration } from '../../utils/sleepCalculations'

const Wellness = () => {
  const { wellness, updateWellness, addSleepEntry, setSleepEntries } = useFitnessStore()
  const [newNote, setNewNote] = useState('')
  const [showAddNote, setShowAddNote] = useState(false)
  const [sleepEntries, setSleepEntriesLocal] = useState([])
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const moods = [
    { value: 'excited', emoji: '🤗', label: 'Excited' },
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'sad', emoji: '😢', label: 'Sad' },
    { value: 'stressed', emoji: '😰', label: 'Stressed' },
  ]

  const sleepQualities = [
    { value: 'excellent', label: 'Excellent', color: 'bg-green-500' },
    { value: 'good', label: 'Good', color: 'bg-blue-500' },
    { value: 'fair', label: 'Fair', color: 'bg-yellow-500' },
    { value: 'poor', label: 'Poor', color: 'bg-red-500' },
  ]

  const handleSleepUpdate = (hours) => {
    updateWellness({ sleepHours: hours })
  }

  const handleMoodUpdate = (mood) => {
    updateWellness({ mood })
  }

  const handleStressUpdate = (level) => {
    updateWellness({ stressLevel: level })
  }

  const handleSleepQualityUpdate = (quality) => {
    updateWellness({ sleepQuality: quality })
  }

  // Load sleep entries on component mount
  useEffect(() => {
    const loadSleepData = async () => {
      setIsLoading(true)
      try {
        // Load recent sleep entries from storage
        const recentEntries = await storageService.getRecentSleepEntries(30)
        
        // Update both local state and store
        setSleepEntriesLocal(recentEntries)
        setSleepEntries(recentEntries)
        
        // Calculate weekly statistics
        const stats = calculateWeeklyStatistics(recentEntries)
        setWeeklyStats(stats)
      } catch (error) {
        console.error('Error loading sleep data:', error)
        // Fall back to empty data
        setSleepEntriesLocal([])
        setWeeklyStats(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSleepData()
  }, [])

  const handleSleepEntryAdd = async (entry) => {
    try {
      const newEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sleepScore: calculateSleepScore(entry, sleepEntries)
      }

      // Save to storage first
      await storageService.saveSleepEntry(newEntry)

      // Update local state
      const updatedEntries = [newEntry, ...sleepEntries]
      setSleepEntriesLocal(updatedEntries)
      
      // Update store
      addSleepEntry(newEntry)
      
      // Update weekly statistics
      const stats = calculateWeeklyStatistics(updatedEntries)
      setWeeklyStats(stats)
      
      // Update wellness store with basic sleep data for compatibility
      updateWellness({
        sleepHours: entry.duration.hours + entry.duration.minutes / 60,
        sleepQuality: entry.quality === 5 ? 'excellent' : 
                     entry.quality === 4 ? 'good' : 
                     entry.quality === 3 ? 'fair' : 'poor'
      })
    } catch (error) {
      console.error('Error saving sleep entry:', error)
      throw error // Let the SleepTracker component handle the error
    }
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    if (newNote.trim()) {
      const note = {
        id: Date.now(),
        content: newNote,
        timestamp: new Date().toISOString()
      }
      updateWellness({ 
        notes: [...wellness.notes, note] 
      })
      setNewNote('')
      setShowAddNote(false)
    }
  }

  const WellnessCard = ({ title, children, icon: Icon, gradient }) => (
    <div className="card-elevated animate-scale-in">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon size={24} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-3">Wellness Hub</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Monitor your mental health, sleep patterns, and overall well-being
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
            <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddNote(true)}
          className="btn-primary flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} />
          <span>Add Wellness Note</span>
        </button>
      </div>

      {/* Weekly Sleep Overview */}
      {weeklyStats && (
        <div className="card-gradient p-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gradient">
                  Weekly Sleep Summary
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Your sleep insights for the past 7 days
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-1">
                {weeklyStats.averageScore}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Sleep Score
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {formatSleepDuration(weeklyStats.averageDuration)}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Duration</div>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {weeklyStats.averageQuality}/5
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Quality</div>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {weeklyStats.consistency}%
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Consistency</div>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm">
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1 capitalize">
                {weeklyStats.trend === 'improving' ? '📈' : weeklyStats.trend === 'declining' ? '📉' : '➡️'} {weeklyStats.trend}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Trend</div>
            </div>
          </div>
        </div>
      )}

      {/* Sleep Tracker */}
      <SleepTracker 
        onSleepEntryAdd={handleSleepEntryAdd}
        recentEntries={sleepEntries}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Tracking */}
        <WellnessCard title="Sleep Tracker" icon={Moon} gradient="from-indigo-500 to-purple-600">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Hours Slept: <span className="text-2xl font-bold text-gradient">{wellness.sleepHours}h</span>
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={wellness.sleepHours}
                onChange={(e) => handleSleepUpdate(parseFloat(e.target.value))}
                className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Sleep Quality
              </label>
              <div className="grid grid-cols-2 gap-3">
                {sleepQualities.map((quality) => (
                  <button
                    key={quality.value}
                    onClick={() => handleSleepQualityUpdate(quality.value)}
                    className={`p-4 rounded-2xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                      wellness.sleepQuality === quality.value
                        ? `${quality.color} text-white shadow-lg scale-105`
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-sm'
                    }`}
                  >
                    {quality.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </WellnessCard>

        {/* Mood Tracking */}
        <WellnessCard title="Mood Tracker" icon={Heart} gradient="from-pink-500 to-rose-500">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                How are you feeling today?
              </label>
              <div className="grid grid-cols-3 gap-4">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodUpdate(mood.value)}
                    className={`group p-4 rounded-2xl text-center transition-all duration-300 transform hover:scale-110 ${
                      wellness.mood === mood.value
                        ? 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-500 shadow-lg scale-110'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-transparent shadow-sm'
                    }`}
                  >
                    <div className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-200">{mood.emoji}</div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {mood.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </WellnessCard>

        {/* Stress Level */}
        <WellnessCard title="Stress Monitor" icon={Brain} gradient="from-orange-500 to-red-500">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Stress Level: <span className="text-2xl font-bold text-gradient">{wellness.stressLevel}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={wellness.stressLevel}
                onChange={(e) => handleStressUpdate(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl backdrop-blur-sm ${
              wellness.stressLevel <= 3 ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800' :
              wellness.stressLevel <= 6 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800' :
              wellness.stressLevel <= 8 ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800' :
              'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  wellness.stressLevel <= 3 ? 'bg-green-500' :
                  wellness.stressLevel <= 6 ? 'bg-yellow-500' :
                  wellness.stressLevel <= 8 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}>
                  <span className="text-white text-lg">
                    {wellness.stressLevel <= 3 ? '😌' : wellness.stressLevel <= 6 ? '😐' : wellness.stressLevel <= 8 ? '😩' : '😰'}
                  </span>
                </div>
                <p className={`text-sm font-medium ${
                  wellness.stressLevel <= 3 ? 'text-green-700 dark:text-green-400' :
                  wellness.stressLevel <= 6 ? 'text-yellow-700 dark:text-yellow-400' :
                  wellness.stressLevel <= 8 ? 'text-orange-700 dark:text-orange-400' :
                  'text-red-700 dark:text-red-400'
                }`}>
                  {wellness.stressLevel <= 3 && "You're feeling calm and relaxed. Great job managing stress!"}
                  {wellness.stressLevel > 3 && wellness.stressLevel <= 6 && "Moderate stress levels. Consider some relaxation techniques."}
                  {wellness.stressLevel > 6 && wellness.stressLevel <= 8 && "High stress detected. Try deep breathing or meditation."}
                  {wellness.stressLevel > 8 && "Very high stress. Consider talking to someone or taking a break."}
                </p>
              </div>
            </div>
          </div>
        </WellnessCard>

        {/* Notes */}
        <div className="card-elevated lg:col-span-1 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📝</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Wellness Journal
            </h3>
          </div>
          {wellness.notes.length > 0 ? (
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
              {wellness.notes.slice().reverse().map((note, index) => (
                <div key={note.id} className="p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-600/50 hover:shadow-md transition-all duration-200">
                  <p className="text-sm text-slate-900 dark:text-white mb-3 leading-relaxed">
                    “{note.content}”
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="badge badge-info">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                    <span className="badge badge-success">
                      {new Date(note.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 text-2xl">📝</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-2">
                No wellness notes yet
              </p>
              <p className="text-slate-400 text-sm mb-4">
                Start journaling your thoughts and feelings!
              </p>
              <button
                onClick={() => setShowAddNote(true)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Add your first note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content w-full max-w-md animate-scale-in">
            <div className="flex items-center space-x-4 p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Plus size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gradient">
                  Add Wellness Note
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Reflect on your feelings and thoughts
                </p>
              </div>
            </div>
            <form onSubmit={handleAddNote} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  How are you feeling? What's on your mind?
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="input-modern"
                  rows="5"
                  placeholder="Take a moment to reflect on your day, thoughts, feelings, or any insights you'd like to remember..."
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNote(false)
                    setNewNote('')
                  }}
                  className="flex-1 btn-secondary py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📝</span>
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Wellness