
import React from "react";

interface LogoProps {
  onClick?: () => void;
}

export function Logo({ onClick }: LogoProps) {
  return (
    <div 
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="rounded-md p-1">
        <img 
          src="/lovable-uploads/ac73d514-2e24-4f50-a73c-47a17175b731.png"
          alt="GoMutuo Logo"
          width="32" 
          height="32"
          className="w-8 h-8"
        />
      </div>
      <h1 className="font-bold text-xl">GoMutuo<span className="text-form-green">.it</span></h1>
    </div>
  );
}
