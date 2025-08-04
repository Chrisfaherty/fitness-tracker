import { useState, useEffect } from 'react'
import storageService from '../services/storage'

export const useStorage = () => {
  const [storageInfo, setStorageInfo] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    const getStorageInfo = async () => {
      const info = await storageService.getStorageUsage()
      setStorageInfo(info)
    }

    getStorageInfo()
  }, [])

  const exportData = async () => {
    setIsExporting(true)
    try {
      const result = await storageService.exportAllData()
      if (result.success) {
        // Create and download JSON file
        const dataStr = JSON.stringify(result, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
        return { success: true }
      }
      return result
    } catch (error) {
      console.error('Export error:', error)
      return { success: false, error: error.message }
    } finally {
      setIsExporting(false)
    }
  }

  const importData = async (file) => {
    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const result = await storageService.importData(data)
      return result
    } catch (error) {
      console.error('Import error:', error)
      return { success: false, error: error.message }
    } finally {
      setIsImporting(false)
    }
  }

  const clearAllData = async () => {
    try {
      const stores = ['meals', 'workouts', 'measurements', 'photos', 'wellnessNotes']
      const results = await Promise.all(
        stores.map(store => storageService.clear(store))
      )
      
      const allSuccessful = results.every(result => result.success)
      return { success: allSuccessful }
    } catch (error) {
      console.error('Clear data error:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    storageInfo,
    isExporting,
    isImporting,
    exportData,
    importData,
    clearAllData
  }
}