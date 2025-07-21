
import { supabase } from '@/integrations/supabase/client';

interface FormLinkRequest {
  name: string;
  email: string;
  phone: string;
  formSlug: string;
  simulationId?: string; // Add simulation context for RLS
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
    console.log('[FORM LINK SERVICE] Starting form link generation with context:', {
      name: request.name,
      email: request.email,
      formSlug: request.formSlug,
      simulationId: request.simulationId,
      timestamp: new Date().toISOString()
    });

    try {
      // Create timeout promise (60 seconds for individual calls)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Form link generation timeout after 60 seconds'));
        }, 60000);
      });

      // Enhanced request body with simulation context
      const requestBody = {
        name: request.name,
        email: request.email,
        phone: request.phone,
        formSlug: request.formSlug,
        simulationId: request.simulationId, // Pass context for RLS
      };

      // Create the actual API call promise with enhanced error handling
      const apiCallPromise = supabase.functions.invoke<FormLinkResponse>('getFormLink', {
        body: requestBody,
      });

      // Race between timeout and API call
      const { data, error } = await Promise.race([apiCallPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      console.log(`[FORM LINK SERVICE] API call completed in ${duration}ms`);

      if (error) {
        console.error('[FORM LINK SERVICE] Error calling getFormLink function:', error);
        
        // Enhanced error classification
        let errorMessage = 'Failed to generate form link';
        if (error.message) {
          if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
            errorMessage = 'Database access denied. Please ensure you have proper permissions.';
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection.';
          } else {
            errorMessage = `Form link generation failed: ${error.message}`;
          }
        }
        
        throw new Error(errorMessage);
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
      
      // Provide more specific error messages for better UX
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Form link generation timed out. Please try again.');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error during form link generation. Please check your connection.');
        }
        if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
          throw new Error('Database permission error. Please contact support if this persists.');
        }
        throw error;
      }
      
      throw new Error('Unknown error during form link generation');
    }
  },
};
