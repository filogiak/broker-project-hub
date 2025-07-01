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
import { UserPlus, Users, Mail, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

const BrokerageUsersSection = () => {
  const { brokerageId } = useParams();
  const { toast } = useToast();
  const [users, setUsers] = useState<BrokerageUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'simulation_collaborator' as UserRole
  });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadBrokerageUsers();
  }, [brokerageId]);

  const loadBrokerageUsers = async () => {
    if (!brokerageId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_brokerage_users', {
        brokerage_uuid: brokerageId
      });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading brokerage users:', error);
      toast({
        title: "Error",
        description: "Failed to load brokerage users.",
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
      const { error } = await supabase
        .from('invitations')
        .insert({
          email: inviteForm.email,
          role: inviteForm.role,
          brokerage_id: brokerageId,
          invited_by: (await supabase.auth.getUser()).data.user?.id!,
          encrypted_token: crypto.randomUUID(), // Temporary - will be replaced by proper token generation
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation sent successfully.",
      });

      setInviteModalOpen(false);
      setInviteForm({ email: '', role: 'simulation_collaborator' });
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
    </div>
  );
};

export default BrokerageUsersSection;
