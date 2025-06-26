
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  onClick: () => void;
  status?: 'complete' | 'in-progress' | 'pending';
  progress?: number;
  count?: number;
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

const ActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  status = 'pending',
  progress = 0,
  count,
  color = 'green'
}: ActionCardProps) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      green: {
        border: 'border-form-green/20 hover:border-form-green/40',
        icon: 'bg-vibe-green-light text-form-green',
        button: 'text-form-green hover:bg-vibe-green-light',
      },
      blue: {
        border: 'border-blue-200 hover:border-blue-300',
        icon: 'bg-blue-50 text-blue-600',
        button: 'text-blue-600 hover:bg-blue-50',
      },
      purple: {
        border: 'border-purple-200 hover:border-purple-300',
        icon: 'bg-purple-50 text-purple-600',
        button: 'text-purple-600 hover:bg-purple-50',
      },
      orange: {
        border: 'border-orange-200 hover:border-orange-300',
        icon: 'bg-orange-50 text-orange-600',
        button: 'text-orange-600 hover:bg-orange-50',
      },
    };
    return colorMap[color as keyof typeof colorMap];
  };

  const colors = getColorClasses(color);

  const getStatusBadge = () => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-vibe-green-vivid text-white border-vibe-green-vivid">Complete</Badge>;
      case 'in-progress':
        return <Badge className="bg-accent-yellow text-form-green border-accent-yellow">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300 text-gray-600">Pending</Badge>;
    }
  };

  return (
    <Card 
      className={`gomutuo-card-hover cursor-pointer border-2 ${colors.border} transition-all duration-200 group`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center group-hover:scale-105 transition-transform`}>
            <Icon className="h-6 w-6" />
          </div>
          {getStatusBadge()}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-form-green font-dm-sans mb-1">{title}</h3>
            <p className="text-sm text-gray-600 font-inter leading-relaxed">{description}</p>
          </div>

          {/* Progress or Count */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="gomutuo-progress-bar">
                <div 
                  className="gomutuo-progress-fill transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {count !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Items</span>
              <span className="font-semibold text-form-green">{count}</span>
            </div>
          )}

          {/* Action Button */}
          <Button 
            variant="ghost" 
            className={`w-full justify-between p-3 ${colors.button} group-hover:bg-opacity-100 transition-colors`}
          >
            <span className="font-medium">Open</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionCard;
