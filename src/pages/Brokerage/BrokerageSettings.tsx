import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import PersonalProfileSection from '@/components/brokerage/PersonalProfileSection';
import OrganizationSection from '@/components/brokerage/OrganizationSection';
import { useAuth } from '@/hooks/useAuth';
import { getBrokerageByOwner } from '@/services/brokerageService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const BrokerageSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [brokerage, setBrokerage] = useState<Brokerage | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to load user profile.",
            variant: "destructive",
          });
          return;
        }

        if (!profileData) {
          toast({
            title: "Error",
            description: "User profile not found.",
            variant: "destructive",
          });
          return;
        }

        setUserProfile(profileData);

        // Load brokerage
        const brokerageData = await getBrokerageByOwner(user.id);
        if (!brokerageData) {
          toast({
            title: "Error",
            description: "No brokerage found for your account.",
            variant: "destructive",
          });
          return;
        }
        setBrokerage(brokerageData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load settings data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate, toast]);

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setUserProfile(updatedProfile);
  };

  const handleBrokerageUpdate = (updatedBrokerage: Brokerage) => {
    setBrokerage(updatedBrokerage);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <BrokerageSidebar />
          <SidebarInset>
            <LoadingOverlay message="Loading settings..." />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!brokerage || !userProfile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <BrokerageSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive font-dm-sans">
                  Settings Unavailable
                </h2>
                <p className="text-muted-foreground font-dm-sans">
                  Unable to load settings data. Please try refreshing the page.
                </p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BrokerageSidebar />
        <SidebarInset>
          <div className="flex-1 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonalProfileSection
                profile={userProfile}
                onProfileUpdate={handleProfileUpdate}
              />
              <OrganizationSection
                brokerage={brokerage}
                onBrokerageUpdate={handleBrokerageUpdate}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageSettings;
