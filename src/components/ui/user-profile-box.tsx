
import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import type { AuthUser } from '@/services/authService';

interface UserProfileBoxProps {
  user: AuthUser | null;
}

const UserProfileBox = ({ user }: UserProfileBoxProps) => {
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Errore Logout",
        description: "Errore durante il logout. Riprova.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return null;
  }

  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  return (
    <div className="p-3 border-t border-form-border bg-gray-50/50 rounded-lg mx-2 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-form-green font-dm-sans truncate">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="ml-2 h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
          title="Esci"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default UserProfileBox;
