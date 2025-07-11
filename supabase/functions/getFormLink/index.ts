
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

    // Parse request body
    const body = await req.json();
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
    url.searchParams.append('form-slug', formSlug); // Note: formSlug becomes form-slug

    console.log('🔗 Built URL:', url.toString());

    // Make GET request to external API
    console.log('📡 Making request to external API...');
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);

    // Handle different response statuses
    if (response.status === 403) {
      console.log('🚫 Unauthorized or not found (403)');
      return new Response(
        JSON.stringify({ error: 'Unauthorized or not found' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!response.ok) {
      console.log(`❌ API request failed with status: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          error: 'API request failed', 
          status: response.status 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse successful response
    const data = await response.json();
    console.log('✅ Final parsed result:', data);

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
    console.error('💥 Error in getFormLink function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
