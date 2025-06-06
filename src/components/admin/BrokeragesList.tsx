
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, User } from 'lucide-react';
import { getAllBrokerages, type BrokerageInfo } from '@/services/adminService';
import { toast } from 'sonner';

interface BrokeragesListProps {
  refreshTrigger: number;
}

const BrokeragesList = ({ refreshTrigger }: BrokeragesListProps) => {
  const [brokerages, setBrokerages] = useState<BrokerageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrokerages = async () => {
      try {
        setIsLoading(true);
        const data = await getAllBrokerages();
        setBrokerages(data);
      } catch (error: any) {
        console.error('Fetch brokerages error:', error);
        toast.error('Failed to load brokerages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrokerages();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Brokerages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading brokerages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          All Brokerages ({brokerages.length})
        </CardTitle>
        <CardDescription>
          Manage all brokerages in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {brokerages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No brokerages found</h3>
            <p className="text-sm">Create brokerage owners first, then assign them brokerages using the form above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {brokerages.map((brokerage) => (
              <div key={brokerage.id} className="border border-form-border rounded-lg p-4 bg-form-beige">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{brokerage.name}</h3>
                    {brokerage.description && (
                      <p className="text-sm text-muted-foreground mt-1">{brokerage.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Owner:</span>
                      <span>{brokerage.owner_first_name} {brokerage.owner_last_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Email:</span>
                      <span className="text-muted-foreground">{brokerage.owner_email}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(brokerage.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrokeragesList;
