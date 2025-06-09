
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Phone, Calendar, Settings } from 'lucide-react';
import EmailInvitationModal from '@/components/project/EmailInvitationModal';
import AddMemberModal from '@/components/project/AddMemberModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type ProjectMember = {
  id: string;
  user_id: string;
  role: Database['public']['Enums']['user_role'];
  joined_at: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  };
};

const ProjectMembersDashboard = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data as ProjectMember[];
    },
    enabled: !!projectId
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select('name, description')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString();
  };

  const handleMemberAdded = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            Project Members
          </h1>
          <p className="text-muted-foreground">
            Manage members for {project?.name || 'this project'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowEmailModal(true)} className="gap-2">
            <Mail className="h-4 w-4" />
            Send Email Invitation
          </Button>
          <Button onClick={() => setShowCodeModal(true)} variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Generate Code (Legacy)
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="grid gap-4">
        {members?.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {member.profiles.first_name && member.profiles.last_name
                          ? `${member.profiles.first_name} ${member.profiles.last_name}`
                          : 'Name not provided'
                        }
                      </h3>
                      <Badge variant="secondary">
                        {formatRole(member.role)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {member.profiles.email}
                      </div>
                      
                      {member.profiles.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {member.profiles.phone}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Joined: {formatDate(member.joined_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!members || members.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your team by inviting members to this project.
              </p>
              <Button onClick={() => setShowEmailModal(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite First Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {projectId && (
        <>
          <EmailInvitationModal
            isOpen={showEmailModal}
            onClose={() => setShowEmailModal(false)}
            projectId={projectId}
            onMemberAdded={handleMemberAdded}
          />
          
          <AddMemberModal
            isOpen={showCodeModal}
            onClose={() => setShowCodeModal(false)}
            projectId={projectId}
            onMemberAdded={handleMemberAdded}
          />
        </>
      )}
    </div>
  );
};

export default ProjectMembersDashboard;
