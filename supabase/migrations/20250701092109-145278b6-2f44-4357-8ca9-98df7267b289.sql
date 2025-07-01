
-- First, clean up duplicate invitations
WITH duplicate_invitations AS (
  SELECT email, project_id, COUNT(*) as count
  FROM public.invitations 
  WHERE accepted_at IS NULL AND expires_at > NOW()
  GROUP BY email, project_id 
  HAVING COUNT(*) > 1
),
ranked_invitations AS (
  SELECT i.id, i.email, i.project_id,
    ROW_NUMBER() OVER (PARTITION BY i.email, i.project_id ORDER BY i.created_at DESC) as rn
  FROM public.invitations i
  INNER JOIN duplicate_invitations d ON i.email = d.email AND i.project_id = d.project_id
  WHERE i.accepted_at IS NULL AND i.expires_at > NOW()
)
-- Delete all but the most recent invitation for each email/project combination
DELETE FROM public.invitations 
WHERE id IN (
  SELECT id FROM ranked_invitations WHERE rn > 1
);

-- Add unique constraint to prevent duplicate pending invitations
ALTER TABLE public.invitations ADD CONSTRAINT unique_pending_invitation_per_project 
UNIQUE (email, project_id) DEFERRABLE INITIALLY DEFERRED;

-- Create index to improve performance on invitation lookups (without WHERE clause to avoid immutable function issue)
CREATE INDEX IF NOT EXISTS idx_invitations_email_project 
ON public.invitations (email, project_id);
