
import React from "react";
import { useBackgroundRemoval } from "@/hooks/useBackgroundRemoval";

interface LogoProps {
  onClick?: () => void;
}

export function Logo({ onClick }: LogoProps) {
  const { processedImageUrl, isProcessing } = useBackgroundRemoval(
    "/lovable-uploads/77a4b68c-11b7-421f-8852-3b62b878199c.png"
  );

  return (
    <div 
      className={`flex items-center justify-center gap-2 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center">
        {isProcessing ? (
          <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
        ) : (
          <img 
            src={processedImageUrl || "/lovable-uploads/77a4b68c-11b7-421f-8852-3b62b878199c.png"}
            alt="GoMutuo Logo"
            width="32" 
            height="32"
            className="w-8 h-8 object-contain"
          />
        )}
      </div>
      <h1 className="font-bold text-xl">GoMutuo<span className="text-form-green">.it</span></h1>
    </div>
  );
}
