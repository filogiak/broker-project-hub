import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { getSimulationInvitations, SimulationInvitationWithStatus } from '@/services/simulationInvitationService';
import { useToast } from '@/hooks/use-toast';
import SimulationInvitationCard from './SimulationInvitationCard';
import SimulationInvitationModal from './SimulationInvitationModal';

interface SimulationInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
}

const SimulationInvitationsModal: React.FC<SimulationInvitationsModalProps> = ({
  isOpen,
  onClose,
  simulationId
}) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<SimulationInvitationWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const simulationInvitations = await getSimulationInvitations(simulationId);
      setInvitations(simulationInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: "Error",
        description: "Unable to load invitations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && simulationId) {
      loadInvitations();
    }
  }, [isOpen, simulationId]);

  const handleMemberAdded = () => {
    setIsAddMemberModalOpen(false);
    loadInvitations(); // Refresh invitations list
  };

  const getInvitationsSummary = () => {
    const pending = invitations.filter(inv => inv.status === 'pending').length;
    const accepted = invitations.filter(inv => inv.status === 'accepted').length;
    const expired = invitations.filter(inv => inv.status === 'expired').length;
    const failed = invitations.filter(inv => inv.status === 'email_failed').length;

    return {
      pending,
      accepted,
      expired,
      failed,
      total: invitations.length
    };
  };

  const summary = getInvitationsSummary();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  Simulation Invitations
                </DialogTitle>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Total: {summary.total}</span>
                  <span className="text-yellow-600">Pending: {summary.pending}</span>
                  <span className="text-green-600">Accepted: {summary.accepted}</span>
                  {summary.expired > 0 && <span className="text-red-600">Expired: {summary.expired}</span>}
                  {summary.failed > 0 && <span className="text-orange-600">Failed: {summary.failed}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={loadInvitations} 
                  disabled={loading} 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  onClick={() => setIsAddMemberModalOpen(true)} 
                  className="flex items-center gap-2" 
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  New Invitation
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-lg">Loading invitations...</div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No invitations found for this simulation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map(invitation => (
                  <SimulationInvitationCard 
                    key={invitation.id} 
                    invitation={invitation} 
                    onInvitationUpdated={loadInvitations} 
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SimulationInvitationModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        simulationId={simulationId} 
        onMemberAdded={handleMemberAdded} 
      />
    </>
  );
};

export default SimulationInvitationsModal;