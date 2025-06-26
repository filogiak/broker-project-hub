
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Clock, Home, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <Card className="bg-form-green text-white border-form-green rounded-[12px] solid-shadow-dark press-down-effect-dark overflow-hidden">
      <CardContent className="p-0">
        {/* Compact Header Section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Smaller Project Icon */}
              <div className="w-10 h-10 bg-white/10 rounded-[8px] flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              
              {/* Compact Project Title & Description */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-white font-dm-sans">{projectName}</h1>
                  {/* Compact Status Badge */}
                  <Badge 
                    variant="secondary" 
                    className={`
                      px-2 py-0.5 text-xs font-medium rounded-full border-0 flex items-center gap-1
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
                  <p className="text-sm text-green-100 font-dm-sans opacity-90">
                    {projectDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Compact Section Title */}
          <div className="mb-3">
            <h3 className="text-lg font-medium text-white font-dm-sans">Panoramica Progetto</h3>
          </div>
        </div>

        {/* Compact Statistics Section */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={stat.title}
                className="bg-white rounded-[8px] border border-gray-100 p-3 solid-shadow-light press-down-effect hover:scale-[1.01] transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1 font-dm-sans uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-lg font-semibold text-form-green font-dm-sans">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-[6px] ${stat.bgColor} flex items-center justify-center`}>
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
