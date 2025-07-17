
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface InformationalCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  details: Array<{
    label: string;
    value: string;
  }>;
  className?: string;
}

const InformationalCard = ({
  title,
  description,
  icon: Icon,
  details,
  className = ""
}: InformationalCardProps) => {
  return (
    <Card className={`bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-[#235c4e]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-6 w-6 text-[#235c4e]" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-black font-dm-sans text-lg font-semibold mb-2">
              {title}
            </h3>
            {description && (
              <p className="text-gray-600 font-dm-sans text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {details.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-100">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-500 font-dm-sans text-sm">
                  {detail.label}
                </span>
                <span className="text-black font-dm-sans text-sm font-medium">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InformationalCard;
