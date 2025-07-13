
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calculator, Users } from 'lucide-react';
import BrokerageHeaderCard from '@/components/brokerage/BrokerageHeaderCard';
import BrokerageOverviewCard from '@/components/brokerage/BrokerageOverviewCard';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface BrokerageDashboardProps {
  brokerage: Brokerage;
  projects: Project[];
  onCreateProject: (projectData: any) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
}

const BrokerageDashboard = ({ 
  brokerage, 
  projects, 
  onCreateProject, 
  onDeleteProject, 
  onOpenProject 
}: BrokerageDashboardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigateToProjects = () => {
    navigate(`/brokerage/${brokerage.id}/projects`);
  };

  const handleNavigateToSimulations = () => {
    navigate(`/brokerage/${brokerage.id}/simulations`);
  };

  const handleNavigateToUsers = () => {
    navigate(`/brokerage/${brokerage.id}/users`);
  };

  // Calculate counts for badges
  const projectCount = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Enhanced Brokerage Header with Status */}
      <BrokerageHeaderCard 
        brokerageName={brokerage.name} 
        brokerageDescription={brokerage.description || undefined} 
        lastActivity="2h" 
        isActive={true} 
      />

      {/* Main Action Cards */}
      <div>
        <h2 className="font-semibold font-dm-sans mb-6 text-2xl text-black">Azioni Principali</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BrokerageOverviewCard
            title="Progetti"
            description="Visualizza e gestisci tutti i progetti della tua agenzia"
            icon={FileText}
            onClick={handleNavigateToProjects}
            badge={`${projectCount} progetti`}
          />
          
          <BrokerageOverviewCard
            title="Simulazioni"
            description="Crea e gestisci simulazioni per i tuoi clienti potenziali"
            icon={Calculator}
            onClick={handleNavigateToSimulations}
            badge="0 simulazioni"
          />
          
          <BrokerageOverviewCard
            title="Gestione Utenti"
            description="Aggiungi membri, assegna ruoli e monitora la partecipazione del team"
            icon={Users}
            onClick={handleNavigateToUsers}
            count={1}
          />
        </div>
      </div>
    </div>
  );
};

export default BrokerageDashboard;
