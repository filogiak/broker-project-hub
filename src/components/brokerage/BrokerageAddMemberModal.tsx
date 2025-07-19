
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail } from 'lucide-react';
import { createBrokerageInvitation } from '@/services/brokerageInvitationService';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface BrokerageAddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerageId: string;
  onMemberAdded: () => void;
}

const BrokerageAddMemberModal: React.FC<BrokerageAddMemberModalProps> = ({
  isOpen,
  onClose,
  brokerageId,
  onMemberAdded
}) => {
  const { toast } = useToast();
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'simulation_collaborator' as UserRole
  });
  const [inviting, setInviting] = useState(false);

  const handleInviteUser = async () => {
    if (!brokerageId || !inviteForm.email.trim()) return;

    try {
      setInviting(true);
      
      const result = await createBrokerageInvitation(brokerageId, inviteForm.email, inviteForm.role);
      
      if (result.success) {
        toast({
          title: "Successo",
          description: "Invito inviato con successo.",
        });

        setInviteForm({ email: '', role: 'simulation_collaborator' });
        onMemberAdded();
      } else {
        toast({
          title: "Errore",
          description: result.error || "Impossibile inviare l'invito.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Errore",
        description: "Impossibile inviare l'invito.",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Button variant="outline" onClick={onClose}>
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
  );
};

export default BrokerageAddMemberModal;
