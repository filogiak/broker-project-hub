
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllBrokerages } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

interface BrokerageWithOwner {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  owner_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

const BrokeragesList = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [brokerages, setBrokerages] = useState<BrokerageWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBrokerages();
  }, [refreshTrigger]);

  const loadBrokerages = async () => {
    try {
      setLoading(true);
      const data = await getAllBrokerages();
      setBrokerages(data);
    } catch (error) {
      console.error('Load brokerages error:', error);
      toast({
        title: "Error",
        description: "Failed to load brokerages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOwnerName = (brokerage: BrokerageWithOwner) => {
    if (!brokerage.profiles) return 'Unknown';
    const fullName = [brokerage.profiles.first_name, brokerage.profiles.last_name]
      .filter(Boolean)
      .join(' ');
    return fullName || brokerage.profiles.email;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brokerages</CardTitle>
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
        <CardTitle>Brokerages ({brokerages.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {brokerages.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No brokerages found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Owner Email</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brokerages.map((brokerage) => (
                  <TableRow key={brokerage.id}>
                    <TableCell className="font-medium">{brokerage.name}</TableCell>
                    <TableCell>{brokerage.description || 'N/A'}</TableCell>
                    <TableCell>{getOwnerName(brokerage)}</TableCell>
                    <TableCell>{brokerage.profiles?.email || 'N/A'}</TableCell>
                    <TableCell>{formatDate(brokerage.created_at)}</TableCell>
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

export default BrokeragesList;
