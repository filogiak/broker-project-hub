import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import RoleSelector from '@/components/dashboard/RoleSelector';

const BrokerAssistantSettings = () => {
  const { user } = useAuth();
  const { isMultiRole } = useRoleSelection();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim() || null,
          last_name: formData.last_name.trim() || null,
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Profile updated successfully

      toast({
        title: "Impostazioni salvate",
        description: "Le tue impostazioni sono state aggiornate con successo.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nel salvare le impostazioni.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Role Selector for multi-role users */}
      {isMultiRole && <RoleSelector />}

      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-primary font-dm-sans">Impostazioni</h1>
          <p className="text-muted-foreground font-dm-sans">
            Gestisci le tue informazioni personali e preferenze
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-dm-sans">
            <User className="h-5 w-5" />
            Informazioni Personali
          </CardTitle>
          <CardDescription className="font-dm-sans">
            Aggiorna le tue informazioni di contatto e profilo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="font-dm-sans">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Inserisci il tuo nome"
                className="font-dm-sans"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name" className="font-dm-sans">Cognome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Inserisci il tuo cognome"
                className="font-dm-sans"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="font-dm-sans">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted font-dm-sans"
            />
            <p className="text-sm text-muted-foreground font-dm-sans">
              L'email non può essere modificata
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="font-dm-sans">Telefono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Inserisci il tuo numero di telefono"
              type="tel"
              className="font-dm-sans"
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveSettings}
              disabled={isUpdating}
              className="flex items-center gap-2 font-dm-sans"
            >
              <Save className="h-4 w-4" />
              {isUpdating ? 'Salvando...' : 'Salva Impostazioni'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerAssistantSettings;