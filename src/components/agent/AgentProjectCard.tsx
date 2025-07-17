import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Briefcase, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AgentProject } from '@/services/agentDataService';

interface AgentProjectCardProps {
  project: AgentProject;
}

const AgentProjectCard = ({ project }: AgentProjectCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Attivo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completato</Badge>;
      case 'draft':
        return <Badge variant="secondary">Bozza</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md border-border hover:border-primary/20"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        {/* Top section with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          
          {getStatusBadge(project.status)}
        </div>

        {/* Content section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-lg">{project.name}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.description || 'Clicca per accedere al progetto'}
            </p>
          </div>

          {/* Project info section */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Ruolo: {project.member_role === 'real_estate_agent' ? 'Agente Immobiliare' : project.member_role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Creato il {formatDate(project.created_at)}
              </span>
            </div>
          </div>

          {/* Bottom section with arrow */}
          <div className="flex justify-end pt-2 border-t border-border">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentProjectCard;