
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RotateCcw, X, Clock, Check, AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';
import { resendBrokerageInvitation, cancelBrokerageInvitation } from '@/services/brokerageInvitationService';
import { useToast } from '@/hooks/use-toast';
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

interface BrokerageInvitationCardProps {
  invitation: BrokerageInvitation;
  onInvitationUpdated: () => void;
}

const BrokerageInvitationCard: React.FC<BrokerageInvitationCardProps> = ({ invitation, onInvitationUpdated }) => {
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

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'email_failed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvitationStatusText = (status: string) => {
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

  const formatRole = (role: UserRole) => {
    switch (role) {
      case 'brokerage_owner': return 'Proprietario';
      case 'simulation_collaborator': return 'Segnalatore';
      case 'broker_assistant': return 'Assistente Broker';
      case 'real_estate_agent': return 'Agente Immobiliare';
      default: return role;
    }
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
      const result = await resendBrokerageInvitation(invitation.id);
      if (result.success) {
        toast({
          title: "Invito Reinviato",
          description: `L'invito è stato reinviato a ${invitation.email}`,
        });
        onInvitationUpdated();
      } else {
        toast({
          title: "Errore nel Reinvio",
          description: result.error || "Impossibile reinviare l'invito",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Errore nel Reinvio",
        description: "Impossibile reinviare l'invito",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelBrokerageInvitation(invitation.id);
      if (result.success) {
        toast({
          title: "Invito Annullato",
          description: `L'invito per ${invitation.email} è stato annullato`,
        });
        onInvitationUpdated();
      } else {
        toast({
          title: "Errore nell'Annullamento",
          description: result.error || "Impossibile annullare l'invito",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Errore nell'Annullamento",
        description: "Impossibile annullare l'invito",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await cancelBrokerageInvitation(invitation.id);
      if (result.success) {
        toast({
          title: "Invito Eliminato",
          description: `L'invito per ${invitation.email} è stato eliminato`,
        });
        onInvitationUpdated();
      } else {
        toast({
          title: "Errore nell'Eliminazione",
          description: result.error || "Impossibile eliminare l'invito",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Errore nell'Eliminazione",
        description: "Impossibile eliminare l'invito",
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

export default BrokerageInvitationCard;
