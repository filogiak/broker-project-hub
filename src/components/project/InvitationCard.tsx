
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RotateCcw, X, Clock, Check, AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';
import { InvitationWithStatus, getInvitationStatusColor, getInvitationStatusText, resendInvitation, cancelInvitation, deleteInvitation } from '@/services/projectInvitationService';
import { useToast } from '@/hooks/use-toast';

interface InvitationCardProps {
  invitation: InvitationWithStatus;
  onInvitationUpdated: () => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({ invitation, onInvitationUpdated }) => {
  const { toast } = useToast();
  const [isResending, setIsResending] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      case 'email_failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non disponibile';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendInvitation(invitation.id);
      toast({
        title: "Invito Reinviato",
        description: `L'invito è stato reinviato a ${invitation.email}`,
      });
      onInvitationUpdated();
    } catch (error) {
      console.error('Error resending invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      toast({
        title: "Errore nel Reinvio",
        description: `Impossibile reinviare l'invito: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelInvitation(invitation.id);
      toast({
        title: "Invito Annullato",
        description: `L'invito per ${invitation.email} è stato annullato (scaduto)`,
      });
      onInvitationUpdated();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      toast({
        title: "Errore nell'Annullamento",
        description: `Impossibile annullare l'invito: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvitation(invitation.id);
      toast({
        title: "Invito Eliminato",
        description: `L'invito per ${invitation.email} è stato eliminato definitivamente`,
      });
      onInvitationUpdated();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      toast({
        title: "Errore nell'Eliminazione",
        description: `Impossibile eliminare l'invito: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="bg-white border-2 border-form-green/20 rounded-[12px] overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-form-green" />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div>
              <h3 className="font-semibold text-black font-dm-sans text-base mb-1">
                {invitation.email}
              </h3>
              <p className="text-sm text-gray-600 font-dm-sans">
                {formatRole(invitation.role)}
              </p>
            </div>

            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">Stato</p>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getInvitationStatusColor(invitation.status)}`}>
                {getStatusIcon(invitation.status)}
                {getInvitationStatusText(invitation.status)}
              </div>
            </div>

            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">
                {invitation.status === 'pending' ? 'Scade in' : 'Inviato il'}
              </p>
              <p className="font-medium text-form-green text-sm">
                {invitation.status === 'pending' && invitation.timeRemaining 
                  ? invitation.timeRemaining
                  : formatDate(invitation.created_at)
                }
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              {(invitation.status === 'pending' || invitation.status === 'email_failed') && (
                <>
                  <Button
                    onClick={handleResend}
                    disabled={isResending || isCancelling || isDeleting}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Invio...' : 'Reinvia'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isCancelling || isResending || isDeleting}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                  >
                    <X className="h-3 w-3" />
                    {isCancelling ? 'Annullo...' : 'Annulla'}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting || isResending || isCancelling}
                    size="sm"
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    {isDeleting ? 'Elimino...' : 'Elimina'}
                  </Button>
                </>
              )}
              {(invitation.status === 'expired' || invitation.status === 'accepted') && (
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-700"
                >
                  <Trash2 className="h-3 w-3" />
                  {isDeleting ? 'Elimino...' : 'Elimina'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvitationCard;
