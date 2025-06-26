
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectHeaderCardProps {
  projectName: string;
  projectDescription?: string;
  lastActivity: string;
  isActive?: boolean;
}

const ProjectHeaderCard = ({ 
  projectName, 
  projectDescription, 
  lastActivity,
  isActive = true
}: ProjectHeaderCardProps) => {
  return (
    <Card className="bg-form-green text-white border-2 border-form-green-dark rounded-[12px] shadow-lg shadow-form-green-darker/20 relative overflow-hidden" style={{ borderBottomWidth: '4px' }}>
      <CardContent className="p-0">
        {/* Main Header Section */}
        <div className="px-6 py-6 relative">
          {/* Status Badge - Top Right */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <Badge 
              variant="secondary" 
              className={`
                px-2 py-0.5 text-xs font-medium rounded-full border-0 flex items-center gap-1.5 flex-shrink-0
                ${isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}
            >
              <Circle className={`h-1.5 w-1.5 fill-current ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
              {isActive ? 'Attivo' : 'Non Attivo'}
            </Badge>
            
            {/* Clock indicator */}
            <div className="bg-white/10 backdrop-blur-sm rounded-[8px] px-3 py-2 flex items-center gap-2 border border-white/20">
              <Clock className="h-4 w-4 text-white/80" />
              <span className="text-sm font-medium text-white/90 font-dm-sans">{lastActivity}</span>
            </div>
          </div>

          {/* Project Title & Description */}
          <div className="pr-32">
            <h1 className="text-3xl font-bold text-white font-dm-sans leading-tight mb-2">{projectName}</h1>
            {projectDescription && (
              <p className="text-lg text-green-50 font-dm-sans opacity-95 leading-relaxed max-w-2xl">
                {projectDescription}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHeaderCard;
