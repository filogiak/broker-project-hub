
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StandardCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const StandardCard = ({
  title,
  description,
  icon: Icon,
  children,
  onClick,
  className = ""
}: StandardCardProps) => {
  const isClickable = !!onClick;
  
  return (
    <Card 
      className={`bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light ${isClickable ? 'cursor-pointer hover:shadow-md press-down-effect' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-[#235c4e]/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-[#235c4e]" />
            </div>
          )}
          <div>
            <CardTitle className="text-black font-dm-sans text-lg font-semibold">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-gray-600 font-dm-sans text-sm mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default StandardCard;
