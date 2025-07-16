
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Building } from 'lucide-react';
import BrokerOrganizationCard from '@/components/broker/BrokerOrganizationCard';


const BrokerAssistantOrganizations = () => {
  const { user } = useAuth();
  const { selectedRole, isMultiRole } = useRoleSelection();
  const navigate = useNavigate();

  // Fetch brokerage memberships
  const { data: brokerages, isLoading } = useQuery({
    queryKey: ['broker-assistant-brokerages', user?.id, selectedRole],
    queryFn: async () => {
      if (!user?.id) {
        console.log('🔍 [BrokerAssistant] No user ID available');
        return [];
      }

      console.log('🔍 [BrokerAssistant] Starting query for user:', user.id);
      console.log('🔍 [BrokerAssistant] Selected role:', selectedRole);
      console.log('🔍 [BrokerAssistant] Is multi-role:', isMultiRole);
      console.log('🔍 [BrokerAssistant] User roles:', user.roles);

      try {
        // First, get the brokerage memberships
        let membershipQuery = supabase
          .from('brokerage_members')
          .select('brokerage_id, role, joined_at')
          .eq('user_id', user.id);

        // Apply role filter if needed
        if (selectedRole && isMultiRole) {
          console.log('🔍 [BrokerAssistant] Filtering by selected role:', selectedRole);
          membershipQuery = membershipQuery.eq('role', selectedRole);
        } else if (!isMultiRole) {
          // For single role users, filter by broker_assistant
          console.log('🔍 [BrokerAssistant] Single role user, filtering by broker_assistant');
          membershipQuery = membershipQuery.eq('role', 'broker_assistant');
        }

        const { data: memberships, error: membershipError } = await membershipQuery;
        
        if (membershipError) {
          console.error('❌ [BrokerAssistant] Error fetching memberships:', membershipError);
          return [];
        }

        console.log('✅ [BrokerAssistant] Memberships found:', memberships?.length || 0);
        console.log('📊 [BrokerAssistant] Membership data:', memberships);

        if (!memberships || memberships.length === 0) {
          console.log('ℹ️ [BrokerAssistant] No memberships found');
          return [];
        }

        // Now get the brokerage details
        const brokerageIds = memberships.map(m => m.brokerage_id);
        console.log('🔍 [BrokerAssistant] Fetching brokerages for IDs:', brokerageIds);

        const { data: brokerageDetails, error: brokerageError } = await supabase
          .from('brokerages')
          .select('id, name, description, created_at, owner_id')
          .in('id', brokerageIds);

        if (brokerageError) {
          console.error('❌ [BrokerAssistant] Error fetching brokerage details:', brokerageError);
          return [];
        }

        console.log('✅ [BrokerAssistant] Brokerage details found:', brokerageDetails?.length || 0);
        console.log('📊 [BrokerAssistant] Brokerage details:', brokerageDetails);

        // Combine the data
        const combinedData = memberships.map(membership => ({
          ...membership,
          brokerages: brokerageDetails?.find(b => b.id === membership.brokerage_id)
        })).filter(item => item.brokerages); // Only include items where we found the brokerage

        console.log('✅ [BrokerAssistant] Combined data:', combinedData);
        return combinedData;

      } catch (error) {
        console.error('❌ [BrokerAssistant] Unexpected error:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const handleAccessBrokerage = (brokerageId: string) => {
    console.log('🚀 [BrokerAssistant] Navigating to brokerage:', brokerageId);
    navigate(`/brokerage/${brokerageId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Caricamento organizzazioni...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Main Action Cards */}
      <div>
        <h2 className="font-semibold font-dm-sans mb-2 text-2xl text-black">Le tue Organizzazioni</h2>
        <p className="text-muted-foreground font-dm-sans mb-6">
          Organizzazioni dove fornisci assistenza come broker assistant
        </p>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-6">
        {!brokerages || brokerages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 font-dm-sans">Nessuna organizzazione trovata</h3>
              <p className="text-muted-foreground text-center max-w-md font-dm-sans">
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
                <BrokerOrganizationCard
                  key={brokerage.id}
                  brokerage={{
                    id: brokerage.id,
                    name: brokerage.name,
                    description: brokerage.description,
                    access_type: membership.role === 'brokerage_owner' ? 'owner' : 'member'
                  }}
                  onClick={() => handleAccessBrokerage(brokerage.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerAssistantOrganizations;
