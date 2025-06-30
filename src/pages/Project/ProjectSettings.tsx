import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProjectSidebar from '@/components/project/ProjectSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
type Project = Database['public']['Tables']['projects']['Row'];
const ProjectSettings = () => {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
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
        setFormData({
          name: projectData.name || '',
          description: projectData.description || ''
        });
      } catch (error) {
        console.error('Error loading project:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [user, authLoading, projectId, navigate]);
  const handleSave = async () => {
    if (!projectId || !project) return;
    try {
      setSaving(true);
      const {
        error: updateError
      } = await supabase.from('projects').update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        updated_at: new Date().toISOString()
      }).eq('id', projectId);
      if (updateError) {
        console.error('Error updating project:', updateError);
        toast({
          title: "Error",
          description: "Failed to update project settings. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setProject({
        ...project,
        name: formData.name.trim(),
        description: formData.description.trim() || null
      });
      toast({
        title: "Success",
        description: "Project settings updated successfully."
      });
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const hasChanges = () => {
    if (!project) return false;
    return formData.name.trim() !== (project.name || '') || formData.description.trim() !== (project.description || '');
  };
  if (authLoading || loading) {
    return <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background-light">
          <ProjectSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-lg text-form-green font-dm-sans">Caricamento impostazioni progetto...</div>
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
            {/* Project Settings */}
            <Card className="bg-white border-0 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-dm-sans text-black">
                  
                  Impostazioni Progetto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-form-green font-dm-sans">
                    Nome Progetto *
                  </label>
                  <Input value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} placeholder="Inserisci il nome del progetto" className="flex w-full rounded-[10px] border border-[hsl(var(--form-border))] bg-white px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium font-dm-sans placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--form-green))] focus-visible:ring-offset-2 focus-visible:border-[hsl(var(--form-green))] focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 solid-shadow-light" required />
                </div>

                {/* Project Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-form-green font-dm-sans">
                    Descrizione Progetto
                  </label>
                  <Textarea value={formData.description} onChange={e => setFormData({
                  ...formData,
                  description: e.target.value
                })} placeholder="Inserisci una descrizione del progetto (opzionale)" className="flex min-h-[100px] w-full rounded-[10px] border border-[hsl(var(--form-border))] bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--form-green))] focus-visible:ring-offset-2 focus-visible:border-[hsl(var(--form-green))] focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 solid-shadow-light resize-none font-dm-sans" rows={4} />
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={!hasChanges() || saving || !formData.name.trim()} className="gomutuo-button-primary flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default ProjectSettings;