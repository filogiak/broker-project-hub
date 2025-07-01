
import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { login, signUp } from '@/services/authService';
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

  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const hasInvitation = searchParams.has('invitation') || searchParams.has('accept_invitation');
  const invitationEmail = searchParams.get('email');

  // Set up initial form state and tab based on invitation context
  useEffect(() => {
    if (hasInvitation && invitationEmail) {
      // Pre-fill email in both forms
      setLoginForm(prev => ({ ...prev, email: invitationEmail }));
      setSignupForm(prev => ({ ...prev, email: invitationEmail }));
      // Default to signup tab for new users coming from invitation
      setActiveTab('signup');
    }
  }, [hasInvitation, invitationEmail]);

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
      await signUp(
        signupForm.email, 
        signupForm.password, 
        signupForm.firstName, 
        signupForm.lastName
      );
      console.log('✅ [SIGNUP] Signup successful');
      toast.success('Account created successfully! Please check your email to verify your account.');
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

  return (
    <div className="min-h-screen bg-background-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Broker Project Hub</h1>
          <p className="text-muted-foreground">AI-powered mortgage intermediation platform</p>
          {hasInvitation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                🎯 You've been invited to join a project
              </p>
              {invitationEmail && (
                <p className="text-xs text-blue-600 mt-1">
                  Invitation for: {invitationEmail}
                </p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                {activeTab === 'signup' ? 'Create your account below to get started' : 'Sign in to view your invitations'}
              </p>
            </div>
          )}
        </div>
        
        <Card className="card-primary">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {hasInvitation ? 'Join Your Team' : 'Welcome'}
            </CardTitle>
            <CardDescription className="text-center">
              {hasInvitation && invitationEmail
                ? `Complete your ${activeTab === 'signup' ? 'registration' : 'sign in'} to access your project invitation`
                : "Sign in to your account or create a new one"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
