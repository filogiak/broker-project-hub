
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectMember = Database['public']['Tables']['project_members']['Row'] & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
};

const ProjectMembersDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjectData = async () => {
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

        // Load project details
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

        // Load project members with profile information
        const { data: membersData, error: membersError } = await supabase
          .from('project_members')
          .select(`
            *,
            profiles:user_id (
              first_name,
              last_name,
              email
            )
          `)
          .eq('project_id', projectId)
          .order('joined_at', { ascending: false });

        if (membersError) {
          console.error('Error loading project members:', membersError);
          setError('Failed to load project members');
          return;
        }

        setMembers(membersData || []);

      } catch (error) {
        console.error('Error loading project data:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
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

  const formatUserName = (member: ProjectMember) => {
    const profile = member.profiles;
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not joined yet';
    return new Date(dateString).toLocaleDateString();
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
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Go Back
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={`${project.name} - Project Dashboard`}
      userEmail={user?.email || ''} 
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">{project.name}</h1>
            <p className="text-muted-foreground mt-1">
              {project.description || 'Project dashboard showing active members'}
            </p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Back
          </button>
        </div>

        {/* Project Members */}
        <Card className="card-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active Project Members
              <span className="text-sm font-normal text-muted-foreground">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No project members found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {formatUserName(member)}
                      </TableCell>
                      <TableCell>{member.profiles.email}</TableCell>
                      <TableCell>{formatRole(member.role)}</TableCell>
                      <TableCell>{formatDate(member.joined_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectMembersDashboard;
