
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Mail, Clock, Users } from 'lucide-react';
import { getProjectInvitations, InvitationWithStatus } from '@/services/projectInvitationService';
import ProjectInvitationsModal from './ProjectInvitationsModal';

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

  const getInvitationsSummary = () => {
    const pending = invitations.filter(inv => inv.status === 'pending').length;
    const total = invitations.length;
    return { pending, total };
  };

  const summary = getInvitationsSummary();

  if (loading) {
    return (
      <Card className="bg-form-green/10 border-form-green rounded-[12px] cursor-pointer hover:bg-form-green/15 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-form-green rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="font-dm-sans text-form-green font-medium text-lg">
                Caricamento inviti...
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-form-green" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className="bg-form-green/10 border-form-green rounded-[12px] cursor-pointer hover:bg-form-green/15 transition-colors press-down-effect"
        onClick={() => setIsModalOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-form-green rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-dm-sans text-form-green font-medium text-lg">
                  Visualizza Inviti
                </span>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm text-form-green/80">
                    <Users className="h-3 w-3" />
                    <span>Totale: {summary.total}</span>
                  </div>
                  {summary.pending > 0 && (
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <Clock className="h-3 w-3" />
                      <span>In Attesa: {summary.pending}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-form-green" />
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
