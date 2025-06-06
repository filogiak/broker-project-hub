
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, UserPlus } from 'lucide-react';
import { createBrokerageForOwner, getAvailableBrokerageOwners, type AvailableOwner } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

interface CreateBrokerageFormProps {
  onSuccess?: () => void;
}

const CreateBrokerageForm = ({ onSuccess }: CreateBrokerageFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerId: '',
  });
  const [availableOwners, setAvailableOwners] = useState<AvailableOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableOwners();
  }, []);

  const loadAvailableOwners = async () => {
    try {
      setLoadingOwners(true);
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
    
    if (!formData.name.trim() || !formData.ownerId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getOwnerDisplayName = (owner: AvailableOwner) => {
    const fullName = [owner.first_name, owner.last_name].filter(Boolean).join(' ');
    return fullName ? `${fullName} (${owner.email})` : owner.email;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Create Brokerage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Brokerage Owner *</Label>
            <Select 
              value={formData.ownerId} 
              onValueChange={(value) => setFormData({ ...formData, ownerId: value })}
              disabled={loadingOwners}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingOwners ? "Loading owners..." : "Select a brokerage owner"} />
              </SelectTrigger>
              <SelectContent>
                {availableOwners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {getOwnerDisplayName(owner)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingOwners && availableOwners.length === 0 && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium">No available brokerage owners</span>
                </div>
                <p>Create brokerage owners first using the "User Management" tab, then return here to assign them brokerages.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Brokerage Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter brokerage name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the brokerage"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || loadingOwners || !formData.name.trim() || !formData.ownerId}
          >
            {loading ? 'Creating Brokerage...' : 'Create Brokerage'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateBrokerageForm;
