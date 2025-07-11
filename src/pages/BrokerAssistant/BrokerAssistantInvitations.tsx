import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MailOpen, Calendar, User, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RoleSelector from '@/components/dashboard/RoleSelector';

const BrokerAssistantInvitations = () => {
  const { user } = useAuth();
  const { isMultiRole } = useRoleSelection();
  const { invitations, loading: isLoading, acceptInvitation } = usePendingInvitations();
  const { toast } = useToast();

  // Filter invitations relevant to broker assistants
  const relevantInvitations = invitations?.filter(invitation => 
    invitation.role === 'broker_assistant' || 
    invitation.role === 'simulation_collaborator'
  ) || [];

  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setAcceptingId(invitationId);
      await acceptInvitation(invitationId);
      toast({
        title: "Invito accettato",
        description: "Hai accettato con successo l'invito.",
      });
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
      <div className="space-y-6">
        {isMultiRole && <RoleSelector />}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Caricamento inviti...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Selector for multi-role users */}
      {isMultiRole && <RoleSelector />}

      <div className="flex items-center gap-3">
        <MailOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Inviti</h1>
          <p className="text-muted-foreground">
            Inviti in sospeso per organizzazioni e simulazioni
          </p>
        </div>
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {relevantInvitations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MailOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun invito in sospeso</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Al momento non hai inviti in sospeso per organizzazioni o simulazioni.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {relevantInvitations.map((invitation) => (
              <Card key={invitation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {invitation.brokerage_id ? (
                          <Building className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                        Invito {invitation.brokerage_id ? 'Organizzazione' : 'Progetto'}
                      </CardTitle>
                      <CardDescription>
                        {invitation.project_name || 'Invito per organizzazione'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {invitation.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Invitato da: {invitation.inviter_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Scade tra {invitation.days_remaining} giorni
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      disabled={acceptingId === invitation.id}
                      className="flex-1"
                    >
                      {acceptingId === invitation.id ? 'Accettando...' : 'Accetta Invito'}
                    </Button>
                    
                    <Button variant="outline" className="flex-1">
                      Rifiuta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerAssistantInvitations;