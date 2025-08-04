import { useState, useEffect } from 'react'
import useFitnessStore from '../../store/fitnessStore'
import SleepTracker from './SleepTracker'
import storageService from '../../services/storage'
import { Moon, Brain, Heart, Plus, TrendingUp } from 'lucide-react'
import { SleepEntry } from '../../types/sleep'
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

  const WellnessCard = ({ title, children, icon: Icon }) => (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Icon size={24} className="text-primary-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wellness</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your mental health and sleep
          </p>
        </div>
        <button
          onClick={() => setShowAddNote(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Note
        </button>
      </div>

      {/* Weekly Sleep Overview */}
      {weeklyStats && (
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <TrendingUp size={20} />
              Weekly Sleep Summary
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {weeklyStats.averageScore}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-400">
                Avg Score
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-900 dark:text-blue-300">
                {formatSleepDuration(weeklyStats.averageDuration)}
              </div>
              <div className="text-blue-700 dark:text-blue-400">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900 dark:text-blue-300">
                {weeklyStats.averageQuality}/5
              </div>
              <div className="text-blue-700 dark:text-blue-400">Avg Quality</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900 dark:text-blue-300">
                {weeklyStats.consistency}%
              </div>
              <div className="text-blue-700 dark:text-blue-400">Consistency</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900 dark:text-blue-300 capitalize">
                {weeklyStats.trend === 'improving' ? '📈' : weeklyStats.trend === 'declining' ? '📉' : '➡️'} {weeklyStats.trend}
              </div>
              <div className="text-blue-700 dark:text-blue-400">Trend</div>
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
        <WellnessCard title="Sleep" icon={Moon}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hours Slept: {wellness.sleepHours}h
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={wellness.sleepHours}
                onChange={(e) => handleSleepUpdate(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sleep Quality
              </label>
              <div className="grid grid-cols-2 gap-2">
                {sleepQualities.map((quality) => (
                  <button
                    key={quality.value}
                    onClick={() => handleSleepQualityUpdate(quality.value)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      wellness.sleepQuality === quality.value
                        ? `${quality.color} text-white`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
        <WellnessCard title="Mood" icon={Heart}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How are you feeling today?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodUpdate(mood.value)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      wellness.mood === mood.value
                        ? 'bg-primary-100 border-2 border-primary-500 dark:bg-primary-900/20'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {mood.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </WellnessCard>

        {/* Stress Level */}
        <WellnessCard title="Stress Level" icon={Brain}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stress Level: {wellness.stressLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={wellness.stressLevel}
                onChange={(e) => handleStressUpdate(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {wellness.stressLevel <= 3 && "You're feeling calm and relaxed. Great job managing stress!"}
                {wellness.stressLevel > 3 && wellness.stressLevel <= 6 && "Moderate stress levels. Consider some relaxation techniques."}
                {wellness.stressLevel > 6 && wellness.stressLevel <= 8 && "High stress detected. Try deep breathing or meditation."}
                {wellness.stressLevel > 8 && "Very high stress. Consider talking to someone or taking a break."}
              </p>
            </div>
          </div>
        </WellnessCard>

        {/* Notes */}
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Wellness Notes
          </h3>
          {wellness.notes.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {wellness.notes.slice().reverse().map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white mb-1">
                    {note.content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(note.timestamp).toLocaleDateString()} at{' '}
                    {new Date(note.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No notes yet. Add your first wellness note!
            </p>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Wellness Note
            </h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  How are you feeling? What's on your mind?
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="4"
                  placeholder="Reflect on your day, thoughts, or feelings..."
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
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Save Note
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