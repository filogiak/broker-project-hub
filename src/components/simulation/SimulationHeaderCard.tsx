
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Calendar } from 'lucide-react';

interface SimulationHeaderCardProps {
  simulation: {
    id: string;
    name: string;
    description?: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
}

const SimulationHeaderCard = ({ simulation }: SimulationHeaderCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bozza';
      case 'in_progress': return 'In Corso';
      case 'completed': return 'Completata';
      default: return status;
    }
  };

  return (
    <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FlaskConical className="h-6 w-6 text-form-green" />
              <h1 className="font-semibold font-dm-sans text-2xl text-black">
                {simulation.name}
              </h1>
              <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(simulation.status)}`}>
                {getStatusText(simulation.status)}
              </Badge>
            </div>
            
            {simulation.description && (
              <p className="text-gray-600 mb-4 font-dm-sans">
                {simulation.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Creata il {new Date(simulation.created_at).toLocaleDateString('it-IT')}
                </span>
              </div>
              <div>
                Ultima modifica: {new Date(simulation.updated_at).toLocaleDateString('it-IT')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationHeaderCard;
