
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Mail } from 'lucide-react';
import { getBrokerageInvitations } from '@/services/brokerageService';
import BrokerageInvitationsModal from './BrokerageInvitationsModal';
import { InlineLoader } from '@/components/ui/inline-loader';
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
}

interface BrokerageInvitationsSectionProps {
  brokerageId: string;
}

const BrokerageInvitationsSection: React.FC<BrokerageInvitationsSectionProps> = ({ brokerageId }) => {
  const [invitations, setInvitations] = useState<BrokerageInvitation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInvitations = async () => {
    try {
      const brokerageInvitations = await getBrokerageInvitations(brokerageId);
      
      const formattedInvitations = brokerageInvitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        accepted_at: inv.accepted_at,
        email_sent: inv.email_sent || false,
        inviter_name: inv.inviter_name,
        days_remaining: Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      }));

      setInvitations(formattedInvitations);
    } catch (error) {
      console.error('Error loading invitations summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (brokerageId) {
      loadInvitations();
      
      // Set up auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(loadInvitations, 30000);
      return () => clearInterval(interval);
    }
  }, [brokerageId]);

  if (loading) {
    return (
      <Card className="bg-form-green rounded-[12px] cursor-pointer hover:bg-form-green/90 transition-colors">
        <CardContent className="p-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-form-green" />
              </div>
              <div className="flex items-center gap-2">
                <InlineLoader size="small" />
                <span className="font-dm-sans text-white font-medium text-base">
                  Caricamento inviti...
                </span>
              </div>
            </div>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-form-green" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className="bg-form-green rounded-[12px] cursor-pointer hover:bg-form-green/90 transition-colors press-down-effect"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-form-green" />
              </div>
              <span className="font-dm-sans text-white font-medium text-base">
                Gestisci Inviti
              </span>
            </div>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-form-green" />
            </div>
          </div>
        </CardContent>
      </Card>

      <BrokerageInvitationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        brokerageId={brokerageId}
      />
    </>
  );
};

export default BrokerageInvitationsSection;
