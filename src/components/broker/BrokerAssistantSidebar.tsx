import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building, MailOpen, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import UserProfileBox from '@/components/ui/user-profile-box';
import { Logo } from '@/components/ui/logo';

const menuItems = [
  {
    title: 'Organizzazioni',
    url: '/dashboard/broker-assistant',
    icon: Building,
  },
  {
    title: 'Inviti',
    url: '/dashboard/broker-assistant/invitations',
    icon: MailOpen,
  },
  {
    title: 'Impostazioni',
    url: '/dashboard/broker-assistant/settings',
    icon: Settings,
  },
];

export function BrokerAssistantSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Organizzazioni',
      icon: Building,
      path: '/dashboard/broker-assistant',
      isActive: location.pathname === '/dashboard/broker-assistant',
    },
    {
      title: 'Inviti',
      icon: MailOpen,
      path: '/dashboard/broker-assistant/invitations',
      isActive: location.pathname === '/dashboard/broker-assistant/invitations',
    },
    {
      title: 'Impostazioni',
      icon: Settings,
      path: '/dashboard/broker-assistant/settings',
      isActive: location.pathname === '/dashboard/broker-assistant/settings',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar className="border-r border-form-border bg-white">
      <SidebarHeader className="p-6 border-b border-form-border">
        <div className="flex items-center justify-center h-16">
          <Logo />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.path)}
                isActive={item.isActive}
                className={`w-full justify-start gap-3 p-3 rounded-lg font-inter ${
                  item.isActive
                    ? 'bg-vibe-green-light text-form-green border border-form-green/20'
                    : 'text-gray-600 hover:bg-vibe-green-light hover:text-form-green'
                } transition-all duration-200`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <UserProfileBox user={user} />
        <div className="border-t border-form-border pt-4">
          <div className="text-xs text-gray-500 text-center">
            GoMutuo.it Broker Assistant
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}