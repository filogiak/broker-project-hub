
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Clock, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CustomHouseIcon from '@/components/ui/custom-house-icon';

interface ProjectHeaderCardProps {
  projectName: string;
  projectDescription?: string;
  membersCount: number;
  progressPercentage: number;
  lastActivity: string;
  isActive?: boolean;
}

const ProjectHeaderCard = ({ 
  projectName, 
  projectDescription, 
  membersCount, 
  progressPercentage, 
  lastActivity,
  isActive = true
}: ProjectHeaderCardProps) => {
  const stats = [
    {
      title: 'Membri Team',
      value: membersCount.toString(),
      icon: Users,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Progresso Dati & Doc',
      value: `${progressPercentage}%`,
      icon: FileText,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Ultima Attività',
      value: lastActivity,
      icon: Clock,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <Card className="bg-form-green text-white border-2 border-form-green-dark rounded-[12px] shadow-lg shadow-form-green-darker/20 relative overflow-hidden" style={{ borderBottomWidth: '4px' }}>
      <CardContent className="p-0">
        {/* Main Header Section - DOMINANT */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4 mb-6">
            {/* Custom Project Icon */}
            <div className="w-12 h-12 bg-white/15 rounded-[8px] flex items-center justify-center flex-shrink-0">
              <CustomHouseIcon className="text-white" size={24} />
            </div>
            
            {/* Project Title & Description - PROMINENT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white font-dm-sans leading-tight">{projectName}</h1>
                {/* Compact Status Badge */}
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
              </div>
              {projectDescription && (
                <p className="text-lg text-green-50 font-dm-sans opacity-95 leading-relaxed">
                  {projectDescription}
                </p>
              )}
            </div>
          </div>

          {/* Secondary Section Title - SUBDUED */}
          <div className="mb-3">
            <h3 className="text-sm font-medium text-white/80 font-dm-sans uppercase tracking-wider">Panoramica Progetto</h3>
          </div>
        </div>

        {/* Statistics Section - SECONDARY */}
        <div className="px-6 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.map((stat, index) => (
              <div 
                key={stat.title}
                className="bg-white rounded-[8px] border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1 font-dm-sans uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-lg font-semibold text-form-green font-dm-sans">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-[6px] ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectHeaderCard;
