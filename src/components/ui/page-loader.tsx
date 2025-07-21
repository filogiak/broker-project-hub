
import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading...',
  className,
  size = 'medium',
}) => {
  return (
    <div className={cn(
      'flex-1 flex items-center justify-center flex-col gap-4 p-8',
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

export default PageLoader;
