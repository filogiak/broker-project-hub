
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
    <Card className="bg-gradient-to-br from-white via-white to-vibe-green-light/10 border-2 border-form-green rounded-[16px] shadow-lg shadow-form-green/10 relative overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-form-green via-vibe-green to-form-green"></div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-form-green rounded-b-[14px]"></div>
      
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          {/* Project Info */}
          <div className="flex-1 pr-8">
            {/* Project Title with enhanced styling */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-8 bg-gradient-to-b from-form-green to-vibe-green rounded-full"></div>
              <h1 className="text-3xl font-bold text-black font-dm-sans leading-tight bg-gradient-to-r from-form-green to-form-green-hover bg-clip-text text-transparent">
                {projectName}
              </h1>
            </div>
            
            {projectDescription && (
              <p className="text-gray-700 font-dm-sans text-lg leading-relaxed ml-5 font-medium">
                {projectDescription}
              </p>
            )}
            
            {/* Subtle decorative element */}
            <div className="ml-5 mt-4 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-gradient-to-r from-form-green to-transparent rounded-full"></div>
              <div className="w-4 h-[2px] bg-gradient-to-r from-vibe-green to-transparent rounded-full"></div>
              <div className="w-2 h-[2px] bg-form-green/30 rounded-full"></div>
            </div>
          </div>

          {/* Enhanced Status & Activity */}
          <div className="flex flex-col items-end gap-4 flex-shrink-0">
            {/* Status Badge with enhanced styling */}
            <Badge 
              variant="secondary" 
              className={`
                px-4 py-2 text-sm font-semibold rounded-full border-0 flex items-center gap-2 shadow-sm
                ${isActive 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                }
              `}
            >
              <Circle className={`h-2.5 w-2.5 fill-current ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
              {isActive ? 'Attivo' : 'Non Attivo'}
            </Badge>
            
            {/* Enhanced Last Activity */}
            <div className="bg-white/80 backdrop-blur-sm border-2 border-form-green/20 rounded-[12px] px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-1.5 bg-form-green/10 rounded-full">
                <Clock className="h-4 w-4 text-form-green" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-dm-sans mb-0.5">Ultima attività</p>
                <span className="text-sm font-semibold text-form-green font-dm-sans">{lastActivity}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHeaderCard;
