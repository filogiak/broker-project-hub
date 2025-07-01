
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, User, Building2, CheckCircle, XCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { useSentInvitations } from '@/hooks/useSentInvitations';
import { useToast } from '@/hooks/use-toast';
import { resendInvitation } from '@/services/projectInvitationService';

const InvitationsSentWidget = () => {
  const { invitations, loading, error, loadInvitations } = useSentInvitations();
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'email_failed':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      case 'email_failed':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accettato';
      case 'pending':
        return 'In Attesa';
      case 'expired':
        return 'Scaduto';
      case 'email_failed':
        return 'Email Fallita';
      default:
        return 'Sconosciuto';
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      await resendInvitation(invitationId);
      toast({
        title: "Invito Reinviato",
        description: `L'invito è stato reinviato a ${email}`,
      });
      loadInvitations(); // Refresh the list
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile reinviare l'invito. Riprova più tardi.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviti Inviati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-form-green mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Caricamento inviti...</p>
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
            Inviti Inviati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
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
            Inviti Inviati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nessun invito inviato</p>
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
          Inviti Inviati
          <Badge variant="secondary">{invitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.slice(0, 5).map((invitation) => (
          <div key={invitation.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{invitation.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Ruolo: {invitation.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                {invitation.project_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>{invitation.project_name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                  {getStatusIcon(invitation.status)}
                  {getStatusText(invitation.status)}
                </div>
                
                {(invitation.status === 'pending' || invitation.status === 'email_failed') && (
                  <Button
                    onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reinvia
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {invitation.status === 'pending' && invitation.days_remaining > 0 
                  ? `Scade in ${Math.ceil(invitation.days_remaining)} giorni`
                  : `Inviato il ${new Date(invitation.created_at).toLocaleDateString('it-IT')}`
                }
              </span>
            </div>
          </div>
        ))}
        
        {invitations.length > 5 && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              E altri {invitations.length - 5} inviti...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitationsSentWidget;
