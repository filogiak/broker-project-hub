
import React from 'react';

interface CustomHouseIconProps {
  className?: string;
  size?: number;
}

const CustomHouseIcon = ({ className, size = 20 }: CustomHouseIconProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
    >
      <path 
        d="M12 2L2 7V10H4V20H10V14H14V20H20V10H22V7L12 2Z" 
        fill="currentColor"
      />
      <path 
        d="M12 2L2 7V10H4V20H10V14H14V20H20V10H22V7L12 2Z" 
        stroke="currentColor" 
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CustomHouseIcon;
