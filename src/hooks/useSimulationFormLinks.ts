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

  // Generate missing links when participants are loaded
  useEffect(() => {
    const generateMissingLinks = async () => {
      if (!participants || participants.length === 0 || participantsLoading || isGenerating) {
        return;
      }

      setIsGenerating(true);
      try {
        const generatedLinks = await simulationFormLinksService.generateAllFormLinks(simulationId, participants);
        setFormLinks(generatedLinks);
      } catch (error) {
        console.error('Error generating form links:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateMissingLinks();
  }, [participants, participantsLoading, simulationId, isGenerating]);

  // Map existing links from database to our state format
  useEffect(() => {
    if (existingLinks && existingLinks.length > 0) {
      const mappedLinks: FormLinksState = {};
      
      existingLinks.forEach(link => {
        if (link.form_type === 'project') {
          mappedLinks.project = link.link;
        } else if (link.form_type === 'participant') {
          mappedLinks[link.participant_designation as keyof FormLinksState] = link.link;
        }
      });
      
      setFormLinks(prev => ({ ...prev, ...mappedLinks }));
    }
  }, [existingLinks]);

  const getFormLink = (participantDesignation: string, formType: 'project' | 'participant'): string | undefined => {
    if (formType === 'project') {
      return formLinks.project;
    }
    return formLinks[participantDesignation as keyof FormLinksState];
  };

  return {
    formLinks,
    getFormLink,
    isLoading: participantsLoading || linksLoading || isGenerating,
    existingLinks,
  };
};