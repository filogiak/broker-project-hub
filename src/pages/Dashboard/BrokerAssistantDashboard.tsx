import React from 'react';
import { BrokerAssistantLayout } from '@/components/broker/BrokerAssistantLayout';
import BrokerAssistantOrganizations from '@/pages/BrokerAssistant/BrokerAssistantOrganizations';

const BrokerAssistantDashboard = () => {
  return (
    <BrokerAssistantLayout title="Organizzazioni">
      <BrokerAssistantOrganizations />
    </BrokerAssistantLayout>
  );
};

export default BrokerAssistantDashboard;
