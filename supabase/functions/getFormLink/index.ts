
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('getFormLink function started');
    
    // Only handle GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract API key from headers
    const apiKeyHeader = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('PORTALE_API_KEY');
    
    if (!expectedApiKey) {
      console.error('PORTALE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate API key
    if (!apiKeyHeader || apiKeyHeader !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract query parameters from URL
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const email = url.searchParams.get('email');
    const phone = url.searchParams.get('phone');
    const formSlug = url.searchParams.get('form-slug');
    
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

    // Generate the final link based on the provided parameters
    const baseUrl = 'https://form.example.com'; // Replace with actual form base URL
    const finalLink = `${baseUrl}/${formSlug}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;

    console.log('Generated final link:', finalLink);
    console.log('getFormLink function completed successfully');

    // Return successful response in the required format
    return new Response(
      JSON.stringify({
        link: finalLink,
        status: "success"
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
