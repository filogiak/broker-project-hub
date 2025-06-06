
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createBrokerageForOwner } from '@/services/adminService';

const CreateOwnBrokerageForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Brokerage name is required",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a brokerage",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createBrokerageForOwner({
        name: formData.name,
        description: formData.description,
        ownerId: user.id,
      });
      
      toast({
        title: "Success",
        description: "Your brokerage has been created successfully!",
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Create own brokerage error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create brokerage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background-cream p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Brokerage</CardTitle>
            <CardDescription>
              Welcome! To get started, please create your brokerage organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Brokerage Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your brokerage name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your brokerage (optional)"
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create My Brokerage'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateOwnBrokerageForm;
