
import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  message?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  className,
  size = 'medium',
}) => {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center flex-col gap-4',
      className
    )}>
      <LoadingSpinner size={size} />
      {message && (
        <div className="text-lg text-gray-600 font-dm-sans">
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
