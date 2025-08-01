
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

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
  return <Card className="cursor-pointer bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light press-down-effect" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <Icon className="h-9 w-9 text-form-green-dark" />
          </div>
          {badge && <span className="bg-accent-yellow text-form-green text-xs font-medium px-2 py-1 rounded-md">
              {badge}
            </span>}
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">{title}</h3>
            <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">{description}</p>
          </div>

          {progress !== undefined && <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-form-green transition-all duration-300" style={{
              width: `${progress}%`
            }} />
              </div>
            </div>}

          {count !== undefined && title === "Gestione Team" && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Utenti</span>
              <span className="font-semibold text-form-green">{count}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>;
};

export default ProjectOverviewCard;
