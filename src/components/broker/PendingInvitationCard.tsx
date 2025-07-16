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
}

const PendingInvitationCard: React.FC<PendingInvitationCardProps> = ({
  invitation,
  onAccept,
  onReject,
  isAccepting = false
}) => {
  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInvitationType = () => {
    if (invitation.project_id) {
      return {
        type: 'Progetto',
        name: invitation.project_name || 'Progetto Senza Nome',
        icon: <Folder className="h-5 w-5 text-form-green" />
      };
    } else if (invitation.brokerage_id) {
      return {
        type: 'Organizzazione',
        name: 'Organizzazione',
        icon: <Building className="h-5 w-5 text-form-green" />
      };
    }
    return {
      type: 'Invito',
      name: 'Invito Generale',
      icon: <User className="h-5 w-5 text-form-green" />
    };
  };

  const invitationType = getInvitationType();

  return (
    <Card className="bg-white border-2 border-form-green rounded-[12px] overflow-hidden solid-shadow-green press-down-effect-green transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-form-green/10 flex items-center justify-center flex-shrink-0">
            {invitationType.icon}
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
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
              <p className="text-xs text-gray-500 mb-1">Ruolo</p>
              <Badge variant="outline" className="text-form-green border-form-green">
                {formatRole(invitation.role)}
              </Badge>
            </div>

            {/* Column 3: Inviter */}
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">Invitato da</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-700 text-sm font-dm-sans">
                  {invitation.inviter_name}
                </p>
              </div>
            </div>

            {/* Column 4: Expiration and Actions */}
            <div className="text-left">
              <p className="text-xs text-gray-500 mb-1">Scadenza</p>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-400" />
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
                  disabled={isAccepting}
                  size="sm"
                  className="bg-form-green hover:bg-form-green/90 text-white font-dm-sans"
                >
                  {isAccepting ? 'Accetto...' : 'Accetta'}
                </Button>
                
                {onReject && (
                  <Button
                    onClick={() => onReject(invitation.id)}
                    disabled={isAccepting}
                    size="sm"
                    variant="outline"
                    className="font-dm-sans text-gray-600 hover:text-gray-800"
                  >
                    Rifiuta
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Green accent line at bottom */}
      <div className="h-1 bg-form-green"></div>
    </Card>
  );
};

export default PendingInvitationCard;