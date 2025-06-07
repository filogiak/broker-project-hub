import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AuthErrorBoundary = ({ children, fallback }: AuthErrorBoundaryProps) => {
  const { sessionError, refreshUser, loading } = useAuth();

  // If there's a session error, show error UI
  if (sessionError && !loading) {
    const defaultFallback = (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Authentication Error
            </CardTitle>
            <CardDescription>
              Your session has expired or there was an authentication issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Error: {sessionError}
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => refreshUser()}
                className="w-full"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Retry Authentication
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/auth'}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

    return fallback || defaultFallback;
  }

  // Otherwise, render children normally
  return <>{children}</>;
};

export default AuthErrorBoundary;
