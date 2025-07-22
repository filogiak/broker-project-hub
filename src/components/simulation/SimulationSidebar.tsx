
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
import { FileText, Users, Settings, ArrowLeft, FlaskConical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSimulationMembers } from '@/hooks/useSimulationData';
import UserProfileBox from '@/components/ui/user-profile-box';
import { Logo } from '@/components/ui/logo';

const SimulationSidebar = () => {
  const navigate = useNavigate();
  const { simulationId } = useParams();
  const { user } = useAuth();
  const { data: members = [] } = useSimulationMembers(simulationId || '');

  // Check if current user is a mortgage applicant
  const currentUserMember = members.find(member => member.user_id === user?.id);
  const isMortgageApplicant = currentUserMember?.role === 'mortgage_applicant';

  const menuItems = [
    {
      title: 'Questionario',
      icon: FileText,
      path: `/simulation/${simulationId}/questionnaire`,
      isActive: window.location.pathname === `/simulation/${simulationId}/questionnaire` || window.location.pathname === `/simulation/${simulationId}`,
      showForMortgageApplicant: true,
    },
    {
      title: 'Partecipanti',
      icon: Users,
      path: `/simulation/${simulationId}/members`,
      isActive: window.location.pathname === `/simulation/${simulationId}/members`,
      showForMortgageApplicant: true,
    },
    {
      title: 'Impostazioni',
      icon: Settings,
      path: `/simulation/${simulationId}/settings`,
      isActive: window.location.pathname === `/simulation/${simulationId}/settings`,
      showForMortgageApplicant: false, // Hide settings for mortgage applicants
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    !isMortgageApplicant || item.showForMortgageApplicant
  );

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleBackNavigation = () => {
    // Navigate back to brokerage simulations - we'll need to get the brokerage ID
    navigate(-1); // For now, just go back
  };

  return (
    <Sidebar className="border-r border-form-border bg-white">
      <SidebarHeader className="p-6 border-b border-form-border">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackNavigation}
              className="p-2 hover:bg-vibe-green-light rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <Logo />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <div className="mb-4 p-3 bg-vibe-green-light rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-4 w-4 text-form-green" />
            <span className="text-sm font-medium text-form-green">Simulazione</span>
          </div>
          <p className="text-xs text-gray-600">
            {isMortgageApplicant ? 'Completa il questionario' : 'Gestisci la tua simulazione'}
          </p>
        </div>

        <SidebarMenu>
          {filteredMenuItems.map((item) => (
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
            GoMutuo.it Simulation Hub
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SimulationSidebar;
