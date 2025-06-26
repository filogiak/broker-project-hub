
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectOverviewCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: string;
  progress?: number;
  count?: number;
}

const ProjectOverviewCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  badge,
  progress,
  count
}: ProjectOverviewCardProps) => {
  return (
    <Card 
      className="bg-white border border-form-border rounded-[12px] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Icon className="h-7 w-7 text-form-green-dark" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-black font-dm-sans mb-1">{title}</h3>
            </div>
          </div>
          {badge && (
            <Badge variant="secondary" className="bg-vibe-yellow-fluo text-black text-xs font-medium">
              {badge}
            </Badge>
          )}
        </div>

        <p className="text-gray-600 font-dm-sans mb-4 text-sm leading-relaxed">
          {description}
        </p>

        {progress !== undefined && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500 font-dm-sans">Progress</span>
              <span className="text-xs text-form-green font-semibold font-dm-sans">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-form-green h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {count !== undefined && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-dm-sans">Items</span>
            <span className="text-form-green font-semibold font-dm-sans">{count}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectOverviewCard;
