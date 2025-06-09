
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvitationRequest {
  invitationId: string;
  email: string;
  role: string;
  projectName?: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 [SEND INVITATION] Starting email send process...');
    
    const { invitationId, email, role, projectName, inviterName }: SendInvitationRequest = await req.json();
    
    console.log('📧 [SEND INVITATION] Request data:', { invitationId, email, role, projectName, inviterName });

    // Get invitation details and generate token
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      console.error('❌ [SEND INVITATION] Invitation not found:', invitationError);
      throw new Error('Invitation not found');
    }

    // Generate invitation token if not exists
    let invitationToken = invitation.invitation_token;
    if (!invitationToken) {
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
      
      if (tokenError || !tokenData) {
        console.error('❌ [SEND INVITATION] Token generation failed:', tokenError);
        throw new Error('Failed to generate invitation token');
      }
      
      invitationToken = tokenData;
      
      // Update invitation with token
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ invitation_token: invitationToken })
        .eq('id', invitationId);

      if (updateError) {
        console.error('❌ [SEND INVITATION] Token update failed:', updateError);
        throw new Error('Failed to update invitation token');
      }
    }

    // Create invitation URL
    const baseUrl = req.headers.get('origin') || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invite/join/${invitationToken}`;
    
    console.log('🔗 [SEND INVITATION] Generated invitation URL:', invitationUrl);

    // Format role for display
    const roleDisplay = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Real Estate Platform <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join${projectName ? ` ${projectName}` : ' a project'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">You're Invited!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Join our real estate platform</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">
                Hello there! 👋
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">
                ${inviterName ? `<strong>${inviterName}</strong>` : 'Someone'} has invited you to join${projectName ? ` the <strong>${projectName}</strong> project` : ' a project'} as a <strong>${roleDisplay}</strong>.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Your Role</h3>
                <p style="margin: 0; font-size: 16px; color: #666; font-weight: 500;">${roleDisplay}</p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">
                Click the button below to create your account and join the team. You'll be able to set up your profile and start collaborating right away.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Join the Team
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 30px 0 0 0; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
              </p>
              
              <div style="border-top: 1px solid #eee; margin-top: 40px; padding-top: 20px;">
                <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
                  This invitation will expire in 7 days. If you have any questions, please contact your team administrator.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ [SEND INVITATION] Email sent successfully:', emailResponse);

    // Update invitation with email sent timestamp
    const { error: emailUpdateError } = await supabase
      .from('invitations')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (emailUpdateError) {
      console.error('⚠️ [SEND INVITATION] Failed to update email timestamp:', emailUpdateError);
      // Don't throw error as email was sent successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationUrl,
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ [SEND INVITATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
