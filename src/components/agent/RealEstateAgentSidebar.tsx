
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Building, Briefcase, BarChart3, Mail, Settings } from 'lucide-react';
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

export function RealEstateAgentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/agent/dashboard',
      isActive: location.pathname === '/agent/dashboard',
    },
    {
      title: 'Organizzazioni',
      icon: Building,
      path: '/agent/organizzazioni',
      isActive: location.pathname === '/agent/organizzazioni',
    },
    {
      title: 'Progetti',
      icon: Briefcase,
      path: '/agent/progetti',
      isActive: location.pathname === '/agent/progetti',
    },
    {
      title: 'Simulazioni',
      icon: BarChart3,
      path: '/agent/simulazioni',
      isActive: location.pathname === '/agent/simulazioni',
    },
    {
      title: 'Inviti',
      icon: Mail,
      path: '/agent/inviti',
      isActive: location.pathname === '/agent/inviti',
    },
    {
      title: 'Impostazioni',
      icon: Settings,
      path: '/agent/impostazioni',
      isActive: location.pathname === '/agent/impostazioni',
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
            GoMutuo.it Real Estate Agent
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
