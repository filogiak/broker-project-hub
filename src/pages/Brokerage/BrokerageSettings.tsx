
import React from 'react';
import PersonalProfileSection from '@/components/brokerage/PersonalProfileSection';
import OrganizationSection from '@/components/brokerage/OrganizationSection';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface BrokerageSettingsProps {
  brokerage: Brokerage;
  userProfile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
  onBrokerageUpdate: (updatedBrokerage: Brokerage) => void;
}

const BrokerageSettings = ({ 
  brokerage, 
  userProfile, 
  onProfileUpdate, 
  onBrokerageUpdate 
}: BrokerageSettingsProps) => {
  return (
    <div className="flex-1 p-8">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Profile Section */}
        <PersonalProfileSection 
          profile={userProfile} 
          onProfileUpdate={onProfileUpdate}
        />

        {/* Organization Section */}
        <OrganizationSection 
          brokerage={brokerage} 
          onBrokerageUpdate={onBrokerageUpdate}
        />
      </div>
    </div>
  );
};

export default BrokerageSettings;
