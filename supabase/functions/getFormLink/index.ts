import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetFormLinkRequest {
  name: string;
  email: string;
  phone: string;
  'form-slug': string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('getFormLink function started');
    
    // Parse request body
    const requestBody: GetFormLinkRequest = await req.json();
    const { name, email, phone, 'form-slug': formSlug } = requestBody;
    
    console.log('Request parameters:', { name, email, phone, formSlug });
    
    // Validate required parameters
    if (!name || !email || !phone || !formSlug) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: name, email, phone, form-slug' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get API key from environment
    const apiKey = Deno.env.get('PORTALE_API_KEY');
    if (!apiKey) {
      console.error('PORTALE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construct the API URL with query parameters
    const apiUrl = new URL('https://jegdbtznkwzpqntzzlvf.supabase.co/functions/v1/generateLinkAPI');
    apiUrl.searchParams.append('name', name);
    apiUrl.searchParams.append('email', email);
    apiUrl.searchParams.append('phone', phone);
    apiUrl.searchParams.append('form-slug', formSlug);

    console.log('Making API request to:', apiUrl.toString());

    // Make the GET request to external API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log('API response status:', response.status);

    // Handle error responses
    if (!response.ok) {
      if (response.status === 403) {
        console.error('Unauthorized or not found (403)');
        return new Response(
          JSON.stringify({ error: 'Unauthorized or not found' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.error('API request failed with status:', response.status);
      return new Response(
        JSON.stringify({ 
          error: `API request failed with status: ${response.status}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse response as JSON
    const formLinks = await response.json();
    console.log('API response data:', formLinks);

    console.log('getFormLink function completed successfully');

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        data: formLinks
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in getFormLink function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});