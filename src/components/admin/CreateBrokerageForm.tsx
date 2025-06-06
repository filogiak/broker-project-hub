
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createBrokerageForOwner, getAvailableBrokerageOwners } from '@/services/adminService';

interface AvailableOwner {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

const CreateBrokerageForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [availableOwners, setAvailableOwners] = useState<AvailableOwner[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerId: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableOwners();
  }, []);

  const loadAvailableOwners = async () => {
    try {
      const owners = await getAvailableBrokerageOwners();
      setAvailableOwners(owners);
    } catch (error) {
      console.error('Load available owners error:', error);
      toast({
        title: "Error",
        description: "Failed to load available brokerage owners",
        variant: "destructive",
      });
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.ownerId) {
      toast({
        title: "Error",
        description: "Brokerage name and owner are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createBrokerageForOwner(formData);
      
      toast({
        title: "Success",
        description: "Brokerage created successfully",
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        ownerId: '',
      });
      
      // Reload available owners
      await loadAvailableOwners();
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Create brokerage error:', error);
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

  const getOwnerDisplayName = (owner: AvailableOwner) => {
    const fullName = [owner.first_name, owner.last_name].filter(Boolean).join(' ');
    return fullName ? `${fullName} (${owner.email})` : owner.email;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Brokerage</CardTitle>
        <CardDescription>
          Create a new brokerage and assign it to an available brokerage owner.
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
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="owner">Assign to Owner *</Label>
            {loadingOwners ? (
              <div className="text-sm text-muted-foreground">Loading available owners...</div>
            ) : availableOwners.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No available brokerage owners. Create a brokerage owner first.
              </div>
            ) : (
              <Select value={formData.ownerId} onValueChange={(value) => handleInputChange('ownerId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brokerage owner" />
                </SelectTrigger>
                <SelectContent>
                  {availableOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {getOwnerDisplayName(owner)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || availableOwners.length === 0}
          >
            {isLoading ? 'Creating...' : 'Create Brokerage'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateBrokerageForm;
