
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <Card className="card-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Profile
        </CardTitle>
        <CardDescription>
          Manage your personal information and contact details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            {isEditing ? (
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            ) : (
              <div className="p-2 bg-form-beige border border-form-border rounded-md">
                {profile.first_name || 'Not set'}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            {isEditing ? (
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter last name"
              />
            ) : (
              <div className="p-2 bg-form-beige border border-form-border rounded-md">
                {profile.last_name || 'Not set'}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="p-2 bg-gray-100 border border-form-border rounded-md text-muted-foreground">
              {profile.email}
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            {isEditing ? (
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            ) : (
              <div className="p-2 bg-form-beige border border-form-border rounded-md">
                {profile.phone || 'Not set'}
              </div>
            )}
          </div>
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
              Edit Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalProfileSection;
