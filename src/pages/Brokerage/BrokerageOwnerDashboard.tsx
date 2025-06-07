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
  const { user, loading: authLoading, sessionError, refreshUser } = useAuth();
  const { toast } = useToast();
  const [brokerage, setBrokerage] = useState<Brokerage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle session errors
  useEffect(() => {
    if (sessionError) {
      console.error('🚨 Session error detected:', sessionError);
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [sessionError, navigate, toast]);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Wait for auth to be loaded
      if (authLoading) {
        console.log('⏳ Waiting for authentication...');
        return;
      }

      if (!user?.id) {
        console.log('❌ No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('📊 Loading dashboard data for user:', user.id);

        // Check session is still valid before proceeding
        const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession();
        
        if (sessionCheckError || !session) {
          console.error('❌ Session invalid during dashboard load');
          await refreshUser();
          return;
        }

        // Load user profile first
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('❌ Error loading profile:', profileError);
          if (profileError.code === 'PGRST116' || profileError.message.includes('row-level security')) {
            throw new Error('Profile access denied. Please check your permissions and try refreshing the page.');
          }
          throw new Error(`Failed to load user profile: ${profileError.message}`);
        }

        if (!profileData) {
          console.error('❌ No profile found for user');
          throw new Error('User profile not found. Please contact support or try refreshing the page.');
        }

        setUserProfile(profileData);
        console.log('✅ User profile loaded:', profileData);

        // Load user's brokerage with better error handling
        try {
          const brokerageData = await getBrokerageByOwner(user.id);
          
          if (!brokerageData) {
            console.log('❌ No brokerage found for user');
            setError('No brokerage found for your account. You may not have the required permissions.');
            return;
          }

          setBrokerage(brokerageData);
          console.log('✅ Brokerage loaded:', brokerageData);

          // Load projects for the brokerage with improved error handling
          try {
            console.log('📋 Loading projects for brokerage:', brokerageData.id);
            const projectsData = await getBrokerageProjects(brokerageData.id);
            setProjects(projectsData);
            console.log('✅ Projects loaded successfully:', projectsData.length, 'projects');
          } catch (projectError) {
            console.error('⚠️ Error loading projects:', projectError);
            setProjects([]);
            
            const errorMessage = projectError instanceof Error ? projectError.message : 'Unknown error';
            
            // Show a toast but don't fail the entire dashboard load
            toast({
              title: "Projects Load Warning",
              description: "Some project data could not be loaded. The database has been updated, try refreshing the page.",
              variant: "default",
            });
          }
        } catch (brokerageError) {
          console.error('❌ Error loading brokerage:', brokerageError);
          const errorMessage = brokerageError instanceof Error ? brokerageError.message : 'Unknown error';
          
          if (errorMessage.includes('row-level security') || errorMessage.includes('permission')) {
            setError('Access denied. You may not have permission to view this brokerage.');
          } else {
            setError(errorMessage);
          }
        }

      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
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
  }, [user, authLoading, navigate, toast, refreshUser]);

  const handleLogout = async () => {
    try {
      console.log('👋 Logging out user...');
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('❌ Logout error:', error);
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
      console.log('🚀 Dashboard initiating project creation:', projectData);

      const newProject = await createProject({
        name: projectData.name,
        description: projectData.description,
        brokerageId: brokerage.id,
      });

      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: "Project Created Successfully",
        description: `${projectData.name} has been created and is ready to use.`,
        variant: "default",
      });

      console.log('✅ Dashboard: Project creation completed successfully');

    } catch (error) {
      console.error('❌ Dashboard: Project creation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Failed to Create Project",
        description: errorMessage,
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

  if (authLoading || loading) {
    return (
      <MainLayout title="Loading..." userEmail={user?.email || ''} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">
            {authLoading ? 'Checking authentication...' : 'Loading dashboard...'}
          </div>
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
              {error ? 'Dashboard Access Issue' : 'No Brokerage Found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || "You don't have a brokerage associated with your account or you don't have permission to access it."}
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Refresh Page
              </button>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                Sign Out
              </button>
            </div>
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
