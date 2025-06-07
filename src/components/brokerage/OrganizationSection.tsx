
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building, Edit, Check, X } from 'lucide-react';
import { updateBrokerageProfile } from '@/services/brokerageService';
import type { Database } from '@/integrations/supabase/types';

type Brokerage = Database['public']['Tables']['brokerages']['Row'];

interface OrganizationSectionProps {
  brokerage: Brokerage;
  onBrokerageUpdate: (updatedBrokerage: Brokerage) => void;
}

const OrganizationSection = ({ brokerage, onBrokerageUpdate }: OrganizationSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: brokerage.name,
    description: brokerage.description || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedBrokerage = await updateBrokerageProfile(brokerage.id, formData);
      onBrokerageUpdate(updatedBrokerage);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update brokerage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: brokerage.name,
      description: brokerage.description || '',
    });
    setIsEditing(false);
  };

  return (
    <Card className="card-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Organization Details
        </CardTitle>
        <CardDescription>
          Manage your brokerage information and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="brokerage_name">Brokerage Name</Label>
          {isEditing ? (
            <Input
              id="brokerage_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter brokerage name"
            />
          ) : (
            <div className="p-2 bg-form-beige border border-form-border rounded-md font-medium">
              {brokerage.name}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="brokerage_description">Description</Label>
          {isEditing ? (
            <Textarea
              id="brokerage_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter brokerage description"
              rows={3}
            />
          ) : (
            <div className="p-2 bg-form-beige border border-form-border rounded-md min-h-[80px]">
              {brokerage.description || 'No description provided'}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isLoading}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Organization
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationSection;
