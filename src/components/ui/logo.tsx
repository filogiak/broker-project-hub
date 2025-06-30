
import React from "react";

interface LogoProps {
  onClick?: () => void;
}

export function Logo({ onClick }: LogoProps) {
  return (
    <div 
      className={`flex items-center justify-center gap-2 w-full ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center">
        <img 
          src="/lovable-uploads/b548d5e2-9891-44c9-b53d-2e69186221b7.png"
          alt="GoMutuo Logo"
          width="32" 
          height="32"
          className="w-8 h-8 object-contain"
        />
      </div>
      <h1 className="font-bold text-xl">GoMutuo</h1>
    </div>
  );
}
