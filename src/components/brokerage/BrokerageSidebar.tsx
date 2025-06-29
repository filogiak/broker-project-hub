
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, Users, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const BrokerageSidebar = () => {
  const navigate = useNavigate();
  const { brokerageId } = useParams();
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: `/brokerage/${brokerageId}`,
      isActive: window.location.pathname === `/brokerage/${brokerageId}`,
    },
    {
      title: 'Projects',
      icon: FileText,
      path: `/brokerage/${brokerageId}/projects`,
      isActive: window.location.pathname === `/brokerage/${brokerageId}/projects`,
    },
    {
      title: 'Users',
      icon: Users,
      path: `/brokerage/${brokerageId}/users`,
      isActive: window.location.pathname === `/brokerage/${brokerageId}/users`,
    },
    {
      title: 'Settings',
      icon: Settings,
      path: `/brokerage/${brokerageId}/settings`,
      isActive: window.location.pathname === `/brokerage/${brokerageId}/settings`,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar className="border-r border-form-border bg-white">
      <SidebarHeader className="p-6 border-b border-form-border">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-form-green font-dm-sans">Brokerage</h2>
            <p className="text-sm text-gray-500">Management Hub</p>
          </div>
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

      <SidebarFooter className="p-4 border-t border-form-border">
        <div className="text-xs text-gray-500 text-center">
          GoMutuo.it Brokerage Hub
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default BrokerageSidebar;
