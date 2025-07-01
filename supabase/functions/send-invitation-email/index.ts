import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invitationId: string;
  email: string;
  projectName: string;
  role: string;
  inviterName: string;
  encryptedToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { invitationId, email, projectName, role, inviterName, encryptedToken }: InvitationEmailRequest = await req.json();

    console.log("📧 Sending invitation email:", { invitationId, email, projectName, role });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    const userExists = !!existingUser;
    const roleDisplayName = role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const baseUrl = Deno.env.get("SITE_URL") || "http://localhost:3000";

    let inviteUrl: string;
    let buttonText: string;
    let mainMessage: string;
    let instructions: string;

    if (userExists) {
      // Existing user - direct them to login with invitation acceptance
      inviteUrl = `${baseUrl}/auth?redirect=/dashboard&accept_invitation=${encryptedToken}`;
      buttonText = "Login & Accept Invitation";
      mainMessage = `You've been invited to join <strong>${projectName}</strong> as a <strong>${roleDisplayName}</strong>.`;
      instructions = "Since you already have an account, simply login to accept this invitation and join the project.";
    } else {
      // New user - direct them to the signup flow
      inviteUrl = `${baseUrl}/invite/join/${encryptedToken}`;
      buttonText = "Create Account & Accept Invitation";
      mainMessage = `You've been invited to join <strong>${projectName}</strong> as a <strong>${roleDisplayName}</strong>.`;
      instructions = "Create your account to join the project and start collaborating with the team.";
    }

    const emailResponse = await resend.emails.send({
      from: "Invitations <noreply@gomutuo.it>",
      to: [email],
      subject: `You're invited to join ${projectName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Join ${projectName} as ${roleDisplayName}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi there! 👋
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> as a <strong>${roleDisplayName}</strong>.
            </p>

            <p style="font-size: 16px; margin-bottom: 20px; color: #666;">
              ${instructions}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                ${buttonText}
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This invitation will expire in 7 days. If you can't click the button above, copy and paste this link into your browser:
            </p>
            
            <p style="font-size: 12px; color: #888; word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
              ${inviteUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #888; text-align: center;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Email sent successfully to ${userExists ? 'existing' : 'new'} user:`, emailResponse);

    // Update invitation record to mark email as sent
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ 
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error("❌ Error updating invitation:", updateError);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-invitation-email function:", error);
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
