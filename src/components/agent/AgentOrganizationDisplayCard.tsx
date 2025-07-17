
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Building2, Users } from 'lucide-react';
import type { CreatableBrokerage } from '@/services/agentDataService';

interface AgentOrganizationDisplayCardProps {
  brokerage: CreatableBrokerage;
}

const AgentOrganizationDisplayCard = ({ brokerage }: AgentOrganizationDisplayCardProps) => {
  return (
    <Card className="bg-white border-2 border-form-green rounded-[12px] solid-shadow-green">
      <CardContent className="p-6">
        {/* Top section with icon and badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <Building2 className="h-9 w-9 text-form-green" />
          </div>
          
          <Badge 
            className="font-medium text-xs px-3 py-1 rounded-[8px] font-dm-sans border-[#E3FD53] text-form-green transition-opacity duration-200"
            style={{ backgroundColor: '#E3FD53' }}
          >
            {brokerage.access_type === 'member' ? 'Membro' : 'Proprietario'}
          </Badge>
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">{brokerage.name}</h3>
            <p className="text-sm text-gray-600 font-dm-sans leading-relaxed">
              {brokerage.description || 'Clicca per accedere all\'organizzazione'}
            </p>
          </div>

          {/* Member info section */}
          <div className="flex items-center gap-2 pt-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 font-dm-sans">
              Organizzazione attiva
            </span>
          </div>

          {/* Bottom section with arrow */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentOrganizationDisplayCard;
