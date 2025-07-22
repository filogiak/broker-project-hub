
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MortgageApplicantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's project memberships
  const { data: projectMemberships = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['mortgage-applicant-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          id,
          role,
          joined_at,
          participant_designation,
          project_id,
          projects (
            id,
            name,
            description,
            status,
            applicant_count,
            created_at,
            brokerage_id,
            brokerages (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'mortgage_applicant');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user's simulation memberships
  const { data: simulationMemberships = [], isLoading: simulationsLoading } = useQuery({
    queryKey: ['mortgage-applicant-simulations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('simulation_members')
        .select(`
          id,
          role,
          joined_at,
          participant_designation,
          simulation_id,
          simulations (
            id,
            name,
            description,
            status,
            applicant_count,
            created_at,
            brokerage_id,
            brokerages (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'mortgage_applicant');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleSimulationClick = (simulationId: string) => {
    navigate(`/simulation/${simulationId}`);
  };

  if (projectsLoading || simulationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-form-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-dm-sans">
          Welcome, {user?.email}
        </h1>
        <p className="text-gray-600 font-dm-sans">
          Manage your mortgage applications and simulations
        </p>
      </div>

      {/* Projects Section */}
      <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
        <CardHeader>
          <CardTitle className="font-dm-sans text-xl text-black flex items-center gap-2">
            <FileText className="h-5 w-5 text-form-green" />
            My Projects
          </CardTitle>
          <CardDescription className="font-dm-sans">
            Projects where you are a mortgage applicant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectMemberships.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No projects yet</p>
              <p className="text-sm text-gray-500">
                You'll see projects here when you're invited to participate in mortgage applications.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projectMemberships.map((membership) => {
                const project = membership.projects;
                return (
                  <div
                    key={membership.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <p className="text-gray-600 text-sm">{project.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.brokerages?.name}
                          </span>
                          {membership.joined_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(membership.joined_at).toLocaleDateString('it-IT')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">{project.status}</Badge>
                        {membership.participant_designation && (
                          <Badge variant="outline" className="text-xs">
                            {membership.participant_designation.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulations Section */}
      <Card className="bg-white border border-[#BEB8AE] rounded-[12px]">
        <CardHeader>
          <CardTitle className="font-dm-sans text-xl text-black flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-form-green" />
            My Simulations
          </CardTitle>
          <CardDescription className="font-dm-sans">
            Simulations where you are practicing as a mortgage applicant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {simulationMemberships.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No simulations yet</p>
              <p className="text-sm text-gray-500">
                You'll see simulations here when you're invited to practice mortgage applications.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {simulationMemberships.map((membership) => {
                const simulation = membership.simulations;
                return (
                  <div
                    key={membership.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSimulationClick(simulation.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{simulation.name}</h3>
                        <p className="text-gray-600 text-sm">{simulation.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {simulation.brokerages?.name}
                          </span>
                          {membership.joined_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {new Date(membership.joined_at).toLocaleDateString('it-IT')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">{simulation.status}</Badge>
                        {membership.participant_designation && (
                          <Badge variant="outline" className="text-xs">
                            {membership.participant_designation.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MortgageApplicantDashboard;
