-- Clean up all membership data for filogiac21@gmail.com user
-- This will allow us to test the invitation system from scratch

-- Remove brokerage membership
DELETE FROM brokerage_members WHERE user_id = '6fb110d4-899c-49df-b22c-568cc2e0ecc9';

-- Remove user role
DELETE FROM user_roles WHERE user_id = '6fb110d4-899c-49df-b22c-568cc2e0ecc9';

-- Update invitations to mark them as unused so we can test the flow again
UPDATE invitations 
SET accepted_at = NULL, used_at = NULL 
WHERE email = 'filogiac21@gmail.com' AND expires_at > NOW();