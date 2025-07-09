
-- Create table to store form link data
CREATE TABLE public.form_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_slug TEXT NOT NULL,
  link TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  -- Add fields for linking to category-user information if needed later
  category_id UUID,
  user_id UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.form_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Superadmins can manage all form links" 
ON public.form_links 
FOR ALL 
USING (user_is_superadmin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_form_links_form_slug ON public.form_links(form_slug);
CREATE INDEX idx_form_links_expires_at ON public.form_links(expires_at);
CREATE INDEX idx_form_links_user_id ON public.form_links(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_form_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_form_links_updated_at
BEFORE UPDATE ON public.form_links
FOR EACH ROW
EXECUTE FUNCTION public.update_form_links_updated_at();
