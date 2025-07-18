
import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { login, signUp } from '@/services/authService';
import { validateAndProcessInvitationToken } from '@/services/invitationTokenService';
import { toast } from 'sonner';

const AuthPage = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '' 
  });
  const [invitationContext, setInvitationContext] = useState<any>(null);

  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const invitationToken = searchParams.get('invitation_token');
  const invitationEmail = searchParams.get('email');
  const suggestedAction = searchParams.get('action'); // 'login' or 'signup'
  const hasInvitation = Boolean(invitationToken);

  // Load invitation context if token is provided
  useEffect(() => {
    const loadInvitationContext = async () => {
      if (invitationToken) {
        try {
          console.log('🔍 [AUTH] Loading invitation context for token');
          const tokenValidation = await validateAndProcessInvitationToken(invitationToken);
          
          if (tokenValidation.invitation) {
            setInvitationContext({
              invitation: tokenValidation.invitation,
              role: tokenValidation.invitation.role,
              projectName: tokenValidation.invitation.project_id ? 'project invitation' : null,
              brokerageName: tokenValidation.invitation.brokerage_id ? 'brokerage invitation' : null,
              simulationName: tokenValidation.invitation.simulation_id ? 'simulation invitation' : null
            });
            console.log('✅ [AUTH] Invitation context loaded:', tokenValidation.invitation);
          }
        } catch (error) {
          console.error('❌ [AUTH] Failed to load invitation context:', error);
          toast.error('Failed to load invitation details');
        }
      }
    };

    loadInvitationContext();
  }, [invitationToken]);

  // Set up initial form state and tab based on invitation context
  useEffect(() => {
    if (hasInvitation && invitationEmail) {
      // Pre-fill email in both forms
      setLoginForm(prev => ({ ...prev, email: invitationEmail }));
      setSignupForm(prev => ({ ...prev, email: invitationEmail }));
      
      // Set tab based on suggested action
      if (suggestedAction === 'signup') {
        setActiveTab('signup');
      } else if (suggestedAction === 'login') {
        setActiveTab('login');
      } else {
        // Default to signup tab for new users coming from invitation
        setActiveTab('signup');
      }
    }
  }, [hasInvitation, invitationEmail, suggestedAction]);

  // Redirect if already authenticated
  if (user && !loading) {
    console.log('🎯 [AUTH] User authenticated, redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('🔐 [LOGIN] Starting login process');
    console.log('🔐 [LOGIN] Has invitation:', hasInvitation);
    
    try {
      await login(loginForm.email, loginForm.password);
      console.log('✅ [LOGIN] Login successful');
      toast.success('Logged in successfully!');
      
      // Store invitation context for post-login processing
      if (hasInvitation && invitationToken) {
        sessionStorage.setItem('pending_invitation_token', invitationToken);
        console.log('💾 [LOGIN] Stored invitation token for post-login processing');
      }
      
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      console.error('❌ [LOGIN] Login error:', error);
      toast.error(error.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('📝 [SIGNUP] Starting signup process');
    console.log('📝 [SIGNUP] Has invitation:', hasInvitation);
    
    try {
      // Store invitation context before signup for post-signup processing
      if (hasInvitation && invitationToken) {
        sessionStorage.setItem('pending_invitation_token', invitationToken);
        console.log('💾 [SIGNUP] Stored invitation token for post-signup processing');
      }
      
      const signupResult = await signUp(
        signupForm.email, 
        signupForm.password, 
        signupForm.firstName, 
        signupForm.lastName
      );
      
      console.log('✅ [SIGNUP] Signup successful:', signupResult);
      
      // Since email verification is disabled, signup should return a session immediately
      if (signupResult.session) {
        console.log('✅ [SIGNUP] User logged in automatically after signup');
        toast.success('Account created and logged in successfully!');
        // Navigation will be handled by the auth state change
      } else {
        // This shouldn't happen with email verification disabled, but handle gracefully
        console.log('⚠️ [SIGNUP] No session returned, user may need to verify email');
        toast.success('Account created successfully! Please sign in to continue.');
        setActiveTab('login');
      }
    } catch (error: any) {
      console.error('❌ [SIGNUP] Signup error:', error);
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

  const getInvitationDescription = () => {
    if (!invitationContext) return null;
    
    const { role, invitation } = invitationContext;
    let entityName = 'an organization';
    
    if (invitation.project_id) entityName = 'a project';
    else if (invitation.brokerage_id) entityName = 'a brokerage';
    else if (invitation.simulation_id) entityName = 'a simulation';
    
    return `You've been invited to join ${entityName} as ${role.replace(/_/g, ' ')}`;
  };

  return (
    <div className="min-h-screen bg-background-cream flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {hasInvitation && (
          <div className="text-center mb-8">
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                🎯 {getInvitationDescription()}
              </p>
              {invitationEmail && (
                <p className="text-xs text-blue-600 mt-1">
                  Invitation for: {invitationEmail}
                </p>
              )}
              <p className="text-xs text-blue-600 mt-2">
                {activeTab === 'signup' 
                  ? 'Create your account below to accept this invitation' 
                  : 'Sign in to accept this invitation and access your new role'
                }
              </p>
            </div>
          </div>
        )}
        
        <Card className="bg-white shadow-none border-none">
          <CardHeader className="space-y-1 px-12 py-8">
            <CardTitle className="text-2xl font-bold text-center">
              {hasInvitation ? 'Join Your Team' : 'Benvenuto'}
            </CardTitle>
            <CardDescription className="text-center">
              {hasInvitation && invitationEmail
                ? `Complete your ${activeTab === 'signup' ? 'registration' : 'sign in'} to accept your invitation`
                : "Accedi al tuo account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-12 pb-12">
            {hasInvitation ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                        disabled={Boolean(hasInvitation && invitationEmail)}
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
                      disabled={isLoading}
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
                        disabled={Boolean(hasInvitation && invitationEmail)}
                      />
                      {hasInvitation && invitationEmail && (
                        <p className="text-xs text-blue-600">
                          This email was pre-filled from your invitation
                        </p>
                      )}
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
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Inserisci la tua email"
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
                    placeholder="Inserisci la tua password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
