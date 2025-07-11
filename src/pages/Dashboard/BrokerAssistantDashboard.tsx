import React from 'react';
import { BrokerAssistantLayout } from '@/components/broker/BrokerAssistantLayout';
import BrokerAssistantOrganizations from '@/pages/BrokerAssistant/BrokerAssistantOrganizations';

const BrokerAssistantDashboard = () => {
  return (
    <BrokerAssistantLayout>
      <BrokerAssistantOrganizations />
    </BrokerAssistantLayout>
  );
};

export default BrokerAssistantDashboard;
