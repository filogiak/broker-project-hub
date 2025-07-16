import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Folder, Calendar, User, Clock } from 'lucide-react';
import type { PendingInvitation } from '@/services/unifiedInvitationService';

interface PendingInvitationCardProps {
  invitation: PendingInvitation;
  onAccept: (invitationId: string) => void;
  onReject?: (invitationId: string) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

const PendingInvitationCard: React.FC<PendingInvitationCardProps> = ({
  invitation,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false
}) => {
  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInvitationType = () => {
    if (invitation.project_id) {
      return {
        type: 'Progetto',
        name: invitation.project_name || 'Progetto Senza Nome'
      };
    } else if (invitation.brokerage_id) {
      return {
        type: 'Organizzazione',
        name: invitation.brokerage_name || 'Organizzazione'
      };
    }
    return {
      type: 'Invito',
      name: 'Invito Generale'
    };
  };

  const invitationType = getInvitationType();

  return (
    <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
          {/* Column 1: Invitation Type and Name */}
          <div>
            <h3 className="font-semibold text-black font-dm-sans text-base mb-1">
              Invito {invitationType.type}
            </h3>
            <p className="text-sm text-gray-600 font-dm-sans">
              {invitationType.name}
            </p>
          </div>

          {/* Column 2: Role */}
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-1">Ruolo</p>
            <Badge variant="outline" className="text-sm text-form-green border-form-green px-3 py-1">
              {formatRole(invitation.role)}
            </Badge>
          </div>

          {/* Column 3: Inviter */}
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-1">Invitato da</p>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-700 text-sm font-dm-sans">
                {invitation.inviter_name}
              </p>
            </div>
          </div>

          {/* Column 4: Expiration and Actions */}
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-1">Scadenza</p>
            <div className="flex items-center gap-2 mb-3">
              <p className="font-medium text-form-green text-sm font-dm-sans">
                {invitation.days_remaining > 0 
                  ? `${Math.ceil(invitation.days_remaining)} giorni`
                  : 'Scade presto'
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => onAccept(invitation.id)}
                disabled={isAccepting || isRejecting}
                size="sm"
                className="bg-form-green hover:bg-form-green/90 text-white font-dm-sans"
              >
                {isAccepting ? 'Accetto...' : 'Accetta'}
              </Button>
              
              {onReject && (
                <Button
                  onClick={() => onReject(invitation.id)}
                  disabled={isAccepting || isRejecting}
                  size="sm"
                  variant="destructive"
                  className="font-dm-sans"
                >
                  {isRejecting ? 'Rifiuto...' : 'Rifiuta'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Subtle accent line at bottom */}
      <div className="h-0.5 bg-form-green/20"></div>
    </Card>
  );
};

export default PendingInvitationCard;