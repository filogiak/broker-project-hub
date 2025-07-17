
import React from 'react';
import { RealEstateAgentLayout } from '@/components/agent/RealEstateAgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Plus } from 'lucide-react';
import { useAgentData } from '@/hooks/useAgentData';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import AgentProjectCard from '@/components/agent/AgentProjectCard';

const AgentProjects = () => {
  const { projects, loading, error, refreshProjects, hasData } = useAgentData();

  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <RealEstateAgentLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Progetti</h2>
          <Button 
            onClick={refreshProjects}
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
        
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-destructive">
                <Briefcase className="h-5 w-5" />
                <span>Errore nel caricamento dei progetti: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : projects.length > 0 ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  I tuoi Progetti ({projects.length})
                </CardTitle>
                <CardDescription>
                  Tutti i progetti a cui hai accesso attraverso le tue organizzazioni o inviti diretti
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <AgentProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                I tuoi Progetti
              </CardTitle>
              <CardDescription>
                Tutti i progetti a cui hai accesso attraverso le tue organizzazioni o inviti diretti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nessun progetto trovato</h3>
                <p className="text-muted-foreground">
                  Non hai ancora accesso a nessun progetto. I progetti appariranno qui quando sarai invitato o quando farai parte di una brokerage.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RealEstateAgentLayout>
  );
};

export default AgentProjects;
