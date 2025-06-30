
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

const UserProfileBox = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "Failed to logout properly. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  // Get user's display name
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email;

  return (
    <div className="bg-white border border-form-border rounded-lg p-3 mx-4 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex-shrink-0 w-8 h-8 bg-vibe-green-light rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-form-green" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-form-green font-dm-sans truncate">
              {displayName}
            </p>
            {user.firstName && user.lastName && (
              <p className="text-xs text-gray-500 font-dm-sans truncate">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default UserProfileBox;
