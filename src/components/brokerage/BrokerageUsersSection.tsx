import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Mail, Info, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createBrokerageInvitation, resendBrokerageInvitation, cancelBrokerageInvitation } from '@/services/brokerageInvitationService';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface BrokerageUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  roles: UserRole[];
}

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

const BrokerageUsersSection = () => {
  const { brokerageId } = useParams();
  const { toast } = useToast();
  const [users, setUsers] = useState<BrokerageUser[]>([]);
  const [invitations, setInvitations] = useState<BrokerageInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'simulation_collaborator' as UserRole
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadBrokerageData();
  }, [brokerageId]);

  const loadBrokerageData = async () => {
    if (!brokerageId) return;
    
    try {
      setLoading(true);
      
      // Load users using the updated function that queries brokerage_members
      const { data: usersData, error: usersError } = await supabase.rpc('get_brokerage_users', {
        brokerage_uuid: brokerageId
      });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          role,
          created_at,
          expires_at,
          accepted_at,
          email_sent,
          invited_by,
          profiles!invitations_invited_by_fkey(first_name, last_name, email)
        `)
        .eq('brokerage_id', brokerageId)
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      const formattedInvitations = (invitationsData || []).map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        created_at: inv.created_at,
        expires_at: inv.expires_at,
        accepted_at: inv.accepted_at,
        email_sent: inv.email_sent,
        inviter_name: inv.profiles 
          ? `${inv.profiles.first_name || ''} ${inv.profiles.last_name || ''}`.trim() || inv.profiles.email
          : 'Unknown',
        days_remaining: Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      }));

      setInvitations(formattedInvitations);
    } catch (error) {
      console.error('Error loading brokerage data:', error);
      toast({
        title: "Error",
        description: "Failed to load brokerage data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!brokerageId || !inviteForm.email.trim()) return;

    try {
      setInviting(true);
      
      const result = await createBrokerageInvitation(brokerageId, inviteForm.email, inviteForm.role);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.error || "Invitation sent successfully.",
          variant: result.error ? "default" : "default",
        });

        setInviteModalOpen(false);
        setInviteForm({ email: '', role: 'simulation_collaborator' });
        loadBrokerageData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const result = await resendBrokerageInvitation(invitationId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Invitation resent successfully.",
        });
        loadBrokerageData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resend invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation.",
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const result = await cancelBrokerageInvitation(invitationId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Invitation cancelled successfully.",
        });
        loadBrokerageData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation.",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'brokerage_owner': return 'Proprietario';
      case 'simulation_collaborator': return 'Segnalatore';
      case 'broker_assistant': return 'Assistente Broker';
      case 'real_estate_agent': return 'Agente Immobiliare';
      default: return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'brokerage_owner': return 'bg-purple-100 text-purple-800';
      case 'simulation_collaborator': return 'bg-blue-100 text-blue-800';
      case 'broker_assistant': return 'bg-green-100 text-green-800';
      case 'real_estate_agent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvitationStatusIcon = (invitation: BrokerageInvitation) => {
    if (invitation.accepted_at) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (invitation.days_remaining <= 0) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  const getInvitationStatusLabel = (invitation: BrokerageInvitation) => {
    if (invitation.accepted_at) return 'Accepted';
    if (invitation.days_remaining <= 0) return 'Expired';
    return 'Pending';
  };

  const pendingInvitations = invitations.filter(inv => !inv.accepted_at && inv.days_remaining > 0);
  const acceptedInvitations = invitations.filter(inv => inv.accepted_at);
  const expiredInvitations = invitations.filter(inv => !inv.accepted_at && inv.days_remaining <= 0);

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#BEB8AE] rounded-[12px] p-6 animate-pulse">
              <div className="h-4 bg-form-placeholder rounded w-48 mb-2"></div>
              <div className="h-3 bg-form-placeholder rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold font-dm-sans text-3xl text-black mb-2">Gestione Utenti</h1>
          <p className="text-gray-600 font-dm-sans">
            Gestisci gli utenti del tuo brokerage e invita nuovi collaboratori.
          </p>
        </div>
        
        <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-form-green hover:bg-form-green-dark text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Invita Utente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invita Nuovo Utente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Tutti i ruoli possono creare simulazioni. Solo gli "Assistente Broker" e "Agenti Immobiliari" potranno lavorare sui progetti assegnati.
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="utente@example.com"
                />
              </div>
              <div>
                <Label htmlFor="role">Ruolo</Label>
                <Select 
                  value={inviteForm.role} 
                  onValueChange={(value: UserRole) => setInviteForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simulation_collaborator">Segnalatore</SelectItem>
                    <SelectItem value="broker_assistant">Assistente Broker</SelectItem>
                    <SelectItem value="real_estate_agent">Agente Immobiliare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                  Annulla
                </Button>
                <Button 
                  onClick={handleInviteUser}
                  disabled={!inviteForm.email.trim() || inviting}
                  className="bg-form-green hover:bg-form-green-dark text-white"
                >
                  {inviting ? 'Inviando...' : 'Invia Invito'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            Utenti Attivi ({users.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Inviti ({pendingInvitations.length} Pending, {acceptedInvitations.length} Accepted)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-6">
          {users.length === 0 ? (
            <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-form-green/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-form-green" />
                </div>
                <h3 className="font-semibold text-xl mb-2">Nessun utente trovato</h3>
                <p className="text-gray-600 mb-6">
                  Inizia invitando il tuo primo collaboratore al brokerage.
                </p>
                <Button 
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-form-green hover:bg-form-green-dark text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invita Primo Utente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="bg-white border border-[#BEB8AE] rounded-[12px]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-form-green/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-form-green" />
                        </div>
                        <div>
                          <h3 className="font-medium text-black">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.email
                            }
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-gray-600">{user.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.roles.map((role) => (
                          <Badge key={role} className={getRoleColor(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4 mt-6">
          {invitations.length === 0 ? (
            <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-form-green/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="h-8 w-8 text-form-green" />
                </div>
                <h3 className="font-semibold text-xl mb-2">Nessun invito inviato</h3>
                <p className="text-gray-600 mb-6">
                  Gli inviti inviati appariranno qui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="bg-white border border-[#BEB8AE] rounded-[12px]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-form-green/10 flex items-center justify-center">
                          {getInvitationStatusIcon(invitation)}
                        </div>
                        <div>
                          <h3 className="font-medium text-black">{invitation.email}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Status: {getInvitationStatusLabel(invitation)}</span>
                            {invitation.days_remaining > 0 && !invitation.accepted_at && (
                              <span>• Expires in {invitation.days_remaining} days</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Invited by {invitation.inviter_name} • {new Date(invitation.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getRoleColor(invitation.role)}>
                          {getRoleLabel(invitation.role)}
                        </Badge>
                        {!invitation.accepted_at && invitation.days_remaining > 0 && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                            >
                              Resend
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerageUsersSection;
