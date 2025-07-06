import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FlaskConical, FileText, ChevronRight } from 'lucide-react';
import { accessDiscoveryService, type AccessibleBrokerage } from '@/services/accessDiscoveryService';
import { useAuth } from '@/hooks/useAuth';

const AccessibleBrokerages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brokerages, setBrokerages] = useState<AccessibleBrokerage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccessibleBrokerages = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const accessibleBrokerages = await accessDiscoveryService.getAccessibleBrokerages();
        setBrokerages(accessibleBrokerages);
      } catch (error) {
        console.error('Error loading accessible brokerages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccessibleBrokerages();
  }, [user]);

  const getAccessTypeBadge = (accessType: AccessibleBrokerage['access_type']) => {
    switch (accessType) {
      case 'owner':
        return <Badge className="bg-form-green text-white">Proprietario</Badge>;
      case 'project_member':
        return <Badge variant="secondary">Membro Progetto</Badge>;
      case 'simulation_member':
        return <Badge variant="outline">Collaboratore Simulazione</Badge>;
      default:
        return null;
    }
  };

  const handleNavigateToBrokerage = (brokerageId: string) => {
    navigate(`/brokerage/${brokerageId}`);
  };

  if (loading) {
    return (
      <Card className="bg-white border border-form-border rounded-[12px]">
        <CardHeader>
          <CardTitle className="font-dm-sans text-xl text-black flex items-center gap-2">
            <Building2 className="h-5 w-5 text-form-green" />
            Le Tue Agenzie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-4 bg-form-placeholder rounded w-32 mb-2"></div>
                <div className="h-3 bg-form-placeholder rounded w-48"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (brokerages.length === 0) {
    return (
      <Card className="bg-white border border-form-border rounded-[12px]">
        <CardHeader>
          <CardTitle className="font-dm-sans text-xl text-black flex items-center gap-2">
            <Building2 className="h-5 w-5 text-form-green" />
            Le Tue Agenzie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nessuna agenzia accessibile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-form-border rounded-[12px]">
      <CardHeader>
        <CardTitle className="font-dm-sans text-xl text-black flex items-center gap-2">
          <Building2 className="h-5 w-5 text-form-green" />
          Le Tue Agenzie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {brokerages.map((brokerage) => (
            <div
              key={brokerage.id}
              className="p-4 border border-form-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-lg text-black">{brokerage.name}</h3>
                    {getAccessTypeBadge(brokerage.access_type)}
                  </div>
                  
                  {brokerage.description && (
                    <p className="text-gray-600 text-sm mb-3">{brokerage.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {brokerage.project_count !== undefined && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{brokerage.project_count} progetti</span>
                      </div>
                    )}
                    {brokerage.simulation_count !== undefined && (
                      <div className="flex items-center gap-1">
                        <FlaskConical className="h-4 w-4" />
                        <span>{brokerage.simulation_count} simulazioni</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => handleNavigateToBrokerage(brokerage.id)}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  Apri
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessibleBrokerages;