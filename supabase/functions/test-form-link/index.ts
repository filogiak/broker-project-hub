import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the API key from Supabase secrets
    const apiKey = Deno.env.get('FORM_LINKS_API_KEY')
    if (!apiKey) {
      throw new Error('FORM_LINKS_API_KEY not configured')
    }

    // Get the form slug from request body or use default
    const { form_slug = 'simulazione-mutuo' } = await req.json().catch(() => ({}))

    console.log('Making API call to external service with form_slug:', form_slug)

    // Call the external API
    const response = await fetch('https://6f5c6f22-20c2-4c4a-9617-4b072ae0ec30.supabase.co/functions/v1/create-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        form_slug: form_slug
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('External API error:', response.status, errorText)
      throw new Error(`External API call failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('External API response:', data)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')
    let userId = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
    }

    // Store the data in our database
    const { error: insertError } = await supabase
      .from('form_links')
      .insert({
        form_slug: form_slug,
        link: data.link,
        token: data.token,
        expires_at: data.expires_at,
        created_by: userId
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error(`Database insert failed: ${insertError.message}`)
    }

    console.log('Data stored successfully in form_links table')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Form link created and stored successfully',
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in test-form-link function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})