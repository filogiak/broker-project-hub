
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
    <div className="p-4 bg-white border border-form-border/20 rounded-lg mx-2 mb-4 shadow-sm">
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-base font-medium text-gray-900 font-inter leading-tight">
            {displayName}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full gap-2 text-xs font-inter hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <LogOut className="h-3 w-3" />
          Esci
        </Button>
      </div>
    </div>
  );
};

export default UserProfileBox;
