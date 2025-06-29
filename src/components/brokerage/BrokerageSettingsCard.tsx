
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface BrokerageSettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const BrokerageSettingsCard = ({
  title,
  description,
  icon: Icon,
  children,
  className = ""
}: BrokerageSettingsCardProps) => {
  return (
    <Card className={`gomutuo-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-form-green font-dm-sans">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="font-dm-sans">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default BrokerageSettingsCard;
