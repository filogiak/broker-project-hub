
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building } from 'lucide-react';
import { createBrokerageForOwner, getAvailableBrokerageOwners, type AvailableOwner } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

interface CreateBrokerageFormProps {
  onSuccess?: () => void;
}

const CreateBrokerageForm = ({ onSuccess }: CreateBrokerageFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    website: '',
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
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        website: '',
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
                {!loadingOwners && availableOwners.length === 0 && (
                  <SelectItem value="" disabled>
                    No available brokerage owners
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="ZIP Code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Business phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
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
