import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { Card, CardContent } from '@/components/ui/card';
import { MailOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PendingInvitationCard from '@/components/broker/PendingInvitationCard';

const BrokerAssistantInvitations = () => {
  const { user } = useAuth();
  const { invitations, loading: isLoading, acceptInvitation } = usePendingInvitations();
  const { toast } = useToast();

  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setAcceptingId(invitationId);
      const result = await acceptInvitation(invitationId);
      
      if (result.success) {
        toast({
          title: "Invito accettato",
          description: result.duplicate_membership 
            ? result.message 
            : "Hai accettato con successo l'invito.",
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nell'accettare l'invito.",
        variant: "destructive",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg font-dm-sans">Caricamento inviti...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8">
      <div>
        <h2 className="font-semibold font-dm-sans mb-6 text-2xl text-black">Tutti i Tuoi Inviti</h2>
        <p className="text-muted-foreground font-dm-sans mb-6">
          Tutti gli inviti in sospeso per progetti e organizzazioni
        </p>
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {invitations.length === 0 ? (
          <Card className="bg-white border-2 border-form-green/20 rounded-[12px]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MailOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 font-dm-sans">Nessun invito in sospeso</h3>
              <p className="text-muted-foreground text-center max-w-md font-dm-sans">
                Al momento non hai inviti in sospeso. Quando riceverai nuovi inviti, verranno visualizzati qui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <PendingInvitationCard
                key={invitation.id}
                invitation={invitation}
                onAccept={handleAcceptInvitation}
                isAccepting={acceptingId === invitation.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerAssistantInvitations;