import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { accessDiscoveryService } from '@/services/accessDiscoveryService';

interface BrokerageAccessRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const BrokerageAccessRoute: React.FC<BrokerageAccessRouteProps> = ({ 
  children, 
  fallbackPath = '/dashboard' 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { brokerageId } = useParams();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !brokerageId || authLoading) return;
      
      try {
        setLoading(true);
        const canAccess = await accessDiscoveryService.canAccessBrokerage(brokerageId);
        setHasAccess(canAccess);
      } catch (error) {
        console.error('Error checking brokerage access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, brokerageId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Checking access...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!brokerageId) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (hasAccess === false) {
    console.log('BrokerageAccessRoute - Access denied, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  if (hasAccess === true) {
    return <>{children}</>;
  }

  // Still loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
};

export default BrokerageAccessRoute;