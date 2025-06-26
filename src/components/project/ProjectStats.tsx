
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

interface ProjectStatsProps {
  projectId: string;
}

const ProjectStats = ({ projectId }: ProjectStatsProps) => {
  const stats = [
    {
      title: 'Team Members',
      value: '4',
      subtitle: 'Active',
      icon: Users,
    },
    {
      title: 'Documents',
      value: '12',
      subtitle: '8 completed',
      icon: FileText,
    },
    {
      title: 'Progress',
      value: '65%',
      subtitle: 'Overall',
      icon: CheckCircle,
    },
    {
      title: 'Last Activity',
      value: '2h',
      subtitle: 'ago',
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-white border border-gray-100 screenshot-card-shadow rounded-[12px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1 font-dm-sans">{stat.title}</p>
                <p className="text-2xl font-bold text-form-green font-dm-sans mb-1">{stat.value}</p>
                <p className="text-xs text-gray-400 font-dm-sans">{stat.subtitle}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-vibe-green-light flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-form-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectStats;
