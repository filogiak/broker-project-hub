
import type { Database } from '@/integrations/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export const formatApplicantName = (firstName: string | null, lastName: string | null): string => {
  if (!firstName && !lastName) return '';
  return `${firstName || ''} ${lastName || ''}`.trim();
};

export const getApplicantDisplayNames = (project: Project) => {
  const applicant1Name = formatApplicantName(
    project.applicant_one_first_name, 
    project.applicant_one_last_name
  );
  
  const applicant2Name = formatApplicantName(
    project.applicant_two_first_name, 
    project.applicant_two_last_name
  );

  // For single applicant projects, return primary applicant in first slot
  if (project.applicant_count === 'one_applicant') {
    return {
      primaryApplicant: applicant1Name || 'Nome non disponibile',
      secondaryApplicant: null
    };
  }

  // For multi-applicant projects
  return {
    primaryApplicant: applicant1Name || 'Nome non disponibile',
    secondaryApplicant: applicant2Name || null
  };
};
