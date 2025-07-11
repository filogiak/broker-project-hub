
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  console.log('🚀 receiveFormWebhook function started');

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
      console.log(`❌ Method ${req.method} not allowed - only POST accepted`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed - only POST requests accepted' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get API key from environment
    const expectedApiKey = Deno.env.get('PORTALE_API_KEY');
    if (!expectedApiKey) {
      console.log('❌ PORTALE_API_KEY not configured in environment');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('🔑 API key loaded from environment successfully');

    // Extract and validate x-api-key header
    const providedApiKey = req.headers.get('x-api-key');
    if (!providedApiKey) {
      console.log('🚫 Missing x-api-key header in request');
      return new Response(
        JSON.stringify({ error: 'Missing x-api-key header' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate API key
    if (providedApiKey !== expectedApiKey) {
      console.log('🚫 Invalid API key provided - authentication failed');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid API key' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ API key validated successfully');
    console.log('🎯 Webhook received');

    // Parse request body for potential future use
    let requestBody;
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
        console.log('📦 Request body parsed successfully:', {
          hasData: !!requestBody,
          keys: requestBody ? Object.keys(requestBody) : []
        });
      } else {
        console.log('📝 Empty request body received');
      }
    } catch (parseError) {
      console.log('⚠️ Failed to parse request body as JSON:', parseError.message);
      // Don't fail the webhook for parsing errors - log and continue
    }

    // Initialize Supabase client with service role (bypassing RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    console.log('🗄️ Supabase admin client initialized (RLS bypassed)');

    // Future webhook processing logic can be added here
    // For now, we just log the successful webhook reception
    console.log('🎉 Webhook processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook received and processed successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in receiveFormWebhook function:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: 'An unexpected error occurred while processing the webhook'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
