
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
import { Users, FileText, MessageSquare, Bell, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProjectData } from '@/hooks/useProjectData';
import { getApplicantDisplayNames } from '@/utils/applicantHelpers';

const ProjectSidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const { project, loading: projectLoading } = useProjectData(projectId);

  const menuItems = [
    {
      title: 'Project Overview',
      icon: FileText,
      path: `/project/${projectId}`,
      isActive: window.location.pathname === `/project/${projectId}`,
    },
    {
      title: 'Project Members',
      icon: Users,
      path: `/project/${projectId}/members`,
      isActive: window.location.pathname === `/project/${projectId}/members`,
    },
    {
      title: 'Data & Documents',
      icon: FileText,
      path: `/project/${projectId}/documents`,
      isActive: window.location.pathname === `/project/${projectId}/documents`,
    },
    {
      title: 'Communications',
      icon: MessageSquare,
      path: '#',
      isActive: false,
    },
    {
      title: 'Notifications',
      icon: Bell,
      path: '#',
      isActive: false,
    },
    {
      title: 'Settings',
      icon: Settings,
      path: `/project/${projectId}/settings`,
      isActive: window.location.pathname === `/project/${projectId}/settings`,
    },
  ];

  const handleNavigation = (path: string) => {
    if (path !== '#') {
      navigate(path);
    }
  };

  const handleBackToBrokerage = () => {
    if (project?.brokerage_id) {
      navigate(`/brokerage/${project.brokerage_id}`);
    } else {
      // Fallback to generic brokerage route
      navigate('/brokerage');
    }
  };

  const getProjectDisplayInfo = () => {
    if (projectLoading) {
      return {
        primaryApplicant: 'Loading...',
        secondaryApplicant: null,
        subtitle: 'Loading project data...'
      };
    }

    if (!project) {
      return {
        primaryApplicant: 'Project',
        secondaryApplicant: null,
        subtitle: 'Management Hub'
      };
    }

    const projectName = project.name;
    const { primaryApplicant, secondaryApplicant } = getApplicantDisplayNames(project);
    
    // For sidebar: applicant names on separate lines, project name as subtitle
    return { 
      primaryApplicant, 
      secondaryApplicant: project.applicant_count !== 'one_applicant' ? secondaryApplicant : null, 
      subtitle: projectName 
    };
  };

  const { primaryApplicant, secondaryApplicant, subtitle } = getProjectDisplayInfo();

  return (
    <Sidebar className="border-r border-form-border bg-white">
      <SidebarHeader className="p-6 border-b border-form-border">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToBrokerage}
            className="p-2 h-8 w-8 hover:bg-vibe-green-light"
          >
            <ArrowLeft className="h-4 w-4 text-form-green" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold text-form-green font-dm-sans">
              <div className="truncate">{primaryApplicant}</div>
              {secondaryApplicant && (
                <div className="truncate">{secondaryApplicant}</div>
              )}
            </div>
            <p className="text-sm text-gray-500 break-words">
              {subtitle}
            </p>
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
          GoMutuo.it Project Hub
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ProjectSidebar;
