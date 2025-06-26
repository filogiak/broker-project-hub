import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectMetrics from '@/components/project/ProjectMetrics';
import ActionCard from '@/components/project/ActionCard';
import { Users, FileText, BarChart3 } from 'lucide-react';
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

  const handleBackToBrokerage = () => {
    if (project?.brokerage_id) {
      navigate(`/brokerage/${project.brokerage_id}`);
    } else {
      navigate(-1);
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout title="Loading..." userEmail={user?.email || ''} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading project dashboard...</div>
        </div>
      </MainLayout>
    );
  }

  if (error || !project) {
    return (
      <MainLayout title="Project Dashboard" userEmail={user?.email || ''} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-destructive">
              {error ? 'Project Access Issue' : 'Project Not Found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || "The project you're looking for doesn't exist or you don't have permission to access it."}
            </p>
            <button 
              onClick={() => navigate(-1)} 
              className="gomutuo-button-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      {/* Project Header */}
      <ProjectHeader 
        project={project}
        onBackToBrokerage={handleBackToBrokerage}
      />

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Metrics Overview */}
        <div>
          <h2 className="text-xl font-semibold text-form-green font-dm-sans mb-4">Overview</h2>
          <ProjectMetrics projectId={projectId!} />
        </div>

        {/* Action Cards */}
        <div>
          <h2 className="text-xl font-semibold text-form-green font-dm-sans mb-4">Manage Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              title="Project Members"
              description="View and manage project team members, assign roles, and track participation"
              icon={Users}
              href={`/project/${projectId}/members`}
              onClick={() => navigate(`/project/${projectId}/members`)}
              status="in-progress"
              count={4}
              color="green"
            />

            <ActionCard
              title="Documents & Forms"
              description="Manage project documents, forms, and track completion status"
              icon={FileText}
              href={`/project/${projectId}/documents`}
              onClick={() => navigate(`/project/${projectId}/documents`)}
              status="in-progress"
              progress={65}
              color="blue"
            />

            <ActionCard
              title="Analytics & Reports"
              description="View project analytics, progress reports, and performance metrics"
              icon={BarChart3}
              href="#"
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Analytics dashboard is under development.",
                });
              }}
              status="pending"
              color="purple"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-form-border p-6">
          <h3 className="text-lg font-semibold text-form-green font-dm-sans mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button className="gomutuo-button-secondary text-sm">
              Export Data
            </button>
            <button className="gomutuo-button-secondary text-sm">
              Generate Report
            </button>
            <button className="gomutuo-button-secondary text-sm">
              Send Reminder
            </button>
            <button className="gomutuo-button-secondary text-sm">
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
