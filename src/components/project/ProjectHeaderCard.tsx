
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
        {/* Enhanced Header Section */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Project Icon */}
              <div className="w-14 h-14 bg-white/10 rounded-[12px] flex items-center justify-center backdrop-blur-sm">
                <Home className="h-7 w-7 text-white" />
              </div>
              
              {/* Project Title & Description */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white font-dm-sans">{projectName}</h1>
                  {/* Status Badge */}
                  <Badge 
                    variant="secondary" 
                    className={`
                      px-3 py-1 text-xs font-medium rounded-full border-0 flex items-center gap-1.5
                      ${isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    <Circle className={`h-2 w-2 fill-current ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
                    {isActive ? 'Attivo' : 'Non Attivo'}
                  </Badge>
                </div>
                {projectDescription && (
                  <p className="text-lg text-green-100 font-dm-sans opacity-90 leading-relaxed">
                    {projectDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Elegant Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>

          {/* Enhanced Section Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-white rounded-full"></div>
            <h3 className="text-xl font-semibold text-white font-dm-sans">Panoramica Progetto</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>
        </div>

        {/* Enhanced Statistics Section */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={stat.title}
                className="bg-white rounded-[12px] border border-gray-100 p-5 solid-shadow-light press-down-effect group hover:scale-[1.02] transition-all duration-300"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fade-in 0.6s ease-out both'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-2 font-dm-sans tracking-wide uppercase">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-form-green font-dm-sans mb-1 group-hover:text-form-green/80 transition-colors">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-[10px] ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
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
