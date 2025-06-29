
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface BrokerageActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

const BrokerageActionCard = ({
  title,
  description,
  icon: Icon,
  children,
  headerActions,
  className = ""
}: BrokerageActionCardProps) => {
  return (
    <Card className={`gomutuo-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-form-green font-dm-sans">
              <Icon className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="font-dm-sans">
              {description}
            </CardDescription>
          </div>
          {headerActions}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default BrokerageActionCard;
