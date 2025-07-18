
import type { Database } from '@/integrations/supabase/types';

type SimulationParticipant = Database['public']['Tables']['simulation_participants']['Row'];

export const formatParticipantName = (firstName: string | null, lastName: string | null): string => {
  if (!firstName && !lastName) return '';
  return `${firstName || ''} ${lastName || ''}`.trim();
};

export const getParticipantDisplayNames = (participants: SimulationParticipant[]) => {
  // Sort participants by designation priority for consistent display
  const sortedParticipants = [...participants].sort((a, b) => {
    const priority = {
      'applicant_one': 1,
      'applicant_two': 2,
      'guarantor': 3,
      'co_applicant': 4
    };
    return (priority[a.participant_designation] || 999) - (priority[b.participant_designation] || 999);
  });

  const primaryParticipant = sortedParticipants.find(p => 
    p.participant_designation === 'applicant_one'
  ) || sortedParticipants[0];

  const secondaryParticipant = sortedParticipants.find(p => 
    p.participant_designation === 'applicant_two'
  ) || sortedParticipants.find(p => 
    p.participant_designation !== primaryParticipant?.participant_designation
  );

  return {
    primaryParticipant: primaryParticipant 
      ? formatParticipantName(primaryParticipant.first_name, primaryParticipant.last_name) || 'Nome non disponibile'
      : 'Nome non disponibile',
    secondaryParticipant: secondaryParticipant 
      ? formatParticipantName(secondaryParticipant.first_name, secondaryParticipant.last_name)
      : null
  };
};
