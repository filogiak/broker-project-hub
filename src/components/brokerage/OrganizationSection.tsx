
import React, { useState } from 'react';
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
    <div className="bg-white rounded-[16px] p-8">
      {/* Header section matching dashboard design */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center">
            <Building className="h-9 w-9 text-form-green" />
          </div>
          <div>
            <h3 className="font-semibold text-black font-dm-sans mb-2 text-xl">Organization Details</h3>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="brokerage_name" className="font-dm-sans text-form-green font-medium">Brokerage Name</Label>
          {isEditing ? (
            <Input
              id="brokerage_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter brokerage name"
              className="mt-1"
            />
          ) : (
            <div className="gomutuo-display-field mt-1 font-medium bg-white">
              {brokerage.name}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="brokerage_description" className="font-dm-sans text-form-green font-medium">Description</Label>
          {isEditing ? (
            <Textarea
              id="brokerage_description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter brokerage description"
              rows={3}
              className="gomutuo-form-input mt-1 resize-none"
            />
          ) : (
            <div className="gomutuo-display-field mt-1 min-h-[80px] items-start bg-white">
              {brokerage.description || 'No description provided'}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-4">
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
      </div>
    </div>
  );
};

export default OrganizationSection;
