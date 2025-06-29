
import React from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
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
      {/* Header Section - matching progetti attivi layout */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold text-black font-dm-sans">Settings</h1>
          <span className="text-muted-foreground font-dm-sans">2 sezioni</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Settings Grid - using similar card design */}
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
