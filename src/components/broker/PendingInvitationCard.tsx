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
      <CardContent className="p-6">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Left section: Invitation info - 4 columns */}
          <div className="col-span-4">
            <h3 className="font-semibold text-black font-dm-sans text-lg mb-1">
              Invito {invitationType.type}
            </h3>
            <p className="text-base text-gray-600 font-dm-sans">
              {invitationType.name}
            </p>
          </div>

          {/* Role section - 2 columns */}
          <div className="col-span-2 text-center">
            <p className="text-sm text-gray-500 mb-2 font-medium">Ruolo</p>
            <Badge variant="outline" className="text-sm text-form-green border-form-green px-3 py-1 font-medium">
              {formatRole(invitation.role)}
            </Badge>
          </div>

          {/* Inviter section - 2 columns */}
          <div className="col-span-2 text-center">
            <p className="text-sm text-gray-500 mb-2 font-medium">Invitato da</p>
            <p className="font-semibold text-gray-700 text-sm font-dm-sans">
              {invitation.inviter_name}
            </p>
          </div>

          {/* Expiration section - 2 columns */}
          <div className="col-span-2 text-center">
            <p className="text-sm text-gray-500 mb-2 font-medium">Scadenza</p>
            <p className="font-semibold text-form-green text-sm font-dm-sans">
              {invitation.days_remaining > 0 
                ? `${Math.ceil(invitation.days_remaining)} giorni`
                : 'Scade presto'
              }
            </p>
          </div>

          {/* Action buttons - 2 columns */}
          <div className="col-span-2 flex gap-2 justify-end">
            <Button
              onClick={() => onAccept(invitation.id)}
              disabled={isAccepting || isRejecting}
              size="sm"
              className="bg-form-green hover:bg-form-green-hover text-white font-dm-sans font-medium px-3"
            >
              {isAccepting ? 'Accetto...' : 'Accetta'}
            </Button>
            
            {onReject && (
              <Button
                onClick={() => onReject(invitation.id)}
                disabled={isAccepting || isRejecting}
                size="sm"
                variant="destructive"
                className="font-dm-sans font-medium px-3"
              >
                {isRejecting ? 'Rifiuto...' : 'Rifiuta'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Accent line at bottom */}
      <div className="h-1 bg-form-green"></div>
    </Card>
  );
};

export default PendingInvitationCard;