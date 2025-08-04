import { useState, useCallback } from 'react'
import barcodeScanner from '../services/barcodeScanner'
import apiService from '../services/api'

export const useBarcode = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState(null)
  const [foodData, setFoodData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const startScanning = useCallback((elementId) => {
    if (!barcodeScanner.isSupported()) {
      setError('Barcode scanning is not supported on this device')
      return
    }

    setIsScanning(true)
    setError(null)
    setScanResult(null)
    setFoodData(null)

    const onSuccess = async (decodedText, decodedResult) => {
      console.log('Barcode scanned successfully:', decodedText)
      
      const parsedBarcode = barcodeScanner.parseBarcode(decodedText)
      setScanResult(parsedBarcode)
      setIsScanning(false)

      if (parsedBarcode.isValid) {
        setIsLoading(true)
        try {
          const response = await apiService.getFoodByBarcode(decodedText)
          setFoodData(response.food)
        } catch (err) {
          setError('Failed to fetch food data for this barcode')
          console.error('Food data fetch error:', err)
        } finally {
          setIsLoading(false)
        }
      } else {
        setError('Invalid barcode format')
      }
    }

    const onError = (errorMessage) => {
      console.error('Barcode scanning error:', errorMessage)
      setError(errorMessage)
      setIsScanning(false)
    }

    barcodeScanner.startScanning(elementId, onSuccess, onError)
  }, [])

  const stopScanning = useCallback(() => {
    barcodeScanner.stopScanning()
    setIsScanning(false)
  }, [])

  const clearResults = useCallback(() => {
    setScanResult(null)
    setFoodData(null)
    setError(null)
  }, [])

  return {
    isScanning,
    scanResult,
    foodData,
    error,
    isLoading,
    startScanning,
    stopScanning,
    clearResults,
    isSupported: barcodeScanner.isSupported()
  }
}