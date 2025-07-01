
import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { login, signUp } from '@/services/authService';
import { UnifiedInvitationService } from '@/services/unifiedInvitationService';
import { toast } from 'sonner';

const AuthPage = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingInvitation, setIsProcessingInvitation] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '' 
  });

  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const acceptInvitationToken = searchParams.get('accept_invitation');

  // Enhanced invitation acceptance with comprehensive logging and retry mechanism
  useEffect(() => {
    const handleInvitationAcceptance = async () => {
      if (!user || !acceptInvitationToken || loading || isProcessingInvitation) {
        return;
      }

      console.log('🎯 [INVITATION DEBUG] Starting invitation acceptance process');
      console.log('🎯 [INVITATION DEBUG] User:', { 
        id: user.id, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName 
      });
      console.log('🎯 [INVITATION DEBUG] Token:', acceptInvitationToken);
      console.log('🎯 [INVITATION DEBUG] Redirect path:', redirectPath);

      setIsProcessingInvitation(true);

      try {
        // Phase 1: Validate token format
        if (!acceptInvitationToken || acceptInvitationToken.length < 10) {
          throw new Error('Invalid invitation token format');
        }

        // Phase 2: Extended delay to ensure user data is fully loaded
        console.log('🎯 [INVITATION DEBUG] Waiting 3 seconds for user data to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Phase 3: Verify user profile completeness
        if (!user.email) {
          throw new Error('User profile incomplete - missing email');
        }

        console.log('🎯 [INVITATION DEBUG] Processing invitation with UnifiedInvitationService');
        
        // Attempt invitation processing with retry mechanism
        let attempt = 1;
        let result = null;
        const maxAttempts = 3;

        while (attempt <= maxAttempts && !result?.success) {
          console.log(`🎯 [INVITATION DEBUG] Attempt ${attempt}/${maxAttempts}`);
          
          try {
            result = await UnifiedInvitationService.processInvitationAcceptance(
              user.email,
              acceptInvitationToken,
              user.id
            );

            console.log(`🎯 [INVITATION DEBUG] Attempt ${attempt} result:`, result);

            if (result.success) {
              console.log('✅ [INVITATION DEBUG] Invitation accepted successfully!');
              
              const successMessage = result.duplicate_membership 
                ? `You were already a member: ${result.message}`
                : `Successfully joined the project!`;
              
              toast.success(successMessage, {
                duration: 5000,
                description: result.project_id ? `Project ID: ${result.project_id}` : undefined
              });
              
              // Clear URL parameters and redirect appropriately
              const finalRedirectPath = result.project_id 
                ? `/project/${result.project_id}` 
                : redirectPath;
              
              console.log('🎯 [INVITATION DEBUG] Redirecting to:', finalRedirectPath);
              window.history.replaceState({}, '', finalRedirectPath);
              
              break;
            } else {
              console.warn(`⚠️ [INVITATION DEBUG] Attempt ${attempt} failed:`, result.error);
              
              if (attempt === maxAttempts) {
                throw new Error(result.error || 'Failed to process invitation after all attempts');
              }
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (attemptError) {
            console.error(`❌ [INVITATION DEBUG] Attempt ${attempt} error:`, attemptError);
            
            if (attempt === maxAttempts) {
              throw attemptError;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          attempt++;
        }

      } catch (error) {
        console.error('❌ [INVITATION DEBUG] Critical error processing invitation:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        toast.error('Failed to process invitation', {
          duration: 10000,
          description: `Error: ${errorMessage}. Please try again or contact support.`
        });
        
        // Don't clear URL parameters on error so user can retry
        console.log('🎯 [INVITATION DEBUG] Keeping URL parameters for retry');
        
      } finally {
        setIsProcessingInvitation(false);
      }
    };

    // Only process if we have all required data
    if (user && acceptInvitationToken && !loading) {
      handleInvitationAcceptance();
    }
  }, [user, acceptInvitationToken, loading, redirectPath, isProcessingInvitation]);

  // Redirect if already authenticated (after invitation processing if needed)
  if (user && !loading && !isProcessingInvitation) {
    console.log('🎯 [INVITATION DEBUG] User authenticated, redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('🔐 [LOGIN DEBUG] Starting login process');
    console.log('🔐 [LOGIN DEBUG] Has invitation token:', !!acceptInvitationToken);
    
    try {
      await login(loginForm.email, loginForm.password);
      console.log('✅ [LOGIN DEBUG] Login successful');
      toast.success('Logged in successfully!');
      // Navigation and invitation processing will be handled by useEffect
    } catch (error: any) {
      console.error('❌ [LOGIN DEBUG] Login error:', error);
      toast.error(error.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('📝 [SIGNUP DEBUG] Starting signup process');
    console.log('📝 [SIGNUP DEBUG] Has invitation token:', !!acceptInvitationToken);
    
    try {
      await signUp(
        signupForm.email, 
        signupForm.password, 
        signupForm.firstName, 
        signupForm.lastName
      );
      console.log('✅ [SIGNUP DEBUG] Signup successful');
      toast.success('Account created successfully! Please check your email to verify your account.');
    } catch (error: any) {
      console.error('❌ [SIGNUP DEBUG] Signup error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Broker Project Hub</h1>
          <p className="text-muted-foreground">AI-powered mortgage intermediation platform</p>
          {acceptInvitationToken && (
            <p className="text-sm text-blue-600 mt-2 font-medium">
              🎯 Login to accept your project invitation
            </p>
          )}
          {isProcessingInvitation && (
            <p className="text-sm text-orange-600 mt-2 font-medium animate-pulse">
              ⏳ Processing your invitation...
            </p>
          )}
        </div>
        
        <Card className="card-primary">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              {acceptInvitationToken 
                ? "Sign in to accept your invitation and join the project"
                : "Sign in to your account or create a new one"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || isProcessingInvitation}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstName">First Name</Label>
                      <Input
                        id="signup-firstName"
                        placeholder="John"
                        value={signupForm.firstName}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastName">Last Name</Label>
                      <Input
                        id="signup-lastName"
                        placeholder="Doe"
                        value={signupForm.lastName}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || isProcessingInvitation}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
