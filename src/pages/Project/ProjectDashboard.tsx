
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import ProjectHeaderCard from '@/components/project/ProjectHeaderCard';
import ProjectOverviewCard from '@/components/project/ProjectOverviewCard';
import { Users, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getApplicantDisplayNames } from '@/utils/applicantHelpers';
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
  const [memberCount, setMemberCount] = useState<number>(0);
  const [documentProgress, setDocumentProgress] = useState<number>(0);
  
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
        
        // Load project data
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
        
        // Load project members count
        const { data: membersData, error: membersError } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId);
          
        if (!membersError && membersData) {
          setMemberCount(membersData.length);
        }
        
        // Load document progress - fix the status comparison
        const { data: checklistData, error: checklistError } = await supabase
          .from('project_checklist_items')
          .select('status')
          .eq('project_id', projectId);
          
        if (!checklistError && checklistData) {
          const totalItems = checklistData.length;
          const completedItems = checklistData.filter(item => item.status === 'approved').length;
          const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          setDocumentProgress(progress);
        }
        
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
        variant: "destructive"
      });
    }
  };

  if (authLoading || loading) {
    return <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-lg text-form-green font-dm-sans">Caricamento dashboard progetto...</div>
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
                <button onClick={() => navigate(-1)} className="gomutuo-button-primary font-dm-sans">
                  Torna Indietro
                </button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>;
  }

  // Get applicant names for the header - Banner format: Project name as title, applicant names as subtitle
  const { primaryApplicant, secondaryApplicant } = getApplicantDisplayNames(project);
  let applicantNames = primaryApplicant;
  if (secondaryApplicant && project.applicant_count !== 'one_applicant') {
    applicantNames = `${primaryApplicant} & ${secondaryApplicant}`;
  }

  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <ProjectSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            {/* Enhanced Project Header - Banner format: Project name as title, applicant names as subtitle */}
            <ProjectHeaderCard 
              applicantNames={project.name}
              projectName={applicantNames}
              lastActivity="2h" 
              isActive={true} 
            />

            {/* Main Action Cards */}
            <div>
              <h2 className="font-semibold font-dm-sans mb-6 text-2xl text-black">Azioni Principali</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProjectOverviewCard 
                  title="Gestione Team" 
                  description="Aggiungi membri, assegna ruoli e monitora la partecipazione del team al progetto" 
                  icon={Users} 
                  onClick={() => navigate(`/project/${projectId}/members`)} 
                  badge={`${memberCount} membri`} 
                  count={memberCount}
                />

                <ProjectOverviewCard 
                  title="Dati e Documenti" 
                  description="Carica, organizza e monitora il completamento di tutti i documenti e moduli del progetto" 
                  icon={FileText} 
                  onClick={() => navigate(`/project/${projectId}/documents`)} 
                  progress={documentProgress}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};

export default ProjectDashboard;
