import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { BrokerAssistantSidebar } from './BrokerAssistantSidebar';
import UserProfileBox from '@/components/ui/user-profile-box';
import { logout } from '@/services/authService';

interface BrokerAssistantLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function BrokerAssistantLayout({ children, title }: BrokerAssistantLayoutProps) {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <BrokerAssistantSidebar />
        
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            
            <div className="flex-1">
              {title && <h1 className="text-lg font-semibold">{title}</h1>}
            </div>
            
            <div className="flex items-center gap-2">
              <UserProfileBox user={user} />
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}