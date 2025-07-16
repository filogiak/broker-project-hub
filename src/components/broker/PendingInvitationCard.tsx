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
    <Card className="bg-white border-2 border-form-green rounded-lg overflow-hidden hover:shadow-lg hover:shadow-form-green/30 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left section: Invitation Type and Name */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-black font-dm-sans text-lg mb-1">
              Invito {invitationType.type}
            </h3>
            <p className="text-base text-gray-600 font-dm-sans">
              {invitationType.name}
            </p>
          </div>

          {/* Role section */}
          <div className="flex flex-col items-center min-w-0">
            <p className="text-base text-gray-500 mb-2 font-medium">Ruolo</p>
            <Badge variant="outline" className="text-base text-form-green border-form-green px-4 py-2 font-medium">
              {formatRole(invitation.role)}
            </Badge>
          </div>

          {/* Inviter section */}
          <div className="flex flex-col items-center min-w-0">
            <p className="text-base text-gray-500 mb-2 font-medium">Invitato da</p>
            <p className="font-semibold text-gray-700 text-base font-dm-sans text-center">
              {invitation.inviter_name}
            </p>
          </div>

          {/* Right section: Expiration and Actions - side by side */}
          <div className="flex items-center gap-6">
            {/* Expiration */}
            <div className="flex flex-col items-center">
              <p className="text-base text-gray-500 mb-2 font-medium">Scadenza</p>
              <p className="font-semibold text-form-green text-base font-dm-sans">
                {invitation.days_remaining > 0 
                  ? `${Math.ceil(invitation.days_remaining)} giorni`
                  : 'Scade presto'
                }
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => onAccept(invitation.id)}
                disabled={isAccepting || isRejecting}
                size="sm"
                className="bg-form-green hover:bg-form-green-hover text-white font-dm-sans font-medium px-4"
              >
                {isAccepting ? 'Accetto...' : 'Accetta'}
              </Button>
              
              {onReject && (
                <Button
                  onClick={() => onReject(invitation.id)}
                  disabled={isAccepting || isRejecting}
                  size="sm"
                  variant="destructive"
                  className="font-dm-sans font-medium px-4"
                >
                  {isRejecting ? 'Rifiuto...' : 'Rifiuta'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Accent line at bottom */}
      <div className="h-1 bg-form-green"></div>
    </Card>
  );
};

export default PendingInvitationCard;