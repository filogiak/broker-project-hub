import { supabase } from '@/integrations/supabase/client';

interface FormLinkRequest {
  name: string;
  email: string;
  phone: string;
  formSlug: string;
}

interface FormLinkResponse {
  success: boolean;
  data?: {
    link: string;
  };
  error?: string;
}

export const formLinkService = {
  async getFormLink(request: FormLinkRequest): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke<FormLinkResponse>('getFormLink', {
        body: {
          name: request.name,
          email: request.email,
          phone: request.phone,
          formSlug: request.formSlug,
        },
      });

      if (error) {
        console.error('Error calling getFormLink function:', error);
        throw new Error('Failed to generate form link');
      }

      if (!data?.success || !data?.data?.link) {
        console.error('Invalid response from getFormLink:', data);
        throw new Error(data?.error || 'Failed to generate form link');
      }

      return data.data.link;
    } catch (error) {
      console.error('Form link service error:', error);
      throw error;
    }
  },
};