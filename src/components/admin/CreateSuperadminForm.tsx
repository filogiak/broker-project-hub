
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CreateSuperadminForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSuperadmin = async () => {
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('create-superadmin', {
        body: {
          email: 'giacometti.filippo@gmail.com',
          password: '@Filogiac21g',
          firstName: 'Filippo',
          lastName: 'Giacometti',
        },
      });

      if (response.error) {
        console.error('Create superadmin error:', response.error);
        throw new Error(response.error.message || 'Failed to create superadmin');
      }

      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        console.error('Create superadmin API error:', response.data.error);
        throw new Error(response.data.error as string);
      }

      toast.success('Superadmin account created successfully!');
      console.log('Superadmin created:', response.data);
    } catch (error: any) {
      console.error('Create superadmin error:', error);
      toast.error(error.message || 'Failed to create superadmin account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Superadmin Account</CardTitle>
        <CardDescription>
          Create the superadmin account for giacometti.filippo@gmail.com
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value="giacometti.filippo@gmail.com" disabled />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value="@Filogiac21g" disabled />
          </div>
          <Button 
            onClick={handleCreateSuperadmin} 
            disabled={isLoading} 
            className="w-full"
          >
            {isLoading ? 'Creating Account...' : 'Create Superadmin Account'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateSuperadminForm;
