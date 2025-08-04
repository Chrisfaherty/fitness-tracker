import React, { useState, useEffect } from 'react'
import { Camera, Image, Calendar, TrendingUp, Download, Upload, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react'
import useFitnessStore from '../../store/fitnessStore'

interface ProgressPhotosGalleryProps {
  clientId: string
}

interface ProgressPhoto {
  id: number
  date: string
  url: string
  type: 'front' | 'side' | 'back' | 'pose'
  weight?: number
  bodyFat?: number
  notes?: string
  thumbnail?: string
}

const ProgressPhotosGallery: React.FC<ProgressPhotosGalleryProps> = ({ clientId }) => {
  const { body, addPhoto } = useFitnessStore()
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'comparison'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'front' | 'side' | 'back' | 'pose'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProgressPhotos()
  }, [clientId])

  const loadProgressPhotos = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch photos from the server
      // For now, we'll use the photos from the fitness store
      const storePhotos = body.photos || []
      setPhotos(storePhotos.map(photo => ({
        ...photo,
        type: photo.type || 'front',
        thumbnail: photo.url // In real implementation, would have separate thumbnail
      })))
    } catch (error) {
      console.error('Failed to load progress photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    try {
      for (const file of files) {
        // In a real implementation, this would upload to a server
        const photoUrl = URL.createObjectURL(file)
        const newPhoto: ProgressPhoto = {
          id: Date.now() + Math.random(),
          date: new Date().toISOString(),
          url: photoUrl,
          type: 'front', // Default type
          thumbnail: photoUrl
        }
        
        addPhoto(newPhoto)
        setPhotos(prev => [...prev, newPhoto])
      }
    } catch (error) {
      console.error('Failed to upload photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPhotos = photos.filter(photo => 
    filterType === 'all' || photo.type === filterType
  )

  const groupPhotosByDate = (photos: ProgressPhoto[]) => {
    const grouped = photos.reduce((acc, photo) => {
      const date = new Date(photo.date).toDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(photo)
      return acc
    }, {} as Record<string, ProgressPhoto[]>)
    
    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
  }

  const openPhotoModal = (photo: ProgressPhoto) => {
    setSelectedPhoto(photo)
  }

  const closePhotoModal = () => {
    setSelectedPhoto(null)
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return
    
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id)
    let newIndex
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredPhotos.length - 1
    } else {
      newIndex = currentIndex < filteredPhotos.length - 1 ? currentIndex + 1 : 0
    }
    
    setSelectedPhoto(filteredPhotos[newIndex])
  }

  if (loading && photos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Progress Photos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {photos.length} photos • Track visual progress over time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['grid', 'timeline', 'comparison'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Photos</option>
            <option value="front">Front View</option>
            <option value="side">Side View</option>
            <option value="back">Back View</option>
            <option value="pose">Pose</option>
          </select>

          {/* Upload Button */}
          <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Photos
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Empty State */}
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Progress Photos</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start documenting your fitness journey with progress photos
          </p>
          <label className="inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Upload First Photo
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
                  onClick={() => openPhotoModal(photo)}
                >
                  <div className="aspect-w-3 aspect-h-4">
                    <img
                      src={photo.thumbnail}
                      alt={`Progress photo from ${new Date(photo.date).toLocaleDateString()}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(photo.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {photo.type} view
                    </div>
                    {photo.weight && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {photo.weight} lbs
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="space-y-8">
              {groupPhotosByDate(filteredPhotos).map(([date, datePhotos]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-8">
                    {datePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative cursor-pointer group"
                        onClick={() => openPhotoModal(photo)}
                      >
                        <img
                          src={photo.thumbnail}
                          alt={`${photo.type} view`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400 capitalize">
                          {photo.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comparison View */}
          {viewMode === 'comparison' && filteredPhotos.length >= 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Progress Comparison
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Compare your earliest and latest photos
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div className="text-center">
                  <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Before ({new Date(filteredPhotos[filteredPhotos.length - 1].date).toLocaleDateString()})
                  </h5>
                  <div className="relative">
                    <img
                      src={filteredPhotos[filteredPhotos.length - 1].url}
                      alt="Before photo"
                      className="w-full max-w-sm mx-auto rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
                
                {/* After */}
                <div className="text-center">
                  <h5 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Latest ({new Date(filteredPhotos[0].date).toLocaleDateString()})
                  </h5>
                  <div className="relative">
                    <img
                      src={filteredPhotos[0].url}
                      alt="Latest photo"
                      className="w-full max-w-sm mx-auto rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
              </div>
              
              {/* Progress Stats */}
              <div className="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-6 text-center">
                <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Progress Summary
                </h5>
                <div className="text-gray-600 dark:text-gray-400">
                  {Math.floor((new Date(filteredPhotos[0].date).getTime() - new Date(filteredPhotos[filteredPhotos.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))} days of progress documented
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closePhotoModal}>
          <div className="relative max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            {/* Navigation */}
            <button
              onClick={() => navigatePhoto('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={() => navigatePhoto('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors z-10"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Photo */}
            <img
              src={selectedPhoto.url}
              alt={`Progress photo from ${new Date(selectedPhoto.date).toLocaleDateString()}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Info Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">
                    {new Date(selectedPhoto.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <p className="text-sm opacity-75 capitalize">{selectedPhoto.type} view</p>
                  {selectedPhoto.weight && (
                    <p className="text-sm opacity-75">Weight: {selectedPhoto.weight} lbs</p>
                  )}
                </div>
                
                <button
                  onClick={() => window.open(selectedPhoto.url, '_blank')}
                  className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                  aria-label="Download photo"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
              
              {selectedPhoto.notes && (
                <p className="text-sm mt-2 opacity-90">{selectedPhoto.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressPhotosGallery