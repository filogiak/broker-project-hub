
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔗 [INVITE PAGE] Invitation page accessed with token:', token);
    
    // Redirect to auth page with invitation context
    // The new flow: Email link → Auth page → Dashboard → Accept invitation from widget
    navigate('/auth?invitation=true', { replace: true });
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            Redirecting...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            You're being redirected to login. After logging in, check your dashboard to accept invitations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitePage;
