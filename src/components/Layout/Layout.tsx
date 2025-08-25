import React from 'react';
import { useAppSettings } from '../../hooks/useAppSettings';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  const { settings } = useAppSettings();
  
  const getThemeClasses = () => {
    const base = 'min-h-screen transition-colors duration-300';
    
    switch (settings.theme) {
      case 'dark':
        return `${base} bg-gray-900 text-white`;
      case 'high-contrast':
        return `${base} bg-black text-yellow-300`;
      default:
        return `${base} bg-gray-50 text-gray-900`;
    }
  };

  const getFontSizeClasses = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-xl';
      default: return 'text-base';
    }
  };

  const isRTL = settings.language === 'ar';

  return (
    <div 
      className={`${getThemeClasses()} ${getFontSizeClasses()} ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {children}
    </div>
  );
};