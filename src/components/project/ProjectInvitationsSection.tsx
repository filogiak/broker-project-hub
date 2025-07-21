
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Mail } from 'lucide-react';
import { getProjectInvitations, InvitationWithStatus } from '@/services/projectInvitationService';
import ProjectInvitationsModal from './ProjectInvitationsModal';
import { InlineLoader } from '@/components/ui/inline-loader';

interface ProjectInvitationsSectionProps {
  projectId: string;
}

const ProjectInvitationsSection: React.FC<ProjectInvitationsSectionProps> = ({ projectId }) => {
  const [invitations, setInvitations] = useState<InvitationWithStatus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInvitations = async () => {
    try {
      const projectInvitations = await getProjectInvitations(projectId);
      setInvitations(projectInvitations);
    } catch (error) {
      console.error('Error loading invitations summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadInvitations();
      
      // Set up auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(loadInvitations, 30000);
      return () => clearInterval(interval);
    }
  }, [projectId]);

  if (loading) {
    return (
      <Card className="bg-form-green rounded-[12px] cursor-pointer hover:bg-form-green/90 transition-colors">
        <CardContent className="p-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-form-green" />
              </div>
              <div className="flex items-center gap-2">
                <InlineLoader size="small" />
                <span className="font-dm-sans text-white font-medium text-base">
                  Caricamento inviti...
                </span>
              </div>
            </div>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-form-green" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className="bg-form-green rounded-[12px] cursor-pointer hover:bg-form-green/90 transition-colors press-down-effect"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-form-green" />
              </div>
              <span className="font-dm-sans text-white font-medium text-base">
                Visualizza Inviti
              </span>
            </div>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <ChevronRight className="h-3 w-3 text-form-green" />
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectInvitationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
      />
    </>
  );
};

export default ProjectInvitationsSection;
