import React from 'react'

interface ProgressBarProps {
  title: string
  current: number
  target: number
  unit: string
  color: 'blue' | 'red' | 'yellow' | 'green' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  title,
  current,
  target,
  unit,
  color,
  size = 'md',
  showPercentage = true,
  className = ''
}) => {
  const percentage = Math.min((current / target) * 100, 100)
  const isOverTarget = current > target
  const remaining = Math.max(target - current, 0)

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
    yellow: {
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    green: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    purple: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    }
  }

  const sizeClasses = {
    sm: {
      container: 'p-3',
      title: 'text-xs',
      value: 'text-lg',
      bar: 'h-1.5',
      text: 'text-xs'
    },
    md: {
      container: 'p-4',
      title: 'text-sm',
      value: 'text-xl',
      bar: 'h-2',
      text: 'text-xs'
    },
    lg: {
      container: 'p-6',
      title: 'text-base',
      value: 'text-2xl',
      bar: 'h-3',
      text: 'text-sm'
    }
  }

  const colors = colorClasses[color]
  const sizes = sizeClasses[size]

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${sizes.container} ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className={`font-medium text-gray-600 dark:text-gray-400 ${sizes.title}`}>
          {title}
        </h3>
        {showPercentage && (
          <span className={`${sizes.text} ${colors.text} font-medium`}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      {/* Current Value */}
      <div className="flex items-baseline mb-3">
        <span className={`font-bold text-gray-900 dark:text-white ${sizes.value}`}>
          {current.toLocaleString()}
        </span>
        <span className="ml-1 text-gray-500 dark:text-gray-400 text-sm">
          {unit}
        </span>
        <span className="mx-2 text-gray-400 dark:text-gray-500 text-sm">/</span>
        <span className="text-gray-600 dark:text-gray-300 text-sm">
          {target.toLocaleString()}{unit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`${colors.bg} ${sizes.bar} rounded-full transition-all duration-500 ease-out ${
              isOverTarget ? 'opacity-90' : ''
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {/* Over-target indicator */}
        {isOverTarget && (
          <div className="mt-1">
            <div className="bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min((current - target) / target * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className={`${sizes.text} ${
        isOverTarget 
          ? 'text-red-600 dark:text-red-400' 
          : remaining === 0 
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400'
      }`}>
        {isOverTarget ? (
          <>
            <span className="font-medium">
              {(current - target).toLocaleString()}{unit} over target
            </span>
          </>
        ) : remaining === 0 ? (
          <span className="font-medium">Target reached! 🎉</span>
        ) : (
          <>
            <span className="font-medium">
              {remaining.toLocaleString()}{unit} remaining
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default ProgressBar