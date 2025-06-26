import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddMemberModal from '@/components/project/AddMemberModal';
import ProjectInvitationsSection from '@/components/project/ProjectInvitationsSection';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectMember = Database['public']['Tables']['project_members']['Row'] & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
};

const ProjectMembersDashboard = () => {
  const {
    projectId
  } = useParams();
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const {
    toast
  } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
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
        const {
          data: projectData,
          error: projectError
        } = await supabase.from('projects').select('*').eq('id', projectId).single();
        if (projectError) {
          console.error('Error loading project:', projectError);
          setError('Failed to load project details');
          return;
        }
        setProject(projectData);
        const {
          data: membersData,
          error: membersError
        } = await supabase.from('project_members').select(`
            *,
            profiles!project_members_user_id_fkey (
              first_name,
              last_name,
              email
            )
          `).eq('project_id', projectId).order('joined_at', {
          ascending: false
        });
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
  const loadMembers = async () => {
    if (!projectId) return;
    try {
      const {
        data: membersData,
        error: membersError
      } = await supabase.from('project_members').select(`
          *,
          profiles!project_members_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `).eq('project_id', projectId).order('joined_at', {
        ascending: false
      });
      if (membersError) {
        console.error('Error loading project members:', membersError);
        return;
      }
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };
  useEffect(() => {
    if (project) {
      loadMembers();
    }
  }, [project, projectId]);
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout properly. Please try again.",
        variant: "destructive"
      });
    }
  };
  const formatUserName = (member: ProjectMember) => {
    const profile = member.profiles;
    if (!profile) return 'Utente Sconosciuto';
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };
  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const formatParticipantDesignation = (designation: string | null) => {
    if (!designation) return 'Non assegnato';
    return designation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const formatApplicantCount = (count: string | null) => {
    if (!count) return 'Non impostato';
    return count.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non ancora entrato';
    return new Date(dateString).toLocaleDateString('it-IT');
  };
  const handleMemberAdded = () => {
    loadMembers();
    setIsAddMemberModalOpen(false);
  };
  if (authLoading || loading) {
    return <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-lg text-form-green font-dm-sans">Caricamento dashboard membri...</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>;
  }
  if (error || !project) {
    return <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive font-dm-sans">
                  {error ? 'Problema di Accesso al Progetto' : 'Progetto Non Trovato'}
                </h2>
                <p className="text-muted-foreground mb-4 font-dm-sans">
                  {error || "Il progetto che stai cercando non esiste o non hai i permessi per accedervi."}
                </p>
                <Button onClick={() => navigate(-1)} variant="outline" className="font-dm-sans">
                  Torna Indietro
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>;
  }
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <ProjectSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            {/* Project Members */}
            <Card className="bg-white border-0 shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center justify-between font-dm-sans text-black">
                    Membri Attivi del Progetto
                    <span className="text-sm font-normal text-muted-foreground ml-4">
                      {members.length} {members.length === 1 ? 'membro' : 'membri'}
                    </span>
                  </CardTitle>
                  <Button onClick={() => setIsAddMemberModalOpen(true)} className="gomutuo-button-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Aggiungi Membro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4 font-dm-sans">Nessun membro del progetto trovato.</p>
                    <Button onClick={() => setIsAddMemberModalOpen(true)} className="gomutuo-button-primary flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Aggiungi Primo Membro
                    </Button>
                  </div> : <div className="space-y-4">
                    {members.map(member => <Card key={member.id} className="cursor-pointer bg-white border-2 border-form-green rounded-[12px] press-down-effect relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-form-green"></div>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                              <User className="h-9 w-9 text-form-green" />
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                              <div>
                                <h3 className="font-semibold text-black font-dm-sans text-lg mb-1">
                                  {formatUserName(member)}
                                </h3>
                                <p className="text-sm text-gray-600 font-dm-sans">
                                  {member.profiles?.email || 'Sconosciuto'}
                                </p>
                              </div>

                              <div className="text-left">
                                <p className="text-xs text-gray-500 mb-1">Ruolo</p>
                                <p className="font-medium text-form-green text-sm">{formatRole(member.role)}</p>
                              </div>

                              <div className="text-left">
                                <p className="text-xs text-gray-500 mb-1">Tipo Partecipante</p>
                                <p className="font-medium text-form-green text-sm">{formatParticipantDesignation(member.participant_designation)}</p>
                              </div>

                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Data Ingresso</p>
                                <p className="font-medium text-form-green text-sm">{formatDate(member.joined_at)}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div>}

                {/* Project Invitations Section - inside the members card */}
                {projectId && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <ProjectInvitationsSection projectId={projectId} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Member Modal */}
            <AddMemberModal isOpen={isAddMemberModalOpen} onClose={() => setIsAddMemberModalOpen(false)} projectId={projectId!} onMemberAdded={handleMemberAdded} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};

export default ProjectMembersDashboard;
