export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getToday = () => {
  return new Date().toISOString().split('T')[0]
}

export const getYesterday = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

export const getWeekDates = (startDate) => {
  const dates = []
  const start = new Date(startDate)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates
}

export const getMonthStart = (date = new Date()) => {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export const getMonthEnd = (date = new Date()) => {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
}

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate()
}

export const isToday = (date) => {
  const today = new Date()
  const checkDate = new Date(date)
  
  return checkDate.toDateString() === today.toDateString()
}

export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const timeDiff = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().split('T')[0]
}

export const subtractDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result.toISOString().split('T')[0]
}