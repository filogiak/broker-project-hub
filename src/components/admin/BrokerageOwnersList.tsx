
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getAllBrokerageOwners, type BrokerageOwnerInfo } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import BrokerageOwnerActionMenu from './BrokerageOwnerActionMenu';

const BrokerageOwnersList = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [brokerageOwners, setBrokerageOwners] = useState<BrokerageOwnerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBrokerageOwners();
  }, [refreshTrigger]);

  const loadBrokerageOwners = async () => {
    try {
      setLoading(true);
      setDebugInfo(null);
      const owners = await getAllBrokerageOwners();
      setBrokerageOwners(owners);
      
      // Add debug info if no owners found
      if (owners.length === 0) {
        setDebugInfo("No brokerage owners found. This could mean: 1) No users have the 'brokerage_owner' role, 2) Users with the role don't have profiles created, or 3) There's a data synchronization issue.");
      }
    } catch (error) {
      console.error('Load brokerage owners error:', error);
      setDebugInfo(`Error loading brokerage owners: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Error",
        description: "Failed to load brokerage owners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditOwner = (owner: BrokerageOwnerInfo) => {
    console.log('Edit owner:', owner);
    toast({
      title: "Feature Coming Soon",
      description: "Edit functionality will be implemented soon",
    });
  };

  const handleDeleteOwner = (owner: BrokerageOwnerInfo) => {
    console.log('Delete owner:', owner);
    toast({
      title: "Feature Coming Soon",
      description: "Delete functionality will be implemented soon",
    });
  };

  const getFullName = (owner: BrokerageOwnerInfo) => {
    const fullName = [owner.first_name, owner.last_name].filter(Boolean).join(' ');
    return fullName || 'N/A';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brokerage Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brokerage Owners ({brokerageOwners.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {debugInfo && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{debugInfo}</AlertDescription>
          </Alert>
        )}
        
        {brokerageOwners.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No brokerage owners found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Brokerage Status</TableHead>
                  <TableHead>Assigned Brokerage</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brokerageOwners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell>{getFullName(owner)}</TableCell>
                    <TableCell>{owner.email}</TableCell>
                    <TableCell>{owner.phone || 'N/A'}</TableCell>
                    <TableCell>
                      {owner.owns_brokerage ? (
                        <Badge variant="default">Owns Brokerage</Badge>
                      ) : (
                        <Badge variant="secondary">No Brokerage</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {owner.brokerage_name || 'None'}
                    </TableCell>
                    <TableCell>
                      <BrokerageOwnerActionMenu
                        owner={owner}
                        onEdit={handleEditOwner}
                        onDelete={handleDeleteOwner}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrokerageOwnersList;
