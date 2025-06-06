
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllBrokerageOwners, type BrokerageOwnerInfo } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

const BrokerageOwnersList = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [brokerageOwners, setBrokerageOwners] = useState<BrokerageOwnerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBrokerageOwners();
  }, [refreshTrigger]);

  const loadBrokerageOwners = async () => {
    try {
      setLoading(true);
      const owners = await getAllBrokerageOwners();
      setBrokerageOwners(owners);
    } catch (error) {
      console.error('Load brokerage owners error:', error);
      toast({
        title: "Error",
        description: "Failed to load brokerage owners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
