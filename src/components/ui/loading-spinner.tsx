
import React from 'react';
import { BeatLoader } from 'react-spinners';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

const sizeMap = {
  small: 8,
  medium: 12,
  large: 16,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'hsl(var(--form-green))',
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <BeatLoader
        size={sizeMap[size]}
        color={color}
        loading={true}
        speedMultiplier={0.8}
      />
    </div>
  );
};

export default LoadingSpinner;
