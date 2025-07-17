
import React from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CreatableBrokerage } from '@/services/agentDataService';

interface AgentOrganizationDisplayCardProps {
  brokerage: CreatableBrokerage;
}

const AgentOrganizationDisplayCard = ({ brokerage }: AgentOrganizationDisplayCardProps) => {
  return (
    <Card className="bg-white border border-[#BEB8AE] rounded-[12px] solid-shadow-light">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#235c4e]/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-[#235c4e]" />
          </div>
          <div className="flex-1">
            <h3 className="text-black font-dm-sans text-lg font-semibold mb-2">
              {brokerage.name}
            </h3>
            <p className="text-gray-600 font-dm-sans text-sm leading-relaxed">
              {brokerage.description || 'Organizzazione attiva nel sistema'}
            </p>
          </div>
        </div>
        
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-dm-sans text-sm">Tipo di accesso</span>
            <span className="text-black font-dm-sans text-sm font-medium">
              {brokerage.access_type === 'member' ? 'Membro' : 'Proprietario'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-dm-sans text-sm">Ruolo principale</span>
            <span className="text-black font-dm-sans text-sm font-medium">
              {brokerage.primary_role?.replace('_', ' ') || 'Membro'}
            </span>
          </div>
          {brokerage.role_count > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-dm-sans text-sm">Ruoli totali</span>
              <span className="text-black font-dm-sans text-sm font-medium">
                {brokerage.role_count.toString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentOrganizationDisplayCard;
