
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

    // Parse request body and collect all webhook data
    let requestBody;
    let webhookDetails = {
      headers: Object.fromEntries(req.headers.entries()),
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    };

    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
        webhookDetails.body = requestBody;
        console.log('📦 Request body parsed successfully:', {
          hasData: !!requestBody,
          keys: requestBody ? Object.keys(requestBody) : []
        });
      } else {
        console.log('📝 Empty request body received');
        webhookDetails.body = null;
      }
    } catch (parseError) {
      console.log('⚠️ Failed to parse request body as JSON:', parseError.message);
      webhookDetails.body = bodyText;
      webhookDetails.parseError = parseError.message;
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

    // Determine event name from the webhook data
    let eventName = 'webhook_received';
    if (requestBody && typeof requestBody === 'object') {
      // Try to extract event name from common webhook patterns
      eventName = requestBody.event || 
                 requestBody.type || 
                 requestBody.event_type || 
                 requestBody.action || 
                 'webhook_received';
    }

    // Store webhook event in database
    try {
      const { data, error } = await supabaseAdmin
        .from('webhook_logs')
        .insert({
          event_name: eventName,
          details: webhookDetails
        })
        .select();

      if (error) {
        console.error('❌ Failed to store webhook log:', error);
        // Don't fail the webhook if logging fails, just log the error
      } else {
        console.log('✅ Webhook logged to database:', data?.[0]?.id);
      }
    } catch (dbError) {
      console.error('❌ Database error while logging webhook:', dbError);
      // Continue processing even if logging fails
    }

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
