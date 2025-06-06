
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  userEmail?: string;
  onLogout?: () => void;
}

const Header = ({ title, userEmail, onLogout }: HeaderProps) => {
  return (
    <header className="bg-background border-b border-form-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{title}</h1>
          <p className="text-sm text-muted-foreground">Broker Project Hub</p>
        </div>
        
        {userEmail && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{userEmail}</span>
            </div>
            {onLogout && (
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
