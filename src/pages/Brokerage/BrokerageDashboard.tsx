
import React from 'react';
import BrokerageHeaderCard from '@/components/brokerage/BrokerageHeaderCard';
import DashboardStats from '@/components/brokerage/DashboardStats';
import PendingInvitationsWidget from '@/components/dashboard/PendingInvitationsWidget';
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
        <DashboardStats brokerageId={brokerage.id} projects={projects} />
      </div>

      {/* Pending Invitations Widget */}
      <div>
        <h2 className="font-semibold font-dm-sans mb-6 text-2xl text-black">I Tuoi Inviti</h2>
        <PendingInvitationsWidget />
      </div>
    </div>
  );
};

export default BrokerageDashboard;
