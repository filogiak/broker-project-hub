
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Circle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectHeaderCardProps {
  applicantNames: string;
  projectName: string;
  lastActivity: string;
  isActive?: boolean;
}

const ProjectHeaderCard = ({ 
  applicantNames, 
  projectName, 
  lastActivity,
  isActive = true
}: ProjectHeaderCardProps) => {
  return (
    <Card className="bg-white border-2 border-form-green rounded-[16px] shadow-lg relative overflow-hidden">
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-form-green rounded-b-[14px]"></div>
      
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          {/* Project Info with extended green line */}
          <div className="flex-1 pr-8 relative">
            {/* Extended green accent line */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-form-green rounded-full"></div>
            
            <div className="ml-6">
              <h1 className="text-3xl font-bold text-black font-dm-sans leading-tight mb-3">
                {applicantNames}
              </h1>
              
              <p className="text-gray-700 font-dm-sans text-lg leading-relaxed font-medium">
                {projectName}
              </p>
            </div>
          </div>

          {/* Status Badge - Top Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Circle className={`h-3 w-3 fill-current ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={`text-sm font-semibold ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
              {isActive ? 'Attivo' : 'Non Attivo'}
            </span>
          </div>
        </div>

        {/* Last Activity & Created Date - Bottom Right */}
        <div className="absolute bottom-8 right-8">
          <div className="flex items-center gap-8">
            {/* Last Activity */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-500 font-dm-sans leading-none">Ultima attività</p>
                <div className="flex items-center gap-1 justify-end">
                  <Clock className="h-4 w-4 text-form-green" />
                  <span className="text-sm font-semibold text-form-green font-dm-sans">{lastActivity}</span>
                </div>
              </div>
            </div>

            {/* Project Date */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-500 font-dm-sans leading-none">Creato</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-sm font-semibold text-form-green font-dm-sans">15 Giu</span>
                  <Calendar className="h-4 w-4 text-form-green" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHeaderCard;
