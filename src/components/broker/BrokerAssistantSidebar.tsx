import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building, MailOpen, Settings, ChevronRight } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

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
  const { state } = useSidebar();

  const isActive = (path: string) => {
    if (path === '/dashboard/broker-assistant') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    {state === 'expanded' && (
                      <>
                        <span>{item.title}</span>
                        {isActive(item.url) && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}