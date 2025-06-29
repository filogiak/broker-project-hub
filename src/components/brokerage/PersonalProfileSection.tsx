
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Edit, Check, X } from 'lucide-react';
import BrokerageSettingsCard from './BrokerageSettingsCard';
import { updateOwnerProfile } from '@/services/brokerageService';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface PersonalProfileSectionProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

const PersonalProfileSection = ({ profile, onProfileUpdate }: PersonalProfileSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    phone: profile.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedProfile = await updateOwnerProfile(profile.id, formData);
      onProfileUpdate(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <BrokerageSettingsCard
      title="Personal Profile"
      description="Manage your personal information and contact details"
      icon={User}
      className="gomutuo-card-form"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name" className="font-dm-sans text-form-green font-medium">First Name</Label>
          {isEditing ? (
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Enter first name"
              className="gomutuo-form-input mt-1"
            />
          ) : (
            <div className="gomutuo-display-field mt-1">
              {profile.first_name || 'Not set'}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="last_name" className="font-dm-sans text-form-green font-medium">Last Name</Label>
          {isEditing ? (
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Enter last name"
              className="gomutuo-form-input mt-1"
            />
          ) : (
            <div className="gomutuo-display-field mt-1">
              {profile.last_name || 'Not set'}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="email" className="font-dm-sans text-form-green font-medium">Email</Label>
          <div className="gomutuo-display-field mt-1 bg-gray-100 text-muted-foreground">
            {profile.email}
          </div>
        </div>
        
        <div>
          <Label htmlFor="phone" className="font-dm-sans text-form-green font-medium">Phone</Label>
          {isEditing ? (
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              className="gomutuo-form-input mt-1"
            />
          ) : (
            <div className="gomutuo-display-field mt-1">
              {profile.phone || 'Not set'}
            </div>
          )}
        </div>
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
            Edit Profile
          </Button>
        )}
      </div>
    </BrokerageSettingsCard>
  );
};

export default PersonalProfileSection;
