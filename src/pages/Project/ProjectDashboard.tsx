import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import ProjectHeaderCard from '@/components/project/ProjectHeaderCard';
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
        <div className="min-h-screen flex w-full bg-background-light">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-lg text-form-green font-dm-sans">Caricamento dashboard progetto...</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !project) {
    return (
      <SidebarProvider>
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
                <button 
                  onClick={() => navigate(-1)} 
                  className="gomutuo-button-primary font-dm-sans"
                >
                  Torna Indietro
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
            {/* Enhanced Project Header with Status */}
            <ProjectHeaderCard
              projectName={project.name}
              projectDescription={project.description || undefined}
              membersCount={4}
              progressPercentage={65}
              lastActivity="2h"
              isActive={true}
            />

            {/* Main Action Cards */}
            <div>
              <h2 className="text-xl font-semibold text-form-green font-dm-sans mb-6">Azioni Principali</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ProjectOverviewCard
                  title="Gestione Team"
                  description="Aggiungi membri, assegna ruoli e monitora la partecipazione del team al progetto"
                  icon={Users}
                  onClick={() => navigate(`/project/${projectId}/members`)}
                  badge="4 membri"
                  count={4}
                />

                <ProjectOverviewCard
                  title="Hub Documenti"
                  description="Carica, organizza e monitora il completamento di tutti i documenti e moduli del progetto"
                  icon={FileText}
                  onClick={() => navigate(`/project/${projectId}/documents`)}
                  progress={65}
                  count={12}
                />

                <ProjectOverviewCard
                  title="Analytics Progetto"
                  description="Visualizza report dettagliati, monitoraggio progressi e metriche di performance"
                  icon={BarChart3}
                  onClick={() => {
                    toast({
                      title: "Prossimamente",
                      description: "La dashboard analytics è in fase di sviluppo.",
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
                <div className="bg-white rounded-[12px] border border-form-border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-form-green font-dm-sans mb-4">Azioni Rapide</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-4 rounded-[10px] hover:bg-vibe-green-light transition-colors border border-form-border/50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-form-green" />
                        <div>
                          <p className="font-medium text-form-green font-dm-sans">Esporta Dati</p>
                          <p className="text-xs text-gray-500 font-dm-sans">Scarica dati del progetto</p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-4 rounded-[10px] hover:bg-vibe-green-light transition-colors border border-form-border/50">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-form-green" />
                        <div>
                          <p className="font-medium text-form-green font-dm-sans">Genera Report</p>
                          <p className="text-xs text-gray-500 font-dm-sans">Crea report di avanzamento</p>
                        </div>
                      </div>
                    </button>
                    
                    <button className="w-full text-left p-4 rounded-[10px] hover:bg-vibe-green-light transition-colors border border-form-border/50">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-form-green" />
                        <div>
                          <p className="font-medium text-form-green font-dm-sans">Invia Aggiornamento</p>
                          <p className="text-xs text-gray-500 font-dm-sans">Notifica membri del team</p>
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
