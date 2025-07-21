import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import BrokerageSidebar from '@/components/brokerage/BrokerageSidebar';
import ProjectsFullSection from '@/components/brokerage/ProjectsFullSection';
import { useAuth } from '@/hooks/useAuth';
import { getBrokerageByAccess } from '@/services/brokerageService';
import { createProject, deleteProject, getBrokerageProjects } from '@/services/projectService';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

const BrokerageProjects = () => {
  const { brokerageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [brokerage, setBrokerage] = useState<Brokerage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      try {
        setLoading(true);
        
        // Load brokerage using the new access logic
        const brokerageData = await getBrokerageByAccess(user.id);
        if (!brokerageData || brokerageData.id !== brokerageId) {
          toast({
            title: "Access Denied",
            description: "You don't have access to this brokerage.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        setBrokerage(brokerageData);

        // Load projects for this brokerage
        const projectsData = await getBrokerageProjects(brokerageData.id);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load projects data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, brokerageId, navigate, toast]);

  const handleCreateProject = async (projectData: any) => {
    if (!brokerage) return;

    try {
      const newProject = await createProject({
        ...projectData,
        brokerage_id: brokerage.id,
        created_by: user?.id || '',
      });

      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: "Project Created Successfully",
        description: `${projectData.name} has been created.`,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <BrokerageSidebar />
          <SidebarInset>
            <LoadingOverlay message="Loading projects..." />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!brokerage) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <BrokerageSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive font-dm-sans">
                  No Brokerage Found
                </h2>
                <p className="text-muted-foreground font-dm-sans">
                  You don't have access to this brokerage.
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
          <ProjectsFullSection
            projects={projects}
            brokerageId={brokerage.id}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onOpenProject={handleOpenProject}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default BrokerageProjects;
