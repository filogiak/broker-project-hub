import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PersonalProfileSection from '@/components/brokerage/PersonalProfileSection';
import OrganizationSection from '@/components/brokerage/OrganizationSection';
import ProjectsSection from '@/components/brokerage/ProjectsSection';
import DashboardStats from '@/components/brokerage/DashboardStats';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { getBrokerageByOwner, getBrokerageProjects } from '@/services/brokerageService';
import { createProject, deleteProject } from '@/services/projectService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const BrokerageOwnerDashboard = () => {
  const { brokerageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [brokerage, setBrokerage] = useState<Brokerage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading dashboard data for user:', user.id);

        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          throw new Error(`Failed to load user profile: ${profileError.message}`);
        }

        if (!profileData) {
          console.error('No profile found for user');
          throw new Error('User profile not found. Please contact support.');
        }

        setUserProfile(profileData);
        console.log('User profile loaded:', profileData);

        // Load user's brokerage
        const brokerageData = await getBrokerageByOwner(user.id);
        
        if (!brokerageData) {
          console.log('No brokerage found for user');
          setError('No brokerage found for your account');
          return;
        }

        setBrokerage(brokerageData);
        console.log('Brokerage loaded:', brokerageData);

        // Load projects for the brokerage
        const projectsData = await getBrokerageProjects(brokerageData.id);
        setProjects(projectsData);
        console.log('Projects loaded:', projectsData);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        
        toast({
          title: "Error Loading Dashboard",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, navigate, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout properly. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setUserProfile(updatedProfile);
  };

  const handleBrokerageUpdate = (updatedBrokerage: Brokerage) => {
    setBrokerage(updatedBrokerage);
  };

  const handleCreateProject = async (projectData: { name: string; description?: string }) => {
    if (!brokerage) {
      toast({
        title: "Error",
        description: "No brokerage found. Cannot create project.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creating project:', projectData);
      const newProject = await createProject({
        name: projectData.name,
        description: projectData.description,
        brokerageId: brokerage.id,
      });

      setProjects(prev => [newProject, ...prev]);
      toast({
        title: "Project Created",
        description: `${projectData.name} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to create project: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      console.log('Deleting project:', projectId);
      await deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to delete project: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
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

  if (error || !brokerage) {
    return (
      <MainLayout title="Brokerage Dashboard" userEmail={user?.email || ''} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-destructive">
              {error ? 'Error Loading Dashboard' : 'No Brokerage Found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || "You don't have a brokerage associated with your account or you don't have permission to access it."}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
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

        {/* Dashboard Stats */}
        <DashboardStats brokerageId={brokerage.id} projects={projects} />

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
          onDeleteProject={handleDeleteProject}
          onOpenProject={handleOpenProject}
        />
      </div>
    </MainLayout>
  );
};

export default BrokerageOwnerDashboard;
