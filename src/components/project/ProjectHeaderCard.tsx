
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Clock } from 'lucide-react';

interface ProjectHeaderCardProps {
  projectName: string;
  projectDescription?: string;
  membersCount: number;
  progressPercentage: number;
  lastActivity: string;
}

const ProjectHeaderCard = ({ 
  projectName, 
  projectDescription, 
  membersCount, 
  progressPercentage, 
  lastActivity 
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
    <Card className="bg-form-green text-white border-form-green rounded-[12px] solid-shadow-dark press-down-effect-dark">
      <CardContent className="p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-dm-sans mb-2">{projectName}</h1>
          {projectDescription && (
            <p className="text-lg text-green-100 font-dm-sans opacity-90">{projectDescription}</p>
          )}
        </div>

        {/* Embedded Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white font-dm-sans mb-4">Panoramica Progetto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div 
                key={stat.title}
                className="bg-white rounded-[10px] border border-gray-200 p-4 solid-shadow-light press-down-effect"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1 font-dm-sans">{stat.title}</p>
                    <p className="text-xl font-bold text-form-green font-dm-sans">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
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
