
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building, Edit, Check, X } from 'lucide-react';
import StandardCard from '@/components/ui/StandardCard';
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
    <StandardCard
      title="Organization Details"
      description="Manage your brokerage information and settings"
      icon={Building}
      variant="settings"
    >
      <div className="space-y-6">
        <div>
          <Label htmlFor="brokerage_name" className="gomutuo-subtitle">Brokerage Name</Label>
          {isEditing ? (
            <Input
              id="brokerage_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter brokerage name"
              className="gomutuo-form-input mt-2"
            />
          ) : (
            <div className="gomutuo-display-field mt-2">
              {brokerage.name}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="brokerage_description" className="gomutuo-subtitle">Description</Label>
          {isEditing ? (
            <Textarea
              id="brokerage_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter brokerage description"
              rows={4}
              className="gomutuo-form-input mt-2 resize-none"
            />
          ) : (
            <div className="gomutuo-display-field mt-2 min-h-[100px] items-start">
              {brokerage.description || 'No description provided'}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-3 pt-6">
        {isEditing ? (
          <>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="gomutuo-button-primary"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isLoading}
              className="gomutuo-button-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </>
        ) : (
          <Button 
            onClick={() => setIsEditing(true)}
            className="gomutuo-button-primary"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Organization
          </Button>
        )}
      </div>
    </StandardCard>
  );
};

export default OrganizationSection;
