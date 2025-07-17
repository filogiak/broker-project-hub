
import React from 'react';
import { Building2, Users } from 'lucide-react';
import InformationalCard from '@/components/ui/informational-card';
import type { CreatableBrokerage } from '@/services/agentDataService';

interface AgentOrganizationCardProps {
  brokerage: CreatableBrokerage;
}

const AgentOrganizationCard = ({ brokerage }: AgentOrganizationCardProps) => {
  const details = [
    {
      label: 'Tipo di accesso',
      value: brokerage.access_type === 'member' ? 'Membro' : 'Proprietario'
    },
    {
      label: 'Ruolo principale',
      value: brokerage.primary_role?.replace('_', ' ') || 'Membro'
    }
  ];

  if (brokerage.role_count > 1) {
    details.push({
      label: 'Ruoli totali',
      value: brokerage.role_count.toString()
    });
  }

  return (
    <InformationalCard
      title={brokerage.name}
      description={brokerage.description || 'Organizzazione attiva nel sistema'}
      icon={Building2}
      details={details}
    />
  );
};

export default AgentOrganizationCard;
