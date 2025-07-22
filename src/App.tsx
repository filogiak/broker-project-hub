
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/hooks/useAuth';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';
import AppRouter from './routes/AppRouter';
import './index.css';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthErrorBoundary>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <AppRouter />
            </div>
            <Toaster />
            <SonnerToaster />
          </TooltipProvider>
        </AuthErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
