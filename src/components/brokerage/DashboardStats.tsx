
import React, { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProjectsSection from './ProjectsSection';
import { simulationService } from '@/services/simulationService';
import { getUserProjectStats } from '@/services/projectService';
import { createProject, deleteProject } from '@/services/projectService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type Simulation = Database['public']['Tables']['simulations']['Row'];

interface DashboardStatsProps {
  brokerageId: string;
  projects: Project[];
}

const DashboardStats = ({ brokerageId, projects }: DashboardStatsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    recentProjects: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Load simulations
        const simulationsData = await simulationService.getBrokerageSimulations(brokerageId);
        setSimulations(simulationsData);

        // Load user project stats
        const stats = await getUserProjectStats(user.id);
        setUserStats(stats);

      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [brokerageId, user?.id, toast]);

  const handleCreateProject = async (projectData: any) => {
    try {
      const newProject = await createProject({
        name: projectData.name,
        description: projectData.description,
        brokerage_id: brokerageId,
        project_type: projectData.projectType,
        applicant_count: projectData.applicantCount,
        has_guarantor: projectData.hasGuarantor,
        applicant_one_first_name: projectData.applicantOneFirstName,
        applicant_one_last_name: projectData.applicantOneLastName,
        applicant_two_first_name: projectData.applicantTwoFirstName,
        applicant_two_last_name: projectData.applicantTwoLastName,
        created_by: user?.id || '',
      });

      toast({
        title: "Project Created",
        description: `${projectData.name} has been created successfully.`,
      });

      // Refresh stats
      if (user?.id) {
        const stats = await getUserProjectStats(user.id);
        setUserStats(stats);
      }

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
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully.",
      });

      // Refresh stats
      if (user?.id) {
        const stats = await getUserProjectStats(user.id);
        setUserStats(stats);
      }

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
    window.location.href = `/project/${projectId}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="gomutuo-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-dm-sans text-form-green">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-dm-sans text-form-green">{projects.length}</div>
          </CardContent>
        </Card>

        <Card className="gomutuo-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-dm-sans text-form-green">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-dm-sans text-form-green">
              {projects.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card className="gomutuo-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-dm-sans text-form-green">Simulations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-dm-sans text-form-green">{simulations.length}</div>
          </CardContent>
        </Card>

        <Card className="gomutuo-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-dm-sans text-form-green">My Projects</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-dm-sans text-form-green">{userStats.totalProjects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <ProjectsSection
        projects={projects}
        brokerageId={brokerageId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onOpenProject={handleOpenProject}
      />
    </div>
  );
};

export default DashboardStats;
