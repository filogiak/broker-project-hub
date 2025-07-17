
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
        console.log('🔍 [BrokerageAccessRoute] Checking access for brokerage:', brokerageId);
        
        // Check if user has brokerage access
        const canAccess = await accessDiscoveryService.canAccessBrokerage(brokerageId);
        console.log('🔍 [BrokerageAccessRoute] Basic access check result:', canAccess);
        
        // If user has basic access, check if they're a real estate agent only
        if (canAccess && user.roles) {
          // Block access for users who only have real_estate_agent role
          const isOnlyRealEstateAgent = user.roles.length === 1 && user.roles[0] === 'real_estate_agent';
          
          if (isOnlyRealEstateAgent) {
            console.log('🚫 [BrokerageAccessRoute] Access denied: user is only a real estate agent');
            setHasAccess(false);
          } else {
            console.log('✅ [BrokerageAccessRoute] Access granted: user has authorized roles');
            setHasAccess(true);
          }
        } else {
          setHasAccess(canAccess);
        }
      } catch (error) {
        console.error('❌ [BrokerageAccessRoute] Error checking brokerage access:', error);
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
    console.log('🚫 [BrokerageAccessRoute] Access denied, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  if (hasAccess === true) {
    console.log('✅ [BrokerageAccessRoute] Access granted, rendering children');
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
