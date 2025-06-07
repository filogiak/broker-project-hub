
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PersonalProfileSection from '@/components/brokerage/PersonalProfileSection';
import OrganizationSection from '@/components/brokerage/OrganizationSection';
import ProjectsSection from '@/components/brokerage/ProjectsSection';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { getBrokerageByOwner, getBrokerageProjects } from '@/services/brokerageService';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const BrokerageOwnerDashboard = () => {
  const { brokerageId } = useParams();
  const { user } = useAuth();
  const [brokerage, setBrokerage] = useState<Brokerage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        // Load user's brokerage
        const brokerageData = await getBrokerageByOwner(user.id);
        setBrokerage(brokerageData);

        // Load projects if brokerage exists
        if (brokerageData) {
          const projectsData = await getBrokerageProjects(brokerageData.id);
          setProjects(projectsData);
        }

        // Set user profile from auth context
        if (user.profile) {
          setUserProfile(user.profile);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setUserProfile(updatedProfile);
  };

  const handleBrokerageUpdate = (updatedBrokerage: Brokerage) => {
    setBrokerage(updatedBrokerage);
  };

  const handleCreateProject = () => {
    // TODO: Implement project creation modal/form
    console.log('Create new project clicked');
  };

  if (loading) {
    return (
      <MainLayout title="Loading..." userEmail={user?.email || ''} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </MainLayout>
    );
  }

  if (!brokerage) {
    return (
      <MainLayout title="Brokerage Dashboard" userEmail={user?.email || ''} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No Brokerage Found</h2>
            <p className="text-muted-foreground">You don't have a brokerage associated with your account.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={`${brokerage.name} - Owner Dashboard`}
      userEmail={user?.email || ''} 
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Brokerage Owner Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal profile, organization, and projects
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Profile Section */}
          {userProfile && (
            <PersonalProfileSection 
              profile={userProfile} 
              onProfileUpdate={handleProfileUpdate}
            />
          )}

          {/* Organization Section */}
          <OrganizationSection 
            brokerage={brokerage} 
            onBrokerageUpdate={handleBrokerageUpdate}
          />
        </div>

        {/* Projects Section */}
        <ProjectsSection 
          projects={projects}
          brokerageId={brokerage.id}
          onCreateProject={handleCreateProject}
        />
      </div>
    </MainLayout>
  );
};

export default BrokerageOwnerDashboard;
