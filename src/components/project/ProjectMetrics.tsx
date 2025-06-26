
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

interface ProjectMetricsProps {
  projectId: string;
}

const ProjectMetrics = ({ projectId }: ProjectMetricsProps) => {
  // Mock data - in real app, this would come from props or API
  const metrics = [
    {
      title: 'Team Members',
      value: '4',
      subtitle: 'Active members',
      icon: Users,
      color: 'text-form-green',
      bgColor: 'bg-vibe-green-light',
    },
    {
      title: 'Documents',
      value: '12',
      subtitle: '8 completed',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Progress',
      value: '65%',
      subtitle: 'Overall completion',
      icon: CheckCircle,
      color: 'text-vibe-green-vivid',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Last Activity',
      value: '2h',
      subtitle: 'ago',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="gomutuo-card hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-form-green font-dm-sans">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.subtitle}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectMetrics;
