
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { getProjectInvitations, InvitationWithStatus } from '@/services/projectInvitationService';
import { useToast } from '@/hooks/use-toast';
import { PageLoader } from '@/components/ui/page-loader';
import InvitationCard from './InvitationCard';
import AddMemberModal from './AddMemberModal';

interface ProjectInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const ProjectInvitationsModal: React.FC<ProjectInvitationsModalProps> = ({
  isOpen,
  onClose,
  projectId
}) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<InvitationWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const projectInvitations = await getProjectInvitations(projectId);
      setInvitations(projectInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli inviti. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      loadInvitations();
    }
  }, [isOpen, projectId]);

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
                <DialogTitle className="font-dm-sans text-black text-xl">
                  Inviti del Progetto
                </DialogTitle>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>Totale: {summary.total}</span>
                  <span className="text-yellow-600">In Attesa: {summary.pending}</span>
                  <span className="text-green-600">Accettati: {summary.accepted}</span>
                  {summary.expired > 0 && <span className="text-red-600">Scaduti: {summary.expired}</span>}
                  {summary.failed > 0 && <span className="text-orange-600">Falliti: {summary.failed}</span>}
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
                  Aggiorna
                </Button>
                <Button 
                  onClick={() => setIsAddMemberModalOpen(true)} 
                  className="gomutuo-button-primary flex items-center gap-2" 
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Nuovo Invito
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <PageLoader message="Caricamento inviti..." size="medium" />
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4 font-dm-sans">
                  Nessun invito trovato per questo progetto.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map(invitation => (
                  <InvitationCard 
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

      <AddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        projectId={projectId} 
        onMemberAdded={handleMemberAdded} 
      />
    </>
  );
};

export default ProjectInvitationsModal;
