
-- Create webhook_logs table to store webhook events
CREATE TABLE public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_logs table
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for superadmins to manage webhook logs
CREATE POLICY "Superadmins can manage all webhook logs" 
  ON public.webhook_logs 
  FOR ALL 
  USING (user_is_superadmin(auth.uid()));

-- Create an index on created_at for better query performance
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- Create an index on event_name for filtering by event type
CREATE INDEX idx_webhook_logs_event_name ON public.webhook_logs(event_name);
