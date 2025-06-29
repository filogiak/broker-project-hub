
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface BrokerageOverviewCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}

const BrokerageOverviewCard = ({
  title,
  value,
  description,
  icon: Icon,
  onClick,
  className = ""
}: BrokerageOverviewCardProps) => {
  return (
    <Card 
      className={`gomutuo-card cursor-pointer ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-vibe-green-light flex items-center justify-center">
            <Icon className="h-6 w-6 text-form-green" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground font-dm-sans">
            {title}
          </h3>
          <div className="text-2xl font-bold text-form-green font-dm-sans">
            {value}
          </div>
          <p className="text-xs text-muted-foreground font-dm-sans">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BrokerageOverviewCard;
