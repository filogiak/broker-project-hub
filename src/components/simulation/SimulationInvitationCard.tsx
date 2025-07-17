import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Mail, RefreshCw, X, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  resendInvitation,
  cancelInvitation,
  deleteInvitation,
  getInvitationStatusColor,
  getInvitationStatusText,
  SimulationInvitationWithStatus
} from '@/services/simulationInvitationService';

interface SimulationInvitationCardProps {
  invitation: SimulationInvitationWithStatus;
  onInvitationUpdated: () => void;
}

const SimulationInvitationCard: React.FC<SimulationInvitationCardProps> = ({
  invitation,
  onInvitationUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendInvitation(invitation.id);
      toast({
        title: "Invitation Resent",
        description: `Invitation email has been resent to ${invitation.email}`,
      });
      onInvitationUpdated();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelInvitation(invitation.id);
      toast({
        title: "Invitation Cancelled",
        description: `Invitation for ${invitation.email} has been cancelled`,
      });
      onInvitationUpdated();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteInvitation(invitation.id);
      toast({
        title: "Invitation Deleted",
        description: `Invitation for ${invitation.email} has been deleted`,
      });
      onInvitationUpdated();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to delete invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getAvailableActions = () => {
    const actions = [];
    
    if (invitation.status === 'pending' || invitation.status === 'email_failed') {
      actions.push('resend');
      actions.push('cancel');
    }
    
    if (invitation.status === 'expired' || invitation.status === 'accepted') {
      actions.push('delete');
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();
  const hasActions = availableActions.length > 0;

  return (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="font-medium truncate">{invitation.email}</div>
              <Badge 
                variant="outline" 
                className={`${getInvitationStatusColor(invitation.status)} text-xs`}
              >
                {getInvitationStatusText(invitation.status)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Role: {formatRole(invitation.role)}</span>
              <span>Invited: {formatDate(invitation.created_at)}</span>
              {invitation.status === 'pending' && invitation.timeRemaining && (
                <span>Expires in: {invitation.timeRemaining}</span>
              )}
              {invitation.status === 'accepted' && invitation.accepted_at && (
                <span>Accepted: {formatDate(invitation.accepted_at)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {invitation.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Resend
              </Button>
            )}

            {hasActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableActions.includes('resend') && (
                    <DropdownMenuItem onClick={handleResend}>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Email
                    </DropdownMenuItem>
                  )}
                  {availableActions.includes('cancel') && (
                    <DropdownMenuItem onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel Invitation
                    </DropdownMenuItem>
                  )}
                  {availableActions.includes('delete') && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Invitation
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationInvitationCard;