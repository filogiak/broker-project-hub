
import React from 'react';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

const ContentContainer = ({ children, className = "" }: ContentContainerProps) => {
  return (
    <div className={`bg-white border border-[#BEB8AE] rounded-[12px] ${className}`}>
      {children}
    </div>
  );
};

export default ContentContainer;
