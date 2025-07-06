
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, User, Building2, CheckCircle, RefreshCw, AlertCircle, Bug } from 'lucide-react';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const PendingInvitationsWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { invitations, loading, error, acceptInvitation, forceRefresh } = usePendingInvitations();
  const { toast } = useToast();

  const handleAcceptInvitation = async (invitationId: string, projectName: string | null, projectId: string | null, brokerageId?: string | null) => {
    try {
      const result = await acceptInvitation(invitationId);
      
      if (result.success) {
        const entityName = projectName || (brokerageId ? 'l\'agenzia' : 'l\'invito');
        toast({
          title: "Invito Accettato",
          description: result.duplicate_membership 
            ? result.message 
            : `Ti sei unito con successo a ${entityName}`,
          variant: "default",
        });

        // Redirect based on invitation type
        if (!result.duplicate_membership) {
          if (projectId) {
            setTimeout(() => {
              navigate(`/project/${projectId}`);
            }, 2000);
          } else if (brokerageId) {
            setTimeout(() => {
              navigate(`/brokerage/${brokerageId}`);
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile accettare l'invito",
        variant: "destructive",
      });
    }
  };

  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing invitations from widget');
    forceRefresh();
  };

  const handleDebugInfo = () => {
    console.log('🐛 [DEBUG] Current state:', {
      user: user ? {
        id: user.id,
        email: user.email,
        roles: user.roles
      } : null,
      invitations: invitations,
      loading,
      error,
      invitationCount: invitations.length
    });
    
    toast({
      title: "Debug Info",
      description: `User: ${user?.email || 'None'}, Invitations: ${invitations.length}, Loading: ${loading}, Error: ${error || 'None'}`,
      variant: "default",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviti in Sospeso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-form-green mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Caricamento inviti...</p>
            <p className="text-xs text-muted-foreground mt-1">
              User: {user?.email || 'Loading...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviti in Sospeso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleForceRefresh}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Riprova
              </Button>
              <Button
                onClick={handleDebugInfo}
                size="sm"
                variant="ghost"
                className="flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Debug
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviti in Sospeso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nessun invito in sospeso</p>
            <p className="text-xs text-muted-foreground mt-1">
              User: {user?.email || 'Unknown'}
            </p>
            <div className="flex gap-2 justify-center mt-2">
              <Button
                onClick={handleForceRefresh}
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Controlla Aggiornamenti
              </Button>
              <Button
                onClick={handleDebugInfo}
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <Bug className="h-3 w-3 mr-1" />
                Debug Info
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Inviti in Sospeso
          <Badge variant="secondary">{invitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {invitation.project_name || 'Invito al Progetto'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Ruolo: {invitation.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {invitation.days_remaining > 0 
                      ? `Scade tra ${Math.ceil(invitation.days_remaining)} giorni`
                      : 'Scade presto'
                    }
                  </span>
                </div>
              </div>
              
               <Button
                 onClick={() => handleAcceptInvitation(invitation.id, invitation.project_name, invitation.project_id, invitation.brokerage_id)}
                 size="sm"
                 className="gomutuo-button-primary"
               >
                 Accetta
               </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Invitato da {invitation.inviter_name}
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleForceRefresh}
              size="sm"
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Aggiorna Inviti
            </Button>
            <Button
              onClick={handleDebugInfo}
              size="sm"
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Bug className="h-4 w-4" />
              Debug
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsWidget;
