
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import ProjectStats from '@/components/project/ProjectStats';
import ProjectOverviewCard from '@/components/project/ProjectOverviewCard';
import RecentActivity from '@/components/project/RecentActivity';
import { Users, FileText, BarChart3, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (authLoading) return;
      
      if (!user?.id) {
        navigate('/auth');
        return;
      }

      if (!projectId) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) {
          console.error('Error loading project:', projectError);
          setError('Failed to load project details');
          return;
        }

        setProject(projectData);

      } catch (error) {
        console.error('Error loading project:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [user, authLoading, projectId, navigate]);

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

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-lg text-form-green font-dm-sans">Loading project dashboard...</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !project) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive font-dm-sans">
                  {error ? 'Project Access Issue' : 'Project Not Found'}
                </h2>
                <p className="text-muted-foreground mb-4 font-inter">
                  {error || "The project you're looking for doesn't exist or you don't have permission to access it."}
                </p>
                <button 
                  onClick={() => navigate(-1)} 
                  className="bg-form-green text-white px-6 py-2 rounded-lg hover:bg-form-green/90 transition-colors font-inter"
                >
                  Go Back
                </button>
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
        <ProjectSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            {/* Project Hero Section */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-form-green font-dm-sans">{project.name}</h1>
              {project.description && (
                <p className="text-lg text-gray-600 font-inter">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 font-inter">
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                {project.project_type && (
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-form-green rounded-full" />
                    <span className="capitalize">{project.project_type.replace('_', ' ')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Project Statistics */}
            <div>
              <h2 className="text-xl font-semibold text-form-green font-dm-sans mb-4">Project Overview</h2>
              <ProjectStats projectId={projectId!} />
            </div>

            {/* Main Action Cards */}
            <div>
              <h2 className="text-xl font-semibold text-form-green font-dm-sans mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ProjectOverviewCard
                  title="Manage Team"
                  description="Add members, assign roles, and track team participation in the project"
                  icon={Users}
                  onClick={() => navigate(`/project/${projectId}/members`)}
                  badge="4 members"
                  count={4}
                />

                <ProjectOverviewCard
                  title="Documents Hub"
                  description="Upload, organize, and track completion of all project documents and forms"
                  icon={FileText}
                  onClick={() => navigate(`/project/${projectId}/documents`)}
                  progress={65}
                  count={12}
                />

                <ProjectOverviewCard
                  title="Project Analytics"
                  description="View detailed reports, progress tracking, and performance metrics"
                  icon={BarChart3}
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Analytics dashboard is under development.",
                    });
                  }}
                  badge="Beta"
                />
              </div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentActivity />
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-form-border p-6">
                  <h3 className="text-lg font-semibold text-form-green font-dm-sans mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg hover:bg-vibe-green-light transition-colors border border-form-border/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-form-green" />
                        <div>
                          <p className="font-medium text-form-green font-inter">Export Data</p>
                          <p className="text-xs text-gray-500 font-inter">Download project data</p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 rounded-lg hover:bg-vibe-green-light transition-colors border border-form-border/50">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-form-green" />
                        <div>
                          <p className="font-medium text-form-green font-inter">Generate Report</p>
                          <p className="text-xs text-gray-500 font-inter">Create progress report</p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-3 rounded-lg hover:bg-vibe-green-light transition-colors border border-form-border/50">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-form-green" />
                        <div>
                          <p className="font-medium text-form-green font-inter">Send Update</p>
                          <p className="text-xs text-gray-500 font-inter">Notify team members</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ProjectDashboard;
