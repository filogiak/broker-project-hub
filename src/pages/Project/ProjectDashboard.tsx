import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import ProjectHeaderCard from '@/components/project/ProjectHeaderCard';
import ProjectOverviewCard from '@/components/project/ProjectOverviewCard';
import { Users, FileText, BarChart3, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

const ProjectDashboard = () => {
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

  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background-light">
        <ProjectSidebar />
        <SidebarInset>
          <div className="flex-1 p-8 space-y-8">
            {/* Enhanced Project Header with Status */}
            <ProjectHeaderCard 
              projectName={project.name} 
              projectDescription={project.description || undefined} 
              lastActivity="2h" 
              isActive={true} 
            />

            {/* Main Action Cards */}
            <div>
              <h2 className="font-semibold font-dm-sans mb-6 text-2xl text-black">Azioni Principali</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ProjectOverviewCard title="Gestione Team" description="Aggiungi membri, assegna ruoli e monitora la partecipazione del team al progetto" icon={Users} onClick={() => navigate(`/project/${projectId}/members`)} badge="4 membri" count={4} />

                <ProjectOverviewCard title="Hub Documenti" description="Carica, organizza e monitora il completamento di tutti i documenti e moduli del progetto" icon={FileText} onClick={() => navigate(`/project/${projectId}/documents`)} progress={65} count={12} />

                <ProjectOverviewCard title="Analytics Progetto" description="Visualizza report dettagliati, monitoraggio progressi e metriche di performance" icon={BarChart3} onClick={() => {
                toast({
                  title: "Prossimamente",
                  description: "La dashboard analytics è in fase di sviluppo."
                });
              }} badge="Beta" />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};

export default ProjectDashboard;
