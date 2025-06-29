
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const BrokerageUsers = () => {
  return (
    <div className="flex-1 p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-dm-sans">User Management</h1>
          <p className="text-muted-foreground mt-1 font-dm-sans">
            Manage team members, roles, and permissions
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="card-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Team member and permission management tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 font-dm-sans">Coming Soon</h3>
            <p className="text-muted-foreground font-dm-sans">
              User management features are currently in development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerageUsers;
