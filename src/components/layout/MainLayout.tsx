
import React from 'react';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  userEmail?: string;
  onLogout?: () => void;
}

const MainLayout = ({ children, title, userEmail, onLogout }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background-light">
      <Header title={title} userEmail={userEmail} onLogout={onLogout} />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
