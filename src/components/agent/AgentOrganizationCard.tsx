import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CreatableBrokerage } from '@/services/agentDataService';

interface AgentOrganizationCardProps {
  brokerage: CreatableBrokerage;
}

const AgentOrganizationCard = ({ brokerage }: AgentOrganizationCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/brokerage/${brokerage.id}`);
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md border-border hover:border-primary/20"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        {/* Top section with icon and badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          
          <Badge variant="secondary" className="font-medium">
            {brokerage.access_type === 'member' ? 'Membro' : 'Proprietario'}
          </Badge>
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">{brokerage.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {brokerage.description || 'Clicca per accedere all\'organizzazione'}
            </p>
          </div>

          {/* Member info section */}
          <div className="flex items-center gap-2 pt-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Organizzazione attiva
            </span>
          </div>

          {/* Bottom section with arrow */}
          <div className="flex justify-end pt-2 border-t border-border">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentOrganizationCard;