
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Building2, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import type { CreatableBrokerage } from '@/services/agentDataService';

interface AgentOrganizationCardProps {
  brokerage: CreatableBrokerage;
}

const AgentOrganizationCard = ({ brokerage }: AgentOrganizationCardProps) => {
  const navigate = useNavigate();
  const { selectedRole } = useRoleSelection();

  const handleBrokerageAccess = () => {
    navigate(`/brokerage/${brokerage.id}`);
  };

  const handleCreateSimulation = () => {
    // Navigate to simulation creation or brokerage simulations page
    navigate(`/brokerage/${brokerage.id}/simulations`);
  };

  const isRealEstateAgent = selectedRole === 'real_estate_agent';

  return (
    <Card className="transition-all duration-200 hover:shadow-md border-border hover:border-primary/20">
      <CardContent className="p-6">
        {/* Top section with icon and badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <Badge variant="secondary" className="font-medium">
              {brokerage.access_type === 'member' ? 'Membro' : 'Proprietario'}
            </Badge>
            {brokerage.role_count > 1 && (
              <Badge variant="outline" className="text-xs">
                {brokerage.role_count} ruoli
              </Badge>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">{brokerage.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {brokerage.description || 'Organizzazione attiva nel sistema'}
            </p>
          </div>

          {/* Role info section */}
          <div className="flex items-center gap-2 pt-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Ruolo principale: {brokerage.primary_role?.replace('_', ' ') || 'Membro'}
            </span>
          </div>

          {/* Action section */}
          <div className="flex justify-between items-center pt-4 border-t border-border">
            {isRealEstateAgent ? (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCreateSimulation}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Simulazioni
                </Button>
              </div>
            ) : (
              <div className="flex justify-between items-center w-full">
                <span className="text-sm text-muted-foreground">
                  Accesso completo disponibile
                </span>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleBrokerageAccess}
                  className="flex items-center gap-2"
                >
                  Accedi
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentOrganizationCard;
