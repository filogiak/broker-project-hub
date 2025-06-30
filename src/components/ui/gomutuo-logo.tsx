
import React from 'react';

interface GoMutuoLogoProps {
  className?: string;
  size?: number;
}

const GoMutuoLogo = ({ className, size = 32 }: GoMutuoLogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 32 32" 
          fill="none"
        >
          {/* House shape */}
          <path 
            d="M16 4L4 12V28H12V20H20V28H28V12L16 4Z" 
            fill="#2D5A2D"
            stroke="#2D5A2D"
            strokeWidth="1"
          />
          {/* Door */}
          <rect x="14" y="22" width="4" height="6" fill="white" />
          {/* Windows */}
          <rect x="8" y="16" width="3" height="3" fill="white" rx="0.5" />
          <rect x="21" y="16" width="3" height="3" fill="white" rx="0.5" />
        </svg>
      </div>
      <span className="font-bold text-form-green text-lg font-dm-sans">GoMutuo</span>
    </div>
  );
};

export default GoMutuoLogo;
