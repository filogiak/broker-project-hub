import { useQuery } from '@tanstack/react-query';
import { simulationFormLinksService } from '@/services/simulationFormLinksService';
import { useSimulationParticipants } from './useSimulationParticipants';
import { useEffect, useState } from 'react';

export interface FormLinksState {
  project?: string;
  solo_applicant?: string;
  applicant_one?: string;
  applicant_two?: string;
}

export const useSimulationFormLinks = (simulationId: string) => {
  const { data: participants, isLoading: participantsLoading } = useSimulationParticipants(simulationId);
  const [formLinks, setFormLinks] = useState<FormLinksState>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Query existing form links
  const { data: existingLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['simulation-form-links', simulationId],
    queryFn: () => simulationFormLinksService.getSimulationFormLinks(simulationId),
    enabled: !!simulationId,
  });

  // No longer generate links on-demand - they should be pre-generated at simulation creation
  // If links are missing, we'll show an error state instead of trying to generate them

  // Map existing links from database to our state format
  useEffect(() => {
    if (existingLinks && existingLinks.length > 0) {
      const mappedLinks: FormLinksState = {};
      
      existingLinks.forEach(link => {
        if (link.form_type === 'project') {
          mappedLinks.project = link.link;
        } else if (link.form_type === 'applicant') {
          mappedLinks[link.participant_designation as keyof FormLinksState] = link.link;
        }
      });
      
      setFormLinks(prev => ({ ...prev, ...mappedLinks }));
    }
  }, [existingLinks]);

  const getFormLink = (participantDesignation: string, formType: 'project' | 'applicant'): string | undefined => {
    if (formType === 'project') {
      return formLinks.project;
    }
    return formLinks[participantDesignation as keyof FormLinksState];
  };

  return {
    formLinks,
    getFormLink,
    isLoading: participantsLoading || linksLoading,
    existingLinks,
    hasFormLinks: existingLinks && existingLinks.length > 0,
  };
};