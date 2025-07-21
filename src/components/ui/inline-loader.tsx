
import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

interface InlineLoaderProps {
  message?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  vertical?: boolean;
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  message,
  className,
  size = 'small',
  vertical = false,
}) => {
  return (
    <div className={cn(
      'flex items-center gap-2',
      vertical ? 'flex-col' : 'flex-row',
      className
    )}>
      <LoadingSpinner size={size} />
      {message && (
        <span className="text-sm text-gray-600 font-dm-sans">
          {message}
        </span>
      )}
    </div>
  );
};

export default InlineLoader;
