
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`[${requestId}] getFormLink function started`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling OPTIONS preflight request`);
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log(`[${requestId}] Method ${req.method} not allowed`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body with timeout
    const bodyPromise = req.json();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request body parsing timeout')), 5000);
    });
    
    const body = await Promise.race([bodyPromise, timeoutPromise]);
    
    console.log(`[${requestId}] Request body parsed:`, {
      name: body.name ? '✓' : '❌',
      email: body.email ? '✓' : '❌',
      phone: body.phone ? '✓' : '❌',
      formSlug: body.formSlug ? '✓' : '❌'
    });

    // Validate required fields
    const { name, email, phone, formSlug } = body;
    if (!name || !email || !phone || !formSlug) {
      console.log(`[${requestId}] Missing required parameters`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameters: name, email, phone, formSlug' 
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
      console.log(`[${requestId}] API key not configured`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log(`[${requestId}] API key loaded successfully`);

    // Construct URL with query parameters
    const baseUrl = 'https://jegdbtznkwzpqntzzlvf.functions.supabase.co/generateLinkAPI';
    const url = new URL(baseUrl);
    url.searchParams.append('name', name);
    url.searchParams.append('email', email);
    url.searchParams.append('phone', phone);
    url.searchParams.append('form-slug', formSlug);

    console.log(`[${requestId}] Constructed URL for external API call`);

    // Make GET request to external API with timeout
    console.log(`[${requestId}] Making request to external API...`);
    
    const fetchPromise = fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    const fetchTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('External API timeout')), 45000); // 45 seconds
    });

    const response = await Promise.race([fetchPromise, fetchTimeoutPromise]);
    const duration = Date.now() - startTime;
    
    console.log(`[${requestId}] External API response received in ${duration}ms - Status: ${response.status}`);

    // Handle different response statuses
    if (response.status === 403) {
      console.log(`[${requestId}] Unauthorized or not found (403)`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Unauthorized or not found' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!response.ok) {
      console.log(`[${requestId}] API request failed with status: ${response.status}`);
      
      // Try to get error details from response
      let errorDetails = 'Unknown error';
      try {
        const errorResponse = await response.text();
        errorDetails = errorResponse || `HTTP ${response.status}`;
      } catch (e) {
        console.warn(`[${requestId}] Could not parse error response:`, e);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `External API error: ${errorDetails}`,
          status: response.status 
        }),
        { 
          status: response.status >= 500 ? 500 : 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse successful response
    const data = await response.json();
    const totalDuration = Date.now() - startTime;
    
    console.log(`[${requestId}] Total operation completed in ${totalDuration}ms - Success: ✓`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Error in getFormLink function after ${duration}ms:`, error);
    
    // Categorize errors for better user experience
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check connectivity.';
        statusCode = 503;
      } else if (error.message.includes('parsing')) {
        errorMessage = 'Invalid request format.';
        statusCode = 400;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
