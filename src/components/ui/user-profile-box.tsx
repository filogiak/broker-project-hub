
import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import type { AuthUser } from '@/services/authService';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

const roleDisplayNames: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  brokerage_owner: 'Brokerage Owner', 
  broker_assistant: 'Broker Assistant',
  mortgage_applicant: 'Mortgage Applicant',
  real_estate_agent: 'Real Estate Agent',
  simulation_collaborator: 'Simulation Collaborator',
};

interface UserProfileBoxProps {
  user: AuthUser | null;
}

const UserProfileBox = ({
  user
}: UserProfileBoxProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { selectedRole, setSelectedRole, isMultiRole, rolesWithContext } = useRoleSelection();

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

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    // Navigate to dashboard to trigger re-evaluation of which dashboard to show
    navigate('/dashboard');
  };

  if (!user) {
    return null;
  }

  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  return (
    <div className="p-4 bg-white/50 border border-form-border/10 rounded-lg mx-2 mb-4">
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-gray-900 font-inter leading-tight font-medium text-sm">
            {displayName}
          </p>
        </div>
        
        {/* Role Selector for multi-role users */}
        {isMultiRole && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User className="h-3 w-3" />
              <span>Ruolo attivo:</span>
            </div>
            <Select
              value={selectedRole || ''}
              onValueChange={(value) => handleRoleChange(value as UserRole)}
            >
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue placeholder="Seleziona ruolo" />
              </SelectTrigger>
              <SelectContent>
                {rolesWithContext
                  .filter(r => r.hasActiveMembership)
                  .map((roleInfo) => (
                  <SelectItem key={roleInfo.role} value={roleInfo.role}>
                    <span className="text-xs">{roleDisplayNames[roleInfo.role]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut} 
          className="w-full gap-2 text-xs font-inter hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors h-8"
        >
          <LogOut className="h-3 w-3" />
          Esci
        </Button>
      </div>
    </div>
  );
};

export default UserProfileBox;
