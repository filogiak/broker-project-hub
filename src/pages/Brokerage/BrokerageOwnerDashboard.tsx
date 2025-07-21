import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import BrokerageDashboard from './BrokerageDashboard';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { getBrokerageByAccess } from '@/services/brokerageService';
import { createProject, deleteProject } from '@/services/projectService';
import { getUserProjects } from '@/services/userProjectService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import type { Database } from '@/integrations/supabase/types';
import type { BrokerageWithAccess } from '@/services/brokerageService';

type Project = Database['public']['Tables']['projects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const BrokerageOwnerDashboard = () => {
  const { brokerageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, sessionError, refreshUser } = useAuth();
  const { toast } = useToast();
  const [brokerage, setBrokerage] = useState<BrokerageWithAccess | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log('👤 Loading user profile...');
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
        console.log('✅ User profile loaded successfully');

        // Load user's brokerage using the new function that handles both ownership and membership
        console.log('🏢 Loading user brokerage access...');
        try {
          const brokerageData = await getBrokerageByAccess(user.id);
          
          if (!brokerageData) {
            console.log('❌ No brokerage access found for user');
            setError('No brokerage found for your account. You may not have the required permissions.');
            return;
          }

          setBrokerage(brokerageData);
          console.log('✅ Brokerage access loaded successfully:', brokerageData.name, 'as', brokerageData.access_type);

          // Load projects with improved error handling
          console.log('📋 Loading user projects...');
          
          try {
            const projectsData = await getUserProjects(user.id);
            setProjects(projectsData);
            console.log('✅ User projects loaded successfully:', projectsData.length, 'projects found');
            
            if (projectsData.length === 0) {
              console.log('ℹ️ No projects found - user may need to create their first project');
            }
          } catch (projectError) {
            console.error('❌ Failed to load user projects:', projectError);
            
            // Don't fail the whole dashboard for project loading issues
            setProjects([]);
            
            toast({
              title: "Projects Loading Issue",
              description: "Your projects couldn't be loaded, but the dashboard is still accessible. Try refreshing the page.",
              variant: "destructive",
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

  const handleCreateProject = async (projectData: { 
    name: string; 
    description: string;
    projectType: any;
    applicantCount: any;
    hasGuarantor: boolean;
    applicantOneFirstName?: string;
    applicantOneLastName?: string;
    applicantTwoFirstName?: string;
    applicantTwoLastName?: string;
  }) => {
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
        brokerage_id: brokerage.id,
        project_type: projectData.projectType,
        applicant_count: projectData.applicantCount,
        has_guarantor: projectData.hasGuarantor,
        applicant_one_first_name: projectData.applicantOneFirstName,
        applicant_one_last_name: projectData.applicantOneLastName,
        applicant_two_first_name: projectData.applicantTwoFirstName,
        applicant_two_last_name: projectData.applicantTwoLastName,
        created_by: user?.id || '',
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

  const renderCurrentPage = () => {
    const currentPath = location.pathname;
    
    if (currentPath.endsWith('/projects')) {
      navigate(`/brokerage/${brokerageId}/projects`);
      return null;
    } else if (currentPath.endsWith('/users')) {
      navigate(`/brokerage/${brokerageId}/users`);
      return null;
    } else if (currentPath.endsWith('/settings')) {
      navigate(`/brokerage/${brokerageId}/settings`);
      return null;
    } else if (currentPath.endsWith('/simulations')) {
      navigate(`/brokerage/${brokerageId}/simulations`);
      return null;
    } else {
      return (
        <BrokerageDashboard
          brokerage={brokerage!}
          projects={projects}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onOpenProject={handleOpenProject}
        />
      );
    }
  };

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <BrokerageSidebar />
          <SidebarInset>
            <LoadingOverlay message={authLoading ? 'Checking authentication...' : 'Loading dashboard...'} />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !brokerage || !userProfile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <BrokerageSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive font-dm-sans">
                  {error ? 'Dashboard Access Issue' : 'No Brokerage Found'}
                </h2>
                <p className="text-muted-foreground mb-4 font-dm-sans">
                  {error || "You don't have a brokerage associated with your account or you don't have permission to access it."}
                </p>
                <div className="space-x-2">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 font-dm-sans"
                  >
                    Refresh Page
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 font-dm-sans"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <BrokerageSidebar />
        <SidebarInset>
          {renderCurrentPage()}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageOwnerDashboard;
