import React from 'react';
import { AlignedToken } from '../../types';

interface TextHighlighterProps {
  tokens: AlignedToken[];
  onTokenClick?: (token: AlignedToken) => void;
  showReference?: boolean;
  className?: string;
}

export const TextHighlighter: React.FC<TextHighlighterProps> = ({
  tokens,
  onTokenClick,
  showReference = true,
  className = ''
}) => {
  const getTokenClasses = (token: AlignedToken): string => {
    const baseClasses = 'inline-block px-1 py-0.5 m-0.5 rounded transition-all duration-200 cursor-pointer hover:shadow-md';
    
    switch (token.status) {
      case 'correct':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      case 'near-miss':
        return `${baseClasses} bg-amber-100 text-amber-800 border border-amber-200`;
      case 'missing':
        return `${baseClasses} bg-gray-100 text-gray-500 border border-gray-200 line-through`;
      case 'extra':
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200 font-bold`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-100`;
    }
  };

  const getTokenText = (token: AlignedToken): string => {
    if (showReference) {
      return token.reference || token.recognized;
    }
    return token.recognized || token.reference;
  };

  const getTooltipText = (token: AlignedToken): string => {
    switch (token.status) {
      case 'correct':
        return `Correct: "${token.reference}"`;
      case 'error':
        return `Expected: "${token.reference}" | Recognized: "${token.recognized}"`;
      case 'near-miss':
        return `Close match (${Math.round(token.confidence * 100)}%): "${token.reference}" ≈ "${token.recognized}"`;
      case 'missing':
        return `Missing word: "${token.reference}"`;
      case 'extra':
        return `Extra word: "${token.recognized}"`;
      default:
        return token.reference || token.recognized;
    }
  };

  return (
    <div className={`text-highlighting-container ${className}`} id="highlighted-text">
      <div className="leading-relaxed">
        {tokens.map((token, index) => (
          <span
            key={`${index}-${token.position}`}
            className={getTokenClasses(token)}
            title={getTooltipText(token)}
            onClick={() => onTokenClick?.(token)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onTokenClick?.(token);
              }
            }}
            aria-label={getTooltipText(token)}
          >
            {getTokenText(token)}
          </span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Color Legend:</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span>
            <span className="text-gray-600">Correct</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></span>
            <span className="text-gray-600">Near Miss</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span>
            <span className="text-gray-600">Error</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></span>
            <span className="text-gray-600">Missing</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
            <span className="text-gray-600">Extra</span>
          </div>
        </div>
      </div>
    </div>
  );
};