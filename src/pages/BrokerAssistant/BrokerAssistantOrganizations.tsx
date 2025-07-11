import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, ArrowRight, Users } from 'lucide-react';
import RoleSelector from '@/components/dashboard/RoleSelector';

const BrokerAssistantOrganizations = () => {
  const { user } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();
  const navigate = useNavigate();

  // Fetch brokerage memberships
  const { data: brokerages, isLoading } = useQuery({
    queryKey: ['broker-assistant-brokerages', user?.id, selectedRole],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('brokerage_members')
        .select(`
          brokerage_id,
          role,
          joined_at,
          brokerages!inner (
            id,
            name,
            description,
            created_at,
            owner_id
          )
        `)
        .eq('user_id', user.id);

      // Filter by selected role if multi-role user
      if (selectedRole && isMultiRole) {
        query = query.eq('role', selectedRole);
      } else {
        query = query.eq('role', 'broker_assistant');
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching brokerage data:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleAccessBrokerage = (brokerageId: string) => {
    navigate(`/brokerage/${brokerageId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {isMultiRole && <RoleSelector />}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Caricamento organizzazioni...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Selector for multi-role users */}
      {isMultiRole && <RoleSelector />}

      <div className="flex items-center gap-3">
        <Building className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Organizzazioni</h1>
          <p className="text-muted-foreground">
            Organizzazioni dove fornisci assistenza come broker assistant
          </p>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-6">
        {!brokerages || brokerages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessuna organizzazione trovata</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Non sei ancora membro di nessuna organizzazione come broker assistant. 
                Attendi un invito dal proprietario di un'organizzazione.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brokerages.map((membership) => {
              const brokerage = membership.brokerages;
              return (
                <Card key={brokerage.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          {brokerage.name}
                        </CardTitle>
                        {brokerage.description && (
                          <CardDescription className="mt-2">
                            {brokerage.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {membership.role.replace('_', ' ')}
                      </Badge>
                      
                      <span className="text-sm text-muted-foreground">
                        Membro dal {new Date(membership.joined_at || '').toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={() => handleAccessBrokerage(brokerage.id)}
                      className="w-full"
                      variant="default"
                    >
                      Accedi all'organizzazione
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerAssistantOrganizations;