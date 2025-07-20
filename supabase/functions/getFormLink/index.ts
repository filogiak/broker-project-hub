
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 getFormLink function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('📋 Handling OPTIONS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log(`❌ Method ${req.method} not allowed`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body with timeout
    const requestPromise = req.json();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request parsing timeout')), 5000);
    });
    
    const body = await Promise.race([requestPromise, timeoutPromise]);
    console.log('📥 Input values received:', {
      name: body.name ? '✓' : '❌',
      email: body.email ? '✓' : '❌',
      phone: body.phone ? '✓' : '❌',
      formSlug: body.formSlug ? '✓' : '❌'
    });

    // Validate required fields
    const { name, email, phone, formSlug } = body;
    if (!name || !email || !phone || !formSlug) {
      console.log('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: name, email, phone, formSlug' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get API key from environment
    const apiKey = Deno.env.get('PORTALE_API_KEY');
    if (!apiKey) {
      console.log('❌ API key not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('🔑 API key loaded successfully');

    // Construct URL with query parameters
    const baseUrl = 'https://jegdbtznkwzpqntzzlvf.functions.supabase.co/generateLinkAPI';
    const url = new URL(baseUrl);
    url.searchParams.append('name', name);
    url.searchParams.append('email', email);
    url.searchParams.append('phone', phone);
    url.searchParams.append('form-slug', formSlug);

    console.log('🔗 Built URL:', url.toString());

    // Make GET request to external API with enhanced timeout and retry logic
    console.log('📡 Making request to external API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📊 Response status:', response.status);

      // Handle different response statuses with better error messages
      if (response.status === 403) {
        console.log('🚫 Unauthorized or not found (403)');
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized access to form generation API',
            details: 'API key may be invalid or form slug not found'
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (response.status === 429) {
        console.log('⏳ Rate limit exceeded (429)');
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            details: 'Too many requests to form generation API'
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.log(`❌ API request failed with status: ${response.status}, body: ${errorText}`);
        return new Response(
          JSON.stringify({ 
            error: 'External API request failed', 
            status: response.status,
            details: errorText
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Parse successful response with validation
      const data = await response.json();
      console.log('✅ Final parsed result:', data);

      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.log('❌ Invalid response structure');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid response from form generation API',
            details: 'Response is not a valid JSON object'
          }),
          { 
            status: 502, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

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

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.log('⏰ Request timeout (45s)');
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout',
            details: 'Form generation API took too long to respond'
          }),
          { 
            status: 504, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw fetchError; // Re-throw non-timeout errors
    }

  } catch (error) {
    console.error('💥 Error in getFormLink function:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - external API is not responding';
      statusCode = 504;
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error - unable to reach external API';
      statusCode = 502;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
