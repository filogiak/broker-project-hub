
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { getBrokerageInvitations } from '@/services/brokerageService';
import { useToast } from '@/hooks/use-toast';
import BrokerageInvitationCard from './BrokerageInvitationCard';
import BrokerageAddMemberModal from './BrokerageAddMemberModal';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface BrokerageInvitation {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  email_sent: boolean;
  inviter_name: string;
  days_remaining: number;
  status: 'pending' | 'accepted' | 'expired' | 'email_failed';
  timeRemaining?: string;
}

interface BrokerageInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerageId: string;
}

const BrokerageInvitationsModal: React.FC<BrokerageInvitationsModalProps> = ({
  isOpen,
  onClose,
  brokerageId
}) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<BrokerageInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const brokerageInvitations = await getBrokerageInvitations(brokerageId);
      
      const formattedInvitations = brokerageInvitations.map(inv => {
        const now = new Date();
        const expiresAt = new Date(inv.expires_at);
        const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        let status: 'pending' | 'accepted' | 'expired' | 'email_failed' = 'pending';
        if (inv.accepted_at) {
          status = 'accepted';
        } else if (daysRemaining === 0) {
          status = 'expired';
        } else if (!inv.email_sent) {
          status = 'email_failed';
        }

        let timeRemaining = '';
        if (status === 'pending') {
          if (daysRemaining === 0) {
            timeRemaining = 'Scade oggi';
          } else if (daysRemaining === 1) {
            timeRemaining = '1 giorno';
          } else {
            timeRemaining = `${daysRemaining} giorni`;
          }
        }

        return {
          id: inv.id,
          email: inv.email,
          role: inv.role,
          created_at: inv.created_at,
          expires_at: inv.expires_at,
          accepted_at: inv.accepted_at,
          email_sent: inv.email_sent || false,
          inviter_name: inv.inviter_name,
          days_remaining: daysRemaining,
          status,
          timeRemaining
        };
      });

      setInvitations(formattedInvitations);
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
    if (isOpen && brokerageId) {
      loadInvitations();
    }
  }, [isOpen, brokerageId]);

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
                  Inviti dell'Organizzazione
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
              <div className="flex items-center justify-center py-8">
                <div className="text-lg text-form-green font-dm-sans">Caricamento inviti...</div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4 font-dm-sans">
                  Nessun invito trovato per questa organizzazione.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map(invitation => (
                  <BrokerageInvitationCard 
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

      <BrokerageAddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        brokerageId={brokerageId} 
        onMemberAdded={handleMemberAdded} 
      />
    </>
  );
};

export default BrokerageInvitationsModal;
