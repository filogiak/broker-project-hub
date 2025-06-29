
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Edit, Check, X } from 'lucide-react';
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
    <div className="bg-white rounded-[16px] p-8">
      {/* Header section matching progetti attivi design */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-7 w-7 text-form-green-dark" />
          <h3 className="font-semibold text-black font-dm-sans text-2xl">Personal Profile</h3>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name" className="font-dm-sans text-form-green font-medium">First Name</Label>
            {isEditing ? (
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter first name"
                className="mt-1"
              />
            ) : (
              <div className="gomutuo-display-field mt-1 bg-white">
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
                className="mt-1"
              />
            ) : (
              <div className="gomutuo-display-field mt-1 bg-white">
                {profile.last_name || 'Not set'}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="email" className="font-dm-sans text-form-green font-medium">Email</Label>
            <div className="gomutuo-display-field mt-1 bg-gray-100 text-muted-foreground truncate overflow-hidden">
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
                className="mt-1"
              />
            ) : (
              <div className="gomutuo-display-field mt-1 bg-white">
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
      </div>
    </div>
  );
};

export default PersonalProfileSection;
