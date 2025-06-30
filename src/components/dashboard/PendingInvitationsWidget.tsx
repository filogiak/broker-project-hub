
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, User, Building2, CheckCircle, XCircle } from 'lucide-react';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { useToast } from '@/hooks/use-toast';

const PendingInvitationsWidget = () => {
  const { invitations, loading, error, acceptInvitation } = usePendingInvitations();
  const { toast } = useToast();

  const handleAcceptInvitation = async (invitationId: string, projectName: string | null) => {
    try {
      const result = await acceptInvitation(invitationId);
      
      if (result.success) {
        toast({
          title: "Invitation Accepted",
          description: result.duplicate_membership 
            ? result.message 
            : `Successfully joined ${projectName || 'the project'}`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-form-green mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading invitations...</p>
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
            Pending Invitations
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
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No pending invitations</p>
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
          Pending Invitations
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
                    {invitation.project_name || 'Project Invitation'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Role: {invitation.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {invitation.days_remaining > 0 
                      ? `Expires in ${Math.ceil(invitation.days_remaining)} days`
                      : 'Expires soon'
                    }
                  </span>
                </div>
              </div>
              
              <Button
                onClick={() => handleAcceptInvitation(invitation.id, invitation.project_name)}
                size="sm"
                className="gomutuo-button-primary"
              >
                Accept
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Invited by {invitation.inviter_name}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsWidget;
