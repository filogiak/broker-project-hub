
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
    <Card className="bg-white border-2 border-form-green rounded-[12px] shadow-sm relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-form-green rounded-b-[10px]"></div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Project Info */}
          <div className="flex-1 pr-6">
            <h1 className="text-2xl font-bold text-black font-dm-sans mb-2 leading-tight">
              {projectName}
            </h1>
            {projectDescription && (
              <p className="text-gray-600 font-dm-sans text-base leading-relaxed">
                {projectDescription}
              </p>
            )}
          </div>

          {/* Status & Activity */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            {/* Status Badge */}
            <Badge 
              variant="secondary" 
              className={`
                px-3 py-1 text-sm font-medium rounded-full border-0 flex items-center gap-2
                ${isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}
            >
              <Circle className={`h-2 w-2 fill-current ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
              {isActive ? 'Attivo' : 'Non Attivo'}
            </Badge>
            
            {/* Last Activity */}
            <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-form-green" />
              <span className="text-sm font-medium text-gray-700 font-dm-sans">{lastActivity}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHeaderCard;
