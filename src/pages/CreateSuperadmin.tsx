
import React from 'react';
import CreateSuperadminForm from '@/components/admin/CreateSuperadminForm';

const CreateSuperadmin = () => {
  return (
    <div className="min-h-screen bg-background-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Setup Superadmin</h1>
          <p className="text-muted-foreground">Create the initial superadmin account</p>
        </div>
        <CreateSuperadminForm />
      </div>
    </div>
  );
};

export default CreateSuperadmin;
