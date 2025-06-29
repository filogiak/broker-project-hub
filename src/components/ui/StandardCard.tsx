
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandardCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  variant?: 'overview' | 'action' | 'settings' | 'member';
  headerActions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const StandardCard = ({
  title,
  description,
  icon: Icon,
  children,
  variant = 'overview',
  headerActions,
  onClick,
  className = ""
}: StandardCardProps) => {
  const cardClasses = cn(
    // Base card styling with green-first design
    "bg-white rounded-[12px] border-2 border-form-green transition-all duration-200",
    "solid-shadow-green press-down-effect-green",
    // Variant-specific styling
    {
      "hover:shadow-lg hover:-translate-y-1 cursor-pointer": variant === 'overview' || onClick,
      "p-0": variant === 'settings', // Settings cards control their own padding
      "p-6": variant !== 'settings',
    },
    className
  );

  const iconClasses = cn(
    "h-8 w-8 text-form-green",
    {
      "h-6 w-6": variant === 'settings' || variant === 'action',
    }
  );

  if (variant === 'settings') {
    return (
      <Card className={cardClasses} onClick={onClick}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-form-green font-dm-sans text-xl font-semibold">
                <Icon className={iconClasses} />
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="font-dm-sans text-muted-foreground mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerActions}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'action') {
    return (
      <Card className={cardClasses} onClick={onClick}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-form-green font-dm-sans text-xl font-semibold">
                <Icon className={iconClasses} />
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="font-dm-sans text-muted-foreground mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerActions}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    );
  }

  // Overview and member variants
  return (
    <Card className={cardClasses} onClick={onClick}>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-vibe-green-light flex items-center justify-center">
            <Icon className={iconClasses} />
          </div>
          {headerActions}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-form-green font-dm-sans">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground font-dm-sans">
              {description}
            </p>
          )}
          {children}
        </div>

        {/* Green accent bar for member variant */}
        {variant === 'member' && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-form-green rounded-b-[12px]" />
        )}
      </CardContent>
    </Card>
  );
};

export default StandardCard;
