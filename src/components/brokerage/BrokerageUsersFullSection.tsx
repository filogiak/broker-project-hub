
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, User, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createBrokerageInvitation } from '@/services/brokerageInvitationService';
import { getBrokerageInvitations, getBrokerageMembers } from '@/services/brokerageService';
import BrokerageInvitationsSection from './BrokerageInvitationsSection';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface BrokerageUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  roles: UserRole[];
  joined_at: string | null;
}

const BrokerageUsersFullSection = () => {
  const { brokerageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<BrokerageUser[]>([]);
  const [brokerageName, setBrokerageName] = useState<string>('');
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
      
      // Load brokerage info
      const { data: brokerageData, error: brokerageError } = await supabase
        .from('brokerages')
        .select('name')
        .eq('id', brokerageId)
        .single();

      if (brokerageError) throw brokerageError;
      setBrokerageName(brokerageData?.name || '');

      // Load users with join dates from brokerage_members using the correct foreign key
      const { data: usersData, error: usersError } = await supabase
        .from('brokerage_members')
        .select(`
          joined_at,
          role,
          profiles!brokerage_members_user_id_profiles_fkey (
            id,
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('brokerage_id', brokerageId);

      if (usersError) throw usersError;

      // Transform the data to match our interface
      const transformedUsers: BrokerageUser[] = [];
      const userMap = new Map<string, BrokerageUser>();

      usersData?.forEach(member => {
        if (!member.profiles) return;
        
        const userId = member.profiles.id;
        if (userMap.has(userId)) {
          // Add role to existing user
          const existingUser = userMap.get(userId)!;
          existingUser.roles.push(member.role);
        } else {
          // Create new user entry
          const newUser: BrokerageUser = {
            id: member.profiles.id,
            email: member.profiles.email,
            first_name: member.profiles.first_name,
            last_name: member.profiles.last_name,
            phone: member.profiles.phone,
            roles: [member.role],
            joined_at: member.joined_at
          };
          userMap.set(userId, newUser);
          transformedUsers.push(newUser);
        }
      });

      setUsers(transformedUsers);
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
          description: "Invitation sent successfully.",
        });

        setInviteModalOpen(false);
        setInviteForm({ email: '', role: 'simulation_collaborator' });
        loadBrokerageData();
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

  const formatUserName = (user: BrokerageUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non ancora entrato';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="text-lg text-form-green font-dm-sans">Caricamento membri brokerage...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Brokerage Members */}
      <Card className="bg-white border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="font-dm-sans text-black">
                Collaboratori dell'organizzazione
              </CardTitle>
              <span className="text-sm font-normal text-muted-foreground">
                {users.length} {users.length === 1 ? 'membro' : 'membri'}
              </span>
            </div>
            <Button onClick={() => setInviteModalOpen(true)} className="gomutuo-button-primary flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Aggiungi Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4 font-dm-sans">Nessun membro del brokerage trovato.</p>
              <Button onClick={() => setInviteModalOpen(true)} className="gomutuo-button-primary flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Aggiungi Primo Membro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <Card key={user.id} className="cursor-pointer bg-white border-2 border-form-green rounded-[12px] press-down-effect relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-form-green rounded-b-[10px]"></div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="h-9 w-9 text-form-green" />
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-black font-dm-sans text-lg mb-1 truncate">
                            {formatUserName(user)}
                          </h3>
                          <p className="text-sm text-gray-600 font-dm-sans truncate">
                            {user.email}
                          </p>
                        </div>

                        <div className="text-left min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Ruoli</p>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role, index) => (
                              <Badge key={index} className={`text-xs ${getRoleColor(role)}`}>
                                {getRoleLabel(role)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-left min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="font-medium text-form-green text-sm truncate">Attivo</p>
                        </div>

                        <div className="text-left min-w-0">
                          <p className="text-xs text-gray-500 mb-1">Data Ingresso</p>
                          <p className="font-medium text-form-green text-sm">{formatDate(user.joined_at)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Invitations Section */}
          {brokerageId && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <BrokerageInvitationsSection brokerageId={brokerageId} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invita Nuovo Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
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
  );
};

export default BrokerageUsersFullSection;
