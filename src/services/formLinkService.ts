
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
    const startTime = Date.now();
    console.log('[FORM LINK SERVICE] Starting form link generation:', {
      name: request.name,
      email: request.email,
      formSlug: request.formSlug,
      timestamp: new Date().toISOString()
    });

    try {
      // Create timeout promise (60 seconds for individual calls)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Form link generation timeout after 60 seconds'));
        }, 60000);
      });

      // Create the actual API call promise
      const apiCallPromise = supabase.functions.invoke<FormLinkResponse>('getFormLink', {
        body: {
          name: request.name,
          email: request.email,
          phone: request.phone,
          formSlug: request.formSlug,
        },
      });

      // Race between timeout and API call
      const { data, error } = await Promise.race([apiCallPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      console.log(`[FORM LINK SERVICE] API call completed in ${duration}ms`);

      if (error) {
        console.error('[FORM LINK SERVICE] Error calling getFormLink function:', error);
        throw new Error(`Failed to generate form link: ${error.message || 'Unknown error'}`);
      }

      if (!data?.success || !data?.data?.link) {
        console.error('[FORM LINK SERVICE] Invalid response from getFormLink:', data);
        throw new Error(data?.error || 'Failed to generate form link - invalid response');
      }

      console.log('[FORM LINK SERVICE] Form link generated successfully');
      return data.data.link;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[FORM LINK SERVICE] Form link generation failed after ${duration}ms:`, error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Form link generation timed out. Please try again.');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error during form link generation. Please check your connection.');
        }
        throw error;
      }
      
      throw new Error('Unknown error during form link generation');
    }
  },
};
