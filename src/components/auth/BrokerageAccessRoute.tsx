import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleSelection } from '@/contexts/RoleSelectionContext';
import { accessDiscoveryService } from '@/services/accessDiscoveryService';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

interface BrokerageAccessRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const BrokerageAccessRoute: React.FC<BrokerageAccessRouteProps> = ({ 
  children, 
  fallbackPath = '/dashboard' 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { selectedRole } = useRoleSelection();
  const { brokerageId } = useParams();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !brokerageId || authLoading) return;
      
      try {
        setLoading(true);
        console.log('🔍 [BrokerageAccessRoute] Checking access for brokerage:', brokerageId);
        console.log('🔍 [BrokerageAccessRoute] Current selected role:', selectedRole);
        
        // Block access immediately if current selected role is real_estate_agent
        if (selectedRole === 'real_estate_agent') {
          console.log('🚫 [BrokerageAccessRoute] Access denied: current role is real_estate_agent');
          setHasAccess(false);
          return;
        }
        
        // Check if user has brokerage access
        const canAccess = await accessDiscoveryService.canAccessBrokerage(brokerageId);
        console.log('🔍 [BrokerageAccessRoute] Basic access check result:', canAccess);
        
        setHasAccess(canAccess);
      } catch (error) {
        console.error('❌ [BrokerageAccessRoute] Error checking brokerage access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, brokerageId, authLoading, selectedRole]);

  if (authLoading || loading) {
    return <LoadingOverlay message="Checking access..." />;
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
  return <LoadingOverlay message="Loading..." />;
};

export default BrokerageAccessRoute;
