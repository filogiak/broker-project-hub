
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
    <div className="p-3 bg-gray-50/50 rounded-lg mx-2 mb-4">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900 font-dm-sans text-center">
          {displayName}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full gap-2 text-xs"
        >
          <LogOut className="h-3 w-3" />
          Esci
        </Button>
      </div>
    </div>
  );
};

export default UserProfileBox;
