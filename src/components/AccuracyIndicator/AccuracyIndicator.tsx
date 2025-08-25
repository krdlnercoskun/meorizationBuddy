import React from 'react';

interface AccuracyIndicatorProps {
  accuracy: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const AccuracyIndicator: React.FC<AccuracyIndicatorProps> = ({
  accuracy,
  size = 'medium',
  showLabel = true,
  className = ''
}) => {
  const percentage = Math.round(accuracy * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (accuracy * circumference);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-16 h-16';
      case 'large':
        return 'w-32 h-32';
      default:
        return 'w-24 h-24';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-xl font-bold';
      default:
        return 'text-sm font-semibold';
    }
  };

  const getColor = () => {
    if (accuracy >= 0.9) return '#10B981'; // green
    if (accuracy >= 0.7) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`relative ${getSizeClasses()}`}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke={getColor()}
            strokeWidth="6"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${getTextSizeClasses()} text-gray-700`}>
            {percentage}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="mt-2 text-sm text-gray-600">
          Accuracy
        </span>
      )}
    </div>
  );
};