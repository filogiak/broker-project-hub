import { supabase } from '@/integrations/supabase/client';

export interface FormLinkParams {
  name: string;
  email: string;
  phone: string;
  formSlug: string;
}

export interface FormLinkResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const getFormLink = async (params: FormLinkParams): Promise<FormLinkResponse> => {
  console.log('🔗 Starting form link generation process', params);
  
  try {
    // Construct the URL with query parameters
    const baseUrl = 'https://jegdbtznkwzpqntzzlvf.supabase.co/functions/v1/generateLinkAPI';
    const urlParams = new URLSearchParams({
      name: params.name,
      email: params.email,
      phone: params.phone,
      'form-slug': params.formSlug
    });
    const fullUrl = `${baseUrl}?${urlParams.toString()}`;
    
    console.log('🌐 Making GET request to:', fullUrl);
    
    // Get the API key from Supabase secrets
    const { data: secretData, error: secretError } = await supabase.functions.invoke('get-secret', {
      body: { name: 'PORTALE_API_KEY' }
    });
    
    if (secretError) {
      console.error('❌ Failed to get API key:', secretError);
      return {
        success: false,
        error: 'Failed to retrieve API key'
      };
    }
    
    const apiKey = secretData?.value;
    if (!apiKey) {
      console.error('❌ API key not found in secrets');
      return {
        success: false,
        error: 'API key not configured'
      };
    }
    
    console.log('🔑 API key retrieved successfully');
    
    // Make the GET request
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    // Handle specific error cases
    if (response.status === 403) {
      console.error('❌ Unauthorized access (403)');
      return {
        success: false,
        error: 'Unauthorized or not found'
      };
    }
    
    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
      return {
        success: false,
        error: `Request failed with status ${response.status}`
      };
    }
    
    // Parse the JSON response
    const formLinks = await response.json();
    console.log('✅ Form links generated successfully:', formLinks);
    
    return {
      success: true,
      data: formLinks
    };
    
  } catch (error) {
    console.error('❌ Error in getFormLink:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};