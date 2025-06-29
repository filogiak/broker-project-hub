
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Edit, Check, X } from 'lucide-react';
import StandardCard from '@/components/ui/StandardCard';
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
    <StandardCard
      title="Personal Profile"
      description="Manage your personal information and contact details"
      icon={User}
      variant="settings"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="first_name" className="gomutuo-subtitle">First Name</Label>
          {isEditing ? (
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Enter first name"
              className="gomutuo-form-input mt-2"
            />
          ) : (
            <div className="gomutuo-display-field mt-2">
              {profile.first_name || 'Not set'}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="last_name" className="gomutuo-subtitle">Last Name</Label>
          {isEditing ? (
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Enter last name"
              className="gomutuo-form-input mt-2"
            />
          ) : (
            <div className="gomutuo-display-field mt-2">
              {profile.last_name || 'Not set'}
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="email" className="gomutuo-subtitle">Email</Label>
          <div className="gomutuo-display-field mt-2 bg-gray-100 text-muted-foreground">
            {profile.email}
          </div>
        </div>
        
        <div>
          <Label htmlFor="phone" className="gomutuo-subtitle">Phone</Label>
          {isEditing ? (
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
              className="gomutuo-form-input mt-2"
            />
          ) : (
            <div className="gomutuo-display-field mt-2">
              {profile.phone || 'Not set'}
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
            Edit Profile
          </Button>
        )}
      </div>
    </StandardCard>
  );
};

export default PersonalProfileSection;
